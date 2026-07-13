---
slug: amazon-msk
title: Amazon MSK
editorial_reviewed: true
editorial_reviewed_by: Utildesk manual editorial pass
editorial_reviewed_at: 2026-07-13
editorial_status: manual_polished
editorial_batch: 2026-07-13-full-editorial-coverage
lastReviewed: 2026-07-13
category: Developer
price_model: Usage-based
tags: [data, streaming, kafka, cloud]
official_url: "https://aws.amazon.com/msk/"
translation: full
---
# Amazon MSK

Amazon MSK is AWS's managed Apache Kafka service. AWS handles cluster control-plane operations while applications continue using normal Kafka clients to create topics and produce or consume records. That removes broker administration, not the harder work of an event system: contracts, partitioning, retention, access and replay.

## What MSK runs

MSK Provisioned provides Kafka clusters with Standard or Express brokers, where teams choose capacity and storage. MSK Serverless removes more capacity management and bills for cluster and partition time, data written and read, and storage. MSK Connect runs Kafka Connect connectors; MSK Replicator copies data between Provisioned clusters and regions.

MSK runs open-source Kafka versions, so existing clients and ecosystem tools are generally compatible. That helps migrations but is not a guarantee that every configuration or version upgrade is risk-free.

## When it fits

MSK is appropriate when Kafka is genuinely central to a data product: orders are processed as events, devices emit telemetry, independent services react asynchronously, or analytics needs a durable stream. AWS teams already using VPCs, IAM and CloudWatch get a more coherent operating model than self-managed brokers.

For a simple queue or a few background jobs, Kafka is often excessive. A queue or smaller pub/sub service will be easier to explain and operate. MSK is not a substitute for sound event design.

## Start with a durable small workflow

Start with one event and one consumer, not an enterprise bus. Define a versioned payload contract, a partition key, retention and error semantics. Deliberately test duplicates, a slow consumer, an unavailable consumer and a schema change. Kafka delivery can be at-least-once, so consumers need idempotency.

Give every topic an owner: who can publish, consume, change retention and delete it? Without that, topics and consumer groups turn into an opaque dependency graph. Monitor consumer lag, throughput, failures, storage and rebalancing, not broker CPU alone.

## Provisioned versus Serverless

Provisioned fits predictable workloads or cases requiring deliberate sizing and configuration. Serverless reduces capacity work, but partitions and data movement still drive cost. Choose from measured workload, retention and reader count, not the word "serverless".

Account for replication, connector workers, private connectivity and data transfer. Provisioned pricing includes broker time and storage; Serverless also charges cluster and partition time plus data read and written. A proof of concept using real event volumes beats an estimate based on API-call count.

## Security and operations

MSK runs in a VPC context. Restrict network paths and Kafka permissions to named producers and consumers, separate test from production, and treat event payloads as sensitive data. Encryption and authentication are necessary but do not replace data classification or a deletion and retention policy.

MSK can detect and handle common broker failures. It cannot fix poor consumer design: teams still need dead-letter strategy, replay windows, lag alerts and auditable backfills.

## Editorial Assessment

Amazon MSK is a sound choice for AWS teams with a real Kafka requirement. It removes substantial infrastructure work while retaining the Kafka ecosystem. The risk is inappropriate use: unclear event contracts and unowned topics become expensive and fragile even as a managed service.

We would first validate the business boundary and one small event. If it grows into independent consumers, replay requirements and persistent streams, MSK is credible. For ordinary job queues, a smaller service is usually the better choice.

## Alternatives

- [Apache Kafka](/en/tools/apache-kafka/) offers full control with self-managed ownership.
- [Confluent Platform](/en/tools/confluent-platform/) adds a broad Kafka ecosystem and governance tooling.
- [AWS Kinesis](/en/tools/aws-kinesis/) is better for AWS-native streaming where Kafka compatibility is not required.
- [Google Cloud Pub/Sub](/en/tools/google-cloud-pub-sub/) is a managed pub/sub route for Google Cloud teams.
- [Redpanda](/en/tools/redpanda/) is a Kafka-compatible alternative with a different operating architecture.

## FAQ

**Does MSK replace Kafka architecture work?**
No. MSK operates Kafka, while topic contracts, consumer behaviour and data ownership remain the team's responsibility.

**When is Serverless cheaper?**
It depends on partitions, data volume, retention and reads. Test with realistic throughput profiles.

**Can a consumer see duplicate records?**
Yes. Consumers should expect retries and be idempotent.

**What signals a poor start?**
Topics without owners, untested schemas, no lag alerts, and the belief that managed Kafka automatically creates business reliability.
