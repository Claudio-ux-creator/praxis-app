SPEC.MD V3 (FINAL)

**Version:** 3.0  
**Datum:** 18.06.2026  
**Status:** Nach Meeting 2 – überarbeitet mit aktuellem Feedback  
**Ziel:** Starke Reduzierung des Telefonaufwands für die MFAs

## 1. Entitäten

### Patient
- Patienten-ID (intern)
- Versichertennummer (Pflicht)
- Name, Vorname, Geburtsdatum, Telefon
- Email (nur mit Opt-in)
- Letzte Konsultation
- No-Show-Zähler (12 Monate)
- Eltern-Konto-Verknüpfung (bei Kindern)

### Termin
- Termin-ID
- Patient, Arzt, Terminart
- Datum + Uhrzeit
- Status
- Buchungsart (online/telefonisch)
- MFA-Notiz (aus Fragebogen)
- Automatischer Puffer

### Wiederholungsrezept (separate Entität)
- Rezept-ID
- Patient (Referenz)
- Medikamentenname / Verordnung
- MFA-Anleger
- Zuständiger Arzt
- Status (angemeldet, freigegeben, abgelehnt, abgeholt)
- Antragsdatum, Freigabedatum
- Verknüpfung zu optionalem Abholtermin

### Terminart
- Vorsorge, Beratung, Impfung, Wiederholungsrezept-Abholung (online)
- Blutabnahme, Erstgespräch, Akuttermin (nicht online)

### Arzt
- ID, Name
- Eigener Kalender & Sprechzeiten
- Anzahl Akutslots pro Tag

### Praxisschließung / Abwesenheit
- Typ (Einzelarzt oder gesamte Praxis)
- Betroffene Ärzte
- Zeitraum
- Auswirkung auf Buchbarkeit

## 2. Wichtige Geschäftsregeln
- Online buchbar: Vorsorge, Beratung, Impfung, Wiederholungsrezept-Abholung
- Immer zwingende Identifikation
- **Akutslots**: Fest einem konkreten Arzt pro Tag zugewiesen (nicht dynamisch dem Nächsten)
- **Wiederholungsrezept-Workflow**: Patient meldet an → MFA legt an → Arzt gibt frei oder lehnt ab → Patient holt ab
- No-Show: 2x → Erinnerung, 3x → Online-Sperre
- Absagen: Selbst bis 2 Std. vorher möglich
- **Praxisschließungen**: Einzelne Ärzte oder komplette Praxis können gesperrt werden. App muss dies bei der Buchung berücksichtigen.

## 3. Vor-Termin-Fragebogen
- Max. 5 Fragen pro Terminart
- **Vorsorge**: Welche Untersuchung, letzte Untersuchung, Beschwerden (ja/nein + Satz), Dauermedikamente
- **Beratung**: Anlass (Satz), Seit wann, Schon Arzt aufgesucht (ja/nein), Aktuelle Medikamente
- **Impfung**: Letztes Impfdatum, Unverträglichkeiten, aktuell krank (ja/nein)
- Antworten als kompakte Aufzählung (Frage fett + Antwort)

## 4. Serientermine (Impfserien)
- Konfigurierbarer Abstand pro Impfstoff
- System schlägt Folgetermine vor (max. 3)
- Patient bestätigt jeden Termin einzeln

## 5. MFA-Dashboard
- Links: Heutige Termine (chronologisch)
- Mitte: Offene Rezeptanfragen (nach Alter sortiert)
- Rechts: Verbleibende Akutslots (vormittags / nachmittags)
- Direkte Aktionen: Status ändern, Notizen hinzufügen

## 6. Benachrichtigungen & Erinnerungen
- In-App immer
- SMS nur bei Opt-in
- 24 Stunden vorher (alle Termine)
- Gleicher-Tag-Erinnerung bei Terminen ≥ 45 Minuten

## 7. Berechtigungen
- **MFAs**: Termine verwalten, Akutslots vergeben, Rezepte anlegen, Notizen schreiben
- **Ärzte**: Rezepte freigeben, Akutslot-Anzahl festlegen, Stammdaten ändern

## 8. Technik & Integration
- Tomedo-Synchronisation (Termine, Status, Rezeptanfragen)
- Automatischer Puffer pro Terminart (standard 5 Min., konfigurierbar)
- Login: Versichertennummer + Passwort

## 9. Prioritäten (MVP)
- Online-Buchung mit Fragebogen
- Separate Wiederholungsrezept-Entität + Workflow
- MFA-Dashboard
- Serientermine
- Automatische Erinnerungen
- Tomedo-Sync
- Akutslot- und Praxisschließungs-Logik

## 10. Offene Punkte
- Finale Feinabstimmung der Fragebogen-Texte
- Detaillierte Tomedo-Schnittstelle