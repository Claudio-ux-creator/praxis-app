-- Änderungshistorie für Termine (z.B. Patienten-Stornierungen)
CREATE TABLE IF NOT EXISTS appointment_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER NOT NULL,
    patient_id INTEGER NOT NULL,
    action TEXT NOT NULL CHECK(action IN ('CANCELLED', 'MOVED', 'CONFIRMED')),
    changed_by_type TEXT NOT NULL CHECK(changed_by_type IN ('patient', 'mfa', 'doctor', 'system')),
    changed_by_id INTEGER,
    old_status TEXT,
    new_status TEXT,
    reason TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    FOREIGN KEY (patient_id) REFERENCES patients(id)
);
CREATE INDEX IF NOT EXISTS idx_appointment_history_appointment ON appointment_history(appointment_id);
