# AGENTS.md - Arzt/MFA Terminplaner

## Projekt

Solo-Projekt fuer ein medizinisches Terminplanungssystem. Ziel ist weniger Telefonaufwand fuer MFAs durch Online-Buchung, Vor-Termin-Frageboegen, Wiederholungsrezept-Workflow, Erinnerungen und Tomedo-Synchronisation.

## Kontext zuerst lesen

1. `docs/spec.md` - fachliche Grundlage, Version 3.0.
2. `docs/backlog.md` - stabile Feature-IDs und Status.
3. `docs/architecture.md` - technischer Stand und Konventionen.
4. `docs/decisions.md` - dauerhafte Entscheidungen.
5. `docs/modus-operandi.md` - Arbeitsweise fuer dieses Solo-Projekt.

## Tech-Stack

- Node.js + TypeScript
- Express API
- Prisma ORM
- SQLite fuer lokalen Starterstand

## Arbeitsregeln

- Aendere nur, was fuer die aktuelle Aufgabe noetig ist.
- Nutze bestehende Patterns: Routes in `src/routes`, Prisma-Modell in `prisma/schema.prisma`.
- Business-Regeln fuer Buchung, No-Show, Rezeptstatus und Praxisschliessungen nicht quer in Route-Handlern duplizieren.
- Neue Features im Backlog mit `AMT-NNN` referenzieren.
- Bei fachlich unklaren Regeln erst klaeren, besonders bei Tomedo, Datenschutz und medizinischen Freigaben.
- Keine Secrets, Patientendaten oder `.env`-Inhalte in Prompts, Docs oder Commits schreiben.

## Verifikation

- Nach Code-Aenderungen nach Moeglichkeit `npm run build` ausfuehren.
- Wenn Tests eingefuehrt werden, fachliche Regeln mit Tests absichern.
- Bei neuen Architekturentscheidungen `docs/decisions.md` aktualisieren.

## Sprache

- Projektdokumentation auf Deutsch.
- Code-Bezeichner auf Englisch, ausser vorhandene Fachbegriffe sprechen klar dagegen.
- UI-/API-Fehlermeldungen fuer Nutzer auf Deutsch.
