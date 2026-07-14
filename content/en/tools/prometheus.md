---
slug: prometheus
title: Prometheus
editorial_reviewed: true
editorial_reviewed_by: Utildesk manual editorial pass
editorial_reviewed_at: 2026-07-13
editorial_status: manual_polished
editorial_batch: 2026-07-13-tool-quality-campaign-04
category: Developer
price_model: Open Source
tags: [monitoring, metrics, observability, developer-tools]
official_url: "https://prometheus.io/"
description: "Prometheus is an open-source metrics and monitoring system for time-series data, queries, and alerting."
translation: full
---
# Prometheus

Prometheus is an open-source metrics and monitoring system, not an AI assistant or workflow automator. It collects timestamped measurements, stores them as time series, and supports querying and alerting. Common signals include request rate, error rate, latency, resource consumption, and queue depth.

## Who is Prometheus for?

Prometheus suits teams operating services, containers, or infrastructure and wanting to turn technical signals into useful observability. It works particularly well with a pull-based exporter landscape and complements visualisation through [Grafana](/en/tools/grafana/). Log search and distributed traces require additional systems; metrics alone do not explain every incident.

<figure class="tool-editorial-figure">
  <img src="/images/tools/prometheus-editorial.webp" alt="Editorial illustration of Prometheus in a practical workflow" loading="lazy" decoding="async" />
</figure>

## Start with a few SLO signals

Begin from the user perspective: availability, error rate, and latency of one critical journey. A wall of CPU charts helps little if no one knows whether customers are affected. Define an owner, urgency, runbook, and concrete action for each alert.

## Labels and cardinality

Labels make metrics filterable, but can make storage and query cost explode. IDs, email addresses, full URLs, or random request values do not belong as Prometheus labels. Use a few bounded dimensions such as service, endpoint class, or status family, and review new metrics.

## Queries, recording rules, and alerting

PromQL supports flexible queries; frequent or expensive calculations can be prepared as recording rules. Alerts should represent symptoms and duration, not every short fluctuation. Alertmanager routing, deduplication, and inhibition keep one outage from creating twenty pages. Test rules using deliberately generated failure conditions.

## Operations and retention

Plan scrape interval, retention, storage, backups, and high availability around expected load. Prometheus is not an unlimited long-term archive; remote storage or compatible systems may be needed for larger scale or longer retention. Protect metrics endpoints because they can reveal internal names, capacity, or error detail.

## Alternatives to Prometheus

- [Grafana](/en/tools/grafana/): a visualisation and alerting complement, not a replacement for the metric source.
- [Datadog](/en/tools/datadog/): a hosted observability platform with a broader SaaS offering.
- [New Relic](/en/tools/new-relic/): an alternative APM and observability platform.
- [Elastic Stack](/en/tools/elastic-stack/): when logs and search are more central.

## Editorial assessment

Prometheus is an excellent standard for technical metrics when a team takes cardinality, alert hygiene, and operational ownership seriously. The best early result is not a pretty dashboard but an alert that fires rarely, reaches the right person, and speeds a clear diagnosis.

## FAQ

**Does Prometheus replace log management?**

No. Metrics efficiently show trends and symptoms; detailed events and root causes usually live in logs or traces.

**Why are high-cardinality labels dangerous?**

Every unique label combination creates a separate time series. Unbounded IDs or URLs can overwhelm storage and queries very quickly.

**What makes a good alert?**

It describes a relevant, sustained user or system impact, has an owner and a short runbook. Mere fluctuations belong on a dashboard.
