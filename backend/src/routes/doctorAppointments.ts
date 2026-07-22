import { Router } from 'express';
import { getDb } from '../db/connection.ts';

export const doctorAppointmentsRouter = Router();

doctorAppointmentsRouter.get('/doctor/appointments', (req, res) => {
  try {
    const db = getDb();
    const doctorId = Number(req.query.doctorId);
    const from = (req.query.from as string) || new Date().toISOString().slice(0, 10);
    const to = (req.query.to as string) || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

    if (!doctorId) {
      res.status(400).json({ success: false, error: 'doctorId erforderlich' });
      return;
    }

    const allAppointments: any[] = [];

    // 1. Termine aus appointments-Tabelle
    const bookedAppointments = db.prepare(`
      SELECT
        a.id, 'APPOINTMENT' as source_type, a.category, a.date, a.time, a.status, a.booking_type,
        a.mfa_note as notes, a.series_id, a.series_dose_number, a.series_group_id,
        pat.id as patient_id, pat.first_name as patient_first_name, pat.last_name as patient_last_name,
        pat.insurance_number, pat.date_of_birth, pat.phone,
        NULL as reject_reason, NULL as medication_name
      FROM appointments a
      JOIN patients pat ON pat.id = a.patient_id
      WHERE a.doctor_id = ? AND a.date >= ? AND a.date <= ?
      ORDER BY a.date ASC, a.time ASC
    `).all(doctorId, from, to) as any[];

    for (const appt of bookedAppointments) {
      const answers = db.prepare('SELECT question_text, answer FROM questionnaire_answers WHERE appointment_id = ?').all(appt.id) as any[];
      (appt as any).answers = answers || [];
      if (appt.category === 'VACCINATION' && appt.series_id) {
        const template = db.prepare('SELECT name FROM vaccination_templates WHERE id = ?').get(appt.series_id) as any;
        (appt as any).series_name = template?.name || null;
      }
      allAppointments.push(appt);
    }

    // 2. Akut-Slots (von MFA gebucht)
    const acuteSlots = db.prepare(`
      SELECT
        s.id, 'ACUTE_SLOT' as source_type, 'ACUTE' as category, s.date, s.time,
        CASE WHEN s.is_available = 1 THEN 'AVAILABLE' ELSE 'BOOKED' END as status,
        'MFA' as booking_type, s.notes,
        NULL as series_id, NULL as series_dose_number, NULL as series_group_id,
        s.patient_id, s.patient_name as patient_first_name,
        '' as patient_last_name, '' as insurance_number, '' as date_of_birth, s.phone,
        NULL as reject_reason, NULL as medication_name
      FROM acute_slots s
      WHERE s.doctor_id = ? AND s.date >= ? AND s.date <= ? AND s.is_available = 0
      ORDER BY s.date ASC, s.time ASC
    `).all(doctorId, from, to) as any[];

    for (const slot of acuteSlots) {
      (slot as any).answers = [];
      allAppointments.push(slot);
    }

    // 3. Rezept-Abholungen
    const prescriptionPickups = db.prepare(`
      SELECT
        p.id, 'PRESCRIPTION' as source_type, 'PRESCRIPTION_PICKUP' as category,
        p.request_date as date, NULL as time, p.status, 'PATIENT' as booking_type, p.notes,
        NULL as series_id, NULL as series_dose_number, NULL as series_group_id,
        pat.id as patient_id, pat.first_name as patient_first_name, pat.last_name as patient_last_name,
        pat.insurance_number, pat.date_of_birth, pat.phone,
        CASE
          WHEN p.status = 'doctor_rejected' THEN p.doctor_rejection_reason
          WHEN p.status = 'mfa_rejected' THEN p.mfa_rejection_reason
          WHEN p.status = 'auto_rejected' THEN p.mfa_rejection_reason
          ELSE NULL
        END as reject_reason,
        p.medication_name
      FROM prescriptions p
      JOIN patients pat ON pat.id = p.patient_id
      WHERE p.responsible_doctor_id = ? AND p.request_date >= ? AND p.request_date <= ?
      ORDER BY p.request_date DESC
    `).all(doctorId, from, to) as any[];

    for (const rx of prescriptionPickups) {
      (rx as any).answers = [];
      allAppointments.push(rx);
    }

    allAppointments.sort((a: any, b: any) => {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      const timeA = a.time || '00:00';
      const timeB = b.time || '00:00';
      return timeA < timeB ? -1 : 1;
    });

    res.json({ success: true, data: allAppointments });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});
