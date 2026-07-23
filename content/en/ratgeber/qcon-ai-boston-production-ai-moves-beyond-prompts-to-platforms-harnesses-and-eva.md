---
slug: "qcon-ai-boston-production-ai-moves-beyond-prompts-to-platforms-harnesses-and-eva"
title: "QCon AI Boston: Why Production AI Now Needs Platforms, Harnesses and Evals"
date: 2026-07-23
category: "Guide"
eyebrow: "AI guide"
excerpt: "QCon AI Boston points to a practical shift: production reliability comes from context, state, boundaries and evaluation, not from better prompts alone."
readTime: 9
coverImage: /images/ratgeber/qcon-ai-boston-production-ai-moves-beyond-prompts-to-platforms-harnesses-and-evals-cover.webp
secondaryImage: /images/ratgeber/qcon-ai-boston-production-ai-moves-beyond-prompts-to-platforms-harnesses-and-evals-evals.webp
tags:
  - "AI Agents"
  - "AI Orchestration"
  - "Developer Tools"
  - "Software Engineering"
  - "Evals"
sidebarTitle: "Short take"
sidebarPoints:
  - "A production agent is a system with state, tools, boundaries and evidence, not just a prompt with more autonomy."
  - "Evals must test real tasks, failure modes and cost; a green unit test is not enough for an agent workflow."
  - "The safest starting point is one bounded workflow with a clear specification, CI gates and human approval for risky mutations."
relatedTools:
  - title: "LangGraph"
    href: "/en/tools/langgraph/"
  - title: "CrewAI"
    href: "/en/tools/crew-ai/"
  - title: "Claude Code"
    href: "/en/tools/claude/"
  - title: "OpenAI Codex"
    href: "/en/tools/openai-codex/"
  - title: "GitHub Copilot"
    href: "/en/tools/github-copilot/"
  - title: "Augment Code"
    href: "/en/tools/openai-codex/"
decisionTools:
  - title: "LangGraph"
    href: "/en/tools/langgraph/"
    note: "a fit for long-running, stateful workflows with checkpoints and resumption"
    score: "8.8"
    kind: "recommend"
  - title: "CrewAI"
    href: "/en/tools/crew-ai/"
    note: "useful for role-based agent flows when responsibilities and limits are explicit"
    score: "8.2"
    kind: "recommend"
  - title: "Augment Code"
    href: "/en/tools/openai-codex/"
    note: "interesting for specification-driven verification before a pull request"
    score: "7.9"
    kind: "caution"
decisionAvoid:
  - "giving an agent broad write access before idempotency, logging and rollback are tested"
  - "judging agent quality only by demos or self-authored tests"
  - "treating a stale or vague specification as a reliable control layer"
decisionNote: "The central question after QCon is not which model sounds smartest, but whether a team can inspect, pause, verify and safely repeat the entire run."
---

A prompt can be impressive. A production system also has to work on an ordinary Tuesday morning when an API fails, context is stale or a run stops halfway through. That shift was central to QCon AI Boston 2026: moving beyond isolated prompts towards platforms, agent harnesses and evals that keep a system controllable over time.

This is not a rejection of good prompting. Prompts remain part of the system. They are simply no longer the whole architecture. Teams introducing an agent into development, support or data work need to answer additional questions: What state does the run own? Which tools may it use? What counts as success? Who can stop it? Which evidence explains an action later?

## From prompts to production systems

The practical bottleneck often appears before the model response. An agent needs relevant context, must avoid mixing arbitrary stale information, and has to move through a controlled sequence of steps. This is often described as **context engineering**: structuring information, tools and boundaries so that the run can work reliably at all.

For a small writing task, a chat may be enough. A multi-step software workflow is different: the agent reads a ticket, searches a repository, changes several files, runs tests and opens a pull request. Each step creates state. If the process stops after step three, the team should not have to reconstruct the run from a chat history.

That is why runtime capabilities matter: checkpoints, resumption, streaming, human-in-the-loop controls and a clear separation between reading and mutating actions. [LangGraph](/en/tools/langgraph/) documents this layer as an orchestration runtime for long-running, stateful agents. [CrewAI](/en/tools/crew-ai/) takes a more role- and process-oriented approach. Neither replaces architecture decisions, but both make the decision visible.

## What an agent harness does

An **agent harness** is not one security filter. It is the environment that runs an agent and limits its freedom. At minimum, it should include:

