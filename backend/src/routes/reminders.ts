import { Router } from 'express';
import { getDb } from '../db/connection.ts';

export const remindersRouter = Router();

// GET /api/reminders/pending - Ausstehende Erinnerungen
remindersRouter.get('/reminders/pending', (_req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare(
      "SELECT r.id, r.appointment_id, r.patient_id, r.type, r.channel, r.status, r.sent_at, r.created_at, a.date AS appointment_date, a.time AS appointment_time, a.category, p.first_name AS patient_first_name, p.last_name AS patient_last_name, p.phone, p.email, d.first_name AS doctor_first_name, d.last_name AS doctor_last_name FROM reminders r JOIN appointments a ON a.id = r.appointment_id JOIN patients p ON p.id = r.patient_id JOIN doctors d ON d.id = a.doctor_id WHERE r.status = 'PENDING' ORDER BY r.created_at"
    ).all();
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// GET /api/reminders/dashboard - Erinnerungs-Dashboard (Statistiken + Verlauf)
remindersRouter.get('/reminders/dashboard', (_req, res) => {
  try {
    const db = getDb();
    const today = new Date().toISOString().slice(0, 10);
    const sentToday = db.prepare(
      "SELECT COUNT(*) as count FROM reminders WHERE status = 'SENT' AND date(sent_at) = ?"
    ).get(today) as any;
    const pendingCount = db.prepare(
      "SELECT COUNT(*) as count FROM reminders WHERE status = 'PENDING'"
    ).get() as any;
    const recent = db.prepare(
      "SELECT r.id, r.type, r.channel, r.status, r.sent_at, r.created_at, a.date AS appointment_date, a.time AS appointment_time, p.first_name AS patient_first_name, p.last_name AS patient_last_name FROM reminders r JOIN appointments a ON a.id = r.appointment_id JOIN patients p ON p.id = r.patient_id ORDER BY r.created_at DESC LIMIT 50"
    ).all();

    res.json({
      success: true,
      data: {
        today,
        sentToday: sentToday.count,
        pendingCount: pendingCount.count,
        recent,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// POST /api/reminders/process - Erinnerungen generieren & senden (Simulation)
remindersRouter.post('/reminders/process', (_req, res) => {
  try {
    const db = getDb();
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);
    const now = new Date().toISOString();

    // 24h-Erinnerungen für morgige Termine generieren
    const tomorrowAppointments = db.prepare(
      "SELECT a.id, a.patient_id FROM appointments a WHERE a.date = ? AND a.status NOT IN ('CANCELLED', 'NO_SHOW')"
    ).all(tomorrowStr) as any[];

    let generated = 0;
    let sent = 0;
    const insertReminder = db.prepare(
      "INSERT OR IGNORE INTO reminders (appointment_id, patient_id, type, channel, status, sent_at, created_at) VALUES (?, ?, '24H', 'SMS', 'SENT', ?, ?)"
    );

    for (const apt of tomorrowAppointments) {
      insertReminder.run(apt.id, apt.patient_id, now, now);
      generated++;
      sent++;
    }

    // Ausstehende Erinnerungen als "gesendet" markieren
    const pendingReminders = db.prepare(
      "SELECT id FROM reminders WHERE status = 'PENDING'"
    ).all() as any[];

    for (const r of pendingReminders) {
      db.prepare("UPDATE reminders SET status = 'SENT', sent_at = ? WHERE id = ?")
        .run(now, r.id);
      sent++;
    }

    res.json({
      success: true,
      data: {
        stats: { generated, sent, pending: 0 },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});
