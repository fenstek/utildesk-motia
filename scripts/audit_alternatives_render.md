# audit_alternatives_render

## Purpose

Audits how many Alternatives bullet items can be resolved into existing enabled tools for card rendering on tool detail pages.

It scans `content/tools/*.md` (excluding files starting with `_`) and checks:

- whether an Alternatives section exists (`Alternativen` / `Alternatives`)
- bullet item count in that section
- how many bullet items resolve to enabled tools by internal `/tools/<slug>/` link or normalized title matching

## Usage

```bash
node scripts/audit_alternatives_render.mjs [options]
```

## Options

- `--json`: print structured JSON report.
- `--pretty`: pretty-print JSON with indentation.
- `--only <slug>`: audit a single tool page.
- `--limit <N>`: limit the number of scanned markdown files.
- `--out <path>`: also write the JSON report to a file.
- `--debug`: print diagnostics to stderr.

## Examples

```bash
# Human summary
node scripts/audit_alternatives_render.mjs

# JSON report
node scripts/audit_alternatives_render.mjs --json

# Pretty JSON for one page
node scripts/audit_alternatives_render.mjs --pretty --only chatgpt

# Write report to file too
node scripts/audit_alternatives_render.mjs --pretty --out /tmp/audit_alternatives.json
```
