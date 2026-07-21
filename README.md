# Praxis-App Demir & Kollegen

Online-Terminverwaltung zur Reduzierung des Telefonstresses für medizinische Fachangestellte (MFAs).

## Überblick

Patienten können online Termine buchen, Impfserien planen und Wiederholungsrezepte anfragen.
Das MFA-Dashboard bietet eine 3-Spalten-Ansicht mit heutigen Terminen, offenen Rezeptanfragen
und Akutslot-Verwaltung. Automatische Benachrichtigungen reduzieren No-Shows.
Ärzte können Rezepte freigeben, Stammdaten pflegen, Diagnosen verwalten und Abwesenheiten eintragen.

## Technologie-Stack

| Komponente | Technologie |
|---|---|
| **Frontend** | React 18 + TypeScript + esbuild (IIFE-Bundle) + Tailwind CSS 3 + shadcn/ui (base-ui) |
| **Backend** | Express 4 + TypeScript (experimental strip-types) + better-sqlite3 |
| **Datenbank** | SQLite (via Migrationsordner) |
| **Shared Types** | TypeScript-Interfaces in /shared/types |

## Features

### Patienten-Portal (/patient)
- **Termin buchen** - 5-Stufen-Flow: Login -> Terminart -> Arzt -> Datum/Zeit -> Fragebogen
- **Impfserien** - FSME, Hepatitis B, HPV, COVID-19 als Mehrfachbuchung (1. Dosis sofort, Folgedosen bestätigbar)
- **Meine Termine** - Übersicht aller Termine und Serien mit Bestätigungs-Button für ausstehende Dosen
- **Meine Rezepte** - Statusübersicht aller Rezeptanfragen (ausstehend, in Prüfung, freigegeben, abgelehnt)
- **Einstellungen** - E-Mail-Adresse und Opt-in für Erinnerungen verwalten

### MFA-Dashboard (/mfa)
- **Heutige Termine** - Liste mit Statusänderung (Check-In, No-Show, Abschluss) + Notiz-Funktion
- **Offene Rezeptanfragen** - Workflow: Neu (PENDING) -> Prüfung (IN_PROGRESS) -> Freigabe/Ablehnung durch Arzt
- **Akutslots** - Verbleibende Slots pro Arzt mit farbigem Fortschrittsbalken
- **Rezeptverwaltung** - Alle Rezepte mit Filter nach Status, Workflow-Steuerung
- **Patientenübersicht** - Suche nach Versichertennummer, Name oder Telefon
- **Impfungen** - Übersicht aller Impftermine (einzeln und als Serie)
- **Erinnerungs-Zentrale** - Ausstehende Erinnerungen anzeigen, generieren und verarbeiten

### Arzt-Bereich (/doctor-login)
- **Dashboard** - Termine des Tages, offene Rezeptanfragen, Patienten-Diagnosen
- **Rezept-Freigabe** - Geprüfte Rezepte freigeben oder ablehnen + eigenes Rezept ausstellen
- **Stammdaten** - Medikamente verwalten (CRUD) und Diagnosen pro Patient eintragen (ICD-Code)
- **Abwesenheiten** - Urlaub/Abwesenheit pro Datumsbereich eintragen (blockiert Buchungen + Rezept-Workflow)

### Geschäftslogik
- **No-Show-Sperre** - Ab 3 versäumten Terminen keine Online-Buchung mehr möglich
- **Akutslots** - Nur am gleichen Tag ab 07:00 Uhr buchbar, fest pro Arzt zugewiesen
- **Praxis-Schließungen** - Pro Arzt oder gesamte Praxis, blockiert Buchungen und Rezept-Workflow
- **Fragebogen** - Max. 5 Fragen pro Terminart, Pflichtfelder werden validiert
- **Verschreibungspflicht-Prüfung** - MFA prüft Medikament auf Rezeptpflicht und Konsultationsfrist vor Weiterleitung an Arzt
- **DSGVO** - Opt-in für Benachrichtigungen, minimale Datenspeicherung

## Installation & Start

### Voraussetzungen
- Node.js v20+
- npm (wird mit Node.js installiert)

### Schnellstart (beide Dienste)

```powershell
.\start-app.ps1
```

### Backend starten

```bash
cd backend
node --experimental-strip-types src/index.ts
```

Der Server läuft auf http://localhost:3000. Bei Port-Konflikt wird automatisch Port 3001 usw. probiert.

### Frontend bauen

Das Frontend wird mit esbuild in eine IIFE-Datei gebündelt und vom Backend als Static-File ausgeliefert:

```bash
cd frontend
node build.cjs
```

Dann http://localhost:3000 im Browser öffnen.

### Datenbank

