---
slug: "ki-agenten-bauen-integrationen-warum-fertig-der-gefahrlichste-status-im-workflow"
title: "AI agents build integrations: Why “done” is now the riskiest workflow status"
date: 2026-07-29
updated: 2026-07-29
category: "Workflow"
eyebrow: "AI workflow"
excerpt: "An agent can write integration code and still confuse a plausible explanation with proof. Reliable releases need independent evidence, deterministic gates and a named approval for irreversible effects."
readTime: 8
coverImage: /images/ratgeber/ki-agenten-bauen-integrationen-warum-fertig-der-gefahrlichste-status-im-workflow-cover.webp
secondaryImage: /images/ratgeber/ki-agenten-bauen-integrationen-warum-fertig-der-gefahrlichste-status-im-workflow-workflow.webp
tags:
  - "AI agents"
  - "Integrations"
  - "Testing"
  - "Evals"
sidebarTitle: "Key takeaways"
sidebarPoints:
  - "A believable agent explanation is not evidence that an integration reached the agreed system state."
  - "Deterministic gates protect known invariants; agentic tests explore changed paths and difficult failures."
  - "Production secrets and irreversible actions stay behind an explicit human approval step."
relatedTools:
  - title: "Talon"
    href: "/en/tools/talon/"
  - title: "LangGraph"
    href: "/en/tools/langgraph/"
  - title: "Playwright"
    href: "/en/tools/playwright/"
---

A coding agent upgrades a Stripe SDK, sends a nonexistent customer ID to the API, and receives an HTTP 400 response. Its conclusion: good, the endpoint works and returns the proper error for invalid data. Then it moves on. The reasoning sounds plausible. That is precisely what makes it dangerous.

