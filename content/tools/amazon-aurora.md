---
slug: amazon-aurora
title: Amazon Aurora
editorial_reviewed: true
editorial_reviewed_by: Utildesk Redaktion
editorial_reviewed_at: 2026-07-31
editorial_status: manual_polished
editorial_batch: 2026-07-31-story-card-refresh-50
category: Entwickler-Tools
price_model: Nutzungsbasiert
tags: [database, cloud, postgresql, mysql, aws]
official_url: "https://aws.amazon.com/rds/aurora/"
popularity: 0
tier: D
generated_at: 2026-05-16
updated_at: 2026-07-31
description: "Amazon Aurora ist ein verwalteter relationaler Datenbankdienst für skalierbare Anwendungen mit Fokus auf Verfügbarkeit und AWS-Integration."
---
# Amazon Aurora

Ein SaaS-Team beobachtet bei Lasttests hohe I/O-Wartezeiten und möchte zugleich den Datenbank-Failover üben. Es erstellt eine isolierte Kopie, spielt repräsentative Abfragen ein, prüft Treiberkompatibilität und misst Wiederanlauf sowie Kosten. Vor dem Produktionswechsel werden Restore und Fallback dokumentiert. Amazon Aurora kann viel Betriebsarbeit abnehmen; es ersetzt weder ein passendes Datenmodell noch Lasttests und Kostenkontrolle.

Amazon Aurora ist der verwaltete relationale Datenbankdienst von AWS für MySQL- und PostgreSQL-kompatible Workloads. Er richtet sich an Anwendungen, die eine relationale Datenbank betreiben müssen, aber Infrastruktur, Backups, Replikation und Failover nicht vollständig selbst verwalten möchten. Aurora ist kein allgemeiner Ersatz für jede Datenbank: Die Entscheidung betrifft Architektur, Betrieb, Kostenmodell und AWS-Bindung zugleich.

Für Teams mit einer bestehenden PostgreSQL- oder MySQL-Anwendung kann Aurora ein sinnvoller Weg zu mehr Ausfallsicherheit und Skalierung sein. Kompatibel bedeutet allerdings nicht, dass jede Erweiterung, jeder Versionssprung und jede Betriebsannahme unverändert übernommen werden kann. Ein Migrations- und Lasttest bleibt Pflicht.

<figure class="tool-editorial-figure">
  <img src="/images/tools/amazon-aurora-editorial.webp" alt="Nächtliches Aquarell-Observatorium mit synchronisierten Gipfeln" loading="lazy" decoding="async" />
</figure>

## Wann Aurora passt

Aurora passt zu transaktionalen Webanwendungen, SaaS-Produkten und internen Systemen, bei denen PostgreSQL oder MySQL bereits eine natürliche Wahl ist und AWS der bevorzugte Betriebsstack bleibt. Lesereplikate, Multi-AZ-Betrieb, automatische Sicherungen und regionale Ausfallszenarien können dann als Plattformfunktionen genutzt werden.

Für eine kleine Anwendung mit stabiler Last kann verwaltetes PostgreSQL einfacher und günstiger sein. Für extrem verteilte, global schreibende Systeme oder eine Datenbankstrategie ohne AWS-Abhängigkeit sollte die Architektur gegen andere Managed- und Open-Source-Optionen getestet werden.

## Wichtige Betriebsoptionen

- **PostgreSQL- oder MySQL-kompatible Edition:** Das Datenmodell und vorhandene Anwendungscode können sich an vertrauten Engines orientieren.
- **Provisionierte Instanzen:** Planbar für gleichmäßige Lasten, mit Instanzgröße, Replikaten und reservierten Kapazitäten als Kostenhebeln.
- **Aurora Serverless:** Kapazität wird in ACUs nach Bedarf skaliert; sinnvoll für stark schwankende oder schwer prognostizierbare Last.
- **Read Replicas und Multi-AZ:** Leselast und Verfügbarkeit lassen sich über Replikate in mehreren Availability Zones gestalten.
- **Global Database:** Für länderübergreifenden Zugriff und Disaster Recovery steht eine regionsübergreifende Architektur zur Verfügung.
- **Sicherung und Wiederherstellung:** Backups und Point-in-Time Recovery reduzieren Betriebsaufwand, ersetzen aber keinen geprüften Wiederanlaufplan.

