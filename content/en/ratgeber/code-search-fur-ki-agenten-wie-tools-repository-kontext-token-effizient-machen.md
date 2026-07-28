---
slug: "code-search-fur-ki-agenten-wie-tools-repository-kontext-token-effizient-machen"
title: "Code search for AI agents: find first, understand second, change last"
date: 2026-06-06
updated: 2026-07-28
category: "Comparison"
eyebrow: "AI Comparison"
excerpt: "A coding agent does not need an entire repository in context. It needs a traceable path from question to definition, test, and small diff."
readTime: 7
coverImage: /images/ratgeber/code-search-fur-ki-agenten-cover-editorial-v1.webp
secondaryImage: /images/ratgeber/code-search-fur-ki-agenten-repository-map-editorial-v1.webp
tags:
  - "Developer Tools"
  - "AI Agents"
  - "Code Search"
  - "Repository Understanding"
sidebarTitle: "Bottom line"
sidebarPoints:
  - "More context is not automatically better: unverified code can pull an agent away from the real fault."
  - "Exact search, structure, and tests usually matter more than elaborate semantic retrieval."
  - "A good agent can show which files it read and why a patch belongs there."
relatedTools:
  - title: "Aider"
    href: "/en/tools/aider/"
  - title: "Cursor"
    href: "/en/tools/cursor/"
  - title: "GitHub Copilot"
    href: "/en/tools/github-copilot/"
  - title: "Claude"
    href: "/en/tools/claude/"
  - title: "OpenAI Codex"
    href: "/en/tools/openai-codex/"
  - title: "Sourcegraph"
    href: "/en/tools/sourcegraph/"
---

A bug ticket says: “Invites stop working after a role change.” Giving an agent the whole repository now often produces a long explanation and a patch in the wrong place. A useful path starts smaller: where is an invite created, where is the role checked, and which test describes the flow? Only then is a change worth making.

Code search for agents is not token-saving magic. It is a method for reducing false confidence. An agent does not need to read everything; it needs to show why these files, symbols, and tests belong to the task.

## Three search modes, three different jobs

**Exact search** is the starting point. Event names, API routes, error messages, and feature flags are often the fastest lead. `rg`, IDE search, and Git blame do not answer an architecture question, but they show where a claim appears at all.

**Structural search** helps when spelling varies. Searching function calls, imports, or class hierarchies can be cleaner than matching text. It is useful when a term appears in comments, tests, and implementation at the same time.

**Semantic search** is an extra for questions without clear terms: “Where is permission checked before sending?” It can return good candidates, but it is not evidence. Each hit still has to lead back to a definition, call site, and test.

The order is deliberately ordinary: find an exact anchor, read its surroundings, then decide whether wider retrieval is needed. It is less theatrical than an agent summarising one hundred files, but it produces diffs a reviewer can understand.

## A repository map is a city map, not an answer engine

[Aider](/en/tools/aider/) uses a compact repository map: key files and symbols are placed in context as an overview. This helps when an agent otherwise cannot tell whether a module is central or merely an adapter. [Cursor](/en/tools/cursor/) and [GitHub Copilot](/en/tools/github-copilot/) also gather project context before proposing a change.

The risk starts when the map is treated as truth. Maps become stale after refactors. They show relationships, not necessarily runtime conditions, permissions, or the feature flag that is currently on. An agent should use a map as a hypothesis, then read the target definition and relevant test before proposing a patch.

![A repository map connects symbols, tests, and a change path](/images/ratgeber/code-search-fur-ki-agenten-repository-map-editorial-v1.webp)

## A workflow that survives review

1. **Sharpen the question.** What should change for whom and in which state? A reproducible expectation is worth more than “it is broken”.
2. **Search for anchors.** An error message, route, event, data field, or test name yields the first files.
3. **Draw a boundary.** The agent states which files it read and which it deliberately will not touch.
4. **Keep the patch small.** [Claude](/en/tools/claude/) or [OpenAI Codex](/en/tools/openai-codex/) can explain a proposal; the diff remains the decisive interface.
5. **Test the original question.** “The build is green” is not enough. Does a test actually cover the role change and invitation?

This loop can cost an extra minute at the beginning. It saves far more time once an agent starts constructing plausible but wrong connections.

## When a search index is worth it

A dedicated index makes sense when multiple repositories, monorepos, or internal libraries are involved and the same questions recur. [Sourcegraph](/en/tools/sourcegraph/) can make symbols and references discoverable across a larger codebase. Its refresh policy, access controls, and exclusions then become part of the product rather than an agent side job.

For one well-kept repository, a good folder structure, meaningful tests, `rg`, an IDE, and narrowly scoped agent tasks are usually enough. A vector index does not compensate for missing ownership boundaries or tests.

## What teams should measure

Do not measure saved tokens alone. Track how often an agent identifies the right file first, how large its diffs become, which proposals are rejected in review, and whether tests prevent the described failure. If search gets faster while reviews grow longer and mistakes become subtler, the index is not a win.

## Conclusion

An agent does not need a repository novel in its context. It needs a checkable trail: a concrete anchor, relevant definitions, a bounded patch, and a test against the original expectation. Good search does not make agents magically smarter. It makes their work smaller, more explainable, and more useful.

## Sources

- [Aider: Repository map](https://aider.chat/docs/repomap.html)
- [Sourcegraph: Code Search](https://sourcegraph.com/docs/code-search)
- [ripgrep repository](https://github.com/BurntSushi/ripgrep)
