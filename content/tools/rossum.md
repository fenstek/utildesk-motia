---
slug: rossum
title: "Rossum"
updated_at: 2026-08-17
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Redaktion"
editorial_reviewed_at: 2026-08-17
editorial_status: manual_polished
editorial_batch: 2026-08-17-ocr-document-rewrite
category: "Automatisierung"
price_model: "Individuelles Angebot"
tags: [ocr, invoice, document-ai, automation, api]
official_url: "https://rossum.ai/"
description: "Rossum ist eine Document-AI-Plattform für wiederkehrende Geschäftsdokumente wie Rechnungen, Bestellungen und Lieferscheine. Der Schwerpunkt liegt auf Extraktion, Ausnahmebehandlung und einem operativen Review-Prozess."
created_at: 2026-05-10
popularity: 0
tier: A
lastReviewed: 2026-08-17
translation: full
---
# Rossum

Rossum ist eine Document-Automation-Plattform für operative Dokumentströme, besonders Accounts Payable. Ihre Eigenheit ist der Queue- und Review-Ansatz: Dokumente werden aufgenommen, klassifiziert, extrahiert und bei Ausnahmen in einer Arbeitsoberfläche vorgelegt. Das Ergebnis muss trotzdem gegen ERP-Regeln und Freigaben geprüft werden.

<figure class="tool-editorial-figure"><img src="/images/tools/rossum-editorial.webp" alt="Rossum-Queue mit extrahierten Rechnungsfeldern und Review-Ausnahme" loading="lazy" decoding="async" /></figure>

## Dokumentstrom und Queue

Definiere zuerst, welche Dokumente in welche Queue gelangen und welche Felder für den jeweiligen Prozess relevant sind. Rechnungen, Bestellungen und Lieferscheine haben unterschiedliche Prüfregeln. Eine gute Queue macht Status, Zuständigkeit und die nächste Aktion sichtbar, statt nur ein JSON-Ergebnis abzulegen.

## Extraktion und Review

Rossum übernimmt die Erkennung von Dokumentfeldern, aber ein Operator muss unsichere Werte oder geschäftliche Ausnahmen bearbeiten können. Prüfe Summen, Lieferanten, Bestellbezug und Steuerdaten mit dem Original. Korrekturen sollten nachvollziehbar bleiben und nicht stillschweigend eine falsche Buchung erzeugen.

## Einführung mit Referenzen

Wähle einen begrenzten Eingang, etwa Rechnungen einiger Lieferanten, und sammle echte Layoutvarianten. Miss Feldqualität, Straight-through-Rate und Review-Minuten getrennt. Ein Dokument mit hoher Extraktionsqualität kann dennoch wegen fehlender Bestellung oder doppelter Rechnung in der Queue bleiben.

## Integrationen und Rollen

Plane API, Exporte, Webhooks, ERP-Ziel, Rollen und Eskalationen gemeinsam. Die Queue braucht einen Eigentümer für unbearbeitete Fälle; ein technischer Retry darf keine zweite Rechnung erzeugen. Prüfe außerdem, wie Originaldatei, Extraktionsdaten und die finale Entscheidung zusammen referenziert werden.

## Qualität und Grenzen

Teste schlechte Scans, neue Lieferanten, Gutschriften, mehrseitige Belege und fehlende Bestellnummern. Vergleiche nicht nur OCR-Werte, sondern auch Klassifikation und Routing. Rossum nimmt keine Verantwortung für eure Kontierung, steuerliche Bewertung oder interne Freigabematrix ab.

## Datenschutz und Kosten

Finanzdokumente brauchen eine dokumentierte Regel für Region, Rollen, Aufbewahrung und Löschung. Prüfe das aktuelle Angebot mit Rossum, weil Preise und Vertragsumfang vom Prozess abhängen können. Rechne zusätzlich Review-Arbeit, ERP-Anpassung und Ausnahmevolumen ein.

## Redaktionelle Einschätzung

Rossum passt, wenn ein Team einen sichtbaren operativen Review-Prozess für wiederkehrende Geschäftsdokumente braucht. Für reine API-Extraktion ohne Queue sind [mindee](/tools/mindee/) oder [veryfi](/tools/veryfi/) schlanker; für selbst definierte Zonen ist [docparser](/tools/docparser/) nachvollziehbarer.

## Alternativen

- [mindee](/tools/mindee/): Entwickler-API für eine eigene Review- und Integrationsoberfläche.
- [veryfi](/tools/veryfi/): Finanzdokumente mit API-first Übergabe an die eigene Anwendung.
- [docparser](/tools/docparser/): Regelbasierte Layoutkontrolle für bekannte Dokumentformen.
- [nanonets](/tools/nanonets/): Klassifikation, Modellrouting und Workflow-Automation.

## FAQ

**Wann gehört eine Rechnung in die Review-Queue?**

Wenn ein Pflichtfeld fehlt, die Konfidenz nicht genügt, der Bestellbezug nicht passt oder ein fachlicher Konflikt vorliegt. Die genaue Schwelle sollte eure Referenzdaten widerspiegeln.

**Ersetzt Rossum das ERP?**

Nein. Rossum kann Dokumentdaten vorbereiten und Ausnahmen bearbeiten; Kontierung, Lieferantenstamm, Freigabe und Buchung bleiben im Zielprozess.

**Was misst ein realistischer Pilot?**

Feldfehler, korrekt geroutete Dokumente, Straight-through-Rate, Review-Minuten und doppelte Fälle. Nur OCR-Genauigkeit würde die Queue-Arbeit ausblenden.

**Für wen ist eine API-first Alternative besser?**

Für Teams, die bereits eine eigene Review-Oberfläche und Geschäftslogik besitzen. Dann kann eine spezialisierte Extraktions-API weniger Prozessballast bedeuten.
