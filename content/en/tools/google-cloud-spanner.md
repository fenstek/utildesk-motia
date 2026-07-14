---
slug: google-cloud-spanner
title: Google Cloud Spanner
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Editorial"
editorial_reviewed_at: 2026-07-14
editorial_status: "manual_polished"
editorial_batch: "2026-07-14-optiplex-editorial-50"
category: Entwickler-Tools
price_model: Nutzungsbasiert
tags:
  - database
  - cloud
  - data
  - developer tools
official_url: "https://cloud.google.com/spanner"
description: "A managed distributed relational database for transactional systems that need global availability, deliberate data placement, and disciplined cost and operations design."
translation: full
popularity: 0
tier: "D"
generated_at: "2026-05-16"
updated_at: 2026-07-14
---
# Google Cloud Spanner

Google Cloud Spanner is a managed relational database for transactional applications that must remain available across failure domains or regions. It combines SQL, ACID transactions, and strong consistency with distributed replication. That is not a simple replacement for every PostgreSQL instance: schema, keys, latency, placement, recovery, and cost have to fit the application together.

<figure class="tool-editorial-figure">
  <img src="/images/tools/google-cloud-spanner-editorial.webp" alt="Engineers coordinate distributed data nodes across a nighttime infrastructure" loading="lazy" decoding="async" />
</figure>

## What Spanner is for

Spanner is aimed at product and platform teams that want regional, dual-region, or multi-region database topologies without patching database servers themselves. Global control-plane data, transactional SaaS systems, and applications with explicit availability or data-location requirements are plausible candidates. A small regional application without distributed requirements is often simpler and cheaper on PostgreSQL.

## The components that matter

The service consists of an instance, databases, tables, keys, indexes, and a chosen instance configuration. Teams choose between GoogleSQL and the PostgreSQL dialect, plan replicas, and provide compute capacity in processing units or nodes. Client libraries, connection pooling, schema migrations, monitoring, change streams, and backup storage are part of the real system; the database does not automatically solve those application and operating concerns.

## A practical rollout workflow

1. Describe the workload first: read and write patterns, transaction boundaries, key distribution, regional latency, and tolerable failure modes.
2. Model a schema with realistic identifiers, indexes, and access paths. Hotspots caused by concentrated or monotonic keys need to be visible before choosing a topology.
3. Create an isolated test instance and exercise migrations, client retries, timeouts, and concurrent transactions with real queries.
4. Compare the regional or multi-region configuration with data-location rules, RTO/RPO, and latency. Global replication is not appropriate for every table.
5. Before production, document roles, alerting, backup schedules, restore tests, and a controlled capacity or configuration-change procedure.

## Operations, integrations, and recovery

Spanner takes care of server operations, replication, and many maintenance tasks, but it does not remove operational ownership. The team still needs to watch schema changes, client libraries, transaction retries, quotas, query performance, and cost. Spanner can connect with Google Cloud services such as BigQuery, Dataflow, and Cloud Storage; each integration still needs an explicit data flow and its own permissions. Change streams are useful when changes must be delivered reliably to downstream systems.

Backups can be created on demand or through backup schedules and used for restore and point-in-time recovery. A backup is not a tested disaster-recovery plan: restore into an isolated database, reapply IAM, verify the schema version, and start the application regularly. Moving an instance configuration can also create temporary source and destination charges while the move is in progress.

## Evaluation and technical boundaries

Measure p95/p99 latency, throughput, abort and retry rates, hotspot behaviour, restore time, and cost with the real schema. A benchmark with uniformly random keys can hide a production problem caused by concentrated access. Also verify that the application handles transient failures and that the chosen dialect supports the required SQL and driver behaviour.

Strong consistency and global availability have costs in latency, replication traffic, and capacity. Spanner has no local or self-hosted edition that simply reproduces the cloud operating model. For analytical workloads, unstructured documents, or a manageable single-region application, a specialised or conventional database may be the better boundary.

## Security, privacy, and governance

Access is controlled through Google Cloud IAM and database roles; service accounts should receive only the permissions their workload needs. Google Cloud encrypts data by default, and customer-managed encryption keys (CMEK) through Cloud KMS can be used where required. Network paths, audit logs, administrative roles, and CI/CD access deserve a separate governance review. Losing key access or applying the wrong IAM change can interrupt data access.

Before production data enters the service, document region, processing agreements, retention, export, deletion, log content, and backup access. Replication and backups can place data in multiple locations, so the selected configuration must match internal and regulatory requirements. Keep test data, production data, and support access separate.

## Costs and decision criteria

The bill is not one database price. Google Cloud charges for items including provisioned compute capacity, database and backup storage, data replication, and outbound network traffic; regional and multi-region configurations differ. Optional read-only replicas and the selected edition and support scope change the total. Use the current official pricing calculator for figures rather than treating a time-sensitive number as product documentation.

Before deciding, model minimum capacity, peaks, storage growth, replication layout, and the recovery budget. A small proof of concept should therefore include a credible estimate and a shutdown plan. The managed service reduces server work, not schema design, monitoring, or cloud-governance work.

## Editorial Assessment

We recommend Google Cloud Spanner to platform teams with a demonstrated need for distributed relational consistency, multiple failure domains, or a controlled global topology. Its value is clearest when availability, data placement, and reduced server operations matter more than the lowest entry complexity.

For one region, a small team without database on-call coverage, or a system heavily dependent on PostgreSQL extensions, PostgreSQL is often the better choice. Decide with the real schema, measured workload, rehearsed restore, and a full lifecycle cost model.

## Alternatives

- [PostgreSQL](/en/tools/postgresql/): The simpler default for regional relational applications when the team can control operations and scaling.
- [CockroachDB](/en/tools/cockroachdb/): A close comparison for distributed SQL workloads, with a different cloud, licensing, and self-hosting decision.
- [Amazon Aurora](/en/tools/amazon-aurora/): A better fit when AWS integration and a managed relational service matter more than Spanner's global topology.
- [MongoDB](/en/tools/mongodb/): Better aligned with document-oriented models where relational joins are not the central access pattern.

## FAQ

**When is Spanner justified over PostgreSQL?**

When multiple regions or failure domains, relational transactions, and a managed global topology solve a concrete product or resilience problem. For one region, PostgreSQL usually brings less architectural and cost overhead.

**Does the application need to handle transaction retries?**

Yes. Distributed transactions can need retries because of contention or transient failures. Test the driver, transaction boundaries, and retry strategy under load; a happy path is not enough.

**Is Spanner a serverless database with no capacity planning?**

No. Server operations are managed, but compute capacity, storage, replicas, and networking still cost money and need monitoring. Autoscaling or manual changes do not replace a workload model.

**How reliable are backups and point-in-time recovery?**

They are important building blocks, not proof of disaster recovery. Practise the restore, permissions, target region, schema migrations, and application restart in an isolated environment.

**Can Spanner run on-premises?**

No. Spanner is a Google Cloud service. Teams needing a local or self-managed database must evaluate another technology and its own replication and operating model.
