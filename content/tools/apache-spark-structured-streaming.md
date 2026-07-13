---
slug: apache-spark-structured-streaming
title: Apache Spark Structured Streaming
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Redaktion"
editorial_reviewed_at: 2026-07-13
editorial_status: "manual_polished"
editorial_batch: "2026-07-13-full-editorial-coverage"
category: Developer Tools
price_model: Open Source
tags: [data, streaming, batch, etl, open-source]
official_url: "https://spark.apache.org/docs/latest/structured-streaming-programming-guide.html"
popularity: 0
tier: "C"
generated_at: "2026-05-14"
lastReviewed: 2026-07-13
updated_at: 2026-07-13
description: "Praxisleitfaden für Spark Structured Streaming: DataFrames, Micro-Batches, Watermarks, Checkpoints, Sinks, Kosten und Betriebsgrenzen."
---
# Apache Spark Structured Streaming

Apache Spark Structured Streaming ist die Streaming-Schicht von Spark SQL. Ein Team beschreibt eine Berechnung mit DataFrames oder Datasets und startet sie mit `readStream` und `writeStream`; Spark führt den Plan dann inkrementell aus, statt für Batch und Stream zwei völlig verschiedene Programmiermodelle zu verlangen. Unterstützt werden Scala, Java, Python und R. Das macht die Technologie interessant für Data-Engineering-Teams, die bereits Spark nutzen und Ereignisse, Tabellen und historische Daten in einer gemeinsamen Umgebung verarbeiten wollen.

Der Name darf aber nicht mit einer fertigen Managed-Plattform verwechselt werden. Structured Streaming ist ein Framework innerhalb des Spark-Ökosystems. Cluster, Berechtigungen, dauerhafter Speicher für Checkpoints, Quellsysteme, Zielsysteme, Monitoring und Bereitschaftsdienst bleiben Architektur- und Betriebsaufgaben des Teams oder des gewählten Providers.

## Für wen ist Structured Streaming geeignet?

Die Karte passt zu Teams, die kontinuierlich eintreffende Daten mit Spark-SQL-Transformationen, Aggregationen, Joins oder Zeitfenstern verarbeiten. Beispiele sind Sensor- und Telemetriedaten, CDC-Ereignisse, Log-Anreicherung, laufende Kennzahlen und die Übergabe vorbereiteter Daten an Analytics- oder ML-Pipelines.

Weniger passend ist es als erster Baustein für einen einzelnen kleinen Consumer oder für eine Anwendung mit extrem strengen Millisekunden-Latenzen. Wer nur Nachrichten transportieren will, braucht zunächst eine Event-Plattform und nicht zwingend eine Spark-Rechenengine. Wer sehr komplexen, dauerhaft zustandsbehafteten Stream-Betrieb plant, sollte Flink als ernsthafte Vergleichsoption testen.

<figure class="tool-editorial-figure">
  <img src="/images/tools/apache-spark-structured-streaming-editorial.webp" alt="Illustration zu Apache Spark Structured Streaming: Datenfluss verzweigt sich als leuchtendes Flussdelta mit Checkpoints" loading="lazy" decoding="async" />
</figure>

## So arbeitet das Modell

Im Standardfall verarbeitet Structured Streaming neue Daten in kleinen Micro-Batches. Die Abfrage sieht weiterhin wie eine deklarative DataFrame-Berechnung aus; Trigger bestimmen, wann Spark neue Arbeit anstößt. Ergebnis und Zustand werden abhängig vom gewählten Output Mode in einen Sink geschrieben. Für sehr niedrige Latenz gibt es Continuous Processing, das jedoch andere Einschränkungen und at-least-once-Garantien hat und deshalb kein pauschaler Produktionsschalter ist.

Für Event-Time-Szenarien sind Windowing und Watermarks entscheidend. Ein Watermark erlaubt dem System, verspätete Ereignisse bis zu einer bewusst gewählten Grenze zu berücksichtigen und alten Zustand aufzuräumen. Die Wahl ist fachlich: Ein zu kurzer Zeitraum verwirft legitime Nachzügler, ein zu langer Zeitraum hält mehr Zustand und erhöht Speicher- und Recovery-Aufwand.

## Typische Einsatzszenarien

