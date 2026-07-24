-- Erweiterung des action-CHECK um NO_SHOW (SQLite erlaubt kein direktes Ändern von CHECK-Constraints)
CREATE TABLE appointment_history_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER NOT NULL,
    patient_id INTEGER NOT NULL,
    action TEXT NOT NULL CHECK(action IN ('CANCELLED', 'MOVED', 'CONFIRMED', 'NO_SHOW')),
    changed_by_type TEXT NOT NULL CHECK(changed_by_type IN ('patient', 'mfa', 'doctor', 'system')),
    changed_by_id INTEGER,
    old_status TEXT,
    new_status TEXT,
    reason TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    FOREIGN KEY (patient_id) REFERENCES patients(id)
);
INSERT INTO appointment_history_new SELECT * FROM appointment_history;
DROP TABLE appointment_history;
ALTER TABLE appointment_history_new RENAME TO appointment_history;
CREATE INDEX IF NOT EXISTS idx_appointment_history_appointment ON appointment_history(appointment_id);
