---
slug: amazon-rekognition-video
title: Amazon Rekognition Video
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Redaktion"
editorial_reviewed_at: 2026-07-13
editorial_status: "manual_polished"
editorial_batch: "2026-07-13-full-tool-card-editorial"
category: "Audio & Video"
price_model: Nutzungsbasiert
tags: [video, workflow]
official_url: "https://aws.amazon.com/rekognition/video-features/"
popularity: 0
tier: "C"
generated_at: "2026-05-14"
description: "Cloud-API von AWS für zeitcodierte Videoanalyse, Labels, Text, Gesichter und Moderation mit S3- und Ereignis-Workflows."
updated_at: 2026-07-13
lastReviewed: 2026-07-13
---
# Amazon Rekognition Video

Amazon Rekognition Video ist der Video-Teil der AWS-Computer-Vision-APIs. Der Dienst analysiert gespeicherte Videos aus Amazon S3 und liefert zeitcodierte Ergebnisse zu Labels, Szenenwechseln, Text, Gesichtern, Personen, Prominenten und moderationsrelevanten Inhalten. Für neue Projekte ist der realistische Kern ein asynchroner Batch-Workflow: Video ablegen, Analysejob starten, Abschluss über SNS/SQS oder Lambda empfangen und Ergebnisse über eine Get-API abholen. Das ist etwas anderes als eine fertige Videoverwaltung oder ein automatisch verlässlicher Echtzeitwächter.

## Für wen ist Amazon Rekognition Video geeignet?

Geeignet ist der Dienst für Entwickler- und Plattformteams, die bereits mit S3, IAM und AWS-Ereignisdiensten arbeiten und wiederkehrende Videoanalyse in eine eigene Anwendung einbetten möchten. Medienarchive können Clips verschlagworten, Plattformen können Moderations-Queues vorsortieren und interne Suchoberflächen können Treffer mit Zeitstempeln verlinken.

Weniger passend ist Amazon Rekognition Video für ein Redaktionsteam, das ohne AWS-Konto, Datenpipeline und eigene Oberfläche sofort loslegen möchte. Auch eine Entscheidung über Personen, Zutritt oder Rechtsverstöße sollte nicht allein aus einem Modelltreffer entstehen.

<figure class="tool-editorial-figure">
  <img src="/images/tools/amazon-rekognition-video-editorial.webp" alt="Filmstreifen mit zeitcodierten Erkennungsmarkern für die Prüfung von Videomaterial" loading="lazy" decoding="async" />
</figure>

## Welche Analyse liefert der Dienst?

Bei gespeicherten Videos stehen getrennte Start- und Get-Operationen zur Verfügung. Labels markieren erkannte Objekte, Konzepte und Aktivitäten; Segment Detection erkennt technische und inhaltliche Abschnitte; Text Detection liest Text aus Frames. Weitere Jobs betreffen Gesichter, Prominentenerkennung, Personenverfolgung, Face Search und die Erkennung suggestiver oder expliziter Inhalte.

Die Antwort ist kein fertiger Bericht, sondern strukturierte Metadaten mit Zeitstempeln, Konfidenzen und je nach Operation Bounding Boxes oder Tracking-Informationen. Wer daraus Suche, Thumbnail-Marker oder eine Moderations-Queue baut, muss die Ergebnisse selbst speichern, versionieren und in der Oberfläche verständlich machen.

## Typische Einsatzszenarien

- **Archivsuche:** S3-Videos nach Labels oder Text durchsuchen und Treffer auf eine Stelle im Originalclip verlinken.
- **Moderationsvorsortierung:** riskante Ausschnitte markieren und nur diese an ein menschliches Review-Team geben, statt automatische Treffer direkt zu veröffentlichen.
- **Produkt- und Markenmonitoring:** wiederkehrende Aufnahmen nach Objekten, Szenen oder eingeblendeten Begriffen filtern.
- **Gesichtssuche mit hoher Hürde:** bekannte Gesichter in einem kontrollierten Bestand suchen, aber nur mit klarer Rechtsgrundlage, Zweckbindung und menschlicher Prüfung.

## Wie sieht ein belastbarer Workflow aus?

Ein kleiner Pilot beginnt mit einem S3-Eingang, eindeutigen Objekt- und Job-IDs sowie zwei oder drei echten Videotypen. Der Startjob setzt nur die benötigten Features; SNS meldet den Abschluss, SQS puffert Spitzen und Lambda oder ein Worker schreibt die paginierten Get-Ergebnisse in eine eigene Datenbank. Danach werden Zeitstempel, Konfidenzschwellen, Fehlerraten und manuelle Korrekturen ausgewertet.

Für Produktion gehören Wiederholungen, Idempotenz, Dead-Letter-Handling und ein nachvollziehbarer Bezug zwischen Original, Modellversion und Ergebnis dazu. Ein Ergebnis darf eine Suche verbessern oder eine Prüfung priorisieren; es sollte nicht ohne Review eine Person sanktionieren oder einen Inhalt endgültig freigeben.

## Grenzen und Kontrollpunkte

Amazon Rekognition Video versteht nicht automatisch den Kontext einer Szene, Ironie, Einwilligung oder den rechtlichen Status eines Clips. Schwaches Licht, Verdeckung, Kamerawinkel, Kompression und ungewöhnliche Objekte können Treffer und Konfidenzen beeinflussen. Deshalb braucht jede produktive Nutzung einen repräsentativen Testbestand, Fehlersamples und einen definierten Eskalationsweg.

