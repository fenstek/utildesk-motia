---
slug: convai
title: Convai
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Redaktion"
editorial_reviewed_at: 2026-07-14
editorial_status: "manual_polished"
editorial_batch: "2026-07-14-optiplex-editorial-50"
category: "AI Chatbots"
price_model: Freemium
tags: [ai, chatbot, game-development, voice]
official_url: "https://convai.com/"
description: "Convai baut interaktive KI-Charaktere für Spiele, virtuelle Welten und eingebettete Sprach- oder Textdialoge – mit klarer Grenze zwischen Prototyp und betreibbarer Anwendung."
popularity: 0
tier: D
generated_at: 2026-05-11
updated_at: 2026-07-14
---
# Convai

Convai ist eine Plattform für interaktive KI-Charaktere, nicht primär ein klassischer Website-Supportbot. Teams definieren Persönlichkeit, Backstory, Wissen, Stimme und Aktionen eines Charakters und bringen ihn über Playground, Avatar Studio, Web- oder Game-Engine-Integrationen in eine Szene. Das ist interessant für NPCs, immersive Demos, Simulationen und sprachfähige Avatare. Die entscheidende Grenze: Ein überzeugendes Gespräch im Playground beweist noch keine stabile, sichere Produktion mit kontrollierten Kosten, reproduzierbarer Latenz und einer belastbaren Ausweichlogik.

<figure class="tool-editorial-figure">
  <img src="/images/tools/convai-editorial.webp" alt="Virtueller Charakter verbindet Sprache, Wissen und Aktionen in einer interaktiven 3D-Szene" loading="lazy" decoding="async" />
</figure>

## Für wen eignet sich Convai?

Convai passt zu Game-Studios, XR- und Simulationsteams sowie Entwicklern, die einen Charakter in Unity, Unreal oder im Web mit Text- und Sprachinteraktion ausstatten möchten. Auch ein kleiner Proof of Concept für einen virtuellen Guide oder ein Rollenspiel-Training kann sinnvoll sein. Wer dagegen nur ein regelbasiertes FAQ, ein Helpdesk-Formular oder einen klassischen Telefonbot braucht, sollte zuerst eine stärker auf diesen Prozess zugeschnittene Lösung prüfen.

## Welche Bausteine werden eingerichtet?

Im Convai Playground entsteht der Charakter mit Beschreibung, Persönlichkeit, Sprache und Stimme. Die Knowledge Bank nimmt Textwissen auf, das einem Charakter zugeordnet werden kann; die Dokumentation beschreibt dort aktuell vor allem TXT-Dateien und das Zurücksetzen der Chat-Session nach einer Wissensänderung. Backstory und Knowledge Bank sind nicht austauschbar: Die Backstory prägt die Rolle und Welt, die Wissensquelle liefert konkrete Fachinformationen. Actions verbinden Gespräch und Szene, etwa Bewegungen oder Interaktionen mit Objekten.

## Praktischer Ablauf vom Prototyp zur Szene

Ein sinnvoller Start ist ein einzelner Charakter mit einem abgegrenzten Ziel: etwa ein NPC, der drei Orte erklären und bei unbekannten Fragen an ein UI verweisen soll. Danach werden typische, missverständliche und unerlaubte Eingaben als Testset gesammelt. Erst wenn Textdialoge funktionieren, kommen Stimme, Animation und Szenenobjekte hinzu. In Unity oder Unreal müssen zusätzlich Game-Engine-Komponenten, Avatare, Animationen, Objekte und Navigation zusammenpassen. Ein Chatbot, der verbal „gehe zum Tor“ versteht, bewegt sich nicht automatisch korrekt, wenn Szene, Action und NavMesh nicht sauber modelliert sind.

## Integration und laufender Betrieb

Convai dokumentiert Plugins für Unity und Unreal sowie Web- und PlayCanvas-Anbindungen. Für eigene Anwendungen gibt es Core APIs zum Erstellen und Konfigurieren von Charakteren und Interaction APIs für Text- oder Audioein- und -ausgaben. API-Schlüssel gehören ausschließlich in serverseitige oder geschützte Laufzeitumgebungen. Versionierung, Chat-Historie und Evaluation helfen beim Vergleich, ersetzen aber weder automatisierte Tests noch eine menschliche Freigabe für riskante Dialoge. Für eine öffentliche Anwendung sollten außerdem Zeitüberschreitungen, Rate-Limit-Fehler, Offline-Zustände und ein verständlicher Fallback eingeplant werden.

## Qualität messen statt Demo bewerten

Vor dem Rollout wird ein Set aus realistischen Fragen, absichtlichen Fehlfragen und Grenzfällen festgelegt. Gemessen werden beispielsweise korrekte Wissensbezüge, unerlaubte Behauptungen, Verständlichkeit der Stimme, Antwortlatenz, Kosten pro Session und der Anteil sauberer Übergaben an ein alternatives UI. Bei Actions kommt hinzu, ob nur erlaubte Objekte und Bewegungen ausgelöst werden. Eine Version sollte erst weitergegeben werden, wenn die Ergebnisse dokumentiert und mit der vorherigen Version verglichen sind. Freie Improvisation ist bei einem NPC Teil des Erlebnisses, aber kein Ersatz für fachliche Kontrolle.

## Datenschutz, Rechte und Governance