## Ein belastbarer Migrationsplan

Zuerst die reale Datenbank vermessen: größte Tabellen, Spitzenabfragen, Locks, Schreiblast, Batch-Jobs, Extensions und Recovery-Ziele. Danach eine Kopie mit Produktionstypischem Datenvolumen migrieren und nicht nur den Anwendungstest, sondern auch Failover, Wiederherstellung und Connection-Pooling testen.

Vor dem Go-live gehören klare Kennzahlen fest: p95-Latenz wichtiger Queries, Fehlerrate, Replikationsverzug, Recovery-Zeit und monatliche Kostengrenze. Alarme für CPU, Verbindungen, Speicher, I/O und Budget sind kein nachträglicher Luxus. Gerade serverlose Skalierung schützt nicht automatisch vor ineffizienten Queries oder zu vielen offenen Verbindungen.

## Redaktionelle Einschätzung

Aurora ist überzeugend, wenn ein Team die Vorteile einer AWS-verwalteten relationalen Datenbank wirklich nutzt: Hochverfügbarkeit, Backups, Replikation und beobachtbarer Betrieb. Es spart Arbeit an der Infrastruktur, aber nicht an Datenmodell, Indizes, Zugriffsrechten und Performanceanalyse.

Wir würden Aurora für eine klar definierte PostgreSQL- oder MySQL-Workload mit verantwortlichem Datenbankbetrieb empfehlen. Vorbehalt gilt bei einem reinen Lift-and-Shift ohne Lasttest sowie bei Teams, die den späteren Ausstieg aus AWS nicht mitdenken. In beiden Fällen kann die scheinbar einfache Migration teuer werden.

## Kosten und Governance

Die Rechnung besteht je nach Konfiguration aus Datenbankkapazität, Speicher und optionalen Funktionen. Bei Aurora Standard werden I/O-Vorgänge separat abgerechnet; Aurora I/O-Optimized verändert dieses Verhältnis zugunsten I/O-intensiver Lasten. Serverless rechnet Kapazität in ACUs ab, provisionierte Cluster nach Instanznutzung. Region, Replikate, Backup-Aufbewahrung und Datentransfer gehören in die Kalkulation.

Für produktive Datenbanken müssen IAM- und Netzwerkzugänge, Verschlüsselung, Secrets, Backup-Aufbewahrung und Zugriff auf Wiederherstellungen dokumentiert sein. Entscheidend ist nicht nur, dass eine Sicherung existiert, sondern dass ein Team einen Wiederanlauf unter Zeitdruck geprobt hat.

## Alternativen

- [PostgreSQL](/tools/postgresql/): für Teams, die volle Kontrolle und einen portableren Betrieb bevorzugen.
- [CockroachDB](/tools/cockroachdb/): für verteiltes SQL und Mehrregionen-Architekturen außerhalb des Aurora-Modells.
- MongoDB Atlas: wenn ein dokumentorientiertes Datenmodell fachlich besser passt.
- [Snowflake](/tools/snowflake/): für analytische Datenarbeit statt transaktionaler Anwendungslast.
## FAQ

**Ist Aurora identisch mit PostgreSQL oder MySQL?**

Nein. Aurora bietet kompatible Editionen, ist aber ein AWS-verwalteter Dienst mit eigener Speicher- und Betriebsarchitektur. Kompatibilität sollte mit der eigenen Version, Erweiterungen und Queries geprüft werden.

**Wann lohnt sich Aurora Serverless?**

Bei stark schwankender Last, Entwicklungsumgebungen oder Workloads, deren Kapazität schwer zu planen ist. Bei dauerhaft hoher, stabiler Last können provisionierte Instanzen besser kalkulierbar sein.

**Ersetzen automatische Backups einen Disaster-Recovery-Test?**

Nein. Entscheidend ist, ob Wiederherstellung, Zugangsdaten, Anwendungskonfiguration und Datenkonsistenz unter realistischen Bedingungen funktionieren.

**Was ist der häufigste Kostenfehler?**

Nur die Grundinstanz zu kalkulieren. Replikate, I/O-Modell, Speicher, Backups, Datentransfer und dauerhaft zu groß gewählte Kapazität müssen mitgerechnet und überwacht werden.
