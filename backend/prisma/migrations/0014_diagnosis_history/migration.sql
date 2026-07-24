-- Änderungshistorie für Diagnosen
ALTER TABLE diagnoses ADD COLUMN updated_by_doctor_id INTEGER;
ALTER TABLE diagnoses ADD COLUMN updated_by_mfa_id INTEGER;
