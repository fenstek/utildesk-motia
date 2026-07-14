---
slug: google-cloud-functions
title: Google Cloud Functions
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Redaktion"
editorial_reviewed_at: 2026-07-14
editorial_status: "manual_polished"
editorial_batch: "2026-07-14-optiplex-editorial-50"
category: Entwickler-Tools
price_model: Nutzungsbasiert
tags: [serverless, cloud, developer-tools, api]
official_url: "https://cloud.google.com/functions"
description: "Serverless-Funktionen für HTTP- und ereignisgetriebene Backends, deren Build-, IAM-, Event- und Cloud-Run-Betrieb bewusst eingerichtet werden muss."
popularity: 0
tier: D
generated_at: 2026-05-18
updated_at: 2026-07-14
---
# Google Cloud Functions

Google Cloud Functions ist Googles Funktionsmodell für kleine HTTP- und ereignisgetriebene Backends. In der aktuellen Generation heißt der Dienst Cloud Run functions: Quellcode wird gebaut, als Container abgelegt und als Cloud-Run-Service betrieben. Das nimmt Serverpflege ab, macht aber weder Architektur noch Verantwortung unsichtbar. Für jede Funktion braucht es einen klaren Auslöser, einen Einstiegspunkt, ein Berechtigungsmodell und einen Plan für Fehler, Wiederholungen und Kosten.

## Was ist Google Cloud Functions und für wen?

Der Dienst passt zu Entwicklerteams, die eine einzelne Reaktion sauber aus einem größeren System herauslösen wollen: etwa eine HTTP-API, eine Pub/Sub-Verarbeitung, eine Reaktion auf Cloud Storage oder eine Firestore-Verarbeitung. Eventarc vermittelt ereignisgetriebene Auslöser; HTTP-Funktionen können außerdem von Workflows, Cloud Scheduler, Cloud Tasks oder Pub/Sub-Push aufgerufen werden. Für ein dauerhaft laufendes, stark individuell konfiguriertes Backend ist Cloud Run als direkter Containerdienst oft die klarere Wahl.

## Welche Bausteine gehören zum Betrieb?

Zum Quellcode kommen Runtime und Functions Framework, Entry Point, Region, Trigger, Dienstkonto und Ressourcenlimits. Beim Deployment übernimmt Cloud Build die Containerisierung; das Artefakt landet in Artifact Registry und wird als Cloud-Run-Service gestartet. Die Cloud Functions-v2-API und `gcloud functions` bleiben für bestehende Workflows relevant, während Google für neue Cloud-Run-Funktionen auch die Cloud-Run-Admin-API dokumentiert. Diese Unterscheidung sollte im Repository und in Terraform festgehalten werden, damit nicht zwei Verwaltungswege konkurrieren.

## Ein praktikabler Workflow

Zuerst wird ein einziger Geschäftsvorgang gewählt, zum Beispiel das Validieren einer hochgeladenen Datei. Das Team definiert Eingabeformat, idempotente Verarbeitung, Antwort oder Ack, Retry-Verhalten und einen Dead-Letter-Pfad. Danach folgen lokaler Test mit dem passenden Functions Framework, ein reproduzierbarer Build und ein Deployment in eine isolierte Region. Erst wenn strukturierte Logs, Fehler-Metriken und ein Testevent sichtbar sind, wird der Trigger an produktive Daten gebunden. Bei Eventarc muss man außerdem einplanen, dass eine neue Trigger-Verbindung nicht zwangsläufig sofort aktiv ist.

## Integration und tägliche Wartung

Cloud Functions ist selten allein: Pub/Sub transportiert Nachrichten, Cloud Storage oder Firestore liefern Ereignisse, Secret Manager hält Konfiguration und Cloud Logging/Monitoring zeigen Ausführung und Fehler. Jeder Aufruf sollte eine Korrelation oder Event-ID protokollieren, ohne Tokens oder personenbezogene Nutzdaten zu loggen. Wiederholungen müssen fachlich sicher sein; ein nicht idempotenter Schreibvorgang kann durch einen transienten Fehler doppelte Wirkung erzeugen. Für Releases gehören Tests, Rollback- oder Traffic-Strategie, Runtime-Support und Abhängigkeitsscans in dieselbe Pipeline wie der Code.

## Grenzen und Qualitätsprüfung

Cold Starts, parallele Requests, Timeout, Region und maximale Instanzzahl beeinflussen die reale Latenz. In Cloud Run functions kann eine Instanz mehrere Requests parallel bedienen; ungeschützter globaler Zustand oder nicht threadsichere Bibliotheken sind deshalb ein Prüfpunkt. Ein gutes Evaluation-Set misst nicht nur die Erfolgsquote, sondern auch p95-Latenz, Fehlerrate, Retry-Anteil, Nachrichtenrückstau und Kosten pro Geschäftsvorgang. Für lange Jobs, dauerhaft laufende Prozesse oder komplexe Netzwerk- und Containeranforderungen sollte das Team gegen Cloud Run, Jobs oder eine andere Plattform testen.

## Sicherheit, Datenschutz und Governance

