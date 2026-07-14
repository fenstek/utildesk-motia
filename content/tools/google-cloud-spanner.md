---
slug: google-cloud-spanner
title: Google Cloud Spanner
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Redaktion"
editorial_reviewed_at: 2026-07-14
editorial_status: "manual_polished"
editorial_batch: "2026-07-14-optiplex-editorial-50"
category: Entwickler-Tools
price_model: Nutzungsbasiert
tags: [database, cloud, data, developer-tools]
official_url: "https://cloud.google.com/spanner"
description: "Verteilte relationale Cloud-Datenbank für transaktionale Systeme mit globaler Verfügbarkeit, klarer Datenplatzierung und bewusstem Kosten- und Betriebsdesign."
popularity: 0
tier: "D"
generated_at: "2026-05-16"
updated_at: 2026-07-14
---
# Google Cloud Spanner

Google Cloud Spanner ist eine verwaltete relationale Datenbank für transaktionale Anwendungen, die über Ausfallzonen oder Regionen verfügbar bleiben müssen. Sie verbindet SQL, ACID-Transaktionen und starke Konsistenz mit verteilter Replikation. Das ist kein einfacher Ersatz für jede PostgreSQL-Instanz: Datenmodell, Schlüssel, Latenz, Region, Recovery und Kosten müssen gemeinsam zur Anwendung passen.

<figure class="tool-editorial-figure">
  <img src="/images/tools/google-cloud-spanner-editorial.webp" alt="Ingenieure koordinieren verteilte Datenknoten in einer nächtlichen Infrastruktur" loading="lazy" decoding="async" />
</figure>

## Was ist Spanner und für wen?

Spanner richtet sich an Plattform- und Produktteams, die eine relationale Datenbank mit regionaler, dual-regionaler oder multiregionaler Topologie betreiben wollen, ohne Datenbankserver selbst zu patchen. Globale Kontroll- und Kontodaten, transaktionale SaaS-Systeme und Anwendungen mit klaren Verfügbarkeits- oder Datenresidenzanforderungen sind plausible Kandidaten. Eine kleine regionale Anwendung ohne verteilte Anforderungen ist oft mit PostgreSQL einfacher und günstiger.

## Welche Bausteine gehören zum Dienst?

Zum Dienst gehören eine Spanner-Instanz, Datenbanken, Tabellen, Schlüssel und Indizes sowie eine gewählte Instance Configuration. Teams entscheiden zwischen GoogleSQL und dem PostgreSQL-Dialekt, planen Replikate und definieren die benötigte Compute-Kapazität in Processing Units oder Nodes. Client-Bibliotheken, Connection-Pooling, Schema-Migrationen, Monitoring, Change Streams und Backup-Speicher sind Teil des realen Systems, aber nicht automatisch durch die Datenbankanwendung gelöst.

## Praktischer Einführungs-Workflow

1. Zuerst den Workload beschreiben: Schreib- und Lesemuster, Transaktionsgrenzen, Schlüsselverteilung, regionale Latenzen und tolerierbare Ausfälle.
2. Ein Schema mit realistischen IDs, Indizes und Zugriffspfaden modellieren. Monotone Schlüssel oder Hotspots müssen unter Last sichtbar werden, bevor die Topologie festgelegt wird.
3. Eine isolierte Testinstanz anlegen und Migrationen, Client-Retries, Zeitüberschreitungen sowie konkurrierende Transaktionen mit echten Abfragen prüfen.
4. Die gewünschte regionale oder multiregionale Konfiguration gegen Datenresidenz, RTO/RPO und Latenz abgleichen. Globale Replikation ist nicht für jede Tabelle sinnvoll.
5. Erst vor dem produktiven Rollout Rollen, Alarmierung, Backup-Zeitplan, Restore-Probe und einen kontrollierten Kapazitäts- oder Konfigurationswechsel dokumentieren.

## Betrieb, Integration und Wiederherstellung

Spanner nimmt Serverbetrieb, Replikation und viele Wartungsaufgaben ab, ersetzt aber keine Betriebsverantwortung. Das Team muss Schemaänderungen, Clientbibliotheken, Transaktions-Retries, Quoten, Query-Performance und Kosten beobachten. Spanner lässt sich mit Google-Cloud-Diensten wie BigQuery, Dataflow und Cloud Storage verbinden; jede Integration braucht dennoch einen klaren Datenfluss und eigene Berechtigungen. Change Streams sind sinnvoll, wenn Änderungen zuverlässig an nachgelagerte Systeme weitergegeben werden sollen.

Backups können manuell oder über Backup-Schedules erstellt und für Wiederherstellung beziehungsweise Point-in-Time Recovery genutzt werden. Ein Backup ist kein getestetes Disaster-Recovery-Verfahren: Restore in eine getrennte Datenbank, IAM-Neuvergabe, Schema-Version und Anwendungsstart müssen regelmäßig geprobt werden. Auch ein Wechsel der Instance Configuration kann während der Bewegung vorübergehend Kosten für Quelle und Ziel verursachen.

## Evaluation und technische Grenzen

Bewertet werden sollten p95/p99-Latenz, Durchsatz, Abbruch- und Retry-Rate, Hotspot-Verhalten, Restore-Zeit und Kosten unter dem echten Schema. Ein Benchmark mit gleichmäßig zufälligen Schlüsseln kann ein Produktionsproblem mit konzentrierten Zugriffen verschleiern. Prüfe außerdem, ob die Anwendung mit temporären Fehlern umgehen kann und ob der gewählte Dialekt alle benötigten SQL- und Treiberfunktionen abdeckt.

