# Praxis-App Demir & Kollegen

Online-Terminverwaltung zur Reduzierung des Telefonstress für medizinische Fachangestellte (MFAs).

## Überblick

Patienten können online Termine buchen, Impfserien planen und Wiederholungsrezepte anfragen.
Das MFA-Dashboard bietet eine 3-Spalten-Ansicht mit heutigen Terminen, offenen Rezeptanfragen
und Akutslot-Verwaltung. Automatische E-Mail-Erinnerungen reduzieren No-Shows.

## Technologie-Stack

| Komponente | Technologie |
|---|---|
| **Frontend** | React 18 + TypeScript + Vite 5 + Tailwind CSS 3 + shadcn/ui (base-ui) |
| **Backend** | Express 4 + better-sqlite3 (CommonJS) |
| **Datenbank** | SQLite (via Prisma-Migrationsformat) |
| **Shared Types** | TypeScript-Interfaces in `/shared/types` |

## Features

### Patienten-Portal (`/patient`)
- **Termin buchen**  5-Stufen-Flow: Login → Terminart → Arzt → Datum/Zeit → Fragebogen
- **Impfserien**  FSME, Hepatitis B, HPV, COVID-19 als Mehrfachbuchung (1. Dosis sofort, Folgedosen bestätigbar)
- **Meine Termine**  Übersicht aller Termine + Serien mit Bestätigungs-Button für ausstehende Dosen
- **Einstellungen**  E-Mail-Adresse + Opt-in für Erinnerungen verwalten

### MFA-Dashboard (`/mfa`)
- **Heutige Termine**  Liste mit Status-änderung (Check-In, No-Show, Abschluss) + Notiz-Funktion
- **Offene Rezeptanfragen**  Ampel-Workflow: →→ Neu → →→ Prüfung → →→ Freigabe / → Ablehnung
- **Akutslots**  Verbleibende Slots pro Arzt mit farbigem Fortschrittsbalken
- **Erinnerungs-Zentrale**  Ausstehende Erinnerungen anzeigen + verarbeiten

### Geschüftslogik
- **No-Show-Sperre**  Ab 3 versüumten Terminen keine Online-Buchung mehr müglich
- **Akutslots**  Nur am gleichen Tag ab 07:00 Uhr buchbar, fest pro Arzt zugewiesen
- **Praxis-Schlieüungen**  Pro Arzt oder gesamte Praxis, blockiert Buchungen
- **Fragebogen**  Max. 5 Fragen pro Terminart, Pflichtfelder werden validiert
- **DSGVO**  Opt-in für E-Mail-Erinnerungen, minimale Datenspeicherung

## Installation & Start

### Voraussetzungen
- Node.js v20+
- npm (wird mit Node.js installiert)

### Backend starten

```bash
cd backend
node src/index.cjs
```

Der Server lüuft auf `http://localhost:3000`.

### Frontend starten

```bash
cd frontend
npm install
npm run dev
```

Das Frontend lüuft auf `http://localhost:5173` und proxied `/api`-Anfragen an den Backend-Server.

### Datenbank

Die SQLite-Datenbank liegt unter `backend/prisma/praxis.db`.
Migrationen (Tabellen + Seed-Daten) werden beim Backend-Start automatisch ausgeführt.

Enthaltene Seed-Daten:
- **3 ürzte**: Ahmet Demir, Fatma Demir, Mehmet Kollegen
- **2 MFAs**: Ayse Yilmaz, Ali Kaya
- **1 Test-Patient**: Max Mustermann (Versichertennummer: A123456789, Geburtsdatum: 1990-05-15)
- **Fragebügen**: Für Vorsorge (5), Beratung (3), Impfung (3)
- **5 Impfvorlagen**: FSME, Hepatitis B, HPV, COVID-19, Tetanus/Diphtherie

## API-Referenz

### Gesundheit

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| GET | `/api/health` | Server-Status + DB-Statistiken |

### ürzte & Slots

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| GET | `/api/doctors` | Alle ürzte mit Farbe und Akutslot-Kontingent |
| GET | `/api/slots→doctorId=&date=&category=` | Freie Online-Buchungsslots |
| GET | `/api/slots/acute` | Verbleibende Akutslots pro Arzt (heute) |

### Patienten

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| POST | `/api/patients/lookup` | Patient per Versichertennummer suchen |
| GET | `/api/patients/:id/reminder-settings` | Opt-in-Status abrufen |
| PATCH | `/api/patients/:id/reminder-settings` | Opt-in + E-Mail ündern |

