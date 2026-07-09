// ──────────────────────────────────────────────
// API-spezifische Typen (Request/Response DTOs)
// ──────────────────────────────────────────────

import type { Patient, Appointment, Prescription, QuestionnaireAnswer } from "./entities.js";
import type { AppointmentCategory } from "./enums.js";

// ── Generische API-Antwort ──────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ── Buchung ─────────────────────────────────
export interface BookingRequest {
  insuranceNumber: string;
  doctorId: number;
  date: string;
  time: string;
  category: AppointmentCategory;
  answers: QuestionnaireAnswer[];
}

export interface BookingResponse {
  appointment: Appointment;
  patient: Patient;
}

// ── Akutslot ────────────────────────────────
export interface AcuteSlotInfo {
  doctorId: number;
  doctorName: string;
  morningSlots: number; // Vormittags verbleibend
  afternoonSlots: number; // Nachmittags verbleibend
}

// ── Rezept-Workflow ─────────────────────────
export interface PrescriptionRequest {
  insuranceNumber: string;
  medicationName: string;
  dosage?: string;
  notes?: string;
}

export interface PrescriptionApproval {
  prescriptionId: number;
  approved: boolean;
  doctorNote?: string;
}

// ── Dashboard ──────────────────────────────
export interface DashboardData {
  todaysAppointments: Appointment[];
  pendingPrescriptions: Prescription[];
  remainingAcuteSlots: AcuteSlotInfo[];
  unreadNotifications: number;
}
