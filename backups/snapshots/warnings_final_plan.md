# Final Warnings Plan

Date: 2026-03-04

Current audit: `errors=0`, `warnings=21`, `skipped=64`

Warning bucket breakdown:

| Bucket | Count |
| --- | ---: |
| missing tags | 9 |
| duplicate official_url | 10 |
| tags do not match known category taxonomy | 2 |

## A) Missing-Tag Rows

| slug | title | official_url | category |
| --- | --- | --- | --- |
| anything-llm |  | https://anythingllm.com/ | AI |
| open-webui |  | https://openwebui.com/ | AI |
| jan-ai |  | https://jan.ai/ | AI |
| openai-gpt-modelle |  | https://developers.openai.com/api/docs/models | AI |
| uipath |  | https://www.uipath.com/ | AI |
| monday-com |  | https://monday.com/ | AI |
| google-tabellen |  | https://workspace.google.com/products/sheets/ | AI |
| wavepad |  | https://www.nch.com.au/wavepad/ | AI |
| rephrase-ai |  | https://www.rephraseai.com/ | AI |

Plan:
- These 9 rows are all category `AI`, but they do not share a single deterministic allowlisted tag set.
- Under the current constraints, they need manual category/profile-based review before any tags-only patch can be generated safely.

## B) Duplicate `official_url` Clusters

Canonical candidate ordering below uses the detectable simple-slug heuristic first: shorter direct-brand slug ahead of longer alias/variant slug when present.

| pair_id | official_url | slugs_in_cluster (canonical candidate first if detectable) |
| --- | --- | --- |
| 1 | https://visualstudio.microsoft.com/services/intellicode/ | `intellicode`, `visual-studio-intellicode` |
| 2 | https://www.ai21.com/ | `ai21-labs`, `ai21-studio` |
| 3 | https://www.anthropic.com/ | `anthropic`, `claude-von-anthropic` |
| 4 | https://www.canva.com/video-editor/ | `canva-video`, `canva-video-editor` |
| 5 | https://www.make.com/ | `make-ehemals-integromat`, `integromat` |

Plan:
- Review each cluster for canonical-vs-alias intent.
- Keep the canonical slug on the shared vendor/product URL.
- Move alias/legacy rows to their true distinct official page if one exists, or mark/merge them through the normal duplicate handling workflow.

## C) Remaining Warning Bucket(s) Beyond Missing Tags + Duplicate URLs

### `tags do not match known category taxonomy` (2 warnings)

Examples:
- `runpod`: category `Cloud`, tags `developer-tools`
- `modal`: category `Cloud`, tags `developer-tools`

Interpretation:
- These are the 2 extra warnings that make the total `21`.
- The current audit requires tags to match the site taxonomy matcher, but `Cloud` has no matching tag family in that matcher.
- These rows were valid for missing-tags backfill under strict category-only constraints, but the resulting tags cannot satisfy the taxonomy matcher for `Cloud`.

Cleanup options:
- Add a deterministic `Cloud` tag family to the taxonomy matcher and allowlist, then retag consistently.
- Or move `Cloud` rows into an existing supported taxonomy only if a separate category-correction pass approves it.
- Until then, these 2 warnings are expected residue rather than missing-tags residue.
