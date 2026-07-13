---
slug: apache-kafka
title: Apache Kafka
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Redaktion"
editorial_reviewed_at: 2026-07-13
editorial_status: "manual_polished"
editorial_batch: "2026-07-13-apache-kafka-full-tool-card-editorial"
category: "AI Coding"
price_model: Open Source
tags: [data, streaming, open-source, developer-tools]
official_url: "https://kafka.apache.org/"
description: "Open-Source-Plattform für Event-Streaming: Apache Kafka verbindet Produzenten, Consumer und Datenpipelines über dauerhaft gespeicherte Topics."
popularity: 0
tier: "C"
generated_at: "2026-05-14"
updated_at: 2026-07-13
lastReviewed: 2026-07-13
---
# Apache Kafka

Apache Kafka ist eine Open-Source-Plattform für Event-Streaming. Anwendungen schreiben Ereignisse als Producer in Topics; Consumer lesen sie über Consumer Groups wieder aus. Das passt zu Systemen, in denen Daten nicht nur einmal zugestellt, sondern für mehrere nachgelagerte Prozesse verfügbar bleiben sollen. Kafka ist damit eher eine betreibbare Dateninfrastruktur als ein fertiger Analyse- oder Message-Queue-Dienst.

## Für wen ist Kafka geeignet?

Kafka richtet sich an Plattformteams, Backend- und Data Engineers, die Ereignisse aus Anwendungen, Datenbanken, Geräten oder Logs zuverlässig verteilen und verarbeiten müssen. Ein typischer Anlass ist ein System, in dem mehrere unabhängige Abnehmer dieselben Geschäftsvorfälle benötigen: etwa Bestellungen für Abrechnung, Betrugserkennung und Lagerbestand. Für ein kleines Projekt mit wenigen asynchronen Jobs ist Kafka dagegen oft mehr Infrastruktur, als der Prozess braucht.

<figure class="tool-editorial-figure">
  <img src="/images/tools/apache-kafka-editorial.webp" alt="Illustration zu Apache Kafka: Nachrichtenkapseln fahren zwischen Producer-Docks und Consumer-Häfen" loading="lazy" decoding="async" />
</figure>

## Wie funktioniert das Grundmodell?

Ein Topic ist ein benannter Event-Stream. Topics werden in Partitionen aufgeteilt; innerhalb einer Partition bleibt die Reihenfolge erhalten, über mehrere Partitionen hinweg gibt es keine globale Reihenfolge. Producer wählen Topic und Schlüssel, Consumer lesen mit Offsets. Eine Consumer Group verteilt Partitionen auf ihre Instanzen, während verschiedene Groups denselben Stream unabhängig voneinander lesen können. Replikation und konfigurierbare Aufbewahrung machen den Log später erneut lesbar, löschen aber keine fachlichen Fehler automatisch.

## Praktische Einsatzszenarien

- **Datenintegration:** Kafka Connect kann Änderungen aus einer Datenbank in Topics schreiben und Events in ein Zielsystem exportieren. So wird die Pipeline von der Anwendung entkoppelt.
- **Microservices:** Ein Bestellservice veröffentlicht `order.created`; Abrechnung, Versand und Benachrichtigung reagieren mit eigenen Consumer Groups. Jeder Dienst kann unabhängig skalieren und fehlerhafte Verarbeitung nachholen.
- **Telemetrie und Logs:** Viele Produzenten liefern Messwerte oder Logs an einen gemeinsamen Stream. Stream-Processing-Anwendungen verdichten die Daten, bevor sie in ein Dashboard oder einen Speicher gelangen.
- **Event-getriebene Produkte:** Ein Event-Log kann Änderungen an Kunden, Geräten oder Zahlungen nachvollziehbar an mehrere Funktionen verteilen. Dabei müssen Schema, Schlüssel und Wiederholbarkeit vorab festgelegt werden.

## Einführung in einen echten Workflow

Starten sollte ein Team mit einem begrenzten Stream, einem klaren Event-Schema und einem benannten Owner. Danach werden Partitionierungsschlüssel, Retention, Replikationsziel und Consumer Groups festgelegt. Ein sinnvoller Pilot enthält mindestens einen fehlerhaften Consumer: Er muss neu starten, seinen Offset kontrolliert verarbeiten und bei einer nicht mehr gültigen Nachricht in einen definierten Fehlerpfad gehen. Erst wenn Lag, Durchsatz, Wiederholungen und Speicherverbrauch beobachtbar sind, lohnt sich die Ausweitung auf weitere Topics.

## Betrieb, Grenzen und Sicherheit

Kafka bringt keine automatische fachliche Korrektheit. Reihenfolge gilt nur pro Partition; eine falsche Schlüsselwahl kann verwandte Events trennen. Retention, Backpressure, Schemaänderungen, Consumer-Lag und Rebalancing gehören deshalb in das Betriebsmodell. Selbstbetrieb verlangt zusätzlich Clusterplanung, Upgrades, Backups beziehungsweise Replikation und Bereitschaft für Broker- oder Netzwerkfehler. Kafka kann lokal, in Containern, on-premises oder über einen Managed Service laufen; bei einem Managed Service verschiebt sich der Aufwand zu Provider-, Netzwerk-, Quoten- und Datenresidenzentscheidungen.

