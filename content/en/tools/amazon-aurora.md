---
slug: amazon-aurora
title: Amazon Aurora
editorial_reviewed: true
editorial_reviewed_by: Utildesk manual editorial pass
editorial_reviewed_at: 2026-07-13
editorial_status: manual_polished
editorial_batch: 2026-07-13-full-editorial-coverage
category: Developer
price_model: Usage-based
tags: [database, cloud, postgresql, mysql, aws]
official_url: "https://aws.amazon.com/rds/aurora/"
popularity: 0
translation: full
lastReviewed: 2026-07-13
---
# Amazon Aurora

Amazon Aurora is AWS's managed relational database service for MySQL- and PostgreSQL-compatible workloads. It is intended for applications that need a relational database without owning all of the underlying infrastructure, backups, replication, and failover. Aurora is not a universal replacement for every database: adopting it is an architecture, operations, cost, and AWS-commitment decision at the same time.

For teams with an existing PostgreSQL or MySQL application, Aurora can be a sensible route to higher availability and scale. Compatibility does not mean that every extension, version upgrade, or operating assumption transfers unchanged. A migration and load test are still essential.

<figure class="tool-editorial-figure">
  <img src="/images/tools/amazon-aurora-editorial.webp" alt="a nocturnal watercolor observatory with synchronized peaks" loading="lazy" decoding="async" />
</figure>

## When Aurora fits

Aurora fits transactional web applications, SaaS products, and internal systems where PostgreSQL or MySQL is already a natural choice and AWS remains the preferred operating stack. Read replicas, Multi-AZ operation, automatic backups, and regional failure scenarios can then be used as platform capabilities.

For a small application with stable load, managed PostgreSQL may be simpler and less expensive. For highly distributed, globally write-heavy systems, or a database strategy that avoids AWS dependence, test the architecture against other managed and open-source options.

## Key operating choices

- **PostgreSQL- or MySQL-compatible editions:** Data models and existing application code can build on familiar engines.
- **Provisioned instances:** Predictable for steady workloads, with instance size, replicas, and reserved capacity as cost levers.
- **Aurora Serverless:** Capacity scales in ACUs with demand, useful for volatile or difficult-to-predict load.
- **Read replicas and Multi-AZ:** Read workload and availability can be shaped through replicas in multiple Availability Zones.
- **Global Database:** AWS provides cross-region architecture for global access and disaster recovery.
- **Backup and recovery:** Backups and point-in-time recovery reduce operational work, but do not replace a tested recovery plan.

## A robust migration plan

Measure the real database first: largest tables, peak queries, locks, write volume, batch jobs, extensions, and recovery objectives. Then migrate a copy with production-like data volume and test not only the application, but also failover, restore, and connection pooling.

Set explicit measures before going live: p95 latency for important queries, error rate, replication lag, recovery time, and a monthly cost limit. Alerts for CPU, connections, storage, I/O, and budget are not a later luxury. Serverless scaling does not automatically protect against inefficient queries or too many open connections.

## Editorial Assessment

Aurora is compelling when a team genuinely uses the advantages of an AWS-managed relational database: high availability, backups, replication, and observable operations. It removes infrastructure work, not the need for a sound data model, indexes, access controls, and performance analysis.

We would recommend Aurora for a clearly scoped PostgreSQL or MySQL workload with accountable database operations. Be cautious with a lift-and-shift that skips load testing, or a team that does not plan for a future AWS exit. In both cases, the apparently easy migration can become expensive.

## Cost and governance

Depending on configuration, the bill includes database capacity, storage, and optional capabilities. Aurora Standard bills I/O operations separately, while Aurora I/O-Optimized changes that trade-off for I/O-intensive workloads. Serverless charges capacity in ACUs; provisioned clusters charge for instance use. Region, replicas, backup retention, and data transfer all belong in the estimate.

For production data, document IAM and network access, encryption, secrets, backup retention, and who may perform restores. What matters is not merely that a backup exists, but that the team has practised a recovery under time pressure.

## Alternatives

- [PostgreSQL](/en/tools/postgresql/) is the reference choice when full control or self-managed operation matters more than AWS-managed features.
- [Supabase](/en/tools/supabase/) combines PostgreSQL with authentication, APIs, and a product-focused developer platform.
- [CockroachDB](/en/tools/cockroachdb/) is worth evaluating for teams comparing distributed SQL and multi-region resilience independently of Aurora.
- [MongoDB Atlas](/en/tools/mongodb-atlas/) is an alternative when the actual problem suits a document-oriented data model better.

## FAQ

**Is Aurora identical to PostgreSQL or MySQL?**

No. Aurora provides compatible editions but is an AWS-managed service with its own storage and operating architecture. Test the specific version, extensions, and queries you use.

**When is Aurora Serverless worthwhile?**

For volatile load, development environments, or workloads with difficult capacity planning. For permanently high, steady load, provisioned instances can be easier to forecast.

**Do automatic backups replace a disaster-recovery test?**

No. The restore, credentials, application configuration, and data consistency all have to work under realistic conditions.

**What is the most common cost mistake?**

Pricing only the base instance. Replicas, the I/O model, storage, backups, data transfer, and permanently oversized capacity must all be included and monitored.