### Termine

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| POST | `/api/appointments` | Termin buchen (mit No-Show-Prüfung + Fragebogen) |
| GET | `/api/appointments→insuranceNumber=` | Termine eines Patienten abrufen |
| PATCH | `/api/appointments/:id/status` | Status ündern (MFA) |
| PATCH | `/api/appointments/:id/note` | MFA-Notiz speichern |
| POST | `/api/appointments/series` | Impfserie buchen (mehrere Dosen) |
| PATCH | `/api/appointments/:id/confirm-series` | Folgetermin bestütigen |

### Rezepte

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| GET | `/api/prescriptions→status=` | Rezepte abrufen (filterbar) |
| POST | `/api/prescriptions` | Neues Rezept anlegen (MFA) |
| PATCH | `/api/prescriptions/:id/status` | Status-Workflow (MFA/Arzt) |

### Dashboard

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| GET | `/api/mfa/dashboard` | Aggregierte Dashboard-Daten |
| GET | `/api/questions→category=` | Fragebogen-Fragen pro Kategorie |
| GET | `/api/vaccination-series` | Impfserien-Vorlagen |

### Erinnerungen

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| GET | `/api/reminders/pending` | Ausstehende Erinnerungen |
| POST | `/api/reminders/process` | Erinnerungen generieren + senden (Simulation) |
| GET | `/api/reminders/dashboard` | Erinnerungs-Statistiken + Verlauf |

## Bedienungsanleitung

### Termin buchen (Patient)

1. **`/patient`** aufrufen
2. Versichertennummer eingeben (z.→B. `A123456789`)
3. Terminart auswühlen (Vorsorge, Beratung, Impfung, Rezept-Abholung)
4. Bei Impfung: Einzeltermin oder Impfserie wühlen
5. Arzt auswühlen
6. Datum im Kalender + freie Uhrzeit klicken
7. Fragebogen ausfüllen (Pflichtfelder sind markiert)
8. "Termin verbindlich buchen"  Bestütigung abwarten

### Impfserie bestütigen (Patient)

1. Nach Anmeldung "Meine Termine" klicken
2. Unter "Bestütigung ausstehend" den "Bestütigen"-Button klicken
3. Der Status wechselt von "Bestütigung ausstehend" zu "Geplant"

### MFA-Dashboard bedienen

1. **`/mfa`** aufrufen
2. **Linke Spalte**: Termin-Status per Klick ündern (Check-In, No-Show, Abschluss)
3. **→→-Button**: Notiz zu einem Termin hinzufügen
4. **Mitte Spalte**: Rezept-Workflow steuern (Prüfen → Freigeben/Ablehnen)
5. **"+ Neues Rezept anlegen"**: Versichertennummer + Medikament eingeben
6. **Rechte Spalte**: Akutslot-Auslastung beobachten
7. **→→-Menü**: Erinnerungs-Zentrale mit "Jetzt verarbeiten & senden"

## Datenbank-Migrationen

Migrationen werden beim Backend-Start automatisch ausgeführt:

| # | Name | änderung |
|---|---|---|
| 0001 | Init | Alle Basistabellen + Seed-Daten |
| 0002 | Fragebogen | `questionnaire_answers`-Tabelle |
| 0003 | Impfserien | `vaccination_templates`-Tabelle |
| 0004 | Serien-Spalten | `series_id`, `series_dose_number`, `series_group_id` auf `appointments` |
| 0005 | Erinnerungen | `reminders`-Tabelle |

## Projektstruktur

```
praxis-app/
+-- backend/
   +-- prisma/
      +-- migrations/       # SQL-Migrationen
      +-- praxis.db         # SQLite-Datenbank
   +-- src/
       +-- db/               # DB-Connection + Migration
       +-- routes/           # Express-Router (TS)
       +-- index.cjs         # Server-Einstiegspunkt
+-- frontend/
   +-- src/
      +-- components/
         +-- layout/       # Sidebar, RootLayout
         +-- ui/           # shadcn/ui-Komponenten
      +-- lib/              # API-Client, Utils
      +-- pages/            # LandingPage, PatientPortal, MFADashboard, MFAReminders, PatientSettings
   +-- package.json
+-- shared/
    +-- types/                # TypeScript-Shared-Types (Enums, Entities, API-DTOs)
```