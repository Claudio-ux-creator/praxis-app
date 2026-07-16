SPEC.MD V3 (FINAL)

**Version:** 3.0  
**Datum:** 18.06.2026  
**Status:** Nach Meeting 2 – ueberarbeitet mit aktuellem Feedback  
**Ziel:** Starke Reduzierung des Telefonaufwands fuer die MFAs

## 1. Entitaeten

### Patient
- Patienten-ID (intern)
- Versichertennummer (Pflicht)
- Name, Vorname, Geburtsdatum, Telefon
- Email (nur mit Opt-in)
- Letzte Konsultation
- No-Show-Zaehler (12 Monate)
- Eltern-Konto-Verknuepfung (bei Kindern)

### Termin
- Termin-ID
- Patient, Arzt, Terminart
- Datum + Uhrzeit
- Status
- Buchungsart (online/telefonisch)
- MFA-Notiz (aus Fragebogen)
- Automatischer Puffer

### Wiederholungsrezept (separate Entitaet)
- Rezept-ID
- Patient (Referenz)
- Medikamentenname / Verordnung
- MFA-Anleger
- Zustaendiger Arzt
- Status (angemeldet, freigegeben, abgelehnt, abgeholt)
- Antragsdatum, Freigabedatum
- Verknuepfung zu optionalem Abholtermin

### Terminart
- Vorsorge, Beratung, Impfung, Wiederholungsrezept-Abholung (online)
- Blutabnahme, Erstgespraech, Akuttermin (nicht online)

### Arzt
- ID, Name
- Eigener Kalender & Sprechzeiten
- Anzahl Akutslots pro Tag

### Praxisschliessung / Abwesenheit
- Typ (Einzelarzt oder gesamte Praxis)
- Betroffene Aerzte
- Zeitraum
- Auswirkung auf Buchbarkeit

## 2. Wichtige Geschaeftsregeln
- Online buchbar: Vorsorge, Beratung, Impfung, Wiederholungsrezept-Abholung
- Immer zwingende Identifikation
- **Akutslots**: Fest einem konkreten Arzt pro Tag zugewiesen (nicht dynamisch dem Naechsten)
- **Wiederholungsrezept-Workflow**: Patient meldet an → MFA legt an → Arzt gibt frei oder lehnt ab → Patient holt ab
- No-Show: 2x → Erinnerung, 3x → Online-Sperre
- Absagen: Selbst bis 2 Std. vorher moeglich
- **Praxisschliessungen**: Einzelne Aerzte oder komplette Praxis koennen gesperrt werden. App muss dies bei der Buchung beruecksichtigen.

## 3. Vor-Termin-Fragebogen
- Max. 5 Fragen pro Terminart
- **Vorsorge**: Welche Untersuchung, letzte Untersuchung, Beschwerden (ja/nein + Satz), Dauermedikamente
- **Beratung**: Anlass (Satz), Seit wann, Schon Arzt aufgesucht (ja/nein), Aktuelle Medikamente
- **Impfung**: Letztes Impfdatum, Unvertraeglichkeiten, aktuell krank (ja/nein)
- Antworten als kompakte Aufzaehlung (Frage fett + Antwort)

## 4. Serientermine (Impfserien)
- Konfigurierbarer Abstand pro Impfstoff
- System schlaegt Folgetermine vor (max. 3)
- Patient bestaetigt jeden Termin einzeln

## 5. MFA-Dashboard
- Links: Heutige Termine (chronologisch)
- Mitte: Offene Rezeptanfragen (nach Alter sortiert)
- Rechts: Verbleibende Akutslots (vormittags / nachmittags)
- Direkte Aktionen: Status aendern, Notizen hinzufuegen

## 6. Benachrichtigungen & Erinnerungen
- In-App immer
- SMS nur bei Opt-in
- 24 Stunden vorher (alle Termine)
- Gleicher-Tag-Erinnerung bei Terminen ≥ 45 Minuten

## 7. Berechtigungen
- **MFAs**: Termine verwalten, Akutslots vergeben, Rezepte anlegen, Notizen schreiben
- **Aerzte**: Rezepte freigeben, Akutslot-Anzahl festlegen, Stammdaten aendern

## 8. Technik & Integration
- Tomedo-Synchronisation (Termine, Status, Rezeptanfragen)
- Automatischer Puffer pro Terminart (standard 5 Min., konfigurierbar)
- Login: Versichertennummer + Passwort

## 9. Prioritaeten (MVP)
- Online-Buchung mit Fragebogen
- Separate Wiederholungsrezept-Entitaet + Workflow
- MFA-Dashboard
- Serientermine
- Automatische Erinnerungen
- Tomedo-Sync
- Akutslot- und Praxisschliessungs-Logik

## 10. Offene Punkte
- Finale Feinabstimmung der Fragebogen-Texte
- Detaillierte Tomedo-Schnittstelle
