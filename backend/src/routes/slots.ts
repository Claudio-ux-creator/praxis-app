import { Router } from 'express';
import { getDb } from '../db/connection.ts';

export const slotsRouter = Router();

function timeToMinutes(time: string): number {
  const parts = time.split(':');
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

function getTodayDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

function getCurrentMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

// -- Normale online-buchbare Slots ----------
slotsRouter.get('/slots', (req, res) => {
  try {
    const db = getDb();
    const doctorId = Number(req.query.doctorId);
    const date = req.query.date as string;
    const category = req.query.category as string;

    if (!doctorId || !date || !category) {
      res.status(400).json({ success: false, error: 'doctorId, date und category sind erforderlich' });
      return;
    }

    // Prüfen, ob Kategorie online buchbar ist
    const config = db.prepare(
      'SELECT online_bookable, default_duration_minutes, default_buffer_minutes FROM appointment_type_configs WHERE category = ?'
    ).get(category) as {
      online_bookable: number;
      default_duration_minutes: number;
      default_buffer_minutes: number;
    } | undefined;

    if (!config) {
      res.status(400).json({ success: false, error: 'Unbekannte Terminkategorie' });
      return;
    }

    if (!config.online_bookable) {
      res.status(400).json({ success: false, error: 'Diese Terminart kann nicht online gebucht werden' });
      return;
    }

    // Praxis- oder Arzt-spezifische Schließung prüfen
    const absences = db.prepare(
      "SELECT type, doctor_ids FROM absences WHERE ? BETWEEN start_date AND end_date AND blocks_booking = 1"
    ).all(date) as { type: string; doctor_ids: string }[];

    const isBlocked = absences.some(function (a) {
      if (a.type === 'FULL_PRACTICE') return true;
      if (a.type === 'SINGLE_DOCTOR') {
        return a.doctor_ids.split(',').map(Number).includes(doctorId);
      }
      return false;
    });

    if (isBlocked) {
      res.json({ success: true, data: { date, doctorId, category, slots: [] } });
      return;
    }

    const durationMinutes = config.default_duration_minutes;
    const bufferMinutes = config.default_buffer_minutes;
    const slotDuration = durationMinutes + bufferMinutes;

    // Bereits belegte Slots abrufen
    const existingRows = db.prepare(
      "SELECT time FROM appointments WHERE doctor_id = ? AND date = ? AND status != 'CANCELLED'"
    ).all(doctorId, date) as { time: string }[];

    const bookedTimes = new Set<string>();
    for (let i = 0; i < existingRows.length; i++) {
      bookedTimes.add(existingRows[i].time);
    }

    // Slots erzeugen (08:00–12:00, 13:00–17:00)
    const slots: string[] = [];
    const morningStart = timeToMinutes('08:00');
    const morningEnd = timeToMinutes('12:00');
    const afternoonStart = timeToMinutes('13:00');
    const afternoonEnd = timeToMinutes('17:00');

    const today = getTodayDate();
    const nowMinutes = getCurrentMinutes();

    function addSlots(start: number, end: number) {
      for (let m = start; m + slotDuration <= end; m += slotDuration) {
        const t = minutesToTime(m);
        if (!bookedTimes.has(t)) {
          // Für heute: nur zukünftige Slots anzeigen
          if (date !== today || m > nowMinutes) {
            slots.push(t);
          }
        }
      }
    }

    addSlots(morningStart, morningEnd);
    addSlots(afternoonStart, afternoonEnd);

    res.json({
      success: true,
      data: { date, doctorId, category, slots },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Datenbankfehler',
    });
  }
});

// -- Akutslots (nur heute, ab 07:00) --------
slotsRouter.get('/slots/acute', (req, res) => {
  try {
    const db = getDb();
    const today = getTodayDate();
    const nowMinutes = getCurrentMinutes();

    // Alle Ärzte mit ihren Akutslot-Kontingenten
    const doctors = db.prepare(
      'SELECT id, first_name, last_name, color, acute_slots_per_day FROM doctors ORDER BY last_name, first_name'
    ).all() as { id: number; first_name: string; last_name: string; color: string | null; acute_slots_per_day: number }[];

    // Heute bereits gebuchte Akutslots pro Arzt zählen
    const bookedRows = db.prepare(
      "SELECT doctor_id, COUNT(*) as count FROM appointments WHERE date = ? AND category = 'ACUTE' AND status != 'CANCELLED' GROUP BY doctor_id"
    ).all(today) as { doctor_id: number; count: number }[];

    const bookedMap: Record<number, number> = {};
    for (let i = 0; i < bookedRows.length; i++) {
      bookedMap[bookedRows[i].doctor_id] = bookedRows[i].count;
    }

    const result = doctors.map(function (doc) {
      const total = doc.acute_slots_per_day;
      const used = bookedMap[doc.id] || 0;

      // Zwei Hälften: Vormittag (07:00–12:00) und Nachmittag (13:00–17:00)
      const morningSlots = Math.max(0, Math.ceil((total - used) / 2));
      const afternoonSlots = Math.max(0, Math.floor((total - used) / 2));

      // Für heute: bereits vergangene Hälften leeren
      const finalMorning = nowMinutes < timeToMinutes('12:00') ? morningSlots : 0;
      const finalAfternoon = nowMinutes < timeToMinutes('17:00') ? afternoonSlots : 0;

      return {
        doctorId: doc.id,
        doctorName: doc.first_name + ' ' + doc.last_name,
        doctorColor: doc.color,
        morningSlots: finalMorning,
        afternoonSlots: finalAfternoon,
        totalRemaining: (finalMorning + finalAfternoon),
      };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Datenbankfehler',
    });
  }
});