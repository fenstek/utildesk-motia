---
slug: bolt-new
title: Bolt.new
category: Developer
price_model: null
tags:
  - coding
  - developer tools
official_url: 'https://bolt.new'
popularity: 86
description: 'A browser-based AI development tool for quickly building, editing, and running web apps, websites, and prototypes through chat.'
translation: full
---
# Bolt.new

Bolt.new is a browser-based AI development tool from StackBlitz that lets users start, change, and run apps, websites, and prototypes through chat. Instead of only suggesting code, Bolt works in a development environment where files, preview, and iteration sit close together.

Its main appeal is speed: an idea does not first have to be broken down into tickets, setup steps, and local dependencies, but can be turned directly into a runnable prototype. That is exactly why Bolt.new should be understood as an accelerator rather than a replacement for engineering judgment. It is strong for demos, landing pages, MVPs, and learning projects; critical production systems still need review, testing, architectural decisions, and security checks.

## Who is Bolt.new for?

Bolt.new is especially well suited for:

- Founders, product managers, and designers who want to see ideas quickly as a clickable web app
- Developers who want to start boilerplate, UI variants, or proof-of-concept work faster
- Teams that want to test early product ideas before a full repository is planned
- Students and learners who want to try modern web development in practice
- Marketing or growth teams that want to validate campaign pages and small tools quickly

Bolt.new is less suitable for heavily regulated backends, complex legacy systems, large monorepos, or projects where infrastructure, data model, and security model are already strictly defined. In those cases, Bolt can provide ideas, but it cannot replace a controlled engineering process.

## Typical use cases

- **Landing page in hours:** Quickly iterate on hero section, value proposition, form, and responsive layout.
- **MVP for a product idea:** Build and test the core flow, then decide whether a real project is worth it.
- **Try out a design system:** Translate components or brand guidelines into an interface.
- **Learn code:** Describe a change, review the result, and follow the generated code step by step.
- **Feature sketch for developers:** Create a visual prototype that can later be cleanly transferred into an existing repo.

## Core features

- **AI-assisted coding:** Describe requirements in natural language and generate files, components, or changes from them
- **Browser development environment:** Use code, terminal-like workflows, and preview directly in the web
- **Fast prototyping:** Start apps and websites without lengthy local setup
- **Iterative work:** Refine bugs, UI requests, or new features in chat
- **Import and integration options:** Depending on the workflow, existing sources or design ideas can serve as a starting point
- **Deployment-oriented flow:** Prototypes can be brought closer to a publishable web app than with pure mockup tools
- **Frontend focus:** Especially strong for JavaScript and web app projects

## Pros and cons

### Pros

- Very fast path from idea to visible web app
- Good for prototypes, UI experiments, and early product validation
- Low barrier to entry because setup and initial structure are largely handled
- Helps even non-developers express technical ideas more concretely
- Practical for testing variants before a team invests more deeply

### Cons

- Generated code must be reviewed, simplified, and tested
- Architecture decisions can grow messy with rapid prompting
- For large existing codebases, a controlled IDE and review process is often more stable
- Backend, auth, data storage, and security should not be blindly adopted
- Token, runtime, or plan limits can affect the workflow depending on project size

## Workflow fit: Bolt.new in the development process

Bolt.new is strongest at the beginning of a project: sharpening the idea, making the UI tangible, and testing technical feasibility. After that, a team should decide whether the prototype should be hardened further, transferred into an existing repository, or deliberately discarded.

For productive use, a clear handoff is recommended: export or version the code, check dependencies, add tests, remove secrets, test accessibility, and review security questions separately. Bolt can speed up the start; responsibility for quality remains with the team.

## Privacy & data notes

With AI coding tools, no secret keys, internal customer data, proprietary algorithms, or confidential project information should be included in prompts. Even if a prototype seems harmless, prompts, file names, sample data, and error messages can contain sensitive clues.

For teams, a simple rule makes sense: work with placeholder data, never write secrets into chat, review generated configurations, and check before every release whether tokens, internal URLs, or private content have ended up in the project.

## Pricing & costs

Bolt.new may offer free ways to try it and paid plans or usage limits, but the exact terms can change and should be checked directly on the official pricing page. For teams, the relevant questions are not only subscription prices, but also collaboration, project size, export, hosting, and enterprise features.

## Alternatives to Bolt.new

- [GitHub Codespaces](/tools/github-codespaces/): Better when an existing GitHub repository and a real development environment are the priority.
- [Gitpod](/tools/gitpod/): Strong for standardized cloud dev environments and reproducible team setups.
- [CodeSandbox](/tools/codesandbox/): A good choice for frontend prototypes, components, and collaborative web development.
- [Replit](/tools/replit/): Low barrier to entry for learning, small apps, and community-oriented projects.
- **Cursor or VS Code with AI extensions:** More suitable when developers want to work locally or close to the repo with more control.

## Editorial assessment

Bolt.new is an excellent idea accelerator. It removes friction from the start and turns "we should build a prototype" into something visible remarkably quickly. The professional work begins after that: clean up, test, secure, and decide whether the fast draft should really become the long-term codebase.

## FAQ

**Is Bolt.new suitable for beginners?**

Yes, especially for learning by trying things out. Beginners should still actively read the generated code and not just accept the results.

**Can Bolt.new write production code?**

It can provide a solid foundation. Before production use, however, the code needs review, testing, security checks, and often refactoring.

**Which projects fit best?**

Websites, frontend prototypes, small apps, dashboards, forms, and MVPs with manageable complexity.

**Does Bolt.new replace GitHub Codespaces?**

Not directly. Codespaces is more of a cloud IDE for existing repos; Bolt.new is more of an AI builder for fast creation and iteration.

**Should I use real customer data?**

No. For prototypes, placeholder or synthetic data is better. Sensitive data does not belong in prompts or demo projects.

**What is a good first prompt?**

Describe the target audience, core function, desired pages, visual style, and technical constraints. The clearer the frame, the more useful the result.

**When should I develop locally instead?**

When the project is large, has many internal dependencies, needs special build steps, or has strict security requirements.

**How do I avoid chaotic AI code?**

Prompt in small steps, test regularly, review files, remove unnecessary dependencies, and commit after each major step.
