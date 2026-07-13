---
slug: amazon-emr
title: Amazon EMR
editorial_reviewed: true
editorial_reviewed_by: Utildesk Redaktion
editorial_reviewed_at: 2026-07-13
editorial_status: manual_polished
editorial_batch: 2026-07-13-full-editorial-coverage
lastReviewed: 2026-07-13
updated_at: 2026-07-13
category: Entwickler-Tools
price_model: Nutzungsbasiert
tags: [data, analytics, cloud, developer-tools]
official_url: "https://aws.amazon.com/emr/"
description: "Verwaltete AWS-Plattform für Spark-, Hadoop- und andere große Datenjobs mit EC2-Clustern, Serverless oder EKS."
popularity: 0
tier: C
generated_at: 2026-05-14
---
# Amazon EMR

Amazon EMR ist AWS' verwaltete Plattform für große Datenverarbeitungs-Workloads. Sie führt Open-Source-Frameworks wie Apache Spark, Apache Hadoop, Hive und Trino auf AWS-Infrastruktur aus und verbindet sie mit Diensten wie Amazon S3 und dem AWS Glue Data Catalog. Der entscheidende Punkt: EMR ist kein einzelnes Analyseprogramm, sondern ein Betriebsmodell für Jobs, Cluster oder serverlose Anwendungen.

## Was Amazon EMR tatsächlich abnimmt

Beim klassischen EMR auf Amazon EC2 erstellt und verwaltet das Team Cluster, wählt die installierten Anwendungen und steuert die Kapazität. AWS übernimmt den Dienstbetrieb rund um die EMR-Plattform, aber nicht automatisch die fachliche Datenmodellierung, die Qualität der Jobs oder jede Konfiguration des Gastbetriebssystems. EMR Studio, CLI, SDKs und APIs können Entwicklung und Einreichung von Jobs unterstützen.

Amazon EMR bietet daneben zwei andere Ausführungswege. EMR Serverless nimmt die Cluster-Kapazitätsverwaltung für Spark- und Hive-Anwendungen weitgehend ab: Ein Job bekommt Ressourcen, verarbeitet Daten und gibt sie wieder frei. EMR on EKS führt EMR-Anwendungen in Containern auf einem bestehenden Amazon-EKS-Cluster aus. Diese Varianten sind nicht austauschbar; sie verschieben die Betriebsarbeit jeweils an andere Stellen.

<figure class="tool-editorial-figure">
  <img src="/images/tools/amazon-emr-editorial.webp" alt="Illustration zu Amazon EMR: Datenhütten, Kabelbahnen und Verarbeitungspfade bilden ein Cluster-Gebirge" loading="lazy" decoding="async" />
</figure>

## Für wen passt der Dienst?

EMR passt zu Dateningenieurinnen, Plattformteams und Analytics-Teams, die wiederkehrende Batch- oder Streaming-Verarbeitung mit großen Datenmengen betreiben. Ein typisches Umfeld hat bereits S3, IAM, VPCs und Monitoring im Einsatz und kann für Daten, Jobs und Kosten jeweils Verantwortliche benennen. Wer nur eine einzelne Tabelle gelegentlich bereinigt, braucht dagegen meist keine verteilte Rechenplattform.

Auch die vorhandenen Fähigkeiten zählen. Spark- oder Hadoop-Erfahrung, SQL, Python oder Scala helfen beim Einstieg, lösen aber nicht die Betriebsfragen. Vor der Einführung sollte klar sein, wer Images und Release-Versionen pflegt, Jobs neu startet, Datenzugriffe genehmigt und eine fehlerhafte Ausgabe zurücknimmt.

## Konkrete Einsatzszenarien

- **Nachtlicher Data-Lake-Job:** Rohdaten landen in S3, Spark bereinigt und aggregiert sie, und eine geprüfte Ausgabe wird für BI oder nachgelagerte Modelle veröffentlicht.
- **Große Migration oder Reorganisation:** Viele Dateien oder Tabellen werden in einem begrenzten Lauf transformiert, statt einen einzelnen Anwendungsserver wochenlang zu überlasten.
- **Reproduzierbare Feature-Berechnung:** Ein versionierter Job erzeugt Trainings- oder Analysemerkmale aus einem festgelegten Datenstand; Eingabe, Code, Lauf und Ergebnis bleiben nachvollziehbar.
- **Streaming- oder Nearline-Verarbeitung:** Ein Team verarbeitet kontinuierlich eingehende Daten, wenn Durchsatz, Wiederholung und verspätete Ereignisse bewusst gestaltet sind.
- **Gemeinsame Plattform im EKS-Cluster:** EMR on EKS ist sinnvoll, wenn Kubernetes bereits etabliert ist und Datenjobs mit anderen Workloads unter gemeinsamen Netzwerk- und Deployment-Regeln laufen sollen.

