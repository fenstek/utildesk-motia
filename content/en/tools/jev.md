---
slug: jev
title: JEV by TypeSafe AI
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Editorial"
editorial_reviewed_at: 2026-09-30
editorial_status: "manual_polished"
editorial_verdict: caution
editorial_batch: "2026-09-30-full-tool-card-editorial"
category: AI Infrastructure
price_model: Nutzungsbasiert
tags:
  - ai
  - api
  - classification
  - structured-output
official_url: "https://typesafe.ai/"
description: "TypeSafe’s Jev answers narrow text questions with typed decisions and probabilities; teams still need to verify quality, language coverage, and escalation rules."
translation: full
tier: C
popularity: 0
updated_at: 2026-09-30
---
# JEV by TypeSafe AI

TypeSafe’s Jev is designed for software that needs a bounded decision from text, such as choosing a support queue or estimating an urgency band. Instead of writing a response, the model returns typed answers with probabilities. That can simplify downstream logic, but it does not make a decision automatically correct or establish that German is already a dependable production language.

<figure class="tool-editorial-figure">
  <img src="/images/tools/jev-editorial.webp" alt="An artistic decision-sorting workshop: ambiguous cases go to a person while clear decisions are sorted into separate trays" loading="lazy" decoding="async" />
</figure>

## What Jev does and who it is for

