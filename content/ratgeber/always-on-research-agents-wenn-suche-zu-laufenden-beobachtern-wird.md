---
slug: "always-on-research-agents-wenn-suche-zu-laufenden-beobachtern-wird"
title: "Der Research Agent meldet „neu“. Nur geändert hat sich nichts"
date: 2026-07-17
updated: 2026-07-28
category: "Einordnung"
eyebrow: "Research Operations"
excerpt: "Neue URLs sind noch keine neue Entwicklung. Ein verlässlicher Research Agent braucht einen gespeicherten Vorher-Zustand, eine belegte Differenz und einen klaren Empfänger."
readTime: 6
coverImage: /images/ratgeber/always-on-research-agents-cover-editorial-v1.webp
secondaryImage: /images/ratgeber/always-on-research-agents-evidence-workflow-v1.webp
tags:
  - "AI Agents"
  - "Recherche"
  - "Automation"
  - "Wissensarbeit"
sidebarTitle: "Kurzfazit"
sidebarPoints:
  - "Ein Research Agent ist nicht wertvoll, weil er ohne Pause sucht, sondern weil er Veränderungen mit Quellen, Priorität und einer klaren nächsten Entscheidung meldet."
  - "Für den Anfang braucht ein Team einen engen Themenraum, ein festes Ergebnisformat, ein Budget und einen menschlichen Owner."
  - "Die sichere Reihenfolge lautet: lesen, vergleichen, Entwurf erstellen, freigeben. Schreibende oder externe Aktionen bleiben eine eigene Stufe."
relatedTools:
  - title: "ChatGPT"
    href: "/tools/chatgpt/"
  - title: "Claude"
    href: "/tools/claude/"
  - title: "Gemini"
    href: "/tools/gemini/"
  - title: "Apify"
    href: "/tools/apify/"
decisionTools:
  - title: "Gemini"
    href: "/tools/gemini/"
    note: "geeignet für strukturierte Deep-Research-Aufgaben mit Quellenprüfung und einem klaren Briefing"
    score: "8.4"
    kind: "recommend"
  - title: "ChatGPT"
    href: "/tools/chatgpt/"
    note: "praktisch, wenn Recherche mit internen Dokumenten, Rückfragen und einem menschlich geprüften Ergebnis verbunden wird"
    score: "8.2"
    kind: "recommend"
  - title: "Apify"
    href: "/tools/apify/"
    note: "sinnvoll, wenn Teams Quellenzugriff und wiederholbare Datenerfassung technisch kontrollieren müssen"
    score: "7.9"
    kind: "caution"
decisionAvoid:
  - "einen Agenten ohne Quellenliste, Budget oder Abbruchregel dauerhaft das ganze Web durchsuchen lassen"
  - "Zusammenfassungen als Fakten verteilen, ohne strittige Aussagen an ihren Ursprung zurückzuverfolgen"
  - "einem Research Agenten direkt Schreibrechte für CRM, Tickets, Mails oder Produktion geben"
decisionNote: "Always-on ist kein Synonym für autonom. Der brauchbare Agent spart Wiederholarbeit, aber ein Mensch entscheidet weiterhin, welche Änderung wirklich Konsequenzen hat."
---
Montagmorgen liegen 17 neue Treffer im Postfach. Drei führen zur gleichen Pressemitteilung, fünf haben nur eine neue Überschrift, vier kopieren einander und der Rest erwähnt das gesuchte Produkt am Rand. Der Agent fasst alles gewissenhaft zusammen und meldet eine „wichtige Entwicklung“. Tatsächlich hat sich an Preis, API und Vertrag kein einziger belastbarer Satz geändert.

Das ist kein dokumentierter Einzelfall, sondern der typische Fehlalarm eines falsch gebauten Monitorings. Eine Suchmaschine kann neue URLs finden. Ein Research Agent kann ihnen folgen, weitere Fragen stellen und einen Bericht schreiben. Aber wie erkennt ein dauerhaft laufendes System, ob die Welt sich verändert hat – und nicht bloß die Verpackung derselben Information?

## Suche ist nur die erste Hälfte

[Gemini Deep Research](/tools/gemini/) zeigt, wie weit agentische Recherche inzwischen reicht. Über die API kann der Agent eine Untersuchung planen, Quellen durchsuchen und Ergebnisse zu einem Bericht verbinden. Google behandelt das ausdrücklich als lang laufenden Prozess: Die Aufgabe startet im Hintergrund, eine Anwendung fragt ihren Zustand ab oder empfängt Zwischenschritte als Stream. Ein einzelner Prompt löst also eine Schleife aus Planen, Suchen, Lesen und Schlussfolgern aus.