- **Laufende Aggregation:** Ereignisse aus Kafka oder Dateien werden nach Zeitfenster und Geschäftsschlüssel aggregiert und als aktualisierte Kennzahlen ausgegeben.
- **Event-Anreicherung:** Ein Stream wird mit statischen Referenzdaten verbunden, normalisiert und in ein Analyseformat geschrieben.
- **CDC- und Log-Pipelines:** Änderungen oder Logzeilen werden transformiert, validiert und an einen Lake, ein Warehouse oder Kafka weitergereicht.
- **Available-now Verarbeitung:** Ein begrenzter Rückstand wird mit dem Streaming-Code in mehreren Micro-Batches abgearbeitet, danach endet der Job kontrolliert.
- **Replay und Recovery:** Ein wiederholbar lesbarer Quellstrom, Checkpoint und idempotenter Sink ermöglichen Neustarts ohne blindes Doppelschreiben.

## Hauptfunktionen

- **Einheitliches API-Modell:** DataFrames und Datasets verbinden Batch- und Streaming-Code, wobei nicht jede Batch-Operation im Streaming unterstützt wird.
- **Quellen und Sinks:** Eingebaute Anbindungen umfassen unter anderem Dateien, Kafka und Testquellen; Dateien, Kafka, `foreach` und Debug-Sinks sind typische Ausgabepfade.
- **Output Modes:** Append, Update und Complete drücken aus, ob neue, geänderte oder die gesamte Ergebnistabelle geschrieben wird. Die Query bestimmt, welche Modi zulässig sind.
- **Stateful Processing:** Aggregationen, Fenster, Joins und benutzerdefinierte Zustandslogik können Zustand über Trigger hinweg halten.
- **Fehlertoleranz:** Offsets, State und Fortschritt werden über Checkpointing und Write-Ahead-Logs gesichert. Der Checkpoint braucht langlebigen, korrekt berechtigten Speicher.
- **Betriebsbeobachtung:** `StreamingQuery` und Progress-Daten liefern Input-Menge, Raten, Dauer, State-Operatoren und Fehlerhinweise für Dashboards und Alarme.

## Vorteile und Grenzen

### Vorteile

- Vertrautes Spark-SQL-Modell für Teams, die Batch-Verarbeitung bereits betreiben.
- Ein Codepfad für viele Batch- und Streaming-Transformationen reduziert doppelte Logik.
- Event-Time, Watermarks, Fenster, Aggregationen und Joins decken verbreitete Analysefälle ab.
- Open Source mit großem Spark-Ökosystem; Lizenzkosten sind nicht der Hauptkostentreiber.
- Checkpoints und replaybare Quellen können robuste Wiederanläufe ermöglichen, wenn der Sink mitspielt.

### Grenzen

- Spark-Cluster, Storage, Upgrades, Schemaänderungen und On-call-Betrieb sind nicht automatisch gelöst.
- Exactly-once ist eine Eigenschaft des Zusammenspiels aus Quelle, Engine und Sink, keine Garantie für jeden beliebigen Connector.
- `foreachBatch` ist standardmäßig at-least-once; für genauere Semantik muss der `batchId` zur Deduplizierung genutzt werden.
- Stateful Queries können bei falschen Watermarks oder hoher Kardinalität viel Speicher und Recovery-Zeit binden.
- Debug- und Memory-Sinks sind für Tests gedacht, nicht als dauerhafte, fehlertolerante Produktionsziele.

## Praktischer Einführungstest

Starten Sie nicht mit einem abstrakten Benchmark. Nehmen Sie eine begrenzte reale Strecke: Quelle, Schema, Transformation, Sink und ein eindeutig messbares Ziel. Protokollieren Sie Durchsatz, End-to-End-Latenz, Backlog, State-Größe, verspätete und doppelte Ereignisse sowie die Zeit bis zur Wiederaufnahme nach einem absichtlichen Neustart.

Testen Sie danach mindestens einen Schemawechsel, einen temporär nicht erreichbaren Sink und ein Replay. Legen Sie vorab fest, welche Duplikate akzeptabel sind, wer den Checkpoint besitzt und wie ein fehlerhaftes Batch erneut verarbeitet wird. Erst wenn diese Fälle beobachtbar sind, ist die Pipeline mehr als eine Demo.

## Datenschutz, Sicherheit und Kosten

Spark verarbeitet Daten in der von Ihnen betriebenen Infrastruktur oder im Angebot des Providers. Klären Sie deshalb Netzwerkpfade, Verschlüsselung, IAM-Rollen, Secret-Verwaltung, Logs, Checkpoint-Zugriff und Aufbewahrung. Checkpoints können fachlich sensible Zustände und Offsets enthalten. Für personenbezogene Daten gehören Lösch- und Replay-Regeln zur Architektur, nicht nur zur Datenschutzerklärung.

