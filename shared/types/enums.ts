// ──────────────────────────────────────────────
// Gemeinsame Enums fuers gesamte Projekt
// ──────────────────────────────────────────────

export enum AppointmentStatus {
  SCHEDULED = "SCHEDULED",
  CHECKED_IN = "CHECKED_IN",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  NO_SHOW = "NO_SHOW",
}

export enum BookingType {
  ONLINE = "ONLINE",
  PHONE = "PHONE",
}

export enum PrescriptionStatus {
  PENDING = "PENDING",         // Patient hat angemeldet
  IN_PROGRESS = "IN_PROGRESS", // MFA legt an
  APPROVED = "APPROVED",       // Arzt freigegeben
  REJECTED = "REJECTED",       // Arzt abgelehnt
  COLLECTED = "COLLECTED",     // Patient abgeholt
}

export enum AppointmentCategory {
  CHECKUP = "CHECKUP",         // Vorsorge
  CONSULTATION = "CONSULTATION", // Beratung
  VACCINATION = "VACCINATION", // Impfung
  PRESCRIPTION_PICKUP = "PRESCRIPTION_PICKUP", // Rezept-Abholung
  BLOOD_DRAW = "BLOOD_DRAW",   // Blutabnahme (nicht online)
  INITIAL = "INITIAL",         // Erstgespraech (nicht online)
  ACUTE = "ACUTE",             // Akuttermin (nicht online)
}

export enum AbsenceType {
  SINGLE_DOCTOR = "SINGLE_DOCTOR",
  FULL_PRACTICE = "FULL_PRACTICE",
}

export enum UserRole {
  MFA = "MFA",
  DOCTOR = "DOCTOR",
}
