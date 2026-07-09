# Modus Operandi - Solo-Projekt

_Stand: 26.06.2026_  
_Adaptiert aus `github.com/jacekzawisza/modus-operandi` fuer dieses Projekt._

## Prinzip

Markdown im Repo ist die Single Source of Truth. Agenten und Mensch lesen dieselben kurzen Artefakte, bevor Code geschrieben wird.

## Artefakte

| Artefakt | Zweck | Pflege |
|----------|-------|--------|
| `AGENTS.md` | Codex-Briefing und Arbeitsregeln | Selten, bei neuen Konventionen |
| `CLAUDE.md` | Claude-Briefing mit gleichem Projektkontext | Selten, bei neuen Konventionen |
| `docs/spec.md` | Fachliche Grundlage, Produktziel und Prioritaeten | Nur bei fachlicher Neufassung |
| `docs/backlog.md` | Operative Feature-Liste mit stabilen IDs | Bei jeder Feature-Statusaenderung |
| `docs/architecture.md` | Technische Wahrheit | Bei Architektur- oder Stack-Aenderungen |
| `docs/decisions.md` | Warum etwas entschieden wurde | Nach relevanten Entscheidungen |
| `docs/concepts/` | Plan-Files fuer komplexe Features | Vor komplexer Umsetzung |
| `docs/audit/` | Security-/Codebase-Audits | Alle 2-4 Wochen oder vor Release |

## Solo-Workflow

1. Kontext laden: `AGENTS.md` oder `CLAUDE.md`, dann `docs/spec.md`, `docs/backlog.md`, `docs/architecture.md`.
2. Aufgabe mit Feature-ID verknuepfen. Falls keine ID existiert, neue ID in `docs/backlog.md` anlegen.
3. Vor komplexen Features ein Konzept in `docs/concepts/AMT-NNN-name.md` schreiben.
4. Implementieren und verifizieren.
5. Am Session-Ende relevante Docs aktualisieren:
   - Backlog-Status
   - Architecture bei technischen Aenderungen
   - Decisions bei dauerhaften Entscheidungen
6. Commit-Message mit Feature-ID formulieren, z.B. `feat: AMT-007 fragebogen-notizen`.

## Wann fragen statt bauen?

- Wenn Tomedo-Schnittstellendetails benoetigt werden.
- Wenn Datenschutz- oder medizinische Freigaben unklar sind.
- Wenn eine fachliche Regel mehrere plausible Interpretationen hat.
- Wenn eine Aenderung bestehende Datenmigrationen oder Patientendaten betrifft.

## Keine INBOX im Default

`docs/INBOX.md` wird bewusst nicht angelegt. In einem Solo-Projekt ohne parallele Doc-Edits entsteht dadurch weniger Pflegeaufwand. Falls spaeter mehrere Maschinen, Worktrees oder Personen parallel Dokumente bearbeiten, kann INBOX nachgeruestet werden.

## Bewusst weggelassen

- `docs/spec.md` ist die zentrale Produktquelle; ein separates Produktdokument wird nicht gepflegt.
- Als Solo-Projekt werden relevante Erkenntnisse direkt in `spec.md`, `backlog.md` oder `decisions.md` eingepflegt.
- Outcome-Tracking wird erst eingefuehrt, wenn reale Nutzer- oder Produktmetriken regelmaessig ausgewertet werden.