Für jedes Szenario sollte ein kleiner, echter Lauf den Weg von der Quelle bis zum konsumierbaren Ergebnis zeigen. Ein Notebook, das nur im persönlichen Workspace funktioniert, ist noch kein produktionsfähiger Datenprozess.

## Ein belastbarer Pilot

Beginnt mit einem Job, einer klaren Eingabe und einem überprüfbaren Ergebnis. Messt Datenvolumen, Laufzeit, Shuffle, Fehlerrate und Kosten pro Lauf. Verwendet eine feste EMR-Release-Version und dokumentiert Spark-Konfiguration, Instance-Typen, Parallelität und Abbruchkriterien. Prüft eine kleine Stichprobe fachlich, nicht nur den Exit-Code des Jobs.

Testet absichtlich einen fehlenden Input, doppelte Daten, verspätete Ereignisse, einen abgebrochenen Lauf und einen Neustart. Definiert, ob ein Job sicher wiederholbar ist oder wo er einen Checkpoint braucht. Erst wenn diese Fälle nachvollziehbar behandelt werden, lohnt die Diskussion über automatisches Scaling oder mehrere Teams.

## Grenzen und Betriebsaufwand

EMR versteckt nicht die Komplexität verteilter Datenverarbeitung. Partitionierung, Dateigröße, Shuffle, Schemaänderungen und Daten-Skew können einen Job trotz ausreichender Clustergröße langsam oder teuer machen. Die Wahl zwischen EC2-Cluster, Serverless und EKS hängt von Lastprofil, Startlatenz, vorhandener Plattform und gewünschter Kontrolle ab.

Bei EC2 bleibt das Team für die installierte Anwendungsschicht, Cluster-Konfiguration, Versionen, Netzwerk und viele Kostenentscheidungen verantwortlich. Serverless reduziert Kapazitätsarbeit, ist aber nicht automatisch billig: Rechenzeit, vorinitialisierte Kapazität, Speicher und Datenbewegung müssen zum tatsächlichen Jobprofil passen. EMR on EKS spart keine Kubernetes-Verantwortung ein; Namespace-, Node-, Image- und Cluster-Governance bleiben relevant.

## Sicherheit und Datenverantwortung

EMR folgt der geteilten Verantwortung. AWS schützt die Cloud-Infrastruktur; das Team konfiguriert IAM, Sicherheitsgruppen, Subnetze, Rollen für Service, EC2-Instanzen und Jobs sowie die Zugriffe auf S3. Für Daten im Ruhezustand und während der Übertragung stehen Verschlüsselungsoptionen zur Verfügung. KMS-Schlüssel verursachen eigene Kosten und brauchen passende Schlüsselrichtlinien.

Behandelt Logs, temporäre Dateien, Metadaten und Zwischenresultate ebenso bewusst wie die Rohdaten. Trennt Entwicklungs- und Produktionskonten oder mindestens ihre Berechtigungen, blockiert öffentliche Cluster-Zugriffe und legt Aufbewahrung und Löschung fest. Für feingranulare Datensatz- oder Spaltenrechte können Lake Formation oder Apache Ranger relevant sein; beides ersetzt keine saubere Datenklassifizierung und keinen Review der IAM-Policies.

## Kostenmodell

Die Rechnung hängt vom Ausführungsweg und der Nutzung ab. Bei EMR auf EC2 zählen unter anderem Instance-Typ, Anzahl, Region, Laufzeit und Speicher; die EC2- und EBS-Kosten fallen zusätzlich zu möglichen EMR-Kosten an. S3, Glue Data Catalog, CloudWatch, KMS, EKS, Datenübertragung und weitere AWS-Dienste können die Rechnung vergrößern. Bei Serverless sind die verbrauchten vCPU-, Speicher- und Storage-Ressourcen sowie gegebenenfalls vorgehaltene Kapazität entscheidend.

