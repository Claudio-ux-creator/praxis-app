# decisions.md - Architektur- und Produktentscheidungen

_Chronologisches Log aller Architektur- und Produktentscheidungen._

---

## 2026-06-26 - Modus Operandi als Solo-Projektstruktur

**Kontext:** Das Projekt brauchte eine AI-lesbare Arbeitsstruktur nach `github.com/jacekzawisza/modus-operandi`.

### Entscheidung

Das Projekt nutzt die Solo-Variante:

- `CLAUDE.md` und `AGENTS.md` im Projekt-Root als Agenten-Briefing.
- `docs/spec.md` fuer fachliche Grundlage, Produktziel und Phasen.
- `docs/backlog.md` mit stabilen `AMT-NNN` Feature-IDs, weil die Spec bereits viele MVP-Features enthaelt.
- `docs/architecture.md` als technische Wahrheit.
- `docs/decisions.md` fuer Architektur- und Produktentscheidungen.
- `docs/concepts/`, `docs/audit/` fuer laufende Artefakte.
- Keine `docs/INBOX.md`, weil Solo und sequenzielles Arbeiten angenommen wird.

### Alternativen verworfen

- **Nur Spec und Decisions:** Zu wenig operativ, da Feature-IDs fuer Commits fehlen.
- **Team-Struktur mit Mission-Dokumenten:** Nicht passend fuer ein SOLO-Projekt.

### Konsequenzen

- Jede groessere Arbeit startet mit Lesen von `AGENTS.md` oder `CLAUDE.md`.
- Neue Features werden im Backlog mit stabiler ID gepflegt.
- Nutzerrelevante Erkenntnisse werden direkt in `docs/spec.md`, `docs/backlog.md` oder `docs/decisions.md` eingepflegt.

## 2026-06-26 - Backlog-Prefix `AMT`

**Kontext:** Die Methodik verlangt stabile Feature-IDs mit Projektprefix.

### Entscheidung

Das Projekt nutzt `AMT-NNN` als ID-Schema fuer "Arzt/MFA Terminplaner".

### Alternativen verworfen

- **FW-NNN:** Generisch und nicht projektspezifisch.
- **Termin-NNN:** Laenger und weniger handlich in Commit-Messages.

### Konsequenzen

- Neue Features werden fortlaufend als `AMT-017`, `AMT-018`, ... angelegt.
- IDs werden nie wiederverwendet.

<!-- Vorlage fuer neue Entscheidungen:

## JJJJ-MM-TT - Titel der Entscheidung

**Kontext:** Warum mussten wir entscheiden?

### Entscheidung

Was wurde entschieden?

### Alternativen verworfen

- Option A: Warum nicht?
- Option B: Warum nicht?

### Konsequenzen

- Positiv
- Negativ / Risiken

-->

## 2026-07-09 - KP-001: Gaeste als Light-Patienten ohne Login

**Kontext:** Bei der Abgabe wurde rueckgemeldet, dass die App schnell erreichbar sein muss, ohne dass Patienten ein Passwort verwalten oder sich registrieren muessen. Der bestehende Login per Versichertennummer + Geburtsdatum ist bereits in der App umgesetzt.

### Entscheidung

Die App verwendet ein Login-light-Modell:

- Patienten loggen sich mit Versichertennummer + Geburtsdatum ein (kein Passwort).
- Es gibt keine separate Registrierung: Jeder Patient, der in der Praxis angelegt ist, kann sich einloggen.
- Gaeste (z.?B. Familienmitglieder oder Erstkontakte) koennen ohne vorherige Anlage in der Praxis nicht online buchen – eine MFA muss sie vorher im System anlegen.
- Fuer Kinder wird ein Eltern-Konto via `parent_account_id` abgebildet.

### Alternativen verworfen

- **Vollstaendiges Registrierungs-Portal mit Passwort:** Zu hohe Huerde fuer Patienten, die nur schnell einen Termin brauchen.
- **Gast-Zugang ohne Identifikation:** Medizinisch nicht vertretbar, da Patient zugeordnet sein muss.

### Konsequenzen

- Login-Flow ist minimal (2 Felder: Versichertennummer + Geburtsdatum).
- Prinzipieller Zugang nur fuer bereits angelegte Patienten.
- MFA muss neue Patienten manuell anlegen koennen.
- Eltern-Konto (AMT-007) wird dadurch wichtiger fuer Kindertermine.

## 2026-07-09 - KP-001: Gaeste als Light-Patienten ohne Login

**Kontext:** Bei der Abgabe wurde rueckgemeldet, dass die App schnell erreichbar sein muss, ohne dass Patienten ein Passwort verwalten oder sich registrieren muessen. Der bestehende Login per Versichertennummer + Geburtsdatum ist bereits in der App umgesetzt.

### Entscheidung

Die App verwendet ein Login-light-Modell:

- Patienten loggen sich mit Versichertennummer + Geburtsdatum ein (kein Passwort).
- Es gibt keine separate Registrierung: Jeder Patient, der in der Praxis angelegt ist, kann sich einloggen.
- Gaeste (z. B. Familienmitglieder oder Erstkontakte) koennen ohne vorherige Anlage in der Praxis nicht online buchen – eine MFA muss sie vorher im System anlegen.
- Fuer Kinder wird ein Eltern-Konto via parent_account_id abgebildet.

### Alternativen verworfen

- **Vollstaendiges Registrierungs-Portal mit Passwort:** Zu hohe Huerde fuer Patienten, die nur schnell einen Termin brauchen.
- **Gast-Zugang ohne Identifikation:** Medizinisch nicht vertretbar, da Patient zugeordnet sein muss.

### Konsequenzen

- Login-Flow ist minimal (2 Felder: Versichertennummer + Geburtsdatum).
- Prinzipieller Zugang nur fuer bereits angelegte Patienten.
- MFA muss neue Patienten manuell anlegen koennen.
- Eltern-Konto (AMT-007) wird dadurch wichtiger fuer Kindertermine.

