-- Änderungshistorie-Tabelle für Diagnosen
CREATE TABLE IF NOT EXISTS diagnosis_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    diagnosis_id INTEGER NOT NULL,
    patient_id INTEGER NOT NULL,
    action TEXT NOT NULL CHECK(action IN ('CREATED', 'UPDATED', 'DELETED')),
    changed_by_type TEXT NOT NULL CHECK(changed_by_type IN ('doctor', 'mfa')),
    changed_by_id INTEGER,
    old_icd_code TEXT,
    new_icd_code TEXT,
    old_diagnosis_text TEXT,
    new_diagnosis_text TEXT,
    old_notes TEXT,
    new_notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (diagnosis_id) REFERENCES diagnoses(id),
    FOREIGN KEY (patient_id) REFERENCES patients(id)
);
