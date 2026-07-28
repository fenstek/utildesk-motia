---
slug: "ki-code-ohne-kontrolle-der-neue-engpass-liegt-nicht-im-schreiben-sondern-im-verstehen"
title: "AI code without control: a green pull request is not proof"
date: 2026-05-20
updated: 2026-07-28
category: "Practice"
eyebrow: "AI code review"
excerpt: "An agent can produce a convincing patch in minutes. This editorial guide sets out the evidence a team needs before that patch becomes code it can responsibly own."
readTime: 8
coverImage: /images/ratgeber/ki-code-ohne-kontrolle-der-neue-engpass-liegt-nicht-im-schreiben-sondern-im-verstehen-cover-story-v1.webp
secondaryImage: /images/ratgeber/ki-code-ohne-kontrolle-der-neue-engpass-liegt-nicht-im-schreiben-sondern-im-verstehen-workflow-story-v1.webp
tags:
  - "AI Coding"
  - "Code Review"
  - "Software Quality"
  - "Developer Tools"
sidebarTitle: "Short take"
sidebarPoints:
  - "A green build only says that the checks that ran did not fail. It does not replace product understanding or a human owner for the change."
  - "For AI-generated code, use an evidence ladder: intent, scope, tests, failure paths and human approval."
relatedTools:
  - title: "GitHub Copilot"
    href: "/en/tools/github-copilot/"
  - title: "Cursor"
    href: "/en/tools/cursor/"
  - title: "Claude"
    href: "/en/tools/claude/"
  - title: "OpenAI Codex"
    href: "/en/tools/openai-codex/"
---

The pull request is green. The linter is green. The new tests are green. The agent has written a neat explanation for moving an authorisation check and adding a helper. It feels finished. In fact, that is the point at which a team should ask its most useful question: *what exactly does this green status prove?*

The answer is narrower than it sounds. It proves that the checks that actually ran did not fail. It does not prove that the requirement was understood correctly, that an uncommon role is safe, or that the new abstraction will remain legible in six months. This gap decides whether AI coding creates speed or simply moves work into review.

## Plausible is not the same as understood

[GitHub Copilot](/en/tools/github-copilot/), [Cursor](/en/tools/cursor/), [Claude Code](/en/tools/claude/) and [OpenAI Codex](/en/tools/openai-codex/) can reproduce patterns, phrasing and tests convincingly. That is useful, but it has a consequence: a patch can look familiar before anyone has tested its assumptions.

Martin Fowler's recent work on coding with agents distinguishes fast code generation from durable internal quality. That is the heart of the issue. A team does not merely own files. It owns the ability to change those files when requirements, data or dependencies change. That ability erodes when a diff can only be explained by a chat transcript, or when no one can say why it crosses a particular boundary.

![Software team checking a fast stream of AI code against architecture, tests and accountability](/images/ratgeber/ki-code-ohne-kontrolle-der-neue-engpass-liegt-nicht-im-schreiben-sondern-im-verstehen-workflow-story-v1.webp)

## An evidence ladder for an AI patch

Instead of asking reviewers to be vaguely more careful, use a fixed sequence of evidence.

**Intent.** One sentence names the user or system problem the diff solves.

**Boundary.** The pull request says which files, services or data flows it intentionally does *not* change. That negative statement makes scope creep visible.

**Behaviour.** Tests show a success path and the relevant failure or permission path. A new test is evidence only when it would meaningfully fail against the old behaviour.

**Consequences.** The author or agent names new dependencies, data movement, flags and rollback considerations. If that cannot be explained briefly, the diff is often too large.

**Ownership.** A person, not a tool, confirms who will maintain the change after merge and which assumption deserves a second look.

This is not ceremony for its own sake. It makes reviews faster because reviewers do not have to guess what proof they are looking for.

## Small changes are not pedantry

GitHub recommends small, focused pull requests and context for reviewers. That matters even more with AI code. An agent can turn a simple request into an architectural proposal without friction. Sometimes that is correct. More often it is a separate decision that deserves its own discussion.

The useful response to an oversized agent diff is therefore not “spend more heroic review time”. Split it. Merge the minimal correction first; put a potential refactor in its own proposal. The product decision stays visible, and a green test run is not mistaken for a silent architecture approval.

## Better review questions

“Can you simplify this?” is sometimes too vague. Ask questions that expose assumptions instead: What real failure or user goal is covered? Which repository rule supports this solution? Which test fails if that assumption is wrong? Which role, old data shape or external response is intentionally outside scope? What must be reversible if the assumption fails?

These are not AI-specific questions. They are good engineering questions. Agents make them more urgent because they can produce a larger amount of apparently complete code in a short time.

## A merge is an owned bet

Teams do not need to treat AI-produced code as inherently alien. They should not wave it through because it is articulate either. The practical middle ground is simple: agents produce proposals and first evidence; humans decide whether that evidence matches the risk of the change.

If the answer is no, that is not a failure of the agent. It is a signal to narrow the diff, add a test or make the product decision explicit. That is exactly what review is for.

## Sources

- [GitHub Docs: pull-request reviews](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/about-pull-request-reviews)
- [GitHub Docs: reviewer context, self-review and focused changes](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/getting-started/helping-others-review-your-changes)
- [Martin Fowler: internal quality while coding with an agent](https://martinfowler.com/articles/exploring-gen-ai/ccmenu-quality.html)
