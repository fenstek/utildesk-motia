---
slug: "mozaik-wenn-agenten-auf-ereignisse-reagieren"
title: "Mozaik: Wenn Agenten nicht nach Plan, sondern auf Ereignisse reagieren"
date: 2026-07-19
category: "Einordnung"
eyebrow: "Agent Engineering"
excerpt: "Mozaik ist eine TypeScript-Runtime fuer reaktive Agenten. Der Beitrag zeigt, wann Event-Busse und geteilte Kontexte helfen, welche Betriebsrisiken sie schaffen und wie ein kleiner Pilot kontrollierbar bleibt."
readTime: 9
coverImage: /images/ratgeber/mozaik-event-runtime-cover-editorial-v1.webp
secondaryImage: /images/ratgeber/mozaik-event-routing-editorial-v1.webp
tags:
  - "AI Agents"
  - "Developer Tools"
  - "Orchestrierung"
  - "TypeScript"
sidebarTitle: "Kurzfazit"
sidebarPoints:
  - "Mozaik ist keine Abkuerzung fuer verlaessliche Agenten. Es ist eine Runtime, in der Kommunikation, Kontext und Fehler als Ereignisse sichtbar modelliert werden koennen."
  - "Der Vorteil gegenueber einer starren Kette entsteht nur bei wirklich parallelen, voneinander abhaengigen Aufgaben. Fuer einen einzelnen Tool-Aufruf ist ein einfacher Workflow meist besser."
  - "Starten sollte ein Team mit einem kleinen, lesenden Pilot und klaren Messpunkten fuer Verzoegerung, Fehler, Kosten und menschliche Eingriffe."
relatedTools:
  - title: "Claude"
    href: "/tools/claude/"
  - title: "LangGraph"
    href: "/tools/langgraph/"
  - title: "GitHub Copilot"
    href: "/tools/github-copilot/"
  - title: "ChatGPT"
    href: "/tools/chatgpt/"
decisionTools:
  - title: "LangGraph"
    href: "/tools/langgraph/"
    note: "passt besser, wenn ein Team explizite Zustaende, Checkpoints und vorgezeichnete Ablaufe braucht"
    score: "8.5"
    kind: "recommend"
  - title: "Claude"
    href: "/tools/claude/"
    note: "praktisch fuer einen einzelnen Coding-Agenten mit klaren Repository-Regeln und menschlichem Review"
    score: "8.2"
    kind: "recommend"
  - title: "GitHub Copilot"
    href: "/tools/github-copilot/"
    note: "sinnvoll, wenn Teams zuerst Assistenz im bestehenden Pull-Request- und CI-Prozess brauchen"
    score: "7.9"
    kind: "caution"
decisionAvoid:
  - "einen Event-Bus einfuehren, bevor klar ist, welche Ereignisse wirklich einen anderen Agenten betreffen"
  - "Streaming-Ereignisse als dauerhaftes Wissen speichern, ohne Aufbewahrung, Verdichtung und Loeschregeln zu definieren"
  - "Fehlerbehandlung dem Agenten ueberlassen, ohne Retry-Limits, Zustandsuebergaben und menschliche Eskalation zu protokollieren"
decisionNote: "Reaktive Zusammenarbeit ist dann stark, wenn sie weniger Wartezeit schafft und trotzdem nachvollziehbar bleibt. Ein Event, das niemand erklaeren kann, ist kein Fortschritt, sondern nur schnelleres Chaos."
---

Ein Agent sucht im Repository, ein zweiter schreibt einen Patch, ein dritter soll den entstehenden Entwurf gegen Architekturregeln pruefen. In einer klassischen Pipeline wartet jede Rolle auf die vorige. Das ist oft genau richtig: Ein klarer Ablauf ist leicht zu testen, zu beobachten und bei Bedarf anzuhalten. Schwieriger wird es, wenn mehrere Aufgaben wirklich gleichzeitig laufen und ihr Kontext sich waehrenddessen aendert. Dann erzeugt eine starre Reihenfolge entweder Leerlauf oder ein Geflecht aus Sonderwegen.