Erstellt für den Pilot ein Kostenbudget und markiert Ressourcen mit Owner und Umgebung. Vergleicht nicht nur den Preis eines erfolgreichen Laufs: Wiederholungen, Leerlauf, Backfills, Transfers und Fehlversuche gehören in die Schätzung. Ein kleinerer Dienst oder ein SQL-Warehouse kann für einfache Transformationen wirtschaftlicher und leichter zu betreiben sein.

## Redaktionelle Einschätzung

Amazon EMR ist eine gute Wahl, wenn ein Team bereits AWS nutzt und verteilte Spark- oder Hadoop-Verarbeitung mit klarer Datenverantwortung braucht. Die Auswahl aus EC2, Serverless und EKS ist leistungsfähig, verlangt aber eine bewusste Architekturentscheidung. EMR ist kein Knopf, der schlechte Partitionierung, fehlende Tests oder unklare Zugriffsrechte wegautomatisiert.

Unsere Empfehlung: zuerst einen wiederholbaren Produktionskandidaten mit realem Volumen bauen, nicht eine Demo mit Spielzeugdaten. Wenn das Team Laufzeit, Kosten, Datenqualität und Wiederanlauf nachweisen kann, ist EMR plausibel. Für kleine, interaktive Abfragen oder wenige einfache Pipelines sollten schlankere Alternativen zuerst geprüft werden.

## Alternativen

- [Apache Hadoop](/tools/apache-hadoop/): Passt, wenn maximale Kontrolle über eine selbst betriebene Hadoop-Plattform wichtiger ist als der AWS-verwaltete Weg.
- [Apache Spark](/tools/apache-spark/): Ist die passendere Referenz, wenn das Team Spark direkt als Framework und nicht eine komplette AWS-Betriebsplattform sucht.
- [Databricks](/tools/databricks/): Ist interessant, wenn kollaborative Notebooks, ein stärker integrierter Lakehouse-Betrieb und mehrere Cloud-Optionen zählen.
- [Google Cloud Dataproc](/tools/google-cloud-dataproc/): Bietet einen ähnlichen verwalteten Clusterweg für Teams im Google-Cloud-Ökosystem.
- [Snowflake](/tools/snowflake/): Passt besser für SQL-zentrierte Analytik, wenn eigene verteilte Spark-Jobs nicht der Kern des Problems sind.

## FAQ

**Ist Amazon EMR ein einzelnes Hadoop-Produkt?**
Nein. EMR ist eine AWS-Plattform für mehrere Ausführungswege und Open-Source-Anwendungen, darunter Spark und Hadoop.

**Wann sollte ich EMR Serverless statt eines EC2-Clusters wählen?**
Serverless ist attraktiv, wenn Jobs schwankend oder unregelmäßig laufen und das Team Cluster-Kapazität nicht selbst verwalten möchte. Startzeit, Ressourcenprofil, Netzwerk und Kosten sollten mit echten Läufen geprüft werden.

**Ist EMR on EKS einfach nur EMR ohne Clusterbetrieb?**
Nein. EMR on EKS verwaltet die EMR-Anwendungsschicht in EKS, aber das Team betreibt weiterhin relevante Kubernetes-, Netzwerk-, Image- und Berechtigungsregeln.

**Welche Programmiersprachen kann ich verwenden?**
Das hängt vom Framework und Job ab. In der Praxis sind Spark-Anwendungen häufig in Python, Scala oder Java geschrieben; SQL ist je nach Anwendung ebenfalls möglich. Die Sprache ersetzt nicht die nötige Daten- und Laufzeitprüfung.

**Ist Amazon EMR automatisch sicher?**
Nein. AWS stellt Sicherheitsfunktionen bereit, aber IAM-Rollen, Netzwerk, Verschlüsselung, Schlüssel, Datenzugriff, Logging und Aufbewahrung müssen passend konfiguriert und regelmäßig geprüft werden.

**Welche Daten sollte ich für einen Pilot verwenden?**
Ein repräsentatives, möglichst risikoarm anonymisiertes Volumen mit realistischen Partitionen und Fehlerfällen. So werden Laufzeit, Kosten und Datenqualität sichtbar, ohne unnötig sensible Produktionsdaten zu kopieren.
