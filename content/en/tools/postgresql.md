---
slug: postgresql
title: PostgreSQL
editorial_reviewed: true
editorial_reviewed_by: Utildesk manual editorial pass
editorial_reviewed_at: 2026-07-13
editorial_status: manual_polished
editorial_batch: 2026-07-13-tool-quality-campaign-04
category: Developer
price_model: Open Source
tags: [database, open-source, developer-tools, sql]
official_url: "https://www.postgresql.org/"
description: "PostgreSQL is an open-source relational database for transactional applications, complex queries, and extensible data models."
translation: full
---
# PostgreSQL

PostgreSQL is an open-source relational database for applications needing reliable transactions, data integrity, and complex queries. It handles classic business entities alongside JSON data, full-text search, and extensions such as PostGIS. Its strength is a solid data core, not solving every data problem without modelling.

## Who is PostgreSQL for?

PostgreSQL suits product catalogues, users and permissions, orders, internal tools, analytical queries, and many SaaS backends. Small applications gain the same transactional guarantees as larger systems. For a local single-file application, [SQLite](/en/tools/sqlite/) is often simpler; for purely document-centred data or very specific scale, another store can be better.

## Model data before optimising

Begin with clear entities, keys, constraints, and a traceable migration strategy. A foreign key or unique constraint prevents errors earlier and more reliably than later application code. JSONB is useful for flexible attributes, but should not be an excuse to leave core relationships and queries unmodelled.

## Queries and indexes

Indexes accelerate specific access patterns while adding storage and write cost. Measure slow real queries with explain and analysis instead of indexing every filter by default. Review indexes, statistics, and queries after product changes to ensure they still match the data model.

## Migration, backups, and recovery

Every schema change needs a tested forward path and, where possible, a rollback path. Large tables, new required fields, and index changes can create locks or long execution time. Backups only count when restoration is regularly rehearsed in a separate environment. Replication is not a backup against accidental deletion.

## Permissions and operations

The application should not connect as a superuser. Separate migration, application, reporting, and operations roles; keep credentials as secrets. Monitor connections, storage pressure, long transactions, error rates, and backup state. Managed PostgreSQL reduces infrastructure work, not responsibility for model, access, or cost.

## Alternatives to PostgreSQL

- [MySQL](/en/tools/mysql/): when the existing stack and managed offers already centre on it.
- [SQLite](/en/tools/sqlite/): for local, embedded, or very small standalone applications.
- [MongoDB](/en/tools/mongodb/): when document-centred data and access patterns are genuinely primary.
- [Supabase](/en/tools/supabase/): when PostgreSQL is used as a platform with auth, storage, and API components.

## Editorial assessment

PostgreSQL is a strong default foundation for many new business and product applications. The decisive factor is not an exotic extension but disciplined practice around models, migrations, least privilege, and tested recovery. Teams that handle those gain a durable core.

## FAQ

**Is JSONB a replacement for relational tables?**

Not for central relationships, integrity, and frequent queries. JSONB complements a data model; it does not excuse avoiding one.

**Why must backups be restored in testing?**

Only a restore test proves that data, keys, permissions, and the operational process work when needed.

**When is managed PostgreSQL useful?**

When a team wants to reduce infrastructure work. Migration, permissions, cost, and data responsibility still remain with the customer.
