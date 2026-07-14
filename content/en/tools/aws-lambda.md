---
slug: aws-lambda
title: AWS Lambda
editorial_reviewed: true
editorial_reviewed_by: Utildesk manual editorial pass
editorial_reviewed_at: 2026-07-13
editorial_status: manual_polished
editorial_batch: 2026-07-13-full-editorial-coverage
lastReviewed: 2026-07-13
category: Developer
price_model: Usage-based
tags: [serverless, cloud, developer tools, api]
official_url: "https://aws.amazon.com/lambda/"
translation: full
---
# AWS Lambda

AWS Lambda runs code in response to API calls or events without a team provisioning or patching servers. Common triggers include API Gateway, S3, SQS and EventBridge. Each Lambda Function invocation runs independently: horizontal scaling is managed, but shared state must never be assumed.

<figure class="tool-editorial-figure">
  <img src="/images/tools/aws-lambda-editorial.webp" alt="a kinetic paper theater of events and short-lived functions" loading="lazy" decoding="async" />
</figure>

## When Lambda fits

Lambda suits bounded API backends, webhooks, file processing, scheduled automation and event handlers. It is a poor fit for processes needing permanently open connections, durable local state or more than 15 minutes of uninterrupted work. Those need a different compute model or an orchestrated workflow.

## Process every event safely

Treat every event as potentially duplicated, delayed or malformed. A handler validates input, writes with an idempotency key and emits traceable logs with a request identifier. For asynchronous paths, define retry behaviour, maximum attempts and a destination for unprocessable messages before launch. A dead-letter queue with no owner is merely a delayed failure pile.

Test one path end to end: event, permission, function, database effect, alarm and retry. Then simulate timeout, duplicate input and an unavailable dependency. The important Lambda engineering happens at those boundaries, not inside the short handler.

## Permissions, network and secrets

Give each function its own IAM role containing the minimum actions and resources. Separate upload handlers, billing logic and administrative actions. Store secrets in an appropriate secrets service, not source code or screenshots of environment variables. Use VPC attachment only where access to private resources actually requires it; it is not generic security decoration.

## Performance and cost

Lambda Functions are billed per request and GB-second of execution; memory also affects available CPU. Triggers, data transfer, logs, queues and downstream services add cost. Measure cost per completed business outcome. Reused warm environments can reduce start latency, but local disk and memory state are not a persistence layer.

AWS also offers MicroVMs for isolated longer-lived environments and Durable Functions for interruptible multi-step workflows. These are distinct patterns, not a reason to force every application into a single function.

## Editorial Assessment

Lambda is excellent for small, clearly owned event components. It becomes risky when a team quietly turns it into a distributed system without tracing, idempotency and ownership. Start with a real event and a visible failure loop, then add triggers and integrations.

## Alternatives

- [Azure Functions](/en/tools/azure-functions/) is the close option for Azure ecosystems.
- [Google Cloud Functions](/en/tools/google-cloud-functions/) fits Google Cloud workloads.
- [Cloudflare Workers](/en/tools/cloudflare-workers/) suits edge-adjacent web logic.
- [AWS Step Functions](/en/tools/aws-step-functions/) is better for orchestration than one long function.
- [Vercel](/en/tools/vercel/) can be more direct for frontend-adjacent web deployment.

## FAQ

**How long can one Lambda Function run?**
An individual invocation can run for up to 15 minutes.

**Can an event be processed twice?**
Yes. Handlers should be idempotent and explicitly handle retries.

**Why can cost rise unexpectedly?**
Requests are not the only factor: duration, memory, logs, data transfer, retries and downstream AWS services accumulate.

**Does each function need its own IAM role?**
Usually yes. Small separate roles limit damage and make permissions reviewable.
