---
slug: choicescript
title: ChoiceScript
editorial_reviewed: true
editorial_reviewed_by: "Utildesk Editorial"
editorial_reviewed_at: 2026-07-14
editorial_status: "manual_polished"
editorial_batch: "2026-07-14-choicescript-full-editorial"
category: "AI Writing"
price_model: Kostenlos
tags: [interactive-fiction, writing, games]
official_url: "https://www.choiceofgames.com/make-your-own-games/choicescript-intro/"
description: "ChoiceScript is a text-based scripting language for interactive novels with choices, variables, and branching scenes."
updated_at: 2026-07-14
lastReviewed: 2026-07-14
popularity: 0
tier: "C"
generated_at: "2026-05-15"
source_language: de
translation: full
---
# ChoiceScript

ChoiceScript is a text-based scripting language from Choice of Games for interactive novels and choice-driven games. Authors write scenes as plain text files, connect them with commands such as `*choice`, `*goto`, and `*finish`, and carry story state through variables. That makes ChoiceScript a practical fit for narrative projects, but not a general game engine or layout system: a project built around 3D, heavy animation, or a fully custom interface needs a different foundation.

## Who is it for?

ChoiceScript suits writers, narrative designers, and small studios that want to keep a long branching story as an understandable text codebase. A realistic first project might be a role-playing story with five to ten scenes where earlier choices change values such as trust, courage, or resources. Prototypes for learning and training stories are possible too, provided that subject-matter review remains a human responsibility.

It is a weaker fit for image-led visual novels, real-time gameplay, or projects whose main challenge is a custom interface. The hard part is not only learning the commands. It is designing states, avoiding dead ends, and keeping repeated logic maintainable as the story grows.

## How the script model works

A ChoiceScript project includes `startup.txt` and additional scene files. `*choice` defines options, while indented blocks contain their consequences. `*create` and `*set` define and change values; `*if` can later decide which text or route appears. `*label`, `*goto`, and `*goto_scene` help authors reuse shared sections instead of copying them into every branch.

Indentation is part of the syntax. Spaces and tabs cannot be mixed casually, and every nested block must end with a valid jump or scene ending. This is easy to break when several people edit files. A short project convention covering indentation, UTF-8 encoding, naming, and scene ownership is more valuable than an elaborate tool stack.

<figure class="tool-editorial-figure">
  <img src="/images/tools/choicescript-editorial.webp" alt="Open book with branching paths and marked decision points" loading="lazy" decoding="async" />
</figure>

## A practical workflow

Do not begin with a huge world map. Start with one playable slice. Define the scene, the decision, and the states that should become visible later. Write that slice in a scene file, launch the local ChoiceScript server, and play it in a browser. For example, a promise can set `trust` to a value; three scenes later, `*if trust > 60` can determine whether another character opens a door.

Then run each intentionally designed route. Dead ends, unreachable sections, and contradictory values are normal failure modes in branching fiction, not edge cases. A small table listing scenes, entry and exit states, and planned test paths helps a team reason about coverage. Git or another version-control system is still useful because ChoiceScript does not replace editorial history, review, or merge discipline.

## Testing and quality control

ChoiceScript provides Quicktest and Randomtest for different structural checks. Quicktest attempts to cover options and conditional branches systematically; Randomtest plays many random paths and produces hit information. Each can find defects the other misses. Neither proves that a route reads well: titles, tone, variable logic, and important endings still need human reading and playthroughs.

Three useful release criteria are: every planned main route is reachable, no state creates an unintended contradiction, and a new passage can be edited without repairing several duplicated copies of the same logic. Use randomness sparingly when it makes reproduction and testing harder. The official documentation itself warns that random behavior can be costly to debug.

## Export, publishing, and boundaries

The official export flow can produce an HTML document for a website or for selected testers. An IFID is needed if an exported browser game should preserve progress; without it, refreshing the page can erase a player's progress. Publishing is not tied to one automatic channel: a project can be tested privately, distributed publicly for free, or submitted to Choice of Games offerings. Hosted Games and commercial publication involve separate requirements and agreements; they are not built-in guarantees of every ChoiceScript project.

ChoiceScript is therefore a useful core for text and story logic, not a replacement for hosting, store contracts, community moderation, translation, or an art and audio pipeline. Those responsibilities and costs should be planned separately before release.

## Rights, privacy, and maintenance

Writing locally in text files reduces dependence on a hosted editor, but it does not settle rights to the content. Check permissions for characters, trademarks, music, images, translations, and third-party contributions before publishing. Unreleased manuscripts should be protected through repository access controls and careful handling of exported HTML files.

For a multi-author project, reviews, branches, and clear ownership matter more than adding obscure syntax. Before a release, record the ChoiceScript version used, the IFID, supported browsers, and how saves are expected to work. This is practical governance for a file-based tool, not a claim that the tool provides a hosted security or compliance layer.

## Cost and effort

ChoiceScript is available as a free tool. That does not make a finished game cost-free: writing, narrative design, editing, testing, translation, assets, hosting, and possible publishing services all require time or budget. If a team applies to a commercial label, it should check the current terms of that label rather than infer a revenue or licensing rule from the free entry point.

## Editorial assessment

I recommend ChoiceScript to writers and small narrative teams building text-first stories with explicit state and a versioned file workflow. It creates the most value when a story has already been broken into scenes, decisions, and test paths, and the team combines Quicktest, Randomtest, and manual playthroughs before release.

For a production led by visuals or complex systems, ChoiceScript should not be the default choice. A tool with a stronger visual-novel, story-editor, or world-model focus will usually be a better match. The fair decision test is a small vertical slice: if one route stays readable, state changes behave predictably, and fixes remain local, the tool is earning its place; if the slice already depends on sprawling workarounds, switch early.

## Alternatives

- [Twine](/en/tools/twine/): better for a fast visual story prototype and browser-based nonlinear hypertext structures.
- [Ink by Inkle](/en/tools/ink-by-inkle/): a good fit when narrative scripts need tighter integration with a custom game or software project.
- [Ren’Py](/en/tools/ren-py/): stronger for visual novels with characters, backgrounds, dialogue presentation, and scene logic.
- [Inform 7](/en/tools/inform-7/): worth considering when rooms, objects, and rules as a world model are the center of the interactive fiction.
- [Squiffy](/en/tools/squiffy/): a lighter option for small linked-text stories and simple choice structures without a large state architecture.

## FAQ

**Do I need programming experience to use ChoiceScript?**

No, but careful file editing and basic logical thinking are still required. The commands are approachable; nested choices, variables, and consistent indentation take practice.

**Can ChoiceScript replace a visual novel engine?**

Not as a general replacement. It can handle text choices and story state, but it is not designed around a large image, audio, or animation pipeline.

**How should I test a branching story?**

Use Quicktest and Randomtest for structural signals, then manually play the important routes. Automated coverage cannot decide on its own whether a scene is clear or dramatically sound.

**Can I publish a ChoiceScript game?**

Yes. The official workflow supports HTML export and several publication paths. Hosted Games, app stores, rights, and commercial terms remain subject to the current requirements and agreements for each route.
