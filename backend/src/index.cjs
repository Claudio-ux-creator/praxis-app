const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const DB_PATH = path.resolve(__dirname, '../prisma/praxis.db');
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const metaTable = '_prisma_migrations';
db.exec('CREATE TABLE IF NOT EXISTS ' + metaTable + ` (
  id TEXT PRIMARY KEY,
  checksum TEXT NOT NULL DEFAULT '',
  finished_at TEXT,
  migration_name TEXT NOT NULL,
  logs TEXT,
  rolled_back_at TEXT,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  applied_steps_count INTEGER NOT NULL DEFAULT 0
)`);

function runMigration(name, sql) {
  const existing = db.prepare('SELECT id FROM ' + metaTable + " WHERE id = ? AND finished_at IS NOT NULL").get(name);
  if (existing) return;
  db.exec('BEGIN TRANSACTION');
  db.prepare("INSERT OR REPLACE INTO " + metaTable + " (id, checksum, migration_name, started_at) VALUES (?, '', ?, datetime('now'))").run(name, name);
  db.exec(sql);
  db.prepare("UPDATE " + metaTable + " SET finished_at = datetime('now'), applied_steps_count = 1 WHERE id = ?").run(name);
  db.exec('COMMIT');
  console.log('Migration ' + name + ' erfolgreich ausgefuehrt.');
}

const migrationFile = path.resolve(__dirname, '../prisma/migrations/0001_init/migration.sql');
if (fs.existsSync(migrationFile)) {
  runMigration('0001_init', fs.readFileSync(migrationFile, 'utf-8'));
}

runMigration('0002_questionnaire_answers', `
  CREATE TABLE IF NOT EXISTS questionnaire_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id)
  );
`);

runMigration('0003_vaccination_series', `
  CREATE TABLE IF NOT EXISTS vaccination_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    doses INTEGER NOT NULL,
    intervals_days TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  INSERT OR IGNORE INTO vaccination_templates (id, name, description, doses, intervals_days) VALUES
    (1, 'FSME', 'Fruehsommer-Meningoenzephalitis - 3 Dosen (Tag 0, +28, +300)', 3, '0,28,300'),
    (2, 'Hepatitis B', 'Hepatitis-B-Grundimmunisierung - 3 Dosen (Tag 0, +30, +180)', 3, '0,30,180'),
    (3, 'HPV', 'Humane Papillomviren - 2 Dosen (Tag 0, +180)', 2, '0,180'),
    (4, 'COVID-19', 'COVID-19-Grundimmunisierung - 2 Dosen (Tag 0, +28)', 2, '0,28'),
    (5, 'Tetanus/Diphtherie', 'Tetanus-Diphtherie-Auffrischung - 1 Dosis', 1, '0');
`);

runMigration('0004_series_columns', `
  ALTER TABLE appointments ADD COLUMN series_id INTEGER REFERENCES vaccination_templates(id);
  ALTER TABLE appointments ADD COLUMN series_dose_number INTEGER;
  ALTER TABLE appointments ADD COLUMN series_group_id TEXT;
`);

runMigration('0005_reminders', `
  CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER NOT NULL,
    patient_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    channel TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    sent_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    FOREIGN KEY (patient_id) REFERENCES patients(id)
  );
`);

