import { Router } from 'express';
import { getDb } from '../db/connection.ts';

export const patientsRouter = Router();

// GET /api/patients - Alle Patienten abrufen (MFA)
patientsRouter.get('/patients', (_req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare(
      'SELECT id, insurance_number, first_name, last_name, date_of_birth, phone, email, no_show_count, insurance_type, created_by_mfa_id, mfa_comment FROM patients ORDER BY last_name, first_name'
    ).all();
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// POST /api/patients - Neuen Patienten anlegen (MFA)
patientsRouter.post('/patients', (req, res) => {
  try {
    const db = getDb();
    const { insuranceNumber, firstName, lastName, dateOfBirth, phone, email, emailOptIn, insuranceType, createdByMfaId, mfaComment } = req.body;
    if (!insuranceNumber || !firstName || !lastName || !dateOfBirth || !phone) {
      res.status(400).json({ success: false, error: 'insuranceNumber, firstName, lastName, dateOfBirth und phone erforderlich' });
      return;
    }
    const existing = db.prepare('SELECT id FROM patients WHERE insurance_number = ?').get(insuranceNumber);
    if (existing) {
      res.status(409).json({ success: false, error: 'Ein Patient mit dieser Versichertennummer existiert bereits' });
      return;
    }
    const result = db.prepare(
      'INSERT INTO patients (insurance_number, first_name, last_name, date_of_birth, phone, email, email_opt_in, insurance_type, created_by_mfa_id, mfa_comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(insuranceNumber, firstName, lastName, dateOfBirth, phone, email || null, emailOptIn ? 1 : 0, insuranceType || 'public', createdByMfaId || null, mfaComment || null);
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// PATCH /api/patients/:id/comment - MFA-Kommentar aktualisieren
patientsRouter.patch('/patients/:id/comment', (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    const { mfaComment } = req.body;
    db.prepare("UPDATE patients SET mfa_comment = ?, updated_at = datetime('now') WHERE id = ?").run(mfaComment || null, id);
    res.json({ success: true, data: { id } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// POST /api/patients/lookup - Patient anhand Versichertennummer suchen
patientsRouter.post('/patients/lookup', (req, res) => {
  try {
    const db = getDb();
    const { insuranceNumber, dateOfBirth } = req.body;
    if (!insuranceNumber) {
      res.status(400).json({ success: false, error: 'Versichertennummer ist erforderlich' });
      return;
    }
    let patient;
    if (dateOfBirth) {
      patient = db.prepare('SELECT id, insurance_number, first_name, last_name, date_of_birth, insurance_type, created_by_mfa_id, mfa_comment FROM patients WHERE insurance_number = ? AND date_of_birth = ?').get(insuranceNumber, dateOfBirth);
    } else {
      patient = db.prepare('SELECT id, insurance_number, first_name, last_name, date_of_birth, insurance_type, created_by_mfa_id, mfa_comment FROM patients WHERE insurance_number = ?').get(insuranceNumber);
    }
    if (!patient) {
      res.status(404).json({ success: false, error: 'Patient nicht gefunden' });
      return;
    }
    res.json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// GET /api/patients/:id/diagnoses - Diagnosen eines Patienten abrufen (MFA, lesend)
patientsRouter.get('/patients/:id/diagnoses', (req, res) => {
  try {
    const db = getDb();
    const patientId = Number(req.params.id);
    const rows = db.prepare(
      "SELECT d.id, d.icd_code, d.diagnosis_text, d.diagnosis_date, d.notes, doc.first_name AS doctor_first_name, doc.last_name AS doctor_last_name FROM diagnoses d JOIN doctors doc ON doc.id = d.doctor_id WHERE d.patient_id = ? ORDER BY d.diagnosis_date DESC"
    ).all(patientId);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});
