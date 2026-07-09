# SPEC.md v3 — Online-Termin-App für Praxis Demir & Kollegen

**Ziel:** Starke Reduzierung des Telefonstress für die MFAs

## Kern-Features
- Online-Buchung für: Vorsorge, Beratung, Impfung, Wiederholungsrezept-Abholung
- Vor-Termin-Fragebogen (max. 5 Fragen je Terminart)
- MFA-Dashboard mit 3 Spalten (heutige Termine, offene Rezepte, Akutslots)
- Separate Entität "Wiederholungsrezept" mit Workflow (Anfrage → MFA → Arzt-Freigabe)
- No-Show-Sperre ab 3 Fehltermine
- Akutslots nur am gleichen Tag ab 07:00 Uhr
- Serientermine für Impfungen (Patient bestätigt jeden einzeln)
- Automatische Erinnerungen (Opt-in, 24h vorher + gleicher Tag bei langen Terminen)
- Integration mit Tomedo (Simulation)

## Wichtige Regeln
- Akutslots sind fest einem Arzt zugewiesen
- Praxisschließungen pro Arzt oder gesamte Praxis
- Rezept-Freigabe nur durch Arzt
- DSGVO: Opt-in für E-Mail/SMS, minimale Daten

## Technik
- Frontend: React + TS + Vite + Tailwind + shadcn/ui
- Backend: Express + TS + SQLite + Drizzle
- Shared Types in /shared/types/
