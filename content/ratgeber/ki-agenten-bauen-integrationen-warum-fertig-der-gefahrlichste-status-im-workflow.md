---
slug: "ki-agenten-bauen-integrationen-warum-fertig-der-gefahrlichste-status-im-workflow"
title: "KI-Agenten bauen Integrationen: Warum „fertig“ der gefährlichste Status im Workflow ist"
date: 2026-07-29
updated: 2026-07-29
category: "Workflow"
eyebrow: "KI-Workflow"
excerpt: "Ein Coding-Agent aktualisiert ein Stripe-SDK, schickt zum Test eine nicht vorhandene Kundennummer an die API und erhält HTTP 400."
readTime: 8
coverImage: /images/ratgeber/ki-agenten-bauen-integrationen-warum-fertig-der-gefahrlichste-status-im-workflow-cover.webp
secondaryImage: /images/ratgeber/ki-agenten-bauen-integrationen-warum-fertig-der-gefahrlichste-status-im-workflow-workflow.webp
tags:
  - "KI-Agenten"
  - "Testing"
  - "Integrationen"
  - "Evals"
sidebarTitle: "Kurzfazit"
sidebarPoints:
  - "Ein Coding-Agent aktualisiert ein Stripe-SDK, schickt zum Test eine nicht vorhandene Kundennummer an die API und erhält HTTP 400."
  - "Stripe baute für seinen Versuch elf Umgebungen mit Code, Datenbanken, Browsern und Testzugängen."
relatedTools:
  - title: "OpenAI Codex"
    href: "/tools/openai-codex/"
  - title: "Claude"
    href: "/tools/claude/"
  - title: "GitHub Copilot"
    href: "/tools/github-copilot/"
  - title: "Cursor"
    href: "/tools/cursor/"
  - title: "Aider"
    href: "/tools/aider/"
  - title: "LangChain"
    href: "/tools/langchain/"
---
Ein Coding-Agent aktualisiert ein Stripe-SDK, schickt zum Test eine nicht vorhandene Kundennummer an die API und erhält HTTP 400. Seine Schlussfolgerung: gut, der Endpunkt funktioniert und liefert für ungültige Daten den richtigen Fehler. Dann geht er zur nächsten Aufgabe über. Der Satz klingt vernünftig. Genau deshalb ist er gefährlich.

