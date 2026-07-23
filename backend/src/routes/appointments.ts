import { Router } from 'express';
import { getDb } from '../db/connection.ts';
import { isDoctorAbsent } from '../services/absenceCheck.ts';

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
      res.status(400).json({ success: false, error: 'Pflichtfelder fehlen: '+JSON.stringify({insuranceNumber,doctorId,category,date,time}) });
      return;
    }

    const patient = db.prepare('SELECT id FROM patients WHERE insurance_number = ?').get(insuranceNumber) as { id: number } | undefined;
    if (!patient) {
      res.status(404).json({ success: false, error: 'Patient nicht gefunden' });
      return;
    }

    // Prüfen ob der Arzt an diesem Datum abwesend ist
    if (isDoctorAbsent(db, doctorId, date)) {
      res.status(409).json({ success: false, error: 'Der gewünschte Arzt ist an diesem Tag abwesend. Bitte wählen Sie einen anderen Tag oder Arzt.' });
      return;
    }

    const result = db.prepare("INSERT INTO appointments (patient_id, doctor_id, category, date, time, status, booking_type) VALUES (?, ?, ?, ?, ?, 'PENDING_CONFIRMATION', 'ONLINE')"
    ).run(patient.id, doctorId, category, date, time);

    if (answers && Array.isArray(answers)) {
      const insertAnswer = db.prepare(
        'INSERT INTO questionnaire_answers (appointment_id, question_id, question_text, answer) VALUES (?, ?, ?, ?)'
      );
      for (const a of answers) {
        insertAnswer.run(result.lastInsertRowid, a.questionId, a.questionText || "", a.answer);
      }
    }

    // Bei Rezept-Abholung automatisch eine PENDING-Rezeptanfrage erstellen
    if (category === 'PRESCRIPTION_PICKUP' && answers && Array.isArray(answers)) {
      // Medikamentenname aus Antwort extrahieren
      const medicationAnswer = answers.find(function(a) { return a.answer && a.answer !== ''; });
      if (medicationAnswer && medicationAnswer.answer) {
        const medicationName = medicationAnswer.answer;
        db.prepare(
          "INSERT INTO prescriptions (patient_id, medication_name, dosage, notes, initiated_by_mfa_id, responsible_doctor_id, status, request_date, pickup_appointment_id) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)"
        ).run(patient.id, medicationName, null, 'Patientenanfrage aus Terminbuchung', 0, doctorId, date, result.lastInsertRowid);
      }
    }

    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// POST /api/appointments/series - Impfserie mit Folgeterminen buchen
