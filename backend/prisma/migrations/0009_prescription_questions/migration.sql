-- Add question for prescription pickup category
INSERT OR IGNORE INTO questions (category, question_text, sort_order, answer_type, required)
VALUES ('PRESCRIPTION_PICKUP', 'Welches Medikament benoetigen Sie?', 1, 'text', 1);

-- Update config to allow questions for prescription pickup
UPDATE appointment_type_configs SET max_questions = 3, default_duration_minutes = 10
WHERE category = 'PRESCRIPTION_PICKUP';
