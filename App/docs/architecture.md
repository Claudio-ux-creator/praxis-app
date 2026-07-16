# architecture.md - Arzt/MFA Terminplaner

_Stand: 26.06.2026_

## Zweck

Dieses Dokument ist die technische Wahrheit des Projekts. Es beschreibt den aktuellen Stand, Zielarchitektur und Regeln fuer Implementierungen.

## Aktueller Stand

- Backend-only Starterprojekt.
- Node.js, Express, TypeScript, Prisma und SQLite.
- Bestehender API-Endpunkt: `GET /api/staff`.
- Bestehende Prisma-Modelle: `Employee` mit Rolle `ARZT` oder `MFA`, `Availability`, `Patient` mit `versichertennummer`.
- Noch nicht umgesetzt: Patient-Stammdaten, Termine, Terminarten, Wiederholungsrezepte, Frageboegen, Dashboard, Erinnerungen, Tomedo-Sync.

## Ordnerstruktur

```text
.
├── CLAUDE.md
├── AGENTS.md
├── docs/
│   ├── spec.md
│   ├── backlog.md
│   ├── architecture.md
│   ├── decisions.md
│   ├── modus-operandi.md
│   ├── concepts/
│   └── audit/
├── prisma/
│   └── schema.prisma
└── src/
    ├── index.ts
    └── routes/
        └── staff.ts
```

## Laufzeit und Scripts

| Aufgabe | Befehl |
|--------|--------|
| Dev-Server | `npm run dev` |
| Build | `npm run build` |
| Prisma Client | `npm run prisma:generate` |
| Migration | `npm run prisma:migrate` |

## API-Konventionen

- REST-Endpunkte unter `/api/...`.
- Routen liegen in `src/routes`.
- Response-Fehler derzeit als `{ error: string }`.
- Neue Endpunkte sollen fachlich klar benannt werden, z.B. `/api/appointments`, `/api/prescriptions`, `/api/dashboard`.
- Business-Regeln nicht direkt in Route-Handlern verteilen; fuer komplexe Regeln Domain-/Service-Funktionen einfuehren.

## Datenmodell-Zielbild

Die fachlichen Kernmodelle aus `docs/spec.md`:

- `Patient`
- `Appointment`
- `AppointmentType`
- `Employee` / Arzt / MFA
- `Availability`
- `PracticeClosure`
- `PrescriptionRequest`
- `QuestionnaireTemplate`
- `QuestionnaireAnswer`
- `Notification`

Wichtige Modellregeln:

- Online-Buchbarkeit ist Eigenschaft der Terminart.
- No-Show-Sperre muss aus Patientendaten ableitbar sein.
- Akutslots sind einem konkreten Arzt und Tag zugeordnet.
- Wiederholungsrezepte sind keine Termine, koennen aber optional mit einem Abholtermin verknuepft sein.
- Tomedo bleibt primaere Quelle fuer synchronisierte Praxisdaten; lokale Speicherung nur soweit fuer App-Workflows noetig.

## Datenschutz und Sicherheit

- Keine Secrets in Docs, Prompts oder Commits.
- `.env` bleibt lokal.
- Patientendaten minimal speichern.
- Email/SMS nur mit explizitem Opt-in.
- Rollenrechte fuer MFA und Arzt bei jeder schreibenden Aktion beruecksichtigen.

## Test- und Verifikationsregeln

- Vor Abschluss einer Code-Session mindestens `npm run build` ausfuehren, sofern Abhaengigkeiten installiert sind.
- Bei Buchungsregeln und Statuswechseln Tests ergaenzen, sobald eine Test-Infrastruktur vorhanden ist.
- Neue fachliche Regeln in `docs/backlog.md` und ggf. `docs/decisions.md` referenzieren.

## Bekannte technische Schulden

- Keine Test-Infrastruktur vorhanden.
- SQLite ist fuer lokale Entwicklung passend, Produktivdatenbank ist offen.
- Prisma mit SQLite unterstuetzt keine nativen Enums; enumartige Werte wie `Employee.role` und `Availability.weekday` werden aktuell als `String` gespeichert und muessen in der Anwendung validiert werden.
- Tomedo-Schnittstelle ist fachlich bekannt, technisch noch nicht spezifiziert.

