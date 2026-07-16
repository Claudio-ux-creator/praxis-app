# backlog.md - Arzt/MFA Terminplaner

_Stand: 09.07.2026_

_Stabile Feature-IDs. Nicht umnummerieren. Killed-IDs bleiben killed._

---

## Konvention

- **ID-Schema:** `AMT-NNN`
- **Prefix:** `AMT` = Arzt/MFA Terminplaner
- **Nummerierung:** fortlaufend, nie wiederverwenden
- **Referenzierung:** In Commits, Konzepten und Dokumentation immer per ID
- **Sortierung:** Nach Phase, Kern zuerst

## Status-Werte

| Status | Bedeutung |
|--------|-----------|
| `hypo` | Hypothese oder offener Punkt aus der Spec, noch nicht final geklaert |
| `validated` | Durch Spec V3 bestaetigt, aber noch nicht umgesetzt |
| `in-progress` | Aktuell in Arbeit |
| `done` | Implementiert und verifiziert |
| `killed` | Verworfen, Begruendung in `docs/decisions.md` |

## Phasen

| Phase | Name | Ziel |
|-------|------|------|
| 1 | Kernmodell & Rollen | Fachliche Entitaeten, Berechtigungen und Basisregeln modellieren |
| 2 | Buchung & Fragebogen | Patient kann erlaubte Termine online buchen und Vorabinfos liefern |
| 3 | Praxisbetrieb | MFA- und Arzt-Workflows fuer Tagesbetrieb, Akutslots und Rezepte |
| 4 | Automatisierung & Integration | Erinnerungen, Serientermine und Tomedo-Sync |
| 5 | Klaerung & Haertung | Offene Punkte, Datenschutzdetails, technische Schnittstellen |

---

## Phase 1 - Kernmodell & Rollen

| ID | Name | Phase | Status | Quelle | Notiz |
|----|------|-------|--------|--------|-------|
| AMT-001 | Phase 1 | done | done | docs/spec.md Abschnitt 1 Patient | Prisma-Modell `Patient` mit UUID-Primaerschluessel angelegt |
| AMT-002 | Versichertennummer als Pflichtfeld am Patienten | 1 | done | docs/spec.md Abschnitt 1 Patient | Prisma-Modell `Patient` um Pflichtfeld `versichertennummer` ergaenzt |
| AMT-003 | Patient-Stammdaten Name, Vorname, Geburtsdatum und Telefon | 1 | done | docs/spec.md Abschnitt 1 Patient | Minimaler Stammdatensatz fuer Buchung und Kontakt |
| AMT-004 | Patient-Email nur mit Opt-in speichern | 1 | done | docs/spec.md Abschnitt 1 Patient, Abschnitt 6 | Email darf nur bei expliziter Einwilligung genutzt werden |
| AMT-005 | Letzte Konsultation am Patienten speichern | 1 | done | docs/spec.md Abschnitt 1 Patient | Relevant fuer Rezept- und Praxisregeln |
| AMT-006 | No-Show-Zaehler fuer 12 Monate am Patienten abbilden | 1 | done | docs/spec.md Abschnitt 1 Patient, Abschnitt 2 | Grundlage fuer Erinnerung und Online-Sperre |
| AMT-007 | Eltern-Konto-Verknuepfung fuer Kinder modellieren | 1 | done | docs/spec.md Abschnitt 1 Patient | Kinder duerfen ueber Elternkonto verknuepft sein |
| AMT-008 | Termin-Entitaet mit Termin-ID modellieren | 1 | done | docs/spec.md Abschnitt 1 Termin | Zentrale Buchungsentitaet |
| AMT-009 | Termin mit Patient, Arzt und Terminart verknuepfen | 1 | done | docs/spec.md Abschnitt 1 Termin | Pflichtreferenzen fuer Buchungslogik |
| AMT-010 | Termin mit Datum und Uhrzeit speichern | 1 | done | docs/spec.md Abschnitt 1 Termin | Grundlage fuer Kalender und Erinnerungen |
| AMT-011 | Terminstatus modellieren | 1 | done | docs/spec.md Abschnitt 1 Termin | Statuswerte fuer Buchung, Absage, Wahrnehmung und No-Show |
| AMT-012 | Buchungsart online/telefonisch am Termin speichern | 1 | done | docs/spec.md Abschnitt 1 Termin | Unterscheidung Self-Service vs. MFA |
| AMT-013 | MFA-Notiz am Termin speichern | 1 | done | docs/spec.md Abschnitt 1 Termin, Abschnitt 3 | Enthaelt Fragebogenantworten und interne Notizen |
| AMT-014 | Automatischen Puffer am Termin oder Terminart beruecksichtigen | 1 | done | docs/spec.md Abschnitt 1 Termin, Abschnitt 8 | Standard 5 Minuten, konfigurierbar |
| AMT-015 | Terminarten als konfigurierbare Entitaet modellieren | 1 | done | docs/spec.md Abschnitt 1 Terminart | Vorsorge, Beratung, Impfung usw. |
| AMT-016 | Online-buchbare Terminarten markieren | 1 | done | docs/spec.md Abschnitt 1 Terminart, Abschnitt 2 | Vorsorge, Beratung, Impfung, Wiederholungsrezept-Abholung |
| AMT-017 | Nicht online-buchbare Terminarten markieren | 1 | done | docs/spec.md Abschnitt 1 Terminart | Blutabnahme, Erstgespraech, Akuttermin |
| AMT-018 | Arzt mit ID und Name modellieren | 1 | done | docs/spec.md Abschnitt 1 Arzt | Kann auf bestehendem Employee-Modell aufbauen |
| AMT-019 | Arzt-Kalender und Sprechzeiten modellieren | 1 | done | docs/spec.md Abschnitt 1 Arzt | Grundlage fuer Verfuegbarkeit |
| AMT-020 | Anzahl Akutslots pro Arzt und Tag speichern | 1 | done | docs/spec.md Abschnitt 1 Arzt, Abschnitt 7 | Aerzte duerfen Akutslot-Anzahl festlegen |
| AMT-021 | MFA-Rolle mit Terminverwaltungsrechten abbilden | 1 | done | docs/spec.md Abschnitt 7 | MFAs verwalten Termine, Akutslots, Rezepte und Notizen |
| AMT-022 | Arzt-Rolle mit Rezept- und Stammdatenrechten abbilden | 1 | done | docs/spec.md Abschnitt 7 | Aerzte geben Rezepte frei und aendern Stammdaten |
| AMT-023 | Praxisschliessung/Abwesenheit als Entitaet modellieren | 1 | done | docs/spec.md Abschnitt 1 Praxisschliessung | Sperren fuer Arzt oder ganze Praxis |
| AMT-024 | Praxisschliessungstyp Einzelarzt oder gesamte Praxis speichern | 1 | done | docs/spec.md Abschnitt 1 Praxisschliessung | Typ steuert Wirkung auf Buchbarkeit |
| AMT-025 | Betroffene Aerzte an Praxisschliessung verknuepfen | 1 | done | docs/spec.md Abschnitt 1 Praxisschliessung | Teilmenge bei Arzt-Sperre, alle bei Praxis-Sperre |
| AMT-026 | Zeitraum einer Praxisschliessung speichern | 1 | done | docs/spec.md Abschnitt 1 Praxisschliessung | Von/bis fuer Kalenderpruefung |
| AMT-027 | Wirkung von Praxisschliessungen auf Buchbarkeit definieren | 1 | done | docs/spec.md Abschnitt 1 Praxisschliessung, Abschnitt 2 | Buchung muss betroffene Slots blockieren |

