# Claude Code design handoff — Utildesk

## Situation

Production has been restored to the safe pre-experiment state.

- Restore tag: `restore/pre-claude-code-design-20260529-baca47ac`
- Safe commit: `baca47ac` — `Revert "design: align dossier pages with decision template"`
- Handoff branch: `codex/claude-design-handoff-20260529`
- Reference PDF: `handoff/claude-code-design/reference/claude_guide_v5_FINAL.pdf`

Important: do **not** resurrect commit `8e145c09` as implementation. It was reverted because it applied broad/global design changes and broke route-specific pages. You may inspect it only as a negative example.

## Mission for Claude Code

Rework the design in the Claude/Entscheidungsblatt direction, but do it structurally and in small verified batches.

Do **not** touch the content pipeline, secrets, cron scripts, Google Sheet automation, deploy config, or generated data unless a design route explicitly requires it.

## Read order

To save tokens, start with only these files:

1. `CLAUDE.md`
2. `handoff/claude-code-design/README.md`
3. `handoff/claude-code-design/TOKEN_SAVING.md`
4. `handoff/claude-code-design/VISUAL_TARGETS.md`
5. Then open only the specific route/component file for the current batch.

Avoid opening broad folders such as `content/tools/`, `content/images/`, `node_modules/`, `.wrangler/`, `tmp/`, `output/`, and `site/dist/`.

## Primary design files

Likely relevant files:

- `site/src/layouts/BaseLayout.astro`
- `site/src/styles/global.css`
- `site/src/components/DecisionTemplateHome.astro`
- `site/src/pages/index.astro`
- `site/src/pages/tools/index.astro`
- `site/src/pages/tools/[slug].astro`
- `site/src/pages/ratgeber/index.astro`
- `site/src/pages/ratgeber/[slug].astro`
- locale equivalents under `site/src/pages/[locale]/...` if English pages are changed too.

## Route batches

Recommended order:

1. **No-op baseline**: build current state and capture screenshots.
2. **Tool index / inventory**: `/tools/`.
3. **Tool dossier / tool-akte**: `/tools/zapier/`, then one more real tool such as `/tools/ableton-live/`.
4. **Ratgeber index**: `/ratgeber/`.
5. **Ratgeber article**: one existing article route.
6. Only after those: legal/methodologie/category pages if needed.

Do one batch, verify visually, then proceed. No broad redesign sweep.

## Must preserve

- Current home header/footer structure unless the task explicitly says otherwise.
- Existing legal links: Datenschutz and Impressum must remain reachable.
- Canonical URLs, sitemap/indexing helpers, `llms.txt`/AI-readable assets.
- Tool data and article content semantics.
- Production safety: do not deploy from this branch without explicit approval.

## Checks

Use `scripts/claude_design_build_check.ps1` for a compact build/quality check.

Manual visual check is still required: compare screenshots route by route, at least desktop width and one mobile-ish width.
