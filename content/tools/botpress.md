---
slug: "botpress"
title: "Botpress"
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Redaktion"
editorial_reviewed_at: 2026-07-14
editorial_status: "manual_polished"
editorial_batch: "2026-07-14-full-tool-card-editorial"
category: "AI Chatbots"
price_model: "Freemium"
tags: [ai, chatbot]
official_url: "https://botpress.com"
created_at: "2026-02-12"
updated_at: 2026-07-14
lastReviewed: 2026-07-14
description: "Botpress ist eine Cloud-Plattform für AI-Agenten und Chatbots mit visuellen Workflows, Wissensbasen, Tabellen und Integrationen."
popularity: 0
tier: "C"
generated_at: "2026-05-15"
---
# Botpress

Botpress ist eine Cloud-Plattform zum Bauen, Testen und Betreiben von AI-Agenten und Chatbots. Teams modellieren Dialoglogik visuell in Workflows aus Nodes und Cards, geben dem Agenten kontrollierte Wissensquellen und verbinden ihn über Integrationen mit externen Diensten. Das passt zu einem Support- oder Self-Service-Prozess mit klarer Eskalation; es ist kein Ersatz für eine belastbare Wissenspflege, menschliche Freigaben oder ein eigenes Backend.

## Für wen eignet sich Botpress?

Botpress richtet sich vor allem an Produktteams, Entwickler und fachliche Verantwortliche, die einen Chatbot nicht nur prompten, sondern als nachvollziehbaren Ablauf betreiben wollen. Ein kleines Team kann damit einen FAQ- oder Intake-Piloten bauen; für den produktiven Einsatz braucht es zusätzlich jemanden, der Inhalte, Berechtigungen, Kosten und Fehlerfälle verantwortet.

Die aktuelle Plattform ist Botpress Cloud. Botpress weist ausdrücklich darauf hin, dass v12 und andere selbst gehostete Versionen für neue Downloads, Käufe und Deployments nicht mehr verfügbar sind. Wer eine lokale Installation, vollständige Netzwerkkontrolle oder eine eigene Laufzeit voraussetzt, sollte deshalb vorab eine andere Architektur wählen.

## Wie ist ein Botpress-Workflow aufgebaut?

Ein Workflow zerlegt den Dialog in wiederverwendbare Abschnitte, etwa Begrüßung, Identifikation eines Anliegens, Datenerfassung und Übergabe. Nodes sind die einzelnen Schritte; Cards senden Nachrichten, erfassen Informationen, rufen Logik auf oder wechseln den Ablauf. Standard Nodes führen Schritte kontrolliert der Reihe nach aus. Autonomous Nodes lassen ein LLM innerhalb der vorgegebenen Werkzeuge Entscheidungen treffen.

Ein konkreter Pilot könnte so aussehen: Der Nutzer fragt nach einer Rechnung, ein Node erkennt das Anliegen, ein weiterer erfasst Kundennummer und Zeitraum, eine Integration fragt den passenden Dienst ab, und ein letzter Node zeigt nur die freigegebenen Daten. Bei fehlender Berechtigung oder unsicherer Antwort führt der Workflow zu einem Menschen. Diese Übergänge sollten im Emulator mit echten und absichtlich missverständlichen Eingaben getestet werden.

## Wie nutzt man Wissen und Daten?

Knowledge Bases bündeln Quellen wie Websites, Dokumente, Rich Text, Tabellen und je nach Einrichtung Integrationen. Ein Autonomous Node kann sie durchsuchen; bei Standard Nodes muss die Suche bewusst über passende Cards eingebaut und die Antwort anschließend ausgegeben werden. Das ist nützlich für Produktdokumentation, interne Richtlinien oder Preis- und Servicetabellen, aber eine gefundene Passage ist noch keine Garantie für eine richtige Entscheidung.

Tables dienen als strukturierter Speicher innerhalb des Bots, beispielsweise für einfache Profile, Statuswerte oder Vorgänge über mehrere Sessions. Bei personenbezogenen oder geschäftskritischen Daten muss das Team klären, ob diese Speicherung, der Zugriff durch Integrationen und die Aufbewahrung erlaubt sind. Für komplexe Transaktionen, fein abgestufte Rechte oder eine zentrale Datenhoheit bleibt ein spezialisiertes Backend die bessere Quelle.

## Integration und laufender Betrieb

Integrationen verbinden den Bot mit APIs, Tools und Messaging-Kanälen. Vor der Installation sollte man Voraussetzungen, Anbieter des Connectors und benötigte Berechtigungen prüfen; ein Eintrag im Hub ist nicht automatisch eine fachliche Freigabe für Produktionsdaten. Secrets gehören in die dafür vorgesehene Konfiguration, nicht in Prompts oder Tabellen.

