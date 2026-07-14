---
slug: blockly
title: Blockly
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Editorial"
editorial_reviewed_at: "2026-07-14"
editorial_status: "manual_polished"
editorial_batch: "2026-07-14-optiplex-editorial-50"
category: "Entwickler-Tools"
price_model: Open Source
official_url: "https://developers.google.com/blockly"
description: "Blockly is an open-source library for embedding visual code editors with custom blocks, toolboxes, workspaces, and code generators in web applications."
updated_at: "2026-07-14"
popularity: 0
tier: "D"
generated_at: "2026-05-18"
translation: full
---
# Blockly

Blockly is an open-source library for embedding a visual code editor in a web application. Users assemble blocks in a workspace; the host application defines the toolbox, block logic, and code generators. That boundary matters: Blockly is not a finished course, hosted learning platform, or complete product runtime. It supplies the editor building blocks while the product team owns the surrounding experience.

<figure class="tool-editorial-figure">
  <img src="/images/tools/blockly-editorial.webp" alt="Visual Blockly editor with colorful programming blocks in a learning workspace" loading="lazy" decoding="async" />
</figure>

## Who Blockly suits

Blockly fits teams that need controlled visual input for rules, lessons, robotics, or configuration and want to run that input inside their own web interface. It is a good match for developers, product teams with web expertise, and education teams building a specific learning path. It is a poor fit for a school or content team expecting ready-made courses, accounts, grading, and support without development work.

## The parts of a real implementation

The workspace is the editing surface; toolboxes expose blocks, commonly as categories or a flyout. Custom blocks can be defined with JSON, while advanced cases such as mutators may require JavaScript. The rest of the design includes fields, inputs, connections, themes, renderers, and possibly plugins. Blockly Developer Tools, including the Block Factory, can produce a starting block definition and generator stub, but they do not replace domain modeling or product design.

## A practical implementation workflow

1. Define the learning or product problem first: which inputs are allowed, what output is expected, and which actions must remain impossible?
2. Install Blockly with npm or bootstrap a project with the official create-package tool. Start with a small prototype containing only a few blocks and a clearly described toolbox.
3. Add a generator for every target output and test nested inputs, operator precedence, empty fields, and invalid combinations. The generator itself is JavaScript even when it emits JavaScript or Python.
4. Persist workspace state as JSON for new projects. XML remains an older format without new features, so migration and backward compatibility need an explicit plan.
5. Only then add user research, subject-matter review, and the host application's authentication, storage, and release processes.

## Integration, operations, and maintenance

Blockly supplies the editor. Hosting, user management, persistence, telemetry, localization, permissions, and execution of generated code belong to the embedding product. For plugins, make dependencies explicit, avoid relying on private core APIs, and ship tests. In production, consume a published npm or GitHub release and pin it through the normal dependency process. Blockly's documentation advises against using the moving `main` branch as a production source because unreleased APIs can change.

## Quality and evaluation

Do not evaluate only whether the blocks look approachable. Useful checks include: can five representative tasks be completed without hidden text edits; does the same workspace produce reproducible code; are invalid combinations explained; and can JSON snapshots be loaded, migrated, and reset? In education, also measure the solution path, a transfer task, and drop-off points. In a product, measure error rate, review effort, and time to safe execution. Generator code needs unit and snapshot tests because syntactically valid output can still be wrong for the domain.

## Privacy, security, and governance

Blockly is a library, not a privacy guarantee. The embedding application decides which workspace data, inputs, and telemetry leave the browser. Before rollout, document the data flow and retention, remove unnecessary content from snapshots, separate permissions, and review plugins and npm dependencies. Never execute generated code with broad privileges by default: validate inputs, restrict dangerous APIs, and use appropriate isolation or sandboxing for untrusted content. The project provides keyboard and screen-reader support, but custom blocks, themes, and focus behavior still need testing with real user scenarios. Apache 2.0 simplifies use of the core; it does not remove the need to review licenses for third-party plugins and assets.

## Price and total cost

Blockly's core is free open-source software under Apache 2.0; there is no Blockly plan that includes hosting or operations. Costs move elsewhere: engineering time for block models and generators, tests, localization, accessibility, browser compatibility, infrastructure, storage, and dependency maintenance. An education project may have little license spend while the effort to author good exercises and support learners is substantial. Estimate a small block set first and include the cost of migrating away from a proprietary data format or custom runtime later.

## Editorial Assessment

We recommend Blockly when a team can embed a bounded visual editor in its own web application and take responsibility for the domain rules. Its value appears when blocks are specific, generators are understandable, and a test set makes wrong output visible. For a ready-to-run learning platform without developer capacity, or for very large freely programmable software, Blockly is the wrong abstraction: Code.org, MakeCode, or a conventional source editor may be closer to the need.

## Alternatives

- [MakeCode](/en/tools/makecode/): A more complete learning and programming environment with block and text views; useful when hardware or course materials need a faster start.
- [Code.org](/en/tools/code-org/): A course and classroom platform with ready-made learning paths; better when teachers want to use content rather than build an editor.
- [AppInventor](/en/tools/appinventor/): A visual mobile-app development environment; suitable when the output should be an Android app rather than a general embedded editor.
- [Thunkable](/en/tools/thunkable/): A hosted no-code approach to mobile applications; worth considering when publishing and platform services matter more than owning block and generator logic.
- [Codecademy](/en/tools/codecademy/): An interactive learning platform with exercises; a better fit for structured coding courses than for operating Blockly infrastructure.

## FAQ

**Is Blockly a finished learning platform?**

No. Blockly provides the editor library and core building blocks. Courses, tasks, accounts, progress tracking, storage, and support must be built by the surrounding application.

**Which output languages can Blockly generate?**

That depends on the generators and domain model you include. Blockly ships generator APIs and several language options; each target still needs block generators and tests that match the application.

**Should a new project save JSON or XML?**

JSON is the recommended and actively developed option for new projects. XML remains available as a legacy format but does not receive new features, so existing XML data needs a tested migration path.

**Can generated code be executed directly?**

The library generates code but does not make execution safe automatically. The product must validate output, limit permissions, and provide suitable isolation for untrusted input.

**How do we create custom blocks?**

Define blocks in JSON by default, or use JavaScript for more advanced extensions. The Developer Tools can create a starting point; domain rules, generators, tests, and interaction design remain the team's responsibility.

**Can Blockly be used in a commercial product?**

The core is licensed under Apache 2.0. That is not a blanket clearance for every third-party component: review the licenses of plugins, dependencies, and included assets against your distribution model.

**How do we keep a Blockly product maintainable?**

Use published releases rather than `main`, test in CI, and keep JSON fixtures, generator snapshots, and browser checks. For plugins, explicit dependencies and stable APIs reduce upgrade surprises.
