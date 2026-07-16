-- CreateTable: vaccination_templates
CREATE TABLE IF NOT EXISTS vaccination_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    doses INTEGER NOT NULL,
    intervals_days TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed: Vaccination templates
INSERT OR IGNORE INTO vaccination_templates (id, name, description, doses, intervals_days)
VALUES
    (1, 'FSME', 'Frühsommer-Meningoenzephalitis – 3 Dosen (Tag 0, +28, +300)', 3, '0,28,300'),
    (2, 'Hepatitis B', 'Hepatitis-B-Grundimmunisierung – 3 Dosen (Tag 0, +30, +180)', 3, '0,30,180'),
    (3, 'HPV', 'Humane Papillomviren – 2 Dosen (Tag 0, +180)', 2, '0,180'),
    (4, 'COVID-19', 'COVID-19-Grundimmunisierung – 2 Dosen (Tag 0, +28)', 2, '0,28'),
    (5, 'Tetanus/Diphtherie', 'Tetanus-Diphtherie-Auffrischung – 1 Dosis', 1, '0');
