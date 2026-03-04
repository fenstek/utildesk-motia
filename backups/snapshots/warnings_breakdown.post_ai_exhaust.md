# Warnings Breakdown After AI Exhaust

- generated_at: 2026-03-04
- source: `backups/snapshots/sheet_audit.latest.json`
- audit_status: `AUDIT_PASS`
- errors: `0`
- warnings: `29`
- skipped: `64`
- note: `sheet_audit.latest.json` currently groups warnings by `message` because there is no separate warning code field.

## Breakdown

| warning_key | count | example slugs |
|---|---:|---|
| `missing tags` | 19 | `groq`, `openrouter`, `together-ai`, `replicate`, `deepinfra`, `fireworks-ai`, `weaviate`, `qdrant`, `anything-llm`, `open-webui` |
| `duplicate official_url: https://www.anthropic.com/` | 2 | `anthropic`, `claude-von-anthropic` |
| `duplicate official_url: https://www.make.com/` | 2 | `make-ehemals-integromat`, `integromat` |
| `duplicate official_url: https://www.ai21.com/` | 2 | `ai21-labs`, `ai21-studio` |
| `duplicate official_url: https://visualstudio.microsoft.com/services/intellicode/` | 2 | `visual-studio-intellicode`, `intellicode` |
| `duplicate official_url: https://www.canva.com/video-editor/` | 2 | `canva-video`, `canva-video-editor` |

## Category Distribution

### `missing tags`
- `AI`: 9
- `AI Infrastructure`: 8
- `Cloud`: 2

### Duplicate official_url buckets
- `https://www.anthropic.com/`: `AI` (2)
- `https://www.make.com/`: `AI` (2)
- `https://www.ai21.com/`: `AI` (1), `Audio` (1)
- `https://visualstudio.microsoft.com/services/intellicode/`: `Developer` (2)
- `https://www.canva.com/video-editor/`: `Design` (2)

## Next Steps

1. `missing tags`
   Safest next target. The remaining rows are concentrated in a small number of categories (`AI`, `AI Infrastructure`, `Cloud`) and can likely be reduced further with the same strict allowlist/category-mapping approach already used successfully.

2. `duplicate official_url:*`
   Safe only if handled as policy-driven alias/dedupe work, not raw URL edits. These likely need deterministic merge/alias rules or status decisions before changing anything in Sheet.

3. Add explicit warning codes in audit output
   Low-risk repo improvement that will make future warning cleanup reports and automation more stable than grouping by full warning message text.
