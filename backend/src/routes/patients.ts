import { Router } from 'express';
import { getDb } from '../db/connection.ts';

export const patientsRouter = Router();

// GET /api/patients - Alle Patienten abrufen (MFA)
patientsRouter.get('/patients', (_req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare(
      'SELECT id, insurance_number, first_name, last_name, date_of_birth, phone, email, no_show_count FROM patients ORDER BY last_name, first_name'
    ).all();
    res.json({ success: true, data: rows });
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

    let patient: any;
    if (dateOfBirth) {
      patient = db.prepare(
        'SELECT id, insurance_number, first_name, last_name, date_of_birth FROM patients WHERE insurance_number = ? AND date_of_birth = ?'
      ).get(insuranceNumber, dateOfBirth);
    } else {
      patient = db.prepare(
        'SELECT id, insurance_number, first_name, last_name, date_of_birth FROM patients WHERE insurance_number = ?'
      ).get(insuranceNumber);
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
