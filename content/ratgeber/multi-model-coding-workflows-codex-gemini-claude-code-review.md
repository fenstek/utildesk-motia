---
slug: "multi-model-coding-workflows-codex-gemini-claude-code-review"
title: "Multi-Model Coding: Wie Codex, Gemini und Claude sich sinnvoll gegenpruefen"
date: 2026-07-10
category: "Einordnung"
eyebrow: "Engineering Workflow"
excerpt: "Mehrere Coding-Agenten helfen nicht, weil sie magisch objektiv sind. Sie helfen, wenn Planung, Umsetzung, Review und Verantwortung sauber getrennt bleiben."
readTime: 11
coverImage: /images/ratgeber/multi-model-coding-workflows-codex-gemini-claude-code-review-cover-editorial-v1.webp
secondaryImage: /images/ratgeber/multi-model-coding-workflows-codex-gemini-claude-code-review-review-workbench-v1.webp
tags:
  - "AI Coding"
  - "Code Review"
  - "Agenten"
  - "Developer Tools"
sidebarTitle: "Kurzfazit"
sidebarPoints:
  - "Ein zweites Modell ist ein Gegenleser, keine Sicherheitsgarantie."
  - "Gute Multi-Model-Workflows teilen Rollen, Kontext und Freigaben - nicht einfach Prompts."
  - "Kleine Diffs, Tests und ein menschlicher Merge-Owner bleiben wichtiger als der Modellname."
relatedTools:
  - title: "OpenAI Codex"
    href: "/tools/openai-codex/"
  - title: "Claude"
    href: "/tools/claude/"
  - title: "Gemini"
    href: "/tools/gemini/"
  - title: "GitHub Copilot"
    href: "/tools/github-copilot/"
  - title: "Cursor"
    href: "/tools/cursor/"
decisionTools:
  - title: "OpenAI Codex"
    href: "/tools/openai-codex/"
    note: "gut fuer terminalnahe Aufgaben mit klaren Tests, Git-Diffs und expliziten Freigaben"
    score: "8.7"
    kind: "recommend"
  - title: "Claude"
    href: "/tools/claude/"
    note: "stark als zweiter Leser fuer Spezifikationen, Architekturannahmen und erklaerungsintensive Reviews"
    score: "8.5"
    kind: "recommend"
  - title: "Gemini"
    href: "/tools/gemini/"
    note: "sinnvoll, wenn breiter Projektkontext, Dokumentation oder Google-nahe Arbeitsablaeufe in die Gegenpruefung gehoeren"
    score: "8.2"
    kind: "recommend"
decisionAvoid:
  - "drei Agenten auf dieselbe unklare Aufgabe loslassen und Konsens mit Qualitaet verwechseln"
  - "vollen Repository- oder Produktionskontext ungefiltert zwischen Anbietern kopieren"
  - "einen automatischen Agenten-Merge ohne Tests, Code-Owner und klaren Rueckrollpunkt zulassen"
decisionNote: "Mehr Modelle sind nur dann ein Gewinn, wenn jede Rolle ein klares Artefakt liefert: Spezifikation, kleiner Diff, Testprotokoll oder begruendetes Review."
---

Ein Coding-Agent kann in einer Stunde erstaunlich viel bewegen: Dateien lesen, einen Plan schreiben, Code aendern, Tests starten und einen Pull Request vorbereiten. Genau deshalb ist die verlockende Idee so verbreitet, drei Agenten hintereinander zu schalten: Einer plant, einer implementiert, einer kritisiert. Das klingt nach einem kleinen Entwicklungsteam im Terminal.

Die nuetzliche Version dieser Idee ist weniger spektakulaer. Sie beruht nicht darauf, dass [OpenAI Codex](/tools/openai-codex/), [Claude](/tools/claude/) und [Gemini](/tools/gemini/) einander automatisch besser verstehen. Sie beruht darauf, dass ein Team unterschiedliche Blickwinkel erzwingt. Ein Agent darf einen Vorschlag machen. Ein anderer bekommt nur Spezifikation, Diff und Tests und muss versuchen, ihn zu widerlegen. Der Mensch entscheidet, ob das Ergebnis in den Hauptbranch darf.

So entsteht keine KI-Jury, die Verantwortung wegstimmt, sondern ein wiederholbarer Review-Workflow. Das ist besonders wertvoll bei Refactorings, Migrationsschritten, sicherheitsrelevanten Aenderungen und Aufgaben, bei denen ein plausibler Patch noch lange kein guter Patch ist.

