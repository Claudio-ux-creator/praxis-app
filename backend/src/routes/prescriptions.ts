import { Router } from "express";
import { getDb } from "../db/connection.ts";
import { isDoctorAbsent } from "../services/absenceCheck.ts";

export const prescriptionsRouter = Router();

const BTM_KEYWORDS = [
  "fentanyl", "morphin", "oxycodon", "tilidin", "pethidin", "methadon", "buprenorphin",
  "amphetamine", "methylphenidat", "modafinil",
  "benzodiazepin", "diazepam", "lorazepam", "alprazolam",
  "zolpidem", "zopiclon", "phenobarbital", "pentobarbital", "ketamin", "ghb",
];

function isBTMMedication(name: string): boolean {
  const lower = name.toLowerCase();
  return BTM_KEYWORDS.some(function (kw) { return lower.includes(kw); });
}

/**
 * Prüft, ob der Patient in den letzten 12 Monaten eine Kontrolluntersuchung hatte.
 * Gibt null zurück wenn OK, andernfalls eine Fehlermeldung.
 */
function checkConsultation(db: any, patientId: number): string | null {
  const pat = db.prepare("SELECT last_consultation FROM patients WHERE id = ?").get(patientId) as { last_consultation: string | null } | undefined;
  if (!pat?.last_consultation) {
    return "Patient hatte noch keine Konsultation. Rezept nur nach Untersuchung möglich.";
  }
  const lastConsult = new Date(pat.last_consultation);
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  if (lastConsult < oneYearAgo) {
    return "Letzte Konsultation des Patienten ist länger als 1 Jahr her – neues Rezept nur nach Untersuchung möglich.";
  }
  return null;
}

/**
 * Prüft die letzte Konsultation und lehnt das Rezept automatisch ab, wenn
 * die letzte Untersuchung länger als 12 Monate zurückliegt.
 * Gibt true zurück wenn die Prüfung bestanden wurde (Rezept kann erstellt werden),
 * false wenn automatisch abgelehnt wurde.
 */
function autoRejectIfNoConsultation(db: any, patientId: number, medicationName: string, requestDate: string, res: any): boolean {
  const pat = db.prepare("SELECT last_consultation, insurance_number FROM patients WHERE id = ?").get(patientId) as { last_consultation: string | null; insurance_number: string } | undefined;
  
  let reason: string | null = null;
  
  if (!pat?.last_consultation) {
    reason = "Patient hatte noch keine Kontrolluntersuchung in unserer Praxis.";
  } else {
    const lastConsult = new Date(pat.last_consultation);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    if (lastConsult < oneYearAgo) {
      reason = "Die letzte Kontrolluntersuchung liegt länger als 12 Monate zurück.";
    }
  }
  
  if (reason) {
    // Rezept automatisch ablehnen
    const result = db.prepare(
      "INSERT INTO prescriptions (patient_id, medication_name, dosage, notes, initiated_by_mfa_id, responsible_doctor_id, status, request_date, mfa_rejection_reason) VALUES (?, ?, NULL, NULL, 0, 1, 'auto_rejected', ?, ?)"
    ).run(patientId, medicationName, requestDate, reason);
    
    const rxId = result.lastInsertRowid;
    
    // Benachrichtigung an den Patienten
    db.prepare(
      "INSERT INTO patient_notifications (patient_id, type, title, message, related_entity_type, related_entity_id) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(
      patientId,
      'PRESCRIPTION_AUTO_REJECTED',
      'Rezeptanfrage automatisch abgelehnt',
      'Ihre Rezeptanfrage für ' + medicationName + ' vom ' + requestDate + ' konnte nicht bearbeitet werden, da Ihre letzte Kontrolluntersuchung länger als 12 Monate zurückliegt. Bitte vereinbaren Sie zunächst einen Kontrolltermin in unserer Praxis.',
      'prescription',
      rxId
    );
    
    res.json({
      success: true,
      data: {
        id: rxId,
        status: 'auto_rejected',
        autoRejected: true,
        reason: reason,
        message: 'Ihre Rezeptanfrage wurde automatisch abgelehnt, da Ihre letzte Kontrolluntersuchung länger als 12 Monate zurückliegt. Bitte vereinbaren Sie zunächst einen Kontrolltermin.'
      }
    });
    return false;
  }
  
  return true; // Prüfung bestanden
}

