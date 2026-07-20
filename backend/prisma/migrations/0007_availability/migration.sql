-- CreateTable: doctor_availability
CREATE TABLE IF NOT EXISTS doctor_availability (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    doctor_id INTEGER NOT NULL,
    weekday INTEGER NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

-- Seed: Standard-Sprechzeiten f�r alle �rzte (Mo-Fr 08:00-12:00, 13:00-17:00)
INSERT OR IGNORE INTO doctor_availability (doctor_id, weekday, start_time, end_time, is_active)
VALUES
    (1, 1, '08:00', '12:00', 1), (1, 1, '13:00', '17:00', 1),
    (1, 2, '08:00', '12:00', 1), (1, 2, '13:00', '17:00', 1),
    (1, 3, '08:00', '12:00', 1), (1, 3, '13:00', '17:00', 1),
    (1, 4, '08:00', '12:00', 1), (1, 4, '13:00', '17:00', 1),
    (1, 5, '08:00', '12:00', 1), (1, 5, '13:00', '17:00', 1),
    (2, 1, '08:00', '12:00', 1), (2, 1, '13:00', '17:00', 1),
    (2, 2, '08:00', '12:00', 1), (2, 2, '13:00', '17:00', 1),
    (2, 3, '08:00', '12:00', 1), (2, 3, '13:00', '17:00', 1),
    (2, 4, '08:00', '12:00', 1), (2, 4, '13:00', '17:00', 1),
    (2, 5, '08:00', '12:00', 1), (2, 5, '13:00', '17:00', 1),
    (3, 1, '08:00', '12:00', 1), (3, 1, '13:00', '17:00', 1),
    (3, 2, '08:00', '12:00', 1), (3, 2, '13:00', '17:00', 1),
    (3, 3, '08:00', '12:00', 1), (3, 3, '13:00', '17:00', 1),
    (3, 4, '08:00', '12:00', 1), (3, 4, '13:00', '17:00', 1),
    (3, 5, '08:00', '12:00', 1), (3, 5, '13:00', '17:00', 1);