## Das Problem ist nicht ein Modell, sondern ein geschlossener Kreis

Wenn derselbe Agent Aufgabe, Plan, Umsetzung und Abnahme schreibt, entsteht leicht ein geschlossener Kreis. Der Agent kennt seine eigene Absicht. Er kann deshalb sehr ueberzeugend erklaeren, warum sein Patch richtig sei, ohne dass damit bewiesen ist, dass der Patch die Anforderungen trifft.

Das ist kein Vorwurf an ein bestimmtes Modell. Auch ein menschlicher Entwickler uebersieht in einem eigenen Diff leichter Annahmen, vergessene Randfaelle oder Tests, die nur den Happy Path messen. Der Unterschied ist das Tempo: Ein Agent kann diese blinden Flecken sehr schnell in viele Dateien multiplizieren.

Ein zweites Modell ist daher keine Wahrheitssuchmaschine. Es ist ein absichtlich anders gebriefter Gegenleser. Sein Prompt sollte nicht lauten: "Ist das gut?" Besser sind konkrete Angriffspunkte:

- Vergleiche diesen Diff gegen die Akzeptanzkriterien. Was fehlt?
- Suche nach Nebenwirkungen in Berechtigungen, Fehlerbehandlung und Datenmigration.
- Pruefe, ob die Tests wirklich den beschriebenen Fehler reproduzieren.
- Nenne drei Gruende, warum dieser Patch nicht gemergt werden sollte.

Das funktioniert auch mit nur einem Modell in zwei sauber getrennten Sessions. Unterschiedliche Modellfamilien koennen einen zusaetzlichen Blickwinkel bringen, sind aber kein Ersatz fuer getrennten Kontext, klare Kriterien und Tests.

## Drei Rollen, vier Artefakte

Ein brauchbarer Multi-Model-Workflow trennt nicht bloss Chatfenster, sondern Verantwortlichkeiten. Fuer ein normales Feature reichen oft drei Rollen und vier sichtbare Artefakte.

| Rolle | Auftrag | Ergebnis, das im Repo bleibt |
| --- | --- | --- |
| Planer | Anforderungen klaeren, Risiken und Teststrategie benennen | kurze Spezifikation oder Issue-Kommentar |
| Umsetzer | genau einen begrenzten Arbeitsauftrag erledigen | kleiner, nachvollziehbarer Diff |
| Gegenleser | Anforderungen, Diff und Testergebnis gegeneinander halten | Review mit Prioritaeten und offenen Fragen |
| Menschlicher Owner | Risiko, Produktabsicht und Merge bewerten | Freigabe oder Rueckgabe mit Begruendung |

Die Rollen koennen mit Codex, Claude, Gemini, [GitHub Copilot](/tools/github-copilot/) oder [Cursor](/tools/cursor/) besetzt werden. Fuer Teams ist es klueger, sie an einer echten Aufgabe zu testen als aus Benchmark-Tabellen einen Sieger zu kueren.

Ein Beispiel: Eine SaaS-Anwendung soll einen Exportjob wiederaufnehmbar machen. Der Planer beschreibt Zustandsuebergaenge, Abbruchfaelle und die Beobachtung, die spaeter bei Fehlern noetig ist. Der Umsetzer bekommt nur diese Spezifikation und einen eigenen Branch. Der Gegenleser sieht danach den Diff, die Akzeptanzkriterien und den Testlauf. Er soll nicht neu implementieren, sondern fehlende Idempotenz, ungepruefte Berechtigungen oder einen stillen Datenverlust finden. Erst dann schaut ein Mensch auf den Pull Request.

Diese Reihenfolge ist viel wichtiger als die Frage, welches Modell welche Zeile tippt.

## Kontext ist Arbeitsmaterial, kein Paket fuer alle

Mehrere Agenten erzeugen schnell einen neuen Engpass: Kontext wird wie ein schwerer Koffer von Tool zu Tool getragen. Ganze Repositories, Logs, Zugangsdaten oder private Kundendokumente in jeden Prompt zu kippen, ist teuer und riskant. Es macht den Review oft auch schlechter, weil das eigentliche Signal im Material untergeht.

Fuer die Uebergabe an einen Gegenleser genuegen meistens vier Dinge:

1. ein Satz zum fachlichen Ziel;
2. die akzeptierten Nicht-Ziele und Risiken;
3. der relevante Diff samt Dateiliste;
4. Tests, Lint- und Build-Ergebnis.

