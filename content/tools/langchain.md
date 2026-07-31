---
slug: langchain
title: LangChain
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Redaktion"
editorial_reviewed_at: 2026-07-31
editorial_status: "manual_polished"
editorial_batch: "2026-07-31-story-card-refresh-20"
category: "AI Chatbots"
price_model: "Freemium"
tags: ["chatbot", "automation"]
official_url: "https://langchain.com/"
affiliate_url: "https://langchain.com/"
tier: "A"
lastReviewed: "2026-07-31"
mentionedIn: ["agent-security-und-mcp-governance-welche-guardrails-unternehmen-jetzt-brauchen", "ai-launch-und-distribution-die-neue-tool-schicht-fur-den-erfolg-nach-dem-build", "ai-search-und-agenten-crawler-websites-2026-sichtbar-kontrollierbar", "browser-agenten-im-praxistest-wo-automation-hilft-und-wo-sie-gefahrlich-wird", "e2a-open-source-email-gateway-for-ai-agents-so-gelingt-der-einsatz-in-der-praxis", "ist-deine-website-bereit-fur-ki-agenten-so-gelingt-der-einsatz-in-der-praxis", "ki-orchestrierung-die-neue-workflow-ebene-in-der-softwareentwicklung", "multimodale-agenten-warum-bild-video-und-code-jetzt-in-einem-workflow-landen-ein", "pandaprobe-was-das-tool-im-alltag-wirklich-taugt", "wie-agentische-developer-workflows-gerade-produktionsreif-werden-einordnung-prax", "wispr-flow-im-vergleich-welche-diktier-app-passt-wirklich-zu-deinem-workflow"]
created_at: "2026-02-07"
updated_at: 2026-07-31
popularity: 0
description: Framework und Laufzeit-Bausteine für LLM-Anwendungen mit Tools, Zustand, menschlichen Freigaben, Tracing und Evaluation.
---
# LangChain

## Kurzurteil

Ein Support-Agent erhält die Nachricht: „Meine Bestellung ist doppelt abgerechnet, bitte sofort erstatten.“ Ein einfacher Chatbot könnte freundlich antworten. Eine produktive Anwendung muss dagegen Kundendaten abrufen, die Transaktionen unterscheiden, eine Antwort formulieren und vor der Rückzahlung anhalten. Genau für diese Verknüpfung aus Modell, Tools, Zustand und Kontrollpunkten ist LangChain interessant.

LangChain liefert die höher liegenden Agenten- und Integrationsbausteine; LangGraph ist die Laufzeit für langlebige, zustandsbehaftete Abläufe mit Persistenz und Human-in-the-loop; LangSmith ergänzt Tracing und Evaluation. Wir **empfehlen** den Stack, wenn ein Team eine echte LLM-Anwendung baut und die zusätzliche Abstraktion bewusst betreiben kann. Für einen einzelnen Prompt oder eine kleine API-Funktion wäre er unnötiges Gerüst.

## Was LangChain heute ist

LangChain ist ein Open-Source-Framework für Anwendungen, in denen Sprachmodelle mit Datenquellen, Werkzeugen und Ablauflogik verbunden werden. Vorgefertigte Agentenmuster vereinfachen übliche Modell- und Tool-Schleifen. Wer mehr Kontrolle über Zustand, Unterbrechungen und lang laufende Aufgaben benötigt, arbeitet mit LangGraph.

LangGraph speichert Zustände über Checkpoints. Dadurch kann ein Ablauf nach Fehlern fortgesetzt, zwischen Sitzungen erinnert, an einem früheren Stand untersucht oder für eine menschliche Entscheidung pausiert werden. LangSmith zeichnet Ausführungen auf, unterstützt Evaluation und hilft zu verstehen, warum ein Agent eine bestimmte Tool-Kette gewählt hat.

## Ein realistischer Support-Ablauf

Beim doppelten Zahlungsvorgang liest ein erster Schritt nur die freigegebenen Bestell- und Transaktionsdaten. Ein Modell klassifiziert den Fall nicht allein nach Textgefühl, sondern erhält strukturierte Ergebnisse aus den Systemen. Wenn tatsächlich zwei Zahlungen vorliegen, formuliert der Agent eine Rückerstattungsaktion mit Betrag und Begründung.

