-- Impfserien-Tracking
CREATE TABLE IF NOT EXISTS vaccination_series (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    template_id INTEGER NOT NULL,
    group_id TEXT NOT NULL,
    total_doses INTEGER NOT NULL DEFAULT 1,
    current_dose INTEGER NOT NULL DEFAULT 1,
    interval_days INTEGER NOT NULL DEFAULT 28,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','COMPLETED','CANCELLED')),
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (template_id) REFERENCES vaccination_templates(id)
);
CREATE INDEX IF NOT EXISTS idx_vaccination_series_group ON vaccination_series(group_id);
CREATE INDEX IF NOT EXISTS idx_vaccination_series_patient ON vaccination_series(patient_id);
CREATE TABLE IF NOT EXISTS followup_reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    series_group_id TEXT NOT NULL,
    appointment_id INTEGER,
    dose_number INTEGER NOT NULL,
    scheduled_date TEXT NOT NULL,
    reminded INTEGER NOT NULL DEFAULT 0,
    reminded_at TEXT,
    confirmed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);
CREATE INDEX IF NOT EXISTS idx_followup_reminders_pending ON followup_reminders(reminded, confirmed);