function createNotification(db: any, patientId: number, type: string, title: string, message: string, entityId: number): void {
  db.prepare(
    "INSERT INTO patient_notifications (patient_id, type, title, message, related_entity_type, related_entity_id) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(patientId, type, title, message, "prescription", entityId);
}

// GET /api/prescriptions?insuranceNumber= - Rezepte eines Patienten
prescriptionsRouter.get("/prescriptions", (req, res) => {
  try {
    const db = getDb();
    const insuranceNumber = req.query.insuranceNumber as string;
    if (!insuranceNumber) {
      res.status(400).json({ success: false, error: "insuranceNumber erforderlich" });
      return;
    }
    const patient = db.prepare("SELECT id FROM patients WHERE insurance_number = ?").get(insuranceNumber) as { id: number } | undefined;
    if (!patient) {
      res.status(404).json({ success: false, error: "Patient nicht gefunden" });
      return;
    }
    const rows = db.prepare(
      "SELECT p.id, p.medication_name, p.dosage, p.notes, p.status, p.request_date, p.approved_date, p.mfa_rejection_reason, p.doctor_rejection_reason, p.requires_doctor_approval, p.mfa_approved_by, p.mfa_approved_at, p.doctor_approved_by, p.doctor_approved_at, d.first_name AS doctor_first_name, d.last_name AS doctor_last_name FROM prescriptions p JOIN doctors d ON d.id = COALESCE(p.assigned_doctor_id, p.responsible_doctor_id) WHERE p.patient_id = ? ORDER BY p.request_date DESC"
    ).all(patient.id);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Datenbankfehler" });
  }
});

// GET /api/prescriptions/all - Alle Rezepte (MFA)
prescriptionsRouter.get("/prescriptions/all", (_req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare(
      "SELECT p.id, p.medication_name, p.dosage, p.notes, p.status, p.request_date, p.approved_date, p.initiated_by_mfa_id, p.requires_doctor_approval, p.mfa_approved_by, p.mfa_approved_at, p.mfa_rejection_reason, p.doctor_approved_by, p.doctor_approved_at, p.doctor_rejection_reason, p.assigned_doctor_id, pat.first_name AS patient_first_name, pat.last_name AS patient_last_name, pat.insurance_number, pat.phone, d.first_name AS doctor_first_name, d.last_name AS doctor_last_name FROM prescriptions p JOIN patients pat ON pat.id = p.patient_id JOIN doctors d ON d.id = COALESCE(p.assigned_doctor_id, p.responsible_doctor_id) ORDER BY p.request_date DESC"
    ).all();
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Datenbankfehler" });
  }
});