Die Aktion läuft nicht sofort. Eine Human-in-the-loop-Regel unterbricht den Graphen vor dem schreibenden Tool. Der zuständige Mitarbeiter kann genehmigen, Betrag oder Text ändern oder ablehnen. Der Zustand bleibt gespeichert und wird nach der Entscheidung fortgesetzt. In LangSmith lässt sich anschließend nachvollziehen, welche Daten und Tool-Aufrufe zum Ergebnis geführt haben.

Der entscheidende Architekturpunkt ist die Trennung: Das Modell schlägt vor, deterministische Komponenten prüfen Grenzen, und eine Freigabe schützt die folgenreiche Aktion. LangChain macht diesen Prozess baubar; es entbindet das Team nicht davon, ihn sauber zu entwerfen.

## Für wen ist LangChain geeignet?

- Entwicklerteams, die Modelle mit Datenbanken, APIs, Suche und internen Werkzeugen verbinden
- Produktteams, die Agenten nicht nur demonstrieren, sondern beobachten und evaluieren müssen
- Anwendungen mit lang laufendem Zustand, Wiederaufnahme oder menschlichen Freigaben
- Teams, die Modellanbieter austauschbar halten und Integrationen wiederverwenden wollen
- Prototypen, die später in einen kontrollierten Produktionsablauf wachsen sollen

Weniger geeignet ist LangChain, wenn ein direkter SDK-Aufruf die gesamte Aufgabe zuverlässig löst oder das Team keinen Besitzer für Laufzeit, Traces und Evaluation benennen kann.

<figure class="tool-editorial-figure">
  <img src="/images/tools/langchain-editorial.webp" alt="Illustration zu LangChain: Dokumente, Werkzeuge und Speicherbausteine werden zu einer KI-Kette verbunden" loading="lazy" decoding="async" />
</figure>

## Typische Einsatzszenarien

- **Tool-gestützte Agenten:** Modelle kontrolliert auf APIs, Suche oder Datenbanken zugreifen lassen.
- **Retrieval-Anwendungen:** Eigene Dokumente finden, in Kontext überführen und Antworten mit Quellenbezug vorbereiten.
- **Lang laufende Workflows:** Zustand speichern und nach Fehlern oder Wartezeiten fortsetzen.
- **Freigaben:** Schreibende oder riskante Tool-Aufrufe vor der Ausführung anhalten.
- **Tracing und Evaluation:** Ausführungen untersuchen und Varianten gegen Testfälle messen.
- **Modellabstraktion:** Anbieter wechseln, ohne die gesamte Anwendung neu zu strukturieren.

## Stärken

- Großes Ökosystem aus Modellen, Tools, Retrievern und Integrationen
- LangGraph deckt Persistenz, Unterbrechung und Wiederaufnahme explizit ab
- Human-in-the-loop kann Tool-Aufrufe genehmigen, verändern oder ablehnen
- LangSmith macht Agentenpfade und Evaluation sichtbar
- Geeignet für den Weg vom Experiment zu einer überprüfbaren Anwendung

## Grenzen und Risiken

- Mehr Abstraktion bedeutet mehr Konzepte, Versionen und Fehlersuche
- Unklare Zustände oder Tool-Verträge machen Agenten auch mit Framework unzuverlässig
- Traces können sensible Prompts, Daten und Tool-Ergebnisse enthalten
- Ein riesiges Integrationsangebot verleitet dazu, Architektur vor dem Problem zu bauen
- Modell- und Toolkosten können sich über Schleifen und Wiederholungen unbemerkt summieren

## Workflow-Fit

Der sinnvolle Start ist ein einziger, messbarer Ablauf mit klaren Zuständen. Definieren Sie Eingaben, zulässige Tools, Abbruchbedingungen, Freigabepunkte und das Format des Ergebnisses, bevor ein Agent entscheiden darf. Für produktive Unterbrechungen braucht LangGraph einen persistenten Checkpointer; ein reiner In-Memory-Stand genügt nur für Tests.

Evaluation gehört nicht ans Ende. Ein kleines Set aus normalen Fällen, Grenzfällen und absichtlichen Tool-Fehlern zeigt früh, ob Änderungen am Prompt oder Modell den Ablauf wirklich verbessern.

