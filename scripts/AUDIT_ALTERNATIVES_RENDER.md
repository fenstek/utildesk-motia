# AUDIT_ALTERNATIVES_RENDER

## Purpose

Read-only audit for Alternatives rendering coverage on tool pages.

The script scans `content/tools/*.md` (excluding `_TEMPLATE.md`) and reports, per page:

- whether an `Alternativen` / `Alternatives` section exists,
- how many bullet items are present,
- which items match known tools by `/tools/<slug>` link or title matching,
- how many cards are expected to render (`min(3, matchedEnabledCount)`).

No content files are modified.

## Usage

```bash
node scripts/audit_alternatives_render.mjs [options]
```

## Options

- `--json`: output JSON to stdout (default).
- `--pretty`: pretty-print JSON with 2 spaces.
- `--only <slug>`: audit one page slug only.
- `--limit <N>`: audit first N markdown files after sorting.
- `--out <path>`: additionally write full JSON output to file.
- `--debug`: print diagnostics to stderr only.

## Output Format (JSON)

Top-level shape:

```json
{
  "summary": {
    "scannedFiles": 0,
    "pagesWithAlternatives": 0,
    "pagesWithAlternativesAndNoMatches": 0,
    "totalRawItems": 0,
    "totalMatchedItems": 0,
    "totalMatchedEnabledItems": 0,
    "totalExpectedRenderCards": 0
  },
  "items": [
    {
      "pageSlug": "...",
      "pageTitle": "...",
      "pageDisabled": false,
      "hasAlternatives": true,
      "rawCount": 0,
      "matchedCount": 0,
      "matchedEnabledCount": 0,
      "expectedRenderCount": 0,
      "renderSlugsTop": [],
      "rawAltItems": [
        {
          "raw": "...",
          "extracted": { "linkSlug": null, "titleCandidate": null },
          "match": { "matched": false, "slug": null, "title": null, "disabled": null },
          "reason": "no_match"
        }
      ],
      "missingMatches": []
    }
  ]
}
```

Reason values used per item:

- `link_slug_match`
- `title_exact_match`
- `title_fuzzy_match`
- `matched_but_disabled`
- `no_match`

## Examples

```bash
# default JSON
node scripts/audit_alternatives_render.mjs

# pretty JSON for one page
node scripts/audit_alternatives_render.mjs --only chatgpt --pretty

# write report to file too
node scripts/audit_alternatives_render.mjs --pretty --out /tmp/audit_alternatives.json

# debug to stderr without polluting JSON stdout
node scripts/audit_alternatives_render.mjs --pretty --debug
```