// POST /api/prescriptions/request - Patient reicht Medikamentenanfrage ein
prescriptionsRouter.post("/prescriptions/request", (req, res) => {
  try {
    const db = getDb();
    const { insuranceNumber, medicationName, dosage, notes, doctorId } = req.body;
    if (!insuranceNumber || !medicationName) {
      res.status(400).json({ success: false, error: "insuranceNumber und medicationName erforderlich" });
      return;
    }
    const patient = db.prepare("SELECT id, last_consultation FROM patients WHERE insurance_number = ?").get(insuranceNumber) as { id: number; last_consultation: string | null } | undefined;
    if (!patient) {
      res.status(404).json({ success: false, error: "Patient nicht gefunden" });
      return;
    }
    
    const today = new Date().toISOString().slice(0, 10);
    
    // Automatische Prüfung: Kontrolluntersuchung in den letzten 12 Monaten?
    if (!autoRejectIfNoConsultation(db, patient.id, medicationName, today, res)) {
      return; // Wurde automatisch abgelehnt
    }
    
    // Prüfung bestanden – normaler Workflow
    const responsibleDoctorId = doctorId || 1;
    if (isDoctorAbsent(db, responsibleDoctorId, today)) {
      res.status(409).json({ success: false, error: "Der ausgewählte Arzt ist derzeit abwesend." });
      return;
    }
    const result = db.prepare(
      "INSERT INTO prescriptions (patient_id, medication_name, dosage, notes, initiated_by_mfa_id, responsible_doctor_id, status, request_date) VALUES (?, ?, ?, ?, 0, ?, 'PENDING', ?)"
    ).run(patient.id, medicationName, dosage || null, notes || null, responsibleDoctorId, today);
    res.json({ success: true, data: { id: result.lastInsertRowid, status: 'PENDING' } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Datenbankfehler" });
  }
});

// POST /api/prescriptions/mfa-create - MFA erstellt Rezept für Patienten
prescriptionsRouter.post("/prescriptions/mfa-create", (req, res) => {
  try {
    const db = getDb();
    const { patientId, medicationName, dosage, notes, initiatedByMfaId, responsibleDoctorId } = req.body;
    if (!patientId || !medicationName) {
      res.status(400).json({ success: false, error: "patientId und medicationName erforderlich" });
      return;
    }
    
    const today = new Date().toISOString().slice(0, 10);
    
    // Automatische Prüfung: Kontrolluntersuchung in den letzten 12 Monaten?
    if (!autoRejectIfNoConsultation(db, patientId, medicationName, today, res)) {
      return; // Wurde automatisch abgelehnt
    }
    
    const docId = responsibleDoctorId || 1;
    if (isDoctorAbsent(db, docId, today)) {
      res.status(409).json({ success: false, error: "Der verantwortliche Arzt ist derzeit abwesend." });
      return;
    }
    const result = db.prepare(
      "INSERT INTO prescriptions (patient_id, medication_name, dosage, notes, initiated_by_mfa_id, responsible_doctor_id, assigned_doctor_id, status, request_date, requires_doctor_approval) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, 1)"
    ).run(patientId, medicationName, dosage || null, notes || null, initiatedByMfaId || 1, docId, docId, today);
    res.json({ success: true, data: { id: result.lastInsertRowid, status: 'PENDING' } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Datenbankfehler" });
  }
});

// POST /api/prescriptions/:id/mfa-approve - MFA leitet Rezept an Arzt weiter
prescriptionsRouter.post("/prescriptions/:id/mfa-approve", (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    const { mfaUserId } = req.body;
    if (!mfaUserId) {
      res.status(400).json({ success: false, error: "mfaUserId erforderlich" });
      return;
    }
    const rx = db.prepare(
      "SELECT p.id, p.medication_name, p.patient_id, p.status, p.responsible_doctor_id, pat.last_consultation FROM prescriptions p JOIN patients pat ON pat.id = p.patient_id WHERE p.id = ?"
    ).get(id) as any;
    if (!rx) { res.status(404).json({ success: false, error: "Rezept nicht gefunden" }); return; }
    if (rx.status !== "PENDING") {
      res.status(409).json({ success: false, error: "Rezept hat nicht den Status PENDING" }); return;
    }
    const today = new Date().toISOString().slice(0, 10);
    if (isDoctorAbsent(db, rx.responsible_doctor_id, today)) {
      res.status(409).json({ success: false, error: "Der verantwortliche Arzt ist derzeit abwesend." }); return;
    }
    const now = new Date().toISOString();
    db.prepare("UPDATE prescriptions SET status = 'mfa_approved', mfa_approved_by = ?, mfa_approved_at = ?, updated_at = datetime('now') WHERE id = ?").run(mfaUserId, now, id);
    createNotification(db, rx.patient_id, "PRESCRIPTION_FORWARDED", "Rezept wurde weitergeleitet", "Ihr Rezept für " + rx.medication_name + " wurde an den Arzt zur Freigabe weitergeleitet.", id);
    res.json({ success: true, data: { id, status: "mfa_approved" } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Datenbankfehler" });
  }
});

// POST /api/prescriptions/:id/mfa-reject - MFA lehnt Rezept ab
prescriptionsRouter.post("/prescriptions/:id/mfa-reject", (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    const { mfaUserId, reason } = req.body;
    if (!mfaUserId) { res.status(400).json({ success: false, error: "mfaUserId erforderlich" }); return; }
    const rx = db.prepare("SELECT status, patient_id, medication_name FROM prescriptions WHERE id = ?").get(id) as any;
    if (!rx) { res.status(404).json({ success: false, error: "Rezept nicht gefunden" }); return; }
    if (rx.status !== "PENDING") { res.status(409).json({ success: false, error: "Rezept hat nicht den Status PENDING" }); return; }
    db.prepare("UPDATE prescriptions SET status = 'mfa_rejected', mfa_rejection_reason = ?, updated_at = datetime('now') WHERE id = ?").run(reason || null, id);
    createNotification(db, rx.patient_id, "PRESCRIPTION_REJECTED", "Rezept wurde abgelehnt (MFA)", "Ihre Rezeptanfrage für " + rx.medication_name + " wurde von der MFA abgelehnt." + (reason ? " Grund: " + reason : ""), id);
    res.json({ success: true, data: { id, status: "mfa_rejected" } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Datenbankfehler" });
  }
});

// POST /api/prescriptions/:id/doctor-approve - Arzt gibt Rezept endgültig frei
prescriptionsRouter.post("/prescriptions/:id/doctor-approve", (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    const { doctorUserId } = req.body;
    const rx = db.prepare("SELECT status, patient_id, medication_name FROM prescriptions WHERE id = ?").get(id) as any;
    if (!rx) { res.status(404).json({ success: false, error: "Rezept nicht gefunden" }); return; }
    if (rx.status !== "mfa_approved") { res.status(409).json({ success: false, error: "Rezept muss von MFA geprüft sein (mfa_approved)" }); return; }
    const now = new Date().toISOString();
    db.prepare("UPDATE prescriptions SET status = 'doctor_approved', doctor_approved_by = ?, doctor_approved_at = ?, updated_at = datetime('now') WHERE id = ?").run(doctorUserId || null, now, id);
    createNotification(db, rx.patient_id, "PRESCRIPTION_READY", "Rezept freigegeben", "Ihr Rezept für " + rx.medication_name + " wurde freigegeben und kann abgeholt werden.", id);
    res.json({ success: true, data: { id, status: "doctor_approved" } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Datenbankfehler" });
  }
});

// POST /api/prescriptions/:id/doctor-reject - Arzt lehnt Rezept endgültig ab
prescriptionsRouter.post("/prescriptions/:id/doctor-reject", (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    const { doctorUserId, reason } = req.body;
    const rx = db.prepare("SELECT status, patient_id, medication_name FROM prescriptions WHERE id = ?").get(id) as any;
    if (!rx) { res.status(404).json({ success: false, error: "Rezept nicht gefunden" }); return; }
    if (rx.status !== "mfa_approved") { res.status(409).json({ success: false, error: "Rezept muss von MFA geprüft sein (mfa_approved)" }); return; }
    db.prepare("UPDATE prescriptions SET status = 'doctor_rejected', doctor_rejection_reason = ?, updated_at = datetime('now') WHERE id = ?").run(reason || null, id);
    createNotification(db, rx.patient_id, "PRESCRIPTION_REJECTED_DOCTOR", "Rezept vom Arzt abgelehnt", "Ihre Rezeptanfrage für " + rx.medication_name + " wurde vom Arzt abgelehnt." + (reason ? " Grund: " + reason : ""), id);
    res.json({ success: true, data: { id, status: "doctor_rejected" } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Datenbankfehler" });
  }
});

// POST /api/prescriptions/:id/collect - Rezept als abgeholt markieren (MFA)
prescriptionsRouter.post("/prescriptions/:id/collect", (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    const rx = db.prepare("SELECT status FROM prescriptions WHERE id = ?").get(id) as { status: string } | undefined;
    if (!rx) { res.status(404).json({ success: false, error: "Rezept nicht gefunden" }); return; }
    if (rx.status !== "doctor_approved") {
      res.status(409).json({ success: false, error: "Rezept muss vom Arzt freigegeben sein (doctor_approved), um als abgeholt markiert zu werden." }); return;
    }
    const today = new Date().toISOString().slice(0, 10);
    db.prepare("UPDATE prescriptions SET status = 'collected', approved_date = ?, updated_at = datetime('now') WHERE id = ?").run(today, id);
    res.json({ success: true, data: { id, status: "collected" } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Datenbankfehler" });
  }
});