Apache Spark ist Open Source; konkrete Lizenzkosten für Structured Streaming fallen nicht an. Budgetiert werden müssen stattdessen Cluster- und Storage-Zeit, Netzwerk, Managed-Service-Aufschläge, Monitoring, Support, Datenübertragung, Entwicklung und Bereitschaft. Ein kleinerer, seltener Job kann günstiger als ein dauerhaft aktiver Stream sein; ein dauerhaft laufender Job braucht dagegen belastbare Kapazitäts- und Recovery-Messwerte.

## Redaktionelle Einschätzung

Structured Streaming ist eine überzeugende Wahl, wenn Spark bereits der gemeinsame Rechen- und Governance-Rahmen ist und Streaming eng mit Batch, SQL oder Data-Lake-Arbeit verbunden werden soll. Die Stärke liegt in einem konsistenten Programmiermodell, nicht in einer magischen Zusage für jede Latenz oder jedes Delivery-Semantikversprechen.

Wir würden mit einem kleinen, replaybaren End-to-End-Job beginnen und die Betriebsgrenzen vor dem Rollout messen. Wenn vor allem Kafka-gebundene Java-Microservices, portable Pipelines oder ein stream-first Stateful Runtime-Modell gefragt sind, sollten die folgenden Alternativen nicht nur auf einer Featureliste, sondern mit demselben Testdatensatz verglichen werden.

## Alternativen

- [Apache Flink](/tools/apache-flink/): die naheliegende Vergleichsoption, wenn kontinuierliches Stream-Processing, Event Time und State im Zentrum stehen.
- [Apache Beam](/tools/apache-beam/): ein portables Pipeline-Modell, wenn derselbe Code auf unterschiedlichen Runnern wie Spark, Flink oder Dataflow geprüft werden soll.
- [Kafka Streams](/tools/kafka-streams/): eine leichtere Bibliothek für Java/Scala-Anwendungen, die eng an Kafka-Topics und Microservices gebunden sind.
- [Apache Kafka](/tools/apache-kafka/): die passendere erste Wahl, wenn Transport, Partitionierung und Event-Log wichtiger sind als verteilte Transformation.
- [Google Cloud Dataflow](/tools/google-cloud-dataflow/): ein gemanagter Cloud-Ansatz für Batch- und Streaming-Pipelines, besonders im Beam-Ökosystem.

## FAQ

**Ist Structured Streaming dasselbe wie der ältere Spark Streaming DStream-Ansatz?**

Nein. Structured Streaming nutzt DataFrames/Datasets und Spark SQL als deklaratives Modell; DStreams gehören zum älteren API-Ansatz. Bestehender DStream-Code wird dadurch nicht automatisch migriert.

**Welche Sprache sollte ein Team wählen?**

Scala, Java, Python und R werden unterstützt. Entscheidend sind vorhandene Spark-Kompetenz, Connector-Kompatibilität, Testbarkeit und Betriebswissen; Python ist nicht automatisch die beste Wahl für jeden Engpass.

**Garantiert ein Checkpoint allein Exactly-once?**

Nein. Die Quelle muss zuverlässig wiederholbar sein und der Sink Wiederholungen korrekt behandeln. Bei `foreachBatch` müssen Sie etwa selbst mit `batchId` deduplizieren, wenn genau-einmalige Wirkung erforderlich ist.

**Wie geht Structured Streaming mit verspäteten Ereignissen um?**

Über Event-Time-Spalten, Fenster und `withWatermark`. Die erlaubte Verspätung muss zum Fachfall passen; nach Überschreiten des Watermarks kann ein Ereignis zu spät für eine bestimmte Aggregation sein.

**Kann man eine laufende Query beliebig ändern und mit demselben Checkpoint starten?**

Nein. Änderungen an Quellen, Zustandsoperationen oder State-Schema können beim Wiederanlauf unzulässig oder semantisch unklar sein. Eine Änderung braucht einen getesteten Migrations- oder neuen Checkpoint-Plan.

**Wann ist Spark die falsche Wahl?**

Wenn nur Nachrichten transportiert werden sollen, ist Kafka näher am Bedarf. Wenn ein stream-first Runtime-Modell mit starkem State-Fokus oder sehr niedriger Latenz benötigt wird, sollten Sie Flink und die konkrete Betriebsumgebung vergleichen.
