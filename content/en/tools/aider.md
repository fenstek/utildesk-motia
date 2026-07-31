---
slug: aider
title: Aider
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Editorial"
editorial_reviewed_at: 2026-07-31
editorial_status: "manual_polished"
editorial_batch: "2026-07-31-story-card-refresh-20"
category: Entwickler-Tools
price_model: Je nach Plan
description: "Terminal-first coding agent for repository-aware edits, refactoring, tests, and Git-based review with configurable model providers."
tags:
  - ai
  - coding
  - cli
  - developer
official_url: "https://aider.chat/"
popularity: 0
source_language: de
translation: full
updated_at: 2026-07-31
---
# Aider

## Quick verdict

A developer is in the terminal with a bug that appears only when a configuration file is empty. They know the general area, but not every dependency. Aider does not simply paste the full repository into one prompt. Its repository map condenses important files, classes, and function signatures while the developer brings the immediately relevant files into the working context. After an edit, `/diff` shows what happened; a test runs; if the change took a wrong turn, `/undo` can reverse the last Aider step.

That is the appeal: Aider feels less like a remote chat window and more like pair programming inside Git. We **recommend** it for terminal-oriented developers who prefer small, controllable changes and want to choose their own model. Anyone uncomfortable with Git, the shell, and diffs will probably become productive faster with a good IDE agent.

## What makes Aider different

Aider is an open-source coding tool for the command line. It works directly in a Git repository, can use multiple model providers, and edits real files. The repository map gives the model a concise view of central symbols and relationships without loading every file in full. Its size adapts to the conversation and token budget.

Git is not merely an export feature; it is part of the safety net. By default, Aider can preserve its changes in descriptive commits. It treats already modified files carefully, while `/diff`, `/undo`, `/commit`, and `/git` make the work traceable. Auto-commits can be disabled, but then the user must keep their own work separate.

## A realistic terminal workflow

Before starting, the developer creates a branch and confirms that the existing test suite is green. They do not say “fix the configuration.” They provide the reproducible error, expected behavior, and one boundary: do not change the public format. Aider is first asked to explain the cause and name the affected locations.

Only then are the relevant files added. Aider writes a failing test and the smallest fix. The developer reads the diff, runs the focused test, and then executes the neighboring suite. If Aider also introduced an unnecessary rename, the proposal is not blindly accepted or discarded wholesale; that part is corrected or reversed.

The workflow remains deliberately hands-on. Aider saves search, typing, and implementation time, while the developer still sees the branch, files, diff, tests, and commit. For many teams, that visibility matters more than maximum autonomy.

## Who is Aider for?

- Developers who already spend substantial time in terminals and Git
- Maintainers treating AI changes as small, reviewable diffs
- Teams that want to compare different models or providers
- Developers in large repositories who need a concise map of relevant symbols
- Open-source and solo projects where a light CLI fits better than a new editor

Aider is less suitable for users without a safe Git workflow or for tasks where nobody can run tests and evaluate business impact.

<figure class="tool-editorial-figure">
  <img src="/images/tools/aider-editorial.webp" alt="Illustration for Aider: terminal pair programming with task board and code context" loading="lazy" decoding="async" />
</figure>

## Typical use cases

- **Bounded bug fixes:** Investigate a cause, add a reproducing test, and implement a small fix.
- **Refactoring:** Change one defined interface across files and inspect the consequences in a diff.
- **Tests and documentation:** Add missing tests, types, comments, or migration notes.
- **Repository exploration:** Use the repository map to understand relationships among important symbols.
- **Model comparison:** Run the same workflow pattern with different models and cost profiles.
- **Pair programming:** Keep questions, planning, and code changes in the same terminal context.

## Strengths

- Terminal-first and tightly connected to a normal Git workflow
- Repository map provides useful global context in a controlled form
- Choice of model and provider avoids hard lock-in to one platform
- Diffs, commits, and undo features make changes reviewable
- Open-source tool with extensive configuration

## Limits and risks

- Quality and cost depend heavily on the chosen model and supplied context
- Default auto-commits are useful but can surprise teams with a different commit policy
- Large or vague tasks still produce large, difficult changes
- Commands, tests, and generated code can have side effects; shell execution deserves attention
- The learning curve is steeper than an integrated editor for people without Git and CLI experience

## Workflow fit

Aider fits well between an issue and a pull request. The best assignment contains a symptom, target, non-goals, and a test command. Understand first, select files second, edit third: that order limits context and prevents unnecessary wandering through the repository.

Teams should decide whether auto-commits are desired, whether hooks must run with `--git-commit-verify`, and which models are approved for which code. A two-week pilot should measure accepted changes, review time, model cost, and reverted proposals.

## Privacy & operations

Which data leaves the repository depends on the selected model provider and configuration. Source code, logs, secrets, and test data should be classified first. `.aiderignore`, a bounded file context, and provider rules help, but do not replace deliberate approval.

API keys belong in secret management, not chat history or repository files. Local or self-hosted models can keep more control inside the environment, but the team then owns operations, model quality, and resource use.

## Pricing & costs

Aider itself is open source. Running costs usually come from the chosen model access or local infrastructure. A cheap model call is not cheaper when it requires substantially more correction. “Cost per accepted change” is therefore more meaningful than “cost per token.”

**Go to provider:** https://aider.chat/

## Alternatives

- [OpenAI Codex](/en/tools/openai-codex/): When coding tasks should run as broader agent sessions across local and cloud workspaces.
- [GitHub Copilot](/en/tools/github-copilot/): When IDE and GitHub integration plus centralized team governance are the priority.
- [Cline](/en/tools/cline/): When an open coding agent with explicit tool approvals inside the editor is wanted.
- [OpenHands](/en/tools/openhands/): When repository tasks should run in a more autonomous software-agent environment.
- [Cursor](/en/tools/cursor/): When an AI-native editor fits the team better than a terminal-first workflow.

## Editorial assessment

Aider is convincing because it does not hide the control surfaces. Repository context, files, diff, tests, and commits remain visible. That does not make it error-free, but it makes the tool compatible with sensible engineering. The ideal Aider task is small enough for a person to understand fully and large enough for the saved search and typing to matter.

**Editorial verdict:** Recommended for experienced terminal and Git users who value model choice and traceable changes. Use with caution in inexperienced teams or repositories without tests and clear ownership.

## FAQ

**What exactly is Aider?**

An open-source command-line coding tool that uses AI models to work on files in a Git repository.

**What is the repository map?**

A concise map of important files, classes, functions, and signatures. It gives the model context without copying the full repository into every prompt.

**Which models does Aider support?**

Aider works with multiple model providers and local options. The current compatibility list is maintained in the official documentation.

**Why does Aider create commits?**

Git integration makes changes traceable and easier to review or reverse. Auto-commits can be disabled.

**What does `/undo` do?**

It reverses the last change made by Aider. The current diff should still be inspected first.

**Is Aider free?**

The software is open source. Cloud models may incur API costs, while local models consume your own infrastructure.

**Can Aider work in a dirty repository?**

Yes. It deliberately handles existing uncommitted changes and can preserve them separately by default. Teams should understand and configure this behavior.

**Is Aider suitable for large repositories?**

The repository map helps with large codebases. Tasks should still be bounded and the directly relevant files selected deliberately.

**Does Aider replace tests?**

No. It can help write and run tests, but the team must assess coverage, meaning, and side effects.

**When is Aider a poor fit?**

When nobody is comfortable with Git, tests are missing, or large changes will be accepted without human review.
