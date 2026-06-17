# normalize_alternatives_links

## Purpose

Normalizes bullet items in the `Alternativen` / `Alternatives` section inside `content/tools/*.md`.

The script converts recognized alternatives into canonical internal links:

- `[Title](/tools/<slug>/): <desc>`

It only maps to enabled tools (`disabled: true` are ignored).

## Usage

```bash
node scripts/normalize_alternatives_links.mjs [options]
```

Default mode is dry-run.

## Options

- `--dry-run` (default): scan and report only, no file writes.
- `--write`: write changes to markdown files.
- `--json`: output report in JSON format.
- `--changed-slug <slug>`: process only files where alternatives section references this slug (via `/tools/<slug>/`) or mentions that tool title.

## Examples

```bash
# Full scan report (default dry-run)
node scripts/normalize_alternatives_links.mjs --json

# Write all possible normalizations
node scripts/normalize_alternatives_links.mjs --write

# Limit processing to files related to figma
node scripts/normalize_alternatives_links.mjs --changed-slug figma --dry-run --json

# Apply only for files related to figma
node scripts/normalize_alternatives_links.mjs --changed-slug figma --write
```
