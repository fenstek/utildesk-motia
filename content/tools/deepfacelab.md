---
slug: deepfacelab
title: DeepFaceLab
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Redaktion"
editorial_reviewed_at: 2026-07-14
editorial_status: "manual_polished"
editorial_batch: "2026-07-14-optiplex-editorial-50"
category: "Audio & Video"
price_model: "Open Source"
description: "Lokale GPL-3.0-Software für trainierte Gesichts- und Kopfersetzung in Video-Frames – leistungsfähig, aber archiviert und mit hohem Prüfaufwand."
official_url: "https://github.com/iperov/DeepFaceLab"
popularity: 0
tier: "D"
generated_at: "2026-05-11"
updated_at: 2026-07-14
tags: [deepfakes, video, open-source]
---
# DeepFaceLab

DeepFaceLab ist eine lokale Open-Source-Pipeline für Gesichts- und Kopfersetzung in Bildern und Videos. Das offizielle Repository beschreibt außerdem De-Aging und native-resolution work; der eigentliche Ablauf besteht aus Materialauswahl, Face-Extraction, Training, Maskierung, Merge und anschließender Videonachbearbeitung. Die entscheidende Grenze: Das Repository ist seit dem 13. November 2024 archiviert und read-only. DeepFaceLab ist daher ein nachvollziehbares Werkzeug für Forschung, VFX-Experimente oder eng begrenzte interne Tests, aber kein aktiv gepflegter Cloud-Dienst mit Supportversprechen.

<figure class="tool-editorial-figure">
  <img src="/images/tools/deepfacelab-editorial.webp" alt="Lokaler Medienarbeitsplatz mit Gesichtslandmarks, Trainingsvorschau und einer Prüfliste für Videoframes" loading="lazy" decoding="async" />
</figure>

## Für wen ist DeepFaceLab geeignet?

Geeignet ist es für technisch versierte Einzelpersonen oder kleine VFX- und Forschungsteams, die Daten lokal halten, den Trainingsprozess verstehen und jeden Export manuell abnehmen können. Wer nur gelegentlich einen kurzen Effekt für Social Media braucht, wird mit einer einfacheren App schneller sein. Wer eine belastbare Produktionspipeline sucht, muss zusätzlich die Wartbarkeit des archivierten Codes, die Hardwareumgebung und die Rechtekette verantworten.

## Was leistet die Pipeline?

Die offiziellen Beispiele nennen Face Replacement, Head Replacement und De-Aging. Der praktische Kern ist nicht ein Ein-Klick-Filter, sondern das Erzeugen und Prüfen von Trainingsdaten: Gesichter werden aus Quell- und Zielmaterial extrahiert, ausgerichtet und für ein Modell vorbereitet. Danach wird ein Modell trainiert, eine Maske beziehungsweise ein Segmentierungsbereich gepflegt und das Ergebnis in Zielbilder oder Frames gemergt. Für den finalen Clip bleiben Schnitt, Farbkorrektur, Ton und Artefaktretusche außerhalb der eigentlichen Pipeline.

## Ein sinnvoller Test-Workflow

Beginne mit Material, für das Einwilligung und Nutzungsrechte dokumentiert sind. Lege vorab fest, ob nur ein kurzer interner Proof oder ein veröffentlichter Clip entstehen darf. Isoliere die Umgebung, sichere Quellmaterial und Modellstände und arbeite mit einer kleinen, repräsentativen Sequenz statt mit einem ganzen Film. Prüfe zunächst die Extraktion, dann einige Trainingsstände und erst danach einen vollständigen Merge. Jeder Export erhält eine Versionsnummer, einen verantwortlichen Reviewer und einen Vermerk, ob er synthetisch erzeugte Medien enthält.

## Betrieb, Hardware und Übergabe

DeepFaceLab arbeitet auf dem eigenen Rechner; das reduziert den Bedarf, Rohmaterial an einen Webdienst hochzuladen, macht den Betrieb aber nicht automatisch sicher. Das Repository verweist auf CUDA, DirectX und TensorFlow-nahe Komponenten sowie auf Windows-Pakete; die dort genannten Linux-Varianten können veraltet sein. Plane GPU-Speicher, lokale Ablage für Frames und Modelle, reproduzierbare Umgebungen und einen getesteten Exportweg ein. Da das Projekt archiviert ist, müssen Teams Abhängigkeiten, Treiber und Installationsquellen selbst dokumentieren und dürfen nicht mit zeitnahen Bugfixes rechnen.

## Qualitätsprüfung und Abnahmekriterien

Ein gutes Trainingspreview ist noch kein veröffentlichungsfähiges Ergebnis. Prüfe Gesichtskonturen, Augen und Zähne, Haare, Maskenkanten, Beleuchtung, Bewegungsunschärfe, Verdeckung und Frame-zu-Frame-Flackern. Vergleiche eine festgelegte Testsequenz mit dem Ausgangsmaterial und halte Ausschussgründe fest. Für eine Entscheidung zählen die Zeit bis zum brauchbaren Export, die Zahl manueller Korrekturen, sichtbare Artefakte und die Quote abgenommener Frames – nicht nur ein beeindruckender Einzel-Frame.

