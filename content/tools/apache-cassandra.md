---
slug: apache-cassandra
title: Apache Cassandra
editorial_reviewed: true
editorial_reviewed_by: Utildesk Redaktion
editorial_reviewed_at: 2026-07-13
editorial_status: manual_polished
editorial_batch: 2026-07-13-apache-cassandra-editorial
category: "Entwickler-Tools"
price_model: Open Source
tags: [database, data, open-source, developer-tools]
official_url: "https://cassandra.apache.org/_/index.html"
popularity: 0
tier: C
description: "Apache Cassandra ist eine verteilte Open-Source-Datenbank für hochverfügbare, schreibintensive Workloads mit planbaren Zugriffsmustern über viele Knoten oder Regionen."
generated_at: 2026-05-27
updated_at: 2026-07-13
lastReviewed: 2026-07-13
---
# Apache Cassandra

Apache Cassandra ist eine verteilte Open-Source-Datenbank für große, ausfallsensitive Workloads. Sie nutzt ein partitioniertes Wide-Column-Modell und verteilt Replikate über mehrere Knoten und Rechenzentren. Das Ziel ist nicht, eine relationale Datenbank möglichst ähnlich nachzubauen, sondern Schreib- und Lesezugriffe über viele Maschinen und Regionen verfügbar zu halten.

Cassandra passt deshalb zu Anwendungen mit bekannten Zugriffsmustern, hohem Schreibvolumen und dem Wunsch nach horizontalem Wachstum. Sie ist kein universeller Speicher für spontane Abfragen. Der wichtigste Designschritt passiert vor dem ersten `CREATE TABLE`: Das Team muss wissen, welche Abfragen eine Tabelle schnell beantworten soll.

## Für wen ist Apache Cassandra geeignet?

Cassandra ist vor allem für Plattform-, Backend- und Data-Teams interessant, die eine operative Datenbasis über mehrere Knoten oder Standorte betreiben wollen. Typische Kandidaten sind:

- Ereignis- und Telemetriedaten aus IoT, Infrastruktur oder Anwendungen
- Nachrichten-, Aktivitäts- und Timeline-Daten mit hohem Schreibaufkommen
- personalisierte oder geografisch verteilte Zustände, die regional verfügbar bleiben sollen
- große Zeitreihen, bei denen Aufbewahrung und Ablauf mit TTLs geplant werden
- Dienste, bei denen ein einzelner Primärknoten oder eine einzelne Region nicht akzeptabel ist

Für ein kleines internes CRUD-Projekt, viele Joins oder ständig wechselnde Ad-hoc-Abfragen ist eine relationale oder dokumentorientierte Alternative meist der ruhigere Start.

<figure class="tool-editorial-figure">
  <img src="/images/tools/apache-cassandra-editorial.webp" alt="Illustration zu Apache Cassandra: Verteilte Archivsaeulen speichern Daten ueber leuchtende Wurzelpfade" loading="lazy" decoding="async" />
</figure>

## Wie Cassandra Daten organisiert

Anwendungen greifen über CQL, eine SQL-ähnliche Sprache, auf Keyspaces und Tabellen zu. Ein Keyspace beschreibt unter anderem die Replikationsstrategie und die Anzahl der Kopien. Die Partition Key entscheidet, auf welchen Knoten ein Datensatz landet; Clustering Columns bestimmen die Sortierung innerhalb einer Partition.

Das macht Datenmodellierung zu einer fachlichen Aufgabe. Eine Tabelle wird nicht zuerst nach Entitäten normalisiert und später für alle Fragen verwendet. Stattdessen modelliert das Team die wichtigsten Abfragen, begrenzt die Partitionsgröße und entscheidet, ob Daten für unterschiedliche Lesemuster mehrfach gespeichert werden müssen. Denormalisierung ist hier oft bewusstes Design, nicht automatisch ein Fehler.

## Typische Einsatzszenarien

