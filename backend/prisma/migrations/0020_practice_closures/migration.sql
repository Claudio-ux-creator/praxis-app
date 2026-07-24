-- Praxisschließungen: die gesamte Praxis (alle Ärzte, alle Termine) ist im Zeitraum geschlossen
CREATE TABLE IF NOT EXISTS practice_closures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    reason TEXT,
    created_by INTEGER REFERENCES staff(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_practice_closures_range ON practice_closures(start_date, end_date);
