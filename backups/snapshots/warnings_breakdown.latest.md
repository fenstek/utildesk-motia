# Warnings Breakdown

- generated_at: 2026-03-04
- source: `backups/snapshots/sheet_audit.latest.json`
- audit_status: `AUDIT_PASS`
- errors: `0`
- warnings: `153`
- skipped: `64`
- note: `sheet_audit.latest.json` currently has no dedicated warning code/type field, so this report groups warnings by `message`.

## Breakdown

| warning_key | count | example slugs |
|---|---:|---|
| `tags do not match known category taxonomy` | 111 | `gemini`, `perplexity`, `microsoft-copilot`, `runway`, `ai-dungeon`, `replika`, `phrasee`, `character-ai`, `canva`, `leonardo-ai` |
| `missing tags` | 27 | `n8n`, `sora`, `groq`, `openrouter`, `together-ai`, `replicate`, `deepinfra`, `fireworks-ai`, `weaviate`, `qdrant` |
| `tags contain invalid formatting` | 5 | `grammarly`, `jasper`, `deepl`, `notion-ai`, `copy-ai` |
| `duplicate official_url: https://www.anthropic.com/` | 2 | `anthropic`, `claude-von-anthropic` |
| `duplicate official_url: https://www.make.com/` | 2 | `make-ehemals-integromat`, `integromat` |
| `duplicate official_url: https://www.ai21.com/` | 2 | `ai21-labs`, `ai21-studio` |
| `duplicate official_url: https://visualstudio.microsoft.com/services/intellicode/` | 2 | `visual-studio-intellicode`, `intellicode` |
| `duplicate official_url: https://www.canva.com/video-editor/` | 2 | `canva-video`, `canva-video-editor` |

## Top 3 To Fix Next

1. `tags contain invalid formatting`
   Reason: deterministic string cleanup only; low risk because it does not invent new data.

2. `missing tags`
   Reason: can be addressed with a controlled deterministic tag seeding rule for rows where tags are inferable from existing category/domain/title patterns; lower risk than URL or status changes if restricted to known allowlists.

3. `tags do not match known category taxonomy`
   Reason: largest warning bucket; likely needs a deterministic category-to-tag reconciliation pass or taxonomy mapper. Higher volume than the other two, but still safer than deduplicating official URLs.

## Deferred / Higher-Risk Warnings

- `duplicate official_url:*`
  Reason: these likely need alias/merge policy or status decisions rather than direct URL edits. They are not the lowest-risk next cleanup target.
