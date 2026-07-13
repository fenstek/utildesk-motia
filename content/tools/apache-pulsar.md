---
slug: apache-pulsar
title: Apache Pulsar
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Redaktion"
editorial_reviewed_at: 2026-07-13
editorial_status: "manual_polished"
editorial_batch: "2026-07-13-full-tool-card-editorial"
category: "Entwickler-Tools"
price_model: Open Source
tags: [messaging,data,developer-tools,open-source]
official_url: "https://pulsar.apache.org/"
description: "Apache Pulsar ist eine Open-Source-Plattform für Messaging und Event-Streaming mit Tenants, langlebiger Speicherung und optionaler Replikation zwischen Clustern."
popularity: 0
tier: "C"
generated_at: "2026-05-14"
updated_at: 2026-07-13
lastReviewed: 2026-07-13
---
# Apache Pulsar

Apache Pulsar ist ein verteiltes Messaging- und Event-Streaming-System für Teams, die Produzenten, Konsumenten und Datenflüsse über mehrere Anwendungen oder Regionen betreiben müssen. Der entscheidende Unterschied zu einem kleinen Queue-Dienst: Pulsar trennt Broker und persistente Speicherung, organisiert Zugriff über Tenants und Namespaces und bringt Themen wie Backlog, Replikation und mehrere Subscription-Typen in eine gemeinsame Plattform. Das ist sinnvoll, wenn diese Betriebsanforderungen real sind; für eine einzelne interne Warteschlange ist der Cluster meist unnötig komplex.

## Für wen ist Pulsar geeignet?

Pulsar passt zu Plattform-, Daten- und Backend-Teams, die Event-Verträge, Zuständigkeiten und Wiederanlauf nicht in jeder Anwendung neu bauen wollen. Typische Kandidaten sind Produktkataloge, Bestell- und Zahlungsereignisse, Telemetrie, CDC-Pipelines oder mandantenfähige SaaS-Systeme. Es hilft, wenn mehrere Consumer denselben Ereignisstrom unabhängig lesen, alte Nachrichten für einen definierten Zeitraum nachholen oder Daten zwischen Clustern replizieren müssen.

Nicht automatisch passend ist Pulsar für ein kleines Projekt ohne Bereitschaft für verteilten Betrieb. Die Plattform ersetzt weder ein fachliches Schema- und Ownership-Modell noch ein Observability-Konzept. Wer nur einen Worker zuverlässig aus einer Queue versorgen will, sollte zuerst eine kleinere Alternative vergleichen.

<figure class="tool-editorial-figure">
  <img src="/images/tools/apache-pulsar-editorial.webp" alt="Leuchtende Nachrichtenkapseln bewegen sich auf getrennten Pulsar-Bahnen zwischen Speicher und Konsumenten" loading="lazy" decoding="async" />
</figure>

## Die Komponenten im Arbeitsfluss

Ein Producer schreibt auf ein Topic. Ein Broker nimmt die Verbindung an, vermittelt Topic-Zugriff und verteilt Nachrichten an Consumer. Persistente Daten liegen in Apache BookKeeper; ein Metadata Store hält unter anderem Cluster-, Topic- und Namespace-Informationen. Diese Trennung erlaubt es, Broker und Speicher getrennt zu planen, bringt aber auch mehrere Betriebsflächen mit sich.

Tenants und Namespaces bilden die organisatorische Grenze für Berechtigungen, Quoten und Policies. Subscription-Typ und Cursor bestimmen, ob mehrere Consumer konkurrierend arbeiten oder jeweils eine eigene Sicht auf den Strom behalten. Schemas, Retention und Backlog-Regeln gehören deshalb zum Event-Vertrag und nicht nur in die Client-Konfiguration.

## Praktischer Einführungs-Workflow

1. Wähle ein abgegrenztes Ereignis, etwa `order.created`, und dokumentiere Owner, Schema, Schlüssel, erwartete Reihenfolge und Aufbewahrung.
2. Starte mit einem Test-Cluster und einem echten Producer/Consumer-Paar. Prüfe Ack-Verhalten, Wiederholungen, Backlog-Aufbau und das Verhalten eines neu gestarteten Consumers.
3. Lege Tenant, Namespace, Rollen und Quoten fest, bevor weitere Teams Topics anlegen. Ein Namensschema verhindert später schwer auffindbare Datenströme.
4. Simuliere Broker-, Bookie- und Consumer-Ausfälle. Miss nicht nur Durchsatz, sondern Wiederanlaufzeit, Duplikate, Datenverlust und die Kosten des Nachholens.
5. Überführe erst dann in Produktion: mit Runbooks für Schemaänderungen, Backlog-Alarme, Zertifikatswechsel, Partitionierung und Rollback.

## Integration und täglicher Betrieb

Pulsar bietet offizielle Client-Bibliotheken unter anderem für Java, C++, Go, Python, Node.js und C#. Clients unterstützen Wiederverbindung, Acknowledgements und Transaktionen; letztere sind nützlich, wenn Erzeugung und Bestätigung über mehrere Topics atomar zusammengehören. Pulsar Functions und Pulsar IO können Berechnungen beziehungsweise Konnektoren näher am Messaging-System ausführen, ersetzen aber keine sauber getestete Datenpipeline.

Für den Betrieb müssen Team und Provider BookKeeper-Kapazität, Metadaten, Broker-Auslastung, Storage-Wachstum, Replikationslag und Consumer-Backlog beobachten. Geo-Replikation ist kein automatischer Business-Continuity-Plan: Regionen, Failover, Konflikte, RPO/RTO und Rückweg müssen separat getestet werden.

