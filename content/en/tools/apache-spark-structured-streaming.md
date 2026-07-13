---
slug: apache-spark-structured-streaming
title: Apache Spark Structured Streaming
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Editorial"
editorial_reviewed_at: 2026-07-13
editorial_status: "manual_polished"
editorial_batch: "2026-07-13-full-editorial-coverage"
category: Developer Tools
price_model: Open Source
tags: [data, streaming, batch, etl, open-source]
official_url: 'https://spark.apache.org/docs/latest/structured-streaming-programming-guide.html'
popularity: 0
source_language: de
translation: full
lastReviewed: 2026-07-13
updated_at: 2026-07-13
description: 'A practical guide to Spark Structured Streaming: DataFrames, micro-batches, watermarks, checkpoints, sinks, cost, and operational limits.'
---
# Apache Spark Structured Streaming

Apache Spark Structured Streaming is Spark SQL's streaming layer. A team describes a computation with DataFrames or Datasets and starts it with `readStream` and `writeStream`; Spark then executes the plan incrementally instead of forcing separate programming models for batch and streaming. Scala, Java, Python, and R are supported. This makes it relevant for data-engineering teams that already use Spark and need to process events, tables, and historical data in one environment.

The name should not be mistaken for a fully managed platform. Structured Streaming is a framework within the Spark ecosystem. Clusters, permissions, durable checkpoint storage, source and sink systems, monitoring, and on-call ownership remain responsibilities of the team or chosen provider.

## Who is Structured Streaming for?

It fits teams that continuously process incoming data with Spark SQL transformations, aggregations, joins, or time windows. Examples include sensor and telemetry events, CDC feeds, log enrichment, rolling metrics, and prepared data handed to analytics or machine-learning pipelines.

It is less suitable as the first building block for one small consumer or for workloads with extremely strict millisecond latency requirements. If the main need is message transport, an event platform comes first and a Spark compute engine may be unnecessary. If the workload is deeply stateful stream processing, Apache Flink deserves a serious comparison.

<figure class="tool-editorial-figure">
  <img src="/images/tools/apache-spark-structured-streaming-editorial.webp" alt="Illustration for Apache Spark Structured Streaming: data flow branches into a glowing river delta with checkpoints" loading="lazy" decoding="async" />
</figure>

## How the model works

By default, Structured Streaming processes new data in small micro-batches. The query still looks like a declarative DataFrame computation; triggers determine when Spark starts new work. Depending on the selected output mode, results and state are written to a sink. Continuous Processing offers lower latency, but it has different limitations and at-least-once guarantees, so it is not a universal production switch.

Event-time workloads depend on windows and watermarks. A watermark lets the engine account for late events up to an explicit threshold and clean up old state. This is a business decision: a short threshold can discard legitimate late events, while a long threshold retains more state and increases storage and recovery work.

## Typical use cases

- **Rolling aggregation:** Events from Kafka or files are grouped by time window and business key, then written as updated metrics.
- **Event enrichment:** A stream is joined with reference data, normalised, validated, and written to an analytics format.
- **CDC and log pipelines:** Changes or log lines are transformed and forwarded to a lake, warehouse, or Kafka topic.
- **Available-now processing:** A bounded backlog is processed with streaming code in several micro-batches and the query then stops.
- **Replay and recovery:** A replayable source, durable checkpoint, and idempotent sink can support safe restarts instead of blind duplicate writes.

## Key features

- **Unified API model:** DataFrames and Datasets connect batch and streaming code, although not every batch operation is supported in streaming queries.
- **Sources and sinks:** Built-in integrations include files, Kafka, and test sources; files, Kafka, `foreach`, and debugging sinks are common output paths.
- **Output modes:** Append, Update, and Complete describe whether new rows, changed rows, or the whole result table is written. Query shape determines which modes are valid.
- **Stateful processing:** Aggregations, windows, joins, and custom state logic can retain state across triggers.
- **Fault tolerance:** Offsets, state, and progress are recorded through checkpointing and write-ahead logs. The checkpoint needs durable storage with correct access controls.
- **Operational visibility:** `StreamingQuery` and progress data expose input volume, rates, duration, state operators, and failure signals for dashboards and alerts.

## Advantages and limitations

### Advantages

