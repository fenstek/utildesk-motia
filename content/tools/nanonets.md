---
slug: nanonets
title: "Nanonets"
updated_at: 2026-08-17
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Redaktion"
editorial_reviewed_at: 2026-08-17
editorial_status: manual_polished
editorial_batch: 2026-08-17-ocr-document-rewrite
category: "Automatisierung"
price_model: "Je nach Plan"
tags: [ocr, invoice, document-ai, workflow, api]
official_url: "https://nanonets.com/"
description: "Nanonets verbindet OCR, Feldextraktion und nachgelagerte Workflow-Schritte für Rechnungen, Belege und andere Geschäftsdokumente. Die Stärke liegt im Übergang von erkannter Information zu Prüfung und Weiterleitung."
created_at: 2026-05-10
popularity: 0
tier: A
lastReviewed: 2026-08-17
translation: full
---
# Nanonets

Nanonets verbindet Dokument-OCR mit konfigurierbaren Workflows. Besonders charakteristisch sind Modelle beziehungsweise Workflows, die Felder und Tabellen liefern, sowie die Möglichkeit, Dokumente zu klassifizieren und an unterschiedliche OCR-Modelle zu routen. Die Plattform ist damit eher ein Prozessbaustein für eingehende Geschäftsdokumente als ein reiner Texterkennungs-Endpunkt.

<figure class="tool-editorial-figure"><img src="/images/tools/nanonets-editorial.webp" alt="Nanonets Workflow mit Dokumentklassifikation und Feldprüfung" loading="lazy" decoding="async" /></figure>

## Geeigneter Anwendungsfall

Nanonets passt zu Accounts Payable, Belegen, Bestellungen, Claims oder Lieferantenunterlagen, wenn erkannte Werte anschließend freigegeben oder zurückgewiesen werden müssen. Ein Team sollte zuerst festlegen, welche Dokumentklasse welches Modell erhält und welche Felder eine menschliche Prüfung auslösen.

## Modelle und Routing

Die API kann OCR-Modelle für Dateien oder öffentlich erreichbare URLs synchron oder asynchron ansprechen. Für größere Dateien ist ein asynchroner Ablauf sinnvoll, weil Ergebnisabholung und Fehlerbehandlung getrennt werden. Ein Document-Classification-Model kann beispielsweise Belege, Rechnungen und Bestellungen labeln und sie den passenden OCR-Modellen zuordnen.

## Einrichten und Lernen

Lege für jede Klasse Beispiele mit unterschiedlichen Lieferanten, Scans und Seitenlayouts ab. Konfiguriere Felder und Tabellen, trainiere oder verbessere das Modell und prüfe Vorhersagen gegen eine markierte Referenz. Korrekturen dürfen erst dann in ein Lern- oder Automatisierungsverfahren eingehen, wenn ihre fachliche Ursache dokumentiert ist.

## API und Integrationen

Die Nanonets-API verwendet einen API-Schlüssel über Basic Authentication und liefert JSON. Plane Upload, Prediction-ID, Page- beziehungsweise File-Ergebnis, Polling oder Webhook sowie die Zuordnung zu einer internen Dokument-ID. Export in ein Zielsystem ist ein eigener Schritt; das OCR-Ergebnis sollte nicht die einzige Belegkopie sein.

## Review und Grenzen

Ein Feld kann syntaktisch plausibel und fachlich falsch sein. Vergleiche Währung, Summen, Lieferant, Bestellnummer und Seitenzusammenhang mit Regeln außerhalb des Modells. Bei niedriger Konfidenz, unbekannter Klasse oder fehlendem Feld muss ein Reviewer entscheiden; ein Routing-Modell ersetzt keine Ausnahmebearbeitung.

## Betrieb und Daten

Definiere Schlüsselrotation, Rollen, Aufbewahrung und erlaubte Datenregionen für die Dokumente. Überwache API-Limits, asynchrone Jobs, doppelte Uploads und Modellversionen. Bei sensiblen Rechnungen oder Identitätsdokumenten sollte die Speicherung von Original und JSON-Ergebnis getrennt und begründet werden.

## Kosten und Entscheidung

Prüfe das aktuelle Nanonets-Angebot für Modell, Volumen und gewünschte Workflow-Funktionen. Realistische Kosten entstehen nicht nur durch Requests, sondern auch durch Review, Fehlklassifikation, Nachtraining und die eigene Integration. Ein Pilot sollte die Quote korrekt gerouteter Dokumente und den manuellen Aufwand je Klasse messen.

## Redaktionelle Einschätzung

Nanonets ist interessant, wenn Klassifikation, Extraktion und Review in einem geschäftlichen Eingangskanal zusammenlaufen. Für eine Entwickler-API mit schlanker eigener Anwendung sind [mindee](/tools/mindee/) oder [veryfi](/tools/veryfi/) fokussierter; für visuelle Regeln bei stabilen Layouts ist [docparser](/tools/docparser/) transparenter.

## Alternativen

- [mindee](/tools/mindee/): API- und SDK-zentrierte Extraktion für eine eigene Anwendung.
- [veryfi](/tools/veryfi/): Finanzdokumente mit starkem Fokus auf Belege und Rechnungsfelder.
- [docparser](/tools/docparser/): Sichtbare Zonen-, Keyword- und Tabellenregeln für bekannte Layouts.
- [rossum](/tools/rossum/): Queue- und Review-orientierter Betrieb von Geschäftsdokumenten.

## FAQ

**Wann ist die asynchrone OCR-API sinnvoll?**

Bei längeren oder mehrseitigen Dateien, wenn Upload, Ergebnisabholung und Fehlerbehandlung nicht an eine offene Anfrage gebunden sein sollen. Die Anwendung braucht dann eine belastbare Job-ID.

**Kann Nanonets verschiedene Dokumentklassen automatisch verteilen?**

Ja, ein Classification-and-Routing-Modell kann Klassen erkennen und Dokumente an zugeordnete OCR-Modelle senden. Die Klassen und Fehlerrouten müssen mit echten Eingangsdaten getestet werden.

**Was sollte ein Reviewer kontrollieren?**

Nicht nur das einzelne Feld, sondern auch Dokumenttyp, Lieferant, Summen, Währung, Seiten und die Verbindung zur internen Beleg-ID. So werden plausible, aber falsch geroutete Ergebnisse sichtbar.

**Welche Kosten gehören in den Pilot?**

Modell- und Volumenkosten, API-Betrieb, Review-Zeit, Nachtraining und die Speicherung der Quelldokumente. Ein Preis pro erfolgreicher Prüfung ist aussagekräftiger als ein Preis pro Upload.
