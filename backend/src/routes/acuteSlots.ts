import { Router } from 'express';
import { getDb } from '../db/connection.ts';

export const acuteSlotsRouter = Router();

// ─── ARZT: Akutsprechstunde für ein Datum eintragen ──────────────────────

// GET /api/acute-slots/doctor-hours?doctorId=X&date=YYYY-MM-DD
acuteSlotsRouter.get('/acute-slots/doctor-hours', (req, res) => {
  try {
    const db = getDb();
    const doctorId = Number(req.query.doctorId);
    const date = req.query.date as string;
    if (!doctorId || !date) {
      res.status(400).json({ success: false, error: 'doctorId und date erforderlich' });
      return;
    }
    const hours = db.prepare(
      'SELECT id, doctor_id, date, start_time, end_time, slot_interval, max_slots, is_active FROM doctor_acute_hours WHERE doctor_id = ? AND date = ?'
    ).get(doctorId, date) || null;
    res.json({ success: true, data: hours });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// POST /api/acute-slots/doctor-hours – Akutsprechstunde speichern
acuteSlotsRouter.post('/acute-slots/doctor-hours', (req, res) => {
  try {
    const db = getDb();
    const { doctorId, date, startTime, endTime, slotInterval, isActive } = req.body;
    if (!doctorId || !date || !startTime || !endTime) {
      res.status(400).json({ success: false, error: 'doctorId, date, startTime und endTime erforderlich' });
      return;
    }
    // Automatische Berechnung von max_slots aus Startzeit, Endzeit und Intervall
    const interval = slotInterval || 30;
    const startParts = startTime.split(':').map(Number);
    const endParts = endTime.split(':').map(Number);
    const startMinutes = startParts[0] * 60 + startParts[1];
    const endMinutes = endParts[0] * 60 + endParts[1];
    const totalMinutes = endMinutes - startMinutes;
    const calculatedMaxSlots = totalMinutes > 0 && interval > 0 ? Math.floor(totalMinutes / interval) : 1;
    db.prepare(
      `INSERT INTO doctor_acute_hours (doctor_id, date, start_time, end_time, slot_interval, max_slots, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(doctor_id, date) DO UPDATE SET
         start_time = excluded.start_time,
         end_time = excluded.end_time,
         slot_interval = excluded.slot_interval,
         max_slots = excluded.max_slots,
         is_active = excluded.is_active,
         updated_at = datetime('now')`
    ).run(doctorId, date, startTime, endTime, interval, calculatedMaxSlots, isActive !== undefined ? (isActive ? 1 : 0) : 1);
    res.json({ success: true, data: { doctorId, date, max_slots: calculatedMaxSlots } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// ─── MFA: Akutslots für die MFA abrufen (automatisch generiert) ──────────

// GET /api/acute-slots?date=YYYY-MM-DD – Fertige Slots (on-demand generiert)
acuteSlotsRouter.get('/acute-slots', (req, res) => {
  try {
    const db = getDb();
    const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);

    // 1. Alle Ärzte holen, die für dieses Datum Akutsprechstunde haben
    const activeHours = db.prepare(
      `SELECT dah.*, d.first_name AS doctor_first_name, d.last_name AS doctor_last_name
       FROM doctor_acute_hours dah
       JOIN doctors d ON d.id = dah.doctor_id
       WHERE dah.date = ? AND dah.is_active = 1
       ORDER BY d.last_name, d.first_name`
    ).all(date) as any[];

    // 2. Für jeden Arzt Slots generieren, falls noch nicht vorhanden
    const allSlots: any[] = [];

    for (const hours of activeHours) {
      // Prüfen, ob bereits Slots für diesen Arzt & Datum existieren
      let existingSlots = db.prepare(
        `SELECT s.id, s.doctor_id, s.date, s.time, s.patient_id, s.patient_name, s.phone,
                s.booked_by_mfa_id, s.booked_at, s.is_available, s.notes
         FROM acute_slots s
         WHERE s.doctor_id = ? AND s.date = ?
         ORDER BY s.time`
      ).all(hours.doctor_id, date) as any[];

      // Slots immer neu generieren, falls Konfiguration geändert wurde
      // (z.B. andere Startzeit, Endzeit oder Intervall)
      const interval = hours.slot_interval || 30;
      const maxSlots = hours.max_slots || 5;
      const startParts = hours.start_time.split(':').map(Number);
      const endParts = hours.end_time.split(':').map(Number);
      const startMinutes = startParts[0] * 60 + startParts[1];
      const endMinutes = endParts[0] * 60 + endParts[1];
      const expectedCount = Math.floor((endMinutes - startMinutes) / interval);

      if (existingSlots.length !== expectedCount || existingSlots[0]?.time !== hours.start_time) {
        // Alte Slots löschen und neu generieren
        if (existingSlots.length > 0) {
          db.prepare('DELETE FROM acute_slots WHERE doctor_id = ? AND date = ?').run(hours.doctor_id, date);
        }
        existingSlots = [];
        let count = 0;

        for (let m = startMinutes; m < endMinutes && count < maxSlots; m += interval) {
          const h = Math.floor(m / 60);
          const min = m % 60;
          const time = String(h).padStart(2, '0') + ':' + String(min).padStart(2, '0');
          const result = db.prepare(
            'INSERT INTO acute_slots (doctor_id, date, time, is_available) VALUES (?, ?, ?, 1)'
          ).run(hours.doctor_id, date, time);
          existingSlots.push({
            id: result.lastInsertRowid,
            doctor_id: hours.doctor_id,
            date,
            time,
            patient_id: null,
            patient_name: null,
            phone: null,
            booked_by_mfa_id: null,
            booked_at: null,
            is_available: 1,
            notes: null
          });
          count++;
        }
      }

      for (const slot of existingSlots) {
        (slot as any).doctor_first_name = hours.doctor_first_name;
        (slot as any).doctor_last_name = hours.doctor_last_name;
        allSlots.push(slot);
      }
    }

    res.json({ success: true, data: { date, slots: allSlots } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// POST /api/acute-slots/:id/book – MFA bucht Slot
acuteSlotsRouter.post('/acute-slots/:id/book', (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    const { patientName, phone, bookedByMfaId, notes } = req.body;

    const slot = db.prepare('SELECT id, is_available FROM acute_slots WHERE id = ?').get(id) as any;
    if (!slot) { res.status(404).json({ success: false, error: 'Slot nicht gefunden' }); return; }
    if (!slot.is_available) { res.status(409).json({ success: false, error: 'Slot ist bereits vergeben' }); return; }

    const now = new Date().toISOString();
    db.prepare(
      `UPDATE acute_slots SET is_available = 0, patient_id = NULL, patient_name = ?, phone = ?,
       booked_by_mfa_id = ?, booked_at = ?, notes = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(patientName || null, phone || null, bookedByMfaId || null, now, notes || null, id);

    res.json({ success: true, data: { id, is_available: 0 } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});

// POST /api/acute-slots/:id/cancel – MFA storniert Buchung
acuteSlotsRouter.post('/acute-slots/:id/cancel', (req, res) => {
  try {
    const db = getDb();
    const id = Number(req.params.id);
    db.prepare(
      `UPDATE acute_slots SET is_available = 1, patient_id = NULL, patient_name = NULL, phone = NULL,
       booked_by_mfa_id = NULL, booked_at = NULL, updated_at = datetime('now') WHERE id = ?`
    ).run(id);
    res.json({ success: true, data: { id, is_available: 1 } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Datenbankfehler' });
  }
});