Der Streaming-Pfad über Kinesis Video Streams ist kein pauschales Versprechen für Live-Analyse: AWS kennzeichnet Streaming Video und Bulk Image Analysis als für neue Kunden nicht verfügbar. Außerdem wurde People Pathing zum 31. Oktober 2025 abgekündigt. Vor einer Architekturentscheidung muss die konkrete Region, API-Funktion und Kontoberechtigung geprüft werden.

## Datenschutz, Sicherheit und Betrieb

Videos aus Kunden-, Mitarbeiter- oder Überwachungskontexten können personenbezogene oder biometrische Daten enthalten. Vor dem Upload gehören Zweck, Einwilligung oder andere Rechtsgrundlage, Aufbewahrung, Löschung, Region, Verschlüsselung, Zugriff über IAM und Protokollierung in ein Datenflussdiagramm. Face Collections sind kein neutrales Adressbuch, sondern ein besonders sensibler Bestand.

S3-Buckets sollten nicht öffentlich sein; Rollen für Rekognition, SNS, SQS, Lambda und Ergebnisdaten gehören getrennt und minimal berechtigt. Für Moderation muss klar sein, wer Fehlalarme entscheidet. AWS-Sicherheitsfunktionen ersetzen weder eine Datenschutzprüfung noch die fachliche Abnahme der Erkennungsqualität.

## Preise und laufende Kosten

Abgerechnet wird nutzungsbasiert. Bei Stored Video zählt die erfolgreich verarbeitete Videodauer je verwendeter Analyseoperation; mehrere APIs auf demselben Material können daher mehrfach Kosten auslösen. Hinzu kommen S3, SNS, SQS, Lambda, Kinesis Video Streams, Datenübertragung und gegebenenfalls die Speicherung von Face-Metadaten. Das kostenlose Kontingent und konkrete Minutenpreise ändern sich nach Konto, Region und Feature und sollten vor dem Rollout in der AWS-Preisseite oder im Pricing Calculator nachgerechnet werden.

## Redaktionelle Einschätzung

Amazon Rekognition Video ist eine brauchbare Baustein-API für AWS-Teams mit klarer Datenpipeline, nicht die fertige Lösung für Video-Redaktion oder Überwachung. Wir empfehlen es, wenn zeitcodierte Metadaten, S3-Nähe und skalierbare Jobs wichtiger sind als eine sofort nutzbare Oberfläche. Wer Sprache transkribieren, Videos schneiden oder lokal arbeiten möchte, sollte gezielt eine andere Karte vergleichen. Für biometrische Anwendungsfälle ist ein kontrollierter, kleiner Pilot mit menschlicher Prüfung die Mindestvoraussetzung.

## Alternativen

- [Google Cloud Video Intelligence](/tools/google-cloud-video-intelligence/): naheliegend, wenn Videoanalyse, Shot-Erkennung und gesprochene Inhalte in Google Cloud zusammengehören.
- [Clarifai Video Recognition](/tools/clarifai-video-recognition/): interessant, wenn eigene Modelle und eine anbieterunabhängigere API-Schicht wichtiger sind als tiefe AWS-Integration.
- [IBM Watson Video Analytics](/tools/ibm-watson-video-analytics/): eher für überwachte Betriebs- und Sicherheitsfälle mit Ereignislogik und Dashboards.
- [Amazon Rekognition](/tools/amazon-rekognition/): passend für Bildanalyse und Face-Workflows, wenn kein zeitcodierter Videojob benötigt wird.
- [OpenCV](/tools/opencv/): sinnvoll, wenn Verarbeitung lokal kontrolliert und die eigene Engineering-Leistung höher als der Wunsch nach einem Managed Service ist.

## FAQ

**Ist Amazon Rekognition Video eine fertige Oberfläche für Redaktionen?**

Nein. Es ist primär eine API. Suche, Review-Ansicht, Berechtigungen, Ergebnisdatenbank und Freigabeprozess müssen im eigenen System entstehen.

**Wie funktioniert die Analyse gespeicherter Videos?**

Das Video liegt in S3. Ein Startjob erzeugt eine Job-ID, der Abschluss wird typischerweise über SNS an SQS oder Lambda gemeldet, und die Ergebnisse werden mit der passenden Get-Operation seitenweise abgeholt.

**Kann der Dienst Audio oder Sprache transkribieren?**

Amazon Rekognition Video analysiert visuelle Merkmale und Text im Bild. Für gesprochene Sprache ist ein eigener Transkriptionsdienst wie Amazon Transcribe erforderlich.

**Darf ein Treffer automatisch über eine Person entscheiden?**

Das sollte nicht der Standard sein. Bei Gesichtern, biometrischen Daten und sicherheitsrelevanten Entscheidungen braucht es Rechtsgrundlage, Schwellenwerttests, menschliche Prüfung und dokumentierte Fehlerszenarien.

**Wie sollte ein erster Pilot aussehen?**

Nimm einen begrenzten, repräsentativen S3-Bestand, aktiviere nur ein Feature, messe Treffer und Fehlalarme gegen manuelle Labels und rechne alle AWS-Nebenkosten mit. Erst danach lohnt die Entscheidung über Automatisierung und Skalierung.