TypeSafe calls Jev its [System One model](https://docs.typesafe.ai/introduction.md). It answers structured questions about supplied context. An application might ask which of four teams owns a case, how urgent it sounds, and where its severity falls on a defined scale. The result is a value that code can inspect and use; Jev does not write the customer-facing message.

This suits developer teams triaging similar inputs phrased in inconsistent ways. Jev is not a helpdesk, chatbot, or replacement for business rules. TypeSafe announced [early access](https://typesafe.ai/blog/introducing-system-one-models-and-jev) on September 15, 2026, so a limited pilot and team-owned evaluation belong in a production plan.

## The three question types

[`Choice`](https://docs.typesafe.ai/primitives/choice.md) selects from named options and returns a probability distribution plus a confidence value. [`Score`](https://docs.typesafe.ai/primitives/score.md) places an input on a described scale and also returns a distribution and confidence. [`Noul`](https://docs.typesafe.ai/primitives/noul.md) answers a yes-or-no question with a value from 0 to 1, representing the probability that the answer is yes. Noul has no separate confidence value.

Probability applies to an option; confidence summarizes how distinct the overall distribution is. Neither proves factual correctness. The application sets thresholds and decides what happens when a result is wrong ([TypeSafe on confidence](https://docs.typesafe.ai/confidence.md)).

## A possible support-message workflow

An illustrative pilot: “My order was charged twice. Could you check the second charge?” The application removes names and order numbers, then sends the remaining text as input context (`state`). `Choice` can suggest the billing team inbox as the destination; an independent `Noul` question assesses whether a same-day response seems necessary, while `Score` rates severity against a described scale.

Application code checks the suggestions and decides whether a low-risk case goes to that team inbox. Unclear answers, uncertain urgency, or an unfamiliar case go to a person. Until a German evaluation set shows an acceptable rate of false automatic routes, routing remains manual.

## Integration and operations

TypeSafe documents the [Python SDK](https://docs.typesafe.ai/sdk/python.md), the [JavaScript/TypeScript SDK](https://docs.typesafe.ai/sdk/javascript.md), and a [quickstart](https://docs.typesafe.ai/introduction/quickstart.md) for `POST /v1/systemone`. The application sends state and questions, then handles the answers. Jev accepts text or text-bearing JSON, not image, audio, or video input; convert those inputs first.

Keep questions narrow and independent; combine broad assessments in application code. Exact date or amount calculations, policy enforcement, and access control belong in deterministic code. TypeSafe notes that large input contexts can affect quality in its [Jev 1.13 jaggedness documentation](https://docs.typesafe.ai/model-jaggedness/jev-1.13.md). Plan thresholds, error routes, logging, and fallback behavior too.

## Measure quality before automating

Start with labelled cases and a separate evaluation set. German examples should include colloquial phrasing, typos, short replies, multiple issues, and conflicting clues. Test whether instructions inside the message can change the classification; input data must not grant permission to bypass system rules.

Measure precision, error rates, false automatic routes, and the share handled without human contact. Compare language and case type. TypeSafe identifies English as its strongest language, currently documents `jev-1.13.0`, and charges $0.042 per million input tokens; aliases can move ([models](https://docs.typesafe.ai/models.md)). Pin the version used for thresholds and evaluate changes again.

## Security, privacy, and limits

TypeSafe says it does not train on customer requests or responses; its [legal pages](https://docs.typesafe.ai/legal.md) link a DPA and list ZDR for enterprise customers. Its [privacy policy](https://typesafe.ai/legal/privacy-policy) identifies US hosting. Before sending personal or regulated data, review retention, subprocessors, transfers, deletion, and contract terms. “Not used for training” does not mean “not stored.”

Typed output does not prevent misinterpretation or prompt injection. Anonymization, minimum necessary fields, limited actions, and a traceable escalation path remain application responsibilities. A model value alone cannot approve legal, financial, or safety-related decisions.

## Costs and ongoing work

The listed Jev 1.13 rate is $0.042 per million input tokens; output tokens are free. One hundred million input tokens would therefore amount to $4.20 in model charges. That is not the full operating cost: the state and question text consume input tokens, and retries, human review, integration, monitoring, and maintenance of the labelled dataset add work. A short pilot with measured token use is a better budgeting basis than the answer count alone.

## Editorial Assessment

**Editorial verdict: Caution.**

We view Jev with caveats for teams that need to turn many recurring text decisions into bounded fields and will route every answer through their own rules before taking action. Its practical value depends on whether a team’s own dataset, language, and case type support enough safe automation at an acceptable error rate.

For customer-facing writing, image-aware analysis, or explanations, consider a generative model API. Keep exact rules and calculations in code. Without an acceptable German evaluation, privacy approval, and manual fallback, Jev should not route cases alone.

## Alternatives

- [OpenAI API](/en/tools/openai-api/): For teams that also need text generation, tool calls, or multimodal inputs.
- [Anthropic API](/en/tools/anthropic-api/): A generative API for document work, longer text analysis, and explanatory responses.
- [Cohere](/en/tools/cohere/): Relevant when embeddings, search, and reranking are part of the problem; it is not a like-for-like replacement for every decision task.
- [Pydantic AI](/en/tools/pydantic-ai/): A Python framework for typed agent workflows that orchestrates an inference model rather than providing one itself.

## FAQ

**Does Jev generate responses for a chatbot?**

No. Jev answers defined questions with typed values. Free-form chat responses require another model.

**Does a fixed output schema make the answer correct?**

No. A schema constrains the answer’s shape, not its factual correctness. Evaluation and escalation must expose mistakes.

**Can Jev handle German support messages?**

The documentation identifies English as its strongest language. Use a representative, separately labelled German dataset to decide whether it is fit for use.

**How do confidence and probability differ?**

Choice and Score return probabilities and a summary confidence value. Noul returns only the probability of yes, from 0 to 1. Neither proves an answer is true.

**Can I send sensitive messages directly?**

Only after checking your privacy requirements. TypeSafe links a DPA, lists ZDR for enterprise customers, and identifies US hosting. Remove unnecessary identifiers and confirm retention and contract terms.

**What should happen when confidence is low?**

It should not guess: ask for clarification or route to manual review. Set thresholds using labelled examples and the cost of mistakes.

**What does the API cost to operate?**

Input tokens are billed; output tokens are free. Measure retries, integration, and human review in a pilot with privacy-prepared inputs.

**Should I use `jev-latest` or a pinned version?**

An alias is convenient for exploration. Once thresholds depend on results, pin the tested version and evaluate before changing it.