## Datenschutz & Betrieb

Prompts, abgerufene Dokumente, Tool-Argumente, Zustände und Traces können vertrauliche Daten enthalten. Zugriff, Verschlüsselung, Aufbewahrung und Löschung müssen für Checkpoints und Observability ebenso geklärt sein wie für das Modell selbst. Produktionswerkzeuge sollten minimale Rechte und getrennte Lese- und Schreibpfade erhalten.

Bei externen Modellen und Diensten gelten zusätzlich deren Vertrags- und Datenbedingungen. Ein Framework ist keine Datenschutzgarantie; es macht Datenflüsse lediglich strukturierbarer.

## Preise & Kosten

Die zentralen Framework-Komponenten sind Open Source. Kosten entstehen durch Modelle, Vektorspeicher, Datenbanken, Hosting und optionale LangSmith- oder Plattformfunktionen. Für die Kalkulation zählt eine erfolgreich abgeschlossene, geprüfte Aufgabe, nicht nur der Preis eines einzelnen Modellaufrufs.

**Zum Anbieter:** https://langchain.com/

## Alternativen

- [Hugging Face](/tools/hugging-face/): Wenn offene Modelle, Datensätze und Deployment-Bausteine stärker im Mittelpunkt stehen.
- [OpenAI API](/tools/openai-api/): Wenn ein direkter Modell- und Tool-Aufruf ohne zusätzliches Framework genügt.
- [Rasa](/tools/rasa/): Für stärker kontrollierte Conversational-AI- und Intent-Workflows.
- [Dialogflow](/tools/dialogflow/): Für sprach- und textbasierte Dialogsysteme im Google-Ökosystem.
- [Microsoft Azure Cognitive Services](/tools/microsoft-azure-cognitive-services/): Für verwaltete KI-Dienste und Azure-nahe Unternehmensarchitekturen.

## Redaktionelle Einschätzung

LangChain ist weder Zauberstab noch bloßes „Prompt-Chaining“. Der Stack wird dann wertvoll, wenn ein Team Zustände, Tools, Freigaben und Evaluation als Produktbestandteile behandelt. Wer diese Disziplin bereits hat, erhält ein mächtiges Baugerüst. Wer sie nicht hat, kann mit LangChain nur komplexer scheitern.

**Redaktioneller Verdict:** Empfohlen für ernsthafte, tool-gestützte LLM-Anwendungen mit klarer Betriebsverantwortung. Nicht empfohlen als Standardantwort auf jede kleine KI-Funktion.

## FAQ

**Was ist der Unterschied zwischen LangChain und LangGraph?**

LangChain bietet höher liegende Agenten- und Integrationsbausteine. LangGraph ist die Laufzeit für zustandsbehaftete, langlebige Abläufe mit Persistenz und Unterbrechungen.

**Wofür dient LangSmith?**

Für Tracing, Evaluation, Prompt-Arbeit und Betriebsbeobachtung von LLM- und Agentenabläufen.

**Kann ein Agent vor einer Aktion gestoppt werden?**

Ja. Human-in-the-loop-Regeln können ausgewählte Tool-Aufrufe unterbrechen; ein Mensch genehmigt, ändert oder verwirft sie.

**Warum braucht LangGraph einen Checkpointer?**

Er speichert den Zustand, damit ein Ablauf nach Pause oder Fehler zuverlässig fortgesetzt werden kann.

**Ist LangChain nur für Python verfügbar?**

Es gibt wichtige Implementierungen und Dokumentation für Python und JavaScript/TypeScript. Funktionsdetails können sich unterscheiden.

**Muss ich LangChain für RAG verwenden?**

Nein. Retrieval lässt sich auch direkt mit Anbieter-SDKs und Datenbanken bauen. LangChain lohnt sich, wenn die wiederverwendbaren Bausteine den eigenen Ablauf vereinfachen.

**Ist LangChain kostenlos?**

Die Frameworks sind Open Source. Modelle, Hosting, Datenbanken und optionale Plattformdienste können Kosten verursachen.

**Wann sollte ein Team darauf verzichten?**

Wenn ein direkter API-Aufruf genügt, keine lang laufenden Zustände nötig sind oder niemand Framework und Evaluation betreiben kann.
