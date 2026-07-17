import { Router } from 'express';
import { getDb } from '../db/connection.ts';

export const appointmentsRouter = Router();

// GET /api/appointments?insuranceNumber= - Alle Termine eines Patienten
appointmentsRouter.get('/appointments', (req, res) => {
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
      "SELECT a.id, a.date, a.time, a.status, a.category, a.series_id, a.series_dose_number, a.series_group_id, d.first_name AS doctor_first_name, d.last_name AS doctor_last_name FROM appointments a JOIN doctors d ON d.id = a.doctor_id WHERE a.patient_id = ? ORDER BY a.date DESC, a.time DESC"
    ).all(patient.id);

    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// POST /api/appointments - Neuen Termin buchen
appointmentsRouter.post('/appointments', (req, res) => {
  try {
    const db = getDb();
    const { insuranceNumber, doctorId, category, date, time, answers } = req.body;

    if (!insuranceNumber || !doctorId || !category || !date || !time) {
      res.status(400).json({ success: false, error: 'Pflichtfelder fehlen' });
      return;
    }

    const patient = db.prepare('SELECT id FROM patients WHERE insurance_number = ?').get(insuranceNumber) as { id: number } | undefined;
    if (!patient) {
      res.status(404).json({ success: false, error: 'Patient nicht gefunden' });
      return;
    }

    const result = db.prepare(
      "INSERT INTO appointments (patient_id, doctor_id, category, date, time, status, booking_type) VALUES (?, ?, ?, ?, ?, 'PENDING_CONFIRMATION', 'ONLINE')"
    ).run(patient.id, doctorId, category, date, time);

    if (answers && Array.isArray(answers)) {
      const insertAnswer = db.prepare(
        'INSERT INTO questionnaire_answers (appointment_id, question_id, question_text, answer) VALUES (?, ?, ?, ?)'
      );
      for (const a of answers) {
        insertAnswer.run(result.lastInsertRowid, a.questionId, a.questionText || "", a.answer);
      }
    }

    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// POST /api/appointments/series - Impfserie buchen
appointmentsRouter.post('/appointments/series', (req, res) => {
  try {
    const db = getDb();
    const { insuranceNumber, doctorId, seriesTemplateId, date, time } = req.body;

    if (!insuranceNumber || !doctorId || !seriesTemplateId || !date || !time) {
      res.status(400).json({ success: false, error: 'Pflichtfelder fehlen' });
      return;
    }

    const patient = db.prepare('SELECT id FROM patients WHERE insurance_number = ?').get(insuranceNumber) as { id: number } | undefined;
    if (!patient) {
      res.status(404).json({ success: false, error: 'Patient nicht gefunden' });
      return;
    }

    const template = db.prepare('SELECT * FROM vaccination_templates WHERE id = ?').get(seriesTemplateId) as any;
    if (!template) {
      res.status(404).json({ success: false, error: 'Impfserien-Vorlage nicht gefunden' });
      return;
    }

    const groupId = crypto.randomUUID();
    const intervals = (template.intervals_days || '').split(',').map(Number).filter(n => !isNaN(n));
    const baseDate = new Date(date);

    const insertAppointment = db.prepare(
      "INSERT INTO appointments (patient_id, doctor_id, category, date, time, status, booking_type, series_id, series_dose_number, series_group_id) VALUES (?, ?, 'VACCINATION', ?, ?, 'PENDING_CONFIRMATION', 'ONLINE', ?, ?, ?)"
    );

    const dateStr = baseDate.toISOString().slice(0, 10);
    insertAppointment.run(patient.id, doctorId, dateStr, time, seriesTemplateId, 1, groupId);

    let cumulativeDays = 0;
    for (let i = 0; i < intervals.length; i++) {
      cumulativeDays += intervals[i];
      const nextDate = new Date(baseDate);
      nextDate.setDate(nextDate.getDate() + cumulativeDays);
      const nextDateStr = nextDate.toISOString().slice(0, 10);
      insertAppointment.run(patient.id, doctorId, nextDateStr, time, seriesTemplateId, i + 2, groupId);
    }

    res.json({ success: true, data: { seriesGroupId: groupId, totalDoses: template.doses } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// PATCH /api/appointments/:id/confirm-series - Impfserie bestätigen
appointmentsRouter.patch('/appointments/:id/confirm-series', (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);

    const appt = db.prepare('SELECT series_group_id FROM appointments WHERE id = ?').get(id) as { series_group_id: string | null } | undefined;
    if (!appt) {
      res.status(404).json({ success: false, error: 'Termin nicht gefunden' });
      return;
    }

    if (appt.series_group_id) {
      db.prepare("UPDATE appointments SET status = 'SCHEDULED' WHERE series_group_id = ? AND status = 'PENDING_CONFIRMATION'")
        .run(appt.series_group_id);
    } else {
      db.prepare('UPDATE appointments SET status = ? WHERE id = ?')
        .run('SCHEDULED', id);
    }

    res.json({ success: true, data: { id } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// PATCH /api/appointments/:id/status - Termin-Status ändern (MFA)
appointmentsRouter.patch('/appointments/:id/status', (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ success: false, error: 'status erforderlich' });
      return;
    }

    db.prepare('UPDATE appointments SET status = ?, updated_at = datetime(\'now\') WHERE id = ?')
      .run(status, id);

    res.json({ success: true, data: { id, status } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// PATCH /api/appointments/:id/note - MFA-Notiz speichern
appointmentsRouter.patch('/appointments/:id/note', (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    const { note } = req.body;

    db.prepare('UPDATE appointments SET mfa_note = ?, updated_at = datetime(\'now\') WHERE id = ?')
      .run(note || '', id);

    res.json({ success: true, data: { id } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});
