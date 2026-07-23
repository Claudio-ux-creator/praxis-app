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

// PATCH /api/patients/:id - Patientendaten aktualisieren (MFA)
patientsRouter.patch('/patients/:id', (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    const { firstName, lastName, dateOfBirth, phone, email, emailOptIn, insuranceType, mfaComment } = req.body;
    db.prepare(
      "UPDATE patients SET first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name), date_of_birth = COALESCE(?, date_of_birth), phone = COALESCE(?, phone), email = COALESCE(?, email), email_opt_in = COALESCE(?, email_opt_in), insurance_type = COALESCE(?, insurance_type), mfa_comment = COALESCE(?, mfa_comment), updated_at = datetime('now') WHERE id = ?"
    ).run(firstName || null, lastName || null, dateOfBirth || null, phone || null, email !== undefined ? email : null, emailOptIn !== undefined ? (emailOptIn ? 1 : 0) : null, insuranceType || null, mfaComment !== undefined ? mfaComment : null, id);
    res.json({ success: true, data: { id } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// DELETE /api/patients/:id - Patienten löschen (MFA)
patientsRouter.delete('/patients/:id', (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);

    // Prüfen ob der Patient verknüpfte Termine hat
    const appointmentCount = db.prepare('SELECT COUNT(*) as count FROM appointments WHERE patient_id = ?').get(id);
    const prescriptionCount = db.prepare('SELECT COUNT(*) as count FROM prescriptions WHERE patient_id = ?').get(id);
    const diagnosisCount = db.prepare('SELECT COUNT(*) as count FROM diagnoses WHERE patient_id = ?').get(id);

    res.json({ success: true, data: {
      appointmentCount: (appointmentCount).count || 0,
      prescriptionCount: (prescriptionCount).count || 0,
      diagnosisCount: (diagnosisCount).count || 0,
    }});
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// DELETE /api/patients/:id/force - Patienten mit allen verknüpften Daten löschen (MFA)
patientsRouter.delete('/patients/:id/force', (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);

    db.exec('BEGIN TRANSACTION');
    try {
      db.prepare('DELETE FROM questionnaire_answers WHERE appointment_id IN (SELECT id FROM appointments WHERE patient_id = ?)').run(id);
      db.prepare('DELETE FROM patient_notifications WHERE patient_id = ?').run(id);
      db.prepare('DELETE FROM reminders WHERE patient_id = ?').run(id);
      db.prepare('DELETE FROM diagnoses WHERE patient_id = ?').run(id);
      db.prepare('DELETE FROM prescriptions WHERE patient_id = ?').run(id);
      db.prepare('DELETE FROM appointments WHERE patient_id = ?').run(id);
      db.prepare('DELETE FROM acute_slots WHERE patient_id = ?').run(id);
      db.prepare('DELETE FROM patients WHERE id = ?').run(id);
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }

    res.json({ success: true, data: { id } });
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

// GET /api/patients/search - Patienten anhand Versichertennummer oder Name suchen (MFA-Autovervollständigung)
patientsRouter.get('/patients/search', (req, res) => {
  try {
    const db = getDb();
    const insuranceNumber = (req.query.insuranceNumber as string || '').trim();
    const lastName = (req.query.lastName as string || '').trim();
    const firstName = (req.query.firstName as string || '').trim();

    let rows;
    if (insuranceNumber) {
      rows = db.prepare(
        'SELECT id, insurance_number, first_name, last_name, date_of_birth FROM patients WHERE insurance_number LIKE ? ORDER BY last_name, first_name LIMIT 20'
      ).all('%' + insuranceNumber + '%');
    } else if (lastName && firstName) {
      rows = db.prepare(
        'SELECT id, insurance_number, first_name, last_name, date_of_birth FROM patients WHERE last_name LIKE ? AND first_name LIKE ? ORDER BY last_name, first_name LIMIT 20'
      ).all('%' + lastName + '%', '%' + firstName + '%');
    } else if (lastName) {
      rows = db.prepare(
        'SELECT id, insurance_number, first_name, last_name, date_of_birth FROM patients WHERE last_name LIKE ? ORDER BY last_name, first_name LIMIT 20'
      ).all('%' + lastName + '%');
    } else {
      res.json({ success: true, data: [] });
      return;
    }
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

// GET /api/patients/check-consultation - Prueft ob Patient in den letzten 12 Monaten beim Arzt war
patientsRouter.get("/patients/check-consultation", (req, res) => {
  try {
    const db = getDb();
    const insuranceNumber = req.query.insuranceNumber;
    if (!insuranceNumber) { res.status(400).json({ success: false, error: "insuranceNumber erforderlich" }); return; }
    const patient = db.prepare("SELECT id, last_consultation FROM patients WHERE insurance_number = ?").get(insuranceNumber);
    if (!patient) { res.status(404).json({ success: false, error: "Patient nicht gefunden" }); return; }
    if (!patient.last_consultation) {
      res.json({ success: true, blocked: true, message: "Sie hatten noch keine Untersuchung in unserer Praxis. Bitte vereinbaren Sie zuerst einen Kontrolltermin." });
      return;
    }
    const lastConsult = new Date(patient.last_consultation);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    if (lastConsult < oneYearAgo) {
      res.json({ success: true, blocked: true, message: "Ihr letzter Arztbesuch ist laenger als ein Jahr her. Bitte vereinbaren Sie zuerst einen Kontrolltermin." });
      return;
    }
    res.json({ success: true, blocked: false });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Datenbankfehler" });
  }
});

// GET /api/notifications?patientId= - Benachrichtigungen eines Patienten abrufen
patientsRouter.get("/notifications", (req, res) => {
  try {
    const db = getDb();
    const patientId = Number(req.query.patientId);
    if (!patientId) { res.status(400).json({ success: false, error: "patientId erforderlich" }); return; }
    const rows = db.prepare("SELECT id, type, title, message, related_entity_type, related_entity_id, created_at FROM patient_notifications WHERE patient_id = ? ORDER BY created_at DESC LIMIT 20").all(patientId);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Datenbankfehler" });
  }
});

// PUT /api/notifications/:id/read - Benachrichtigung als gelesen markieren
patientsRouter.put("/notifications/:id/read", (req, res) => {
  try {
    const db = getDb();
    db.prepare("UPDATE patient_notifications SET read = 1 WHERE id = ?").run(Number(req.params.id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Datenbankfehler" });
  }
});
