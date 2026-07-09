// ──────────────────────────────────────────────
// Entities – basierend auf SPEC.md v3
// ──────────────────────────────────────────────

import {
  AppointmentStatus,
  BookingType,
  PrescriptionStatus,
  AppointmentCategory,
  AbsenceType,
  UserRole,
} from "./enums.js";

// ── Patient ──────────────────────────────────
export interface Patient {
  id: number;
  insuranceNumber: string; // Versichertennummer (Pflicht)
  lastName: string;
  firstName: string;
  dateOfBirth: string; // ISO-Datum
  phone: string;
  email?: string; // Nur mit Opt-in
  emailOptIn: boolean;
  lastConsultation?: string; // ISO-Datum
  noShowCount: number; // Letzte 12 Monate
  parentAccountId?: number; // Eltern-Konto-Verknuepfung
  createdAt: string;
  updatedAt: string;
}

// ── Termin ───────────────────────────────────
export interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  category: AppointmentCategory;
  date: string; // ISO-Datum
  time: string; // "HH:mm"
  status: AppointmentStatus;
  bookingType: BookingType;
  mfaNote?: string; // Aus Fragebogen zusammengefasst
  bufferMinutes: number; // Automatischer Puffer
  createdAt: string;
  updatedAt: string;
}

// ── Wiederholungsrezept ─────────────────────
export interface Prescription {
  id: number;
  patientId: number;
  medicationName: string;
  dosage?: string;
  notes?: string;
  initiatedByMfaId: number;
  responsibleDoctorId: number;
  status: PrescriptionStatus;
  requestDate: string; // ISO-Datum
  approvedDate?: string;
  pickupAppointmentId?: number; // Optionaler Abholtermin
  createdAt: string;
  updatedAt: string;
}

// ── Terminart ───────────────────────────────
export interface AppointmentTypeConfig {
  category: AppointmentCategory;
  name: string; // Anzeigename (z. B. "Vorsorge")
  onlineBookable: boolean;
  defaultDurationMinutes: number;
  defaultBufferMinutes: number;
  maxQuestions: number; // Max. 5 pro Terminart
}

// ── Arzt ────────────────────────────────────
export interface Doctor {
  id: number;
  firstName: string;
  lastName: string;
  color?: string; // Für Kalender-Farbcodierung
  acuteSlotsPerDay: number; // Akutslots pro Tag
  createdAt: string;
  updatedAt: string;
}

// ── Praxisschliessung / Abwesenheit ────────
export interface Absence {
  id: number;
  type: AbsenceType;
  doctorIds: number[]; // Betroffene Aerzte
  startDate: string; // ISO-Datum
  endDate: string; // ISO-Datum
  reason?: string;
  blocksBooking: boolean; // Schaltet Buchung frei/nicht frei
  createdAt: string;
  updatedAt: string;
}

// ── Mitarbeiter (MFA/Arzt User) ────────────
export interface Staff {
  id: number;
  firstName: string;
  lastName: string;
  role: UserRole;
  doctorId?: number; // Verknuepfung, falls Rolle = DOCTOR
  createdAt: string;
  updatedAt: string;
}

// ── Fragebogen-Frage ───────────────────────
export interface Question {
  id: number;
  category: AppointmentCategory;
  questionText: string;
  sortOrder: number;
  answerType: "text" | "boolean" | "date";
  required: boolean;
}

// ── Fragebogen-Antwort ─────────────────────
export interface QuestionnaireAnswer {
  questionId: number;
  questionText: string;
  answer: string;
}
