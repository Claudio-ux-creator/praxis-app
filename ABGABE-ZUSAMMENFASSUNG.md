# Praxis-App Demir & Kollegen – Abgabe-Zusammenfassung

## Überblick

Die Online-Termin-App für die Praxis Demir & Kollegen ist ein Full-Stack-Webanwendung
(React + Express + SQLite), die den Telefonstress für medizinische Fachangestellte (MFAs)
durch digitale Self-Service-Funktionen für Patienten reduziert.

## Was die App kann

**Patienten-Portal** (`/patient`)
- Termine online buchen in 4 Kategorien: Vorsorge, Beratung, Impfung, Rezept-Abholung
- Impfserien planen (FSME, Hepatitis B, HPV, COVID-19, Tetanus) – 1. Dosis sofort gebucht, Folgedosen bestätigbar
- Fragebögen (max. 5 Fragen pro Terminart) vor der Buchung ausfüllen
- Eigene Termine einsehen + ausstehende Impfdosen bestätigen
- E-Mail-Opt-in für Erinnerungen verwalten

**MFA-Dashboard** (`/mfa`)
- 3-Spalten-Layout: Heutige Termine, Offene Rezeptanfragen, Akutslot-Übersicht
- Termin-Status ändern (Check-In, No-Show, Abschluss) + Notizen hinzufügen
- Rezept-Workflow mit Ampel-Logik (Neu ? Prüfung ? Freigabe/Ablehnung)
- Neue Rezeptanfragen direkt im Dashboard anlegen
- Erinnerungs-Zentrale mit Verarbeitung und Verlauf

## Umsetzung der SPEC-Regeln v3

| Regel | Status |
|---|---|
| Online-Buchung für Vorsorge, Beratung, Impfung, Rezept-Abholung | ? |
| Vor-Termin-Fragebogen (max. 5 Fragen je Terminart) | ? |
| MFA-Dashboard mit 3 Spalten | ? |
| Separate Entität "Wiederholungsrezept" mit Ampel-Workflow | ? |
| No-Show-Sperre ab 3 Fehlterminen | ? |
| Akutslots nur am gleichen Tag ab 07:00 Uhr | ? |
| Serientermine für Impfungen (Patient bestätigt jeden einzeln) | ? |
| Automatische Erinnerungen (Opt-in, 24h vorher) | ? |
| Praxisschließungen pro Arzt oder gesamte Praxis | ? |
| Rezept-Freigabe nur durch Arzt | ? |
| DSGVO: Opt-in für E-Mail, minimale Daten | ? |

## Technologie-Stack

- **Frontend**: React 18 + TypeScript + Vite 5 + Tailwind CSS 3 + shadcn/ui
- **Backend**: Express 4 + better-sqlite3 (CommonJS)
- **Datenbank**: SQLite mit auto-run Migrationen + Seed-Daten
- **Shared Types**: TypeScript-Interfaces in `/shared/types`

## Schnellstart

```bash
# 1. Backend starten (Port 3000)
cd backend
node src/index.cjs

# 2. Frontend starten (Port 5173, proxyed /api nach :3000)
cd frontend
npm run dev
```

**Test-Zugang**: Versichertennummer `A123456789` (Max Mustermann, geb. 1990-05-15)

## API-Endpunkte (26 Stück)

| Bereich | Endpunkte |
|---|---|
| Health | `GET /api/health` |
| Doctors | `GET /api/doctors` |
| Slots | `GET /api/slots`, `GET /api/slots/acute` |
| Patients | `POST /api/patients/lookup`, `GET/PATCH /api/patients/:id/reminder-settings` |
| Appointments | `POST /api/appointments`, `GET /api/appointments`, `PATCH /status`, `PATCH /note` |
| Series | `POST /api/appointments/series`, `PATCH /:id/confirm-series` |
| Prescriptions | `GET/POST /api/prescriptions`, `PATCH /:id/status` |
| Dashboard | `GET /api/mfa/dashboard` |
| Questions | `GET /api/questions?category=` |
| Vaccination | `GET /api/vaccination-series` |
| Reminders | `GET /api/reminders/pending`, `POST /process`, `GET /dashboard` |

## Datenbank-Migrationen (5 Stück)

0001_init ? 0002_questionnaire_answers ? 0003_vaccination_series ? 0004_series_columns ? 0005_reminders

## Seed-Daten

- 3 Ärzte (Ahmet Demir, Fatma Demir, Mehmet Kollegen)
- 2 MFAs (Ayse Yilmaz, Ali Kaya)
- 1 Test-Patient (Max Mustermann)
- 5 Impfvorlagen + Fragenkataloge für 3 Terminarten