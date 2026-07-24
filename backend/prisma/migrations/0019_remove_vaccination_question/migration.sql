-- Entferne redundante Frage für VACCINATION
DELETE FROM questions WHERE category = 'VACCINATION' AND question_text LIKE 'Welche Impfung%';