[Mozaik](https://mozaik.jigjoy.ai/) versucht dieses Problem nicht mit einem weiteren Prompt-Wrapper zu loesen, sondern mit einer TypeScript-Runtime fuer reaktive Agenten. Teilnehmer sehen einen gemeinsamen Umgebungszustand und reagieren auf Nachrichten, Tool-Ergebnisse, Modell-Streaming und Fehlerereignisse. Das ist ein spannender Ansatz fuer Engineering-Teams, aber keine Lizenz, Agenten ohne Ablaufplan loszulassen. Der Gewinn entsteht erst, wenn Ereignisse, Zustaende und Verantwortlichkeiten genauso sorgfaeltig entworfen werden wie APIs.

Der NotebookLM-Entwurf zu diesem Beitrag hatte die richtige Kernidee: Bei paralleler Agentenarbeit verschiebt sich der Engpass vom Schreiben zum Verstehen und Absichern. In der Redaktion haben wir daraus keine Produktverheissung, sondern eine praktische Frage gemacht: **Wann ist ein reaktiver Bus hilfreicher als ein gut begrenzter Workflow?**

## Was Mozaik konkret anders modelliert

Mozaik beschreibt sich als Open-Source-Runtime fuer Agenten, die zur Laufzeit kommunizieren und koordinieren. Statt Uebergaben nur vorher fest zu verdrahten, koennen Teilnehmer auf Ereignisse horchen, andere Teilnehmer erkennen und relevanten Kontext weitergeben. Die offizielle Dokumentation unterscheidet dabei einfache Nachrichten, typisierte Kontextobjekte und `SemanticEvent`-Fragmente aus laufendem Model-Streaming.

Das Detail ist wichtiger, als es klingt. Ein Streaming-Fragment ist noch keine stabile Tatsache. Es kann fuer Live-Feedback oder Telemetrie nuetzlich sein, gehoert aber nicht automatisch in den dauerhaften Modellkontext. Erst abgeschlossene Nachrichten, Tool-Ausgaben oder bewusst verdichtete Entscheidungen sollten als Kontext gespeichert werden. Genau diese Trennung verhindert, dass aus jedem Token ein unaufraeumbares Gedachtnis wird.

Im Vergleich dazu ist [LangGraph](/tools/langgraph/) passend, wenn ein Team Zustandsknoten, Checkpoints und kontrollierte Wiederaufnahme explizit modellieren will. Ein Terminal-Agent wie [Claude](/tools/claude/) kann bereits eine klar begrenzte Coding-Aufgabe erledigen, ohne dass gleich ein Multi-Agent-Runtime gebraucht wird. Mozaik wird interessant, wenn mehrere Teilnehmer auf denselben Arbeitszustand reagieren muessen und die Reihenfolge nicht von Anfang an feststeht.

## Ein sinnvoller erster Einsatz: Review-Signale statt Agentenschwarm

Ein guter Pilot ist keine vollautomatische Softwarefabrik. Er kann klein anfangen: Ein Recherche- oder Coding-Agent meldet, dass sich eine Schnittstelle, ein Schema oder ein Abhaengigkeitsgraph geaendert hat. Ein zweiter Teilnehmer prueft nur diese Aenderung gegen eine gepflegte Regel. Ein dritter fasst die offenen Punkte fuer einen Menschen zusammen. Niemand merged Code, niemand schreibt Tickets, niemand startet externe Aktionen.

Das Ergebnis ist kein "Team aus KI-Kollegen", sondern ein nachvollziehbares Signal:

1. Ein Ereignis nennt Quelle, Zeit, betroffenen Bereich und Ausloeser.
2. Eine Pruefung ergaenzt Beleg, Unsicherheit und betroffene Annahme.
3. Ein menschlicher Owner entscheidet, ob daraus ein Branch, ein Test, eine Rueckfrage oder keine Aktion wird.

Dieser Zuschnitt passt zu der allgemeinen Lehre aus agentischer Entwicklung: Ein Patch kann kompilieren und trotzdem einen Vertrag zwischen Komponenten verletzen. Augment beschreibt seinen Intent-Verifier deshalb als pruefenden Schritt gegen eine lebende Spezifikation vor dem Pull Request. Das ist kein Nachweis, dass jede Runtime automatisch sicher wird. Es zeigt aber die richtige Richtung: Pruefbare Erwartungen gehoeren vor die schnelle Ausfuehrung, nicht erst an ihr Ende.

## Der technische Kern: Kontext braucht Besitz und Haltbarkeit

Reaktive Systeme werden unbeherrschbar, wenn unklar ist, wer einen Kontext besitzt. Mozaik bietet einen `ModelContext` als geordnete Sammlung von Nachrichten, Tool-Ergebnissen und Modell-Ausgaben. Dieser Kontext kann gespeichert und bei einer neuen Sitzung geladen werden. Fuer einen Prototyp ist ein In-Memory-Repository ausreichend; fuer einen echten Dienst braucht ein Team aber bewusstes Persistieren, Zugriffskontrolle und Aufbewahrungsregeln.

Vier Fragen sollten vor dem ersten dauerhaften Speichern beantwortet sein:

- Welche Ereignisse sind nur fluechtige Telemetrie, welche sind Entscheidungsbelege?
- Welcher Agent darf einen Kontext lesen, erweitern oder zusammenfassen?
- Wie lange bleiben Tool-Ausgaben, Fehlermeldungen und Nutzerinhalte erhalten?
- Wie wird sichtbar, dass ein Kontext veraltet, gekuerzt oder durch eine neue Quelle ersetzt wurde?

Das ist nicht Buerokratie. Ohne diese Antworten kann ein spaeterer Lauf nicht mehr erklaeren, warum ein Agent eine bestimmte Annahme getroffen hat. Persistenz ist nur dann ein Vorteil, wenn Herkunft und Ablaufdatum mitgespeichert werden.

![Handgemachter Papiercollage-Strom aus Ereigniswegen, kleinen Zeitmarken und getrennten Empfangsbecken als Bild fuer Routing, Nachvollziehbarkeit und kontrollierte Uebergaben](/images/ratgeber/mozaik-event-routing-editorial-v1.webp)

## Beobachtbarkeit: Nicht jedes Ereignis ist eine Metrik

Ein Event-Bus macht Aktivitaet leicht sichtbar, aber noch nicht verstaendlich. Teams brauchen eine kleine gemeinsame Sprache fuer Runs: Korrelation oder Run-ID, Teilnehmer, Ausloeser, Tool-Aufruf, Ergebnis, Fehlerklasse und endgueltige menschliche Entscheidung. Dazu kommen harte Grenzen fuer Wiederholungen und Zeit.

Die wichtigste Kennzahl ist am Anfang nicht die Zahl parallel laufender Agenten. Sinnvoller sind vier Fragen: Wie viele Ereignisse brauchten wirklich einen Empfaenger? Wie viele wurden verworfen oder zusammengefasst? Wie viele Retries fuehrten zu einem brauchbaren Ergebnis? Und wie oft musste ein Mensch eingreifen? Wenn diese Werte steigen, ist nicht das Modell zu klein, sondern die Ereignisgrenze zu unscharf.

Fuer Auswertungen kann eine Sprache wie [Flint](https://microsoft.github.io/flint-chart/) hilfreich sein: Sie nimmt semantische Datentypen und kompiliert daraus Chart-Spezifikationen fuer unterschiedliche Backends. Auch dort bleibt die Verantwortung beim Team: Eine schoene Grafik ersetzt keine sauberen Ereignisdaten. Erst wenn Zeitstempel, Fehlerarten und Zustandswechsel konsistent sind, wird ein Chart zur Diagnose statt zur Dekoration.

## Wo Mozaik nicht die erste Wahl ist

Mozaik ist jung und bewusst auf eine neue Art von Zusammenarbeit ausgerichtet. Das ist ein Grund fuer einen kontrollierten Test, nicht fuer eine unkritische Plattformentscheidung. Wer einen einzelnen Dokumenten-Workflow, eine feste Freigabekette oder einen deterministischen Batch baut, profitiert meist mehr von einem einfachen Job-Runner, einer Queue und klaren Schritten. Wer zuerst AI-Unterstuetzung im bestehenden Entwicklungsprozess will, kann mit [GitHub Copilot](/tools/github-copilot/) oder einem klar begrenzten Coding-Agenten beginnen.

Auch eine "selbstheilende" Fehlerbehandlung braucht Grenzen. Ein Retry kann einen temporaeren Fehler abfangen; er darf aber keinen fehlerhaften Auftrag endlos verstaerken. Jeder automatische Wiederanlauf braucht eine Obergrenze, eine Fehlerklassifikation und eine Eskalation zu einem Menschen. Die Runtime kann diese Disziplin ermoeglichen, sie kann sie nicht fuer das Team erfinden.

## Ein vierwoechiger Pilot mit echten Abbruchkriterien

**Woche 1: Einen Engpass messen.** Waehle eine wiederkehrende Aufgabe, bei der zwei Rollen tatsaechlich aufeinander reagieren muessen, etwa Architekturpruefung nach einer Tool-Ausgabe. Definiere Erfolg als weniger Wartezeit oder bessere Nachvollziehbarkeit, nicht als mehr Agenten.

**Woche 2: Ereignisvertrag schreiben.** Dokumentiere fuer jedes relevante Ereignis Ausloeser, Payload, Empfaenger, Besitzer, Aufbewahrungszeit und Abbruchregel. Alles andere bleibt ausserhalb des Busses.

**Woche 3: Nur lesend integrieren.** Der Pilot darf analysieren, vergleichen und einen Review-Entwurf erzeugen. Schreibrechte fuer Repository, Ticket-System oder Produktion bleiben ausgeschaltet.

**Woche 4: Gegen den einfachen Workflow vergleichen.** Vergleiche Zeit bis zum brauchbaren Review, Fehlerquote, Kosten, Anzahl menschlicher Eingriffe und erklaerbare Runs. Wenn Mozaik keinen klaren Vorteil zeigt, ist das ein gueltiges Ergebnis, kein gescheiterter Pilot.

## Fazit: Reaktiv ist kein Gegenteil von kontrolliert

Mozaik liefert interessante Bausteine fuer Systeme, in denen Agenten nicht nur nacheinander arbeiten, sondern auf laufende Signale und geteilten Kontext reagieren. Seine Staerke liegt in der expliziten Modellierung von Nachrichten, Kontextobjekten und Streaming-Ereignissen. Seine Grenze liegt dort, wo Teams diese Offenheit mit Autonomie verwechseln.

Der gute Start bleibt klein: ein Ereignisvertrag, ein begrenzter Kontext, ein lesender Pilot und ein Mensch, der die Konsequenz freigibt. Wenn ein Team nach vier Wochen erklaeren kann, welches Ereignis welchen Zustand veraendert hat und warum, dann wird aus schneller Agentenarbeit auch belastbare Engineering-Arbeit.

## Quellen

- [Mozaik: TypeScript runtime for self-organizing AI agents](https://mozaik.jigjoy.ai/)
- [Mozaik documentation: Core concepts](https://mozaik.jigjoy.ai/docs/concepts)
- [Augment Code: Pre-merge verification for AI agents](https://www.augmentcode.com/guides/ai-agent-pre-merge-verification)
- [Microsoft Research: Flint chart language](https://microsoft.github.io/flint-chart/)
- [OpenTelemetry documentation](https://opentelemetry.io/docs/)
