import { Router } from 'express';
import { getDb } from '../db/connection.ts';

export const vaccinationsRouter = Router();

// GET /api/vaccination-series - Impfserien-Vorlagen abrufen
vaccinationsRouter.get('/vaccination-series', (_req, res) => {
  try {
    const db = getDb();

    // Prüfen ob Tabelle existiert
    const tableExists = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='vaccination_templates'"
    ).get();

    if (!tableExists) {
      res.json({ success: true, data: [] });
      return;
    }

    const rows = db.prepare('SELECT id, name, description, doses, intervals_days FROM vaccination_templates ORDER BY name').all();
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});