- A familiar Spark SQL model for teams already operating batch workloads.
- One code path for many batch and streaming transformations reduces duplicated logic.
- Event time, watermarks, windows, aggregations, and joins cover common analytical cases.
- Open source with a broad Spark ecosystem; licensing is not the main cost driver.
- Checkpoints and replayable sources can enable robust restarts when the sink also behaves correctly.

### Limitations

- Cluster operations, storage, upgrades, schema changes, and on-call work are not solved automatically.
- Exactly-once is a property of the source, engine, and sink together, not a promise made by every connector.
- `foreachBatch` is at-least-once by default; use its `batchId` for deduplication when stronger semantics are required.
- Stateful queries can consume substantial memory and recovery time when watermarks or key cardinality are poorly chosen.
- Debug and memory sinks are for testing, not durable, fault-tolerant production delivery.

## A practical pilot

Do not begin with an abstract benchmark. Take one bounded real path: source, schema, transformation, sink, and a measurable outcome. Record throughput, end-to-end latency, backlog, state size, late and duplicate events, and time to resume after an intentional restart.

Then test at least one schema change, a temporarily unavailable sink, and a replay. Decide in advance which duplicates are acceptable, who owns the checkpoint, and how a failed batch is retried. Only when those cases are observable is the pipeline more than a demo.

## Privacy, security, and cost

Spark processes data in infrastructure operated by you or by a provider. Clarify network paths, encryption, IAM roles, secret management, logs, checkpoint access, and retention. Checkpoints can contain sensitive state and offsets. For personal data, deletion and replay rules belong in the architecture, not only in a privacy notice.

Apache Spark is open source, so Structured Streaming has no separate license fee. Budget instead for cluster and storage time, network, managed-service premiums, monitoring, support, data transfer, development, and on-call work. A small infrequent job may be cheaper than a permanently running stream; a permanent stream needs capacity and recovery measurements.

## Editorial assessment

Structured Streaming is a strong choice when Spark is already the shared compute and governance framework and streaming is closely connected to batch, SQL, or data-lake work. Its strength is a consistent programming model, not a blanket promise about every latency target or delivery semantic.

We would start with a small replayable end-to-end job and measure operational boundaries before rollout. If the main need is Kafka-bound Java microservices, portable pipelines, or a stream-first stateful runtime, compare the alternatives below with the same test data rather than relying on a feature list.

## Alternatives

- [Apache Flink](/en/tools/apache-flink/): the closest comparison when continuous stream processing, event time, and state are the primary concerns.
- [Apache Beam](/en/tools/apache-beam/): a portable pipeline model when the same code should be evaluated on runners such as Spark, Flink, or Dataflow.
- [Kafka Streams](/en/tools/kafka-streams/): a lighter library for Java/Scala applications tightly coupled to Kafka topics and microservices.
- [Apache Kafka](/en/tools/apache-kafka/): a better first choice when transport, partitioning, and the event log matter more than distributed transformation.
- [Google Cloud Dataflow](/en/tools/google-cloud-dataflow/): a managed cloud approach for batch and streaming pipelines, especially in the Beam ecosystem.

## FAQ

**Is Structured Streaming the same as the older Spark Streaming DStream API?**

No. Structured Streaming uses DataFrames/Datasets and Spark SQL as a declarative model; DStreams are the older API approach. Existing DStream code does not migrate automatically.

**Which language should a team choose?**

Scala, Java, Python, and R are supported. Existing Spark skills, connector compatibility, testability, and operational knowledge matter more than assuming one language is always best.

**Does a checkpoint alone guarantee exactly-once processing?**

No. The source must be replayable and the sink must handle retries correctly. With `foreachBatch`, for example, you need to deduplicate with `batchId` when exactly-once effects are required.

**How are late events handled?**

With event-time columns, windows, and `withWatermark`. The delay must match the business case; after the watermark passes, an event may be too late for a particular aggregation.

**Can a running query be changed arbitrarily and restarted from the same checkpoint?**

No. Changes to sources, stateful operations, or the state schema can be unsupported or semantically unclear. A change needs a tested migration or a new checkpoint plan.

**When is Spark the wrong choice?**

If the requirement is only message transport, Kafka is closer to the need. If a stream-first runtime with a strong state focus or very low latency is required, compare Flink and the target operating environment.
