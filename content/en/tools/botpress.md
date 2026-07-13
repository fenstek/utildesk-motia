---
slug: botpress
title: Botpress
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Editorial"
editorial_reviewed_at: 2026-07-14
editorial_status: "manual_polished"
editorial_batch: "2026-07-14-full-tool-card-editorial"
category: AI Chatbots
price_model: Freemium
tags:
  - ai
  - chatbot
official_url: 'https://botpress.com'
created_at: '2026-02-12'
updated_at: 2026-07-14
lastReviewed: 2026-07-14
description: 'Botpress is a cloud platform for AI agents and chatbots, combining visual workflows, knowledge bases, tables, and integrations.'
popularity: 0
source_language: de
translation: full
---
# Botpress

Botpress is a cloud platform for building, testing, and operating AI agents and chatbots. Teams model dialogue logic in visual Workflows made of Nodes and Cards, give an agent controlled knowledge sources, and connect it to external services through Integrations. That makes sense for a support or self-service process with a defined human escalation path; it is not a substitute for maintained source data, human approvals, or a proper application backend.

## Who is Botpress for?

Botpress is aimed mainly at product teams, developers, and domain owners who want to operate a chatbot as a traceable process rather than as a collection of prompts. A small team can use it to build an FAQ or intake pilot. A production setup still needs an owner for content, permissions, costs, incident handling, and review of uncertain answers.

The current platform is Botpress Cloud. Botpress states that v12 and other self-hosted versions are no longer available for new downloads, purchases, or deployments. If local installation, full network control, or on-premises processing is a hard requirement, evaluate a different architecture before investing in a Botpress build.

## How does a Botpress workflow work?

A Workflow breaks a conversation into reusable sections such as greeting, intent identification, data capture, and handoff. Nodes are the individual steps; Cards send messages, capture information, run logic, or transition to another Workflow. Standard Nodes execute their Cards in a controlled sequence. Autonomous Nodes let an LLM decide within the tools and instructions that the team has provided.

For example, a billing pilot could identify a request, capture a customer number and date range, call an approved service through an Integration, and show only the permitted result. If identity checks fail or the answer is uncertain, the Workflow should hand the case to a person. Test these transitions in the Emulator with real examples, incomplete inputs, and deliberately ambiguous wording before connecting production data.

## How are knowledge and data handled?

Knowledge Bases can combine sources such as websites, documents, rich text, tables, and, depending on the setup, integrations. An Autonomous Node can search them; a Standard Node needs an explicit knowledge-search step and a separate message that presents the result. This is useful for product documentation, internal policies, and pricing or service tables, but retrieved text is not by itself a guarantee that the answer or decision is correct.

Tables provide structured storage inside the bot, for example for simple profiles, statuses, or cases that must persist across sessions. For personal or business-critical data, confirm that the storage, Integration access, and retention model are acceptable. Complex transactions, fine-grained authorization, and systems of record should generally remain in a dedicated backend.

## Integrations and day-to-day operations

Integrations connect the bot to APIs, tools, and messaging channels. Before installing one, check its prerequisites, contributor or provider, scopes, and failure behaviour. A connector listed in the Hub is not automatically approved for sensitive production data. Keep secrets in the intended configuration and never place credentials in prompts or tables.

Use a small evaluation set with common questions, edge cases, missing information, and requests that must be refused. After every content, model, or Integration change, inspect citations or retrieved sources, transitions, error paths, and spend. A person should be able to take over whenever identity, money, health, legal questions, or an unclear source is involved.

## Privacy, security, and cost boundaries

Before the first real conversation, document which messages, files, table values, and telemetry may reach Botpress or connected model and service providers. Review Workspace roles, access, deletion, retention, export, and data-processing terms. European teams should also check the DPA, hosting information, and subprocessor list; this editorial assessment is not legal advice.

Botpress has a free entry point and paid plans. AI Spend for LLM usage is charged separately according to the model provider, and plan limits or add-ons can apply to bots, messages, table rows, and storage. Budget for more than the platform fee: model calls, Integration operations, monitoring, source maintenance, and human handoffs all affect the real cost.

## Editorial Assessment

Botpress is a reasonable choice for teams that want to pilot an AI-assisted conversation with visual flow control, a managed knowledge layer, and integrations in one cloud service. It earns its place when one defined process becomes measurably faster or more consistent and someone owns the quality of the answers.

It is a poor fit when self-hosting, local processing, or an already-standardised support suite is non-negotiable. Our recommendation is to start with one narrow use case, record ten to twenty real conversations as an evaluation set, and expand only after reviewing error rate, escalations, data flow, and AI Spend.

<figure class="tool-editorial-figure">
  <img src="/images/tools/botpress-editorial.webp" alt="Illustration of a Botpress chatbot workshop with connected conversation blocks" loading="lazy" decoding="async" />
</figure>

## Alternatives

- [Dialogflow](/en/tools/dialogflow/): A better fit when Google Cloud services, intent-based conversations, and a tightly integrated Google platform matter more than Botpress' visual cloud workflow.
- [Rasa](/en/tools/rasa/): Preferable for a developer team that needs open-source components and more control over runtime and data architecture.
- [Microsoft Bot Framework](/en/tools/microsoft-bot-framework/): A natural option for organisations connecting bots closely to Azure, Microsoft 365, and established Microsoft development practices.
- [ManyChat](/en/tools/manychat/): Better for marketing-led automation in social messaging channels with less need for a custom agent workflow.
- [Tidio](/en/tools/tidio/): More practical for small support teams that want live chat plus straightforward automation rather than a freely modelled agent platform.

## FAQ

**Is Botpress still an open-source or self-hosted platform?**

New projects should be planned around Botpress Cloud. The official documentation says that v12 and other self-hosted versions are no longer available for new downloads, purchases, or deployments.

**Can a Botpress agent answer questions from company knowledge?**

Yes. Knowledge Bases can use websites, documents, rich text, tables, and selected integrations as sources. Keep those sources current and scoped to the intended workflow, and use a human handoff when the source is missing or the answer is uncertain.

**How much does Botpress cost?**

There is a free entry point and paid plans. AI Spend for LLM calls is additional, while limits, add-ons, storage, and integrations can change the total. Test representative conversations with a spending cap before a broad rollout.

**Is Botpress suitable for sensitive data?**

Not by default. Review the data path, providers, retention, access, deletion, and human control points before processing personal or confidential information. If strict local processing is required, another architecture may be more appropriate.
