export function isDoctorAbsent(db: any, doctorId: number, date: string): boolean {
  const absences = db.prepare(
    "SELECT type, doctor_ids FROM absences WHERE ? BETWEEN start_date AND end_date AND blocks_booking = 1"
  ).all(date) as { type: string; doctor_ids: string }[];

  return absences.some(function (a) {
    // FULL_PRACTICE blockiert immer alle Ärzte
    if (a.type === 'FULL_PRACTICE') return true;
    // Alle anderen Abwesenheitstypen (VACATION, SICKNESS, TRAINING, OTHER, SINGLE_DOCTOR)
    // blockieren den/die in doctor_ids gelisteten Arzt/Ärzte
    const ids = a.doctor_ids.split(',').map(Number);
    return ids.includes(doctorId);
  });
}