// -- Hilfsfunktionen -------------------------
function timeToMinutes(t) {
  const parts = t.split(':');
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}
function minutesToTime(m) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return String(h).padStart(2, '0') + ':' + String(min).padStart(2, '0');
}
function getTodayDate() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
function getCurrentMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}
function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
function generateUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}
// -- GET /api/health -------------------------
app.get('/api/health', (req, res) => {
  try {
    const patientCount = db.prepare('SELECT COUNT(*) as count FROM patients').get();
    const doctorCount = db.prepare('SELECT COUNT(*) as count FROM doctors').get();
    const appointmentCount = db.prepare('SELECT COUNT(*) as count FROM appointments').get();
    res.json({ success: true, data: { status: 'healthy', uptime: process.uptime(), timestamp: new Date().toISOString(), database: { connected: true, path: './prisma/praxis.db', patients: patientCount.count, doctors: doctorCount.count, appointments: appointmentCount.count } } });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// -- GET /api/doctors ------------------------
app.get('/api/doctors', (req, res) => {
  try { const doctors = db.prepare('SELECT id, first_name, last_name, color, acute_slots_per_day FROM doctors ORDER BY last_name, first_name').all(); res.json({ success: true, data: doctors }); }
  catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// -- GET /api/slots --------------------------
app.get('/api/slots', (req, res) => {
  try {
    const doctorId = Number(req.query.doctorId); const date = req.query.date; const category = req.query.category;
    if (!doctorId || !date || !category) { res.status(400).json({ success: false, error: 'doctorId, date und category sind erforderlich' }); return; }
    const config = db.prepare('SELECT online_bookable, default_duration_minutes, default_buffer_minutes FROM appointment_type_configs WHERE category = ?').get(category);
    if (!config) { res.status(400).json({ success: false, error: 'Unbekannte Terminkategorie' }); return; }
    if (!config.online_bookable) { res.status(400).json({ success: false, error: 'Diese Terminart kann nicht online gebucht werden' }); return; }
    const absences = db.prepare("SELECT type, doctor_ids FROM absences WHERE ? BETWEEN start_date AND end_date AND blocks_booking = 1").all(date);
    const isBlocked = absences.some(function(a) { if (a.type === 'FULL_PRACTICE') return true; if (a.type === 'SINGLE_DOCTOR') return a.doctor_ids.split(',').map(Number).includes(doctorId); return false; });
    if (isBlocked) { res.json({ success: true, data: { date, doctorId, category, slots: [] } }); return; }
    const durationMinutes = config.default_duration_minutes; const bufferMinutes = config.default_buffer_minutes; const slotDuration = durationMinutes + bufferMinutes;
    const existingRows = db.prepare("SELECT time FROM appointments WHERE doctor_id = ? AND date = ? AND status != 'CANCELLED'").all(doctorId, date);
    const bookedTimes = new Set(); for (let i = 0; i < existingRows.length; i++) { bookedTimes.add(existingRows[i].time); }
    const slots = []; const morningStart = timeToMinutes('08:00'); const morningEnd = timeToMinutes('12:00'); const afternoonStart = timeToMinutes('13:00'); const afternoonEnd = timeToMinutes('17:00');
    const today = getTodayDate(); const nowMinutes = getCurrentMinutes();
    function addSlots(start, end) { for (let m = start; m + slotDuration <= end; m += slotDuration) { const t = minutesToTime(m); if (!bookedTimes.has(t)) { if (date !== today || m > nowMinutes) { slots.push(t); } } } }
    addSlots(morningStart, morningEnd); addSlots(afternoonStart, afternoonEnd);
    res.json({ success: true, data: { date, doctorId, category, slots } });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// -- GET /api/slots/acute --------------------
app.get('/api/slots/acute', (req, res) => {
  try {
    const today = getTodayDate(); const nowMinutes = getCurrentMinutes();
    const doctors = db.prepare('SELECT id, first_name, last_name, color, acute_slots_per_day FROM doctors ORDER BY last_name, first_name').all();
    const bookedRows = db.prepare("SELECT doctor_id, COUNT(*) as count FROM appointments WHERE date = ? AND category = 'ACUTE' AND status != 'CANCELLED' GROUP BY doctor_id").all(today);
    const bookedMap = {}; for (let i = 0; i < bookedRows.length; i++) { bookedMap[bookedRows[i].doctor_id] = bookedRows[i].count; }
    const result = doctors.map(function(doc) {
      const total = doc.acute_slots_per_day; const used = bookedMap[doc.id] || 0; const remaining = total - used;
      const morningSlots = Math.max(0, Math.ceil(remaining / 2)); const afternoonSlots = Math.max(0, Math.floor(remaining / 2));
      return { doctorId: doc.id, doctorName: doc.first_name + ' ' + doc.last_name, doctorColor: doc.color, morningSlots: nowMinutes < timeToMinutes('12:00') ? morningSlots : (nowMinutes < timeToMinutes('17:00') ? afternoonSlots : 0), afternoonSlots: nowMinutes < timeToMinutes('12:00') ? afternoonSlots : 0, totalRemaining: Math.max(0, remaining) };
    });
    res.json({ success: true, data: result });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// -- GET /api/questions ----------------------
app.get('/api/questions', (req, res) => {
  try {
    const category = req.query.category;
    if (!category) { res.status(400).json({ success: false, error: 'category ist erforderlich' }); return; }
    const questions = db.prepare('SELECT id, category, question_text, sort_order, answer_type, required FROM questions WHERE category = ? ORDER BY sort_order').all(category);
    res.json({ success: true, data: questions });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// -- POST /api/patients/lookup ---------------
app.post('/api/patients/lookup', (req, res) => {
  try {
    const { insuranceNumber, dateOfBirth } = req.body;
    if (!insuranceNumber) { res.status(400).json({ success: false, error: 'insuranceNumber ist erforderlich' }); return; }
    let patient;
    if (dateOfBirth) { patient = db.prepare('SELECT id, insurance_number, first_name, last_name, date_of_birth, phone, email, email_opt_in, no_show_count, last_consultation FROM patients WHERE insurance_number = ? AND date_of_birth = ?').get(insuranceNumber, dateOfBirth); }
    else { patient = db.prepare('SELECT id, insurance_number, first_name, last_name, date_of_birth, phone, email, email_opt_in, no_show_count, last_consultation FROM patients WHERE insurance_number = ?').get(insuranceNumber); }
    if (!patient) { res.status(404).json({ success: false, error: 'Patient nicht gefunden' }); return; }
    res.json({ success: true, data: patient });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// -- POST /api/appointments ------------------
app.post('/api/appointments', (req, res) => {
  try {
    const { insuranceNumber, doctorId, date, time, category, answers } = req.body;
    if (!insuranceNumber || !doctorId || !date || !time || !category) { res.status(400).json({ success: false, error: 'insuranceNumber, doctorId, date, time und category sind erforderlich' }); return; }
    const patient = db.prepare('SELECT id, no_show_count FROM patients WHERE insurance_number = ?').get(insuranceNumber);
    if (!patient) { res.status(404).json({ success: false, error: 'Patient nicht gefunden' }); return; }
    if (patient.no_show_count >= 3) { res.status(403).json({ success: false, error: 'Sie haben zu viele Termine versaeumt. Bitte kontaktieren Sie die Praxis telefonisch.' }); return; }
    const config = db.prepare('SELECT online_bookable, default_duration_minutes, default_buffer_minutes FROM appointment_type_configs WHERE category = ?').get(category);
    if (!config) { res.status(400).json({ success: false, error: 'Unbekannte Terminkategorie' }); return; }
    const today = getTodayDate();
    if (category === 'ACUTE') {
      if (date !== today) { res.status(400).json({ success: false, error: 'Akuttermine koennen nur fuer heute gebucht werden' }); return; }
      const doctor = db.prepare('SELECT acute_slots_per_day FROM doctors WHERE id = ?').get(doctorId);
      const bookedCount = db.prepare("SELECT COUNT(*) as count FROM appointments WHERE doctor_id = ? AND date = ? AND category = 'ACUTE' AND status != 'CANCELLED'").get(doctorId, today);
      if (bookedCount.count >= doctor.acute_slots_per_day) { res.status(400).json({ success: false, error: 'Heute sind keine Akutslots mehr bei diesem Arzt verfuegbar' }); return; }
    } else { if (!config.online_bookable) { res.status(400).json({ success: false, error: 'Diese Terminart kann nicht online gebucht werden' }); return; } }
    const existing = db.prepare("SELECT id FROM appointments WHERE doctor_id = ? AND date = ? AND time = ? AND status != 'CANCELLED'").get(doctorId, date, time);
    if (existing) { res.status(409).json({ success: false, error: 'Dieser Slot ist bereits belegt' }); return; }
    const result = db.prepare("INSERT INTO appointments (patient_id, doctor_id, category, date, time, status, booking_type, buffer_minutes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'SCHEDULED', 'ONLINE', ?, datetime('now'), datetime('now'))").run(patient.id, doctorId, category, date, time, config.default_buffer_minutes || 5);
    const appointmentId = result.lastInsertRowid;
    if (answers && Array.isArray(answers) && answers.length > 0) {
      const insertAnswer = db.prepare("INSERT INTO questionnaire_answers (appointment_id, question_id, question_text, answer, created_at) VALUES (?, ?, ?, ?, datetime('now'))");
      for (let i = 0; i < answers.length; i++) { const a = answers[i]; insertAnswer.run(appointmentId, a.questionId, a.questionText, String(a.answer)); }
    }
    const appointment = db.prepare('SELECT id, patient_id, doctor_id, category, date, time, status, booking_type, buffer_minutes, created_at FROM appointments WHERE id = ?').get(appointmentId);
    res.status(201).json({ success: true, data: { appointment, patient: { id: patient.id, insuranceNumber, noShowCount: patient.no_show_count } } });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// -- GET /api/appointments -------------------
app.get('/api/appointments', (req, res) => {
  try {
    const insuranceNumber = req.query.insuranceNumber;
    if (!insuranceNumber) { res.status(400).json({ success: false, error: 'insuranceNumber ist erforderlich' }); return; }
    const patient = db.prepare('SELECT id FROM patients WHERE insurance_number = ?').get(insuranceNumber);
    if (!patient) { res.status(404).json({ success: false, error: 'Patient nicht gefunden' }); return; }
    const appointments = db.prepare('SELECT a.id, a.patient_id, a.doctor_id, a.category, a.date, a.time, a.status, a.booking_type, a.mfa_note, a.buffer_minutes, a.created_at, a.series_id, a.series_dose_number, a.series_group_id, d.first_name AS doctor_first_name, d.last_name AS doctor_last_name FROM appointments a JOIN doctors d ON d.id = a.doctor_id WHERE a.patient_id = ? ORDER BY a.date DESC, a.time DESC').all(patient.id);
    res.json({ success: true, data: appointments });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// -- GET /api/vaccination-series -------------
app.get('/api/vaccination-series', (req, res) => {
  try { const templates = db.prepare('SELECT * FROM vaccination_templates ORDER BY id').all(); res.json({ success: true, data: templates }); }
  catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// -- POST /api/appointments/series -----------
app.post('/api/appointments/series', (req, res) => {
  try {
    const { insuranceNumber, doctorId, startDate, startTime, seriesId, answers } = req.body;
    if (!insuranceNumber || !doctorId || !startDate || !startTime || !seriesId) { res.status(400).json({ success: false, error: 'Pflichtfelder fehlen' }); return; }
    const patient = db.prepare('SELECT id, no_show_count FROM patients WHERE insurance_number = ?').get(insuranceNumber);
    if (!patient) { res.status(404).json({ success: false, error: 'Patient nicht gefunden' }); return; }
    if (patient.no_show_count >= 3) { res.status(403).json({ success: false, error: 'Zu viele versaeumte Termine' }); return; }
    const template = db.prepare('SELECT * FROM vaccination_templates WHERE id = ?').get(seriesId);
    if (!template) { res.status(404).json({ success: false, error: 'Impfserie nicht gefunden' }); return; }
    const intervals = template.intervals_days.split(',').map(Number);
    const dates = []; for (let i = 0; i < template.doses; i++) { const doseDate = addDays(startDate, intervals[i] || 0); dates.push({ date: doseDate, time: startTime, doseNumber: i + 1 }); }
    const first = dates[0]; if (db.prepare("SELECT id FROM appointments WHERE doctor_id = ? AND date = ? AND time = ? AND status != 'CANCELLED'").get(doctorId, first.date, first.time)) { res.status(409).json({ success: false, error: 'Startslot bereits belegt' }); return; }
    const seriesGroupId = generateUuid(); const created = [];
    for (let i = 0; i < dates.length; i++) {
      const d = dates[i]; const status = i === 0 ? 'SCHEDULED' : 'PENDING_CONFIRMATION';
      const result = db.prepare("INSERT INTO appointments (patient_id, doctor_id, category, date, time, status, booking_type, buffer_minutes, series_id, series_dose_number, series_group_id, created_at, updated_at) VALUES (?, ?, 'VACCINATION', ?, ?, ?, 'ONLINE', 5, ?, ?, ?, datetime('now'), datetime('now'))").run(patient.id, doctorId, d.date, d.time, status, seriesId, d.doseNumber, seriesGroupId);
      created.push(db.prepare('SELECT * FROM appointments WHERE id = ?').get(result.lastInsertRowid));
    }
    if (answers && Array.isArray(answers) && answers.length > 0) {
      const insertAnswer = db.prepare("INSERT INTO questionnaire_answers (appointment_id, question_id, question_text, answer, created_at) VALUES (?, ?, ?, ?, datetime('now'))");
      for (const a of answers) { insertAnswer.run(created[0].id, a.questionId, a.questionText, String(a.answer)); }
    }
    res.status(201).json({ success: true, data: { seriesGroupId, appointments: created } });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// -- PATCH /api/appointments/:id/confirm-series --
app.patch('/api/appointments/:id/confirm-series', (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = db.prepare("SELECT id, date, time, doctor_id FROM appointments WHERE id = ? AND status = 'PENDING_CONFIRMATION'").get(id);
    if (!existing) { res.status(404).json({ success: false, error: 'Termin nicht gefunden oder nicht im Status PENDING_CONFIRMATION' }); return; }
    if (db.prepare("SELECT id FROM appointments WHERE doctor_id = ? AND date = ? AND time = ? AND status != 'CANCELLED' AND id != ?").get(existing.doctor_id, existing.date, existing.time, id)) { res.status(409).json({ success: false, error: 'Slot inzwischen belegt' }); return; }
    db.prepare("UPDATE appointments SET status = 'SCHEDULED', updated_at = datetime('now') WHERE id = ?").run(id);
    const updated = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// -- GET /api/mfa/dashboard -------------------
app.get('/api/mfa/dashboard', (req, res) => {
  try {
    const today = getTodayDate();
    const todaysAppointments = db.prepare("SELECT a.id, a.patient_id, a.doctor_id, a.category, a.date, a.time, a.status, a.booking_type, a.mfa_note, a.buffer_minutes, p.insurance_number, p.first_name AS patient_first_name, p.last_name AS patient_last_name, p.date_of_birth, p.phone, p.no_show_count, d.first_name AS doctor_first_name, d.last_name AS doctor_last_name, d.color AS doctor_color FROM appointments a JOIN patients p ON p.id = a.patient_id JOIN doctors d ON d.id = a.doctor_id WHERE a.date = ? ORDER BY a.time ASC").all(today);
    const pendingPrescriptions = db.prepare("SELECT pr.id, pr.patient_id, pr.medication_name, pr.dosage, pr.notes, pr.initiated_by_mfa_id, pr.responsible_doctor_id, pr.status, pr.request_date, pr.approved_date, p.insurance_number, p.first_name AS patient_first_name, p.last_name AS patient_last_name, p.phone, d.first_name AS doctor_first_name, d.last_name AS doctor_last_name FROM prescriptions pr JOIN patients p ON p.id = pr.patient_id JOIN doctors d ON d.id = pr.responsible_doctor_id WHERE pr.status IN ('PENDING', 'IN_PROGRESS', 'APPROVED') ORDER BY CASE pr.status WHEN 'PENDING' THEN 1 WHEN 'IN_PROGRESS' THEN 2 WHEN 'APPROVED' THEN 3 END, pr.request_date DESC").all();
    const doctors = db.prepare('SELECT id, first_name, last_name, color, acute_slots_per_day FROM doctors ORDER BY last_name, first_name').all();
    const bookedRows = db.prepare("SELECT doctor_id, COUNT(*) as count FROM appointments WHERE date = ? AND category = 'ACUTE' AND status != 'CANCELLED' GROUP BY doctor_id").all(today);
    const bookedMap = {}; for (let i = 0; i < bookedRows.length; i++) { bookedMap[bookedRows[i].doctor_id] = bookedRows[i].count; }
    const acuteSlotInfo = doctors.map(function(doc) { const total = doc.acute_slots_per_day; const used = bookedMap[doc.id] || 0; return { doctorId: doc.id, doctorName: doc.first_name + ' ' + doc.last_name, doctorColor: doc.color, totalSlots: total, usedSlots: used, remainingSlots: Math.max(0, total - used) }; });
    res.json({ success: true, data: { date: today, todaysAppointments, pendingPrescriptions, acuteSlotInfo } });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// -- PATCH /api/appointments/:id/status --------
app.patch('/api/appointments/:id/status', (req, res) => {
  try {
    const id = Number(req.params.id); const { status } = req.body;
    const validStatuses = ['SCHEDULED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
    if (!validStatuses.includes(status)) { res.status(400).json({ success: false, error: 'Ungueltiger Status' }); return; }
    const existing = db.prepare('SELECT id, patient_id FROM appointments WHERE id = ?').get(id);
    if (!existing) { res.status(404).json({ success: false, error: 'Termin nicht gefunden' }); return; }
    if (status === 'NO_SHOW') { db.prepare('UPDATE patients SET no_show_count = no_show_count + 1 WHERE id = ?').run(existing.patient_id); }
    db.prepare("UPDATE appointments SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
    const updated = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// -- PATCH /api/appointments/:id/note ----------
app.patch('/api/appointments/:id/note', (req, res) => {
  try {
    const id = Number(req.params.id); const { note } = req.body;
    const existing = db.prepare('SELECT id FROM appointments WHERE id = ?').get(id);
    if (!existing) { res.status(404).json({ success: false, error: 'Termin nicht gefunden' }); return; }
    db.prepare("UPDATE appointments SET mfa_note = ?, updated_at = datetime('now') WHERE id = ?").run(note || null, id);
    const updated = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// -- GET /api/prescriptions --------------------
app.get('/api/prescriptions', (req, res) => {
  try {
    const status = req.query.status; let rows;
    if (status) { rows = db.prepare("SELECT pr.*, p.first_name AS patient_first_name, p.last_name AS patient_last_name, p.insurance_number, d.first_name AS doctor_first_name, d.last_name AS doctor_last_name FROM prescriptions pr JOIN patients p ON p.id = pr.patient_id JOIN doctors d ON d.id = pr.responsible_doctor_id WHERE pr.status = ? ORDER BY pr.request_date DESC").all(status); }
    else { rows = db.prepare("SELECT pr.*, p.first_name AS patient_first_name, p.last_name AS patient_last_name, p.insurance_number, d.first_name AS doctor_first_name, d.last_name AS doctor_last_name FROM prescriptions pr JOIN patients p ON p.id = pr.patient_id JOIN doctors d ON d.id = pr.responsible_doctor_id ORDER BY pr.request_date DESC").all(); }
    res.json({ success: true, data: rows });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// -- POST /api/prescriptions -------------------
app.post('/api/prescriptions', (req, res) => {
  try {
    const { insuranceNumber, medicationName, dosage, notes, initiatedByMfaId, responsibleDoctorId } = req.body;
    if (!insuranceNumber || !medicationName || !initiatedByMfaId || !responsibleDoctorId) { res.status(400).json({ success: false, error: 'Pflichtfelder fehlen' }); return; }
    const patient = db.prepare('SELECT id FROM patients WHERE insurance_number = ?').get(insuranceNumber);
    if (!patient) { res.status(404).json({ success: false, error: 'Patient nicht gefunden' }); return; }
    const today = getTodayDate();
    const result = db.prepare("INSERT INTO prescriptions (patient_id, medication_name, dosage, notes, initiated_by_mfa_id, responsible_doctor_id, status, request_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'IN_PROGRESS', ?, datetime('now'), datetime('now'))").run(patient.id, medicationName, dosage || null, notes || null, initiatedByMfaId, responsibleDoctorId, today);
    const created = db.prepare('SELECT * FROM prescriptions WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: created });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// -- PATCH /api/prescriptions/:id/status -------
app.patch('/api/prescriptions/:id/status', (req, res) => {
  try {
    const id = Number(req.params.id); const { status } = req.body;
    if (!['PENDING','IN_PROGRESS','APPROVED','REJECTED','COLLECTED'].includes(status)) { res.status(400).json({ success: false, error: 'Ungueltiger Status' }); return; }
    const existing = db.prepare('SELECT id FROM prescriptions WHERE id = ?').get(id);
    if (!existing) { res.status(404).json({ success: false, error: 'Rezept nicht gefunden' }); return; }
    if (status === 'APPROVED' || status === 'REJECTED') { db.prepare("UPDATE prescriptions SET status = ?, approved_date = ?, updated_at = datetime('now') WHERE id = ?").run(status, getTodayDate(), id); }
    else { db.prepare("UPDATE prescriptions SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id); }
    const updated = db.prepare('SELECT * FROM prescriptions WHERE id = ?').get(id); res.json({ success: true, data: updated });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// -- REMINDER-ENDPUNKTE ----------------------

// GET /api/reminders/pending
app.get('/api/reminders/pending', (req, res) => {
  try {
    const rows = db.prepare("SELECT r.id, r.appointment_id, r.patient_id, r.type, r.channel, r.status, r.sent_at, r.created_at, a.date AS appointment_date, a.time AS appointment_time, a.category, p.first_name AS patient_first_name, p.last_name AS patient_last_name, p.phone, p.email, d.first_name AS doctor_first_name, d.last_name AS doctor_last_name FROM reminders r JOIN appointments a ON a.id = r.appointment_id JOIN patients p ON p.id = r.patient_id JOIN doctors d ON d.id = a.doctor_id WHERE r.status = 'PENDING' ORDER BY r.created_at ASC").all();
    res.json({ success: true, data: rows });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// POST /api/reminders/process
app.post('/api/reminders/process', (req, res) => {
  try {
    const tomorrowDate = new Date(); tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = tomorrowDate.getFullYear() + '-' + String(tomorrowDate.getMonth()+1).padStart(2,'0') + '-' + String(tomorrowDate.getDate()).padStart(2,'0');
    const stats = { generated: 0, alreadyExisting: 0, sent: 0 };
    const tomorrowAppointments = db.prepare("SELECT a.id, a.patient_id, p.email, p.email_opt_in, p.phone FROM appointments a JOIN patients p ON p.id = a.patient_id WHERE a.date = ? AND a.status = 'SCHEDULED'").all(tomorrow);
    for (const apt of tomorrowAppointments) {
      if (db.prepare("SELECT id FROM reminders WHERE appointment_id = ? AND type = '24H'").get(apt.id)) { stats.alreadyExisting++; continue; }
      let channel = null;
      if (apt.email_opt_in && apt.email) channel = 'EMAIL';
      if (channel) { db.prepare("INSERT INTO reminders (appointment_id, patient_id, type, channel, status, created_at) VALUES (?, ?, '24H', ?, 'PENDING', datetime('now'))").run(apt.id, apt.patient_id, channel); stats.generated++; }
    }
    const pending = db.prepare("SELECT id FROM reminders WHERE status = 'PENDING'").all();
    for (const r of pending) { db.prepare("UPDATE reminders SET status = 'SENT', sent_at = datetime('now') WHERE id = ?").run(r.id); stats.sent++; }
    res.json({ success: true, data: { message: 'Erinnerungen verarbeitet', stats, timestamp: new Date().toISOString() } });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// GET /api/reminders/dashboard
app.get('/api/reminders/dashboard', (req, res) => {
  try {
    const today = getTodayDate();
    const sentToday = db.prepare("SELECT COUNT(*) as count FROM reminders WHERE date(sent_at) = ?").get(today);
    const pending = db.prepare("SELECT COUNT(*) as count FROM reminders WHERE status = 'PENDING'").get();
    const recent = db.prepare("SELECT r.id, r.type, r.channel, r.status, r.sent_at, r.created_at, a.date AS appointment_date, a.time AS appointment_time, p.first_name AS patient_first_name, p.last_name AS patient_last_name FROM reminders r JOIN appointments a ON a.id = r.appointment_id JOIN patients p ON p.id = r.patient_id ORDER BY r.created_at DESC LIMIT 50").all();
    res.json({ success: true, data: { today, sentToday: sentToday.count, pendingCount: pending.count, recent } });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// GET /api/patients/:id/reminder-settings
app.get('/api/patients/:id/reminder-settings', (req, res) => {
  try {
    const id = Number(req.params.id);
    const patient = db.prepare('SELECT id, email, email_opt_in, phone FROM patients WHERE id = ?').get(id);
    if (!patient) { res.status(404).json({ success: false, error: 'Patient nicht gefunden' }); return; }
    res.json({ success: true, data: patient });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// PATCH /api/patients/:id/reminder-settings
app.patch('/api/patients/:id/reminder-settings', (req, res) => {
  try {
    const id = Number(req.params.id); const { email, emailOptIn } = req.body;
    if (!db.prepare('SELECT id FROM patients WHERE id = ?').get(id)) { res.status(404).json({ success: false, error: 'Patient nicht gefunden' }); return; }
    if (email !== undefined && emailOptIn !== undefined) { db.prepare('UPDATE patients SET email = ?, email_opt_in = ?, updated_at = datetime(\'now\') WHERE id = ?').run(email, emailOptIn ? 1 : 0, id); }
    else if (email !== undefined) { db.prepare('UPDATE patients SET email = ?, updated_at = datetime(\'now\') WHERE id = ?').run(email, id); }
    else if (emailOptIn !== undefined) { db.prepare('UPDATE patients SET email_opt_in = ?, updated_at = datetime(\'now\') WHERE id = ?').run(emailOptIn ? 1 : 0, id); }
    const updated = db.prepare('SELECT id, email, email_opt_in, phone FROM patients WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// -- Server start ----------------------------
app.listen(3000, '0.0.0.0', () => {
  console.log('Server laeuft auf http://localhost:3000');
});
