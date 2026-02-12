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
- `--top <N>`: limit the number of problematic files in summary (default: `20`).

## Examples

```bash
# Human summary
node scripts/audit_alternatives_render.mjs

# JSON report
node scripts/audit_alternatives_render.mjs --json

# JSON report with smaller problematic list
node scripts/audit_alternatives_render.mjs --json --top 10
```