- **Globale Event-Plattform:** Events werden nach Mandant und Zeitfenster partitioniert, regional geschrieben und für definierte Abfragefenster gelesen. Vorab müssen maximale Partitionsgröße, TTL und Replay-Strategie feststehen.
- **IoT- und Telemetriedaten:** Geräte schreiben regelmäßig Messwerte; Zeit-Buckets und Ablaufregeln verhindern, dass eine einzelne Partition unbegrenzt wächst. Rohdaten und aggregierte Auswertungen sollten getrennt bewertet werden.
- **Nachrichten- oder Aktivitäts-Feed:** Ein Feed kann für bekannte Zugriffe materialisiert werden, statt bei jedem Request mehrere Tabellen zu joinen. Änderungen an der Anzeige erfordern dann eine geplante Backfill- oder Dual-Write-Strategie.
- **Multi-Region-Betrieb:** Replikation über Rechenzentren reduziert die Abhängigkeit von einer Region. Anwendung und Treiber müssen dennoch lokale Konsistenz, Failover und mögliche Konflikte bewusst behandeln.

## Konsistenz, Replikation und Verfügbarkeit

Cassandra lässt sich nicht mit dem Versprechen „immer konsistent und immer billig“ betreiben. Replikationsfaktor, Replikationsstrategie und Consistency Level bestimmen gemeinsam, wie viele Replikate eine Operation bestätigt sehen muss. `LOCAL_QUORUM` kann für regionale Zugriffe sinnvoll sein, ist aber kein Ersatz für ein fachliches Konfliktmodell. Lightweight Transactions helfen bei bestimmten bedingten Änderungen, machen Cassandra aber nicht zu einer allgemeinen relationalen Transaktionsdatenbank.

Ein Knoten-Ausfall kann während des Betriebs überbrückt werden. Hints und andere Mechanismen unterstützen die Konvergenz, ersetzen aber nicht den geplanten Repair. Für jedes Keyspace gehören Repair-Frequenz, Restore-Probe, Node-Replacement und das Verhalten nach einem längeren Ausfall in den Runbook-Entwurf.

## Betrieb: Repair, Compaction und Monitoring

Die Schreibstrecke nutzt Commit Log, Memtables und immutable SSTables. Updates, Deletes und TTL-Abläufe erzeugen neue Versionen oder Tombstones; Compaction führt SSTables zusammen und räumt veraltete Daten auf. Das ist kein unsichtbares Detail: Disk-Auslastung, Schreibverstärkung, Read Amplification, Tombstone-Dichte und Compaction-Backlog können die Latenz spürbar verändern.

Ein produktiver Pilot sollte deshalb nicht nur Requests pro Sekunde messen. Beobachtet werden sollten p95/p99-Latenz, Pending Compactions, Heap und Off-Heap-Ressourcen, Disk-Wasserstand, Streaming, Repair-Status, Read/Write Timeouts und die Verteilung der Partitionsgrößen. Dashboards ohne Alarmgrenzen und Besitzer sind noch kein Betriebskonzept.

## Sicherheit und Datenverantwortung

Vor dem ersten produktiven Dataset müssen Authentifizierung, Autorisierung, Verschlüsselung zwischen Knoten und Clients, Netzwerkgrenzen, Secrets, Backups und Audit-Anforderungen geklärt sein. Personenbezogene Daten brauchen zusätzlich eine dokumentierte Lösch- und Aufbewahrungslogik. TTLs können helfen, aber sie ersetzen keine Prüfung, ob Replikate, Backups und Exporte dieselbe Löschanforderung erfüllen.

Bei selbst betriebenen Clustern liegt die Verantwortung für Patches, Versionen, Kapazitätsplanung und Restore-Tests beim Team. Ein gemanagter Dienst kann Betriebsarbeit reduzieren, ändert aber nicht die Aufgaben rund um Datenmodell, Zugriffsmuster, Region, Vertragslage und Kostenkontrolle.

## Preise und tatsächliche Kosten

Apache Cassandra selbst ist Open Source und ohne klassische Lizenzgebühr nutzbar. Bezahlt werden trotzdem Infrastruktur, SSD-Kapazität, Replikationsplatz, Datenverkehr zwischen Regionen, Backups, Monitoring, Bereitschaft und Engineering-Zeit. Bei einem gemanagten Angebot kommen Dienst- und Transferpreise nach Anbieter hinzu.