## Update 09.07.2026 - Full-Stack-App mit index.cjs

### Aktueller Stand

Das Projekt ist nun eine vollst�ndige Full-Stack-Anwendung:

- **Backend**: Express + better-sqlite3 in einer einzigen Datei `backend/src/index.cjs` (CommonJS).
  - 22 REST-API-Endpunkte unter `/api/...`
  - Auto-Migration-System in `index.cjs` selbst (5 Migrationen: 0001_init bis 0005_reminders)
  - Seed-Daten werden beim ersten Start automatisch eingef�gt
  - Kein Prisma-Client zur Laufzeit mehr n�tig; Prisma-Schema dient als Referenz
- **Frontend**: React 18 + Vite 5 + Tailwind CSS 3 + shadcn/ui in `frontend/`
  - Patienten-Portal (`/patient`): Buchungsflow (5 Schritte), Impfserien, Termin�bersicht, Einstellungen
  - MFA-Dashboard (`/mfa`): 3-Spalten-Layout (heutige Termine, Rezepte, Akutslots), Erinnerungs-Zentrale
- **Datenbank**: SQLite in `backend/prisma/praxis.db` + WAL-Modus

### Ordnerstruktur (aktuell)

```text
.
+-- backend/
�   +-- src/
�   �   +-- index.cjs          # Hauptserver (CommonJS, 22 Endpunkte)
�   �   +-- index.ts           # TypeScript-TSX-Einstieg (experimentell)
�   �   +-- db/
�   �   �   +-- connection.ts  # DB-Verbindung (TypeScript, ungenutzt)
�   �   �   +-- migrate.ts     # Migrationen (TypeScript, ungenutzt)
�   �   �   +-- schema.ts      # Schema-Definition (TypeScript, ungenutzt)
�   �   +-- routes/
�   �       +-- doctors.ts     # GET /api/doctors (TypeScript, ungenutzt)
�   �       +-- health.ts      # GET /api/health (TypeScript, ungenutzt)
�   �       +-- slots.ts       # GET /api/slots, /api/slots/acute (TypeScript, ungenutzt)
�   +-- prisma/
�   �   +-- schema.prisma      # Referenz-Datenmodell
�   �   +-- migrations/        # Prisma-Migrations-Dateien
�   �   +-- praxis.db          # SQLite-Datenbank (mit WAL)
�   +-- package.json
�   +-- tsconfig.json
+-- frontend/
�   +-- src/
�   �   +-- App.tsx            # Router mit / und /patient/* und /mfa/* Routen
�   �   +-- main.tsx           # Vite-Einstieg
�   �   +-- lib/
�   �   �   +-- api.ts         # API-Client (get, post, patch)
�   �   +-- components/
�   �   �   +-- layout/        # RootLayout, Sidebar
�   �   �   +-- ui/            # shadcn/ui-Komponenten
�   �   +-- pages/
�   �       +-- LandingPage.tsx
�   �       +-- PatientPortal.tsx     # Buchungsflow + Termin�bersicht
�   �       +-- PatientSettings.tsx   # E-Mail-Opt-in verwalten
�   �       +-- MFADashboard.tsx      # 3-Spalten-Dashboard
�   �       +-- MFAReminders.tsx      # Erinnerungs-Zentrale
�   +-- package.json
�   +-- vite.config.ts
+-- shared/
�   +-- types/                 # Gemeinsame TypeScript-Typen (api.ts, entities.ts, enums.ts)
+-- data/                      # Leer (Ziel f�r Daten)
+-- ABGABE-ZUSAMMENFASSUNG.md  # Abgabe-Dokumentation
+-- README.md                  # Projekt-README
+-- SPEC.md                    # Fachliche Spezifikation v3 (Root-Kopie)
```

### Laufzeit

| Aufgabe | Befehl |
|---------|--------|
| Backend starten (Port 3000) | `cd backend && node src/index.cjs` |
| Frontend starten (Port 5173) | `cd frontend && npm run dev` |
| Build Frontend | `cd frontend && npm run build` |