Für sensible Daten sind Datenklassifizierung, Topic-Namenskonventionen, TLS, Authentifizierung und ACLs kein späteres Feintuning. Berechtigungen sollten Produzenten, Consumer und Administratoren getrennt behandeln. Retention und Löschkonzept müssen zum Inhalt des Streams passen: Ein dauerhaft reproduzierbarer Event-Log ist nicht automatisch mit jeder Datenschutz- oder Löschpflicht vereinbar. Vor dem Produktivbetrieb gehören außerdem Schema-Kompatibilität, Zugangsschlüssel, Audit-Logs und ein Wiederanlauf-Test in die Abnahme.

## Kosten und Aufwand

Die Apache-Kafka-Software ist Open Source. Das ist nicht gleichbedeutend mit kostenlosem Betrieb: Rechenleistung, SSD-Speicher, Netzwerk, Backups, Monitoring, On-Call und Plattformpflege bleiben beim Betreiber. Ein Managed-Angebot reduziert typischerweise den Clusterbetrieb, berechnet aber je nach Anbieter Ressourcen, Datenverkehr, Aufbewahrung und Support. Die realistische Kostenfrage lautet daher nicht nur „Wie viele Events pro Sekunde?“, sondern auch „Wie lange müssen sie verfügbar sein, wie viele Consumer lesen sie und wer reagiert nachts auf einen wachsenden Lag?“. Für einen kleinen Workflow mit kurzer Lebensdauer kann eine schlankere Queue oder ein verwalteter Ingestion-Dienst wirtschaftlicher sein.

## Redaktionelle Einschätzung

Apache Kafka empfehlen wir Teams, die mehrere Systeme dauerhaft über Event-Streams verbinden, Daten wieder abspielen oder unabhängig skalierende Consumer benötigen. Der Wert zeigt sich, wenn ein konkreter Datenfluss mit Messgrößen wie Consumer-Lag, Fehlerquote, Wiederanlaufzeit und Speicherbedarf betrieben wird.

Wir würden Kafka nicht als Standardantwort auf jede asynchrone Aufgabe einsetzen. Wenn ein Team nur einzelne Jobs verteilt, keine Plattformverantwortung hat oder eine globale Reihenfolge erwartet, ist eine passendere Alternative meist schneller und sicherer. Der faire Test ist ein kleiner produktionsnaher Stream mit absichtlich verzögertem Consumer, Schemaänderung und Wiederanlauf; besteht das Betriebsmodell diesen Test, ist Kafka eine belastbare Grundlage.

## Alternativen

- [RabbitMQ](/tools/rabbitmq/): Klassischer Message Broker für Routing, Queues und einzelne Zustellvorgänge, wenn kein dauerhaft wiederlesbarer Event-Log nötig ist.
- [Redpanda](/tools/redpanda/): Kafka-kompatibles Streaming mit Fokus auf weniger Infrastrukturaufwand, wenn vorhandene Kafka-Clients bleiben sollen.
- [Apache Pulsar](/tools/apache-pulsar/): Verteiltes Messaging und Streaming mit anderem Architekturmodell, interessant bei ausgeprägter Mandantenfähigkeit oder Geo-Replikation.
- [NATS](/tools/nats/): Schlankes Messaging für Cloud-native Services, wenn niedrige Komplexität und direkte Service-Kommunikation wichtiger sind als ein großer Log.
- [Microsoft Azure Event Hubs](/tools/microsoft-azure-event-hubs/): Verwaltete Event-Ingestion in Azure, wenn ein Team Brokerbetrieb vermeiden und im Azure-Ökosystem bleiben möchte.

## FAQ

**Ist Apache Kafka eine Message Queue?**

Kafka kann Queue-artige Verarbeitung über Consumer Groups abbilden, ist aber primär ein verteilter Event-Log. Nachrichten bleiben gemäß Retention verfügbar und können von mehreren Groups unabhängig gelesen werden.

**Garantiert Kafka die Reihenfolge aller Events?**

Nein. Kafka garantiert die Reihenfolge innerhalb einer Partition. Wer Reihenfolge für eine fachliche Entität braucht, muss einen passenden Schlüssel und eine passende Partitionierung wählen.

**Ist Kafka für ein kleines Team kostenlos?**

Die Software ist Open Source, aber Betriebskosten für Infrastruktur, Speicher, Monitoring und Pflege entstehen trotzdem. Für kleine Lasten kann ein Managed Service oder eine einfachere Alternative günstiger sein.

**Was muss vor dem Produktivbetrieb geklärt sein?**

Mindestens Event-Schema, Schlüssel, Retention, Replikation, ACLs, Verschlüsselung, Monitoring, Fehlerpfad und Zuständigkeit für Consumer-Lag und Wiederanlauf. Ein Demo-Cluster beantwortet diese Betriebsfragen nicht.
