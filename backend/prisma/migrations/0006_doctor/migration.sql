-- CreateTable: medications
CREATE TABLE IF NOT EXISTS medications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    active_ingredient TEXT,
    strength TEXT,
    form TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- CreateTable: diagnoses
CREATE TABLE IF NOT EXISTS diagnoses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    icd_code TEXT NOT NULL,
    diagnosis_text TEXT NOT NULL,
    diagnosis_date TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

-- Seed: Some common medications
INSERT OR IGNORE INTO medications (id, name, active_ingredient, strength, form)
VALUES
    (1, 'Ibuprofen', 'Ibuprofen', '400 mg', 'Tabletten'),
    (2, 'Paracetamol', 'Paracetamol', '500 mg', 'Tabletten'),
    (3, 'Amoxicillin', 'Amoxicillin', '500 mg', 'Kapseln'),
    (4, 'Metformin', 'Metformin', '850 mg', 'Tabletten'),
    (5, 'Ramipril', 'Ramipril', '5 mg', 'Tabletten'),
    (6, 'Omeprazol', 'Omeprazol', '20 mg', 'Kapseln'),
    (7, 'Simvastatin', 'Simvastatin', '20 mg', 'Tabletten'),
    (8, 'Bisoprolol', 'Bisoprolol', '5 mg', 'Tabletten'),
    (9, 'L-Thyroxin', 'Levothyroxin', '100 µg', 'Tabletten'),
    (10, 'Pantoprazol', 'Pantoprazol', '40 mg', 'Tabletten');