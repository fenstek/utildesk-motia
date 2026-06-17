# Token-saving rules for Claude Code

This repository is large enough that careless context loading will waste the session. Work surgically.

## Read small, then expand only when necessary

- Start with the handoff files, then one route/component at a time.
- Prefer `rg`, `git grep`, `Select-String`, and `Get-Content -TotalCount` over opening whole files/folders.
- Use `git diff --stat` and `git diff -- <path>` frequently.
- Do not read all markdown tools/articles. Use one representative page and its frontmatter if needed.

## Avoid expensive folders

Do not bulk-read:

- `node_modules/`
- `.wrangler/`
- `site/dist/`
- `content/tools/`
- `content/images/`
- `output/`
- `tmp/`
- `reports/`
- `secrets/`

If an image is needed, locate a single asset by slug and inspect only that file/path.

## Implementation discipline

- Make one visual area at a time: header, footer, card, table, article body, etc.
- Avoid blanket global overrides and `!important` unless there is no clean alternative.
- Prefer named components/classes over route-fragile selectors.
- Keep old and new design paths explicit. Do not create hybrids accidentally.
- Do not edit generated content to solve layout issues.

## Verification discipline

After each batch:

1. `git diff --stat`
2. targeted screenshot(s)
3. `npm --prefix site run build`
4. if data/tool quality could be touched: `npm run check:tool-quality`

When taking screenshots, save them under `output/claude-design/` and reference paths instead of embedding many images into chat.

## Communication discipline

Report compactly:

- changed files
- route checked
- one screenshot path if relevant
- remaining issues
- exact next batch
