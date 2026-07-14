---
slug: cockroachdb
title: CockroachDB
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Redaktion"
editorial_reviewed_at: 2026-07-14
editorial_status: "manual_polished"
editorial_batch: "2026-07-14-full-tool-card-editorial"
category: Entwickler-Tools
price_model: Freemium
tags: [database, cloud, data, developer-tools]
official_url: "https://www.cockroachlabs.com/"
description: "Verteilte SQL-Datenbank für transaktionale Anwendungen, die über mehrere Regionen verfügbar bleiben sollen und dafür bewusstes Daten-, Kosten- und Betriebsdesign benötigen."
popularity: 0
tier: C
generated_at: 2026-05-26
updated_at: 2026-07-14
---
# CockroachDB

CockroachDB ist eine verteilte SQL-Datenbank für Anwendungen, die Daten über mehrere Knoten oder Regionen replizieren und dabei relationale Transaktionen behalten müssen. Das ist eine konkrete Architekturentscheidung, kein automatisches Hochverfügbarkeits-Upgrade für jede PostgreSQL-Anwendung: Replikationslayout, Latenz, Transaktions-Retries, Backups und Kosten müssen zum Workload passen.

## Was ist CockroachDB und für wen?

CockroachDB passt zu Plattform- und Produktteams, die einen transaktionalen Dienst über mehrere Ausfallzonen oder Regionen betreiben wollen, ohne auf SQL, relationale Datenmodelle und starke Konsistenz zu verzichten. SaaS-Produkte mit geografisch verteilten Nutzern, globale Kontroll- und Metadaten sowie Systeme mit klaren RTO/RPO-Anforderungen sind typische Kandidaten. Für eine einzelne kleine Anwendung in einer Region ist PostgreSQL meist die einfachere Ausgangsbasis.

## Welche Komponenten greifen ineinander?

Ein Cluster teilt Daten in Ranges und repliziert sie. Das Raft-basierte Konsensmodell lässt Schreibvorgänge erst nach einem Quorum als bestätigt gelten. Die SQL-Schicht bietet ACID-Transaktionen; standardmäßig gilt `SERIALIZABLE`, zusätzlich gibt es `READ COMMITTED`. Anwendung, Treiber, SQL-API, Cloud Console oder CLI, Monitoring und Backup-Speicher bilden deshalb gemeinsam den Dienst. Die Datenbank ersetzt weder Connection-Pooling noch Schema-Migrationen, Observability oder ein getestetes Disaster-Recovery-Verfahren.

<figure class="tool-editorial-figure">
  <img src="/images/tools/cockroachdb-editorial.webp" alt="Illustration zu CockroachDB: verteilte Datentresore, die durch redundante Leitungen verbunden sind" loading="lazy" decoding="async" />
</figure>

## Praktischer Einführungs-Workflow

1. Zuerst einen repräsentativen Workload mit realistischen Datenmengen, Schreibmustern und regionalen Latenzen beschreiben.
2. Tabellen, Primärschlüssel, Indizes und Zonen- beziehungsweise Regionalregeln festlegen; nicht jede Tabelle muss global repliziert werden.
3. Einen Cloud-Cluster oder eine selbst gehostete Testumgebung aufbauen und Migrationen, Connection-Pooling sowie Fehlerverhalten des Treibers prüfen.
4. Transaktionen unter Konkurrenzlast testen. Bei `SERIALIZABLE` müssen Anwendungen mögliche Retry-Fehler korrekt behandeln; ein erfolgreicher Happy Path reicht nicht.
5. Erst danach Backups, Restore in eine getrennte Umgebung, Alerting, Rollen und einen Upgrade-Prozess als Betriebsstandard festschreiben.

## Betrieb, Integration und Wiederherstellung

CockroachDB Cloud nimmt einen Teil des Clusterbetriebs ab, während self-hosted Teams zusätzlich Provisionierung, Knoten, Upgrades, Zertifikate, Monitoring und Supportwege verantworten. Backups können für self-hosted Cluster vollständig oder inkrementell auf AWS S3, Google Cloud Storage oder Azure Storage geschrieben werden. Die offizielle Dokumentation warnt davor, beliebige S3-kompatible Dienste als offiziell unterstützt anzunehmen. Ein Backup ist erst dann belastbar, wenn ein Restore mit passenden Regionen, Berechtigungen und Anwendungsmigrationen praktisch geprobt wurde.

Releaseplanung gehört ebenfalls zum Betrieb: Cockroach Labs veröffentlicht Major-Versionen quartalsweise, mit unterschiedlichen Supportfenstern für Regular- und Innovation-Releases. Vor einem Upgrade sollten unterstützte Version, Client-Treiber, Migrationen und Wartungsfenster geprüft werden; eine Innovation-Version ist nicht automatisch die konservativste Produktionswahl.

## Qualität, Evaluation und Grenzen

Die Evaluation sollte nicht nur TPC-ähnliche Spitzenwerte messen. Vergleiche unter identischem Schema Schreibdurchsatz, p95/p99-Latenz, Retry-Rate, Hotspots, Rebuild- und Restore-Zeit sowie Kosten bei der geplanten Topologie. Prüfe außerdem, ob das Team regionale Datenplatzierung versteht und ob die Anwendung mit transienten Fehlern umgehen kann.

Die verteilte Architektur bezahlt sich nicht in jedem Szenario aus. Viele kleine Transaktionen auf demselben Schlüssel, unnötig globale Tabellen oder weit entfernte Schreibregionen können Contention und Latenz erzeugen. Ein Single-Region-Cluster mit überdimensionierter Georedundanz ist dann teurer und schwerer zu betreiben als eine klassische relationale Datenbank.

