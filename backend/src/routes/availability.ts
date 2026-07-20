import { Router } from 'express';
import { getDb } from '../db/connection.ts';

export const availabilityRouter = Router();

// GET /api/doctor/availability?doctorId=
availabilityRouter.get('/doctor/availability', (req, res) => {
  try {
    const db = getDb();
    const doctorId = req.query.doctorId ? Number(req.query.doctorId) : undefined;
    let rows;
    if (doctorId) {
      rows = db.prepare('SELECT * FROM doctor_availability WHERE doctor_id = ? ORDER BY weekday, start_time').all(doctorId);
    } else {
      rows = db.prepare('SELECT * FROM doctor_availability ORDER BY doctor_id, weekday, start_time').all();
    }
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// POST /api/doctor/availability
availabilityRouter.post('/doctor/availability', (req, res) => {
  try {
    const db = getDb();
    const { doctorId, weekday, startTime, endTime } = req.body;
    if (doctorId == null || weekday == null || !startTime || !endTime) {
      res.status(400).json({ success: false, error: 'doctorId, weekday, startTime und endTime erforderlich' });
      return;
    }
    const result = db.prepare(
      "INSERT INTO doctor_availability (doctor_id, weekday, start_time, end_time) VALUES (?, ?, ?, ?)"
    ).run(doctorId, weekday, startTime, endTime);
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// PUT /api/doctor/availability/:id
availabilityRouter.put('/doctor/availability/:id', (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    const { startTime, endTime, isActive } = req.body;
    db.prepare(
      "UPDATE doctor_availability SET start_time = COALESCE(?, start_time), end_time = COALESCE(?, end_time), is_active = COALESCE(?, is_active), updated_at = datetime('now') WHERE id = ?"
    ).run(startTime || null, endTime || null, isActive != null ? (isActive ? 1 : 0) : null, id);
    res.json({ success: true, data: { id } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// DELETE /api/doctor/availability/:id
availabilityRouter.delete('/doctor/availability/:id', (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    db.prepare('DELETE FROM doctor_availability WHERE id = ?').run(id);
    res.json({ success: true, data: { id } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});