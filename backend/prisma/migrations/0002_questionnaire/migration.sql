-- CreateTable: questionnaire_answers
CREATE TABLE IF NOT EXISTS questionnaire_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    answer TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    FOREIGN KEY (question_id) REFERENCES questions(id)
);
