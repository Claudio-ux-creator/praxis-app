import { Router } from 'express';
import { getDb } from '../db/connection.ts';
import { isDoctorAbsent } from '../services/absenceCheck.ts';

export const prescriptionsRouter = Router();

const BTM_KEYWORDS = [
  'fentanyl', 'morphin', 'oxycodon', 'tilidin', 'pethidin', 'methadon', 'buprenorphin',
  'amphetamine', 'methylphenidat', 'modafinil',
  'benzodiazepin', 'diazepam', 'lorazepam', 'alprazolam',
  'zolpidem', 'zopiclon', 'phenobarbital', 'pentobarbital', 'ketamin', 'ghb',
];

function isBTMMedication(name: string): boolean {
  const lower = name.toLowerCase();
  return BTM_KEYWORDS.some(function (kw) { return lower.includes(kw); });
}

function checkConsultation(db: any, patientId: number): string | null {
  const pat = db.prepare('SELECT last_consultation FROM patients WHERE id = ?').get(patientId) as { last_consultation: string | null } | undefined;
  if (!pat?.last_consultation) {
    return 'Patient hatte noch keine Konsultation. Rezept nur nach Untersuchung m\u00f6glich.';
  }
  const lastConsult = new Date(pat.last_consultation);
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  if (lastConsult < oneYearAgo) {
    return 'Letzte Konsultation des Patienten ist l\u00e4nger als 1 Jahr her \u2013 neues Rezept nur nach Untersuchung m\u00f6glich.';
  }
  return null;
}

// GET /api/prescriptions?insuranceNumber= - Rezepte eines Patienten
prescriptionsRouter.get('/prescriptions', (req, res) => {
  try {
    const db = getDb();
    const insuranceNumber = req.query.insuranceNumber as string;

    if (!insuranceNumber) {
      res.status(400).json({ success: false, error: 'insuranceNumber erforderlich' });
      return;
    }

    const patient = db.prepare('SELECT id FROM patients WHERE insurance_number = ?').get(insuranceNumber) as { id: number } | undefined;
    if (!patient) {
      res.status(404).json({ success: false, error: 'Patient nicht gefunden' });
      return;
    }

    const rows = db.prepare(
      "SELECT p.id, p.medication_name, p.dosage, p.notes, p.status, p.request_date, p.approved_date, d.first_name AS doctor_first_name, d.last_name AS doctor_last_name FROM prescriptions p JOIN doctors d ON d.id = p.responsible_doctor_id WHERE p.patient_id = ? ORDER BY p.request_date DESC"
    ).all(patient.id);

    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// GET /api/prescriptions/all - Alle Rezepte (MFA)
prescriptionsRouter.get('/prescriptions/all', (_req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare(
      "SELECT p.id, p.medication_name, p.dosage, p.notes, p.status, p.request_date, p.approved_date, p.initiated_by_mfa_id, pat.first_name AS patient_first_name, pat.last_name AS patient_last_name, pat.insurance_number, pat.phone, d.first_name AS doctor_first_name, d.last_name AS doctor_last_name FROM prescriptions p JOIN patients pat ON pat.id = p.patient_id JOIN doctors d ON d.id = p.responsible_doctor_id ORDER BY p.request_date DESC"
    ).all();
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// POST /api/prescriptions/request - Patient reicht Medikamentenanfrage ein
prescriptionsRouter.post('/prescriptions/request', (req, res) => {
  try {
    const db = getDb();
    const { insuranceNumber, medicationName, dosage, notes, doctorId } = req.body;

    if (!insuranceNumber || !medicationName) {
      res.status(400).json({ success: false, error: 'insuranceNumber und medicationName erforderlich' });
      return;
    }

    const patient = db.prepare('SELECT id FROM patients WHERE insurance_number = ?').get(insuranceNumber) as { id: number } | undefined;
    if (!patient) {
      res.status(404).json({ success: false, error: 'Patient nicht gefunden' });
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const responsibleDoctorId = doctorId || 1;

    // Prüfen ob der verantwortliche Arzt heute abwesend ist
    if (isDoctorAbsent(db, responsibleDoctorId, today)) {
      res.status(409).json({ success: false, error: 'Der ausgewählte Arzt ist derzeit abwesend.' });
      return;
    }

    // BTM-Prüfung
    if (isBTMMedication(medicationName)) {
      res.status(409).json({ success: false, error: '\u201e' + medicationName + '\u201c ist ein Betäubungsmittel oder Psychopharmakon und kann nicht als Wiederholungsrezept ohne ärztliches Gespräch angelegt werden.' });
      return;
    }

    const result = db.prepare(
      "INSERT INTO prescriptions (patient_id, medication_name, dosage, notes, initiated_by_mfa_id, responsible_doctor_id, status, request_date) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?)"
    ).run(patient.id, medicationName, dosage || null, notes || null, 0, responsibleDoctorId, today);

    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// POST /api/prescriptions - Neues Rezept anlegen (MFA)
prescriptionsRouter.post('/prescriptions', (req, res) => {
  try {
    const db = getDb();
    const { insuranceNumber, medicationName, dosage, notes, initiatedByMfaId, responsibleDoctorId } = req.body;

    if (!insuranceNumber || !medicationName) {
      res.status(400).json({ success: false, error: 'insuranceNumber und medicationName erforderlich' });
      return;
    }

    const patient = db.prepare('SELECT id FROM patients WHERE insurance_number = ?').get(insuranceNumber) as { id: number } | undefined;
    if (!patient) {
      res.status(404).json({ success: false, error: 'Patient nicht gefunden' });
      return;
    }

    // BTM-Prüfung
    if (isBTMMedication(medicationName)) {
      res.status(409).json({ success: false, error: '\u201e' + medicationName + '\u201c ist ein Bet\u00e4ubungsmittel oder Psychopharmakon und kann nicht als Wiederholungsrezept ohne \u00e4rztliches Gespr\u00e4ch angelegt werden.' });
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    // Prüfen ob der verantwortliche Arzt zum Anforderungsdatum abwesend ist
    if (isDoctorAbsent(db, responsibleDoctorId || 1, today)) {
      res.status(409).json({ success: false, error: 'Der verantwortliche Arzt ist derzeit abwesend und kann keine Rezepte bearbeiten.' });
      return;
    }

    const result = db.prepare(
      "INSERT INTO prescriptions (patient_id, medication_name, dosage, notes, initiated_by_mfa_id, responsible_doctor_id, status, request_date) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?)"
    ).run(patient.id, medicationName, dosage || null, notes || null, initiatedByMfaId || 1, responsibleDoctorId || 1, today);

    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// PATCH /api/prescriptions/:id/status - Rezept-Status ändern (MFA)
prescriptionsRouter.patch('/prescriptions/:id/status', (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ success: false, error: 'status erforderlich' });
      return;
    }

    // MFA darf nur IN_PROGRESS (weiterleiten an Arzt) oder COLLECTED setzen
    if (status === 'APPROVED' || status === 'REJECTED') {
      res.status(403).json({ success: false, error: 'Nur ein Arzt kann Rezepte freigeben oder ablehnen.' });
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    if (status === 'COLLECTED') {
      db.prepare("UPDATE prescriptions SET status = ?, approved_date = ?, updated_at = datetime('now') WHERE id = ?")
        .run(status, today, id);
    } else {
      db.prepare("UPDATE prescriptions SET status = ?, updated_at = datetime('now') WHERE id = ?")
        .run(status, id);
    }

    res.json({ success: true, data: { id, status } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});


