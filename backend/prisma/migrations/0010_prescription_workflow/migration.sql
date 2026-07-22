-- Neuer Rezept-Workflow: Zwei-Stufen-Freigabe (MFA -> Arzt)
ALTER TABLE prescriptions ADD COLUMN mfa_approved_by INTEGER;
ALTER TABLE prescriptions ADD COLUMN mfa_approved_at TEXT;
ALTER TABLE prescriptions ADD COLUMN mfa_rejection_reason TEXT;
ALTER TABLE prescriptions ADD COLUMN doctor_approved_by INTEGER;
ALTER TABLE prescriptions ADD COLUMN doctor_approved_at TEXT;
ALTER TABLE prescriptions ADD COLUMN doctor_rejection_reason TEXT;
ALTER TABLE prescriptions ADD COLUMN assigned_doctor_id INTEGER;
ALTER TABLE prescriptions ADD COLUMN requires_doctor_approval INTEGER NOT NULL DEFAULT 1;

-- Bestehende Rezepte migrieren: APPROVED -> doctor_approved, REJECTED -> mfa_rejected, IN_PROGRESS -> mfa_approved
UPDATE prescriptions SET status = 'doctor_approved' WHERE status = 'APPROVED';
UPDATE prescriptions SET status = 'mfa_rejected' WHERE status = 'REJECTED';
UPDATE prescriptions SET status = 'mfa_approved' WHERE status = 'IN_PROGRESS';