Für einen Vergleich sollte das Team einen repräsentativen Workload mit realistischen Payloads und Replikationsfaktoren fahren. Wichtig sind nicht nur die durchschnittlichen Kosten pro Monat, sondern auch Spitzen, Egress, Reservekapazität, Repair- und Compaction-Last sowie die Kosten eines Restore- oder Region-Ausfalls.

## Redaktionelle Einschätzung

Apache Cassandra ist eine gute Wahl, wenn hohe Verfügbarkeit, verteiltes Schreiben und planbare Zugriffsmuster wichtiger sind als flexible Joins. Die Architektur belohnt Teams, die Datenmodell, Treiberverhalten und Betrieb gemeinsam entwerfen. Sie bestraft den Ansatz „wir migrieren erst einmal und optimieren später“.

Unsere Empfehlung: mit einem begrenzten, aber echten Workload starten. Erfolgskriterien sollten Partitionsgröße, p99-Latenz, Repair-Zeit, Wiederherstellungsdauer, Kosten pro Vorgang und das Verhalten bei Knoten- oder Regionsausfall enthalten. Wenn das Team diese Zahlen nicht messen oder den Cluster nicht zuverlässig reparieren und wiederherstellen kann, ist eine weniger anspruchsvolle Alternative wahrscheinlich die bessere Entscheidung.

## Alternativen

- [Amazon DynamoDB](/tools/amazon-dynamodb/): sinnvoll, wenn ein stark verwalteter Key-Value- und NoSQL-Dienst mit wenig Clusterbetrieb gesucht wird.
- [MongoDB](/tools/mongodb/): passend, wenn dokumentorientierte Daten, flexible Dokumente und andere Abfragemuster wichtiger sind als Cassandras Wide-Column-Modell.
- [CockroachDB](/tools/cockroachdb/): interessant für verteilte relationale Transaktionen, SQL und ein stärker relationales Datenmodell.
- [Apache HBase](/tools/apache-hbase/): eine Option für große Tabellen im Hadoop-Ökosystem und Zugriffe, die zum HBase-Modell passen.
- [ClickHouse](/tools/clickhouse/): besser für spaltenorientierte analytische Abfragen und Aggregationen als für den primären operativen Schreibpfad.

## FAQ

**Ist Apache Cassandra eine relationale SQL-Datenbank?**

Nein. Cassandra bietet mit CQL eine SQL-ähnliche Sprache, verwendet aber ein verteiltes Wide-Column-Modell und andere Konsistenz- und Transaktionsgrenzen. Joins und frei kombinierbare relationale Abfragen sind nicht ihr Schwerpunkt.

**Muss ich Tabellen für konkrete Abfragen modellieren?**

Ja. Partition Key und Clustering Columns sollten aus den wichtigsten Zugriffsmustern abgeleitet werden. Wer erst ein universelles Schema baut und die Queries später erfindet, riskiert Hot Partitions, große Scans oder unbrauchbare Latenzen.

**Ersetzt Replikation den Backup- und Restore-Test?**

Nein. Replikation schützt vor bestimmten Knotenausfällen, ist aber kein unabhängiges Backup und keine Garantie gegen Fehlbedienung oder fehlerhafte Daten. Restore und Wiederanlauf müssen regelmäßig mit realistischen Daten getestet werden.

**Ist Cassandra für klassische Business-Reports geeignet?**

Meist nicht als primäre Reporting-Datenbank. Operative Daten können in ein Analyse-System exportiert werden; für Ad-hoc-Joins und breite Aggregationen sind relationale Warehouses oder spaltenorientierte Systeme häufig geeigneter.

**Wann sollte ich Cassandra nicht wählen?**

Wenn das Projekt klein ist, die Abfragen noch völlig offen sind, starke relationale Transaktionen benötigt werden oder niemand Repair, Compaction, Monitoring und Restore verantworten kann. In diesen Fällen reduziert eine passendere Alternative das Betriebsrisiko.