Convai weist in seiner Privacy Policy auf Konto-, Kommunikations-, Geräte-, Nutzungs- und Interaktionsdaten hin und beschreibt die Verarbeitung beziehungsweise Übermittlung personenbezogener Daten an Einrichtungen und Server in den USA. Die Policy nennt kommerziell angemessene Schutzmaßnahmen, aber keine pauschale Zusage, die jede Organisation von einer Datenschutzprüfung entbindet. Deshalb gehören keine unnötigen personenbezogenen oder vertraulichen Inhalte in Knowledge Bank oder Testdialoge. Vor einem Einsatz in Europa sollten Zweck, Rechtsgrundlage, Aufbewahrung, Betroffenenrechte, Unterauftragnehmer und gegebenenfalls ein DPA geprüft werden. Die Terms verlangen für öffentlich bereitgestellte Anwendungen grundsätzlich eine Convai-Attribution, sofern sie nicht schriftlich aufgehoben oder vertraglich anders geregelt ist.

## Preis und tatsächliche Betriebskosten

Convai bietet einen Free-Einstieg sowie kostenpflichtige Creator-/Developer-Stufen; die offizielle Pricing-Seite listet derzeit Indie Dev, Professional, Scale und Business mit monatlichen beziehungsweise jährlich rabattierten Beträgen. Die Unterschiede betreffen unter anderem Interaktionskontingente, aktive Endnutzer, Knowledge-Bank-Größe, Versionierung, APIs, Evaluation, Stimmen und Cloud- beziehungsweise Avatar-Funktionen. Unverbrauchte Interaktionen werden laut Pricing nicht in den nächsten Abrechnungszeitraum übertragen. Für die Kalkulation zählen daher nicht nur der Tarif, sondern auch Sessions, Sprach- und Drittanbieter-Stimmen, eigene Infrastruktur, Engine-Arbeit, Moderation, Support und die Pflege von Backstory und Wissensquellen. Enterprise-Leistungen wie Daten- und Servicezusagen müssen separat geprüft werden.

## Redaktionelle Einschätzung

Convai ist für Teams empfehlenswert, die einen interaktiven Charakter als Bestandteil eines Spiels, einer Simulation oder einer immersiven Web-Erfahrung bauen und Engine- oder API-Kompetenz besitzen. Wert entsteht, wenn ein klarer Charakterauftrag, begrenzte Szenen, testbare Actions und ein Owner für Inhalte und Betrieb vorhanden sind. Für ein nüchternes FAQ, einen kontrollierten Support-Flow oder eine selbst gehostete Dialoglogik ist eine engere Alternative meist die bessere Entscheidung. Der konkrete Go/No-Go-Test lautet: Liefert Convai in einer kleinen Szene bessere Interaktion, ohne dass Kosten, Datenschutzrisiko und Wartungsaufwand den erzielten Erlebnisgewinn übersteigen?

## Alternativen

- [Dialogflow](/tools/dialogflow/): Geeigneter für strukturierte Kundenservice- und Sprachflows mit Intents, Webhooks und klarer Gesprächssteuerung statt szenischer Charakterlogik.
- [Botpress](/tools/botpress/): Praktischer für visuelle AI-Agent-Workflows, Wissensquellen und Integrationen in einem Cloud-Chatbot-Prozess.
- [Rasa](/tools/rasa/): Die passendere Richtung, wenn Dialoglogik und Betrieb stärker im eigenen Code und unter eigener Kontrolle liegen sollen.
- [Character AI](/tools/character-ai/): Näher an frei zugänglichen Charakterdialogen und Rollenspiel; für produktionskritische eigene Szenen fehlen dort andere Kontrollschwerpunkte.
- [Unity](/tools/unity/): Die umfassendere Engine-Basis, wenn Welt, Animation, Physik und Plattformdeployment wichtiger sind als ein fertiger Gesprächsdienst.

## FAQ

**Brauche ich für Convai Programmierkenntnisse?**

Für einen ersten Charakter und einfache Tests reicht der Playground. Sobald eine Szene, ein Plugin, eigene Actions, API-Aufrufe, Authentifizierung oder Fehlerbehandlung hinzukommen, braucht das Team Entwicklungskenntnisse in der jeweiligen Laufzeitumgebung.

**Kann Convai mein vorhandenes Unternehmenswissen verwenden?**

Ja, die Knowledge Bank kann laut Dokumentation Textwissen aufnehmen und mit Charakteren verbinden. Das ist aber kein Beleg für fehlerfreie Antworten: Quellen müssen bereinigt, Änderungen versioniert und Antworten gegen ein Testset geprüft werden.

**Ist Convai für eine öffentliche Anwendung automatisch datenschutzkonform?**

Nein. Die Privacy Policy beschreibt Datenverarbeitung und US-Server, während die konkrete Zulässigkeit vom Einsatz, den Daten und der Rechtsgrundlage abhängt. Datenschutzprüfung, Minimierung und ein vertraglicher Check bleiben Aufgabe der betreibenden Organisation.

**Wie bringe ich einen Charakter in ein Spiel?**

Convai dokumentiert Plugins für Unity und Unreal sowie Web-Anbindungen. Zusätzlich müssen Avatar, Animationen, Actions, Szeneobjekte und bei Navigation etwa ein NavMesh passend eingerichtet und getestet werden.

**Woran erkenne ich, dass der Pilot produktionsreif ist?**

Nicht an einer gelungenen Demo, sondern an reproduzierbaren Tests: akzeptable Latenz und Kosten, korrektes Wissen, erlaubte Actions, definierte Fallbacks und dokumentierte Inhaltsverantwortung. Erst wenn diese Kriterien für eine begrenzte Szene erfüllt sind, sollte die Reichweite steigen.