## Sicherheit, Datenschutz und Governance

Client- und Node-Verkehr wird per TLS geschützt. Für Daten at rest kommen je nach Deployment Provider-Schlüssel, self-hosted Encryption at Rest oder in CockroachDB Advanced kundeneigene Schlüssel (CMEK) hinzu. Rollen, Authentifizierung, Netzwerk-Allowlists, getrennte Service-Identitäten und minimale Rechte gehören in den Einführungsplan. CMEK ist keine magische Löschfunktion: Wenn der KMS-Schlüssel oder die Berechtigung fehlt, kann der Cluster unzugänglich werden.

Vor produktiven Datenflüssen sollten Region, Auftragsverarbeitung, Aufbewahrung, Export, Löschung, Log-Inhalte und Schlüsselverantwortung dokumentiert werden. Backups brauchen eigene Verschlüsselungs- und Zugriffskontrollen; Encryption at Rest für lokale Clusterdateien verschlüsselt nicht automatisch jede exportierte Backup-Datei. Die aktuelle Lizenz- und Supportlage ist vor self-hosted Betrieb zu prüfen, da die frühere Core-Angebotsbezeichnung eingestellt wurde.

## Kosten und Auswahlkriterien

CockroachDB Cloud hat einen kostenlosen Basic-Einstieg, aber „kostenlos“ bedeutet nicht, dass jede Produktionsanforderung kostenlos bleibt. Die Rechnung hängt von Request Units oder bereitgestellten vCPUs, Storage, Regionen, Netzwerk und gewählter Sicherheits- und Supportstufe ab. Die aktuelle Preisseite führt Basic, Standard und Advanced; Standard und Advanced starten mit unterschiedlichen vCPU-Stundensätzen, die tatsächliche Nutzung und Konfiguration bestimmen die Gesamtkosten. Self-hosted verschiebt den Aufwand in Infrastruktur, On-Call, Upgrades, Backups und Spezialwissen.

## Redaktionelle Einschätzung

CockroachDB empfehlen wir Plattformteams mit einem klaren Bedarf an verteilten, transaktionalen Anwendungen und der Bereitschaft, Datenplatzierung, Retry-Logik und Restore regelmäßig zu üben. Wert entsteht, wenn globale Verfügbarkeit oder bewusst verteilte Betriebsgrenzen wichtiger sind als maximale Einfachheit.

Für eine regionale CRUD-Anwendung, ein kleines Team ohne Datenbank-On-Call oder ein System mit starkem PostgreSQL-Spezialökosystem ist PostgreSQL oft die vernünftigere Wahl. Entscheidend ist ein Test mit dem echten Schema und einer belastbaren Kosten- und Recovery-Annahme, nicht die Featureliste.

## Alternativen

- [PostgreSQL](/tools/postgresql/): Der pragmatische Standard für relationale Anwendungen in einer Region, mit sehr breitem Ökosystem und voller Kontrolle über den Betrieb.
- [Amazon Aurora](/tools/amazon-aurora/): Sinnvoll, wenn AWS-Integration und ein verwalteter relationaler Dienst wichtiger sind als eine CockroachDB-typische Multi-Region-Topologie.
- [Google Cloud Spanner](/tools/google-cloud-spanner/): Eine naheliegende Vergleichsoption für global verteilte relationale Systeme innerhalb des Google-Cloud-Ökosystems.
- [MongoDB](/tools/mongodb/): Passt besser zu dokumentenorientierten Datenmodellen, wenn relationale Joins und starke SQL-Kompatibilität nicht der Kernbedarf sind.

## FAQ

**Wann ist CockroachDB gegenüber PostgreSQL gerechtfertigt?**

Wenn mehrere Regionen, automatische Replikation und transaktionale Konsistenz ein echtes Produkt- oder Resilienzproblem lösen. Für eine einzelne Region mit überschaubarem Ausfallkonzept bringt PostgreSQL meist weniger Architektur- und Betriebsaufwand.

**Muss jede Anwendung Transaktions-Retries implementieren?**

Anwendungen müssen mit Retry-Fehlern rechnen, besonders bei `SERIALIZABLE` und konkurrierenden Schreibvorgängen. Der verwendete Treiber und das Transaktions-Pattern sollten deshalb früh unter Last getestet werden; die Datenbank kann nicht jede Anwendungsschleife automatisch korrekt wiederholen.

**Ist die Datenbank vollständig Open Source?**

Diese Kurzform ist für die aktuelle Lage irreführend. Cockroach Labs hat das frühere Core-Angebot Ende 2024 eingestellt und die Lizenzierung neuerer Binaries auf die CockroachDB Software License konsolidiert. Lizenztext und Nutzungsgrenzen sollten vor self-hosted oder eingebetteten Szenarien geprüft werden.

**Sind Cloud-Backups automatisch ausreichend für Disaster Recovery?**

Nein. Backups müssen gegen versehentliches Löschen geschützt, zugriffsbeschränkt und regelmäßig in einer passenden Zielumgebung wiederhergestellt werden. Prüfe zusätzlich Regionen, Geheimnisse, Schema-Version und die Fähigkeit der Anwendung, nach dem Restore wieder zu starten.

**Welche Cloud-Stufe sollte ein Team wählen?**

Das hängt vom Workload und den Anforderungen an Skalierung, private Konnektivität, Support, Compliance und Schlüsselkontrolle ab. Starte mit einem gemessenen Lastprofil und vergleiche Basic, Standard und Advanced auf der aktuellen Preisseite; eine pauschale Planempfehlung wäre ohne diese Daten unseriös.