appointmentsRouter.post('/appointments/series', (req, res) => {
  try {
    const db = getDb();
    const { insuranceNumber, doctorId, seriesTemplateId, date, time } = req.body;
    console.log('[DEBUG] Series booking body:', JSON.stringify(req.body));
    if (!insuranceNumber || !doctorId || !seriesTemplateId || !date || !time) {
      res.status(400).json({ success: false, error: 'Pflichtfelder fehlen' });
      return;
    }
    const patient = db.prepare('SELECT id FROM patients WHERE insurance_number = ?').get(insuranceNumber);
    if (!patient) { res.status(404).json({ success: false, error: 'Patient nicht gefunden' }); return; }
    const template = db.prepare('SELECT * FROM vaccination_templates WHERE id = ?').get(seriesTemplateId);
    if (!template) { res.status(404).json({ success: false, error: 'Impfserien-Vorlage nicht gefunden' }); return; }
    if (isDoctorAbsent(db, doctorId, date)) {
      res.status(409).json({ success: false, error: 'Der gewünschte Arzt ist an diesem Tag abwesend.' });
      return;
    }
    const groupId = crypto.randomUUID();
    const allOffsets = (template.intervals_days || '').split(',').map(Number).filter(n => !isNaN(n));
    // erster Wert ist immer Tag 0 (Starttermin) - nur die folgenden Werte sind echte Folgetermine
    const followUpOffsets = allOffsets.slice(1, 4); // max. 3 Folgetermine
    const baseDate = new Date(date);
    const insertAppt = db.prepare("INSERT INTO appointments (patient_id, doctor_id, category, date, time, status, booking_type, series_id, series_dose_number, series_group_id) VALUES (?, ?, 'VACCINATION', ?, ?, 'PENDING_CONFIRMATION', 'ONLINE', ?, ?, ?)");
    const dateStr = baseDate.toISOString().slice(0, 10);
    insertAppt.run(patient.id, doctorId, dateStr, time, seriesTemplateId, 1, groupId);
    // vaccination_series anlegen
    const intervalDays = followUpOffsets.length > 0 ? followUpOffsets[0] : 28;
    db.prepare("INSERT INTO vaccination_series (patient_id, template_id, group_id, total_doses, current_dose, interval_days, status) VALUES (?, ?, ?, ?, 1, ?, 'ACTIVE')").run(patient.id, seriesTemplateId, groupId, template.doses, intervalDays);
    // Folgetermine + Erinnerungen
    const insertReminder = db.prepare('INSERT INTO followup_reminders (patient_id, series_group_id, appointment_id, dose_number, scheduled_date) VALUES (?, ?, ?, ?, ?)');
    for (let i = 0; i < followUpOffsets.length; i++) {
      const nextDate = new Date(baseDate);
      nextDate.setDate(nextDate.getDate() + followUpOffsets[i]);
      const nextDateStr = nextDate.toISOString().slice(0, 10);
      const doseNumber = i + 2;
      const apptResult = insertAppt.run(patient.id, doctorId, nextDateStr, time, seriesTemplateId, doseNumber, groupId);
      insertReminder.run(patient.id, groupId, apptResult.lastInsertRowid, doseNumber, nextDateStr);
    }
    const createdAppts = db.prepare('SELECT id, date, time, series_dose_number, status FROM appointments WHERE series_group_id = ? ORDER BY date ASC').all(groupId);
    const followUps = createdAppts.filter((a) => a.series_dose_number > 1).map((a) => ({ date: a.date, dose: a.series_dose_number }));
    console.log(`[VACCINATION] Impftermin gebucht: ${template.name}, Startdatum ${dateStr}. Berechnete Folgetermine:`, JSON.stringify(followUps));
    res.json({ success: true, data: { seriesGroupId: groupId, totalDoses: template.doses, intervals: allOffsets, appointments: createdAppts, followUps } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// PATCH /api/appointments/:id/confirm-series - Impfserie bestätigen
appointmentsRouter.patch('/appointments/:id/confirm-series', (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    const appt = db.prepare('SELECT series_group_id, series_dose_number FROM appointments WHERE id = ?').get(id);
    if (!appt) { res.status(404).json({ success: false, error: 'Termin nicht gefunden' }); return; }
    if (appt.series_group_id) {
      db.prepare("UPDATE appointments SET status = 'SCHEDULED' WHERE series_group_id = ? AND status = 'PENDING_CONFIRMATION'").run(appt.series_group_id);
      db.prepare("UPDATE vaccination_series SET current_dose = ?, status = (CASE WHEN ? >= total_doses THEN 'COMPLETED' ELSE 'ACTIVE' END) WHERE group_id = ?").run(appt.series_dose_number || 1, appt.series_dose_number || 1, appt.series_group_id);
    } else {
      db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run('SCHEDULED', id);
    }
    res.json({ success: true, data: { id } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// PATCH /api/appointments/:id/confirm-suggestion - Einzelnen Folgetermin-Vorschlag bestätigen
appointmentsRouter.patch('/appointments/:id/confirm-suggestion', (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    const { insuranceNumber } = req.body;
    if (!insuranceNumber) { res.status(400).json({ success: false, error: 'insuranceNumber erforderlich' }); return; }

    const patient = db.prepare('SELECT id FROM patients WHERE insurance_number = ?').get(insuranceNumber);
    if (!patient) { res.status(404).json({ success: false, error: 'Patient nicht gefunden' }); return; }

    const appt = db.prepare('SELECT id, patient_id, status, series_dose_number FROM appointments WHERE id = ?').get(id);
    if (!appt) { res.status(404).json({ success: false, error: 'Termin nicht gefunden' }); return; }
    if (appt.patient_id !== patient.id) { res.status(403).json({ success: false, error: 'Kein Zugriff auf diesen Termin' }); return; }
    const isSeriesSuggestion = (appt.series_dose_number || 0) > 1 && appt.status === 'PENDING_CONFIRMATION';
    if (!isSeriesSuggestion) { res.status(400).json({ success: false, error: 'Termin ist kein bestätigungspflichtiger Folgetermin' }); return; }

    db.prepare("UPDATE appointments SET status = 'SCHEDULED', updated_at = datetime('now') WHERE id = ?").run(id);
    db.prepare('UPDATE followup_reminders SET confirmed = 1 WHERE appointment_id = ?').run(id);

    res.json({ success: true, data: { id, status: 'SCHEDULED' } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// PATCH /api/appointments/:id/reject-suggestion - Einzelnen Folgetermin-Vorschlag ablehnen
appointmentsRouter.patch('/appointments/:id/reject-suggestion', (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    const { insuranceNumber } = req.body;
    if (!insuranceNumber) { res.status(400).json({ success: false, error: 'insuranceNumber erforderlich' }); return; }

    const patient = db.prepare('SELECT id FROM patients WHERE insurance_number = ?').get(insuranceNumber);
    if (!patient) { res.status(404).json({ success: false, error: 'Patient nicht gefunden' }); return; }

    const appt = db.prepare('SELECT id, patient_id, status, series_dose_number FROM appointments WHERE id = ?').get(id);
    if (!appt) { res.status(404).json({ success: false, error: 'Termin nicht gefunden' }); return; }
    if (appt.patient_id !== patient.id) { res.status(403).json({ success: false, error: 'Kein Zugriff auf diesen Termin' }); return; }
    const isSeriesSuggestion = (appt.series_dose_number || 0) > 1 && appt.status === 'PENDING_CONFIRMATION';
    if (!isSeriesSuggestion) { res.status(400).json({ success: false, error: 'Termin ist kein bestätigungspflichtiger Folgetermin' }); return; }

    db.prepare("UPDATE appointments SET status = 'CANCELLED', updated_at = datetime('now') WHERE id = ?").run(id);
    db.prepare('DELETE FROM followup_reminders WHERE appointment_id = ?').run(id);

    res.json({ success: true, data: { id, status: 'CANCELLED' } });
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






// GET /api/appointments/followup-reminders - Ausstehende Folgetermine abrufen
appointmentsRouter.get('/appointments/followup-reminders', (req, res) => {
  try {
    const db = getDb();
    const insuranceNumber = req.query.insuranceNumber;
    if (!insuranceNumber) { res.status(400).json({ success: false, error: 'insuranceNumber erforderlich' }); return; }
    const patient = db.prepare('SELECT id FROM patients WHERE insurance_number = ?').get(insuranceNumber);
    if (!patient) { res.status(404).json({ success: false, error: 'Patient nicht gefunden' }); return; }
    const rows = db.prepare('SELECT fr.*, a.date, a.time, vt.name as template_name FROM followup_reminders fr LEFT JOIN appointments a ON a.id = fr.appointment_id LEFT JOIN vaccination_series vs ON vs.group_id = fr.series_group_id LEFT JOIN vaccination_templates vt ON vt.id = vs.template_id WHERE fr.patient_id = ? AND fr.confirmed = 0 ORDER BY fr.scheduled_date ASC').all(patient.id);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// GET /api/appointments/vaccination-series-by-group - Impfserie nach group_id abrufen
appointmentsRouter.get('/appointments/vaccination-series-by-group', (req, res) => {
  try {
    const db = getDb();
    const groupId = req.query.groupId;
    if (!groupId) { res.status(400).json({ success: false, error: 'groupId erforderlich' }); return; }
    const series = db.prepare('SELECT vs.*, vt.name as template_name FROM vaccination_series vs JOIN vaccination_templates vt ON vt.id = vs.template_id WHERE vs.group_id = ?').get(groupId);
    const appointments = db.prepare('SELECT id, date, time, series_dose_number, status FROM appointments WHERE series_group_id = ? ORDER BY date ASC').all(groupId);
    res.json({ success: true, data: { series, appointments } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});