Der Vorfall stammt aus einem [Stripe-Benchmark für vollständige Integrationen](https://stripe.com/blog/can-ai-agents-build-real-stripe-integrations), nicht aus einer erfundenen Schreckensgeschichte. Er trifft Plattformteams an einer empfindlichen Stelle: Der Agent kann Code schreiben, Logs lesen und Fehler erklären – und trotzdem das falsche Signal zur Abnahme machen. Wie muss ein Workflow aussehen, in dem „fertig“ nicht die Behauptung des Agenten ist, sondern ein nachprüfbarer Zustand des Systems?

## Ein Fehler, der wie Erfolg klingt

Stripe baute für seinen Versuch elf Umgebungen mit Code, Datenbanken, Browsern und Testzugängen. Die Grader prüften nicht nur, ob Dateien vorhanden waren oder Tests grün leuchteten. Sie riefen APIs auf, steuerten Benutzeroberflächen und kontrollierten teilweise die tatsächlich erzeugten Stripe-Objekte. Bei einer Checkout-Aufgabe konnte der sichtbare Kauf also korrekt aussehen und trotzdem durchfallen, wenn im Testkonto keine passende Checkout Session existierte.

Die Modelle waren dabei keineswegs hilflos. Stripe meldet für [Claude](/tools/claude/) Opus 4.5 durchschnittlich 92 Prozent über vier Full-Stack-Aufgaben und für GPT-5.2 73 Prozent über zwei spezialisierte Gym-Aufgaben. Das sind Ergebnisse eines Anbieter-Benchmarks mit unterschiedlichen Aufgabenmengen, keine allgemeine Modellrangliste. Interessant ist der Widerspruch: Ein Agent kann komplexe UI- und API-Arbeit bewältigen und im nächsten Lauf einen simplen HTTP-Fehler als Erfolgsbeweis missverstehen.

Dasselbe Muster zeigte sich im Browser. Ein Tool-Aufruf markierte versehentlich den HTML-Frame des Checkout-Formulars und nahm den Eingabefeldern den Fokus. Ein Refresh oder ein Klick außerhalb des Frames hätte gereicht. Der Agent erkannte die Erholung nicht, erklärte die Situation für unlösbar und beendete den Lauf. Das Problem war nicht fehlender Code, sondern ein verlorener Zustand plus eine zu schwache Definition von Erfolg.

Damit verschiebt sich die zentrale Frage. Sie lautet nicht mehr: *Kann das Modell eine Integration bauen?* Sie lautet: *Welche unabhängigen Beweise muss es liefern, bevor jemand diese Integration freigibt?*

## Das Problem sitzt nicht nur im Modell

Zwischen Prompt und Repository arbeitet ein Harness. Er reicht dem Modell Kontext, führt Werkzeugaufrufe aus, speichert Zwischenergebnisse und entscheidet, was nach einem Fehler wiederaufgenommen werden kann. Selbst gehostete Systeme wie [Talon](/tools/talon/) machen diese Schicht sichtbar: Modell, Werkzeuge, Hintergrundaufgaben und persistenter Zustand sind getrennte Bausteine. Ein stärkeres Modell repariert keinen Harness, der den falschen Browserzustand zurückgibt oder nach einem Neustart vergessen hat, welcher Schritt bereits bestätigt wurde.

Auch die Platzierung dieser Schicht ist eine Sicherheitsentscheidung. [Mendral beschreibt](https://www.mendral.com/blog/agent-harness-belongs-outside-sandbox) einen Ansatz, bei dem der Harness im Backend läuft und nur die Ausführung in eine austauschbare Sandbox delegiert wird. Zugangsdaten müssen dann nicht in der Sandbox liegen. Dafür übernimmt die Plattform neue Pflichten: Sie muss lange Läufe fortsetzen, Zustände konsistent speichern und parallele Änderungen auseinanderhalten. Mendral nennt selbst offene Konsistenzfragen; der Entwurf ist ein Trade-off, keine universelle Blaupause.

Frameworks wie [LangGraph](/tools/langgraph/) behandeln diese Pflichten explizit. Ein Workflow kann deterministische und agentische Schritte kombinieren, an Knotengrenzen Checkpoints speichern und vor einer riskanten Aktion einen Menschen einbeziehen. Das klingt zunächst nach Infrastrukturdetail. In Wirklichkeit entscheidet es darüber, ob ein fehlgeschlagener Test sauber wiederholt wird oder ob der Agent mit einem halb verstandenen Zustand weiterargumentiert.

Für parallele Coding-Aufträge genügt oft schon eine einfachere Grenze: [`git worktree`](https://git-scm.com/docs/git-worktree.html) gibt jedem Lauf einen eigenen Arbeitsbaum mit getrenntem HEAD und Index. Der Agent darf dort ändern, testen und verwerfen, ohne das aktive Verzeichnis eines Entwicklers oder den Lauf eines zweiten Agenten zu vermischen. Isolation macht das Ergebnis noch nicht richtig. Sie sorgt aber dafür, dass ein Fehler einen klaren Besitzer und einen reproduzierbaren Ausgangspunkt hat.

## Zwei Prüfspuren statt eines Supertesters

Der naheliegende Reflex wäre, den Agenten auch noch alle Tests schreiben und ausführen zu lassen. Slacks Engineering-Team liefert dazu eine nützlichere Antwort. Für [mehr als 200 agentische E2E-Läufe](https://slack.engineering/agentic-testing-where-agents-fit-in-the-e2e-testing-stack/) verglich es [Playwright](/tools/playwright/) über MCP, Playwright über die Kommandozeile und vom Agenten erzeugte Playwright-Tests – ausschließlich in Test-Workspaces mit Nicht-Produktionsdaten.

Der entscheidende Unterschied lag nicht in „KI gegen keine KI“, sondern im Prüfauftrag. Ein deterministischer Test erzwingt eine bekannte Reise: klicken, schreiben, prüfen. Ein agentischer Test erhält ein Ziel, beobachtet die Oberfläche und darf einen anderen Weg wählen. Nur ungefähr 20 Prozent der Slack-Läufe nutzten exakt dieselbe Aktionsfolge. Viele abweichende Wege erreichten trotzdem den richtigen Endzustand.

Das ist der Wendepunkt für Integrations-Workflows. Bekannte Invarianten brauchen keine Kreativität. Ein Webhook muss genau einmal verarbeitet werden. Ein Checkout muss das richtige Testobjekt erzeugen. Eine Rolle darf keinen verbotenen Scope erhalten. Solche Bedingungen gehören in schnelle, deterministische Gates, die bei jedem relevanten Commit gleich urteilen.

Agentische Tests gehören eine Spur darüber. Sie sind gut darin, alternative UI-Wege zu erkunden, einen flüchtigen Fehler zu reproduzieren oder herauszufinden, warum ein Ziel trotz grüner Einzeltests nicht erreichbar ist. Bei Slack waren sie jedoch langsamer und teurer; die gemeldeten Läufe kosteten typischerweise 15 bis 30 US-Dollar. Das spricht nicht gegen die Methode. Es spricht dafür, sie gezielt nach riskanten Änderungen, für nächtliche Exploration oder zur Untersuchung eines konkreten Fehlers einzusetzen – nicht als Ersatz für jeden CI-Test.

![Schema eines orchestrierten KI-Workflows](/images/ratgeber/ki-agenten-bauen-integrationen-warum-fertig-der-gefahrlichste-status-im-workflow-workflow.webp)

## Vor dem Merge braucht es einen Abnahmevertrag

Ein Agent kann nur beweisen, was das Team vorher als Beweis benannt hat. Dafür braucht es keine hundertseitige Spezifikation, sondern einen kurzen, versionierten Abnahmevertrag. Er beschreibt nicht, *wie* der Agent programmieren soll, sondern *welcher beobachtbare Zustand* nachher gelten muss.

Für eine Zahlungsintegration könnte dieser Vertrag vier Ebenen enthalten:

| Ebene | Frage | Beispiel für einen Beweis |
|---|---|---|
| API | Reagiert der Dienst auf gültige und ungültige Eingaben korrekt? | reproduzierbare Requests mit erwarteten Statuscodes und Bodies |
| Zustand | Wurde das richtige Geschäftsobjekt erzeugt oder verändert? | ID und Eigenschaften einer Test-Checkout-Session |
| Oberfläche | Kann ein Nutzer das Ziel unter realistischen Bedingungen erreichen? | aufgezeichneter Lauf plus verifizierter Endzustand |
| Grenze | Bleiben Berechtigungen, Wiederholungen und Fehlerpfade innerhalb der Vorgaben? | Scope-Prüfung, Idempotenztest und negativer Testfall |

Dieser Vertrag darf selbst nicht zur stillen Fehlerquelle werden. Ändert sich die API oder der gewünschte Geschäftsprozess, muss die zuständige Person auch die Abnahmekriterien prüfen. Eine veraltete Spezifikation macht die Automation nicht sicherer; sie lässt nur den falschen Zustand besonders konsequent passieren.

## Ein Freigabekorridor, den ein Team wirklich betreiben kann

Aus den Benchmarks und Architekturmustern ergibt sich ein schlanker Ablauf mit klaren Verantwortlichkeiten:

1. **Der Produkt- oder Integrationsverantwortliche benennt das Ergebnis.** Vor dem Lauf schreibt er drei bis fünf beobachtbare Abnahmekriterien auf: gültiger API-Fall, negativer Fall, persistierter Zustand und sichtbares Nutzerergebnis. Ein Kriterium ohne prüfbares Artefakt kommt nicht in den Auftrag.
2. **Der Agent arbeitet isoliert und ohne Produktionsgeheimnisse.** Er erhält einen eigenen Worktree oder eine disposable Sandbox, Testzugänge und nur die Scopes, die der Auftrag benötigt. Prüfsignal: Der Lauf lässt sich löschen, ohne den Hauptarbeitsbaum oder Produktionsdaten zu verändern.
3. **Die CI erzwingt bekannte Invarianten.** Vertragstests, Datenbankprüfungen, Berechtigungsregeln und sicherheitskritische Negativfälle laufen deterministisch. Ein Agentenkommentar darf ein rotes Gate nicht überstimmen.
4. **Ein agentischer Lauf sucht nach dem Unerwarteten.** Nach einer UI-, Authentifizierungs- oder Workflow-Änderung erhält der Tester ein Ziel statt eines Klickskripts. Er läuft mit Zeit-, Kosten- und Aktionslimit in Nicht-Produktion. Als Ergebnis zählt der verifizierte Endzustand, nicht die letzte Textantwort des Agenten.
5. **Ein benannter Mensch gibt irreversible Wirkung frei.** Zahlungen, externe Nachrichten, Rechteänderungen oder Migrationen bleiben bis zur Sichtung der Beweise gesperrt. Die Freigabe umfasst Abnahmekriterien, Testartefakte und den Diff – nicht nur eine Zusammenfassung.

Dieser Korridor macht Agenten nicht langsamer als nötig. Er trennt lediglich drei Arbeiten, die in vielen Demos fälschlich zusammenfallen: etwas erzeugen, seine Wirkung prüfen und die Wirkung verantworten.

## Die neue Definition von „done“

Der Stripe-Agent mit seinem HTTP-400-Erfolg war nicht dumm. Er erfüllte nur einen Auftrag, in dem eine plausible Erklärung leichter erreichbar war als ein belastbarer Beweis. Ein noch größeres Modell kann solche Irrtümer seltener machen; abschaffen kann es die Verwechslung von Aussage und Zustand nicht.

Eine Integration ist deshalb erst fertig, wenn ein unabhängiger Prüfpfad das vereinbarte Ergebnis reproduziert, bekannte Invarianten deterministisch halten, explorative Tests keinen unbehandelten Bruch finden und eine benannte Person die irreversible Wirkung freigibt. Der Agent darf „fertig“ sagen. Entscheidend ist, ob das System ihm zustimmt.

## Quellen

1. [Can AI agents build real Stripe integrations?](https://stripe.com/blog/can-ai-agents-build-real-stripe-integrations)
2. [Agentic testing: Where agents fit in the E2E testing stack](https://slack.engineering/agentic-testing-where-agents-fit-in-the-e2e-testing-stack/)
3. [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview)
4. [The agent harness belongs outside the sandbox](https://www.mendral.com/blog/agent-harness-belongs-outside-sandbox)
5. [git-worktree documentation](https://git-scm.com/docs/git-worktree.html)