### API-Endpunkte (22 St�ck)

| Methode | Pfad | Beschreibung |
|---------|------|-------------|
| GET | `/api/health` | Health-Check mit Statistiken |
| GET | `/api/doctors` | �rzte-Liste |
| GET | `/api/slots?doctorId=&date=&category=` | Freie Online-Buchungs-Slots |
| GET | `/api/slots/acute` | Akutslot-�bersicht f�r heute |
| GET | `/api/questions?category=` | Fragebogen-Fragen f�r Terminart |
| POST | `/api/patients/lookup` | Patienten-Login (Versichertennummer + Geburtsdatum) |
| POST | `/api/appointments` | Termin buchen (mit Fragebogen-Antworten) |
| GET | `/api/appointments?insuranceNumber=` | Meine Termine |
| POST | `/api/appointments/series` | Impfserie anlegen |
| PATCH | `/api/appointments/:id/confirm-series` | Impfdosis best�tigen |
| PATCH | `/api/appointments/:id/status` | Termin-Status �ndern |
| PATCH | `/api/appointments/:id/note` | MFA-Notiz speichern |
| GET | `/api/vaccination-series` | Impfvorlagen abrufen |
| GET | `/api/mfa/dashboard` | MFA-Dashboard-Daten |
| GET | `/api/prescriptions` | Rezeptanfragen (offen) |
| POST | `/api/prescriptions` | Neue Rezeptanfrage (MFA) |
| PATCH | `/api/prescriptions/:id/status` | Rezept-Status �ndern |
| GET | `/api/reminders/pending` | Ausstehende Erinnerungen |
| POST | `/api/reminders/process` | Erinnerungen generieren + versenden |
| GET | `/api/reminders/dashboard` | Erinnerungs-Statistiken + Verlauf |
| GET | `/api/patients/:id/reminder-settings` | Patienten-Einstellungen |
| PATCH | `/api/patients/:id/reminder-settings` | E-Mail/Opt-in aktualisieren |

### Seed-Daten

- 3 �rzte (Ahmet Demir, Fatma Demir, Mehmet Kollegen)
- 2 MFAs (Ayse Yilmaz, Ali Kaya)
- 1 Test-Patient: Max Mustermann (A123456789, geb. 1990-05-15)
- 5 Impfvorlagen (FSME, Hepatitis B, HPV, COVID-19, Tetanus)
- Fragenkataloge f�r Vorsorge, Beratung, Impfung

### Bekannte technische Schulden

- `index.cjs` enth�lt die gesamte Backend-Logik (keine saubere Trennung in Routes/Controller/Service)
- Die TypeScript-Dateien in `src/` sind parallel zum laufenden `index.cjs` und nicht im Einsatz
- Keine Tests vorhanden
- SQLite ist f�r lokale Entwicklung passend, Produktivdatenbank offen
- Tomedo-Synchronisation nicht implementiert (AMT-074 bis AMT-076)

## Update 09.07.2026 - Full-Stack-App mit index.cjs

### Aktueller Stand

Das Projekt ist nun eine vollstaendige Full-Stack-Anwendung:

- **Backend**: Express + better-sqlite3 in einer einzigen Datei ackend/src/index.cjs (CommonJS).
  - 22 REST-API-Endpunkte unter /api/...
  - Auto-Migration-System in index.cjs selbst (5 Migrationen)
  - Seed-Daten werden beim ersten Start automatisch eingefuegt
  - Kein Prisma-Client zur Laufzeit mehr noetig; Prisma-Schema dient als Referenz
- **Frontend**: React 18 + Vite 5 + Tailwind CSS 3 + shadcn/ui in rontend/
- **Datenbank**: SQLite in ackend/prisma/praxis.db + WAL-Modus

### Bekannte technische Schulden

- index.cjs enthaelt die gesamte Backend-Logik (keine saubere Trennung)
- TypeScript-Dateien in src/ sind parallel und nicht im Einsatz
- Keine Tests vorhanden
- SQLite ist fuer lokale Entwicklung passend, Produktivdatenbank offen
- Tomedo-Synchronisation nicht implementiert (AMT-074 bis AMT-076)

