---
slug: datadog
title: Datadog
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Editorial"
editorial_reviewed_at: 2026-07-14
editorial_status: "manual_polished"
editorial_batch: "2026-07-14-full-tool-card-editorial"
category: AI Infrastructure
price_model: "Subscription, usage-based"
tags:
  - data
  - workflow
official_url: "https://www.datadoghq.com/"
description: "Cloud observability and security platform for infrastructure, APM, logs, traces, and operations, with usage-based billing and significant governance requirements."
popularity: 0
source_language: de
translation: full
updated_at: 2026-07-14
---
# Datadog

Datadog is a cloud observability and security platform for teams that need to connect infrastructure, applications, logs, and distributed traces in one operating process. Its value is not a single dashboard but the ability to correlate signals during an incident. The SaaS boundary matters: telemetry is sent to Datadog, and costs depend on products, data volume, retention, and monitored units.

## Who is Datadog for?

Datadog fits DevOps, SRE, platform, and security teams operating multiple services, cloud accounts, or hybrid environments. It is most useful when a team can assign service ownership and investigate production behaviour systematically rather than occasionally searching raw logs. A small project with one server and limited operational risk may need only a narrower monitoring stack.

## What belongs in the operating model?

The Datadog Agent collects telemetry from supported hosts and workloads, while applications can be instrumented separately. Infrastructure Monitoring supplies host, container, and system signals; APM follows requests across services; and Log Management processes events. Dashboards, monitors, service views, and incident workflows turn those signals into an operating layer. Depending on the need, teams can add network, synthetic, real user, or security products. These modules are not an automatic complete solution: each signal needs a purpose, a retention decision, and an owner.

<figure class="tool-editorial-figure">
  <img src="/images/tools/datadog-editorial.webp" alt="Abstract observability city model with connected telemetry trails" loading="lazy" decoding="async" />
</figure>

## A practical rollout workflow

Start with one service, one concrete failure mode, and a few questions: is it reachable, how long do requests take, and where do errors begin? Follow the official setup for the Agent, instrument a representative request path, and check data quality before building a large dashboard. Then define monitors with thresholds or anomaly logic, connect them to the on-call or incident process, and document the owner. Add more services and log sources only after the signals help in a real investigation.

In daily work, an alert should lead to an investigation: open the monitor, narrow the affected service and trace, correlate logs in the same time window, check a change or dependency, and record the cause in the incident. Afterward, keep only dashboards and alerts that support a decision. Otherwise the interface grows faster than the team’s diagnostic ability.

## Integration and maintenance

Datadog can receive data from cloud services, hosts, containers, and applications and connect it with collaboration and incident tools. For custom services, automatic or manual instrumentation and consistent tags matter; inconsistent service names make correlation unreliable. Plan Agent upgrades, access reviews, monitor rotation, and export or archive paths as part of operations. OpenTelemetry may be part of the instrumentation strategy, but it does not decide which data should be stored or indexed in Datadog.

## Quality checks and decision criteria

Evaluate a rollout against real operational questions: how quickly can the team find the affected service, how many alerts are actionable, and can it correlate logs and traces with enough completeness? A pilot can use one critical path, one defined failure case, and a review after several operating cycles. Check whether high-cardinality tags, debug logs, or broad trace collection make searches slower or increase spend. A green dashboard does not prove application health if instrumentation has blind spots.

## Security, privacy, and governance

Treat telemetry as potentially sensitive production data: logs and traces may contain identifiers, URLs, payload fragments, or personal data. Before rollout, review scrubbing and redaction, API and application keys, roles, SSO and access design, retention, and regional requirements. Decide who may view security signals and who may change monitors or retention rules. Datadog provides security and governance capabilities, but their effectiveness still depends on configuration, data classification, and a workable incident process.

## Pricing and real operating cost

Datadog is not simply priced per team. Depending on the selected products, billing can involve infrastructure hosts, APM hosts, ingested or indexed logs, ingested or indexed spans, containers, devices, and other product units. Annual, monthly, and on-demand options differ, so the official pricing page should be checked against region, contract, and expected usage before a decision. Also budget Agent and instrumentation work, data cleanup, retention, archives, alert maintenance, and on-call time. A pilot should expose telemetry volume and its most expensive sources before more modules are enabled.

## Editorial Assessment

We recommend Datadog to teams with several production services, real on-call or incident ownership, and the discipline to curate telemetry. It creates value when traces, logs, and infrastructure metrics lead to a faster, defensible decision during an incident, measured through criteria such as time to diagnosis or actionable-alert rate. For a single system, a tight budget, or an organisation that cannot send data to an external SaaS service, a smaller or self-operated alternative is usually the better choice.

## Alternatives

- [New Relic](/en/tools/new-relic/): Broad SaaS observability with a similar APM and logging focus; a practical choice when the team already has New Relic experience.
- [Dynatrace](/en/tools/dynatrace/): More oriented toward automated topology and root-cause analysis in large environments, with its own cost and complexity curve.
- [Prometheus](/en/tools/prometheus/): Open-source metrics monitoring for teams that want to operate Kubernetes-oriented metrics themselves and choose logs or APM separately.
- [Grafana](/en/tools/grafana/): Flexible visualization and observability across data sources, suitable for a deliberately modular stack.
- [Splunk](/en/tools/splunk/): Relevant when log analysis, security, and compliance workflows matter more than a unified APM suite.

## FAQ

**Do I need the Datadog Agent on every system?**

Not every source is connected in the same way. The Agent is the typical path for host and much infrastructure telemetry; APM can additionally use libraries or other supported instrumentation paths. Decide per workload which signals are necessary.

**How can we stop logs from dominating the bill?**

Separate collection, processing, and indexing decisions; remove unnecessary fields and debug-heavy sources early; and set retention according to investigation value. Monitor ingested and indexed volume separately and test the rules against real incidents.

**Can Datadog handle personal data from production?**

There is no universal yes or no. Classify logs and traces, mask sensitive values before transmission, review contract, region, roles, and deletion processes, and obtain approval from privacy and security owners for the concrete use case.

**How should a small team start with Datadog?**

Use one critical service, a small set of monitors, and a scheduled review. Measure whether diagnosis and escalation improve; if only alert volume and cost rise, reduce the data scope or choose a narrower alternative.
