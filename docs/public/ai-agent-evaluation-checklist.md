# AI Agent Evaluation Checklist

This checklist is a reusable starting point for evaluating coding agents, browser agents and general workplace agents before a pilot becomes a production dependency.

## 1. Task boundary

- Write down the exact jobs the agent may perform.
- Define actions that always require human approval.
- Test refusal and escalation paths, not only successful demos.

## 2. Context and memory

- Identify where session context, project memory and credentials are stored.
- Verify deletion, export and retention behavior.
- Separate durable facts from temporary conversation context.

## 3. Tool access

- Grant the smallest practical set of tools and repositories.
- Prefer short-lived credentials and scoped service accounts.
- Log external actions in a form a human reviewer can understand.

## 4. Evidence and review

- Require source links for research claims.
- Run generated code through normal tests, review and deployment gates.
- Measure rework and correction time, not only first-answer speed.

## 5. Failure containment

- Set cost, time and action limits per run.
- Make retries idempotent where possible.
- Provide a tested kill switch and a clear owner for incidents.

## 6. Data protection

- Classify data before the agent receives it.
- Check processor terms, hosting region and model-training settings.
- Keep personal and customer data out of experiments unless the legal and technical controls are explicit.

## 7. Pilot scorecard

Record task completion, human correction time, unsupported claims, unsafe actions, cost and user confidence over several representative tasks. A production decision should be based on this scorecard rather than a single polished demonstration.

## Further reading

- [Open-source AI agents compared](https://tools.utildesk.de/ratgeber/open-source-ai-agents-im-vergleich-hermes-agent-openclaw-openhands-autogen-crewai-langgraph-und-clin/)
- [Local AI agents in 2026](https://tools.utildesk.de/ratgeber/lokale-ki-agenten-2026-foundry-local-edge-aion-apple-und-gemini-nano/)
- [Persistent AI memory](https://tools.utildesk.de/ratgeber/persistente-ki-memory-2026-kontext-zwischen-sessions-projekten-und-modellen/)
- [Utildesk methodology](https://tools.utildesk.de/methodologie/)

License: CC BY 4.0. Attribution: Utildesk.