Projektregeln helfen, diesen Kontext stabil zu halten. Claude Code kann Regeln und Memory aus `CLAUDE.md`-artigen Projektdateien einbeziehen; die Gemini CLI nutzt hierarchische `GEMINI.md`-Dateien. Bei Codex lohnen sich projektnahe Agentenhinweise, Befehle und Testkonventionen. Entscheidend ist die gemeinsame Substanz: Agenten sollen wissen, welche Befehle sicher sind, welche Dateien tabu bleiben und wie ein Ergebnis verifiziert wird.

Solche Dateien sind jedoch keine Sicherheitsgrenze. Wenn ein Agent keine Produktion anfassen darf, braucht er weiterhin eingeschraenkte Rechte, keine Produktionstoken und einen isolierten Arbeitsbereich.

## Worktrees machen Parallelitaet pruefbar

Parallele Agenten im gleichen Arbeitsverzeichnis sind eine kleine Katastrophe mit guter Vermarktung. Einer formatiert Dateien, der zweite veraendert dieselben Imports, der dritte testet einen Zwischenstand. Danach weiss niemand mehr, welcher Test zu welchem Diff gehoerte.

Hier ist `git worktree` erstaunlich modern. Git kann mehrere Arbeitsverzeichnisse fuer unterschiedliche Branches verwalten. Ein Agent arbeitet in einem eigenen Worktree, ein Reviewer prueft eine feste Commit-ID oder einen Pull Request, und der Hauptarbeitsbaum bleibt ruhig. Das ist nicht nur sauberer, sondern schafft einen echten Rueckrollpunkt.

Praktisch kann ein Team fuer ein Ticket drei Orte haben:

- `feature/export-resume`: Umsetzung und Tests;
- `review/export-resume`: nur Diff, Spezifikation und Gegenpruefung;
- `main`: unveraenderter Integrationsstand.

Der Review-Agent braucht keinen Schreibzugriff auf den Feature-Branch. Wenn er einen Fehler vermutet, beschreibt er ihn, formuliert einen Test oder legt einen separaten Patch vor. So bleibt klar, wer welche Aenderung verantwortet.

## Ein einfacher Ablauf, der heute funktioniert

Der beste Einstieg ist kein vollautomatisches Agentenorchester. Nehmen Sie ein Ticket, das in ein bis zwei Stunden menschlicher Arbeit realistisch waere. Dann fahren Sie vier Runden:

**1. Erst die Spezifikation.** Ein Agent entwirft Akzeptanzkriterien, Nicht-Ziele, betroffene Dateien und Testfaelle. Ein Mensch streicht vage Punkte. Ohne diesen Schritt prueft der spaetere Reviewer nur Stil.

**2. Eine Umsetzung in einem isolierten Branch.** Der Umsetzer darf bauen, aber der Auftrag bleibt klein. Er soll den Diff erklaeren und die wirklich ausgefuehrten Befehle nennen. Bei groesseren Aufgaben teilt man die Arbeit lieber in zwei Pull Requests als in zehn Subagenten.

**3. Kaltes Review.** Ein anderes Modell oder eine frische Session erhaelt keine lange Entstehungsgeschichte. Es bekommt Spezifikation, Diff und Testergebnis. Sein Ziel ist, Annahmen zu brechen. Besonders produktiv sind Fragen nach Migrationen, Berechtigungen, Fehlermeldungen, Nebenlaeufigkeit und unbehandelten Rueckgabewerten.

**4. Tests und menschliche Entscheidung.** Der Merge-Owner schaut auf die offenen Punkte und auf die automatischen Gates. Ein Agent darf einen fehlgeschlagenen Test erklaeren, aber nicht wegargumentieren. Wenn der Patch zu gross geworden ist, wird er geteilt oder zurueckgegeben.

Das Resultat ist weniger heroisch als ein Agent, der nachts eine ganze Anwendung umbaut. Es produziert aber Artefakte, die das Team am naechsten Montag noch versteht.

<figure class="article-inline-figure">
  <img src="/images/ratgeber/multi-model-coding-workflows-codex-gemini-claude-code-review-review-workbench-v1.webp" alt="Redaktionelle Illustration: ein Entwicklerteam prueft an einem Werkbanktisch getrennte Codeaenderungen und Testberichte" loading="lazy" decoding="async" />
</figure>

## Was ein zweites Modell wirklich pruefen soll

Die beste Review-Frage ist selten "Findest du Bugs?" Sie gibt dem Agenten zu viel Raum fuer Allgemeinplaetze. Nutzen Sie stattdessen eine kleine feste Checkliste:

- **Vertrag:** Erfuellt der Diff die Akzeptanzkriterien und nur diese?
- **Grenzen:** Welche Eingaben, Rechte, Fehlerfaelle oder Migrationspfade sind nicht abgedeckt?
- **Nachweis:** Welcher Test beweist die kritischste Behauptung?
- **Betrieb:** Was sieht ein Mensch in Log, Monitoring oder Fehlermeldung, wenn es schiefgeht?
- **Rueckbau:** Wie wird die Aenderung deaktiviert oder zurueckgenommen?

Ein gutes Review kann dabei zu dem Schluss kommen, dass kein zweites Modell noetig war. Fuer triviale Umbenennungen oder lokale UI-Korrekturen reicht ein normaler Pull Request. Multi-Model-Aufwand lohnt sich dort, wo die Kosten eines plausiblen Fehlers groesser sind als zusaetzliche zehn Minuten Gegenlesen.

## Kosten, Datenschutz und die falsche Sicherheit von Konsens

Mehrere Agenten kosten nicht nur Tokens. Sie verteilen Kontext auf mehr Anbieter und erzeugen mehr Logdaten, lokale Checkouts und Freigabepunkte. Vorher sollte daher klar sein, welche Codebereiche, Tickets und Testartefakte ueberhaupt an welches Tool gehen duerfen. Produktionsgeheimnisse, Kundendaten und Zugangsdaten gehoeren nicht in einen Review-Prompt.

Ebenso gefaehrlich ist Modellkonsens. Wenn zwei Agenten dieselbe unvollstaendige Spezifikation bekommen, koennen sie sich sehr elegant auf denselben Fehler einigen. Die Gegenmassnahme ist nicht ein viertes Modell, sondern bessere Eingaben: explizite Nicht-Ziele, reproduzierbare Tests, klare Daten- und Berechtigungsgrenzen sowie ein Owner, der widersprechen darf.

Wenn Teams Automatisierung weiter ausbauen, sollten sie sie schrittweise vergroessern. Erst ein read-only Review. Dann ein vorgeschlagener Patch in einem Worktree. Danach ein automatischer Testlauf. Direkte Schreibrechte in kritischen Repositories sind der letzte, nicht der erste Schritt.

## Fazit: Gegenpruefung ist ein Prozess, kein Modelltrick

Codex, Claude und Gemini koennen in einem Engineering-Workflow ausgezeichnet zusammenarbeiten. Ihre Kombination wird aber erst dann wertvoll, wenn sie eine saubere Arbeitsteilung sichtbar macht: jemand formuliert den Vertrag, jemand aendert wenig und beweist es mit Tests, jemand versucht die Annahmen zu brechen, ein Mensch verantwortet den Merge.

Wer damit beginnen will, startet mit einem einzigen Ticket und misst nicht die Anzahl der Agenten, sondern die Qualitaet der Artefakte: War der Diff kleiner? Wurden mehr Randfaelle frueh entdeckt? Konnte jemand ausserhalb der Session die Entscheidung nachvollziehen? Wenn die Antworten besser werden, ist der Workflow reif fuer den naechsten Schritt.

Weiterfuehrend passen unsere Einordnungen zu [Coding-Agenten im Entwickler-Workflow](/ratgeber/coding-agenten-2026-codex-claude-code-und-gemini-cli-im-entwickler-workflow/), [KI-Code ohne Kontrolle](/ratgeber/ki-code-ohne-kontrolle-der-neue-engpass-liegt-nicht-im-schreiben-sondern-im-verstehen/), [agentischen Developer-Workflows](/ratgeber/wie-agentische-developer-workflows-gerade-produktionsreif-werden-einordnung-prax/) und [Agent Observability](/ratgeber/agent-observability-und-debugging-wie-teams-ki-agenten-nachvollziehbar-machen/).

## Quellen und weiterfuehrende Hinweise

1. [OpenAI Codex](https://openai.com/codex/)
2. [OpenAI: Codex CLI Getting Started](https://help.openai.com/en/articles/11096431)
3. [Claude Code: Subagents](https://code.claude.com/docs/en/sub-agents)
4. [Claude Code: Hooks](https://code.claude.com/docs/en/hooks)
5. [Gemini CLI: GEMINI.md-Kontext](https://geminicli.com/docs/cli/gemini-md/)
6. [Git: worktree](https://git-scm.com/docs/git-worktree)