HTTP-Funktionen verlangen standardmäßig Authentifizierung, sofern der Zugriff nicht ausdrücklich öffentlich gemacht wird. IAM-Rollen, insbesondere die Invoker-Berechtigung, gehören auf die konkrete Funktion beziehungsweise den Service und nicht pauschal auf das Projekt. Build- und Laufzeitdienstkonten sollten getrennt und mit den kleinsten nötigen Rechten ausgestattet werden. Quellcode, temporäre Uploads, Container-Images, Logs und externe APIs bilden unterschiedliche Datenpfade; Aufbewahrung, Region, Verschlüsselung, VPC-Ausleitung und Secret-Zugriff müssen zur Datenschutzklassifizierung passen. Google schützt die Plattform, aber das Team bleibt für Authentifizierung, Eingabevalidierung, Abhängigkeiten und Datenminimierung verantwortlich.

## Preis und laufende Kosten

Das Modell ist nutzungsbasiert. Je nach Generation und Konfiguration zählen Invocations, CPU-/Speicherzeit, Mindestinstanzen, Netzwerkverkehr und abhängige Dienste. Zusätzlich können Cloud Build, Artifact Registry, Cloud Storage für Quellen, Logging, Eventarc, Pub/Sub und VPC-Konnektoren Kosten erzeugen. Ein Freikontingent ist kein Beweis für kostenlose Produktion und setzt ein verknüpftes Billing-Konto voraus. Vor dem Rollout sollte ein realistisches Lastprofil in Googles Pricing Calculator mit Region, Laufzeit, Parallelität, Retries und Datenverkehr gerechnet werden; Budgets und Alarme gehören zum Projekt, nicht erst zur Rechnungskontrolle.

## Redaktionelle Einschätzung

Google Cloud Functions ist für Teams empfehlenswert, die bereits Google Cloud betreiben und kurze, klar abgegrenzte Reaktionen mit wenig Infrastrukturaufwand brauchen. Wert entsteht, wenn Trigger, Zuständigkeit, Wiederholbarkeit und Kosten pro Vorgang messbar sind. Für ein lang laufendes Backend, hohe Containerkontrolle, lokale Ausführung oder eine bewusst portable Plattform ist eine engere Alternative sinnvoller. Unser Urteil: als kleine Integrations- und Eventschicht überzeugend, als pauschale Architektur für jedes Backend zu grob.

## Alternativen

- [AWS Lambda](/tools/aws-lambda/): Naheliegende Wahl für ereignisgetriebene Funktionen im AWS-Ökosystem oder bei bestehender IAM-, EventBridge- und Deployment-Infrastruktur.
- [Azure Functions](/tools/azure-functions/): Passt besser zu Teams, die Azure, Microsoft Entra ID und Azure-Servicebus bereits als Betriebsumgebung einsetzen.
- [OpenFaaS](/tools/openfaas/): Interessant, wenn Funktionen auf eigener Kubernetes-Infrastruktur laufen und Portabilität wichtiger ist als ein vollständig verwalteter Cloud-Dienst.
- [AWS AppSync](/tools/aws-appsync/): Für ein verwaltetes GraphQL-API mit Resolvern und Datenquellen passender als selbst zusammengesetzte HTTP-Funktionen.
- [Firebase Realtime Database](/tools/firebase-realtime-database/): Für synchronisierte Clientdaten und einfache Firebase-nahe Anwendungen direkter, aber kein allgemeiner Ersatz für Backend-Funktionen.

## FAQ

**Ist Google Cloud Functions noch der aktuelle Produktname?**

Google verwendet für die moderne Generation den Namen Cloud Run functions. Cloud Functions (2nd gen) und die Cloud Functions-v2-API bleiben in Dokumentation und bestehenden Deployments sichtbar. Bei einer neuen Architektur sollte festgehalten werden, ob die Funktion über die Cloud-Run- oder die kompatible Cloud-Functions-Schnittstelle verwaltet wird.

**Wann sollte eine Funktion nicht öffentlich erreichbar sein?**

Immer dann, wenn ein interner Aufrufer genügt oder die Funktion Daten verändert. Standardmäßig ist Authentifizierung vorgesehen; öffentliche Endpunkte brauchen zusätzlich Rate-Limits, Eingabevalidierung und eine bewusste Begründung. Ein Trigger aus Pub/Sub, Scheduler oder Workflows vermeidet oft einen unnötig offenen HTTP-Endpunkt.

**Wie verhindere ich doppelte Verarbeitung bei Retries?**

Behandle Events mit einer stabilen ID und mache Schreiboperationen idempotent. Speichere den Verarbeitungsstatus an einer Stelle mit passender Transaktions- oder Deduplikationslogik und route dauerhaft fehlerhafte Nachrichten in einen Dead-Letter-Pfad. Ein Retry-Schalter allein löst keine fachliche Duplikatfrage.

**Welche Kosten muss ich vor dem Go-live testen?**

Neben Ausführungszeit und Speicher gehören Aufrufe, Mindestinstanzen, Netzwerk, Build, Image-Speicher, Logs, Eventarc, Pub/Sub und VPC-Konnektoren in die Rechnung. Teste Normal- und Spitzenlast mit realistischen Retries und prüfe die Abrechnung pro Geschäftsfall statt nur pro Request.

**Ist Cloud Run die bessere Wahl für einen eigenen Container?**

Oft ja, wenn das Team einen Container, Startprozess, Laufzeitverhalten, Parallelität oder Netzwerkzugriff selbst bestimmen muss. Cloud Run functions bleibt bequemer, wenn der Einstiegspunkt und die Event-Anbindung im Mittelpunkt stehen und der zusätzliche Containerbetrieb keinen Nutzen bringt.
