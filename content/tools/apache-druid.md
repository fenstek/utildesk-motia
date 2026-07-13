---
slug: apache-druid
title: Apache Druid
editorial_reviewed: true
editorial_reviewed_by: Utildesk Redaktion
editorial_reviewed_at: 2026-07-13
editorial_status: manual_polished
editorial_batch: 2026-07-13-full-tool-card-editorial
category: AI Infrastructure
price_model: Open Source
tags: [data, analytics, open-source, developer-tools]
official_url: "https://druid.apache.org/"
description: "Open-Source-Analysedatenbank für schnelle OLAP-Abfragen auf zeitbezogenen Batch- und Streaming-Daten."
updated_at: 2026-07-13
lastReviewed: 2026-07-13
popularity: 0
tier: C
generated_at: 2026-05-14
---
# Apache Druid

Apache Druid ist eine Open-Source-Analysedatenbank für schnelle OLAP-Abfragen auf zeitbezogenen Ereignisdaten. Sie nimmt Batch- oder Streaming-Daten auf, baut daraus spaltenorientierte Segmente und verteilt Abfragen über ein Cluster. Der entscheidende Grenzstein: Druid ist kein allgemeines Transaktionssystem und kein fertiges BI-Produkt. Es lohnt sich vor allem, wenn frische Metriken mit vielen Filtern und Gruppierungen schnell abfragbar sein müssen.

## Für wen sich Druid lohnt

Druid passt zu Data-Engineering- und Plattformteams, die Telemetrie, Produktereignisse, Werbeauslieferung, Netzwerkmesswerte oder andere Zeitreihen regelmäßig slice-and-dice-analysieren. Ein typisches Team kennt seine Zeitspalte, kann Dimensionen und Metriken definieren und übernimmt Betrieb, Datenqualität und Zugriffskontrolle selbst. Für kleine, selten aktualisierte Tabellen, stark relationale Geschäftsprozesse oder wenige einfache SQL-Abfragen ist PostgreSQL, ein Warehouse oder eine schlankere Alternative meist wartbarer.

<figure class="tool-editorial-figure">
  <img src="/images/tools/apache-druid-editorial.webp" alt="Leuchtende Ereignispunkte werden in zeitlich geordnete Analyse-Segmente überführt" loading="lazy" decoding="async" />
</figure>

## Die Bausteine im echten Prozess

- **Ingestion:** Batch-Tasks oder Supervisoren lesen Quellen wie Dateien, Objektspeicher, Kafka oder Kinesis. Druid speichert die Ergebnisse als Segmente.
- **Segmente und Deep Storage:** Segmente sind spaltenorientierte Daten- und Indexdateien, typischerweise nach Zeit partitioniert. Deep Storage, etwa ein Objektspeicher oder HDFS, ist die dauerhafte Basis; Historicals halten häufig genutzte Segmente lokal und im Speicher.
- **Abfragepfad:** Ein Broker findet relevante Segmente, verteilt Teilabfragen an Historical- oder Realtime-Prozesse und führt die Ergebnisse zusammen. SQL und native JSON-Abfragen stehen über HTTP zur Verfügung.
- **Betriebsdienste:** Coordinator und Overlord balancieren Segmente und steuern Ingestion. Metadata Storage hält gemeinsame Zustände; ZooKeeper unterstützt Koordination und Leader Election.

Diese Aufteilung ist leistungsfähig, aber sie bringt mehr Betriebsverantwortung als eine einzelne Datenbankdatei. Deep Storage, Metadatenbank, Netzwerk, JVM-Ressourcen und Wiederanlauf gehören von Anfang an in das Design.

## Praktischer Einführungsablauf

Starten Sie mit einer Datasource und einem messbaren Job, zum Beispiel tägliche Produktnutzung nach Stunde, Region und Version. Definieren Sie zuerst Timestamp, Dimensionen, Metriken, Rollup-Entscheidung, Aufbewahrung und erwartete Abfrageformen. Danach testen Sie Batch- und Streaming-Ingestion getrennt: verspätete Ereignisse, Duplikate, Schemaänderungen und ein Neustart gehören in den Testdatensatz.

Für den täglichen Betrieb braucht das Team Runbooks für Supervisoren, fehlgeschlagene Tasks, Segment-Laden, Compaction und Retention. Ein Dashboard sollte Ingestion-Lag, Task-Fehler, Segmentanzahl, Broker-Latenz, Cache-Verhalten und Deep-Storage-Fehler zeigen. Ein grüner Query im Quickstart beweist noch nicht, dass die Zielmengen, Replikation und Wartungsfenster funktionieren.

## Abfragen und Datenqualität

Druid belohnt Zeitfilter, passende Segmentgranularität und Abfragen, die nur benötigte Spalten lesen. Prüfen Sie deshalb nicht nur Durchschnittslatenz, sondern Perzentile, gleichzeitige Nutzer, Datenfrische und Ergebnisvollständigkeit. Vergleichen Sie Stichproben gegen die Quellsysteme und dokumentieren Sie, ob Rollup Rohereignisse zusammenfasst.

Die wichtigsten Fehler sind oft fachlich: falsche Zeitzone, mehrfach gelieferte Events, unklare Nullwerte oder eine Dimension mit unerwartet hoher Kardinalität. Ein kontrolliertes Replay und ein Vergleich gegen eine Referenzabfrage sind wertvoller als ein einzelner Benchmark. Für Updates und Korrekturen müssen Sie den passenden Ingestion- oder SQL-basierten Workflow und die Auswirkungen auf Segmente und Retention festlegen.