## Phase 2 - Buchung & Fragebogen

| ID | Name | Phase | Status | Quelle | Notiz |
|----|------|-------|--------|--------|-------|
| AMT-028 | Online-Buchung nur fuer erlaubte Terminarten zulassen | 2 | done | docs/spec.md Abschnitt 2 | Vorsorge, Beratung, Impfung, Wiederholungsrezept-Abholung |
| AMT-029 | Online-Buchung fuer gesperrte Terminarten blockieren | 2 | done | docs/spec.md Abschnitt 1 Terminart | Blutabnahme, Erstgespraech, Akuttermin |
| AMT-030 | Zwingende Identifikation vor jeder Buchung erzwingen | 2 | done | docs/spec.md Abschnitt 2, Abschnitt 8 | Login ueber Versichertennummer + Passwort |
| AMT-031 | Login mit Versichertennummer und Passwort bereitstellen | 2 | done | docs/spec.md Abschnitt 8 | Kein Social Login in Spec |
| AMT-032 | Buchbarkeit gegen Arztkalender und Sprechzeiten pruefen | 2 | done | docs/spec.md Abschnitt 1 Arzt, Abschnitt 2 | Nur freie Slots duerfen angeboten werden |
| AMT-033 | Buchbarkeit gegen Praxisschliessungen pruefen | 2 | done | docs/spec.md Abschnitt 2 | Einzelarzt- und Komplettpraxis-Sperren beachten |
| AMT-034 | Buchbarkeit gegen automatische Puffer pruefen | 2 | done | docs/spec.md Abschnitt 8 | Standard 5 Minuten, konfigurierbar |
| AMT-035 | No-Show-Regel mit Erinnerung ab 2 Faellen umsetzen | 2 | done | docs/spec.md Abschnitt 2 | 2x -> Erinnerung |
| AMT-036 | Online-Sperre ab 3 No-Shows umsetzen | 2 | done | docs/spec.md Abschnitt 2 | 3x -> Online-Sperre |
| AMT-037 | Selbstabsage bis 2 Stunden vor Termin erlauben | 2 | done | docs/spec.md Abschnitt 2 | Patient kann rechtzeitig selbst absagen |
| AMT-038 | Spaete Selbstabsage nach 2-Stunden-Grenze blockieren | 2 | done | docs/spec.md Abschnitt 2 | Regel technisch absichern |
| AMT-039 | Fragebogen je Terminart konfigurieren | 2 | done | docs/spec.md Abschnitt 3 | Maximal 5 Fragen pro Terminart |
| AMT-040 | Fragebogen-Maximum von 5 Fragen erzwingen | 2 | done | docs/spec.md Abschnitt 3 | Harte Validierung |
| AMT-041 | Vorsorge-Fragebogen umsetzen | 2 | done | docs/spec.md Abschnitt 3 | Untersuchung, letzte Untersuchung, Beschwerden, Dauermedikamente |
| AMT-042 | Beratung-Fragebogen umsetzen | 2 | done | docs/spec.md Abschnitt 3 | Anlass, seit wann, Arztkontakt, Medikamente |
| AMT-043 | Impfung-Fragebogen umsetzen | 2 | done | docs/spec.md Abschnitt 3 | Letztes Impfdatum, Unvertraeglichkeiten, aktuell krank |
| AMT-044 | Fragebogenantworten als kompakte MFA-Notiz formatieren | 2 | done | docs/spec.md Abschnitt 3 | Frage fett + Antwort als Aufzaehlung |

