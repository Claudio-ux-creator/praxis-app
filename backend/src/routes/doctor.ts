import { Router } from 'express';
import { getDb } from '../db/connection.ts';
import { isDoctorAbsent } from '../services/absenceCheck.ts';

export const doctorRouter = Router();

// ==================== PRESCRIPTIONS (Freigabe) ====================

// GET /api/doctor/prescriptions - Alle ausstehenden Rezepte (PENDING + IN_PROGRESS)
doctorRouter.get('/doctor/prescriptions', (req, res) => {
  try {
    const db = getDb();
    const doctorId = req.query.doctorId ? Number(req.query.doctorId) : undefined;

    let sql = `SELECT p.id, p.medication_name, p.dosage, p.notes, p.status, p.request_date, p.approved_date,
               pat.first_name AS patient_first_name, pat.last_name AS patient_last_name, pat.insurance_number, pat.date_of_birth, pat.phone, pat.last_consultation,
               d.first_name AS doctor_first_name, d.last_name AS doctor_last_name
               FROM prescriptions p
               JOIN patients pat ON pat.id = p.patient_id
               JOIN doctors d ON d.id = p.responsible_doctor_id`;

    const params: any[] = [];

    // Filter: standardmäßig PENDING + IN_PROGRESS anzeigen
    sql += ' WHERE';

    if (doctorId) {
      sql += ' p.responsible_doctor_id = ? AND';
      params.push(doctorId);
    }

    sql += " p.status IN ('IN_PROGRESS')";

    sql += ' ORDER BY p.request_date DESC';

    const rows = db.prepare(sql).all(...params);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// PATCH /api/doctor/prescriptions/:id/approve - Rezept freigeben/ablehnen + letzte Konsultation-Check
doctorRouter.patch('/doctor/prescriptions/:id/approve', (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    const { status, rejectReason } = req.body;

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      res.status(400).json({ success: false, error: 'status muss APPROVED oder REJECTED sein' });
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const notes = status === 'REJECTED' && rejectReason ? rejectReason : null;

    // Prüfen, ob das Rezept den Status IN_PROGRESS hat
    const currentRx = db.prepare('SELECT status FROM prescriptions WHERE id = ?').get(id) as { status: string } | undefined;
    if (!currentRx) {
      res.status(404).json({ success: false, error: 'Rezept nicht gefunden' });
      return;
    }
    if (currentRx.status !== 'IN_PROGRESS') {
      res.status(409).json({ success: false, error: 'Rezept muss von der MFA geprüft sein (IN_PROGRESS), bevor der Arzt es freigeben oder ablehnen kann.' });
      return;
    }

    // Bei Freigabe prüfen, ob die letzte Konsultation länger als 1 Jahr zurückliegt
    if (status === 'APPROVED') {
      const rx = db.prepare(
        'SELECT pat.last_consultation FROM prescriptions pr JOIN patients pat ON pat.id = pr.patient_id WHERE pr.id = ?'
      ).get(id) as { last_consultation: string | null } | undefined;

      if (rx?.last_consultation) {
        const lastConsult = new Date(rx.last_consultation);
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        if (lastConsult < oneYearAgo) {
          res.status(409).json({ success: false, error: 'Letzte Konsultation des Patienten ist länger als 1 Jahr her – eine Freigabe ist nur nach erneuter Untersuchung möglich.' });
          return;
        }
      } else {
        res.status(409).json({ success: false, error: 'Patient hatte noch keine Konsultation. Eine Rezeptfreigabe ist nur nach Untersuchung möglich.' });
        return;
      }
    }

    // When doctor approves, create a notification for the patient
    if (status === 'APPROVED') {
      const rxInfo = db.prepare(
        'SELECT p.id, p.medication_name, p.patient_id, pat.insurance_number FROM prescriptions p JOIN patients pat ON pat.id = p.patient_id WHERE p.id = ?'
      ).get(id) as { id: number; medication_name: string; patient_id: number; insurance_number: string } | undefined;

      if (rxInfo) {
        db.prepare(
          "INSERT INTO patient_notifications (patient_id, type, title, message, related_entity_type, related_entity_id) VALUES (?, ?, ?, ?, ?, ?)"
        ).run(
          rxInfo.patient_id,
          'PRESCRIPTION_READY',
          'Rezept freigegeben',
          'Ihr Rezept f\u00fcr ' + rxInfo.medication_name + ' wurde von Ihrem Arzt freigegeben und kann abgeholt werden.',
          'prescription',
          id
        );
      }
    }

    db.prepare("UPDATE prescriptions SET status = ?, approved_date = ?, notes = ?, updated_at = datetime('now') WHERE id = ?")
      .run(status, today, notes, id);

    res.json({ success: true, data: { id, status } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// POST /api/doctor/prescriptions - Arzt erstellt Rezept direkt
doctorRouter.post('/doctor/prescriptions', (req, res) => {
  try {
    const db = getDb();
    const { insuranceNumber, medicationName, dosage, notes, doctorId } = req.body;

    if (!insuranceNumber || !medicationName || !doctorId) {
      res.status(400).json({ success: false, error: 'insuranceNumber, medicationName und doctorId erforderlich' });
      return;
    }

    const patient = db.prepare('SELECT id, last_consultation FROM patients WHERE insurance_number = ?').get(insuranceNumber) as { id: number; last_consultation: string | null } | undefined;
    if (!patient) {
      res.status(404).json({ success: false, error: 'Patient nicht gefunden' });
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    // Prüfen ob der Arzt heute abwesend ist
    if (isDoctorAbsent(db, doctorId, today)) {
      res.status(409).json({ success: false, error: 'Sie sind heute als abwesend eingetragen und können keine Rezepte ausstellen.' });
      return;
    }

    // Prüfen ob letzte Konsultation > 1 Jahr her
    if (patient.last_consultation) {
      const lastConsult = new Date(patient.last_consultation);
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      if (lastConsult < oneYearAgo) {
        res.status(409).json({ success: false, error: 'Letzte Konsultation des Patienten ist länger als 1 Jahr her – neues Rezept nur nach Untersuchung möglich.' });
        return;
      }
    } else {
      res.status(409).json({ success: false, error: 'Patient hatte noch keine Konsultation. Rezept nur nach Untersuchung möglich.' });
      return;
    }

    const result = db.prepare(
      "INSERT INTO prescriptions (patient_id, medication_name, dosage, notes, initiated_by_mfa_id, responsible_doctor_id, status, request_date, approved_date) VALUES (?, ?, ?, ?, ?, ?, 'APPROVED', ?, ?)"
    ).run(patient.id, medicationName, dosage || null, notes || null, doctorId, doctorId, today, today);

    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// ==================== ABSENCES (Urlaub/Abwesenheit) ====================

// GET /api/doctor/absences
doctorRouter.get('/doctor/absences', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM absences ORDER BY start_date DESC').all();
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// POST /api/doctor/absences
doctorRouter.post('/doctor/absences', (req, res) => {
  try {
    const db = getDb();
    const { type, doctorIds, startDate, endDate, reason, blocksBooking } = req.body;

    if (!type || !doctorIds || !startDate || !endDate) {
      res.status(400).json({ success: false, error: 'type, doctorIds, startDate und endDate erforderlich' });
      return;
    }

    const result = db.prepare(
      "INSERT INTO absences (type, doctor_ids, start_date, end_date, reason, blocks_booking) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(type, doctorIds.join(','), startDate, endDate, reason || null, blocksBooking !== false ? 1 : 0);

    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// DELETE /api/doctor/absences/:id
doctorRouter.delete('/doctor/absences/:id', (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    db.prepare('DELETE FROM absences WHERE id = ?').run(id);
    res.json({ success: true, data: { id } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// ==================== MEDICATIONS (Medikamentenliste) ====================

// GET /api/doctor/medications
doctorRouter.get('/doctor/medications', (_req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM medications ORDER BY name ASC').all();
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// POST /api/doctor/medications
doctorRouter.post('/doctor/medications', (req, res) => {
  try {
    const db = getDb();
    const { name, activeIngredient, strength, form } = req.body;

    if (!name) {
      res.status(400).json({ success: false, error: 'name erforderlich' });
      return;
    }

    const result = db.prepare(
      "INSERT INTO medications (name, active_ingredient, strength, form) VALUES (?, ?, ?, ?)"
    ).run(name, activeIngredient || null, strength || null, form || null);

    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// PATCH /api/doctor/medications/:id
doctorRouter.patch('/doctor/medications/:id', (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    const { name, activeIngredient, strength, form } = req.body;

    db.prepare("UPDATE medications SET name = COALESCE(?, name), active_ingredient = COALESCE(?, active_ingredient), strength = COALESCE(?, strength), form = COALESCE(?, form), updated_at = datetime('now') WHERE id = ?")
      .run(name || null, activeIngredient || null, strength || null, form || null, id);

    res.json({ success: true, data: { id } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// DELETE /api/doctor/medications/:id
doctorRouter.delete('/doctor/medications/:id', (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    db.prepare('DELETE FROM medications WHERE id = ?').run(id);
    res.json({ success: true, data: { id } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// ==================== DIAGNOSES (Diagnosen) ====================

// GET /api/doctor/diagnoses?patientId= oder ?insuranceNumber=
doctorRouter.get('/doctor/diagnoses', (req, res) => {
  try {
    const db = getDb();
    const patientId = req.query.patientId ? Number(req.query.patientId) : undefined;
    const insuranceNumber = req.query.insuranceNumber as string;

    let sql = `SELECT d.*, doc.first_name AS doctor_first_name, doc.last_name AS doctor_last_name,
               pat.first_name AS patient_first_name, pat.last_name AS patient_last_name, pat.insurance_number
               FROM diagnoses d
               JOIN doctors doc ON doc.id = d.doctor_id
               JOIN patients pat ON pat.id = d.patient_id`;
    const params: any[] = [];

    if (insuranceNumber) {
      sql += ' WHERE pat.insurance_number = ?';
      params.push(insuranceNumber);
    } else if (patientId) {
      sql += ' WHERE d.patient_id = ?';
      params.push(patientId);
    }

    sql += ' ORDER BY d.diagnosis_date DESC';
    const rows = db.prepare(sql).all(...params);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// POST /api/doctor/diagnoses
doctorRouter.post('/doctor/diagnoses', (req, res) => {
  try {
    const db = getDb();
    const { insuranceNumber, icdCode, diagnosisText, diagnosisDate, notes, doctorId } = req.body;

    if (!insuranceNumber || !icdCode || !diagnosisText || !doctorId) {
      res.status(400).json({ success: false, error: 'insuranceNumber, icdCode, diagnosisText und doctorId erforderlich' });
      return;
    }

    const patient = db.prepare('SELECT id FROM patients WHERE insurance_number = ?').get(insuranceNumber) as { id: number } | undefined;
    if (!patient) {
      res.status(404).json({ success: false, error: 'Patient nicht gefunden' });
      return;
    }

    const today = diagnosisDate || new Date().toISOString().slice(0, 10);
    const result = db.prepare(
      "INSERT INTO diagnoses (patient_id, doctor_id, icd_code, diagnosis_text, diagnosis_date, notes) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(patient.id, doctorId, icdCode, diagnosisText, today, notes || null);

    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// PATCH /api/doctor/diagnoses/:id
doctorRouter.patch('/doctor/diagnoses/:id', (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    const { icdCode, diagnosisText, notes } = req.body;

    db.prepare("UPDATE diagnoses SET icd_code = COALESCE(?, icd_code), diagnosis_text = COALESCE(?, diagnosis_text), notes = COALESCE(?, notes), updated_at = datetime('now') WHERE id = ?")
      .run(icdCode || null, diagnosisText || null, notes || null, id);

    res.json({ success: true, data: { id } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// ==================== DOCTOR LOGIN ====================

// POST /api/doctor/login
doctorRouter.post('/doctor/login', (req, res) => {
  try {
    const db = getDb();
    const { firstName, lastName } = req.body;

    if (!firstName || !lastName) {
      res.status(400).json({ success: false, error: 'firstName und lastName erforderlich' });
      return;
    }

    const doctor = db.prepare(
      'SELECT id, first_name, last_name, color FROM doctors WHERE LOWER(first_name) = ? AND LOWER(last_name) = ?'
    ).get(firstName.toLowerCase(), lastName.toLowerCase()) as any;

    if (!doctor) {
      res.status(404).json({ success: false, error: 'Arzt nicht gefunden' });
      return;
    }

    res.json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});