## Integration, Sicherheit und Governance

Anwendungen fragen typischerweise den Router oder Broker per SQL-API, native API oder JDBC ab; BI-Tools können darauf aufsetzen. Für produktive Netze sind TLS, Authentifizierung und Autorisierung ausdrücklich zu konfigurieren, denn Sicherheitsfunktionen sind nicht einfach als sichere Voreinstellung vorauszusetzen. Datasource-Rechte sollten nach dem Least-Privilege-Prinzip vergeben werden; Schreibrechte können Ingestion und damit lokale oder externe Ressourcen beeinflussen.

Klären Sie vor dem Import, welche personenbezogenen oder vertraulichen Ereignisse in Deep Storage und Caches landen, wer Retention und Löschung kontrolliert und wie Backups behandelt werden. Zugangsdaten für Quellen gehören nicht in frei sichtbare Spezifikationen. Prüfen Sie außerdem Netzwerkpfade zwischen Druid, Metadata Storage, ZooKeeper, Kafka und Deep Storage sowie die Rechte des Betriebskontos.

## Kosten und Grenzen

Die Software ist Open Source, aber ein produktiver Cluster ist nicht kostenlos. Kosten entstehen durch Query- und Ingestion-Hosts, RAM und lokale Segment-Caches, Deep Storage, Metadata Storage, ZooKeeper, Netzwerk, Backups, Observability und Bereitschaftsdienst. Bei einem Managed-Angebot kommen Provider- und Supportkosten hinzu; bei Self-Hosting trägt das Team Upgrade-, Kapazitäts- und Incident-Risiko.

Druid ist nicht automatisch die beste Wahl für Schreib- und Lese-Transaktionen, flexible relationale Joins, Ad-hoc-Analysen ohne Zeitbezug oder sehr kleine Datenmengen. Auch "Echtzeit" ist kein Versprechen für jede Pipeline: Quell-Lag, Task-Konfiguration, Segmentierung und Query-Last bestimmen die tatsächliche Frische.

## Redaktionelle Einschätzung

Wir empfehlen Apache Druid Teams, die wiederholt frische Zeitreihen mit hoher Filter- und Aggregationslast auswerten und einen spezialisierten Analysecluster betreiben können. Wert entsteht, wenn Datenmodell, Segmentstrategie, Ingestion-SLO und Abfragebudget gemeinsam getestet werden. Für ein kleines Projekt mit wenigen SQL-Abfragen oder primären Transaktionen ist eine relationale Datenbank oder ein Warehouse die vernünftigere Wahl; für stream-zentrierte Verarbeitung ohne Druid-spezifische OLAP-Schicht ist Apache Flink oder Kafka Streams oft enger am Problem.

## Alternativen

- [ClickHouse](/tools/clickhouse/): Geeignet für spaltenorientierte OLAP-Abfragen und hohe Batch- oder Eventvolumen, wenn ein SQL-zentriertes Datenbanksystem im Vordergrund steht.
- [Apache Pinot](/tools/apache-pinot/): Naheliegend für nutzernahe Echtzeit-Analytics mit niedriger Latenz und einem stärker auf Serving ausgerichteten Ansatz.
- [Trino](/tools/trino/): Besser, wenn föderierte SQL-Abfragen über bestehende Quellen wichtiger sind als ein eigenes ingestiertes Segment-Serving-System.
- [Snowflake](/tools/snowflake/): Sinnvoll, wenn ein gemanagtes Cloud-Warehouse mit weniger Clusterbetrieb und breiterem Datenplattform-Umfang gesucht wird.
- [Apache Spark](/tools/apache-spark/): Passender für umfangreiche Batch-Transformationen und Data-Engineering-Pipelines als für dauerhaft niedrige Dashboard-Latenz.

## FAQ

**Ist Apache Druid ein Data Warehouse?**

Druid ist eine spezialisierte Echtzeit-Analysedatenbank. Es kann viele Warehouse-Aufgaben berühren, ersetzt aber nicht automatisch relationale Transaktionen, umfassende ELT-Orchestrierung oder jedes zentrale Warehouse.

**Welche Daten müssen für Druid gut modelliert sein?**

Mindestens eine sinnvolle Zeitspalte sowie stabile Dimensionen und Metriken. Legen Sie Granularität, Rollup, Retention und erwartete Filter vor dem ersten Lasttest fest; nachträgliche Korrekturen können neue Ingestion- und Segmentarbeit auslösen.

**Kann Druid Kafka-Daten in Echtzeit verarbeiten?**

Ja, über Streaming-Ingestion und Supervisoren. Die tatsächliche Frische hängt aber von Kafka-Lag, Task-Konfiguration, Segmentierung und Clusterlast ab. Messen Sie die End-to-End-Latenz mit verspäteten und doppelten Ereignissen.

**Ist Druid standardmäßig sicher für Produktionsdaten?**

Nein. TLS, Authentifizierung, Autorisierung, Netzwerkfilter und sichere Rechte müssen konfiguriert werden. Besonders Datasource-Schreibrechte gehören nur an vertrauenswürdige Rollen, weil sie Ingestion und damit weitreichende Zugriffe ermöglichen können.

**Wann ist ClickHouse oder Pinot die bessere Wahl?**

ClickHouse ist oft direkter für SQL-zentrierte OLAP-Workloads; Pinot passt häufig besser zu interaktiven Serving-Abfragen mit sehr niedriger Latenz. Entscheidend sind Datenfrische, Query-Muster, Ingestion-Modell und der gewünschte Betriebsaufwand, nicht ein pauschaler Benchmark.
