import { Router } from 'express';
import { getDb } from '../db/connection.ts';
import { formatGermanDate } from '../services/absenceCheck.ts';

export const practiceClosuresRouter = Router();

// Storniert alle betroffenen Termine im Schließungszeitraum und benachrichtigt die Patienten
function cancelAppointmentsInClosure(db: any, startDate: string, endDate: string, reason: string | null): number {
  const affected = db.prepare(
    "SELECT id, patient_id, date, time FROM appointments WHERE date BETWEEN ? AND ? AND status NOT IN ('CANCELLED', 'COMPLETED', 'NO_SHOW')"
  ).all(startDate, endDate) as { id: number; patient_id: number; date: string; time: string }[];

  if (affected.length === 0) return 0;

  const rangeLabel = formatGermanDate(startDate) + ' bis ' + formatGermanDate(endDate);
  const cancelStmt = db.prepare(
    "UPDATE appointments SET status = 'CANCELLED', mfa_note = ?, updated_at = datetime('now') WHERE id = ?"
  );
  const notifyStmt = db.prepare(
    "INSERT INTO patient_notifications (patient_id, type, title, message, related_entity_type, related_entity_id) VALUES (?, 'APPOINTMENT_CANCELLED_CLOSURE', ?, ?, 'appointment', ?)"
  );

  for (const a of affected) {
    const note = 'Storniert wegen Praxisschließung (' + rangeLabel + (reason ? ': ' + reason : '') + ')';
    cancelStmt.run(note, a.id);
    const message =
      'Ihr Termin am ' + formatGermanDate(a.date) + ' um ' + a.time + ' Uhr musste wegen einer Praxisschließung (' +
      rangeLabel + (reason ? ', ' + reason : '') + ') storniert werden. Bitte buchen Sie einen neuen Termin.';
    notifyStmt.run(a.patient_id, 'Termin storniert - Praxisschließung', message, a.id);
  }

  return affected.length;
}

// GET /api/practice-closures - Alle Praxisschließungen
practiceClosuresRouter.get('/practice-closures', (_req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM practice_closures ORDER BY start_date DESC').all();
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// GET /api/practice-closures/upcoming - Aktuelle oder bevorstehende Schließung (für Dashboard-Hinweis)
practiceClosuresRouter.get('/practice-closures/upcoming', (_req, res) => {
  try {
    const db = getDb();
    const today = new Date().toISOString().slice(0, 10);
    const row = db.prepare(
      'SELECT * FROM practice_closures WHERE end_date >= ? ORDER BY start_date ASC LIMIT 1'
    ).get(today);
    res.json({ success: true, data: row || null });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// POST /api/practice-closures - Neue Praxisschließung anlegen (MFA/Arzt)
practiceClosuresRouter.post('/practice-closures', (req, res) => {
  try {
    const db = getDb();
    const { startDate, endDate, reason, createdBy } = req.body;

    if (!startDate || !endDate) {
      res.status(400).json({ success: false, error: 'startDate und endDate erforderlich' });
      return;
    }
    if (startDate > endDate) {
      res.status(400).json({ success: false, error: 'startDate darf nicht nach endDate liegen' });
      return;
    }

    const result = db.prepare(
      'INSERT INTO practice_closures (start_date, end_date, reason, created_by) VALUES (?, ?, ?, ?)'
    ).run(startDate, endDate, reason || null, createdBy || null);

    const cancelledCount = cancelAppointmentsInClosure(db, startDate, endDate, reason || null);

    res.json({ success: true, data: { id: result.lastInsertRowid, cancelledAppointments: cancelledCount } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// PATCH /api/practice-closures/:id - Praxisschließung bearbeiten
practiceClosuresRouter.patch('/practice-closures/:id', (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM practice_closures WHERE id = ?').get(id) as
      { id: number; start_date: string; end_date: string; reason: string | null } | undefined;
    if (!existing) {
      res.status(404).json({ success: false, error: 'Praxisschließung nicht gefunden' });
      return;
    }

    const startDate = req.body.startDate ?? existing.start_date;
    const endDate = req.body.endDate ?? existing.end_date;
    const reason = req.body.reason !== undefined ? req.body.reason : existing.reason;

    if (startDate > endDate) {
      res.status(400).json({ success: false, error: 'startDate darf nicht nach endDate liegen' });
      return;
    }

    db.prepare(
      'UPDATE practice_closures SET start_date = ?, end_date = ?, reason = ? WHERE id = ?'
    ).run(startDate, endDate, reason || null, id);

    const cancelledCount = cancelAppointmentsInClosure(db, startDate, endDate, reason || null);

    res.json({ success: true, data: { id, cancelledAppointments: cancelledCount } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// DELETE /api/practice-closures/:id - Praxisschließung löschen
practiceClosuresRouter.delete('/practice-closures/:id', (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    db.prepare('DELETE FROM practice_closures WHERE id = ?').run(id);
    res.json({ success: true, data: { id } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});
