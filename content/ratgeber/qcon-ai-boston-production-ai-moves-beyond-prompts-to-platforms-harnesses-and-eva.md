---
slug: "qcon-ai-boston-production-ai-moves-beyond-prompts-to-platforms-harnesses-and-eva"
title: "QCon AI Boston: Warum Produktions-KI jetzt Plattformen, Harnesses und Evals braucht"
date: 2026-07-23
category: "Anleitung"
eyebrow: "KI-Anleitung"
excerpt: "QCon AI Boston zeigt eine nüchterne Verschiebung: Produktionsreife entsteht nicht durch bessere Prompts allein, sondern durch Kontext, Zustandsverwaltung, überprüfbare Grenzen und belastbare Evals."
readTime: 9
coverImage: /images/ratgeber/qcon-ai-boston-production-ai-moves-beyond-prompts-to-platforms-harnesses-and-evals-cover.webp
secondaryImage: /images/ratgeber/qcon-ai-boston-production-ai-moves-beyond-prompts-to-platforms-harnesses-and-evals-evals.webp
tags:
  - "KI-Agenten"
  - "KI-Orchestrierung"
  - "Developer Tools"
  - "Softwareentwicklung"
  - "Evals"
sidebarTitle: "Kurzfazit"
sidebarPoints:
  - "Ein Produktions-Agent ist ein System mit Zustand, Werkzeugen, Grenzen und Belegen, nicht nur ein Prompt mit mehr Autonomie."
  - "Evals müssen reale Aufgaben, Fehlermodi und Kosten prüfen; ein grüner Unit-Test reicht für Agenten-Workflows nicht aus."
  - "Der sichere Einstieg ist ein begrenzter Workflow mit klarer Spezifikation, CI-Gates und menschlicher Freigabe für riskante Mutationen."
relatedTools:
  - title: "LangGraph"
    href: "/tools/langgraph/"
  - title: "CrewAI"
    href: "/tools/crew-ai/"
  - title: "Claude Code"
    href: "/tools/claude/"
  - title: "OpenAI Codex"
    href: "/tools/openai-codex/"
  - title: "GitHub Copilot"
    href: "/tools/github-copilot/"
  - title: "Augment Code"
    href: "/tools/openai-codex/"
decisionTools:
  - title: "LangGraph"
    href: "/tools/langgraph/"
    note: "passend für langlaufende, zustandsbehaftete Abläufe mit Checkpoints und Wiederaufnahme"
    score: "8.8"
    kind: "recommend"
  - title: "CrewAI"
    href: "/tools/crew-ai/"
    note: "nützlich für rollenbasierte Agenten-Flows, wenn Zuständigkeiten und Grenzen sauber definiert sind"
    score: "8.2"
    kind: "recommend"
  - title: "Augment Code"
    href: "/tools/openai-codex/"
    note: "interessant für spec-getriebene Verifikation vor dem Pull Request"
    score: "7.9"
    kind: "caution"
decisionAvoid:
  - "einen Agenten mit breiten Schreibrechten starten, bevor Idempotenz, Logs und Rollback getestet sind"
  - "Agentenqualität nur anhand von Demo-Ausgaben oder selbstgeschriebenen Tests bewerten"
  - "ein veraltetes oder zu vages Spec-Dokument als verlässliche Kontrollinstanz behandeln"
decisionNote: "Die zentrale Frage nach QCon ist nicht, welches Modell am cleversten antwortet, sondern ob ein Team den gesamten Lauf nachvollziehen, unterbrechen, prüfen und sicher wiederholen kann."
---

Ein Prompt kann beeindruckend sein. Ein Produktionssystem muss dagegen auch am Dienstagmorgen funktionieren, wenn ein API-Fehler, ein veralteter Kontext oder ein halb fertiger Lauf dazwischenkommt. Genau diese Verschiebung stand im Mittelpunkt der QCon AI Boston 2026: Weg vom isolierten Prompt, hin zu Plattformen, Agent-Harnesses und Evals, die ein System über längere Zeit kontrollierbar machen.

Das ist keine Absage an gute Prompts. Sie bleiben ein Teil des Systems. Aber sie sind nicht mehr die ganze Architektur. Wer einen Agenten in einen echten Entwicklungs-, Support- oder Datenprozess einbauen will, muss zusätzlich klären: Welchen Zustand besitzt der Lauf? Welche Werkzeuge darf er benutzen? Was gilt als Erfolg? Wer stoppt ihn? Und welcher Beleg zeigt später, warum eine Aktion ausgeführt wurde?

## Von Prompts zu Produktionssystemen

