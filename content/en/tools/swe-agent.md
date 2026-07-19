---
slug: swe-agent
title: SWE-agent
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Editorial"
editorial_reviewed_at: 2026-07-19
editorial_status: "manual_polished"
editorial_batch: "2026-07-19-full-tool-card-editorial"
category: Entwickler-Tools
price_model: Open Source
tags: [ai, coding-agent, research, developer-tools]
official_url: "https://github.com/SWE-agent/SWE-agent"
description: "An open-source research agent for reproducible repository tasks and SWE-bench experiments, now superseded by mini-SWE-agent and maintained in maintenance-only mode."
translation: full
updated_at: 2026-07-19
---
# SWE-agent

SWE-agent is an open-source research framework that connects language models to tools and an isolatable repository environment to investigate issues and produce patches. It remains useful for reproducible experiments and specialized agent workflows, but it is no longer the default choice for a new installation: the maintainers identify mini-SWE-agent as its successor and have moved SWE-agent to maintenance-only mode.

## What SWE-agent is for

The project originated in research at Princeton and Stanford and is closely associated with SWE-bench. Researchers can compare agent behavior, models, prompts, tool sets, and environments. Engineering teams can run individual issues or controlled batches when they are prepared to operate configuration, containers, model access, and evaluation themselves.

SWE-agent accepts a problem statement and repository, lets a model investigate and edit through a tool loop, and emits a patch plus a detailed trajectory. That output is a candidate change, not an automatically valid fix.

## Components in an agent run

The CLI initializes an environment through SWE-ReX and a configurable agent. The environment can start a local Docker container or a remote deployment. Tool bundles inside its shell provide file viewing, search, editing, and Bash. YAML configuration controls the model, prompts, parser, tools, history processing, and environment setup.

<figure class="tool-editorial-figure">
  <img src="/images/tools/swe-agent-editorial.webp" alt="Isolated repository lab with an issue, agent actions, a test station, and a separately reviewed patch" loading="lazy" decoding="async" />
</figure>

The history of model responses, actions, and observations is processed and returned as context. This makes a run inspectable, but context consumption and retained data grow with each iteration.

## A practical controlled-run workflow

1. Select an issue with a reproducible failure, expected behavior, and an executable test; split broad product requirements first.
2. Prepare the repository and dependencies in an immutable container image. Expose only necessary network routes and secrets.
3. Version the model and YAML configuration, set cost and step boundaries, and run one instance.
4. Review trajectory, logs, configuration, and patch together. The agent must not remove tests or replace reproduction with a superficial workaround.
5. Build and test the patch on a clean checkout outside the agent container. Only then should human review decide whether to open a normal pull request.

Do not begin a batch until one case works reproducibly. Otherwise batching multiplies setup defects, model cost, and incomparable results.

## Operations, configuration, and outputs

`sweagent run` handles one case, while `run-batch` handles multiple instances. The trajectory directory contains JSON-based `.traj` files, the exact configuration, and logs; batch output adds merged predictions and exit statuses. Terminal and browser inspectors help compare individual steps.

Execution and evaluation are separate. `run-batch` does not complete SWE-bench evaluation; that requires another step. Reproducibility needs the container image, exact model identifier, configuration, and setup commands in addition to the patch. Because the project is maintained rather than actively expanded, compare new customization work with mini-SWE-agent before building more tool bundles.

## Evaluation and decision boundaries

A run is not successful merely because it emits a diff. Did the baseline test reproduce the defect? Does the patch fix it while preserving unmodified regression tests? Are new tests meaningful, and did the agent respect security and licensing boundaries? Research evaluation should also measure success rate, token and compute cost, variance across repeats, and environment comparability.

Benchmark scores do not transfer directly to private repositories. Languages, build systems, dependencies, and issue quality change the task. A small internal evaluation set is more informative for production selection than an external leaderboard alone.

## Security, privacy, and governance

Containers reduce host access, but their security depends on mounts, networking, runtime, and granted privileges. Agents can execute Bash, so unknown repositories and issue text should be treated as potentially hostile. GitHub and model-provider tokens should be short-lived, least-privileged, and injected only through secrets or environment variables.

Trajectories may contain prompts, model responses, file contents, and command output. They must not be published or shared as benchmark artifacts without review. Retention, access, and deletion need controls comparable to source code. The framework uses the MIT license, while repository dependencies, models, and generated patches may have separate terms.

## Cost and operating effort

SWE-agent itself is open source. Model calls, container or remote compute, artifact storage, and human review still cost money. Batches and repeated trials can multiply spend quickly, especially as long trajectories are repeatedly sent in context.

Define a hard per-instance budget, timeouts, and stop reasons. Maintaining custom images, tool bundles, and model adapters is an internal cost center. For new work, mini-SWE-agent may reduce operating weight because its framework is smaller.

## Editorial Assessment

We recommend SWE-agent to researchers and experienced agent teams that need to reproduce existing experiments, maintain historical configurations, or study its detailed agent-computer interface. It provides value when trajectories, containers, and evaluation are deliberate parts of the experiment.

For a new production coding agent, the maintainers' recommended successor or an actively operated platform is usually a better choice. Small teams without their own evaluation and container governance should not make a maintenance-only research stack central to delivery.

## Alternatives

- [OpenHands](/en/tools/openhands/): A more actively developed open-source platform for agentic engineering with broader product and integration scope.
- [Devin](/en/tools/devin/): A managed cloud agent for teams that do not want to assemble infrastructure, sessions, and support from research components.
- [Aider](/en/tools/aider/): A lean terminal alternative for conversational Git changes without the full benchmark and trajectory apparatus.
- [Cline](/en/tools/cline/): An IDE-oriented open-source agent with visible tool actions for interactive development.

## FAQ

**Is SWE-agent still actively developed?**

The official documentation describes it as maintenance-only. The maintainers focus current development on mini-SWE-agent and recommend that successor for new adoption.

**Does a run automatically produce a finished pull request?**

The core output is a patch with trajectory and logs. A separate controlled process should decide whether to open a pull request after tests, diff review, and permission checks.

**Is Docker sufficient security?**

No. Mounts, network access, container privileges, secrets, and the host runtime determine actual isolation. Use disposable environments, least privilege, and treat repository and issue content as untrusted input.

**Can SWE-bench results predict performance for an internal team?**

Only weakly. Private repositories differ in language, dependencies, tests, and task quality. A small internal evaluation set measuring cost, quality, and variance provides better evidence.
