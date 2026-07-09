# Praxis-App Demir & Kollegen

Online-Terminverwaltung zur Reduzierung des Telefonstress f�r medizinische Fachangestellte (MFAs).

## �berblick

Patienten k�nnen online Termine buchen, Impfserien planen und Wiederholungsrezepte anfragen.
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
- **Termin buchen** � 5-Stufen-Flow: Login ? Terminart ? Arzt ? Datum/Zeit ? Fragebogen
- **Impfserien** � FSME, Hepatitis B, HPV, COVID-19 als Mehrfachbuchung (1. Dosis sofort, Folgedosen best�tigbar)
- **Meine Termine** � �bersicht aller Termine + Serien mit Best�tigungs-Button f�r ausstehende Dosen
- **Einstellungen** � E-Mail-Adresse + Opt-in f�r Erinnerungen verwalten

### MFA-Dashboard (`/mfa`)
- **Heutige Termine** � Liste mit Status-�nderung (Check-In, No-Show, Abschluss) + Notiz-Funktion
- **Offene Rezeptanfragen** � Ampel-Workflow: ?? Neu ? ?? Pr�fung ? ?? Freigabe / ? Ablehnung
- **Akutslots** � Verbleibende Slots pro Arzt mit farbigem Fortschrittsbalken
- **Erinnerungs-Zentrale** � Ausstehende Erinnerungen anzeigen + verarbeiten

### Gesch�ftslogik
- **No-Show-Sperre** � Ab 3 vers�umten Terminen keine Online-Buchung mehr m�glich
- **Akutslots** � Nur am gleichen Tag ab 07:00 Uhr buchbar, fest pro Arzt zugewiesen
- **Praxis-Schlie�ungen** � Pro Arzt oder gesamte Praxis, blockiert Buchungen
- **Fragebogen** � Max. 5 Fragen pro Terminart, Pflichtfelder werden validiert
- **DSGVO** � Opt-in f�r E-Mail-Erinnerungen, minimale Datenspeicherung

## Installation & Start

### Voraussetzungen
- Node.js v20+
- npm (wird mit Node.js installiert)

### Backend starten

```bash
cd backend
node src/index.cjs
```

Der Server l�uft auf `http://localhost:3000`.

### Frontend starten

```bash
cd frontend
npm install
npm run dev
```

Das Frontend l�uft auf `http://localhost:5173` und proxied `/api`-Anfragen an den Backend-Server.

### Datenbank

Die SQLite-Datenbank liegt unter `backend/prisma/praxis.db`.
Migrationen (Tabellen + Seed-Daten) werden beim Backend-Start automatisch ausgef�hrt.

Enthaltene Seed-Daten:
- **3 �rzte**: Ahmet Demir, Fatma Demir, Mehmet Kollegen
- **2 MFAs**: Ayse Yilmaz, Ali Kaya
- **1 Test-Patient**: Max Mustermann (Versichertennummer: A123456789, Geburtsdatum: 1990-05-15)
- **Frageb�gen**: F�r Vorsorge (5), Beratung (3), Impfung (3)
- **5 Impfvorlagen**: FSME, Hepatitis B, HPV, COVID-19, Tetanus/Diphtherie

## API-Referenz

### Gesundheit

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| GET | `/api/health` | Server-Status + DB-Statistiken |

### �rzte & Slots

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| GET | `/api/doctors` | Alle �rzte mit Farbe und Akutslot-Kontingent |
| GET | `/api/slots?doctorId=&date=&category=` | Freie Online-Buchungsslots |
| GET | `/api/slots/acute` | Verbleibende Akutslots pro Arzt (heute) |

### Patienten

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| POST | `/api/patients/lookup` | Patient per Versichertennummer suchen |
| GET | `/api/patients/:id/reminder-settings` | Opt-in-Status abrufen |
| PATCH | `/api/patients/:id/reminder-settings` | Opt-in + E-Mail �ndern |

### Termine

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| POST | `/api/appointments` | Termin buchen (mit No-Show-Pr�fung + Fragebogen) |
| GET | `/api/appointments?insuranceNumber=` | Termine eines Patienten abrufen |
| PATCH | `/api/appointments/:id/status` | Status �ndern (MFA) |
| PATCH | `/api/appointments/:id/note` | MFA-Notiz speichern |
| POST | `/api/appointments/series` | Impfserie buchen (mehrere Dosen) |
| PATCH | `/api/appointments/:id/confirm-series` | Folgetermin best�tigen |

### Rezepte

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| GET | `/api/prescriptions?status=` | Rezepte abrufen (filterbar) |
| POST | `/api/prescriptions` | Neues Rezept anlegen (MFA) |
| PATCH | `/api/prescriptions/:id/status` | Status-Workflow (MFA/Arzt) |

### Dashboard

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| GET | `/api/mfa/dashboard` | Aggregierte Dashboard-Daten |
| GET | `/api/questions?category=` | Fragebogen-Fragen pro Kategorie |
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
2. Versichertennummer eingeben (z.?B. `A123456789`)
3. Terminart ausw�hlen (Vorsorge, Beratung, Impfung, Rezept-Abholung)
4. Bei Impfung: Einzeltermin oder Impfserie w�hlen
5. Arzt ausw�hlen
6. Datum im Kalender + freie Uhrzeit klicken
7. Fragebogen ausf�llen (Pflichtfelder sind markiert)
8. "Termin verbindlich buchen" � Best�tigung abwarten

### Impfserie best�tigen (Patient)

1. Nach Anmeldung "Meine Termine" klicken
2. Unter "Best�tigung ausstehend" den "Best�tigen"-Button klicken
3. Der Status wechselt von "Best�tigung ausstehend" zu "Geplant"

### MFA-Dashboard bedienen

1. **`/mfa`** aufrufen
2. **Linke Spalte**: Termin-Status per Klick �ndern (Check-In, No-Show, Abschluss)
3. **??-Button**: Notiz zu einem Termin hinzuf�gen
4. **Mitte Spalte**: Rezept-Workflow steuern (Pr�fen ? Freigeben/Ablehnen)
5. **"+ Neues Rezept anlegen"**: Versichertennummer + Medikament eingeben
6. **Rechte Spalte**: Akutslot-Auslastung beobachten
7. **??-Men�**: Erinnerungs-Zentrale mit "Jetzt verarbeiten & senden"

## Datenbank-Migrationen

Migrationen werden beim Backend-Start automatisch ausgef�hrt:

| # | Name | �nderung |
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
�   +-- prisma/
�   �   +-- migrations/       # SQL-Migrationen
�   �   +-- praxis.db         # SQLite-Datenbank
�   +-- src/
�       +-- db/               # DB-Connection + Migration
�       +-- routes/           # Express-Router (TS)
�       +-- index.cjs         # Server-Einstiegspunkt
+-- frontend/
�   +-- src/
�   �   +-- components/
�   �   �   +-- layout/       # Sidebar, RootLayout
�   �   �   +-- ui/           # shadcn/ui-Komponenten
�   �   +-- lib/              # API-Client, Utils
�   �   +-- pages/            # LandingPage, PatientPortal, MFADashboard, MFAReminders, PatientSettings
�   +-- package.json
+-- shared/
    +-- types/                # TypeScript-Shared-Types (Enums, Entities, API-DTOs)
```