## Phase 3 - Praxisbetrieb

| ID | Name | Phase | Status | Quelle | Notiz |
|----|------|-------|--------|--------|-------|
| AMT-045 | Wiederholungsrezept als separate Entitaet modellieren | 3 | done | docs/spec.md Abschnitt 1 Wiederholungsrezept | Nicht nur Terminart |
| AMT-046 | Wiederholungsrezept mit Patient verknuepfen | 3 | done | docs/spec.md Abschnitt 1 Wiederholungsrezept | Pflichtreferenz |
| AMT-047 | Medikamentenname oder Verordnung am Rezept speichern | 3 | done | docs/spec.md Abschnitt 1 Wiederholungsrezept | Fachlicher Inhalt der Anfrage |
| AMT-048 | MFA-Anleger am Wiederholungsrezept speichern | 3 | done | docs/spec.md Abschnitt 1 Wiederholungsrezept | Nachvollziehbarkeit |
| AMT-049 | Zustaendigen Arzt am Wiederholungsrezept speichern | 3 | done | docs/spec.md Abschnitt 1 Wiederholungsrezept | Freigabe-Verantwortung |
| AMT-050 | Rezeptstatus angemeldet/freigegeben/abgelehnt/abgeholt abbilden | 3 | done | docs/spec.md Abschnitt 1 Wiederholungsrezept | Statusmaschine fuer Workflow |
| AMT-051 | Antragsdatum und Freigabedatum speichern | 3 | done | docs/spec.md Abschnitt 1 Wiederholungsrezept | Sortierung und Audit |
| AMT-052 | Optionalen Abholtermin mit Wiederholungsrezept verknuepfen | 3 | done | docs/spec.md Abschnitt 1 Wiederholungsrezept | Abholung kann als Termin stattfinden |
| AMT-053 | Wiederholungsrezept-Workflow Patient -> MFA -> Arzt -> Abholung umsetzen | 3 | done | docs/spec.md Abschnitt 2 | Kernprozess fuer Rezeptanfragen |
| AMT-054 | MFA darf Termine verwalten | 3 | done | docs/spec.md Abschnitt 7 | Anlegen, aendern, absagen |
| AMT-055 | MFA darf Akutslots vergeben | 3 | done | docs/spec.md Abschnitt 7 | Operativer Tagesbetrieb |
| AMT-056 | MFA darf Rezepte anlegen | 3 | done | docs/spec.md Abschnitt 7 | Rezeptworkflow startet bei MFA |
| AMT-057 | MFA darf Notizen schreiben | 3 | done | docs/spec.md Abschnitt 7 | Interne Arbeitsnotizen |
| AMT-058 | Arzt darf Rezepte freigeben oder ablehnen | 3 | done | docs/spec.md Abschnitt 7 | Entscheidung im Rezeptworkflow |
| AMT-059 | Arzt darf Akutslot-Anzahl festlegen | 3 | done | docs/spec.md Abschnitt 7 | Pro Arzt konfigurierbar |
| AMT-060 | Arzt darf Stammdaten aendern | 3 | done | docs/spec.md Abschnitt 7 | Rechte technisch abgrenzen |
| AMT-061 | Akutslots fest einem konkreten Arzt pro Tag zuweisen | 3 | done | docs/spec.md Abschnitt 2 | Keine dynamische Zuweisung |
| AMT-062 | MFA-Dashboard: heutige Termine chronologisch anzeigen | 3 | done | docs/spec.md Abschnitt 5 | Linke Spalte |
| AMT-063 | MFA-Dashboard: offene Rezeptanfragen nach Alter sortieren | 3 | done | docs/spec.md Abschnitt 5 | Mittlere Spalte |
| AMT-064 | MFA-Dashboard: verbleibende Akutslots vormittags/nachmittags anzeigen | 3 | done | docs/spec.md Abschnitt 5 | Rechte Spalte |
| AMT-065 | MFA-Dashboard: Termin- oder Rezeptstatus direkt aendern | 3 | done | docs/spec.md Abschnitt 5 | Direkte Aktion |
| AMT-066 | MFA-Dashboard: Notizen direkt hinzufuegen | 3 | done | docs/spec.md Abschnitt 5 | Direkte Aktion |

