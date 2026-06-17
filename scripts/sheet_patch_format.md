# Sheet Patch Format

- Purpose: represent minimal, reviewable Google Sheet changes before any write happens.
- The only writer is `scripts/apply_sheet_patch.mjs`.
- A patch must be deterministic, explicit, and traceable to a snapshot or audit report.

## JSON Shape

```json
{
  "meta": {
    "generated_at": "2026-03-04T00:00:00.000Z",
    "source_snapshot": "backups/snapshots/sheet_snapshot.latest.json",
    "notes": "safe automatic fixes only"
  },
  "changes": [
    {
      "row_id": 42,
      "slug": "example-tool",
      "column": "official_url",
      "old_value": " https://example.com/ ",
      "new_value": "https://example.com/",
      "reason": "trim_whitespace",
      "confidence": "high"
    }
  ]
}
```

## Requirements

- `changes` must stay minimal: one cell per item.
- Each item must include `reason`.
- `confidence` must be one of `low`, `medium`, `high`.
- `row_id` should be the snapshot row number unless a stronger stable identifier exists.
- `old_value` must reflect the source snapshot value used to generate the patch.

## Safety Rules

- Mass edits are forbidden unless every item has a concrete `reason`.
- Critical columns are blocked by default. `status` requires `--allow-status` at apply time.
- Narrow exception: `--allow-duplicate-status-resolution` permits `status` updates only when the new value is one of `duplicate`, `dup`, `alias`, `aliased`, the patch reason starts with `resolve_duplicate_official_url:`, and the target row is currently in the duplicate `official_url` audit bucket.
- Unknown columns are rejected.
- Ambiguous fixes must not be auto-proposed; leave them for manual review in `meta.notes`.