## Qualität und Entscheidungskriterien

Ein belastbarer Pilot verwendet Produktionsähnlichkeit statt synthetischer Erfolgsmeldungen. Prüfe mindestens Schema-Kompatibilität, Reihenfolge pro Schlüssel, Verhalten bei doppelter Zustellung, Lastspitzen, Consumer-Ausfall und das Nachholen eines wachsenden Backlogs. Halte Messwerte und Fehlermeldungen fest, damit die Entscheidung nicht von einer einzelnen Demo abhängt.

Pulsar ist die bessere Wahl, wenn mehrere unabhängige Subscription-Sichten, Namespace-Governance, persistente Speicherung und Cluster-übergreifende Replikation gemeinsam gebraucht werden. Fehlt dieser Bedarf, ist ein einfacherer Broker oft leichter zu betreiben und für das Team günstiger in Zeit und Risiko.

## Sicherheit, Datenschutz und Governance

Die offizielle Dokumentation weist darauf hin, dass Verschlüsselung, Authentication und Authorization nicht einfach als gegeben angenommen werden dürfen. Für produktive Umgebungen gehören TLS, ein zentral verwaltetes Rollenmodell, minimale Rechte auf Tenants und Namespaces sowie rotierbare Credentials zum Design. Proxy- und Broker-Rollen müssen getrennt geprüft werden.

Vor dem ersten Kundendatum klärt das Team, welche Payloads, Logs, Schemas und technischen Metadaten gespeichert oder repliziert werden. Retention, Backlog, Exporte und Replikationsziele können Daten länger oder in weiteren Regionen verfügbar machen. Unveränderliche Ereignisse sind kein Freibrief für personenbezogene Daten: Löschung, Zugriff, Verschlüsselung und fachliche Minimierung müssen mit Datenschutz und Security abgestimmt werden.

## Preis und reale Betriebskosten

Apache Pulsar ist Open Source. Kosten entstehen trotzdem durch Compute für Broker, Storage und I/O für BookKeeper, Metadaten- und Netzwerkressourcen, Monitoring, Backups, Replikation und Bereitschaft. Bei einem Managed Service kommen Provider-Preise und gegebenenfalls Datenverkehr oder Support hinzu. Vergleiche deshalb nicht nur den Preis pro Nachricht, sondern auch Clustergröße, Retention, Backlog, Regionen und den erwarteten Betriebsaufwand.

## Redaktionelle Einschätzung

Wir empfehlen Pulsar Plattform- und Datenteams, die mehrere Consumer-Sichten, klare Mandantengrenzen und langlebige Events wirklich betreiben müssen. Der Wert entsteht, wenn ein dokumentierter Event-Vertrag, ein verantwortliches Betriebsteam und getestete Recovery-Ziele vorhanden sind.

Für eine einzelne Queue, ein kleines Team ohne Streaming-Betrieb oder einen kurzfristigen Integrationsjob würden wir zuerst RabbitMQ oder NATS prüfen. Pulsar ist dann die richtige Entscheidung, wenn der Pilot nachweisbar Backlog-, Replikations- und Governance-Anforderungen löst, ohne dass die zusätzliche Infrastruktur den Nutzen übersteigt.

## Alternativen

- [Apache Kafka](/tools/apache-kafka/): Breites Streaming-Ökosystem und ein naheliegender Vergleich, wenn Kafka-Kompatibilität, Connectors und vorhandene Expertise wichtiger sind als Pulsars Trennung von Broker und Storage.
- [Redpanda](/tools/redpanda/): Kafka-kompatible Streaming-Plattform mit schlankerem Betriebsmodell, wenn ein Team den Kafka-API-Ansatz möchte, aber weniger verteilte Komponenten verwalten will.
- [RabbitMQ](/tools/rabbitmq/): Klassischer Message Broker für Routing, Work Queues und Request/Reply, wenn robuste Zustellung wichtiger ist als ein langfristiger Event-Streaming-Backbone.
- [NATS](/tools/nats/): Leichter Messaging-Baustein für schnelle Service-Kommunikation, wenn niedrige Betriebskomplexität und einfache Subjects im Vordergrund stehen.

## FAQ

**Ist Apache Pulsar eine klassische Queue oder eine Streaming-Plattform?**

Beides ist möglich: Consumer können konkurrierend eine Arbeitslast teilen, oder mehrere Subscriptions lesen denselben Topic unabhängig. Die passende Wahl hängt von Subscription-Modell, Retention und Event-Vertrag ab.

**Brauche ich BookKeeper und einen Metadata Store?**

Für einen verteilten Pulsar-Cluster gehören persistenter Speicher und Metadatenverwaltung zur Architektur. Ein lokaler Test kann einfacher aussehen, ist aber kein Beleg für die Produktionsdimensionierung.

**Ist Geo-Replikation automatisch Disaster Recovery?**

Nein. Replikation überträgt Daten zwischen Clustern, aber Failover, Berechtigungen, RPO/RTO, Konflikte und der Rückweg brauchen eigene Runbooks und Tests.

**Ist Pulsar kostenlos?**

Die Software ist Open Source. Infrastruktur, Storage, Netzwerk, Betrieb, Support und ein Managed Service verursachen dennoch Kosten, die von Nutzung und Architektur abhängen.