Die SQLite-Datenbank liegt unter backend/prisma/praxis.db.
Migrationen (Tabellen + Seed-Daten) werden beim Backend-Start automatisch ausgeführt.

Enthaltene Seed-Daten:
- **3 Ärzte**: Ahmet Demir, Fatma Demir, Mehmet Kollegen
- **2 MFAs**: Ayse Yilmaz, Ali Kaya
- **1 Test-Patient**: Max Mustermann (Versichertennummer: A123456789, Geburtsdatum: 1990-05-15)
- **Fragebögen**: Für Vorsorge (5), Beratung (3), Impfung (3)
- **5 Impfvorlagen**: FSME, Hepatitis B, HPV, COVID-19, Tetanus/Diphtherie
- **10 Medikamente**: Ibuprofen, Paracetamol, Amoxicillin, Metformin u. a.

## API-Referenz

### Gesundheit

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| GET | /api/health | Server-Status + DB-Statistiken |

### Ärzte & Slots

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| GET | /api/doctors | Alle Ärzte mit Farbe und Akutslot-Kontingent |
| GET | /api/slots | Freie Online-Buchungsslots (Query: doctorId, date, category) |
| GET | /api/slots/acute | Verbleibende Akutslots pro Arzt (heute) |

### Patienten

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| POST | /api/patients/lookup | Patient per Versichertennummer + Geburtsdatum suchen |
| GET | /api/patients | Alle Patienten (MFA) |
| GET | /api/patients/:id/reminder-settings | Opt-in-Status abrufen |
| PATCH | /api/patients/:id/reminder-settings | Opt-in + E-Mail ändern |

### Termine

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| POST | /api/appointments | Termin buchen (mit No-Show-Prüfung + Fragebogen) |
| GET | /api/appointments | Termine eines Patienten (Query: insuranceNumber) |
| PATCH | /api/appointments/:id/status | Status ändern (MFA) |
| PATCH | /api/appointments/:id/note | MFA-Notiz speichern |
| POST | /api/appointments/series | Impfserie buchen (mehrere Dosen) |
| PATCH | /api/appointments/:id/confirm-series | Folgetermin bestätigen |

### Rezepte

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| GET | /api/prescriptions | Rezepte eines Patienten (Query: insuranceNumber) |
| GET | /api/prescriptions/all | Alle Rezepte (MFA) |
| POST | /api/prescriptions/request | Patient reicht Medikamentenanfrage ein |
| POST | /api/prescriptions | Neues Rezept anlegen (MFA) |
| PATCH | /api/prescriptions/:id/status | Status-Workflow (MFA: IN_PROGRESS, COLLECTED) |
| POST | /api/mfa/prescriptions/:id/forward | MFA prüft Rezept und leitet an Arzt weiter |

### Arzt-Bereich

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| POST | /api/doctor/login | Arzt-Login per Vor- und Nachname |
| GET | /api/doctor/prescriptions | Rezepte zur Freigabe (IN_PROGRESS) |
| PATCH | /api/doctor/prescriptions/:id/approve | Rezept freigeben (APPROVED) oder ablehnen (REJECTED) |
| POST | /api/doctor/prescriptions | Arzt stellt eigenes Rezept aus |
| GET | /api/doctor/medications | Medikamentenliste |
| POST | /api/doctor/medications | Neues Medikament anlegen |
| PATCH | /api/doctor/medications/:id | Medikament bearbeiten |
| DELETE | /api/doctor/medications/:id | Medikament löschen |
| GET | /api/doctor/diagnoses | Diagnosen abrufen (Query: patientId oder insuranceNumber) |
| POST | /api/doctor/diagnoses | Neue Diagnose eintragen |
| PATCH | /api/doctor/diagnoses/:id | Diagnose bearbeiten |
| GET | /api/doctor/absences | Abwesenheiten des Arztes |
| POST | /api/doctor/absences | Abwesenheit eintragen |
| DELETE | /api/doctor/absences/:id | Abwesenheit löschen |
| GET | /api/doctor/dashboard | Dashboard-Daten (Termine + Rezepte + Diagnosen) |

### Dashboard & Fragebogen

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| GET | /api/mfa/dashboard | Aggregierte Dashboard-Daten |
| GET | /api/mfa/appointments | Alle Termine (MFA) |
| GET | /api/mfa/vaccinations | Alle Impftermine (MFA) |
| GET | /api/mfa/notifications | Patient-Benachrichtigungen (Query: insuranceNumber) |
| PATCH | /api/mfa/notifications/:id/read | Benachrichtigung als gelesen markieren |
| GET | /api/questions | Fragebogen-Fragen (Query: category) |
| GET | /api/vaccination-series | Impfserien-Vorlagen |

