import { Router } from 'express';
import { getDb } from '../db/connection.ts';

export const mfaRouter = Router();

const PRESCRIPTION_ONLY_KEYWORDS = [
  'amoxicillin', 'penicillin', 'antibiotikum', 'antibiotika', 'ciprofloxacin', 'doxycyclin', 'erythromycin',
  'ramipril', 'enalapril', 'lisinopril', 'metoprolol', 'bisoprolol', 'amlodipin', 'simvastatin', 'atorvastatin',
  'metformin', 'insulin', 'glibenclamid', 'sitagliptin',
  'omeprazol', 'pantoprazol', 'levothyroxin', 'l-thyroxin',
  'diclofenac', 'naproxen',
  'cortison', 'prednisolon', 'dexamethason',
  'furosemid', 'torasemid', 'hydrochlorothiazid', 'hct',
  'antidepressivum', 'antidepressiva', 'fluoxetin', 'citalopram', 'sertralin', 'venlafaxin',
  'neuroleptika', 'risperidon', 'olanzapin', 'quetiapin',
  'theophyllin', 'salbutamol', 'formoterol', 'budesonid',
  'warfarin', 'phenprocoumon', 'apixaban', 'rivaroxaban', 'edoxaban',
  'allopurinol', 'colchicin', 'methotrexat', 'leftunomid',
  'tramadol', 'codein', 'dihydrocodein',
  'testosteron', 'ostrogen', 'progesteron',
];

function isPrescriptionOnly(name: string): boolean {
  const lower = name.toLowerCase();
  if (lower.includes('paracetamol')) {
    const match = lower.match(/(\d+)\s*mg/);
    if (match && parseInt(match[1]) <= 500) return false;
  }
  if (lower.includes('ibuprofen')) {
    const match = lower.match(/(\d+)\s*mg/);
    if (match && parseInt(match[1]) <= 400) return false;
  }
  if (lower.includes('ass') || lower.includes('acetylsalicyl')) {
    const match = lower.match(/(\d+)\s*mg/);
    if (match && parseInt(match[1]) <= 100) return false;
  }
  return PRESCRIPTION_ONLY_KEYWORDS.some(function (kw) { return lower.includes(kw); });
}

function checkConsultation(db: any, patientId: number): { passed: boolean; message: string } {
  const pat = db.prepare('SELECT last_consultation FROM patients WHERE id = ?').get(patientId) as { last_consultation: string | null } | undefined;
  if (!pat?.last_consultation) {
    return { passed: false, message: 'Patient hatte noch keine Konsultation. Rezept kann nicht freigegeben werden.' };
  }
  const lastConsult = new Date(pat.last_consultation);
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  if (lastConsult < oneYearAgo) {
    return { passed: false, message: 'Letzte Konsultation des Patienten ist länger als 1 Jahr her - Freigabe erfolgt erst nach erneuter Untersuchung.' };
  }
  return { passed: true, message: '' };
}

mfaRouter.get('/mfa/dashboard', (_req, res) => {
  try {
    const db = getDb();
    const today = new Date().toISOString().slice(0, 10);
    const todaysAppointments = db.prepare(
      "SELECT a.id, a.patient_id, a.doctor_id, a.category, a.date, a.time, a.status, a.booking_type, a.mfa_note, p.insurance_number, p.first_name AS patient_first_name, p.last_name AS patient_last_name, p.date_of_birth, p.phone, p.no_show_count, d.first_name AS doctor_first_name, d.last_name AS doctor_last_name, d.color AS doctor_color FROM appointments a JOIN patients p ON p.id = a.patient_id JOIN doctors d ON d.id = a.doctor_id WHERE a.date = ? AND a.status != 'CANCELLED' ORDER BY a.time"
    ).all(today);
    const pendingPrescriptions = db.prepare(
      "SELECT p.id, p.patient_id, p.medication_name, p.dosage, p.notes, p.status, p.request_date, p.approved_date, p.initiated_by_mfa_id, pat.first_name AS patient_first_name, pat.last_name AS patient_last_name, pat.insurance_number, pat.phone, d.first_name AS doctor_first_name, d.last_name AS doctor_last_name FROM prescriptions p JOIN patients pat ON pat.id = p.patient_id JOIN doctors d ON d.id = p.responsible_doctor_id WHERE p.status IN ('PENDING') ORDER BY p.request_date DESC"
    ).all();
    const doctors = db.prepare('SELECT id, first_name, last_name, color, acute_slots_per_day FROM doctors ORDER BY last_name, first_name').all() as any[];
    const bookedRows = db.prepare(
      "SELECT doctor_id, COUNT(*) as count FROM appointments WHERE date = ? AND category = 'ACUTE' AND status != 'CANCELLED' GROUP BY doctor_id"
    ).all(today) as any[];
    const bookedMap: Record<number, number> = {};
    for (const row of bookedRows) bookedMap[row.doctor_id] = row.count;
    const acuteSlotInfo = doctors.map((doc: any) => ({
      doctorId: doc.id,
      doctorName: doc.first_name + ' ' + doc.last_name,
      doctorColor: doc.color,
      totalSlots: doc.acute_slots_per_day,
      usedSlots: bookedMap[doc.id] || 0,
      remainingSlots: Math.max(0, doc.acute_slots_per_day - (bookedMap[doc.id] || 0)),
    }));
    res.json({ success: true, data: { date: today, todaysAppointments, pendingPrescriptions, acuteSlotInfo } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

mfaRouter.get('/mfa/appointments', (_req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare(
      "SELECT a.id, a.patient_id, a.doctor_id, a.category, a.date, a.time, a.status, a.booking_type, a.mfa_note, p.first_name AS patient_first_name, p.last_name AS patient_last_name, p.insurance_number, p.phone, d.first_name AS doctor_first_name, d.last_name AS doctor_last_name, d.color AS doctor_color FROM appointments a JOIN patients p ON p.id = a.patient_id JOIN doctors d ON d.id = a.doctor_id ORDER BY a.date DESC, a.time DESC"
    ).all();
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

mfaRouter.get('/mfa/notifications', (req, res) => {
  try {
    const db = getDb();
    const insuranceNumber = req.query.insuranceNumber as string;
    if (!insuranceNumber) { res.status(400).json({ success: false, error: 'insuranceNumber erforderlich' }); return; }
    const patient = db.prepare('SELECT id FROM patients WHERE insurance_number = ?').get(insuranceNumber) as { id: number } | undefined;
    if (!patient) { res.status(404).json({ success: false, error: 'Patient nicht gefunden' }); return; }
    const notifications = db.prepare('SELECT id, type, title, message, related_entity_type, related_entity_id, is_read, created_at FROM patient_notifications WHERE patient_id = ? ORDER BY created_at DESC LIMIT 20').all(patient.id);
    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

mfaRouter.patch('/mfa/notifications/:id/read', (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    db.prepare("UPDATE patient_notifications SET is_read = 1 WHERE id = ?").run(id);
    res.json({ success: true, data: { id } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

mfaRouter.get('/mfa/vaccinations', (_req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare(
      "SELECT a.id, a.date, a.time, a.status, a.series_dose_number, a.series_group_id, p.first_name AS patient_first_name, p.last_name AS patient_last_name, p.insurance_number, d.first_name AS doctor_first_name, d.last_name AS doctor_last_name FROM appointments a JOIN patients p ON p.id = a.patient_id JOIN doctors d ON d.id = a.doctor_id WHERE a.category = 'VACCINATION' ORDER BY a.date DESC, a.time DESC"
    ).all();
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

