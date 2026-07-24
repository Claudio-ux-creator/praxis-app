// Schwellenwerte für Warnung/Sperrung bei wiederholtem Nichterscheinen
const WARNING_THRESHOLD = 2;
const BLOCK_THRESHOLD = 3;

export function getTodayDate(): string {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// Markiert alle vergangenen, nicht abgeschlossenen/abgesagten Termine als NO_SHOW und erhöht den
// No-Show-Zähler des Patienten. Ein Termin gilt als No-Show, wenn sein Tag bereits vorbei ist und
// der Status weder COMPLETED noch CANCELLED (rechtzeitige Absage) ist.
export function runNoShowCheck(db: any): { checked: number; markedNoShow: number; warnings: number; blocked: number } {
  const today = getTodayDate();

  const staleAppointments = db.prepare(
    "SELECT id, patient_id, date, time FROM appointments WHERE date < ? AND status NOT IN ('COMPLETED', 'CANCELLED', 'NO_SHOW')"
  ).all(today) as { id: number; patient_id: number; date: string; time: string }[];

  let warnings = 0;
  let blocked = 0;

  const markNoShow = db.prepare("UPDATE appointments SET status = 'NO_SHOW', updated_at = datetime('now') WHERE id = ?");
  const logHistory = db.prepare(
    "INSERT INTO appointment_history (appointment_id, patient_id, action, changed_by_type, old_status, new_status, reason) VALUES (?, ?, 'NO_SHOW', 'system', ?, 'NO_SHOW', 'Automatisch erkannt: Termin ohne rechtzeitige Absage nicht wahrgenommen')"
  );
  const incrementCount = db.prepare('UPDATE patients SET no_show_count = no_show_count + 1 WHERE id = ?');
  const getPatient = db.prepare('SELECT no_show_count, no_show_warning_sent, is_blocked FROM patients WHERE id = ?');
  const setWarningSent = db.prepare('UPDATE patients SET no_show_warning_sent = 1 WHERE id = ?');
  const setBlocked = db.prepare('UPDATE patients SET is_blocked = 1 WHERE id = ?');
  const notifyPatient = db.prepare(
    "INSERT INTO patient_notifications (patient_id, type, title, message) VALUES (?, ?, ?, ?)"
  );

  for (const appt of staleAppointments) {
    markNoShow.run(appt.id);
    logHistory.run(appt.id, appt.patient_id, 'SCHEDULED');
    incrementCount.run(appt.patient_id);

    const patient = getPatient.get(appt.patient_id) as { no_show_count: number; no_show_warning_sent: number; is_blocked: number };

    if (patient.no_show_count >= BLOCK_THRESHOLD && !patient.is_blocked) {
      setBlocked.run(appt.patient_id);
      notifyPatient.run(
        appt.patient_id,
        'NO_SHOW_BLOCKED',
        'Online-Buchung gesperrt',
        'Sie können derzeit keine Termine online buchen. Bitte wenden Sie sich telefonisch an die Praxis.'
      );
      blocked++;
    } else if (patient.no_show_count >= WARNING_THRESHOLD && !patient.no_show_warning_sent) {
      setWarningSent.run(appt.patient_id);
      notifyPatient.run(
        appt.patient_id,
        'NO_SHOW_WARNING',
        'Hinweis: Wiederholtes Nichterscheinen',
        'Sie haben bereits zweimal einen Termin nicht wahrgenommen. Bitte sagen Sie zukünftig rechtzeitig ab.'
      );
      warnings++;
    }
  }

  return { checked: staleAppointments.length, markedNoShow: staleAppointments.length, warnings, blocked };
}
