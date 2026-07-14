---
slug: fathom
title: Fathom
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Editorial"
editorial_reviewed_at: 2026-07-14
editorial_status: "manual_polished"
editorial_batch: "2026-07-14-optiplex-editorial-50"
category: "AI Audio"
price_model: Freemium
tags:
  - meetings
  - notes
  - transcription
  - productivity
official_url: "https://www.fathom.ai/"
description: "Fathom transparently records online meetings, creates transcripts and AI summaries, and connects conversation insights with follow-up work and team processes."
updated_at: 2026-07-14
popularity: 0
source_language: de
translation: full
---
# Fathom

Fathom is an AI meeting assistant for individuals and teams that need a reliable record of conversations in Zoom, Google Meet, or Microsoft Teams. After capture, it produces a transcript, summary, highlights, and—depending on the plan—action items or follow-up drafts. The important boundary is accountability: participants must be informed about the recording, and a person still needs to check decisions, tasks, names, and sensitive statements before they become operational data.

<figure class="tool-editorial-figure">
  <img src="/images/tools/fathom-editorial.webp" alt="Meeting notes emerge from conversation waves and marked decision points" loading="lazy" decoding="async" />
</figure>

## Who is Fathom for?

Fathom suits sales, customer success, recruiting, consulting, and project teams with a high volume of recurring video calls. Its value is clearest when a call must lead to a concrete handoff: a CRM update, task list, decision, or short customer email. The free individual plan may be enough for personal meeting memory. An organization handling employment, health, legal, or other sensitive information should first define its legal basis, retention period, access model, and deletion process.

## How it fits a meeting process

Fathom can work as a visible notetaker that joins a call; its newer bot-free desktop experience is being rolled out gradually and was initially documented as limited to Mac and English-language meetings. Depending on the capture mode, it can capture transcript only, audio, or audio and video. After the call, Fathom generates a summary that still needs a human accuracy check. Transcription supports 38 languages, while summary translation is available for selected languages and plans.

## A practical team workflow

Start with one bounded process, such as first sales calls. The owner decides when recording is allowed, how external attendees are informed, which summary template is appropriate, and where action items should go. After the call, the owner checks names, figures, commitments, and deadlines, corrects errors, and copies only the relevant points into the CRM or task system. The summary is shared only after that review. This keeps Fathom as an input to verified work instead of creating a second, uncontrolled archive.

## Integrations and operations

Fathom lists integrations for CRM synchronization, Slack, Zapier, Make, Asana, ChatGPT, and Claude, and it provides a public API. API keys are user-level keys and do not automatically grant access to other users’ unshared recordings. The documented API limit is 60 calls per minute, with no higher standard limit. That is reasonable for small post-meeting workflows, but teams should test it before building a central importer. Transcripts do not have a direct download button; the official help describes copying them from the call view. Audio, video, and sharing therefore need to be managed deliberately in Fathom and downstream systems.

## Quality control and limitations

Do not evaluate Fathom only by asking whether a transcript looks fluent. Check wrong names, omitted qualifications, invented tasks, and incorrectly assigned speakers. For ten to twenty approved real meetings, compare manual preparation time, correction effort, task handoff completeness, and follow-up questions. Poor microphones, overlapping speech, accents, and specialist vocabulary can reduce quality; a team transcription dictionary can help on supported team plans but does not remove the need for review. A polished summary is not evidence that a decision was actually made.

## Privacy, security, and governance

Fathom states that it has SOC 2 Type II, HIPAA, and GDPR compliance support and provides DPA materials. Its security documentation says data is stored in the United States, which is a concrete transfer and contract question for EU and UK customers. Fathom says its subprocessors are contractually prohibited from training their AI models on user data, while de-identified customer data may be used to improve Fathom’s proprietary models; an opt-out is available. Teams should document that setting, subprocessors, roles, SSO, link permissions, and who acts as controller.

Recordings are not silent: a bot, banner, recording notice, or in-app consent mechanism makes capture visible. The meeting owner remains responsible for obtaining appropriate consent. Team administrators can manage sharing, downloads, deletion, and retention; automatic retention rules for recordings, transcripts, and summaries are tied to higher team functionality. Avoid “Anyone with the link” for confidential calls because a link that has already been shared cannot be unsent, even though access can be revoked later.

## Pricing and total cost

According to Fathom’s official pricing page, the individual Free plan is $0 and includes unlimited recordings, transcriptions, and storage, while advanced AI features are limited. Premium is listed at $16 per user per month when billed annually or $20 month-to-month. Team is listed at $15 or $19 per user per month, and Business at $25 or $34; the team plans have a two-user minimum, while Enterprise is sales-led. Prices and entitlements can change. A realistic budget also includes review time, CRM and automation maintenance, training, DPA work, and the cost of an incorrectly shared or inaccurate recording.

## Editorial Assessment

Fathom is recommended for teams that run many online meetings and can reliably turn reviewed summaries into tasks, CRM updates, or customer communication. It creates value when one owner controls capture, review, sharing, and deletion, and a pilot demonstrates less preparation time or fewer clarification loops. For private bot-free notes, strict local data control, or a structured collaborative minutes process with its own governance, a narrower alternative is a better fit.

## Alternatives

- [Fireflies.ai](/en/tools/fireflies-ai/): Takes a more integration- and search-oriented approach for teams that need to route conversation data into several systems.
- [Granola](/en/tools/granola/): Works as a bot-free AI notebook that combines personal notes with conversation context, making it better suited to individual note-taking.
- [Otter.ai](/en/tools/otter-ai/): Is positioned more broadly as a transcription and notes tool for meetings, interviews, lectures, and mixed audio workflows.
- [Avoma](/en/tools/avoma/): Focuses more directly on sales and customer-success workflows with conversation analysis and pipeline context.
- [Fellow.app](/en/tools/fellow-app/): Is a better match for structured agendas, meeting management, and task follow-through than for a pure conversation archive.

## FAQ

**Does Fathom make recording visible to participants?**

Yes. Fathom documents visible notices or consent mechanisms for both bot-based and bot-free experiences. The organization responsible for the meeting must still provide the legally appropriate notice and obtain any required consent in the relevant jurisdictions.

**Can Fathom send meeting information into a CRM automatically?**

Yes, CRM synchronization and field synchronization are documented features, with scope depending on the plan and integration. Review automated entries before saving them, especially amounts, commitments, and next steps.

**Can I download a transcript as a file?**

The official help says there is no direct transcript download. A transcript can be copied from the call view. Teams needing a durable export should test the API, summary, and archive workflow before rollout.

**Is Fathom suitable for sensitive EU conversations?**

There is no universal yes or no. Fathom describes GDPR support, a DPA, and US data storage; the customer must also assess legal basis, transfer, consent, access, retention, and deletion. A locally controlled or more narrowly scoped tool may be preferable for especially sensitive calls.

**How should a team pilot Fathom?**

Choose one recurring meeting type, name an owner, and define correction quality, preparation time, and complete task handoff before the pilot. After a small sample, decide from those measures rather than from the demo interface.