## Phase 4 - Automatisierung & Integration

| ID | Name | Phase | Status | Quelle | Notiz |
|----|------|-------|--------|--------|-------|
| AMT-067 | In-App-Benachrichtigungen immer bereitstellen | 4 | done | docs/spec.md Abschnitt 6 | Default-Kanal |
| AMT-068 | SMS-Benachrichtigungen nur mit Opt-in erlauben | 4 | done | docs/spec.md Abschnitt 6 | Datenschutz und Einwilligung |
| AMT-069 | 24-Stunden-Erinnerung fuer alle Termine planen | 4 | done | docs/spec.md Abschnitt 6 | Reminder vor Termin |
| AMT-070 | Gleicher-Tag-Erinnerung fuer Termine ab 45 Minuten planen | 4 | done | docs/spec.md Abschnitt 6 | Zusatzregel fuer lange Termine |
| AMT-071 | Impfstoff-Abstand fuer Serientermine konfigurieren | 4 | done | docs/spec.md Abschnitt 4 | Abstand pro Impfstoff |
| AMT-072 | Bis zu 3 Folgetermine fuer Impfserien vorschlagen | 4 | done | docs/spec.md Abschnitt 4 | Systemvorschlag |
| AMT-073 | Patient bestaetigt jeden Folgetermin einzeln | 4 | done | docs/spec.md Abschnitt 4 | Keine automatische Serienbuchung ohne Einzelbestaetigung |
| AMT-074 | Tomedo-Sync fuer Termine umsetzen | 4 | hypo | docs/spec.md Abschnitt 8, Abschnitt 10 | Schnittstellendetails offen |
| AMT-075 | Tomedo-Sync fuer Terminstatus umsetzen | 4 | hypo | docs/spec.md Abschnitt 8, Abschnitt 10 | Konfliktloesung noch zu klaeren |
| AMT-076 | Tomedo-Sync fuer Rezeptanfragen umsetzen | 4 | hypo | docs/spec.md Abschnitt 8, Abschnitt 10 | Schnittstellenfelder offen |

## Phase 5 - Klaerung & Haertung

| ID | Name | Phase | Status | Quelle | Notiz |
|----|------|-------|--------|--------|-------|
| AMT-077 | Finale Fragebogen-Texte fachlich abstimmen | 5 | hypo | docs/spec.md Abschnitt 10 | Wortlaut offen |
| AMT-078 | Detaillierte Tomedo-Schnittstelle spezifizieren | 5 | hypo | docs/spec.md Abschnitt 10 | Auth, Datenfelder, Sync-Richtung, Fehlerfaelle |
| AMT-079 | Datenschutzregeln fuer lokale Patientendaten konkretisieren | 5 | hypo | docs/spec.md Abschnitt 6, Abschnitt 8 | Opt-in, Datenminimierung, Aufbewahrung |
| AMT-080 | Produktiv-Datenbankentscheidung treffen | 5 | hypo | docs/architecture.md | SQLite ist Starterstand, Produktivziel offen |


## KP-001 - Gaeste / Light-Patienten

| ID | Name | Phase | Status | Quelle | Notiz |
|----|------|-------|--------|--------|-------|
| KP-001 | Login per Versichertennummer + Geburtsdatum statt Passwort | 2 | done | docs/spec.md Abschnitt 8 | Minimaler Login ohne Registrierung, Patient muss im System existieren |---

## Workflow

1. Neues Feature aus Spec oder neuer Anforderung mit naechster freier ID eintragen.
2. Status von `hypo` nach `validated`, `in-progress`, `done` oder `killed` bewegen.
3. Commits mit Feature-ID beginnen, z.B. `feat: AMT-NNN feature-name`.

## Verhaeltnis zur Spec

`docs/spec.md` beschreibt die fachliche Grundlage, Produktziele und Prioritaeten. Dieses Backlog ist die operative Feature-Liste. Roadmap-Sicht = nach `Phase` filtern.





