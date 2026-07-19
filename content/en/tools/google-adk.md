---
slug: google-adk
title: Google Agent Development Kit
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Editorial"
editorial_reviewed_at: 2026-07-19
editorial_status: "manual_polished"
editorial_batch: "2026-07-19-full-tool-card-editorial"
category: "AI Infrastructure"
price_model: "Open Source"
tags: [ai-agents, framework, evaluation, orchestration]
official_url: "https://google.github.io/adk-docs/"
description: "Google Agent Development Kit is a code-first open-source framework for building, evaluating, and deploying agents; models, infrastructure, and safe tool permissions remain separate decisions."
translation: full
popularity: 0
tier: C
generated_at: 2026-07-19
updated_at: 2026-07-19
---
# Google Agent Development Kit

Google Agent Development Kit, or ADK, is a code-first open-source framework for building, testing, evaluating, and deploying AI agents. It provides programming components for agents, tools, sessions, memory, workflows, runtime, and observability. ADK is optimized for Gemini but is not limited to it. The central boundary is that ADK is not a finished agent service: the team still owns application code, model contracts, identity, data stores, guardrails, and production operations.

## Who Google ADK is for

ADK fits software and platform teams that want to develop agents like regular applications, using a repository, dependencies, tests, CI/CD, and controlled deployment. It supports multiple languages, including Python, TypeScript, Go, Java, and Kotlin. It is particularly relevant when tool calls, multi-step workflows, and session state need explicit design.

Teams seeking a visual no-code builder or a ready-to-use business assistant will inherit too much infrastructure work. The Google name also does not make an agent automatically safe, correct, hosted, or free on Google Cloud.

## The components of an ADK agent

An LLM agent combines a model, instructions, and tools. Deterministic sequential, loop, and parallel workflows plus graph routes structure execution, while specialist agents can collaborate. Sessions and state hold conversational context; memory can make information available across sessions. Function, OpenAPI, and MCP tools connect external systems. The runner and event loop execute the application, while logs, metrics, and traces reveal its steps.

<figure class="tool-editorial-figure">
  <img src="/images/tools/google-adk-editorial.webp" alt="Illustration for Google ADK: code modules for agent, tools, state, and evaluation pass through controlled review loops into a runtime" loading="lazy" decoding="async" />
</figure>

That modularity creates design work. A session store is not automatically durable memory, a tool schema is not authorization, and a trace is not domain approval.

## A practical development workflow

1. Define a narrow agent objective, prohibited actions, and verifiable success criteria.
2. Begin with one agent and a few read-only tools; version model settings, prompts, and schemas.
3. Store only required session data and define deletion and expiry rules.
4. Capture expected tool trajectories and answers in an eval set, including errors, ambiguity, and prompt injection.
5. Protect write or irreversible tools with least privilege, idempotency, and explicit confirmation.
6. Observe traces, metrics, budgets, timeouts, and cancellation in a test environment.
7. Deploy in a container, release to a bounded cohort, and document rollback.

## Deployment, integration, and operations

ADK agents can run in Agent Runtime on Google's Agent Platform, Cloud Run, GKE, or other container-friendly infrastructure. The choice determines scaling, network controls, identity, data region, support, and price. A local web interface and CLI help development; they are not substitutes for a hardened end-user interface and production authentication.

MCP servers can be consumed as tools, and ADK tools can be exposed through an MCP server. Remote connections require authentication headers, restricted network paths, and tool filters. Stdio servers packaged in a container need their runtime and dependencies alongside the agent. Pin versions, review release notes, and produce reproducible images for upgrades.

## Quality, evaluation, and boundaries

Agents are probabilistic, so conventional unit tests are insufficient. ADK evaluation can assess both the final response and the tool trajectory against expected steps. Eval sets represent single or multi-turn conversations; criteria include exact tool sequence, response similarity, rubric-based quality, groundedness, and safety. Conformance testing can use recorded interactions as a regression baseline.

An average score must not hide a severe failure. Also measure unauthorized actions, missing evidence, abandonment, p95 latency, model and tool cost, and human corrections. LLM-as-judge output needs sampling and explicit rubrics because the evaluator is itself a model.

## Security, privacy, and governance

ADK's security guidance names direct and indirect prompt injection, data exfiltration, harmful actions, and unsafe code execution as concrete risks. Every tool identity should have least privilege; user-identity propagation needs explicit authorization design. Write actions require confirmation or an equivalent policy, filesystem and MCP tools need filtering, and model-generated code belongs in a hermetic sandbox without unnecessary network access.

Prompts, sessions, memory, artifacts, and traces may contain confidential data. Storage location, retention, deletion, tenant separation, and provider transfer belong in the data model. Escape model output before rendering it as HTML. Shared plugins can enforce guardrails, but they do not replace a threat model or domain authorization.

## Costs and selection criteria

The framework repositories use the Apache 2.0 license. Real costs still include models, search and tool APIs, databases, memory, artifact storage, observability, evaluation, and the chosen runtime. Cloud Run, GKE, and managed Agent Runtime have different billing and operating profiles. Compare cost per successful, verified task under realistic load.

## Editorial Assessment

We recommend Google ADK to engineering teams that need a code-based agent architecture with an integrated evaluation and deployment path and can own security engineering. It creates value when state, tool permissions, and regression testing are treated as software design.

For a quick visual prototype or a small chat feature without complex actions, ADK may be more framework than the job requires. A narrower SDK call or visual builder can be cheaper and easier to explain.

## Alternatives

- [LangGraph](/en/tools/langgraph/): State-oriented graphs and transitions for controlled agent workflows in the LangChain ecosystem.
- [LangChain](/en/tools/langchain/): A broad integration toolkit for models, retrieval, and tools with fewer assumptions about the full architecture.
- [AutoGen](/en/tools/autogen/): Role- and conversation-oriented multi-agent development, especially for experiments and research prototypes.
- [n8n](/en/tools/n8n/): Visual business automation with broad connectors when deterministic integration steps matter more than an agent framework.

## FAQ

**Is Google ADK limited to Gemini?**

No. It is optimized for Gemini, but the official documentation describes other model paths and integrations. Availability and feature depth should be checked for the chosen language and provider.

**Is ADK a hosted agent service?**

No. ADK provides development and runtime building blocks. Hosting can use Agent Runtime, Cloud Run, GKE, or another container platform and is operated and billed separately.

**How do you test a non-deterministic agent?**

Use a curated eval set that assesses final output, tool choice, and trajectory, then add security, failure, and load cases. Critical outcomes need hard controls and human sampling, not only an average score.

**Does tool confirmation make every action safe?**

No. Confirmation is one barrier. Tool identity, least privilege, input validation, idempotency, network boundaries, and audit logs are still required; automatically allowed read-only tools also need data-exfiltration review.