Starke Konsistenz und globale Verfügbarkeit haben einen Preis in Latenz, Replikationsverkehr und Kapazität. Spanner bietet keine lokale oder selbst gehostete Variante, die den Cloud-Betriebsvertrag einfach ersetzt. Für analytische Abfragen, unstrukturierte Dokumente oder eine überschaubare Ein-Region-Anwendung ist eine spezialisierte oder klassische Datenbank häufig die passendere Grenze.

## Sicherheit, Datenschutz und Governance

Zugriffe werden über Google Cloud IAM und Datenbankrollen gesteuert; Servicekonten sollten nur die für ihren Workload nötigen Rechte erhalten. Google Cloud verschlüsselt Daten standardmäßig, und je nach Anforderung können kundenseitig verwaltete Schlüssel (CMEK) über Cloud KMS eingesetzt werden. Netzwerkpfade, Audit-Logs, Admin-Rollen und der Zugriff von CI/CD gehören in eine getrennte Governance-Prüfung. Ein Schlüsselverlust oder eine falsche IAM-Änderung kann den Datenzugriff beeinträchtigen.

Vor dem produktiven Import sollten Region, Auftragsverarbeitung, Aufbewahrung, Export, Löschung, Log-Inhalte und Backup-Zugriffe dokumentiert werden. Replikation und Backups können Daten an mehrere Orte bringen; die gewählte Konfiguration muss deshalb mit internen und rechtlichen Vorgaben übereinstimmen. Testdaten, Produktionsdaten und Supportzugriffe sollten getrennt behandelt werden.

## Kosten und Auswahlkriterien

Die Rechnung besteht nicht aus einem einzigen Datenbankpreis. Google Cloud berechnet unter anderem bereitgestellte Compute-Kapazität, Datenbank- und Backup-Speicher, Datenreplikation sowie ausgehenden Netzwerkverkehr; regionale und multiregionale Konfigurationen unterscheiden sich. Optional eingesetzte Read-only-Replikate und der konkrete Edition- und Supportumfang verändern die Gesamtkosten. Die aktuellen Werte gehören in den offiziellen Preisrechner, nicht als zeitlose Zahl in eine Toolbeschreibung.

Vor der Entscheidung sollte das Team eine Kapazitätsuntergrenze, erwartete Spitzen, Speicherwachstum, Replikationslayout und Restore-Budget modellieren. Ein kleiner Proof of Concept muss deshalb auch eine belastbare Rechnung und einen Abschaltplan enthalten. Die verwaltete Oberfläche spart Serverarbeit, aber nicht Modellierungs-, Monitoring- und Cloud-Governance-Aufwand.

## Redaktionelle Einschätzung

Wir empfehlen Google Cloud Spanner Plattformteams mit einem nachweisbaren Bedarf an verteilter relationaler Konsistenz, mehreren Fehlerdomänen oder einer kontrollierten globalen Topologie. Wert entsteht, wenn Verfügbarkeit, Datenplatzierung und der reduzierte Serverbetrieb wichtiger sind als die niedrigste Einstiegskomplexität.

Für eine einzelne Region, ein kleines Team ohne Datenbank-On-Call oder ein System, das stark auf PostgreSQL-Erweiterungen angewiesen ist, ist PostgreSQL meist die vernünftigere Wahl. Entscheidend sind ein Test mit dem echten Schema, ein gemessener Workload, ein geübter Restore und eine Rechnung über den gesamten Lebenszyklus.

## Alternativen

- [PostgreSQL](/tools/postgresql/): Der einfachere Standard für relationale Anwendungen in einer Region, wenn das Team Betrieb und Skalierung selbst kontrollieren kann.
- [CockroachDB](/tools/cockroachdb/): Vergleichbar interessant für verteilte SQL-Workloads, mit anderer Produkt-, Lizenz- und Betriebsentscheidung zwischen Cloud und Self-hosting.
- [Amazon Aurora](/tools/amazon-aurora/): Passender, wenn AWS-Integration und ein verwalteter relationaler Dienst wichtiger sind als Spanners globale Topologie.
- [MongoDB](/tools/mongodb/): Die passendere Richtung für dokumentenorientierte Modelle, bei denen relationale Joins nicht der zentrale Zugriffspfad sind.

## FAQ

**Wann ist Spanner gegenüber PostgreSQL gerechtfertigt?**

Wenn mehrere Regionen oder Fehlerdomänen, relationale Transaktionen und eine verwaltete globale Topologie ein konkretes Produkt- oder Resilienzproblem lösen. Für eine Ein-Region-Anwendung bringt PostgreSQL meist weniger Architektur- und Kostenaufwand.

**Muss die Anwendung Transaktions-Retries behandeln?**

Ja. Verteilte Transaktionen können wegen Konkurrenz oder temporärer Fehler wiederholt werden müssen. Treiber, Transaktionsgrenzen und Retry-Strategie sollten unter Last getestet werden; ein Happy Path genügt nicht.

**Ist Spanner eine serverlose Datenbank ohne Kapazitätsplanung?**

Nein. Der Serverbetrieb ist verwaltet, aber Compute-Kapazität, Speicher, Replikate und Netzwerk verursachen Kosten und müssen beobachtet werden. Autoscaling oder manuelle Anpassungen ersetzen kein Lastprofil.

**Wie belastbar sind Backups und Point-in-Time Recovery?**

Sie sind wichtige Bausteine, aber kein Beweis für Disaster Recovery. Restore, Berechtigungen, Zielregion, Schema-Migrationen und der Neustart der Anwendung müssen in einer getrennten Umgebung geprobt werden.

**Kann Spanner on-premises betrieben werden?**

Nein. Spanner ist ein Google-Cloud-Dienst. Wer eine lokale oder selbst betriebene Datenbank benötigt, muss eine andere Technologie mit einem eigenen Replikations- und Betriebsmodell evaluieren.
