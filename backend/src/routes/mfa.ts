import { Router } from 'express';
import { getDb } from '../db/connection.ts';

export const mfaRouter = Router();

// GET /api/mfa/dashboard - Aggregierte Dashboard-Daten für MFA
mfaRouter.get('/mfa/dashboard', (_req, res) => {
  try {
    const db = getDb();
    const today = new Date().toISOString().slice(0, 10);

    const todaysAppointments = db.prepare(
      "SELECT a.id, a.patient_id, a.doctor_id, a.category, a.date, a.time, a.status, a.booking_type, a.mfa_note, p.insurance_number, p.first_name AS patient_first_name, p.last_name AS patient_last_name, p.date_of_birth, p.phone, p.no_show_count, d.first_name AS doctor_first_name, d.last_name AS doctor_last_name, d.color AS doctor_color FROM appointments a JOIN patients p ON p.id = a.patient_id JOIN doctors d ON d.id = a.doctor_id WHERE a.date = ? AND a.status != 'CANCELLED' ORDER BY a.time"
    ).all(today);

    const pendingPrescriptions = db.prepare(
      "SELECT p.id, p.patient_id, p.medication_name, p.dosage, p.notes, p.status, p.request_date, p.approved_date, pat.first_name AS patient_first_name, pat.last_name AS patient_last_name, pat.insurance_number, pat.phone, d.first_name AS doctor_first_name, d.last_name AS doctor_last_name FROM prescriptions p JOIN patients pat ON pat.id = p.patient_id JOIN doctors d ON d.id = p.responsible_doctor_id WHERE p.status IN ('PENDING', 'IN_PROGRESS', 'APPROVED') ORDER BY p.request_date DESC"
    ).all();

    const doctors = db.prepare('SELECT id, first_name, last_name, color, acute_slots_per_day FROM doctors ORDER BY last_name, first_name').all() as any[];
    const bookedRows = db.prepare(
      "SELECT doctor_id, COUNT(*) as count FROM appointments WHERE date = ? AND category = 'ACUTE' AND status != 'CANCELLED' GROUP BY doctor_id"
    ).all(today) as any[];
    const bookedMap: Record<number, number> = {};
    for (const row of bookedRows) {
      bookedMap[row.doctor_id] = row.count;
    }
    const acuteSlotInfo = doctors.map((doc: any) => {
      const total = doc.acute_slots_per_day;
      const used = bookedMap[doc.id] || 0;
      return {
        doctorId: doc.id,
        doctorName: doc.first_name + ' ' + doc.last_name,
        doctorColor: doc.color,
        totalSlots: total,
        usedSlots: used,
        remainingSlots: Math.max(0, total - used),
      };
    });

    res.json({
      success: true,
      data: { date: today, todaysAppointments, pendingPrescriptions, acuteSlotInfo },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// GET /api/mfa/appointments - Alle Termine (MFA)
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

// GET /api/mfa/vaccinations - Alle Impftermine (MFA)
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