## Privatsphäre, Sicherheit und Governance

Lokale Verarbeitung kann den Datenpfad überschaubarer machen, ersetzt aber keine Rechteprüfung. Gesichter sind personenbezogene beziehungsweise biometrisch sensible Informationen; Einwilligung, Zweckbindung, Aufbewahrung und Zugriff müssen vor dem Import geklärt sein. Verwende keine realen Personen ohne belastbare Zustimmung und täusche keine Authentizität vor. Halte Originale und bearbeitete Dateien getrennt, beschränke Zugriffsrechte, prüfe heruntergeladene Pakete und Abhängigkeiten und kennzeichne synthetische Inhalte. Die GPL-3.0-Lizenz des Programms klärt nicht automatisch die Rechte an Gesichtern, Filmclips, Trainingsdaten oder Musik.

## Preis und laufende Kosten

Für DeepFaceLab selbst ist im offiziellen Repository keine SaaS-Preisliste angegeben; der Quellcode ist unter GPL-3.0 veröffentlicht. „Kostenlos“ bedeutet deshalb nicht kostenlos im Betrieb. Relevant sind GPU oder Mietrechner, Strom, Speicher für Frames und Modelle, Sicherungen, Einrichtung, Fehlerbehebung, menschliche Qualitätskontrolle und gegebenenfalls rechtliche Beratung. Bei Downloads aus README-verlinkten Distributionskanälen kommen Herkunfts- und Integritätsprüfungen hinzu. Ein kleiner Test kann günstig sein, eine wiederholbare Produktionsnutzung aber schnell mehr Betreuung als Softwarebudget benötigen.

## Redaktionelle Einschätzung

DeepFaceLab empfehlen wir nur Teams, die eine lokale, kontrollierte Deepfake- oder VFX-Studie ausdrücklich verantworten können und einen technischen Owner für eine archivierte Softwarebasis haben. Wert entsteht, wenn ein klar begrenztes Motiv mit freigegebenem Material reproduzierbar verarbeitet und anhand sichtbarer Qualitätskriterien abgenommen wird. Für Marketing, Nachrichten, Identitätsdarstellung oder jede Veröffentlichung ohne saubere Einwilligungs- und Kennzeichnungsprozesse ist es die falsche Wahl. Dann sind eine engere, weniger missbrauchsanfällige Videolösung oder ein professioneller VFX-Workflow vorzuziehen.

## Alternativen

- [FaceSwap](/tools/faceswap/): Ebenfalls lokale Open-Source-Pipeline, wenn Training, Datenkontrolle und ein vergleichbarer manueller Ablauf gewünscht sind.
- [Avatarify](/tools/avatarify/): Näher an Live-Video und Avatar-Effekten, wenn Echtzeit-Experimente wichtiger sind als ein langer Offline-Trainingslauf.
- [Reface](/tools/reface/): Einfacherer, kommerzieller App-Ansatz für schnelle kreative Clips; weniger geeignet, wenn Trainingsdaten und lokale Kontrolle zentral sind.
- [Runway](/tools/runway/): Gehostete Kreativplattform für breitere Videoerstellung und -bearbeitung, wenn Teamkomfort wichtiger ist als lokale Modellkontrolle.
- [Pika](/tools/pika/): Cloud-orientiertes Video-Tool für kurze generative Experimente, nicht als Ersatz für DeepFaceLabs manuellen Trainingsprozess.

## FAQ

**Ist DeepFaceLab noch aktiv gepflegt?**

Nein. Das offizielle GitHub-Repository ist seit dem 13. November 2024 archiviert und read-only. Releases, Treiber und Abhängigkeiten sollten deshalb vor einem Pilot geprüft und für die eigene Umgebung eingefroren werden.

**Brauche ich eine starke GPU?**

Für einen praktikablen Trainingsablauf ist GPU-Hardware mit passender Umgebung wichtig. Der konkrete Bedarf hängt von Modell, Auflösung und Material ab; die README nennt CUDA-nahe Komponenten, garantiert aber keine aktuelle Kompatibilität mit beliebiger Hardware.

**Darf ich beliebige Gesichter oder Filme verwenden?**

Nein. Softwarelizenz und Medienrechte sind getrennte Fragen. Einwilligung, Rechte an Quell- und Zielmaterial, Zweck, Kennzeichnung und lokale Rechtslage müssen vor der Verarbeitung geklärt sein.

**Verarbeitet DeepFaceLab Daten automatisch in der Cloud?**

Die Software ist als lokal auszuführende Codebasis veröffentlicht. Trotzdem können Downloads, externe Installationsquellen oder eigene Backups Daten und Risiken außerhalb des Rechners einführen; prüfe die konkrete Umgebung und erteile keine unnötigen Netzwerk- oder Dateirechte.

**Wann ist eine Alternative vernünftiger?**

Wenn du Live-Effekte, eine einfache App, breite Video-Generierung oder aktive Produktpflege brauchst. DeepFaceLab lohnt sich nur, wenn lokales Training, manuelle Kontrolle und ein dokumentierter Governance-Prozess wichtiger sind als Bedienkomfort und aktueller Support.
