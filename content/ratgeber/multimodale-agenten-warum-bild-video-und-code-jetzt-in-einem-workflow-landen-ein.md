---
slug: "multimodale-agenten-warum-bild-video-und-code-jetzt-in-einem-workflow-landen-ein"
title: "Multimodale Agenten: Wenn ein Screenshot mehr sagt als ein Prompt"
date: 2026-05-11
updated: 2026-07-28
category: "Einordnung"
eyebrow: "KI-Einordnung"
excerpt: "Multimodale Agenten können Text, Screenshots, Dokumente und Code zusammen lesen. Nützlich werden sie nicht durch das Sehen allein, sondern durch einen überprüfbaren Arbeitsablauf."
readTime: 7
coverImage: /images/ratgeber/multimodale-agenten-warum-bild-video-und-code-jetzt-in-einem-workflow-landen-ein-cover.webp
secondaryImage: /images/ratgeber/multimodale-agenten-warum-bild-video-und-code-jetzt-in-einem-workflow-landen-ein-workflow.webp
tags:
  - "Multimodal"
  - "KI-Agenten"
  - "Workflows"
  - "Einordnung"
sidebarTitle: "Kurzfazit"
sidebarPoints:
  - "Ein Bild macht einen Agenten nicht zuverlässig: Er braucht einen klaren Auftrag und eine prüfbare Ausgabe."
  - "Multimodalität lohnt sich dort, wo Text allein den Arbeitsgegenstand nicht beschreibt."
  - "Die Freigabe für Änderungen gehört bei Menschen, nicht bei einem Screenshot-Interpreter."
relatedTools:
  - title: "Claude"
    href: "/tools/claude/"
  - title: "Cursor"
    href: "/tools/cursor/"
  - title: "GitHub Copilot"
    href: "/tools/github-copilot/"
  - title: "Playwright"
    href: "/tools/playwright/"
  - title: "LangChain"
    href: "/tools/langchain/"
  - title: "CrewAI"
    href: "/tools/crew-ai/"
---

Eine Produktseite ist auf dem Laptop geöffnet. Im Ticket steht nur: „Der Preis wirkt auf Mobilgeräten abgeschnitten.“ Ein reines Sprachmodell kann den Satz umformulieren. Ein multimodaler Agent kann Screenshot, DOM-Struktur, CSS-Datei und Testbericht nebeneinander halten. Das ist der interessante Teil der Entwicklung: nicht, dass ein Modell Bilder sehen kann, sondern dass es zwischen verschiedenen Belegen einen Arbeitsweg baut.

Genau hier wird der Begriff oft zu groß. „Multimodal“ heißt zunächst nur, dass ein System mehr als Text verarbeitet: Bilder, Audio, Video, PDFs oder Oberflächen. Daraus folgt noch nicht, dass es eine Aufgabe sicher plant, Änderungen richtig ausführt oder das Ergebnis versteht. Für Teams ist deshalb nicht die Modell-Demo entscheidend, sondern die Frage: **Wo ergänzt das zusätzliche Signal eine Entscheidung, die mit Text allein zu unsicher wäre?**

## Der Unterschied zwischen Sehen und Arbeiten

Ein Screenshot kann einen Fehler zeigen, aber selten seine Ursache. Ein Agent, der einen Screenshot liest, kann etwa erkennen, dass ein Button am rechten Rand fehlt. Um daraus eine brauchbare Arbeitseinheit zu machen, braucht er weitere Schritte: die betroffene URL, den Zustand des Browsers, relevante Dateien, einen reproduzierbaren Test und ein Zielbild.

Das gilt genauso für Dokumente. Eine Rechnung als PDF enthält Tabellen, Stempel, handschriftliche Notizen und manchmal eine mehrdeutige Position. Ein Modell kann die Seite einordnen; die Buchung wird erst verlässlich, wenn Felder extrahiert, gegen Regeln geprüft und bei Unsicherheit zur Freigabe vorgelegt werden. Multimodalität ist damit kein Ersatz für Struktur. Sie liefert Kontext, den die Struktur anschliessend verarbeiten muss.

Ein guter Arbeitsablauf trennt deshalb vier Dinge:

1. **Wahrnehmung:** Was ist im Bild, Dokument oder Browser tatsächlich sichtbar?
2. **Behauptung:** Welche Erklärung leitet der Agent daraus ab?
3. **Aktion:** Was darf er als Nächstes lesen, testen oder vorbereiten?
4. **Nachweis:** Woran erkennt ein Mensch oder ein Test, dass das Ergebnis stimmt?

Wenn diese Ebenen in einem langen Chat verschwimmen, wirkt der Agent beeindruckend und bleibt doch schwer kontrollierbar.

## Ein sinnvoller erster Einsatz: visuelle Regression mit Code-Kontext

Für Produktteams ist UI-Qualität ein gutes Pilotfeld. Der Agent erhält eine feste Teststrecke, Referenz-Screenshots und Zugriff auf ein begrenztes Repository. Er darf Unterschiede beschreiben, die betroffene Komponente suchen und einen Patch **vorschlagen**. Der Build, der Screenshot-Vergleich und die Freigabe bleiben getrennte Stationen.

