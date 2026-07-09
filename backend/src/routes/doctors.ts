import { Router } from 'express';
import { getDb } from '../db/connection.ts';

export const doctorsRouter = Router();

doctorsRouter.get('/doctors', (_req, res) => {
  try {
    const db = getDb();
    const doctors = db.prepare(
      'SELECT id, first_name, last_name, color, acute_slots_per_day FROM doctors ORDER BY last_name, first_name'
    ).all();
    res.json({ success: true, data: doctors });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Datenbankfehler',
    });
  }
});
