-- CreateIndex
CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    insurance_number TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    email_opt_in INTEGER NOT NULL DEFAULT 0,
    last_consultation TEXT,
    no_show_count INTEGER NOT NULL DEFAULT 0,
    parent_account_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (parent_account_id) REFERENCES patients(id)
);

CREATE TABLE IF NOT EXISTS doctors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    color TEXT,
    acute_slots_per_day INTEGER NOT NULL DEFAULT 3,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'SCHEDULED',
    booking_type TEXT NOT NULL DEFAULT 'ONLINE',
    mfa_note TEXT,
    buffer_minutes INTEGER NOT NULL DEFAULT 5,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

CREATE TABLE IF NOT EXISTS prescriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    medication_name TEXT NOT NULL,
    dosage TEXT,
    notes TEXT,
    initiated_by_mfa_id INTEGER NOT NULL,
    responsible_doctor_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    request_date TEXT NOT NULL,
    approved_date TEXT,
    pickup_appointment_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (patient_id) REFERENCES patients(id)
);

CREATE TABLE IF NOT EXISTS absences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    doctor_ids TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    reason TEXT,
    blocks_booking INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT NOT NULL,
    doctor_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    question_text TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    answer_type TEXT NOT NULL DEFAULT 'text',
    required INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS appointment_type_configs (
    category TEXT NOT NULL PRIMARY KEY,
    name TEXT NOT NULL,
    online_bookable INTEGER NOT NULL DEFAULT 1,
    default_duration_minutes INTEGER NOT NULL DEFAULT 20,
    default_buffer_minutes INTEGER NOT NULL DEFAULT 5,
    max_questions INTEGER NOT NULL DEFAULT 5
);

-- Seed: Appointment Type Configs
INSERT OR IGNORE INTO appointment_type_configs (category, name, online_bookable, default_duration_minutes, default_buffer_minutes, max_questions)
VALUES
    ('CHECKUP', 'Vorsorge', 1, 20, 5, 5),
    ('CONSULTATION', 'Beratung', 1, 15, 5, 5),
    ('VACCINATION', 'Impfung', 1, 15, 5, 5),
    ('PRESCRIPTION_PICKUP', 'Rezept-Abholung', 1, 5, 0, 0),
    ('ACUTE', 'Akuttermin', 0, 10, 5, 0),
    ('BLOOD_DRAW', 'Blutabnahme', 0, 10, 5, 0),
    ('INITIAL', 'Erstgespraech', 0, 30, 10, 0);

-- Seed: Doctors
INSERT OR IGNORE INTO doctors (id, first_name, last_name, color, acute_slots_per_day)
VALUES
    (1, 'Ahmet', 'Demir', '#2563eb', 3),
    (2, 'Fatma', 'Demir', '#7c3aed', 4),
    (3, 'Mehmet', 'Kollegen', '#059669', 3);

-- Seed: Staff
INSERT OR IGNORE INTO staff (first_name, last_name, role, doctor_id)
VALUES
    ('Ayşe', 'Yılmaz', 'MFA', NULL),
    ('Ali', 'Kaya', 'MFA', NULL),
    ('Aylin', 'Demir', 'DOCTOR', 1),
    ('Fatma', 'Demir', 'DOCTOR', 2),
    ('Mehmet', 'Kollegen', 'DOCTOR', 3);

-- Seed: Sample questions for CHECKUP
INSERT OR IGNORE INTO questions (category, question_text, sort_order, answer_type, required)
VALUES
    ('CHECKUP', 'Haben Sie in den letzten 12 Monaten einen Arzt aufgesucht?', 1, 'boolean', 1),
    ('CHECKUP', 'Nehmen Sie regelmaessig Medikamente?', 2, 'boolean', 1),
    ('CHECKUP', 'Haben Sie Allergien?', 3, 'boolean', 1),
    ('CHECKUP', 'Wenn ja, welche Allergien?', 4, 'text', 0),
    ('CHECKUP', 'Haben Sie Beschwerden, die Sie besprechen moechten?', 5, 'text', 0);

INSERT OR IGNORE INTO questions (category, question_text, sort_order, answer_type, required)
VALUES
    ('CONSULTATION', 'Was ist der Grund Ihrer Beratung?', 1, 'text', 1),
    ('CONSULTATION', 'Bestehen akute Beschwerden?', 2, 'boolean', 1),
    ('CONSULTATION', 'Sind Sie in aerztlicher Behandlung?', 3, 'boolean', 1);

INSERT OR IGNORE INTO questions (category, question_text, sort_order, answer_type, required)
VALUES
    ('VACCINATION', 'Welche Impfung ist gewuenscht?', 1, 'text', 1),
    ('VACCINATION', 'Haben Sie frueher bereits diese Impfung erhalten?', 2, 'boolean', 1),
    ('VACCINATION', 'Besteht eine bekannte Allergie?', 3, 'boolean', 1);

-- Seed: Sample patient
INSERT OR IGNORE INTO patients (id, insurance_number, first_name, last_name, date_of_birth, phone, email, email_opt_in)
VALUES (1, 'A123456789', 'Max', 'Mustermann', '1990-05-15', '+49 176 12345678', 'max@example.com', 1);



