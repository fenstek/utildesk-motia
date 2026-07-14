---
slug: aws-lambda
title: AWS Lambda
editorial_reviewed: true
editorial_reviewed_by: Utildesk manual editorial pass
editorial_reviewed_at: 2026-07-13
editorial_status: manual_polished
editorial_batch: 2026-07-13-full-editorial-coverage
lastReviewed: 2026-07-13
category: Entwickler-Tools
price_model: Nutzungsbasiert
tags: [serverless, cloud, developer-tools, api]
official_url: "https://aws.amazon.com/lambda/"
popularity: 0
tier: D
generated_at: 2026-05-18
---
# AWS Lambda

AWS Lambda führt Code als Reaktion auf API-Aufrufe oder Ereignisse aus, ohne dass ein Team Server bereitstellen oder patchen muss. Typische Trigger sind API Gateway, S3, SQS und EventBridge. Jede Invocation einer Lambda Function läuft unabhängig; horizontale Skalierung ist verwaltet, gemeinsamer Zustand darf aber nicht vorausgesetzt werden.

<figure class="tool-editorial-figure">
  <img src="/images/tools/aws-lambda-editorial.webp" alt="Kinetisches Papiertheater aus Ereignissen und kurzlebigen Funktionen" loading="lazy" decoding="async" />
</figure>

## Wann Lambda passt

Lambda passt zu klar abgegrenzten Backends, Webhooks, Dateiverarbeitung, zeitgesteuerter Automatisierung und Event-Handlern. Es passt schlecht zu Prozessen, die dauerhaft offene Verbindungen, lokale Langzeitdaten oder mehr als 15 Minuten ununterbrochene Laufzeit verlangen. Dafür braucht es andere Compute-Modelle oder einen orchestrierten Workflow.

## Ein Ereignis sauber verarbeiten

Behandeln Sie jedes Event als potentiell doppelt, verspätet oder fehlerhaft. Der Handler validiert Eingaben, schreibt mit einem idempotenten Schlüssel und erzeugt nachvollziehbare Logs mit Request-ID. Bei asynchronen Wegen müssen Retry-Strategie, maximale Versuche und ein Ziel für nicht verarbeitbare Nachrichten vor dem Produktivstart feststehen. Eine Dead-Letter-Queue ohne verantwortliche Person ist nur ein späterer Fehlerstapel.

Testen Sie zuerst einen Pfad Ende zu Ende: Event, Berechtigung, Funktion, Datenbankeffekt, Alarm und Wiederholung. Danach simulieren Sie Timeouts, ein doppeltes Event und eine nicht erreichbare Abhängigkeit. Die wichtigste Lambda-Arbeit liegt an diesen Grenzen, nicht in der kleinen Handler-Funktion.

## Rechte, Netzwerk und Geheimnisse

Jede Funktion erhält eine eigene IAM-Rolle mit den minimal nötigen Aktionen und Ressourcen. Trennen Sie Upload-Handler, Rechnungslogik und Admin-Aufgaben. Geheimnisse gehören in einen geeigneten Secret-Dienst, nicht in Quellcode oder Umgebungsvariablen in Screenshots. VPC-Anbindung nur dann einsetzen, wenn der Zugriff auf private Ressourcen sie wirklich verlangt; sie ist keine pauschale Sicherheitsdekoration.

## Performance und Kosten

Lambda Functions werden pro Request und Laufzeit in GB-Sekunden abgerechnet; Speicher beeinflusst auch verfügbare CPU. Kosten entstehen zusätzlich durch Trigger, Datenübertragung, Logs, Queues und Downstream-Dienste. Messen Sie daher Kosten pro erledigtem Geschäftsvorgang. Warm wiederverwendete Umgebungen können Startzeit senken, aber lokaler Speicher oder Memory-State dürfen nicht als persistent gelten.

AWS bietet neben Functions auch MicroVMs für isolierte, länger lebende Einzelumgebungen und Durable Functions für mehrschrittige, unterbrechbare Abläufe. Das sind andere Muster, keine Ausrede, jede Anwendung in eine Function zu pressen.

## Redaktionelle Einschätzung

Lambda ist hervorragend für kleine, klar verantwortete Ereignisbausteine. Es wird gefährlich, wenn ein Team daraus unbemerkt ein verteiltes System ohne Tracing, Idempotenz und Ownership baut. Wir empfehlen einen Pilot mit einem echten Event und einer sichtbaren Fehlerschleife, erst dann weitere Trigger und Integrationen.

## Alternativen

- [Azure Functions](/tools/azure-functions/) ist die nahe Wahl im Azure-Ökosystem.
- [Google Cloud Functions](/tools/google-cloud-functions/) passt zu Google-Cloud-Workloads.
- [Cloudflare Workers](/tools/cloudflare-workers/) eignet sich für Edge-nahe Weblogik.
- [AWS Step Functions](/tools/aws-step-functions/) orchestriert mehrstufige Abläufe besser als eine einzige lange Function.
- [Vercel](/tools/vercel/) ist für Frontend-nahe Web-Deployments oft direkter.

## FAQ

**Wie lange darf eine Lambda Function laufen?**
Eine einzelne Invocation kann bis zu 15 Minuten laufen.

**Kann ein Event doppelt verarbeitet werden?**
Ja. Handler müssen idempotent sein und Wiederholungen explizit behandeln.

**Warum werden Kosten überraschend hoch?**
Nicht nur Requests zählen: Laufzeit, Speicher, Logs, Datenverkehr, Retries und nachgelagerte AWS-Dienste summieren sich.

**Braucht jede Function eine eigene IAM-Rolle?**
In der Regel ja. Kleine, getrennte Rollen begrenzen Schaden und machen Rechte prüfbar.
