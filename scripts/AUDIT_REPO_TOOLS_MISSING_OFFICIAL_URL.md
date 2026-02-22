# audit_repo_tools_missing_official_url.mjs — Documentation

Scans all `content/tools/*.md` files and finds those missing a valid
`official_url` in their frontmatter. In `--apply=1` mode, patches the
value from the Google Sheet (source of truth).

## Purpose

The publish pipeline sets `official_url` in frontmatter at generation time,
but some files may have been published before the gate existed, or may have
had their URL cleared. This script provides a repo-level post-publish safety
check and repair tool, independent of the Sheet-level audits.

**Source of truth:** Google Sheet (`Tabellenblatt1`), column K = `official_url`.
This script does **NOT** change any Sheet status — only patches MD files.

## What counts as "missing official_url"

The field is considered missing if it is:

- Absent entirely from the frontmatter
- Empty string / whitespace only
- One of the placeholder values (case-insensitive):
  `nan`, `null`, `undefined`, `none`, `""`, `''`, `-`, `n/a`, `#n/a`

Legacy key names (`website`, `url`) are recognised as fallbacks when reading,
but the write target is always `official_url`.

## Skipped files

Files whose name starts with `_` (e.g. `_TEMPLATE.md`, `_disabled-tool.md`)
are silently skipped, consistent with the project-wide ignore convention.

## Usage

```bash
# Dry-run (default) — report only, no writes
node scripts/audit_repo_tools_missing_official_url.mjs

# Apply: patch MD frontmatter from Sheet
node scripts/audit_repo_tools_missing_official_url.mjs --apply=1

# Apply + fix/normalise empty or invalid tags from Sheet
node scripts/audit_repo_tools_missing_official_url.mjs --apply=1 --fix-tags=1
```

## Flags

| Flag | Effect |
|---|---|
| _(none)_ | Dry-run: scan and report, no writes |
| `--apply=1` | Patch `official_url` in MD files where Sheet has a valid value |
| `--fix-tags=1` | Also fix/normalise `tags` field (only with `--apply=1`) |

## Dry-run output example

```
────────────────────────────────────────────────────────────────────────────
Repo audit: 186 md files scanned  |  8 missing official_url
────────────────────────────────────────────────────────────────────────────

slug                               file                                   official_url_raw (current)
────────────────────────────────────────────────────────────────────────────
adobe-illustrator                  adobe-illustrator.md                   (field absent)
automation-anywhere                automation-anywhere.md                 (field absent)
coreldraw                          coreldraw.md                           (field absent)
inkscape                           inkscape.md                            (field absent)
kreator                            kreator.md                             ""
openai-gpt-modelle                 openai-gpt-modelle.md                  (field absent)
suno                               suno.md                                ""
uipath                             uipath.md                              (field absent)
```

## Apply output example

```
  ✓ fixed: openai-gpt-modelle → https://developers.openai.com/api/docs/models
  ✓ fixed: uipath → https://www.uipath.com/
  ✗ still missing: adobe-illustrator (not in sheet or empty)
  ...
```

## JSON summary

```json
{
  "ok": true,
  "mode": "apply",
  "ts": "2026-02-22T10:27:19Z",
  "scanned_files": 186,
  "missing_official_url_count": 8,
  "fixed_from_sheet_count": 2,
  "still_missing_in_sheet_count": 6,
  "fix_results": [
    { "slug": "uipath",            "outcome": "fixed",        "official_url": "https://www.uipath.com/",  "source": "sheet" },
    { "slug": "adobe-illustrator", "outcome": "still_missing","reason": "not_in_sheet_or_empty" }
  ]
}
```

## --fix-tags=1 behaviour

When `--fix-tags=1` is passed (requires `--apply=1`):

1. If `tags` is absent or empty → restore from Sheet column D (comma-separated).
2. If Sheet also has no tags → reported as `tags_missing_in_sheet`, file not changed.
3. If `tags` already exist → normalise (lowercase, trim, deduplicate).
4. If after normalisation only `"ai"` or `"produktivität"` remain → reported as
   `tags_invalid_needs_review`, file **not** changed (do not silently downgrade tags).

This step never changes Sheet status.

## When to run

| Trigger | Command |
|---|---|
| Before enabling cron after a long pause | `--apply=1` |
| After bulk import / manual MD creation | `--apply=1` |
| Periodic health check (weekly) | dry-run, alert if count > 0 |
| After merging a large PR | dry-run |

**Not part of the regular cron** — run manually or in CI.

## Safety

- Dry-run by default — no writes unless `--apply=1`.
- `official_url` values from Sheet are validated via `validateOfficialUrl()` before writing.
- Frontmatter patcher preserves file structure: only the targeted field changes.
- Sheet rows are never modified by this script.
- Files starting with `_` are never touched.
