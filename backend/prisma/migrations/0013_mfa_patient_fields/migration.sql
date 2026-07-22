-- MFA-Patientenverwaltung erweitern
ALTER TABLE patients ADD COLUMN insurance_type TEXT CHECK(insurance_type IN ('public', 'private')) DEFAULT 'public';
ALTER TABLE patients ADD COLUMN created_by_mfa_id INTEGER;
ALTER TABLE patients ADD COLUMN mfa_comment TEXT;
