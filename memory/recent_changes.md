# Recent Changes

## Recent Commits
- 33e0057 Merge pull request #158 from fenstek/fix/tools-grid-stability-v2
- 7e160c5 fix(ui): lock tools grid columns (prevent deformation after load more)
- d48ff64 Merge pull request #157 from fenstek/fix/tools-grid-stability
- 4c20707 fix(ui): stabilize tools grid after load more
- 15fbea7 Merge pull request #156 from fenstek/fix/sync-autobot-master
- 6d0ce15 chore(sync): merge autobot fixes into master
- b157211 Merge pull request #155 from fenstek/fix/blacklist-jarvis
- b6b7b6c fix(blacklist): remove jarvis — invalid official_url, phantom/alias
- ba981ea fix(cron): do not reset autobot when ahead; keep publish fixes
- 7495cae fix(guard): allow new tool md before commit (remove tracked precheck)

## Working Tree
- M scripts/README.md
- ?? ai-os/
- ?? backups/
- ?? scripts/backup_project_full.sh
- ?? scripts/backup_sheet_snapshot.mjs
- ?? scripts/cron_restore.sh
- ?? scripts/cron_safety_pause.sh
- ?? scripts/generate_project_memory.mjs
- ?? scripts/memory_system.md
- ?? scripts/project_memory_lib.mjs
- ?? scripts/review_project_memory.mjs
- ?? scripts/update_project_memory.mjs

## Notes
- Untracked backup and cron helper files existed before this memory generation run.
- Use `scripts/update_project_memory.mjs` after code changes to refresh summaries from git diff.

## Sheet Patch Pipeline
- Introduced deterministic sheet QC flow: snapshot -> audit -> patch proposal -> apply via `scripts/apply_sheet_patch.mjs` -> re-snapshot -> re-audit.
- Latest files: `backups/snapshots/sheet_snapshot.latest.json`, `backups/snapshots/sheet_audit.latest.json`, `backups/snapshots/sheet_patch.proposed.json`, `backups/snapshots/sheet_patch_apply.log`.
- Direct Sheet writes should move to `scripts/apply_sheet_patch.mjs` instead of ad hoc script usage.

## Codex Proposer
- Added `scripts/propose_sheet_patch_codex.sh` to let Codex read snapshot + audit and emit patch JSON only.
- Added `SHEET_PROPOSER=stub|codex` feature flag; default is `stub`.
- `sheet_ai_autogen_9_strict_v2.mjs` now defaults to safe QC orchestration mode and only uses the legacy OpenAI autogen path if `LEGACY_OPENAI_AUTOGEN=1`.

## Apply 2026-03-04T00:47:43Z
- Applied first real Codex patch with `node scripts/apply_sheet_patch.mjs --patch backups/snapshots/sheet_patch.codex.json --strict --max-changes 50`.
- Scope: codex patch, max 50 changes.
- Baseline metrics: errors=27 warnings=192.
- After apply metrics: errors=27 warnings=192.
- Patch path: `backups/snapshots/sheet_patch.codex.json`.
- Apply log: `backups/snapshots/sheet_patch_apply.log`.
- Follow-up dry-run was started with `bash scripts/run_sheet_qc_pipeline.sh --proposer=codex` to prepare the next batch without auto-apply.

## Apply 2026-03-04T01:15:54Z
- Applied errors-only batch from `backups/snapshots/sheet_patch.codex.json` with `--strict --max-changes 50`.
- Scope: errors-only apply batch (7 changes in current patch file).
- Baseline metrics: errors=27 warnings=194.
- After metrics: errors=27 warnings=194.
- Delta: errors=0 warnings=0.
- Changes:
- row 144 `official_url` -> `https://kuki.ai/`
- row 161 `official_url` -> `https://openai.com/research/whisper`
- row 381 `category` -> `Automatisierung`
- row 382 `category` -> `Automatisierung`
- row 443 `official_url` -> `https://code.visualstudio.com/docs/remote/codespaces`
- row 463 `category` -> `Automatisierung`
- row 484 `official_url` -> `https://www.rephraseai.com/`
- 20260304-013459: errors-only batch, changes=0, 20/198 -> 20/198, blocked=no_deterministic_fixes, artifacts=backups/snapshots/batches/20260304-013459
- 20260304-014120: taxonomy batch, changes=0, 20/198 -> 20/198, blocked=no_category_fixes, artifacts=backups/snapshots/sheet_patch.codex.json
- 20260304-015000: domain->category mapper introduced for taxonomy errors; pending apply via backups/snapshots/sheet_patch.taxonomy_map.json
- 20260304-014727: domain->category mapper applied, fixed 7 category errors, 20/198 -> 13/198, patch=backups/snapshots/sheet_patch.taxonomy_map.json
- 20260304-015401: url_errors batch applied, fixed 2 official_url errors, 13/198 -> 11/198, patch=backups/snapshots/sheet_patch.url_errors.json
- 20260304-020000: audit QC eligibility added; blacklist/disabled/duplicate/alias rows are now skipped instead of producing audit findings
- 20260304-063000: url policy now allows https://huggingface.co/ as a platform-root official_url; generic-root blocking remains for other hosts
- 20260304-070500: fixed 5 tag formatting warnings via strict sheet patch; tags contain invalid formatting is now 0 and warnings moved 153 -> 148
- 20260304-072000: backfilled missing tags for 8 rows via strict allowlist/category mapping; missing tags moved 27 -> 19 and warnings 148 -> 140
- 20260304-073000: taxonomy mismatch batch 1 for AI applied on 25 rows; tags/category mismatch moved 111 -> 86 and warnings 140 -> 115
- 20260304-074000: taxonomy mismatch batch 2 for AI applied on 25 rows; AI mismatch moved 86 -> 61 and warnings 115 -> 90 with errors still 0
- 20260304-075000: exhausted remaining AI taxonomy mismatch warnings in one strict batch; AI mismatch moved 61 -> 0 and warnings 90 -> 29 with errors still 0
- 20260304-080000: missing tags pass 2 applied 10 strict tags-only changes via `backups/snapshots/sheet_patch.missing_tags.pass2.json`; missing tags moved 19 -> 9, warnings 29 -> 21, errors stayed 0, and the remaining unresolved slugs are all category `AI` with no further deterministic category/profile mapping available
- 20260304-085500: reconciled `runpod` and `modal` tags via strict tags-only patch `backups/snapshots/sheet_patch.taxonomy_mismatch.runpod_modal.json`; taxonomy mismatch warnings moved 2 -> 0 and total warnings 21 -> 19 with errors still 0
- 20260304-151500: backfilled the remaining 9 missing-tag rows using deterministic slug overrides in `scripts/propose_missing_tags_patch.mjs`; strict apply via `backups/snapshots/sheet_patch.missing_tags.overrides.json` moved missing tags 9 -> 0 and warnings 19 -> 10 with errors still 0
- 20260304-152000: resolved the final 5 duplicate `official_url` clusters by marking non-canonical rows `duplicate` via `backups/snapshots/sheet_patch.duplicate_official_url.resolve.json`; added a narrow `--allow-duplicate-status-resolution` guard to patch validation/apply, documented it in `scripts/sheet_patch_format.md`, and moved warnings 10 -> 0 with skipped_duplicate_or_alias 0 -> 5 and errors still 0