### Erinnerungen

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| GET | /api/reminders/pending | Ausstehende Erinnerungen |
| POST | /api/reminders/process | Erinnerungen generieren + senden (Simulation) |
| GET | /api/reminders/dashboard | Erinnerungs-Statistiken + Verlauf |

### Verfügbarkeit

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| GET | /api/availability | Sprechzeiten eines Arztes (Query: doctorId) |
| PUT | /api/availability | Sprechzeiten aktualisieren |

## Bedienungsanleitung

### Termin buchen (Patient)

1. /patient aufrufen
2. Versichertennummer eingeben (z. B. A123456789)
3. Terminart auswählen (Vorsorge, Beratung, Impfung, Rezept-Abholung)
4. Bei Impfung: Einzeltermin oder Impfserie wählen
5. Arzt auswählen
6. Datum im Kalender + freie Uhrzeit klicken
7. Fragebogen ausfüllen (Pflichtfelder sind markiert)
8. Termin verbindlich buchen

### Impfserie bestätigen (Patient)

1. Nach Anmeldung Meine Termine klicken
2. Unter Bestätigung ausstehend den Bestätigen-Button klicken
3. Status wechselt von Bestätigung ausstehend zu Gebucht

### MFA-Dashboard bedienen

1. /mfa aufrufen
2. Linke Spalte: Termin-Status per Klick ändern (Check-In, No-Show, Abschluss)
3. Notiz-Button: Notiz zu einem Termin hinzufügen
4. Mitte Spalte (Rezepte): Rezept prüfen - Prüfen-Button prüft auf Rezeptpflicht + Konsultationsfrist und leitet an Arzt weiter
5. + Neues Rezept anlegen: Versichertennummer + Medikament eingeben
6. Rechte Spalte: Akutslot-Auslastung der Ärzte beobachten
7. Erinnerungs-Zentrale: Im Menü aufrufbar - Jetzt verarbeiten und senden

### Arzt-Bereich

1. /doctor-login aufrufen, mit Vor- und Nachname anmelden (z. B. Ahmet / Demir)
2. Dashboard: Termine + Rezepte + schnelle Diagnose-Ansicht
3. Rezept-Freigabe: Rezepte prüfen, freigeben oder ablehnen; eigenes Rezept ausstellen
4. Stammdaten: Medikamente verwalten, Diagnosen mit ICD-Code eintragen
5. Abwesenheiten: Urlaubstage eintragen - Buchungen und Rezept-Workflow werden blockiert

## Datenbank-Migrationen

Migrationen werden beim Backend-Start automatisch ausgeführt:

| # | Name | Änderung |
|---|---|---|
| 0001 | Init | Alle Basistabellen (patients, doctors, appointments, prescriptions u. a.) + Seed-Daten |
| 0002 | Fragebogen | questionnaire_answers-Tabelle |
| 0003 | Impfserien | vaccination_templates-Tabelle |
| 0005 | Erinnerungen | reminders-Tabelle |
| 0006 | Arzt-Dashboard | medications- und diagnoses-Tabellen |
| 0007 | Verfügbarkeit | doctor_availability-Tabelle mit Sprechzeiten |
| 0008 | Benachrichtigungen | patient_notifications-Tabelle |
| 0009 | Rezept-Fragen | Frage für PRESCRIPTION_PICKUP-Kategorie |

## Projektstruktur

```
praxis-app/
+-- backend/
|   +-- prisma/
|   |   +-- migrations/       # SQL-Migrationen (werden automatisch ausgeführt)
|   |   +-- praxis.db         # SQLite-Datenbank
|   +-- src/
|       +-- db/               # DB-Connection + Migration
|       +-- routes/           # Express-Router (TypeScript)
|       +-- services/         # Business-Logik (absenceCheck)
|       +-- index.ts          # Server-Einstiegspunkt
+-- frontend/
|   +-- src/
|   |   +-- components/
|   |   |   +-- layout/       # Sidebar, RootLayout
|   |   |   +-- ui/           # shadcn/ui-Komponenten
|   |   +-- lib/              # API-Client, Utils
|   |   +-- pages/            # 17 Seiten (Patient, MFA, Arzt)
|   |   +-- App.tsx           # Router-Konfiguration
|   |   +-- entry-umd.tsx     # Einstiegspunkt für esbuild-Bundle
|   +-- build.cjs             # esbuild-Build-Script
|   +-- index.html            # HTML-Template
|   +-- build/app.js          # Kompilierte Bundle-Datei
+-- shared/
|   +-- types/                # TypeScript-Shared-Types
+-- start-app.ps1             # Start-Script mit Watchdog
+-- README.md
```