Der praktische Engpass liegt häufig vor der eigentlichen Modellantwort. Ein Agent braucht relevanten Kontext, darf nicht beliebig alte Informationen mischen und muss seine Zwischenschritte in eine kontrollierte Reihenfolge bringen. Das wird oft als **Context Engineering** beschrieben: nicht nur eine Anweisung formulieren, sondern die Informationen, Werkzeuge und Grenzen so strukturieren, dass der Lauf überhaupt verlässlich arbeiten kann.

Bei einer kleinen Textaufgabe genügt ein Chat. Bei einem mehrstufigen Software-Workflow sieht es anders aus: Der Agent liest ein Ticket, durchsucht ein Repository, verändert mehrere Dateien, führt Tests aus und erstellt einen Pull Request. Jeder Schritt erzeugt Zustand. Wenn der Prozess nach dem dritten Schritt abbricht, sollte das Team nicht von vorn beginnen oder den Zustand aus einem Chatverlauf rekonstruieren müssen.

Darum sind Runtime-Funktionen wichtiger geworden: Checkpoints, Wiederaufnahme, Streaming, Human-in-the-loop und eine klare Trennung zwischen Lesen und mutierenden Aktionen. [LangGraph](/tools/langgraph/) beschreibt diese Ebene ausdrücklich als Orchestrierungs-Runtime für langlaufende, zustandsbehaftete Agenten. [CrewAI](/tools/crew-ai/) verfolgt einen stärker rollen- und prozessorientierten Ansatz. Beide ersetzen keine Architekturentscheidung, machen aber sichtbar, wo diese Entscheidung liegt.

## Was ein Agent Harness leistet

Ein **Agent Harness** ist kein einzelner Sicherheitsfilter. Es ist die Umgebung, die einen Agenten führt und seine Freiheit begrenzt. Dazu gehören mindestens:

- erlaubte Werkzeuge und Datenquellen;
- Berechtigungen pro Schritt oder Identität;
- Zustands- und Checkpointverwaltung;
- Zeit-, Kosten- und Wiederholungslimits;
- Audit-Logs für Tool-Aufrufe und Schreibaktionen;
- definierte Unterbrechungen und menschliche Freigaben;
- Rollback- oder Kompensationspfade für fehlgeschlagene Mutationen.

Ein gutes Harness beantwortet damit eine unangenehme, aber nützliche Frage: Was darf der Agent tun, wenn seine Interpretation falsch ist? Bei einer Recherche darf ein Irrtum zunächst nur eine schlechte Antwort erzeugen. Bei einem Agenten, der Tickets schließt, Berechtigungen ändert oder eine Zahlung vorbereitet, muss derselbe Irrtum an einer kontrollierten Grenze enden.

Das Model Context Protocol kann dabei den Anschluss an Werkzeuge und Datenquellen standardisieren. Es löst aber nicht automatisch Autorisierung, Datenklassifizierung oder Geschäftsfreigaben. Ein standardisierter Stecker ist noch keine sichere Steckdose.

## Evals sind kein nachträglicher Schönheitscheck

Evals werden oft mit einer Sammlung von Beispielprompts verwechselt. Für produktive Agenten müssen sie näher an einem Testprogramm liegen. Ein brauchbarer Eval-Satz enthält reale Aufgaben, erwartete Zustände, zulässige Abweichungen und negative Fälle.

![Ein Agent durchläuft unabhängige Prüfstationen](/images/ratgeber/qcon-ai-boston-production-ai-moves-beyond-prompts-to-platforms-harnesses-and-evals-evals.webp)

Für einen Coding-Agenten könnte ein Testfall so aussehen: Er soll eine API-Änderung umsetzen, darf aber keine öffentliche Fehlermeldung mit internen Details ausliefern, muss alle Verbraucher des Vertrags aktualisieren und darf keinen Merge ohne Testnachweis vorbereiten. Der relevante Output ist nicht nur der Text der Antwort. Geprüft werden auch Dateien, Tool-Aufrufe, Seiteneffekte, Dauer, Kosten und die Reaktion auf absichtliche Fehler.

Der Stripe-Agent-Benchmark, auf den die QCon-Berichterstattung verweist, ist dafür ein gutes Warnsignal: Code kann plausibel aussehen und dennoch an Validierung, Browserzustand, Idempotenz oder Fehlersignalen scheitern. Ein HTTP-Fehler ist kein Erfolg, nur weil er strukturiert zurückkommt. Ein grüner Test ist ebenfalls kein Beweis, wenn der Test die falsche Vertragsannahme bestätigt.

## Spec statt nur Diff

Wenn Agenten mehr Code produzieren, wird ein großer Diff nicht automatisch zu einem besseren Review. Der Ansatz von Augment Code mit einer lebenden Spezifikation verschiebt einen Teil der Prüfung vor den Pull Request: Nicht nur „Welche Zeilen wurden geändert?“, sondern „Welche Anforderungen sollten nach der Änderung gelten?“

