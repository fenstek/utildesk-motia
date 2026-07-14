---
slug: bruno
title: Bruno
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Editorial"
editorial_reviewed_at: 2026-07-14
editorial_status: "manual_polished"
editorial_batch: "2026-07-14-optiplex-editorial-50"
category: "Entwickler-Tools"
price_model: Open Source
tags:
  - api
  - developer tools
  - testing
  - open source
official_url: "https://www.usebruno.com/"
description: "Bruno is a local, Git-oriented API client for requests, tests, and reproducible CLI runs, storing collections as files without requiring cloud synchronization."
translation: full
popularity: 0
tier: "D"
generated_at: "2026-05-17"
updated_at: 2026-07-14
---
# Bruno

Bruno is an API client for development teams that want to keep requests, tests, and environments as files in a repository. Collections live on the local filesystem in Bruno's text-based Bru format, and the CLI can execute them in a terminal or CI. This is deliberately not a cloud-centered team inbox: Git, secret management, and the build system remain responsible for collaboration, access control, and review. That boundary is central to evaluating Bruno rather than treating an offline client as a complete delivery platform.

<figure class="tool-editorial-figure">
  <img src="/images/tools/bruno-editorial.webp" alt="a dark API testing lab with samples, valves, and cables" loading="lazy" decoding="async" />
</figure>

## What Bruno does

Bruno organizes API work into collections containing requests, folders, variables, authentication, tests, and scripts. The official product materials list HTTP, REST, GraphQL, and gRPC support. Its practical advantage is proximity to the development process: a request can be reviewed, changed, and rerun as a reproducible file alongside the service it exercises. The result is useful when the team wants the test setup to be visible in code review instead of hidden in an account workspace.

## Components in a real workflow

A collection usually represents a service or a business flow. Environments hold a base URL and other non-sensitive configuration; variables can be scoped to a collection, folder, request, or runtime. The `bru run` CLI command can execute a collection, folder, or individual request, filter test-bearing requests, and use CSV or JSON data files. The CLI runs scripts in Safe Mode by default. Filesystem access or external npm packages require an explicit Developer Mode decision, which is a useful control boundary for CI runners.

## A practical rollout

Start with a small collection in a dedicated repository and import one real but non-critical flow. Define a local environment, mark smoke tests, and check more than the HTTP status: validate the response shape, required fields, and expected error behavior. Add a staging run next. Only after variables, authentication, fixtures, and cleanup are understandable should the collection become a shared team dependency. Keep one deliberately failing test in the pilot so reviewers can see how a broken request appears in local runs and CI.

## Git, CLI, and operations

In the open-source edition, Git operations are handled through the terminal or another Git client; Bruno's paid editions advertise deeper Git integration and team features. For CI, install `@usebruno/cli` or use the official Docker image and run the collection with a pinned environment. Tags, bail-on-failure, reports, and parallel execution help shape a pipeline job. They do not remove the need to manage Node or Docker versions, runner network access, test data, report retention, and ownership of collection changes.

## Quality and boundaries

Bruno makes a request reproducible, but it is not an API contract registry, production monitoring system, or complete load-testing strategy. Measure the pilot with concrete questions: Are CI failures actionable? Does the collection remain maintainable after an API change? Can another developer rerun it without private local configuration? For high-volume load testing, browser end-to-end coverage, centralized test case governance, or highly delegated approvals, a specialized product may fit better. Check import fidelity as well, because a converted collection can preserve syntax while losing important scripts or environment assumptions.

## Privacy, security, and governance

The project describes Bruno as offline-only. Local storage can support data minimization, but it is not an automatic security approval. API keys, JWTs, and other credentials should not be committed in `.bru` files or Git. Bruno's documentation recommends a `.env` file, a matching `.gitignore` entry, and a value-free `.env.sample`; CI should take secrets from the runner's secret store and inject them as variables. Limit test accounts, inspect reports and debug output, and define who may change collections or call production-adjacent endpoints. Include the MIT license, package sources, update policy, and internal review in the team's open-source governance record.

## Costs and ongoing effort

Bruno's pricing page lists the Open Source edition at $0. It also lists Pro at $6 per user per month and Ultimate at $11 per user per month when billed annually, with deeper integrations, features, and support varying by plan. Recheck the official pricing page before purchasing because plan details can change. Even the free core has operational costs: CI minutes, runners or Docker infrastructure, collection maintenance, secret management, onboarding, and the effort of switching from another client. Compare those costs with the value of repository-based, repeatable API checks rather than comparing license prices alone.

## Editorial Assessment

We recommend Bruno to development teams that already understand Git and want API collections versioned beside code and runnable locally or in CI. It creates the most value when there is a clear repository owner, safe test environments, and a review process for request and secret changes. Organizations that immediately need centralized cloud workspaces, detailed role administration, or a dedicated load-testing and monitoring product should choose a narrower alternative or make those requirements explicit in the pilot. A fair trial is one small collection with a passing case, intentionally failing cases, a CI run, and a documented secret-handling policy.

## Alternatives

- [Postman](/en/tools/postman/): A broader cloud collaboration and integration platform for teams that prioritize central workspaces over local collection files.
- [Insomnia](/en/tools/insomnia/): An API client with a strong design and developer-workflow focus, useful when OpenAPI-oriented work is central.
- [Hoppscotch](/en/tools/hoppscotch/): A browser-oriented, fast client for ad-hoc requests and lightweight collaboration.
- [SoapUI](/en/tools/soapui/): A better fit when SOAP and functional service testing dominate and a specialized testing focus matters more than Bruno's file model.

## FAQ

**Is Bruno completely cloud-free?**

The project describes Bruno as offline-only and says it does not plan cloud synchronization. Git hosts, CI services, Docker registries, and any other services you choose are still external systems with their own data and access policies.

**How do I run Bruno tests in CI?**

Install the Bruno CLI in the runner or use the official CLI Docker image. Run the collection with the intended environment, inject secrets from the CI secret store, and fail the job on request or assertion errors. Keep the CLI and image versions controlled.

**Can API keys be stored in a collection?**

Do not store real credentials in versioned collection files. Use a local `.env` protected by `.gitignore`, a CI secret store for automation, and a review of reports, debug logs, and sample responses for accidental disclosure.

**What costs exist beyond the open-source edition?**

The pricing page lists the core edition at no license cost and paid Pro and Ultimate plans for additional team features and support. Runner infrastructure, maintenance, onboarding, and safe test data still require budget even when the open-source edition is sufficient.

**When is Bruno the wrong choice?**

If you need central cloud workspaces with detailed roles, browser-based end-to-end tests, or a specialized load-testing product immediately, compare those requirements against the pilot and the relevant alternatives before standardizing on Bruno.