This happened in [Stripe’s benchmark for end-to-end integrations](https://stripe.com/blog/can-ai-agents-build-real-stripe-integrations); it is not a fabricated cautionary tale. It exposes a difficult problem for platform teams: an agent can write code, read logs, and explain an error while still choosing the wrong signal for acceptance. What should a workflow require so that “done” is a verifiable system state rather than the agent’s opinion?

## A failure that sounds like success

Stripe built eleven environments containing code, databases, browsers, and test credentials. The graders did more than check for files or green unit tests. They called APIs, drove user interfaces, and in some cases inspected the Stripe objects that the integration actually created. A checkout could therefore look successful in the browser and still fail if the test account contained no matching Checkout Session.

The models were far from incapable. Stripe reports an average score of 92% for Claude Opus 4.5 across four full-stack tasks and 73% for GPT-5.2 across two specialised gym tasks. These are vendor benchmark results from different task sets, not a general model ranking. The contradiction is what matters: an agent can handle sophisticated UI and API work, then mistake a basic HTTP error for proof of success.

The same pattern appeared in the browser. One tool call accidentally highlighted the checkout frame and moved focus away from the form fields. A refresh or a click outside the frame would have recovered the session. The agent failed to recognise that route, treated the state as unrecoverable, and stopped. No more code was needed. What was missing was recoverable state and a stronger definition of success.

The practical question has therefore changed. It is no longer simply, *Can the model build an integration?* It is, *What independent evidence must the model produce before anyone releases it?*

## The model is only one part of the failure

Between the prompt and the repository sits a harness. It supplies context, executes tool calls, stores intermediate results, and determines what can resume after a failure. Self-hosted systems such as [Talon](/en/tools/talon/) make this layer visible: the model, tools, background tasks, and persistent state are separate components. A stronger model cannot repair a harness that returns the wrong browser state or forgets which step was already confirmed after a restart.

Where that layer runs is also a security decision. [Mendral describes](https://www.mendral.com/blog/agent-harness-belongs-outside-sandbox) an architecture in which the harness stays in the backend and delegates only execution to a disposable sandbox. Credentials no longer need to live inside the sandbox. In return, the platform becomes responsible for resuming long-running jobs, maintaining consistent state, and separating concurrent changes. Mendral acknowledges unresolved consistency questions; this is a trade-off, not a universal blueprint.

Frameworks such as [LangGraph](/en/tools/langgraph/) make these responsibilities explicit. A workflow can combine deterministic and agentic nodes, checkpoint state at node boundaries, and pause for human approval before a risky action. That may sound like an infrastructure concern. In practice, it decides whether a failed test can be repeated cleanly or whether the agent continues from a state it only partly understands.

Parallel coding tasks can start with a simpler boundary. [`git worktree`](https://git-scm.com/docs/git-worktree.html) gives each run its own working tree, HEAD, and index. An agent can change, test, and discard code without mixing its work with a developer’s active directory or another agent’s run. Isolation does not make an answer correct. It gives every failure a clear owner and a reproducible starting point.

## Two testing lanes, not one super-tester

The tempting response is to let the agent write and run every test as well. Slack’s engineering team offers a more useful answer. In [more than 200 agentic E2E executions](https://slack.engineering/agentic-testing-where-agents-fit-in-the-e2e-testing-stack/), it compared [Playwright](/en/tools/playwright/) through MCP, Playwright through the CLI, and agent-generated Playwright tests. Every experiment ran in a test workspace with non-production data.

The important distinction was not AI versus no AI. It was the job assigned to the test. A deterministic test enforces a known journey: click, type, assert. An agentic test receives a goal, observes the interface, and may choose another path. Only about 20% of Slack’s runs followed exactly the same action sequence. Many different paths still reached the correct final state.

This is the turn that integration workflows need. Known invariants do not require creativity. A webhook must be processed exactly once. A checkout must create the correct test object. A role must not receive a forbidden scope. Those conditions belong in fast deterministic gates that make the same decision for every relevant commit.

Agentic tests sit one level above them. They are useful for exploring alternative UI paths, reproducing an intermittent failure, or discovering why a user goal remains unreachable despite green component tests. At Slack they were also slower and more expensive; reported runs typically cost $15–30. That does not invalidate the method. It argues for using it after risky changes, during scheduled exploration, or to investigate a concrete failure rather than replacing every CI test.

![Three complementary test paths converge at a bright release gateway](/images/ratgeber/ki-agenten-bauen-integrationen-warum-fertig-der-gefahrlichste-status-im-workflow-workflow.webp)

## Before the merge, define an acceptance contract

An agent can only prove what the team has defined as proof. This does not require a hundred-page specification. It requires a short, versioned acceptance contract. The contract does not prescribe how the agent should code. It names the observable state that must exist when the work is complete.

A payment integration might define four layers:

| Layer | Question | Example evidence |
|---|---|---|
| API | Does the service handle valid and invalid input correctly? | reproducible requests with expected status codes and bodies |
| State | Was the correct business object created or changed? | the ID and properties of a test Checkout Session |
| Interface | Can a user reach the goal under realistic conditions? | recorded execution plus a verified final state |
| Boundary | Do permissions, retries, and failure paths remain within policy? | scope check, idempotency test, and a negative test case |

The contract itself must not become a silent source of error. When the API or business process changes, an accountable owner must review the acceptance criteria too. A stale specification does not make automation safer. It merely allows the wrong outcome to pass more consistently.

## A release corridor a team can actually operate

The benchmarks and architecture patterns point to a compact process with explicit ownership:

1. **The product or integration owner defines the outcome.** Before execution, they write three to five observable acceptance criteria: a valid API case, a negative case, persisted state, and a visible user result. A criterion without a testable artefact does not enter the task.
2. **The agent works in isolation without production secrets.** It receives a dedicated worktree or disposable sandbox, test credentials, and only the scopes required for the task. The check is simple: the run can be deleted without changing the main working tree or production data.
3. **CI enforces known invariants.** Contract tests, database assertions, permission rules, and security-critical negative cases remain deterministic. An agent’s explanation cannot overrule a red gate.
4. **An agentic run looks for the unexpected.** After a UI, authentication, or workflow change, the tester receives a goal rather than a click script. It runs in non-production with time, cost, and action limits. The verified final state counts; the agent’s final message does not.
5. **A named human releases irreversible effects.** Payments, external messages, permission changes, and migrations remain blocked until the evidence is reviewed. Approval covers the acceptance contract, test artefacts, and diff—not merely a summary.

This corridor does not slow agents more than necessary. It separates three jobs that product demos often collapse into one: producing a change, verifying its effect, and accepting responsibility for that effect.

## A new definition of “done”

The Stripe agent that celebrated an HTTP 400 response was not unintelligent. It was completing a task in which a plausible explanation was easier to reach than a durable proof. A larger model may make that mistake less often. It cannot eliminate the difference between a statement and the state of the system.

An integration is therefore done only when an independent path reproduces the agreed outcome, deterministic gates hold the known invariants, exploratory tests find no unhandled break, and a named person approves any irreversible effect. The agent may say “done.” What matters is whether the system agrees.
## Sources

- [Stripe: Can AI agents build real Stripe integrations?](https://stripe.com/blog/can-ai-agents-build-real-stripe-integrations)
- [Slack Engineering: Agentic testing](https://slack.engineering/agentic-testing-where-agents-fit-in-the-e2e-testing-stack/)
- [LangGraph documentation](https://docs.langchain.com/oss/python/langgraph/overview)
- [Git worktree documentation](https://git-scm.com/docs/git-worktree.html)