Das ist besonders bei Querschnittsänderungen hilfreich. Eine Spezifikation kann beispielsweise festhalten, dass Geldbeträge einen bestimmten Typ verwenden, jeder externe Input validiert wird und jede Zustandsänderung im Checkout einen Test besitzt. Ein Verifikationslauf kann dann die Erfüllung dieser Verträge prüfen, bevor ein Mensch 2.000 Zeilen Diff lesen muss.

Die Spezifikation selbst bleibt allerdings eine Fehlerquelle. Ist sie veraltet, kann ein Verifier die falsche Realität bestätigen. Deshalb gehören Specs in die Versionsverwaltung, brauchen einen Owner und müssen zusammen mit Code und Tests aktualisiert werden. Ein automatisches Gate ist nur so gut wie seine Prüfkriterien.

## Ein realistischer Rollout in vier Stufen

**1. Einen Workflow begrenzen.** Starte nicht mit „Der Agent soll das Engineering übernehmen“. Wähle eine Aufgabe mit klarer Eingabe und einem überprüfbaren Artefakt, etwa eine kleine Abhängigkeitserhöhung oder die Klassifikation eingehender Tickets.

**2. Read-only zuerst.** Erlaube Repository-Suche, Dokumentation und Testausführung, aber noch keine produktiven Schreibaktionen. Miss, welche Quellen der Agent verwendet, wo er abweicht und wie oft ein Mensch korrigieren muss.

**3. Evals gegen echte Fehlermodi bauen.** Ergänze bewusst veraltete Dokumentation, kaputte APIs, fehlende Berechtigungen, doppelte Zustandsübergänge und leere Ergebnisse. Ein Agent, der nur den Happy Path besteht, ist noch nicht produktionsreif.

**4. Mutationen hinter Gates legen.** Schreibaktionen brauchen eine sichtbare Begründung, einen Audit-Trail, Idempotenz und eine Rückfallstrategie. Für Authentifizierung, Zahlungen, Kundendaten und Produktionsdeployments bleibt die menschliche Freigabe Pflicht.

## Was Teams jetzt messen sollten

Die sinnvollsten Kennzahlen sind nicht „wie viele Tokens wurden gespart“ oder „wie spektakulär war die Demo“. Miss stattdessen Erfolgsquote pro Aufgabentyp, Wiederholungsrate, Zeit bis zur Korrektur, Zahl der manuellen Eingriffe, Kosten pro abgeschlossenem Lauf und die Häufigkeit von Seiteneffekten. Ergänze qualitative Reviews: War die Begründung nachvollziehbar? Konnte ein anderer Entwickler den Lauf reproduzieren? Wurde eine Grenze bewusst oder zufällig eingehalten?

Diese Messung macht auch sichtbar, wann ein kleinerer oder weniger autonomer Workflow besser ist. Ein Agent, der 80 Prozent einer Aufgabe schnell erledigt, aber die restlichen 20 Prozent regelmäßig in schwer auffindbare Fehler verwandelt, ist nicht automatisch produktiver als ein kontrollierter Assistent mit engerem Scope.

## Fazit

Die wichtigste Botschaft aus QCon AI Boston ist unspektakulär und deshalb wertvoll: Produktions-KI braucht mehr Software-Engineering, nicht weniger. Prompts bleiben wichtig, aber zuverlässige Agenten entstehen erst aus Kontextmanagement, Zustandsverwaltung, Harness-Grenzen, Evals und menschlicher Verantwortung.

Wer heute mit einem klar begrenzten Workflow beginnt, kann Geschwindigkeit gewinnen, ohne die Kontrolle abzugeben. Wer dagegen direkt breite Schreibrechte verteilt und Qualität nur an der Demo misst, baut wahrscheinlich keinen Arbeitsagenten, sondern eine schwer reproduzierbare Betriebsstörung.

## Quellen

- [QCon AI Boston 2026: News und Production-AI-Schwerpunkte](https://www.infoq.com/qcon-ai-boston-2026/news/)
- [QCon AI Boston: Production AI Moves beyond Prompts to Platforms, Harnesses, and Evals](https://www.infoq.com/news/2026/07/production-ai-platforms-evals/)
- [Stripe Benchmark: AI Agents Build Integrations but Struggle with Validation](https://www.infoq.com/news/2026/07/stripe-ai-agents-benchmark/)
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview)
- [LangGraph persistence and checkpoints](https://docs.langchain.com/oss/python/langgraph/persistence)
- [How AI Agent Verification Prevents Production Bugs Before Merge](https://www.augmentcode.com/guides/ai-agent-pre-merge-verification)
- [git-worktree documentation](https://git-scm.com/docs/git-worktree)
