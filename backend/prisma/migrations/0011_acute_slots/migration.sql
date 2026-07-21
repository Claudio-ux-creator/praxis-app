-- CreateTable: acute_slots
CREATE TABLE IF NOT EXISTS acute_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    doctor_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    patient_id INTEGER,
    patient_name TEXT,
    phone TEXT,
    booked_by_mfa_id INTEGER,
    booked_at TEXT,
    is_available INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

-- Index für schnelle Suche nach Datum
CREATE INDEX IF NOT EXISTS idx_acute_slots_date ON acute_slots(date);
CREATE INDEX IF NOT EXISTS idx_acute_slots_doctor_date ON acute_slots(doctor_id, date);