-- Sicherheitsprüfung: Kritische Medikamente (Btm, Psychopharmaka etc.)
CREATE TABLE IF NOT EXISTS critical_medications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    medication_name TEXT NOT NULL,
    active_ingredient TEXT,
    atc_code TEXT,
    notes TEXT,
    created_by_doctor_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (created_by_doctor_id) REFERENCES doctors(id)
);

-- Seed: Häufige kritische Wirkstoffe
INSERT OR IGNORE INTO critical_medications (medication_name, active_ingredient, notes) VALUES
    ('Diazepam', 'Diazepam', 'Benzodiazepin - nur nach persönlicher Untersuchung'),
    ('Lorazepam', 'Lorazepam', 'Benzodiazepin - nur nach persönlicher Untersuchung'),
    ('Methylphenidat', 'Methylphenidat', 'Btm-pflichtig - nur nach persönlicher Untersuchung'),
    ('Morphin', 'Morphin', 'Btm-pflichtig - nur nach persönlicher Untersuchung'),
    ('Oxycodon', 'Oxycodon', 'Btm-pflichtig - nur nach persönlicher Untersuchung'),
    ('Fentanyl', 'Fentanyl', 'Btm-pflichtig - nur nach persönlicher Untersuchung'),
    ('Tilidin', 'Tilidin', 'Btm-pflichtig - nur nach persönlicher Untersuchung'),
    ('Pregabalin', 'Pregabalin', 'Nur nach persönlicher Untersuchung'),
    ('Zolpidem', 'Zolpidem', 'Nur nach persönlicher Untersuchung'),
    ('Codein', 'Codein', 'Btm-pflichtig - nur nach persönlicher Untersuchung');