Für den Betrieb empfiehlt sich ein kleines Testset aus häufigen Fragen, Grenzfällen und absichtlich fehlenden Informationen. Prüfe nach jeder Änderung die Quellen, Übergaben, Fehlermeldungen und Kosten. Zusätzlich sollte ein Mensch Fälle übernehmen können, in denen Identität, Geld, Gesundheit, Recht oder eine unklare Wissensquelle betroffen sind.

## Datenschutz, Sicherheit und Kosten

Vor dem ersten echten Gespräch muss feststehen, welche Nachrichten, Dateien, Tabellenwerte und Telemetrie an Botpress oder verbundene Modell- und Dienstanbieter gelangen. Rollen, Workspace-Zugriff, Löschfristen, Exportmöglichkeiten und die Datenverarbeitung sollten dokumentiert werden. Für europäische Teams gehören DPA, Hosting- und Subprozessor-Informationen in die Prüfung; die Karte ersetzt keine Rechtsberatung.

Botpress bietet einen kostenlosen Einstieg und kostenpflichtige Pläne; zusätzlich wird AI Spend für die Nutzung von LLMs separat nach dem jeweiligen Modellanbieter berechnet. Je nach Plan kommen Limits oder Add-ons etwa für Bots, Nachrichten, Tabellenzeilen und Speicher hinzu. Kalkuliere daher nicht nur die Plattformgebühr, sondern auch Modellaufrufe, Integrationsbetrieb, Monitoring und menschliche Übergaben.

## Redaktionelle Einschätzung

Botpress ist eine gute Wahl für Teams, die einen AI-gestützten Dialog mit visueller Ablaufkontrolle, eigener Wissensbasis und Integrationen als überschaubaren Cloud-Service pilotieren wollen. Der Nutzen entsteht, wenn ein konkreter Prozess messbar schneller oder sauberer wird und ein Verantwortlicher die Antworten regelmäßig prüft.

Weniger passend ist Botpress, wenn Self-Hosting, lokale Verarbeitung oder eine bereits standardisierte Support-Suite zwingend sind. Unser Urteil: mit einem eng begrenzten Anwendungsfall starten, zehn bis zwanzig reale Gespräche als Testset dokumentieren und erst nach einer Prüfung von Fehlerrate, Eskalationen, Datenfluss und AI Spend erweitern.

<figure class="tool-editorial-figure">
  <img src="/images/tools/botpress-editorial.webp" alt="Illustration einer Botpress-Chatbot-Werkstatt mit verknüpften Dialogbausteinen" loading="lazy" decoding="async" />
</figure>

## Alternativen

- [Dialogflow](/tools/dialogflow/): Sinnvoll, wenn Google-Cloud-Dienste, intent-basierte Dialoge und eine stark integrierte Plattform wichtiger sind als Botpress' visueller Cloud-Workflow.
- [Rasa](/tools/rasa/): Die passendere Option, wenn ein Entwicklerteam Open-Source-Komponenten und mehr Kontrolle über die eigene Laufzeit und Datenarchitektur braucht.
- [Microsoft Bot Framework](/tools/microsoft-bot-framework/): Naheliegend für Organisationen, die Bots eng an Azure, Microsoft 365 und bestehende Microsoft-Entwicklungsprozesse anbinden.
- [ManyChat](/tools/manychat/): Besser für marketinggetriebene Automationen in Social-Messaging-Kanälen mit weniger eigener Dialoglogik.
- [Tidio](/tools/tidio/): Praktischer für kleinere Supportteams, die Live-Chat und einfache Automatisierung statt einer frei modellierten Agentenplattform suchen.

## FAQ

**Ist Botpress noch eine Open-Source- oder Self-Hosting-Plattform?**

Für neue Projekte sollte man mit Botpress Cloud planen. Die offizielle Dokumentation erklärt, dass v12 und andere selbst gehostete Versionen nicht mehr für neue Downloads, Käufe oder Deployments verfügbar sind.

**Kann ein Botpress-Agent auf Unternehmenswissen antworten?**

Ja, Knowledge Bases können unter anderem Websites, Dokumente, Rich Text und Tabellen als Quellen verwenden. Die Quellen müssen aber aktuell, passend zugeschnitten und für den konkreten Workflow freigegeben sein; bei Unsicherheit sollte der Bot eskalieren.

**Was kostet Botpress?**

Es gibt einen kostenlosen Einstieg und kostenpflichtige Pläne. Zusätzlich fällt AI Spend für LLM-Nutzung an; Limits, Add-ons, Speicher und Integrationen können die Gesamtkosten erhöhen. Vor dem Rollout sollte man reale Gesprächsmengen mit einem Ausgabenlimit testen.

**Ist Botpress für sensible Daten geeignet?**

Nicht automatisch. Vor einer Nutzung mit personenbezogenen oder vertraulichen Daten müssen Datenfluss, Anbieter, Aufbewahrung, Zugriff, Löschung und menschliche Kontrollpunkte geprüft und dokumentiert werden. Für besonders strenge lokale Verarbeitungsanforderungen kann eine andere Architektur besser passen.
