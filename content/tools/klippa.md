---
slug: klippa
title: "Klippa"
updated_at: 2026-08-17
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Redaktion"
editorial_reviewed_at: 2026-08-17
editorial_status: manual_polished
editorial_batch: 2026-08-17-ocr-document-rewrite
category: "Automatisierung"
price_model: "Je nach Plan"
tags: [ocr, invoice, expenses, api, data-extraction]
official_url: "https://www.klippa.com/en/ocr/"
description: "Klippa verarbeitet Rechnungen, Belege, Ausweisdokumente und weitere Geschäftsdokumente per OCR und API. Für Teams ist entscheidend, welche Felder benötigt werden und wie unklare Ergebnisse in den Finanzprozess gelangen."
created_at: 2026-05-10
popularity: 0
tier: A
lastReviewed: 2026-08-17
translation: full
---
# Klippa

Klippa bietet OCR- und Document-AI-APIs für Dokumenttypen wie Rechnungen, Belege, Ausweise und andere Geschäftsdokumente. Für eine Integration ist die Auswahl des passenden Dokumentmodells entscheidend: Ein Receipt- oder Invoice-Workflow hat andere Felder und Prüfungen als eine Identitätsprüfung.

<figure class="tool-editorial-figure"><img src="/images/tools/klippa-editorial.webp" alt="Klippa-OCR-API mit Belegfeldern und Validierungsschritt" loading="lazy" decoding="async" /></figure>

## Dokumentklasse zuerst

Definiere den Eingang anhand des tatsächlichen Dokuments und nicht anhand des Zielsystems. Rechnungen brauchen etwa Lieferant, Nummer, Datum, Positionen und Summen; Ausweise bringen Identitätsfelder und andere Schutzanforderungen. Ein gemischter Upload muss klassifiziert oder sauber getrennt werden.

## API-Workflow

Sende ein zulässiges Bild oder PDF über den dokumentierten API-Endpunkt und speichere Request-ID, Rohdatei und strukturierte Antwort getrennt. Baue eine Zustandsmaschine für angenommen, verarbeitet, zu prüfen und abgeschlossen. Retries dürfen weder doppelte Belege noch doppelte Identitätsfälle erzeugen.

## Confidence und Validierung

Nutze Konfidenzen als Signal, nicht als fachliche Wahrheit. Prüfe Summen, Datumslogik, Belegnummern, Länderfelder und Pflichtwerte mit eigenen Regeln. Bei Ausweisen kommen zusätzlich Zugriffs-, Einwilligungs- und Löschregeln hinzu; OCR allein beweist keine Identität.

## Integrationen

Klippa kann in eigene Apps und Backoffice-Prozesse eingebettet werden. Plane Webhooks oder Polling, Fehlerantworten, Rate Limits und eine sichere Übergabe an ERP, Expense- oder KYC-System. Die eigentliche Freigabe sollte nach der API-Antwort stattfinden, nicht in einem unüberwachten Importjob.

## Testdatensatz

Sammle gerade und schiefe Fotos, unterschiedliche Beleuchtung, handschriftliche Ergänzungen, mehrere Sprachen und abgeschnittene Seiten. Miss pro Dokumentklasse Feldfehler und manuelle Nacharbeit. Ein gutes Ergebnis bei Rechnungen sagt nichts über Ausweise oder Belege aus.

## Datenschutz und Kosten

Dokumenttyp, Region, Aufbewahrung, Rollen und Unterauftragnehmer müssen vor echten Kundendaten geklärt werden. Preise können von Dokumentklasse, Volumen, API-Produkt und Vertrag abhängen; aktuelle Klippa-Konditionen sind maßgeblich. Rechne Speicher, Review und Korrekturworkflow separat.

## Redaktionelle Einschätzung

Klippa passt zu Teams, die mehrere konkrete Dokumentklassen über APIs in vorhandene Anwendungen bringen wollen. Ein einzelner, mailbasierter Parser ist mit [parseur](/tools/parseur/) einfacher; für eine Review-Queue oder ein eigenes Entwickler-API sind [rossum](/tools/rossum/) und [mindee](/tools/mindee/) andere Zuschnitte.

## Alternativen

- [mindee](/tools/mindee/): Entwicklerfreundliche Parser-APIs und SDKs für eigene Anwendungen.
- [veryfi](/tools/veryfi/): Finanzdokumente mit spezialisiertem Receipt- und Invoice-Fokus.
- [rossum](/tools/rossum/): Queue-basierter Ausnahme- und Review-Betrieb.
- [parseur](/tools/parseur/): Mailbox-Parser für wiederkehrende E-Mail-Eingänge.

## FAQ

**Ist ein hoher Confidence-Wert eine Freigabe?**

Nein. Er beschreibt die Modellzuversicht, nicht ob Lieferant, Summe, Identität oder Buchungsregel fachlich stimmt. Dafür braucht es eigene Validierungen.

**Wie testet man Rechnungen und Ausweise getrennt?**

Lege getrennte Klassen, Referenzwerte, Zugriffskreise und Erfolgskriterien an. Vermische ihre Ergebnisse nicht in einer einzigen Durchschnittsquote.

**Wie sollte ein Retry funktionieren?**

Verwende eine stabile interne Dokument-ID und speichere den API-Status. Ein erneuter Request darf nur nach einer bewusst geprüften Unsicherheit entstehen.

**Wann reicht Klippa nicht aus?**

Wenn eure Regeln eine vollständige Review-Oberfläche, komplexe Klassifikation oder eine bestimmte Cloud-Region voraussetzen. Diese Anforderungen müssen vor dem Vertrag geprüft werden.