Hier ergänzen sich Werkzeuge mit unterschiedlichen Aufgaben. [Playwright](/tools/playwright/) kann Zustände reproduzierbar im Browser erzeugen. [Cursor](/tools/cursor/) oder [GitHub Copilot](/tools/github-copilot/) helfen beim Lesen und Entwerfen einer Code-Änderung. [Claude](/tools/claude/) eignet sich, um Belege, Anforderungen und offene Fragen in einer längeren Untersuchung zusammenzuführen. Keines dieser Werkzeuge macht aus einem unscharfen Ticket automatisch eine sichere Änderung. Zusammen können sie aber die Zeit zwischen Fund und überprüfbarem Vorschlag verkürzen.

Wichtig ist die Reihenfolge: Der visuelle Befund darf eine Untersuchung auslösen, nicht die Produktion verändern. Ein Agent, der „Button fehlt“ sieht, sollte zuerst die viewport-Grösse, den Zustand und den Vergleichsstand dokumentieren. Erst danach ist ein Patch sinnvoll.

![Multimodaler Workflow für Bild, Dokument und Code](/images/ratgeber/multimodale-agenten-warum-bild-video-und-code-jetzt-in-einem-workflow-landen-ein-workflow.webp)

## Wo Video und Audio wirklich helfen

Bei Video ist die Versuchung besonders gross, alles zu automatisieren. Für Support, Forschung oder Compliance kann ein Agent lange Aufzeichnungen in Abschnitte teilen, Sprecherwechsel markieren und zu einer konkreten Stelle springen. Das spart Suchzeit. Eine Zusammenfassung darf aber nicht stillschweigend als Protokoll gelten, wenn später Entscheidungen, Zusagen oder Risiken davon abhängen.

Die robuste Variante arbeitet mit Verweisen: Zeitstempel, Originalausschnitt, Transkript und eine Kennzeichnung, ob es sich um eine Beobachtung oder eine Interpretation handelt. Bei Audio gilt das Gleiche. Namen, Zahlen und Negationen sind genau die Details, bei denen eine flüssige Zusammenfassung am teuersten irren kann.

## Drei Grenzen, die man vor dem Pilot setzen sollte

**Erstens: Nicht jeder Bildschirm ist ein Arbeitsauftrag.** Persönliche Daten, Kundendaten oder Zugangsdaten können in Screenshots stecken. Der kleinste notwendige Bildausschnitt, eine definierte Aufbewahrung und ein Verbot für geheime Bereiche gehören vor die Modellwahl.

**Zweitens: Ein Modell kann UI-Zustände verwechseln.** Ladeindikatoren, A/B-Tests, Lokalisierung und responsive Ansichten erzeugen Unterschiede, die kein Fehler sind. Deshalb braucht der Pilot eine feste Umgebung und einen Rückkanal: „unsicher“ ist ein zulässiges Ergebnis.

**Drittens: Werkzeugzugriff ist mächtiger als Bilderkennung.** Sobald ein Agent klicken, Dateien ändern oder Daten exportieren darf, sind Rollen, Freigaben und ein nachvollziehbares Log wichtiger als die Qualität seiner Bildbeschreibung. Für Orchestrierung können Frameworks wie [LangChain](/tools/langchain/) oder [CrewAI](/tools/crew-ai/) helfen; sie ersetzen aber weder Berechtigungen noch Tests.

## So testet ein Team ohne Theater

Nimm einen wiederkehrenden Vorgang mit sichtbarem Ergebnis: zehn mobile UI-Prüfungen, zwanzig eingehende PDFs oder eine klar begrenzte Videoanalyse. Messe nicht nur Geschwindigkeit. Zähle falsche Befunde, ungeklärte Fälle, nötige Nacharbeit und Fälle, in denen der Agent zu selbstsicher war.

Der Erfolg eines multimodalen Piloten ist nicht, dass der Agent viel „sehen“ konnte. Er liegt darin, dass ein Mensch schneller zu einer belegbaren Entscheidung kommt und jederzeit nachvollziehen kann, warum der nächste Schritt vorgeschlagen wurde.

## Fazit

Multimodale Agenten werden wertvoll, wenn sie den tatsächlichen Arbeitsgegenstand mitlesen dürfen: Oberfläche, Dokument, Aufnahme und Code. Sie sind aber kein magisches Auge über dem Workflow. Gib ihnen einen eng begrenzten Bereich, verlange Belege statt Behauptungen und halte jede Änderung hinter einer überprüfbaren Freigabe. Dann wird aus einer eindrucksvollen Demo ein Werkzeug, das im Alltag nicht mehr Verwirrung als Arbeit erzeugt.

## Quellen

- [Anthropic: Vision](https://docs.anthropic.com/en/docs/build-with-claude/vision)
- [OpenAI: Images and vision](https://platform.openai.com/docs/guides/images-vision)
- [Playwright: Visual comparisons](https://playwright.dev/docs/test-snapshots)