Chroma setzt mit Context-1 an einer anderen Engstelle an. Bei mehrstufiger Recherche wächst der Arbeitskontext schnell mit nützlichen, nebensächlichen und doppelten Fundstellen. Context-1 zerlegt Fragen, sucht iterativ und entfernt unterwegs Passagen, die für den weiteren Weg nicht mehr gebraucht werden. Chroma beschreibt ein 20-Milliarden-Parameter-Modell, trainiert auf mehr als 8.000 synthetischen Aufgaben, das in den eigenen Auswertungen bis zu zehnmal schneller inferiert als verglichene große Modelle.

Beide Ansätze verbessern die Suche. Sie beantworten aber noch nicht die Frage aus dem Montagspostfach. Ein Agent kann schneller und tiefer recherchieren und trotzdem jede umformulierte Produktseite für eine Neuigkeit halten.

## Ohne Gestern gibt es kein Neu

Der fehlende Baustein ist kein weiteres Modell, sondern ein gespeicherter Vorher-Zustand. Für jede beobachtete Behauptung braucht das System eine kleine Akte: Quelle, Abrufdatum, relevante Passage, Gültigkeitszeitraum sowie Hash oder Version des Dokuments. Dazu gehört ein Satz darüber, warum genau diese Behauptung für das Team wichtig ist.

Beim nächsten Lauf vergleicht der Agent neue Funde nicht mit seiner vagen Erinnerung, sondern mit dieser Akte. Eine veränderte Navigation ist noch keine Produktänderung. Zehn Artikel, die dieselbe Ankündigung abschreiben, sind nicht zehn Belege. Eine neue Preisgrenze, ein anderer API-Status oder eine geänderte Berechtigungsregel können dagegen ein Signal sein – wenn eine Primärquelle den alten und den neuen Stand nachvollziehbar trägt.

![Taktile Collage aus verbundenen Quellkarten, Kompass und versiegelten Evidenzkapseln als Bild für die Auswahl und Übergabe von Rechercheergebnissen](/images/ratgeber/always-on-research-agents-evidence-workflow-v1.webp)

Hier liegt der eigentliche Wendepunkt: Ohne rekonstruierbares Gestern darf der Agent das Wort „neu“ nicht verwenden. Er kann höchstens sagen, dass er etwas heute zum ersten Mal gefunden hat. Das ist eine Aussage über seine Suche, nicht über die Welt.

## Workflow außen, Agent innen

Anthropic unterscheidet zwischen Workflows mit vorgegebenem Codepfad und Agenten, die ihre Schritte und Werkzeuge dynamisch wählen. Für laufende Beobachtung braucht man beides. Der Workflow legt fest, wann gesucht wird, welche Quellen zulässig sind, welche Behauptungen beobachtet werden und wann der Lauf abbricht. Der Agent übernimmt nur den Teil, der sich nicht sauber in Regeln pressen lässt: zusätzliche Belege finden, Widersprüche erklären und die Bedeutung einer Differenz einordnen.

Die Ausgabe sollte deshalb kein weiterer Universalbericht sein. Sie braucht vier klar getrennte Teile: den alten Stand, den neuen Stand, die Belege für beide und eine markierte Unsicherheit. Erst danach folgt die Interpretation. Fehlt einer der beiden Zustände, bleibt die Änderung unbewiesen.

## Eine Änderung braucht einen Empfänger

Selbst eine korrekt erkannte Differenz ist noch kein Ergebnis. Sie muss bei einer benannten Entscheidung landen. Muss jemand eine Integration testen, einen Vertrag prüfen, eine Produktkarte aktualisieren oder eine Dokumentation ändern? Ohne Empfänger und Konsequenz erzeugt der Agent nur besser sortierten Lesestoff.

Damit ist auch die Ausgangsfrage beantwortet. Ein Always-on Research Agent wird nicht dadurch zum Beobachter, dass er ununterbrochen sucht. Deep Research gibt ihm Reichweite, selbsteditierender Kontext hält die Spur handhabbar und agentische Planung hilft bei unerwarteten Abzweigungen. Verlässlich wird das System erst durch drei unspektakuläre Dinge: ein gespeichertes Gestern, eine belegte Differenz und einen Menschen oder Prozess, der mit ihr etwas anfangen muss. Die Suchmaschine findet Neues für den Agenten. Der Differenzmotor erkennt Neues für das Team.

## Quellen

- [Gemini Deep Research Agent API](https://ai.google.dev/gemini-api/docs/deep-research)
- [Chroma: Context-1](https://www.trychroma.com/research/context-1)
- [Anthropic: Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
