import { Router } from 'express';
import { getDb } from '../db/connection.ts';

export const prescriptionsRouter = Router();

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
      "SELECT p.id, p.medication_name, p.dosage, p.notes, p.status, p.request_date, p.approved_date, pat.first_name AS patient_first_name, pat.last_name AS patient_last_name, pat.insurance_number, pat.phone, d.first_name AS doctor_first_name, d.last_name AS doctor_last_name FROM prescriptions p JOIN patients pat ON pat.id = p.patient_id JOIN doctors d ON d.id = p.responsible_doctor_id ORDER BY p.request_date DESC"
    ).all();
    res.json({ success: true, data: rows });
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

    const today = new Date().toISOString().slice(0, 10);
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

    const today = new Date().toISOString().slice(0, 10);

    if (status === 'APPROVED' || status === 'COLLECTED') {
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
