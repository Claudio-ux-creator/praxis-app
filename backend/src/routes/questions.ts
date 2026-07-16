import { Router } from 'express';
import { getDb } from '../db/connection.ts';

export const questionsRouter = Router();

// GET /api/questions?category= - Fragen für eine Kategorie abrufen
questionsRouter.get('/questions', (req, res) => {
  try {
    const db = getDb();
    const category = req.query.category as string;

    if (!category) {
      res.status(400).json({ success: false, error: 'category erforderlich' });
      return;
    }

    const rows = db.prepare(
      'SELECT id, category, question_text, sort_order, answer_type, required FROM questions WHERE category = ? ORDER BY sort_order'
    ).all(category);

    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});
