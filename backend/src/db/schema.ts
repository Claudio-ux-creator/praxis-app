import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// ?? Patienten ??????????????????????????????
export const patients = sqliteTable("patients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  insuranceNumber: text("insurance_number").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: text("date_of_birth").notNull(), // ISO-Datum
  phone: text("phone").notNull(),
  email: text("email"),
  emailOptIn: integer("email_opt_in", { mode: "boolean" }).notNull().default(false),
  lastConsultation: text("last_consultation"), // ISO-Datum
  noShowCount: integer("no_show_count").notNull().default(0),
  parentAccountId: integer("parent_account_id"),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
  updatedAt: text("updated_at").notNull().default("(datetime('now'))"),
});

// ?? Aerzte ??????????????????????????????????
export const doctors = sqliteTable("doctors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  color: text("color"),
  acuteSlotsPerDay: integer("acute_slots_per_day").notNull().default(3),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
  updatedAt: text("updated_at").notNull().default("(datetime('now'))"),
});

// ?? Termine ????????????????????????????????
export const appointments = sqliteTable("appointments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  patientId: integer("patient_id").notNull().references(() => patients.id),
  doctorId: integer("doctor_id").notNull().references(() => doctors.id),
  category: text("category").notNull(), // AppointmentCategory als String
  date: text("date").notNull(), // ISO-Datum
  time: text("time").notNull(), // "HH:mm"
  status: text("status").notNull().default("SCHEDULED"),
  bookingType: text("booking_type").notNull().default("ONLINE"),
  mfaNote: text("mfa_note"),
  bufferMinutes: integer("buffer_minutes").notNull().default(5),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
  updatedAt: text("updated_at").notNull().default("(datetime('now'))"),
});
