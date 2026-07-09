# CLAUDE.md - Arzt/MFA Terminplaner

## Projekt

Solo-Projekt fuer ein medizinisches Terminplanungssystem. Ziel ist weniger Telefonaufwand fuer MFAs durch Online-Buchung, Vor-Termin-Frageboegen, Wiederholungsrezept-Workflow, Erinnerungen und Tomedo-Synchronisation.

## Was bauen wir?

Lies:

- `docs/spec.md` fuer die fachliche Grundlage.
- `docs/backlog.md` fuer Feature-IDs und Status.

## Tech-Stack + Standards

Lies `docs/architecture.md`.

Aktueller Stack:

- Node.js + TypeScript
- Express
- Prisma
- SQLite lokal

## Architektur-Entscheidungen

Lies `docs/decisions.md`.

## Arbeitsweise

Lies `docs/modus-operandi.md`.

Solo-Default:

- Keine Team-Mission-Dokumente.
- Keine `docs/INBOX.md`, solange nicht parallel an Docs gearbeitet wird.
- `docs/spec.md` ist die zentrale Produktquelle.
- Keine Meeting- oder Outcome-Tracking-Artefakte in diesem Solo-Projekt.
- Feature-Arbeit immer mit `AMT-NNN` aus `docs/backlog.md` verbinden.

## Coding-Prinzipien

1. **Think before coding:** Annahmen explizit machen. Bei Mehrdeutigkeit fragen.
2. **Simplicity first:** Minimaler Code, der das Problem sauber loest.
3. **Surgical changes:** Keine unaufgeforderten Architektur-Refactors.
4. **Goal-driven execution:** Erfolgskriterien und Verifikation vor Abschluss klaeren.

## Coding-Konventionen

- Code-Bezeichner auf Englisch.
- Dokumentation auf Deutsch.
- Nutzernahe Fehlermeldungen auf Deutsch.
- Routes unter `src/routes`.
- Prisma-Schema in `prisma/schema.prisma`.
- Komplexe Business-Regeln in Services/Domain-Funktionen buendeln, nicht in mehreren Route-Handlern kopieren.

## Gotchas / Bekannte Fallen

- Tomedo ist fachlich gesetzt, technische Schnittstellendetails sind offen.
- Patientendaten sind sensibel: Datenminimierung und Opt-in beachten.
- Akutslots sind fest einem Arzt pro Tag zugeordnet, nicht dynamisch.
- Wiederholungsrezepte sind eine eigene Entitaet, nicht nur eine Terminart.
- Frageboegen haben maximal 5 Fragen pro Terminart.
