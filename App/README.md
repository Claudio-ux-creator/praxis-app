# Arzt/MFA Terminplaner

Ein Starterprojekt fuer ein medizinisches Terminplanungssystem mit Arzt/MFA-Verwaltung.

Das Projekt ist als Solo-Projekt nach der Modus-Operandi-Methodik eingerichtet. Einstieg fuer Agenten und Menschen:

- `AGENTS.md` / `CLAUDE.md` - Projektbriefing und Arbeitsregeln
- `docs/spec.md` - fachliche Grundlage, Produktziel und Roadmap
- `docs/backlog.md` - stabile Feature-IDs
- `docs/architecture.md` - technische Wahrheit
- `docs/decisions.md` - Entscheidungslog

## Enthaltene Elemente

- Node.js + Express Backend
- TypeScript
- SQLite + Prisma Datenmodell
- Basis-API fuer Arzt/MFA und verfuegbare Sprechzeiten

## Schnellstart

1. `npm install`
2. `npm run prisma:generate`
3. `npm run prisma:migrate`
4. `npm run dev`

## API Endpunkte

- `GET /api/staff` - Liste aller Aerzte und MFAs

## Naechster Schritt

Implementiere weitere Modelle wie Patient, Terminart und Terminlogik. Fuer neue Features zuerst `docs/backlog.md` pruefen und die passende `AMT-NNN`-ID verwenden.
