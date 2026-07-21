-- CreateTable: doctor_acute_hours
CREATE TABLE IF NOT EXISTS doctor_acute_hours (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    doctor_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    slot_interval INTEGER NOT NULL DEFAULT 30,
    max_slots INTEGER NOT NULL DEFAULT 5,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    UNIQUE(doctor_id, date)
);

CREATE INDEX IF NOT EXISTS idx_doctor_acute_hours_date ON doctor_acute_hours(date);
CREATE INDEX IF NOT EXISTS idx_doctor_acute_hours_doctor_date ON doctor_acute_hours(doctor_id, date);