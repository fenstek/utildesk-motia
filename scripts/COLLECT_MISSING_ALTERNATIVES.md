# COLLECT_MISSING_ALTERNATIVES

## Purpose

Read-only utility to aggregate frequent missing alternative names from an audit JSON.

The script reads audit output (for example from `audit_alternatives_render.mjs`),
collects `missingMatches` with `reason == "title_not_found"`, counts frequencies by
`detail`, and returns a sorted list.

No repository content is modified.

## Usage

```bash
node scripts/collect_missing_alternatives.mjs [source.json] [options]
```

Default source file:

- `/tmp/audit_alternatives_render_v2.json`

## Options

- `--top N` (default: `50`): maximum number of results to return.
- `--min-count K` (default: `2`): include names with at least K occurrences.
- `--json` (default): output JSON to stdout.
- `--pretty`: pretty-print JSON with 2-space indentation.
- `--out <path>`: also write JSON to file (stdout remains JSON, logs to stderr).

## Output JSON

```json
{
  "sourceFile": "/tmp/audit_alternatives_render_v2.json",
  "totals": {
    "pages": 0,
    "missingTitleNotFound": 0,
    "uniqueNames": 0,
    "returnedItems": 0,
    "top": 50,
    "minCount": 2
  },
  "items": [
    { "name": "Writesonic", "count": 12 }
  ]
}
```

## Examples

```bash
# defaults
node scripts/collect_missing_alternatives.mjs

# custom source + pretty output
node scripts/collect_missing_alternatives.mjs /tmp/audit_alternatives_render_v2.json --pretty

# top 30 with min count 3, and save to file
node scripts/collect_missing_alternatives.mjs --top 30 --min-count 3 --pretty --out /tmp/missing_alt_top30.json
```