- allowed tools and data sources;
- permissions by step or identity;
- state and checkpoint management;
- time, cost and retry limits;
- audit logs for tool calls and writes;
- defined interruptions and human approvals;
- rollback or compensation paths for failed mutations.

A good harness answers an uncomfortable but useful question: what may the agent do when its interpretation is wrong? In research, an error may first produce a bad answer. An agent that closes tickets, changes permissions or prepares a payment must stop at a controlled boundary instead.

The Model Context Protocol can standardise connections to tools and data sources. It does not automatically solve authorization, classification or business approvals. A standard plug is not a safe power grid.

## Evals are not a cosmetic check

Teams often confuse evals with a set of example prompts. Production agent evals should look more like a test programme: real tasks, expected states, permitted deviations and negative cases.

For a coding agent, a test case might require an API change while forbidding raw internal errors in public responses, requiring all contract consumers to be updated, and demanding a test for every checkout state transition. The output is not just the final answer. The evaluation should inspect files, tool calls, side effects, duration, cost and the response to deliberate failures.

The Stripe agent benchmark referenced in the QCon coverage is a useful warning: code can look plausible while failing on validation, browser state, idempotency or misleading error signals. An HTTP error is not success merely because it is structured. A green test is not proof if the test confirms the wrong contract.

![An agent passing through independent evaluation stations](/images/ratgeber/qcon-ai-boston-production-ai-moves-beyond-prompts-to-platforms-harnesses-and-evals-evals.webp)

## Specifications, not only diffs

As agents produce more code, a large diff does not become a better review. Augment Code describes a living-specification approach that moves part of verification before the pull request: not only “which lines changed?” but “which requirements should hold after the change?”

This matters for cross-cutting changes. A specification can state that monetary values use a particular type, every external input is validated, and every checkout transition has a test. A verifier can then check those contracts before a human has to read 2,000 lines of diff.

The specification itself remains a failure mode. If it is stale, a verifier can confirm the wrong reality. Specs therefore belong in version control, need an owner and must be updated with code and tests. An automated gate is only as good as its criteria.

## A realistic four-stage rollout

**1. Bound one workflow.** Do not start with “the agent should run engineering”. Pick a task with a clear input and verifiable artefact, such as a small dependency update or classification of incoming tickets.

**2. Start read-only.** Allow repository search, documentation and test execution, but no production writes. Measure which sources the agent uses, where it deviates and how often a human corrects it.

**3. Test real failure modes.** Add stale documentation, broken APIs, missing permissions, duplicate state transitions and empty results. An agent that only passes the happy path is not production-ready.

**4. Put mutations behind gates.** Writes need a visible reason, an audit trail, idempotency and a fallback. Authentication, payments, customer data and production deployments still require human approval.

## What teams should measure

The useful metrics are not only tokens saved or demo quality. Measure success by task type, retry rate, time to correction, manual interventions, cost per completed run and side-effect frequency. Add qualitative reviews: was the reasoning understandable? Could another engineer reproduce the run? Was a boundary respected deliberately or by accident?

This also shows when a smaller, less autonomous workflow is better. An agent that completes 80 percent of a task quickly but regularly turns the remaining 20 percent into hard-to-find defects is not automatically more productive than a bounded assistant.

## Conclusion

The useful QCon AI Boston message is deliberately unglamorous: production AI needs more software engineering, not less. Prompts remain important, but reliable agents require context management, state, harness boundaries, evals and human ownership.

Start with one bounded workflow and gain speed without giving up control. Give an agent broad write access and judge it by a demo, and the likely result is not a work agent but a hard-to-reproduce operational incident.

## Sources

- [QCon AI Boston 2026: news and production-AI themes](https://www.infoq.com/qcon-ai-boston-2026/news/)
- [QCon AI Boston: Production AI Moves beyond Prompts to Platforms, Harnesses, and Evals](https://www.infoq.com/news/2026/07/production-ai-platforms-evals/)
- [Stripe Benchmark: AI Agents Build Integrations but Struggle with Validation](https://www.infoq.com/news/2026/07/stripe-ai-agents-benchmark/)
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview)
- [LangGraph persistence and checkpoints](https://docs.langchain.com/oss/python/langgraph/persistence)
- [How AI Agent Verification Prevents Production Bugs Before Merge](https://www.augmentcode.com/guides/ai-agent-pre-merge-verification)
- [git-worktree documentation](https://git-scm.com/docs/git-worktree)
