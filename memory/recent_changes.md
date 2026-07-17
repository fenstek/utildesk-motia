# Recent Changes — utildesk-motia
_Last updated: 2026-07-16_

## 2026-07-17 - Editorial-clean batch of 100 tool cards

- Reworked the 100 highest-severity flagged active cards from the editorial coverage audit in DE and EN, preserving existing illustrations and popularity values.
- Added full editorial structure, practical workflow and limits, localized assessment, verified internal alternatives, FAQ coverage, and synchronized paired metadata/last-modified entries.
- Release spec is stored outside the repository at `/home/jgdus/release-spec-editorial-100-2026-07-17.json`; no illustration or popularity-only changes are included.

## 2026-07-16 - Final nine-card illustration runtime release

- Published the final nine tool-card illustrations through the D1/R2 runtime from source commit `c05d478c`: 18 DE/EN locale entries, nine R2 objects and five transactional D1 statements.
- The bounded delta gate passed all 63 checks with zero failures; both global IndexNow and Bing accepted all 18 canonical URLs with HTTP `200`. No Astro/Pages build ran and `dist` stayed unchanged.
- The tracked request ledger is `1169/10000`. The active DE/EN illustration gap is now zero; the release backup is stored under the private `20260716-illustrations9` package.

## 2026-07-16 - Nine final tool-card illustrations

- Generated nine distinct narrative illustrations in-chat with Codex subscription image generation, without Gemini or external API calls: Zoho Office Suite, Zoho Social, Zoom Phone, Zoho People, Zoho Sheet, Zoho Workplace, Zoho Writer, Zoho Zia and Zulip.
- Normalized every asset to `1280x720` WebP and inserted one shared figure into each DE/EN card with language-specific alt text. Existing card copy, FAQs and alternatives were preserved.
- Registered the batch in `docs/04_operations/tool_card_illustration_registry.json` and `docs/04_operations/illustration_batches/2026-07-16-codex-chat-style-variety-9.json`.

## 2026-07-16 - 63 tool-card illustration runtime release

- Integrated seven isolated OptiPlex Luna batches produced through the Codex subscription without Gemini or API billing: 63 distinct 1280x720 WebP illustrations, 126 paired DE/EN card references, batch manifests and the central illustration registry.
- Preserved the existing editorial prose, FAQs and alternatives outside the inserted figure blocks; replaced inactive alternatives in Simplenote, Sistrix and Zeplin before release.
- Published source commit `6aa676f1` through the D1/R2 runtime path: 126 locale rows in 32 D1 statements, 63 content-addressed R2 objects, 441/441 live delta checks green, and both global and Bing IndexNow endpoints returned `200` for all 126 canonical URLs.
- Astro/Pages were not rebuilt and `dist` remained unchanged. The internal daily live-request ceiling is now 10,000; the tracked worst-case ledger is 1,076/10,000, and nine active paired cards remain without illustrations.

## 2026-07-16 - Runtime asset delivery recovery

- Diagnosed the unstyled production homepage and tool pages as a deployment-bundle error, not a D1/R2 publication failure: runtime HTML referenced `/runtime-assets/BaseLayout.C877vJB7.css`, while the active Worker version returned `404` for that asset. The ten new content-addressed WebP files were already healthy in R2.
- Rebuilt and deployed the production renderer through Astro's generated `dist-runtime/server/wrangler.json`, which attaches the `ASSETS` directory alongside D1, R2 and the explicit existing `SESSION` KV namespace. Production version `47a09f05-9366-4cf3-bc12-1c4a66e57540` now serves the shared stylesheet with immutable caching.
- Added `check_runtime_deploy_bundle.mjs`, two regression tests and the supported `npm run deploy:runtime` command. Direct `wrangler deploy dist-runtime/server/entry.mjs` deployment is now documented as forbidden because it drops hashed CSS/JS assets.
- Bounded production proof: homepage `200 tool-shell-v1`; shared CSS `200 text/css`, 261551 bytes; Crisp `200 tools-v1`; Crisp illustration `200 image/webp`, 104842 bytes, `X-Utildesk-Asset-Source: r2`. Full local runtime suite passed 76/76.

## 2026-07-14 - OptiPlex editorial-50 and illustration-36 release

- Integrated five isolated OptiPlex editorial branches with 50 fully rewritten DE/EN tool cards under batch `2026-07-14-optiplex-editorial-50`; all cards retain verified alternatives, FAQs, official-source notes, and manual editorial metadata.
- Added 20 independent Codex-subscription illustrations from the OptiPlex artwork branch and completed 16 further images required by the editorial release guard, for 36 new DE/EN card illustrations in total.
- Preserved the run as recovery bundles under `C:\projects\private\utildesk-optiplex-runs\20260714-editorial50-images20` and recorded the combined release manifest in `docs/04_operations/illustration_batches/2026-07-14-editorial50-illustrations36.json`.

## 2026-07-14 - Removed unsafe generic Deepfake entry

- Moved Sheet row 193 from `DONE` to `BLACKLIST` and cleared the guessed `deepfake.com` official URL after manual verification showed that the destination is an adult creator platform, not a concrete product tool.
- Disabled the DE/EN repository cards, removed them from search/API/routes, and redirected the stale public paths to the corresponding tool indexes.
- Hardened current and legacy official-URL resolvers plus the suspicious-row postcheck so the verified adult destinations cannot be auto-published again.

## 2026-07-14 - Functional ranked catalogue and Ratgeber search

- Fixed Cloudflare Pages middleware so safe `/tools/` and `/en/tools/` search and filter parameters survive canonical redirects while tracking noise is still removed.
- Replaced the title-only catalogue match with normalized weighted DE/EN search across names, slugs, categories, tags, and editorial descriptions; matching Ratgeber articles now appear in the same result view.
- Added the `check:search` regression contract and verified modal submission, relevance ordering, empty results, guide matches, and mobile layout with Playwright before release.
- Added an explicit complete-index loading state so the small server-rendered preview can never masquerade as the final result set while `/api/tools.json` is still loading.

## 2026-07-14 - Dimensions full bilingual tool-card editorial pass

- Rewrote the DE/EN Dimensions cards from official product, Help Center, API release-note, pricing/access, and privacy materials, covering linked research data, discovery workflows, evaluation limits, integrations, licensing, and international data handling.
- Added a practical research workflow, measurable quality checks, five verified internal alternatives, and six practical FAQs in both languages with a concrete editorial assessment.
- Preserved the existing single `dimensions-editorial.webp` illustration and refreshed only the paired card metadata and last-modified entries.

## 2026-07-14 - Dialogflow full bilingual tool-card editorial pass

- Rewrote the DE/EN Dialogflow cards from official Google Cloud documentation, Conversational Agents pricing, compliance/security controls, quotas, and release notes, covering ES/CX boundaries, flows, playbooks, webhooks, versioned environments, evaluation, governance, and usage-based costs.
- Added a concrete rollout workflow, four verified internal alternatives, five practical FAQs per language, and an explicit editorial assessment.
- Preserved the existing single `dialogflow-editorial.webp` illustration and refreshed only the paired card metadata and last-modified entries.

## 2026-07-14 - DesignEvo full bilingual tool-card editorial pass

- Rewrote the DE/EN DesignEvo cards from official product, feature, pricing, Help Center, privacy, and terms pages, covering template editing, account-based storage, export boundaries, commercial-use licensing, icon provenance, privacy, and the lack of a backup service.
- Added a practical logo workflow, quality and trademark checks, concrete editorial assessments, five verified internal alternatives, and six practical FAQs in both languages.
- Preserved the existing single `designevo-editorial.webp` illustration and refreshed only the paired card metadata and last-modified entries.

## 2026-07-14 - Datadog full bilingual tool-card editorial pass

- Rewrote the DE/EN Datadog cards from official observability, APM, security, pricing, and documentation sources, covering Agent-based collection, traces, logs, instrumentation, incident workflow, governance, and usage-based cost structure.
- Added a practical rollout and incident workflow, measurable quality criteria, concrete editorial assessments, five verified internal alternatives, and four practical FAQs in both languages.
- Preserved the existing single `datadog-editorial.webp` illustration and refreshed only the paired card metadata and last-modified entries.

## 2026-07-14 - DataCamp full bilingual tool-card editorial pass

- Rewrote the DE/EN DataCamp cards from official product, support, pricing, privacy, security, DataLab, and content-update sources, covering browser exercises, notebook-based projects, tracks, DataLab boundaries, AI-native data handling, and subscription structure.
- Added a practical learning workflow, transfer and quality criteria, governance guidance, concrete editorial assessments, five verified internal alternatives, and seven practical FAQs in both languages.
- Preserved the existing single `datacamp-editorial.webp` illustration and refreshed only the paired card metadata and last-modified entries.

## 2026-07-14 - Databricks full bilingual tool-card editorial pass

- Rewrote the DE/EN Databricks cards from official lakehouse, compute, SQL, security/trust, pricing, and release-note materials, covering Spark, Delta Lake, Unity Catalog, Lakeflow Jobs, MLflow, governance, staged releases, and workload-dependent costs.
- Added a practical ingestion-to-serving workflow, quality and operations checks, concrete editorial assessments, five verified internal alternatives, and five practical FAQs in both languages.
- Preserved the existing single `databricks-editorial.webp` illustration and refreshed only the paired card metadata and last-modified entries.

## 2026-07-14 - Darktable full bilingual tool-card editorial pass

- Rewrote the DE/EN Darktable cards around the local RAW workflow: Lighttable, Darkroom pixelpipe, styles, XMP sidecars, library backups, local copies, export profiles, metadata review, and upgrade boundaries, using official Darktable documentation and release notes.
- Added a concrete culling-to-export workflow, quality criteria, privacy and file-governance guidance, realistic operating-cost structure, four verified internal alternatives, and six practical FAQs in both languages.
- Preserved the existing single `darktable-editorial.webp` illustration and refreshed only the paired card metadata and last-modified entries.

## 2026-07-14 - Connected Papers full bilingual tool-card editorial pass

- Rewrote the DE/EN Connected Papers cards from the official product, FAQ, about, pricing, privacy, and terms pages, covering similarity graphs, Prior/Derivative Works, Semantic Scholar data provenance, workflow boundaries, governance, and current plan structure.
- Added a practical research workflow, quality-control limits, concrete editorial assessments, five verified internal alternatives, and six practical FAQs in both languages.
- Preserved the existing single `connected-papers-editorial.webp` illustration and refreshed only the paired card metadata and last-modified entries.

## 2026-07-14 - Conceptboard full bilingual tool-card editorial pass

- Rewrote the DE/EN Conceptboard cards from official product, Help Center, pricing, security, and changelog sources, covering boards/projects, roles, tasks, approvals, exports, integrations, current plan structure, and cloud-only operating boundaries.
- Added a practical workshop-to-approval workflow, quality checks, governance guidance, concrete editorial assessments, five verified internal alternatives, and six practical FAQs in both languages.
- Preserved the existing single `conceptboard-editorial.webp` illustration and refreshed only the paired card metadata and last-modified entries.

## 2026-07-14 - Tool-card quality campaign, CockroachDB

- Rewrote the DE/EN CockroachDB cards around distributed SQL architecture, quorum replication, transaction retries, rollout workflow, backup/restore, security governance, current Cloud cost structure, and license boundaries.
- Added four verified internal alternatives and five practical FAQs per language, while preserving the existing `cockroachdb-editorial.webp` illustration in both cards.

## 2026-07-13 - Tool-card quality campaign, Seeing AI, StackBlitz and Tableau

- Rebuilt the DE/EN cards around concrete use cases, operating boundaries, practical workflows, verified internal alternatives, and FAQs.
- Preserved the existing editorial illustrations and changed no shared CSS, generators, or generated files. Weaviate remains pending because its source worktree did not contain the original illustration.

## 2026-07-13 - Tool-card quality campaign, DominKnow, QQ Browser, Whisper and FaceSwap

- Rebuilt the DE/EN cards around concrete workflows, product boundaries, practical use cases, verified internal alternatives, and FAQs.
- Preserved each existing editorial illustration and changed no shared CSS, generators, or generated files. These cards are part of the 100-card accumulation batch and are not deployed individually.

## 2026-07-13 - Tool-card quality campaign, Proto.io, Fujitsu A64FX, Graphcore IPU and NVIDIA Tensor Core GPUs

- Rebuilt the DE/EN cards around concrete workloads, boundaries, practical workflows, verified internal alternatives, and FAQs.
- Preserved each existing editorial illustration and changed no shared CSS, generators, or generated files. These cards remain in the 100-card accumulation batch.

## 2026-07-13 - Tool-card quality campaign, Axis Communications, SoapUI, Stanza and SaneBox

- Rebuilt the DE/EN cards around concrete workflows, operating boundaries, practical use cases, verified internal alternatives, and FAQs.
- Preserved each existing editorial illustration and changed no shared CSS, generators, or generated files. The cards remain unpublished until the 100-card batch release.

## 2026-07-13 - Tool-card quality campaign, Sketch, Pluralsight, Pictory and Tidio

- Rebuilt the DE/EN cards around concrete workflows, operating boundaries, practical use cases, verified internal alternatives, and FAQs.
- Preserved each existing editorial illustration and changed no shared CSS, generators, or generated files. The cards remain in the 100-card accumulation batch.

## 2026-07-13 - Tool-card quality campaign, Peppertype.ai, MailerLite, VSCO and YouCam Makeup

- Rebuilt the DE/EN cards around concrete workflows, operating boundaries, practical use cases, verified internal alternatives, and FAQs.
- Preserved each existing editorial illustration and changed no shared CSS, generators, or generated files. The cards remain in the 100-card accumulation batch.

## 2026-07-13 - Tool-card quality campaign, JSBin, LingQ, Webflow and DALL·E

- Rebuilt the DE/EN cards around concrete workflows, operating boundaries, practical use cases, verified internal alternatives, and FAQs.
- Preserved each existing editorial illustration and changed no shared CSS, generators, or generated files. The cards remain in the 100-card accumulation batch.

## 2026-07-13 - Tool-card quality campaign, Chai, Biteable, BandLab and Appian

- Rebuilt the DE/EN cards around concrete workflows, operating boundaries, practical use cases, verified internal alternatives, and FAQs.
- Preserved each existing editorial illustration and changed no shared CSS, generators, or generated files. The cards remain in the 100-card accumulation batch.

## 2026-07-13 - Tool-route build integrity gate

- Repaired `scripts/test_tool_route_entries.mjs` so it resolves the current checkout instead of a stale `/opt/utildesk-motia` path and can run with plain Node on Windows.
- Added `scripts/check_built_tool_routes.mjs` to verify every active DE tool source has a matching `site/dist/tools/<slug>/index.html` after Astro renders.
- Wired that guard into `site` postbuild, so a partial static artifact now fails before sitemap generation or deployment.

## 2026-07-13 - Binder human editorial rewrite

- Replaced the thin, template-like DE/EN Binder card with a fact-checked editorial explanation of reproducible repository launches, cold-start behaviour, ephemeral sessions, public-service limits, privacy boundaries, and when self-operated BinderHub or JupyterHub is the better fit.
- Added a practical sharing check, four maintained internal alternatives, four FAQs, current review metadata, and retained the normalized editorial illustration.

## 2026-07-13 - Babbel rendered alternatives correction

- Fixed the DE/EN alternatives syntax so the tool detail renderer recognizes and displays the internal cards for Duolingo, Busuu, Memrise, Rosetta Stone, and LingQ instead of removing the section without a replacement.
- Added optional per-card editorial verdict fields to both localized tool-detail templates and applied a Babbel-specific assessment, replacing generic template wording with concrete guidance.
- Rebuilt the entire static output in a single isolated process after production served a partial artifact with valid source cards returning 404; the fresh output contains the affected tool pages for deployment verification.

## 2026-07-12 - Seven-point search recovery patch

- Tool inventory initial HTML is now 36 prioritized cards; full DE/EN inventory loads from the existing noindex JSON endpoints only after user interaction.
- Category pages render 24 prioritized cards and route deeper discovery through the tool inventory.
- Shared compact focus list moved to `site/src/lib/searchFocus.mjs`; generated Google/Bing/focus sitemaps contain 112 identical URLs and remain intentionally narrow.
- Added deterministic Ratgeber sibling links and a generated reverse-link manifest from `relatedTools` to tool cards.
- Added shorter Ratgeber titles, corrected EN ChatGPT/Gemini descriptions, and an Umami `engaged-human` event requiring 10 seconds plus scroll/internal click.
- Added a public GitHub README and `docs/public/ai-agent-evaluation-checklist.md` as a linkable resource without personal data.
- Full build passed on 3,450 pages; `/tools/` dropped from about 3.78 MB to 164 KB and `/en/tools/` to 136 KB.

## 2026-07-12 - Fresh Google/Bing search recovery audit

- Re-audited all 120 compact sitemap URLs live: the three sitemap sets are identical and no focus URL has an HTTP, canonical, robots, Googlebot, title, or content-type conflict.
- Fresh GSC API readback after resubmission shows `120 submitted`, `0 indexed`, no warnings/errors; known core pages remain crawled-not-indexed with old March-April crawl dates, while Ratgeber remains unknown to Google.
- Bing continues healthy crawling but reported `InIndex` fell from `1909` on 2026-06-09 to `173` on 2026-07-10, with zero impressions in the latest 28-day traffic window and no inbound-link targets in the Bing backlink API.
- Identified the main strategy conflict: `/tools/` is 3.78 MB and exposes 1229 direct tool links despite the compact sitemap, while category/tag surfaces keep the crawl graph broad across a 3450-page build.
- Saved the evidence and prioritized crawl-focus, Ratgeber-cluster, focus-tool, authority, and measurement plan in `docs/04_operations/search_recovery_live_audit_2026-07-12.md`.
- Resubmitted the current Google sitemap and Bing focus feed; submitted nine changed Ratgeber/home URLs through both IndexNow endpoints with HTTP 200 responses.

## 2026-07-11 - Remaining Ratgeber illustration backfill

- Audited all 37 DE Ratgeber articles and their EN siblings for both `coverImage` and `secondaryImage`; the only incomplete pairs were `code-search-fur-ki-agenten-wie-tools-repository-kontext-token-effizient-machen`, `warum-google-neue-tool-kataloge-ignoriert-was-ein-technischer-seo-check-nicht-lo`, and `was-ai-tool-verzeichnisse-wirklich-nutzlich-macht-entscheidungshilfe-statt-tool`.
- Generated six distinct story-forward raster illustrations directly with OpenAI image generation, without Gemini: one cover and one in-article scene per topic, with deliberately different photographic, architectural, map, collage, and screen-print treatments.
- Converted the approved originals to compressed `1536x1024` WebP, shared each pair across DE/EN, added localized alt text, and verified that no Ratgeber article remains without either required image field.

## 2026-07-10 - Latest Sheet hype tool-card illustrations

- Added one story-forward OpenAI-generated raster illustration to each of the 12 manually edited DE/EN Sheet hype cards from rows `1996-2007`: `claude-tag`, `google-jules`, `microsoft-agent-framework`, `browser-use`, `openart-director`, `adobe-creative-agent`, `databox-mcp`, `latitude`, `cotypist`, `mina-meeting-assistant`, `bluerails-discovery`, and `propane`.
- Kept every scene visually distinct: risograph, gouache, architectural watercolor, neo-noir mixed media, analog film collage, paper-cut collage, claymation, Swiss linocut poster, colored pencil, documentary magical realism, Art Deco travel poster, and botanical engraving.
- Normalized all assets to `1280x720` WebP and inserted the shared image in both language variants before the main functions/features section, with language-specific descriptive alt text.
- Registered the batch in `docs/04_operations/tool_card_illustration_registry.json`; future illustration batches must skip these slugs.

## 2026-07-10 - Multi-model coding workflows Ratgeber publication

- Took the physical OptiPlex NotebookLM draft `20260708-multi-model-coding-workflows-wenn-codex-gemini-und-claude-sich-gegenseit-workflow_article-28c6dad5` as the source, then manually rewrote and fact-checked it into the DE/EN Ratgeber article `multi-model-coding-workflows-codex-gemini-claude-code-review`.
- Removed unsupported adoption, cost-saving and model-personality claims from the draft. The published article instead grounds the workflow in explicit roles, small diffs, cold review, test evidence, isolated Git worktrees, restricted permissions and human merge ownership.
- Added internal links to OpenAI Codex, Claude, Gemini, GitHub Copilot and Cursor, plus related Ratgeber clusters on coding agents, AI code review, developer workflows and agent observability.
- Generated two visibly distinct final raster illustrations directly with OpenAI image generation: an editorial screenprint-and-gouache cover and a documentary-style review-workbench scene. Both were inspected, converted to compressed `1536x1024` WebP, and stripped of embedded metadata before being placed under `content/images/ratgeber/`.

## 2026-07-09 - Agent Observability NotebookLM source enrichment

- Refreshed the physical OptiPlex NotebookLM notebook `2b35c79f-088f-46b6-808b-47a2eaf642c5` (`Agent Observability & Debugging: Traces, Telemetry und Failure Analysis`) under `NOTEBOOKLM_HOME=/home/jgdus/.notebooklm`.
- Added 11 practical/current observability sources around LangSmith, Arize Phoenix, OpenAI Agents SDK tracing, OpenTelemetry GenAI semantic conventions, MLflow, Temporal, and Braintrust; final NotebookLM source count is `25`, all ready.
- Generated a German supplemental rework briefing, not a publication draft replacement: artifact `b7463874-4eff-4178-bcdb-f7b6c24cff2f` (`Rework-Briefing: Agent Observability & Debugging`).
- Downloaded the briefing to OptiPlex at `artifacts/article_jobs/20260703-agent-observability-und-debugging-wie-teams-ki-agenten-nachvollziehbar-m-explainer-252b9711/source-rework-briefing-20260709.md`.
- Keep this candidate in the NotebookLM-first manual editorial queue; next publication attempt should use the original NotebookLM article plus this source-update briefing for factual/tooling depth, not generate a standalone replacement.

## 2026-06-25 - Coding-Agent NotebookLM duplicate merged into existing Ratgeber

- Ran duplicate review for the OptiPlex NotebookLM artifact `59e4a74a-d7c6-4f5b-a1fa-793a77bfc9b9` (`Vom Coding-Agent zum Arbeitsagenten: Codex, Claude Code und Antigravity`) and decided not to publish it as a standalone Ratgeber because it overlapped strongly with the existing developer-workflow cluster.
- Merged the non-duplicate editorial substance into the existing DE/EN article `wie-agentische-developer-workflows-gerade-produktionsreif-werden-einordnung-prax`: context discipline, `AGENTS.md`/`CLAUDE.md`, hooks, permissioned tool use, and the transfer from coding-agent practices into broader knowledge work.
- Added visible `updated: 2026-06-25` metadata support to Ratgeber rendering so updated articles can expose `dateModified` and show an "updated" label without changing the original publication date.
- Marked the NotebookLM candidate on the physical OptiPlex contour as published-through-merge via `published_marker.json` and `data/article_jobs/published_signatures.json`; it should no longer be offered as a fresh standalone publication candidate.

## 2026-06-24 - Sheet hype candidates added from live trend scan

- Added 12 new hype/tool candidates directly to the Google Sheet source of truth, rows `1996-2007`, all with status `NEW` after duplicate checks and live `200` official URL checks.
- Added slugs: `claude-tag`, `google-jules`, `microsoft-agent-framework`, `browser-use`, `openart-director`, `adobe-creative-agent`, `databox-mcp`, `latitude`, `cotypist`, `mina-meeting-assistant`, `bluerails-discovery`, and `propane`.
- Notes mark priority A/B/C provenance; `adobe-creative-agent` is explicitly noted as an agentic Adobe/Firefly-adjacent capability rather than a duplicate of `adobe-firefly`, and C candidates carry `verify_editorially_before_publish=true`.
- The first append landed shifted into `G:V`; rows `1996-2007` were immediately corrected to `A:P` and the extra `Q:V` tail cleared. Verified the final block through the Google Sheets connector.

## 2026-06-24 - Sheet hype candidates published through subscription-backed scripts

- Switched `scripts/generate_tool_md.mjs` from mandatory `OPENAI_API_KEY` to the local Codex CLI OAuth/subscription backend by default, matching the English translation workflow. The OpenAI API remains only an explicit/fallback backend when a key is present.
- Hardened `scripts/publish_one_slug.mjs` on Windows: `npm.cmd` runs through `cmd.exe` without the Node `shell: true` warning, and per-slug English translation is forced on retries so stale EN files are not kept after a regenerated DE card.
- Published full DE/EN cards for Sheet rows `1996-2007` and marked all 12 as `DONE`: `claude-tag`, `google-jules`, `microsoft-agent-framework`, `browser-use`, `openart-director`, `adobe-creative-agent`, `databox-mcp`, `latitude`, `cotypist`, `mina-meeting-assistant`, `bluerails-discovery`, and `propane`.
- Synced category corrections back to the Sheet for `microsoft-agent-framework`, `browser-use`, and `adobe-creative-agent`; generated `tool-added-at` dates via `generated_at` fallback for uncommitted new cards.
- Validation passed: `check:editorial`, `check_english_tool_translations`, `check:tool-quality`, and `npm --prefix site run build` with compact sitemap output still at 116 URLs.

## 2026-06-24 - Sheet hype 12 human editorial polish

- Revisited the 12 newly published hype candidates after confirming they were full generated cards but not yet manually marked as editorially reviewed.
- Added explicit manual editorial metadata in both DE and EN (`editorial_reviewed: true`, `editorial_status: manual_polished`, batch `2026-06-24-sheet-hype-12-human-polish`) so the autogenerated/unreviewed disclosure is suppressed by the existing tool-quality logic.
- Added a human-written June 2026 editorial update section to every card in both languages, with concrete positioning, rollout cautions, privacy/permission caveats, and clearer "when to use / when not to use" guidance.
- Registered the batch in `docs/04_operations/tool_card_editorial_registry.json`; future unedited-card selections should skip `claude-tag`, `google-jules`, `microsoft-agent-framework`, `browser-use`, `openart-director`, `adobe-creative-agent`, `databox-mcp`, `latitude`, `cotypist`, `mina-meeting-assistant`, `bluerails-discovery`, and `propane`.

## 2026-06-22 - Utildesk MCP operations helper

- Added a local stdio MCP server at `scripts/mcp/utildesk-mcp.mjs` plus `npm run mcp:utildesk`.
- The MCP exposes compact wrappers for repeated Utildesk operations: standard memory loading, git preflight, Ratgeber image/asset checks, validation builds, live URL checks, compact sitemap contract checks, Cloudflare Pages deploy, and IndexNow submission.
- Dangerous operations require explicit confirmation inputs (`deploy utildesk` and `submit indexnow`) and the Cloudflare deploy wrapper loads the git-ignored root `.env` without returning secret values.
- Added the connection/runbook at `docs/04_operations/utildesk_mcp.md`.
- Smoke-tested MCP `listTools`, `git_preflight`, `ratgeber_article_check`, `live_check_urls`, and `sitemap_contract_check` through the official MCP SDK client.

## 2026-06-19 - Lokale KI-Agenten NotebookLM Ratgeber publication

- Retrieved the OptiPlex NotebookLM article draft artifact `47d6acd1-f3e5-4e44-ad3a-2c91144ded73` from the physical `jgdus@100.98.97.98` contour and used it as the editorial starting point.
- Rewrote the draft into a practical bilingual Ratgeber article around Foundry Local, Microsoft Edge Aion/Web APIs, Apple Foundation Models, Gemini Nano/AICore, LM Studio, and Ollama.
- Removed or softened unsupported NotebookLM claims around speculative Android product names, future devices, overbroad sovereignty language, and exact Apple model internals unless grounded in primary sources.
- Added practical rollout guidance, local-vs-cloud decision boundaries, governance risks, and internal links to relevant Utildesk tool cards.

## 2026-06-19 - OptiPlex NotebookLM source refresh

- Checked the physical OptiPlex NotebookLM contour `jgdus@100.98.97.98` with `NOTEBOOKLM_HOME=/home/jgdus/.notebooklm`; auth was ready and tied to the paid `vasjakotov11@gmail.com` profile.
- Added fresh official/primary sources to existing notebooks, not new notebooks: Agent Observability/Debugging, KI-Video 2026, Lokale KI-Agenten, and Vom Coding-Agent zum Arbeitsagenten.
- Final NotebookLM source counts were: Agent Observability `25`, KI-Video `18`, Lokale KI-Agenten `19`, Coding-Agent zum Arbeitsagenten `21`; all listed sources reported `ready`.
- The completed NotebookLM article draft candidates still available for future manual publication include `59e4a74a-d7c6-4f5b-a1fa-793a77bfc9b9` (Coding-Agent -> Arbeitsagent), `47d6acd1-f3e5-4e44-ad3a-2c91144ded73` (Lokale KI-Agenten), and `30b166cc-5fa1-4ac4-a51c-56505dd9f745` (KI-Video 2026). `Agent Observability` remains a failed/working cluster and needs a fresh generation pass before manual publication.
- Operation log on OptiPlex: `/home/jgdus/projects/agent-newsman/artifacts/notebooklm_source_refresh_20260619/source_add_results.json`.

## 2026-06-18 - Produktivitäts-Agenten NotebookLM Ratgeber publication

- Took the OptiPlex NotebookLM/article pipeline draft `Produktivitäts-Agenten im Alltag: Wo sie wirklich Zeit sparen` as the editorial starting point and rewrote it into a broader bilingual Ratgeber article.
- Expanded the draft with practical real-life scenarios for agencies, sales triage, support escalation, recruiting coordination, and management reporting.
- Fact-checked and grounded the article around Lindy, Zapier Agents, n8n AI Agent, Gumloop, Microsoft Copilot Studio, CrewAI, and LangGraph primary sources.
- Generated two final story-forward business illustrations through Gemini web on the physical OptiPlex under the required paid `vasjakotov11@gmail.com` profile, cropped Gemini UI artifacts, and saved only compressed WebP assets under `content/images/ratgeber/`.

## 2026-06-15 - Local Google Sheets service-account secret mirrored

- Copied the production Google service-account JSON from `utildesk:/opt/utildesk-motia/secrets/google-service-account.json` into the local git-ignored project secret `secrets/google-service-account.json`.
- Also mirrored the same local secret to `C:\opt\utildesk-motia\secrets\google-service-account.json`, because many existing Node scripts hardcode `/opt/utildesk-motia/secrets/google-service-account.json`; on Windows Node resolves that path to the `C:\opt\...` mirror.
- Verified both local files parse as service-account JSON and that the project copy is ignored by git. Do not print, commit, or paste the JSON contents.

## 2026-06-14 - Manual tool review disclosure logic

- Fixed the tool detail, Markdown mirror, and JSON API curation logic so explicit manual editorial metadata (`editorial_reviewed`, `editorial_reviewed_at`, or `editorial_status: manual_polished`) suppresses the autogenerated/unreviewed disclosure even when a card remains staged as tier `D`.
- The change keeps the warning for genuinely unreviewed/generated cards, but prevents manually polished Sheet NEW cards such as `apify` from being labeled as not editorially reviewed.

## 2026-06-14 - Sheet NEW hype 10 manual publish with Gemini illustrations

- Selected the next 10 high-signal `NEW` candidates from the Google Sheet source of truth after the previous 20-card batch: `cohere-api`, `google-lens`, `faiss`, `trino`, `gitlab`, `circleci`, `socket-io`, `aws-appsync`, `salesforce-einstein`, and `opentoonz`.
- The legacy `scripts/publish_one_slug.mjs` path was attempted first on the production checkout, but the stored OpenAI API key returned 401 after moving `cohere-api` to `IN_PROGRESS`; the batch was therefore completed manually with full DE/EN editorial cards and later needs the Sheet rows marked `DONE`.
- Added explicit manual editorial metadata, internal alternatives, FAQ blocks, privacy/cost/workflow sections, and image-only figure blocks for every new card.
- Generated 10 varied real raster illustrations through Gemini web on the physical OptiPlex under the paid `vasjakotov11@gmail.com` Chrome profile, exported the blob PNGs, cropped the Gemini sparkle edge, converted to 1280x720 WebP, and registered batch `2026-06-14-optiplex-gemini-web-sheet-new-hype-10-illustrations`.

## 2026-06-14 - OptiPlex Gemini web illustrations for remaining Sheet NEW tools

- Added Gemini-authored editorial illustrations for the remaining 17 tools from the 2026-06-14 Sheet NEW hype batch: `litellm`, `anthropic-api`, `obsidian`, `roam-research`, `figjam`, `servicenow`, `apify`, `jax`, `d3-js`, `jupyter-notebook`, `trint`, `streamlabs`, `salesforce-lightning`, `callminer-eureka`, `nvidia-rtx-6000-ada-generation`, `ibm-api-connect`, and `tibco-cloud-integration`.
- Final artwork was generated as real raster images in Gemini web on the physical OptiPlex under the paid `vasjakotov11@gmail.com` profile, exported from browser blobs, cropped more strictly to remove Gemini UI sparkle, converted to 1280x720 WebP, and visually checked as a varied story-forward batch.
- Inserted shared image-only `tool-editorial-figure` blocks in both German and English tool pages and registered batch `2026-06-14-optiplex-gemini-web-remaining-17-sheet-new-illustrations` in `docs/04_operations/tool_card_illustration_registry.json`.

## 2026-06-12 - GSC sitemap noindex alert triage

- Investigated the Google Search Console email `WNC-20237597` about a new `Excluded by noindex tag` reason for pages in a sitemap.
- Live production check found the current `https://tools.utildesk.de/sitemap.xml` clean: 110 URLs, all HTTP 200, no `X-Robots-Tag: noindex`, no `robots noindex`, and no `googlebot noindex` on the submitted URLs.
- GSC API showed an obsolete `https://tools.utildesk.de/sitemap-focus.xml` submission still registered from 2026-06-03 even though the Google contract is only `sitemap.xml`; removed `sitemap-focus.xml` from GSC and resubmitted only `https://tools.utildesk.de/sitemap.xml`.
- Final GSC sitemap list after cleanup contained only `https://tools.utildesk.de/sitemap.xml`, `submitted=110`, `warnings=0`, `errors=0`; `robots.txt` still advertises only the main sitemap.
- Current diagnosis: the email is most likely a delayed/stale Search Console notification from earlier broad/focus sitemap history or historical submitted URLs, not a present live sitemap pollution issue.
- Follow-up safe patch aligned `tier_d_thin_or_unmonetized` tool pages with the split-search contract: generic `robots` now stays `index,follow`, while Google staging is expressed only through `googlebot: noindex,follow`. Explicit frontmatter noindex remains global noindex.

## 2026-06-12 - Ratgeber-linked tool-card gap pass and public GitHub mentions

- Audited all Ratgeber/internal-cluster `/tools/` references at body level instead of trusting legacy `editorial_reviewed` metadata alone; the pass found 81 unique internally linked tool slugs, 38 weak cards, and 2 external source-link false positives that were not Utildesk tool pages.
- Manually strengthened the 38 weak DE/EN tool cards with cluster-specific editorial sections, workflow fit, risk checks, internal alternatives, FAQ coverage where missing, refreshed lastmod metadata, and batch marker `2026-06-12-ratgeber-linked-tool-gap-pass`.
- Updated the editorial registry and `site/src/data/content-lastmod.json`; validation passed with `npm run check:editorial`, `node scripts/check_english_tool_translations.mjs`, `npm run check:tool-quality`, and `npm --prefix site run build`.
- Added relevant Utildesk mentions/backlinks only to public GitHub repositories where the context fit: `fenstek/opcl` -> OpenClaw card and open-source agents comparison, `fenstek/obsidian-llm-wiki-local` -> persistent AI memory guide, and `fenstek/claude-code-starter` -> coding agents guide plus Claude/Codex cards.

## 2026-06-11 - KI-Browser NotebookLM Ratgeber publication

- Retrieved NotebookLM article draft artifact `79d70969-3cb8-46fe-9bc8-e8a0b7878322` from the physical OptiPlex contour `jgdus@100.98.97.98` and used it as the editorial starting point.
- Manually edited and fact-checked the draft into a bilingual Ratgeber release: `ki-browser-2026-atlas-comet-webmcp-und-browserbase`.
- Softened unsupported NotebookLM claims around SOP bypass, password-field extraction, fixed percentage gains, and vendor-specific exploit certainty; kept the article grounded in official OpenAI, Perplexity, Chrome/WebMCP, Browserbase/Stagehand, Trail of Bits, UW, and CSA sources.
- Generated two business-oriented imagegen illustrations and saved only compressed WebP assets under `content/images/ratgeber/`.

## 2026-06-11 - Corrective body-level tool-card editorial pass

- Corrected the selection logic after the second hype refresh: formal `editorial_reviewed` metadata is no longer sufficient to prove a card has real manual prose, because older completion passes left some bodies thin or template-like.
- Rewrote 20 weak DE/EN tool cards selected by rendered-body evidence, not by the registry alone: `10to8`, `acapela-group`, `microsoft-azure-api-management`, `activecampaign`, `acuity-scheduling`, `adp-workforce-now`, `agorapulse`, `ahrefs-content-explorer`, `alitu`, `animoto`, `crisp`, `crowdstrike-falcon`, `deepl-api`, `dell-boomi`, `flyr`, `google-chat`, `microsoft-defender-for-endpoint`, `quasar-framework`, `workato`, and `zeplin`.
- Each selected card now has full human DE/EN sections for audience fit, typical use cases, daily workflow judgement, workflow fit, privacy/data notes, costs, internal alternatives, editorial assessment, and FAQ.
- Registered the corrective batch as `2026-06-11-unedited-tool-card-human-pass-1`; future "unedited" selections should use body-level checks and explicitly skip recency-refresh/hype-polish batches.

## 2026-06-11 - Second hype tool-card polish wave

- Selected the next 20 strategically hot cards after the browser-agent/framework wave: Lovable, Bolt.new, Manus, Devin, OpenHands, v0, CrewAI, OpenAI Codex, Google AI Studio, Gumloop, Sora, Kling AI, Suno AI, Adobe Firefly, Replicate, DeepSeek, Grok, Mistral, Jan, and LM Studio.
- Added fresh DE/EN "June 2026 editorial update" sections focused on vibe-coding, app builders, coding agents, agent orchestration, generative media, model platforms, and local AI workflows.
- Updated localized review metadata, refreshed `site/src/data/content-lastmod.json`, and registered the batch as `2026-06-11-hype-tools-human-polish-2`.

## 2026-06-11 - Hype tool-card human polish

- Selected the 20 active illustrated-but-not-text-registry hype tool cards left after the 2026-05-31 rising AI tools batch: BrowserOS, Browserbase, Mem0, Base44, ChatGPT Atlas, Cline, Composio, Google Antigravity, Kilo Code, Krea AI, LangGraph, Mastra, Napkin AI, OpenCode, Perplexity Comet, Pydantic AI, Qodo, Skyvern, Stagehand, and YouWare.
- Added a fresh DE/EN "June 2026 editorial update" section to each card with practical positioning, rollout criteria, governance risks, and workflow-specific judgement instead of generic generated copy.
- Refreshed review metadata on the 40 localized tool files and registered the batch in `docs/04_operations/tool_card_editorial_registry.json` as `2026-06-11-hype-tools-human-polish`.

## 2026-06-10 - Inventory list repair, alternatives links and Sheet cleanup

- Repaired the desktop `/tools/` inventory register so wide rows no longer clip the right-side category/price columns; local browser QA covered 1365px, 1180px, and 390px with no horizontal overflow.
- Added manual DE/EN internal alternatives to 17 tool cards across scheduling, workflow/queue, OCR/document AI, speech, screen capture, and code-search clusters.
- Marked the same 17 Google Sheet source rows with `alternatives_added=2026-06-10:manual_internal_links` so the source of truth records the manual linking pass.
- Cleaned 12 unpublished Sheet candidates from `NEW`/`NEEDS_REVIEW` into `NEEDS_REVIEW`, `DUPLICATE`, or `BLACKLIST` for wrong URLs, comparison phrases, duplicate products, concepts, or broad social-network noise.
- Verified the paused publishing pipeline state: autopublish, Sheet generation, alternatives seed, and NEEDS_REVIEW rebuild are intentionally paused since 2026-05-18; audits and Umami popularity sync remain active.
- Re-ran the `NEW` dry-run quality gate after cleanup; all 77 remaining `NEW` candidates passed without duplicate or false-tool moves.

## 2026-06-09 - Agentic commerce Ratgeber publication

- Retrieved NotebookLM article draft artifact `e7b82b8b-7e08-45bc-9718-0d1bcee615c8` from the physical OptiPlex contour after Tailscale SSH re-authorization and used it as the editorial starting point.
- Manually edited and fact-checked the draft into a bilingual Ratgeber release: `agentic-commerce-2026-chatgpt-stripe-shopware-und-universal-cart`.
- Removed or softened unsupported NotebookLM draft claims around unverified model/version names, regional rollout specifics, and overly broad autonomous-checkout assertions.
- Kept the factual framing tied to OpenAI/Stripe ACP, UCP, Google AP2, and Shopware Agentic Commerce/Agentic Product Feed/PayPal StoreSync/Copilot Data Assist sources.
- Generated two business-oriented, non-fairytale imagegen illustrations and saved only compressed WebP assets under `content/images/ratgeber/`.

## 2026-06-09 - Persistent AI memory Ratgeber publication

- Manually edited and fact-checked NotebookLM article draft artifact `6636ea6e-cae3-4064-8258-19e947415999` into a bilingual Ratgeber release: `persistente-ki-memory-2026-kontext-zwischen-sessions-projekten-und-modellen`.
- Published the German and English articles with internal links to ChatGPT, Claude, Gemini, NotebookLM, Mem0, LangGraph, Hermes Agent, OpenClaw, and the open-source AI agents comparison guide.
- Removed unsupported NotebookLM draft numbers/claims and kept the factual framing tied to official OpenAI, Anthropic, Google, LangGraph, Mem0, Letta, Zep, Microsoft Research, and arXiv sources.
- Generated two final story-forward imagegen illustrations and saved only compressed WebP assets under `content/images/ratgeber/`.
- Validation covered `npm run check:editorial`, `npm run check:tools:en`, full `npm --prefix site run build`, dist page checks, and sitemap membership for both DE/EN article URLs.

## 2026-06-09 - NotebookLM topic seeds on OptiPlex

- Created six fresh Ratgeber research notebooks in NotebookLM on the physical OptiPlex contour `jgdus@100.98.97.98`, using `/home/jgdus/projects/agent-newsman` and `NOTEBOOKLM_HOME=/home/jgdus/.notebooklm`, not the `opcl` contour.
- Seeded the requested topics: AI browsers/WebMCP, coding agents as work agents, agentic commerce with Shopware, local/on-device AI agents, AI video after Sora, and persistent AI memory across sessions/projects/models.
- All source packs and web/PDF sources were added successfully; all six German NotebookLM briefing reports completed. Run artifacts live under `/home/jgdus/projects/agent-newsman/artifacts/notebooklm_topic_seeds_20260609/`.
- Added a second NotebookLM pass for the same six notebooks that generated completed full German `Artikelentwurf:` report artifacts. These are article drafts for the later manual stage, not reviewed/published Ratgeber pages yet.

## 2026-06-08 - Inventory mobile list repair

- Repaired the decision-layout `/tools/` mobile inventory view so it no longer compresses the desktop register into a narrow left strip after `Mehr anzeigen`.
- Mobile inventory rows now render as full-width app-style cards, with the letter jumpbar as a horizontal chip strip and price/verdict metadata kept horizontal instead of vertical/clipped.
- Local QA covered German and English `/tools/` at 390px and 430px, including the load-more interaction and scroll-width checks.

## 2026-06-08 - Pocket Decision Desk mobile layer

- Added a dedicated mobile app-style CSS layer for the decision/KI-Blatt design under the `Pocket Decision Desk` concept.
- The mobile layer keeps desktop newspaper composition unchanged, but turns phone views into card-based sections with touch-sized sticky navigation, safer heading scales, and one primary vertical scroll.
- Hardened mobile overflow for homepage, tool index, tool/article detail pages, and markdown tables; wide nav/tag/table areas now scroll inside their own containers instead of widening the page.
- Local QA covered `/`, `/en/`, `/tools/`, and the latest Ratgeber article at 390px and 430px viewports, plus a desktop 1280px smoke check.

## 2026-06-08 - Dynamic homepage decision test block

- Replaced the homepage decision test table's hardcoded first-article fallback with article-driven data from `decisionTools`, `decisionAvoid`, and `decisionNote`.
- Added current DE/EN open-source agents comparison frontmatter for the homepage `Im Test` / `In the test` block so it now follows the latest Ratgeber topic.

## 2026-06-08 - Hero headline scale correction

- Reduced oversized decision-layout hero headline scales on the homepage and Ratgeber article pages while keeping the editorial newspaper typography.
- Added final responsive CSS overrides so desktop and mobile headings stay readable without taking over the entire first viewport.

## 2026-06-07 - Dynamic decision issue number

- Replaced the hardcoded decision issue number `049` with a build-time value derived from the number of published German Ratgeber articles.
- The shared decision layout, homepage issue masthead, recent guide cards, and DE/EN archive headers now move together as new Ratgeber articles are published.

## 2026-06-07 - Homepage latest-guide movement

- Fixed the decision-layout homepage so the visible hero now uses the newest Ratgeber entries instead of only the pinned editorial guide list.
- The homepage still keeps pinned/curated guide cards, but the primary announcement now moves when a fresh article is published.
- Verified the built German and English homepages surface the new open-source AI agents comparison as `Neu im Ratgeber` / `New guide`.

## 2026-06-07 - Dynamic live date in site header

- Fixed the decision-layout header date so it is no longer hardcoded to `27.05.2026`.
- Added `site/src/lib/contentFreshness.ts`, which derives the public `live` date from the newest value in `site/src/data/content-lastmod.json`.
- Updated the shared layout and the decision-style homepage masthead to use the same freshness labels, so the header now moves with the latest published content after builds.
- Local production build verified the generated HTML shows `live · 07.06.2026` and the localized long date on German and English pages.

## 2026-06-07 - Open-source AI agents comparison Ratgeber

- Manually edited and published a new bilingual Ratgeber comparison: `open-source-ai-agents-im-vergleich-hermes-agent-openclaw-openhands-autogen-crewai-langgraph-und-cline`.
- The article compares Hermes Agent, OpenClaw, Cline, OpenHands, AutoGen, CrewAI, and LangGraph by workflow role rather than by generic ranking.
- Generated two story-forward imagegen WebP illustrations for the release and saved only final compressed WebP assets under `content/images/ratgeber/`.
- The release was prepared from a clean worktree based on fresh `origin/master` and merged the latest `origin/autobot` popularity sync before content changes, so the manual Ratgeber publish does not discard autopopularity updates.
- NotebookLM source work for this article happened on the physical OptiPlex contour `jgdus@100.98.97.98` with `NOTEBOOKLM_HOME=/home/jgdus/.notebooklm` and must remain tied to the paid Google account `vasjakotov11@gmail.com`.

## 2026-05-31 - Rising AI tools batch

- Added 20 rising AI tool cards from the Sheet seed into DE/EN content: Cline, Kilo Code, OpenCode, Qodo, Google Antigravity, ChatGPT Atlas, Perplexity Comet, Browserbase, Stagehand, Skyvern, BrowserOS, LangGraph, Pydantic AI, Mastra, Mem0, Composio, Base44, YouWare, Napkin AI, and Krea AI.
- Replaced rejected SVG-like placeholders with 20 story-forward ChatGPT/imagegen WebP illustrations in `content/images/tools/*-editorial.webp`.
- Expanded the new cards with full manual editorial structure and registered the image batch in `docs/04_operations/tool_card_illustration_registry.json`.
- Validation passed: editorial template guard, tool quality guard, English translation guard, newest-sort check, full Astro build, and dist image/page verification.
## 2026-05-27 - Tool illustration duplicate backfill

- Audited the latest story illustration batches and found four duplicate registry entries from earlier illustrated cards: `theia`, `trello-mit-butler`, `uipath`, and `veryfi`.
- Removed those duplicate registry entries and added four unique 1260x800 WebP story illustrations for the next edited-tail cards: `vyrill`, `waifu2x`, `wave`, and `wave-video`.
- Inserted localized image-only `tool-editorial-figure` blocks in German and English and recorded the backfill in `docs/04_operations/tool_card_illustration_registry.json`.

## 2026-05-21 - Popular tool-card recency refresh

- Refreshed 40 high-recognition DE/EN tool cards with a focused 2026 feature/workflow update block rather than rewriting the full already-edited articles.
- Updated `updated_at` frontmatter and `site/src/data/content-lastmod.json` for the 80 affected localized pages so sitemap freshness can move with the editorial change.
- Registered the batch as `2026-05-21-recency-refresh-popular-40` in `docs/04_operations/tool_card_editorial_registry.json` for future skip/audit logic.
- Selection: `chatgpt`, `claude`, `gemini`, `perplexity`, `microsoft-copilot`, `github-copilot`, `midjourney`, `canva`, `figma`, `notion-ai`, `zapier`, `make-ehemals-integromat`, `n8n`, `cursor`, `replit`, `runway`, `synthesia`, `capcut`, `descript`, `elevenlabs`, `grammarly`, `deepl`, `google-translate`, `microsoft-translator`, `hubspot-crm`, `hubspot-sales-hub`, `salesforce-sales-cloud`, `miro`, `airtable`, `asana`, `monday-com`, `clickup`, `microsoft-teams`, `zoom`, `tableau`, `power-bi`, `aws-sagemaker`, `openai-api`, `hugging-face`, `langchain`.

## 2026-05-15 - Tool illustration batch 25

- Added one landscape 1260x800 WebP editorial illustration to 30 additional manually edited tool cards in both German and English.
- Selection continues the active registry-backed, non-illustrated sequence from `nvivo` through `poeditor`.
- Expanded the visual direction after feedback about repeated dashboards and desks: theater stages, observatories, greenhouses, mountain lodges, canal locks, code looms, underwater labs, film backlots, gardens, rail yards, concert halls, and harbor logistics.
- Regenerated three variants with visible alphanumeric artifacts before inserting localized image-only `tool-editorial-figure` blocks and updating the illustration registry.

## 2026-05-15 - Tool illustration batch 24

- Added one landscape 1260x800 WebP editorial illustration to 50 additional manually edited tool cards in both German and English.
- Selection continues the active registry-backed, non-illustrated sequence from `metabase` through `nvidia-dgx-systeme`; the interrupted run had 43 generated PNGs and was resumed for the final seven.
- Inserted localized image-only `tool-editorial-figure` blocks, updated the illustration registry, and kept the generated PNG originals in the Codex image cache while only WebP assets are referenced by the site.



## 2026-05-15 - Umami upgraded to v3.1.0

- Upgraded `https://stats.utildesk.de` on server `utildesk` (`46.224.94.65`) from the old `ghcr.io/umami-software/umami:postgresql-latest` container to pinned `docker.umami.is/umami-software/umami:3.1.0`.
- Deployment location: `/opt/umami`; stack uses Docker Compose, Traefik, app container `umami`, and PostgreSQL container `umami-db`.
- Pre-upgrade backup: `/opt/umami/backups/pre-v3.1.0-20260515T154952Z/umami-postgres.dump`; SHA256 `7f3c254475d23f0b5f754793a5e61debd4a57d7ce07df232fd6f7097ecfb972e`.
- Automatic migrations applied successfully: `15_add_share`, `16_boards`, `17_remove_duplicate_key`, `18_add_performance`, `19_add_session_replay`.
- Verification passed: `https://stats.utildesk.de/` HTTP 200, `/api/heartbeat` returns ok, `/script.js` HTTP 200 with new 4595-byte tracker, real-browser smoke hit `tools.utildesk.de` and `/api/send` returned 200; PostgreSQL `website_event` received a fresh event at `2026-05-15 15:55:33 UTC`.
- Privacy note: v3.1.0 includes Session Replay, but it was not enabled during the upgrade. Keep replay disabled unless there is a separate GDPR/privacy decision.

## 2026-05-15 - Tool illustration batch 23

- Added one landscape 1260x800 WebP editorial illustration to 50 additional manually edited tool cards in both German and English.
- Selection covers active non-illustrated registry-backed cards from 8x8 through Meta AI, including the newly edited earlier alphabetical gaps.
- Published only wide landscape generations; square draft variants were not inserted. The batch keeps the varied story direction with paper dioramas, photo still lifes, collage, hardware/security scenes, learning workshops, audio/video production tables, and marketing workflow objects.
- Updated the tool-card illustration registry so future batches skip these slugs.

## 2026-05-15 - Final active tool-card text editorial pass

- Manually expanded the remaining 30 active DE/EN tool cards missing from the text editorial registry, from `8x8` through `vivaldi`.
- Added practical use cases, daily-use judgement, workflow-fit guidance, data/privacy notes, and editorial assessments in both German and English.
- Updated `docs/04_operations/tool_card_editorial_registry.json` so the active paired tool-card manual text audit is closed again.

## 2026-05-14 - Tool illustration batch 19

- Added one mid-article WebP illustration to 50 additional manually edited tool cards in both German and English.
- Selection covers the current next registry-backed, non-illustrated cards alphabetically, from `acapela-group` through `audiotool`.
- Continued the 1260px source WebP and 90% `.tool-editorial-figure` display scheme.
- Broadened the visual direction after feedback about dashboard repetition: photo still lifes, paper dioramas, mixed-media collage, physical data metaphors, hardware macro scenes, audio workbenches, learning stages, and workflow objects.
- Converted generated PNG sources directly to WebP without copying PNG files into the project workspace.

## 2026-05-14 - Final tool-card text editorial gap pass
- Manually improved or normalized the remaining 40 DE/EN tool cards that were missing from the text editorial registry, including disabled legacy aliases.
- Added practical workflow-fit and editorial-assessment language where pages still had generic generated structure, and registered already hand-edited OCR/document cards.
- Updated `docs/04_operations/tool_card_editorial_registry.json` so the manual text-edit audit has 0 unregistered paired tool cards.
- Post-rebase addendum: after the concurrent sheet publish commit added 10 more paired tool cards, manually edited and registered those cards too before production deploy.
- Follow-up polish: revisited the 10 freshly published Sheet tool cards (`tara-ai`, `adobe-captivate`, `azure-stream-analytics`, `teradata-vantage`, `azure-devops`, `microsoft-azure-event-hubs`, `microsoft-azure-hdinsight`, `kaggle-learn`, `medibang-paint`, `h2o-automl`) and rewrote their DE/EN introductions, daily-use, workflow-fit, and editorial-assessment sections to remove the remaining generic template phrasing.

## 2026-05-14 - Publish QC gate unblocked for large NEW queues

- Investigated why Google Sheet `NEW` rows were no longer reaching production: VPS publish cron was healthy and unpaused, but `qc_before_publish.mjs` timed out before generation.
- Root cause: the Sheet had 207 `NEW` rows, while the QC helper tried to resolve every `NEW`/`IN_PROGRESS` official URL before each 10-row publish batch; the helper timed out with `spawnSync node ETIMEDOUT`, causing the fail-closed marker `QC_MOVED_TO_NEEDS_REVIEW=9999`.
- Fixed the gate so publish QC checks all `IN_PROGRESS` rows plus a bounded leading slice of `NEW` rows tied to `PUBLISH_BATCH_SIZE` before each run, instead of verifying the entire backlog every time.
- Also fixed `resolveFinalUrl()` to honor the older `timeoutMs` option used by existing QC/audit callers, avoiding accidental fallback to the longer default request timeout.
- Follow-up hardening: live URL reachability failures from the VPS are now advisory in the pre-publish gate instead of a hard `NEEDS_REVIEW` reason; definite static policy failures, self-references, suspicious resolved redirects, and duplicate rows still block.
- Follow-up translation hardening: the English tool translator now supports `TRANSLATE_BACKEND=auto|codex|openai`; `auto` keeps Codex OAuth as the first choice but falls back to the OpenAI API when `OPENAI_API_KEY` is available, and the cron preflight accepts either backend before touching new Sheet rows.

## 2026-05-13 - Tool illustration batch 18

- Added one mid-article WebP illustration to 30 additional manually edited tool cards in both German and English.
- Continued the 1260px source WebP and 90% `.tool-editorial-figure` display scheme.
- Selection follows the edited-tail illustration registry after `rev-com`; slugs run from `reverso` through `scrivener`.
- Shifted the visual direction toward story-forward scenes after feedback about dashboard repetition: photo still lifes, mixed-media collage, paper dioramas, miniature labs, film sets, and physical workflow props.
- Accepted normal props such as phones, keypads, envelopes, calendars, stamps, and office pictograms when they supported a scene; replaced variants that still felt readable-text, logo, face/avatar-heavy, or dashboard-like.
- Generated PNG originals are removed from the local cache after WebP conversion so the image folder stays clean after publication-style batches.

## 2026-05-13 - E2a Ratgeber published and Chagall-inspired visual refresh

- Published the approved E2a Ratgeber as a full DE/EN package: `content/ratgeber/e2a-open-source-email-gateway-for-ai-agents-so-gelingt-der-einsatz-in-der-praxis.md` and the English sibling under `/en/`.
- Initial content release commit: `6141cfbf` (`content: publish e2a email gateway guide`); final visual refresh commit: `84f6ae24` (`content: refresh e2a guide illustrations`).
- Replaced the first cinematic/technical-looking visuals after user feedback with two cache-busting, Chagall-inspired poetic story WebP files: `*-cover-chagall.webp` (1536x864, 200798 bytes) and `*-workflow-chagall.webp` (1536x864, 172430 bytes).
- Live verification passed for the German and English URLs plus both WebP assets; live HTML references the `-chagall.webp` files and no longer references the old `*-cover.webp` / `*-workflow.webp` artwork.
- Cloudflare Ratgeber candidate `20260511-e2a-open-source-email-gateway-for-ai-agents-how_to-bb2d056d` was marked `published` via the upload API with the final WebP assets; publish and rework queues reported 0 pending requests.
- Validation before publication passed: editorial template check, English tool translation check, and Astro build (`2844` pages).

## 2026-05-13 - Tool illustration batch 17

- Added one mid-article WebP illustration to 30 additional manually edited tool cards in both German and English.
- Continued the 1260px source WebP and 90% `.tool-editorial-figure` display scheme.
- Selection follows the edited-tail illustration registry after `quark`; slugs run from `quasar-framework` through `rev-com`.
- Regenerated the batch with deliberately varied styles after uniformity feedback: paper collage, parchment map, blueprint, light isometric, studio still life, darkroom, acoustic sculpture, and pastel logistics diagrams.
- Rejected replacement variants with platform-logo, face/head, user/profile-icon, readable-text, or repeated-dashboard artifacts before converting the selected outputs.

## 2026-05-13 - Tool illustration batch 16

- Added one mid-article WebP illustration to 50 additional manually edited tool cards in both German and English.
- Continued the 1260px source WebP and 90% `.tool-editorial-figure` display scheme.
- Selection follows the edited-tail illustration registry after `nintex`; slugs run from `nintex-rpa` through `quark`.
- Generated replacement variants for readable-text, formula, and letter-icon artifacts, then converted only the selected outputs into workspace WebP assets.
- Cleaned generated PNG cache after conversion so the local image folder stays empty after publication-style batches.

## 2026-05-13 - Tool editorial completion from production-sync

- Ported the clean generated-text editorial pass onto current production head `0f7f556` instead of the stale dirty main checkout.
- Publish scope is 390 additional DE/EN tool cards; `ableton-live` stayed untouched because current production already had 2026-05-11 manual editorial/illustration registry coverage.
- Updated `docs/04_operations/tool_card_editorial_registry.json` with the three 2026-05-13 editorial batches and tightened `scripts/list_tool_editorial_candidates.mjs` so future selection skips the illustration registry.
- Validation before release passed: editorial checks, EN tool checks, marker/registry overlap audit, `git diff --check`, and Astro build.

## 2026-05-12 - Tool illustration batch 15

- Added one mid-article WebP illustration to 30 additional manually edited tool cards in both German and English.
- Continued the 1260px source WebP and 90% `.tool-editorial-figure` display scheme.
- Selection follows the edited-tail illustration registry after `manus`; slugs run from `mate-translate` through `nintex`.
- Generated replacement variants for figurative, readable-text, platform-logo, and profile/icon artifacts; only selected WebP outputs were copied into the workspace.

## 2026-05-12 - Tool illustration batch 14

- Added one mid-article WebP illustration to 30 additional manually edited tool cards in both German and English.
- Continued the 1260px source WebP and 90% `.tool-editorial-figure` display scheme.
- Selection follows the edited-tail illustration registry after `landr`; slugs run from `languagetool` through `manus`.
- Generated replacement variants for figurative, interface-like, text, and iconographic artifacts; only selected WebP outputs were copied into the workspace.

## 2026-05-12 - Tool illustration batch 13

- Added one mid-article WebP illustration to 30 additional manually edited tool cards in both German and English.
- Continued the 1260px source WebP and 90% `.tool-editorial-figure` display scheme.
- Selection follows the edited-tail illustration registry after `inshot`; slugs run from `insomnia` through `landr`.
- Generated replacement variants for text, logo-like, platform-logo, and distracting pictogram artifacts; only selected WebP outputs were copied into the workspace.

## 2026-05-12 - Tool illustration batch 12

- Added one mid-article WebP illustration to 30 additional manually edited tool cards in both German and English.
- Continued the 1260px source WebP and 90% `.tool-editorial-figure` display scheme.
- Selection follows the edited-tail illustration registry after `grok`; slugs run from `groove` through `inshot`.
- Generated two replacement variants for visible text/flag artifacts; only selected WebP outputs were copied into the workspace and PNG originals remain in the Codex image cache.

## 2026-05-12 - Tool illustration batch 11

- Added one mid-article WebP illustration to 50 additional manually edited tool cards in both German and English.
- Continued the 1260px source WebP and 90% `.tool-editorial-figure` display scheme from the latest batches.
- Selection follows the edited-tail illustration registry after `faceapp`; slugs run from `facetune` through `grok`.
- Generated extra replacement variants for scenes with anatomy, text, brand-like, or screenshot artifacts; only the selected WebP outputs were copied into the workspace.
- Generated PNG originals remain in the Codex image cache per the current save-path policy.

## 2026-05-11 - Tool illustration batch 10

- Added one mid-article WebP illustration to 50 additional manually edited tool cards in both German and English.
- Continued the smaller illustration scheme: 1260px source WebP assets and the existing 90% `.tool-editorial-figure` display width.
- Selection follows the edited-tail illustration registry after `cloudera-data-platform`; slugs run from `codecademy` through `faceapp`.
- Expanded the newer story prompts within the batch to vary settings and visual metaphors more strongly, following user feedback during generation.
- Generated PNG originals for this batch were removed after WebP conversion so the local image cache does not keep unnecessary source files.

## 2026-05-11 - Tool illustration batch 9

- Added one mid-article WebP illustration to 20 additional manually edited tool cards in both German and English.
- Reduced editorial illustration display width to 90% in `site/public/styles/global.css`; this also makes earlier editorial figures visually smaller.
- New assets use 1260px source width instead of the earlier 1400px batches.
- Slugs: `bubble`, `buffer`, `buzzsprout`, `buzzsumo`, `c3-ai`, `callrail`, `canva-video`, `captum`, `capture-one`, `celtx`, `cerebras-wafer-scale-engine`, `character-ai`, `chatbot-com`, `chatterbot`, `chorus-ai`, `civitai`, `clarivate-analytics`, `clickhouse`, `clipchamp`, `cloudera-data-platform`.
- Generated PNG originals for this batch were removed after WebP conversion so the local image cache does not keep unnecessary source files.

## 2026-05-11 - Bidirectional Ubuntu/Windows deploy sync

- Added `scripts/sync_after_remote_deploy.sh` so the Ubuntu worker can fast-forward safely after a Windows-side deploy, or update a clean production-memory mirror when the worker checkout is dirty.
- Extended `scripts/deploy_from_ubuntu.sh` so successful direct Ubuntu deploys can call the Windows laptop sync helper via `UTILDESK_WINDOWS_SYNC_SSH`, keeping `C:\projects\utildesk-motia-production-sync` current.
- Extended `scripts/sync_after_remote_deploy.ps1` with Ubuntu callback sync by default; pass `-NoUbuntuSync` or set `UTILDESK_SYNC_UBUNTU_AFTER_WINDOWS=0` to opt out.
- Added background auto-sync installers/runners: Windows Scheduled Task helper and Ubuntu cron helper, both defaulting to a 15-minute cadence and log files outside content.
- Windows auto-sync is installed via a hidden `wscript.exe` runner that launches PowerShell with `-WindowStyle Hidden`, so scheduled background sync should not pop up PowerShell or cmd windows.
- Updated the Ubuntu deploy/sync runbook with the active Ubuntu/Windows paths and the rule that GitHub credentials stay outside the repo.

## 2026-05-11 - Ubuntu deploy and laptop sync helpers

- Added a guarded Ubuntu production deploy helper: `scripts/deploy_from_ubuntu.sh`.
- Added a Windows laptop sync helper: `scripts/sync_after_remote_deploy.ps1`.
- Added a Windows hub fallback publisher: `scripts/publish_hub_ref_from_windows.ps1`.
- Added runbook `docs/04_operations/ubuntu_deploy_sync.md` and linked it from `scripts/README.md`.
- The new flow requires clean committed work, production-relevant memory/handoff updates, `origin/master`/`origin/autobot` alignment, and a safe laptop production-memory mirror when the main checkout is dirty.

## 2026-05-11 - Tool illustration batch 8

- Added one mid-article WebP illustration to 10 additional manually edited tool cards in both German and English.
- Selection follows the previous edited-tail runs: next registry-backed alphabetical candidates not already listed in `docs/04_operations/tool_card_illustration_registry.json`.
- Slugs: `beautiful-ai`, `beautyplus`, `befunky`, `bert`, `betty-blocks`, `bigbluebutton`, `binder`, `bookafy`, `box`, `branchtrack`.
- Recorded the batch in `docs/04_operations/tool_card_illustration_registry.json` so future illustration passes skip these tools.

## 2026-05-11 - Ableton Live manual editorial rewrite

- Rewrote the previously unregistered production-generated Ableton Live tool card in German and English.
- Added the slug to `docs/04_operations/tool_card_editorial_registry.json` so future manual editorial passes skip it.

## 2026-05-11 - Ableton Live tool illustration

- Added one mid-article WebP illustration to the Ableton Live tool card in both German and English.
- Registered the image in `docs/04_operations/tool_card_illustration_registry.json`.

## 2026-05-11 - Clip Studio Paint tool illustration

- Added one mid-article WebP illustration to the Clip Studio Paint tool card in both German and English.
- Followed the previous PNG-to-WebP scheme: generated raster artwork, converted to 1400px-wide WebP, inserted an image-only `tool-editorial-figure`, and recorded the slug in `docs/04_operations/tool_card_illustration_registry.json`.

## 2026-05-10 - Tool illustration batch 6

- Added one mid-article WebP illustration to 10 additional manually edited tool cards in both German and English.
- Selection follows the previous edited-tail batch: next registry-backed alphabetical candidates not already listed in `docs/04_operations/tool_card_illustration_registry.json`.
- Slugs: `avigilon`, `avoma`, `aweber`, `aws-cloud9`, `aws-kinesis`, `axis-communications`, `azure-machine-learning`, `b612`, `babbel`, `balsamiq`.
- Recorded the batch in `docs/04_operations/tool_card_illustration_registry.json` so future illustration passes skip these tools.

## 2026-05-09 - Tool Card Editorial Illustrations Batch 2

### Done
- Added one mid-article ChatGPT-generated WebP illustration to 30 additional tool cards, covering homepage pinned tools first and then high-popularity non-illustrated tools.
- Kept the existing image-only figure pattern: no visible captions, German and English alt text, shared WebP asset per tool.
- Updated `docs/04_operations/tool_card_illustration_registry.json` so future batches skip these slugs.

### Slugs
`wispr-flow`, `chatgpt`, `claude`, `midjourney`, `perplexity`, `zapier`, `endnote`, `bolt-new`, `canva`, `figma`, `jovian`, `marian-nmt`, `rytr`, `adept`, `adobe-firefly`, `adobe-photoshop-express`, `alteryx`, `amazon-dynamodb`, `amazon-transcribe`, `capcut`, `clara`, `consensus`, `coreldraw`, `cypress`, `dall-e`, `descript-overdub`, `fountain`, `gemini`, `ginger`, `google-tabellen`.

## 2026-05-09 - German Visible Umlaut Normalization

### Done
- Normalized visible German ASCII transliteration leftovers across the tool and Ratgeber content corpus, especially `fuer`, `ueber`, `Qualitaet`, `Pruefung`, `Moeglichkeit`, `tatsaechlich`, `Einstiegshuerde`, and compound forms like `Produktivitaetswerkzeug`.
- Follow-up tail audit fixed rarer forms such as `atmosphaerisch`, `anschlussfaehig`, `Loeschfristen`, `Trainingslaeufe`, `Privatsphaere`, `Woerterbuch`, and `moegen`; remaining suspicious scan hits are the proper name `BigBlueButton`.
- Scope was limited to German `content/tools` and `content/ratgeber` Markdown; URL, slug, source, image, and inline-code segments were intentionally skipped.
- The first attempted inline PowerShell Unicode write was discarded before build; the applied pass used ASCII-only placeholder decoding to avoid `?` mojibake.

### Verification
- Targeted German transliteration grep returned no hits for the configured visible bad-pattern set.
- `npm run check:editorial`, `node scripts/check_english_tool_translations.mjs`, `git diff --check`, and full `npm --prefix site run build` passed.

## 2026-05-09 - Tool Card Editorial Illustrations Batch 1

### Done
- Added one mid-article ChatGPT-generated WebP illustration to 20 already edited tool cards, with German and English alt text. The later cleanup removed visible captions because they added visual noise under the artwork.
- Used the second, corrected generation run only; the first stopped run was intentionally discarded because the visuals looked too uniform.
- Added `docs/04_operations/tool_card_illustration_registry.json` as the project memory for illustrated tool cards so future batches do not repeat these slugs.
- Removed the temporary local FotoJet illustration preview directory from `site/public/editorial-preview` so it cannot leak into production.

### Slugs
`adobe-enhance-speech`, `davinci-resolve`, `descript-studio-sound`, `elicit`, `fotojet`, `genei`, `litmaps`, `paperpile`, `pons`, `power-bi`, `research-rabbit`, `snappa`, `workday-hcm`, `continue`, `storystream`, `deepinfra`, `youcanbook-me`, `obs-studio`, `ourdream-ai`, `mailbird`.

## 2026-05-07 - Ratgeber Final Artwork Gate

### Done
- Hardened `scripts/ratgeber_cloudflare_candidate_sync.py` so the local HTML/PNG fallback renderer is no longer accepted as final `review_ready` artwork.
- Candidate uploads now reject unapproved/untagged PNG pairs, identical cover/workflow hashes, and visual metadata containing generic diagram/debug/service-label signals.
- Rework upload no longer passes `--force-images`, so a rework cannot accidentally overwrite manually prepared ChatGPT/editorial art with fallback schematics.
- Manual candidate uploads via `scripts/upload_ratgeber_candidate_from_md.mjs` now attach approved visual metadata by default.

## 2026-05-07 - Ratgeber Source And Tool-Link Guardrails

### Done
- Added a hard Ratgeber source rule: no Russian/Chinese/CJK source text, no RU/CN locale URLs, and no Russian corporate PR/local-market "know-how" as article source material.
- Removed Habr from the topic-harvester source mix and added explicit filters for Habr, Sber/Sberbank/SberTech, Platform V, Yandex, VK, Mail.ru, Rambler, Rutube, Skolkovo, Tinkoff/T-Bank, MTS, and Kaspersky.
- Added the catalog contract for Ratgeber text: recognized tool names must link to internal Utildesk cards when a card exists.
- Added the missing-card contract: if a Ratgeber draft mentions a relevant tool without a card, queue that tool for review instead of inventing an external text link.
- Clarified the admin-review contract: candidates do not self-improve in place; only an explicit rework request enters the KV queue, and the old preview should stay hidden until the rework consumer has produced real text or visual changes.
- Replaced the current Browser-Agenten candidate's lower workflow illustration with a distinct ChatGPT-generated PNG scene and force-uploaded the refreshed candidate preview to Cloudflare at `2026-05-07T08:16:15Z`.

### Verification
- Local Python compile passed for `scripts/ratgeber_topic_harvester.py`, `scripts/ratgeber_cloudflare_candidate_sync.py`, and the patched `opcl` export script draft.
- `opcl` rework cron is installed every 10 minutes and currently reports no pending rework requests; the refreshed candidate upload returned `ok: true` with both `cover.png` and `workflow.png` assets.

## 2026-05-06 - Search Sitemap Split

### Done
- Split search sitemaps into a conservative Google contract and a broad Bing contract.
- `sitemap.xml` remains the only sitemap advertised in `robots.txt` and submitted to GSC.
- `sitemap-bing.xml` is generated for Bing and should be submitted explicitly only when Bing needs a refresh.
- Long-tail tool pages now stay globally `index,follow` but can carry `googlebot noindex,follow`, so Google staging no longer suppresses Bing.

### Verification
- Live `https://tools.utildesk.de/sitemap.xml`: `322` unique URLs, no long-tail sample `10to8`, includes indexable partner/core sample `wispr-flow`.
- Live `https://tools.utildesk.de/sitemap-bing.xml`: `2092` unique URLs, includes both `10to8` and `wispr-flow`.
- GSC accepted and downloaded `sitemap.xml` with `submitted = 322`, `warnings = 0`, `errors = 0`.
- Bing feed was intentionally not resubmitted during this Google-focused repair.

### Commit
- `078b3c3` (`fix(seo): split google and bing sitemap policy`)

## 2026-05-06 - Ratgeber Candidate Gate Repair

### Done
- Removed two invalid Cloudflare review candidates:
  - `20260506-agentic-api-grader-by-saastr-ai-tool_spotlight-658e792b`
  - `20260505-vyrill-agentic-video-commerce-platform-tool_spotlight-e5394bec`
- Copied the hardened `scripts/ratgeber_cloudflare_candidate_sync.py` to the live `opcl` article factory.
- Hardened the `opcl` journalist editor so `tool_spotlight`, `tool_review`, `product_spotlight`, and `product_review` do not enter the Ratgeber article queue.
- Made visual quality a hard Cloudflare upload gate: failed, generic, fallback, placeholder, raw, unrelated, cloned, or debug-style visuals are rejected before review upload.

### Verification
- Cloudflare admin review page no longer contains `SaaStr` or `Vyrill` candidates and shows no open candidates.
- `opcl` dry-run sync reports `uploaded = 0` and both bad artifacts now have `cloudflare_review_rejected.json`.
- `opcl` article review queue reports `count = 0` open review packets.

## 2026-05-06 - Ratgeber Topic Harvester

### Done
- Added `scripts/ratgeber_topic_harvester.py` as the production-ready source-driven topic collector.
- Copied it to `opcl:/opt/openclaw/workspace/agent-newsman/scripts/ratgeber_topic_harvester.py`.
- Disabled the old `tool_spotlight` single-release fallback in both `opcl` copies of `intel_agent.py`.
- Wired the harvester into `opcl` daily intel run after the news/source pass.
- Queued two accepted multi-source Ratgeber jobs:
  - `AI-Agenten im Betrieb: Welche Tools Kontrolle, Monitoring und Review wirklich leisten`
  - `Browser-Agenten im Praxistest: Wo Automation hilft und wo sie gefaehrlich wird`

### Verification
- `python3 -m py_compile` passed for the harvester and patched `intel_agent.py` files on `opcl`.
- Harvester dry-run produced only multi-source jobs; no `tool_spotlight` remained in `latest_run.json`.
- `scripts/article_orchestrator.py --limit 2 --dry-run` accepted both jobs with `rejected_count = 0`.

## 2026-05-04 — Tool Editorial Expansion Batch 2

### Done
- Expanded 50 German tool articles with more authorial editorial text, longer practical sections, workflow notes, privacy/data notes, pricing context, alternatives, editorial assessment, and FAQ.
- Synced the same 50 English sibling articles in `content/en/tools/*.md` from the revised German source, then normalized English section headings for consistent page structure.
- Fixed `content/tools/yandex-translate.md` `official_url` from a captured Yandex captcha URL to `https://translate.yandex.com/`.
- Removed stale English body artifacts during overwrite, including the old incorrect HeyGen provider line.

### Commits
- German editorial batch: `35c7c76` (`content: expand 50 more tool articles`)
- English sibling sync: `4858aa9` (`content: sync english versions for 50 tool articles`)

### Slugs
`talend-data-fabric`, `heygen`, `jira`, `resemble-ai`, `streak`, `anchor`, `ibm-watson`, `getresponse`, `inshot`, `replika`, `ionic`, `facetune`, `taguette`, `setmore`, `zamzar-ai`, `busuu`, `kive`, `reverso`, `mural`, `cubase`, `picsart`, `grafana`, `fairseq`, `appium`, `framework7`, `livechat`, `audacity`, `aws-cloud9`, `nintex`, `swiftkey`, `v0`, `t-racks-von-ik-multimedia`, `bibdesk`, `postman`, `plot`, `spyfu`, `apache-storm`, `ren-py`, `viktor-for-media-buyers`, `artrage`, `any-do`, `apache-solr`, `pencil`, `magix-video-pro-x`, `execvision`, `hive`, `yandex-translate`, `remove-bg`, `sonix`, `whitesmoke`.

### Verification
- German selected-content check: 50/50 files, required sections present, minimum 602 words, no repeated long paragraphs, no captcha/mojibake/preismodell artifacts.
- English selected-content check: 50/50 files, required sections present, minimum 683 words, no forbidden German headings or old body artifacts, no repeated long paragraphs.
- `npm run check:editorial` passed.
- `node scripts/check_english_tool_translations.mjs` passed.
- `npm --prefix site run build` passed: 2673 pages built; sitemap regenerated with 434 URLs; Ratgeber manifest still reports 6 pages.

### Safety Notes
- Existing unstaged local changes were intentionally left untouched: `content/tools/chatgpt.md`, `docs/04_operations/backlink_outreach.md`, `docs/04_operations/bing_webmaster_access.md`, `docs/04_operations/search_console_health.md`.
- After this batch, keep checking `origin/master...origin/autobot` and live production after every task so no production or Ratgeber blocker is left behind.

## 2026-03-23 — Design System Merge

### Merged: design/stitch-digital-atelier → master
**Commit:** 19289df

**Changes:**
- `site/public/styles/global.css`: Full design system rewrite
  - Stitch Digital Atelier (Google Stitch design tool)
  - Teal primary (#176259), warm surface (#fafaf1)
  - Plus Jakarta Sans + Inter fonts via Google Fonts
  - Glassmorphism sticky header (backdrop-blur 24px)
  - Ambient shadows, ghost borders (rgba 35%)
  - Home cards: horizontal layout (logo left, title right)
  - Tool cards: 4-line descriptions, badges pinned to bottom
  - Hero: italic + skewX(-8deg) accent word
  - Tool detail: Direktlink box with logo centered (flex)
  - Prose: padding 36px 48px, max-width 860px

- `site/src/layouts/BaseLayout.astro`:
  - Sticky glass header (position: fixed, blur 24px)
  - Preconnect to Google Fonts
  - Updated footer with rounded top corners

- `site/src/pages/index.astro`:
  - New .hero-stitch section with skewed italic accent
  - Removed old inline <style> override block

- `site/src/pages/tools/[slug].astro`:
  - Logo integrated into Direktlink box (flex, vertically centered)
  - linkAllMentions: all occurrences of tool name → link
  - badge-category: now <a> link to /category/slug/ (canonical)
  - badge tags: already linked to /tools/?tag= (unchanged)
  - Improved article typography in <style> block

**Backup:** tag `backup/master-pre-design-20260323-0559`

---

## 2026-03-21 — Last Autogen
- 639 tools published to production
- 743 tools in content/ directory
- Cron pipeline healthy, 0 errors
## 2026-05-10 - Tool illustration batch 3

- Added one mid-article WebP illustration to the next 30 highest-popularity non-illustrated tool cards, in both German and English.
- Slugs: `google-translate`, `grafana`, `grammarly`, `groq`, `hubspot-sales-hub`, `hypic`, `intel-habana-labs`, `interpretml`, `kofax-rpa`, `langai`, `lingvanex`, `looker-studio`, `mallet`, `marvel`, `meaningcloud`, `microsoft-translator`, `mongodb`, `n8n`, `narrato`, `notebooklm`, `papago`, `pimeyes`, `poe`, `prisma`, `redis`, `replit`, `sap-sales-cloud`, `scribens`, `slick-write`, `sockeye`.
- Recorded the batch in `docs/04_operations/tool_card_illustration_registry.json` so future illustration passes skip these tools.

## 2026-05-10 - Tool illustration batch 4

- Added one mid-article WebP illustration to 30 more tool cards in both German and English.
- Selection: remaining non-illustrated tools with non-zero DE/EN popularity first, then high-intent catalogue tools without prior artwork.
- Slugs: `adobe-illustrator`, `10to8`, `adobe-premiere-pro`, `amazon-codewhisperer`, `copilot`, `openhands`, `speechmatics`, `storymapjs`, `talend-data-fabric`, `talon`, `theia`, `uipath`, `whisper`, `writesonic`, `youcam-makeup`, `affinity-designer`, `inkscape`, `adobe-express`, `miro`, `trello-mit-butler`, `airtable`, `tableau`, `semrush`, `postman`, `spacy`, `tensorflow`, `zotero`, `zoom`, `webflow`, `synthesia`.
- Recorded the batch in `docs/04_operations/tool_card_illustration_registry.json` so future illustration passes skip these tools.


## 2026-05-12 - Video AI tool cards published from Ratgeber mentions

### Done
- Added and manually edited German and English tool cards for `vyrill`, `naoma-ai`, and `hera` after they were mentioned in the multimodal agents Ratgeber article but were missing from the catalogue.
- Added the three tools to the source Sheet rows 1646-1648 and marked them `DONE` after live production verification.
- Linked the existing German and English Ratgeber article mentions to the new tool cards and added the tools to article `relatedTools`.
- Published directly to Cloudflare Pages with Wrangler because GitHub push alone did not make the new pages live within the wait window.

### Commit / deploy
- Content commit: `8bc2854` (`content: add Vyrill Naoma AI and Hera tool cards`).
- Direct Cloudflare Pages deployment URL: `https://190b28d4.utildesk-motia.pages.dev`.
- Live verification passed for:
  - `https://tools.utildesk.de/tools/vyrill/`
  - `https://tools.utildesk.de/en/tools/vyrill/`
  - `https://tools.utildesk.de/tools/naoma-ai/`
  - `https://tools.utildesk.de/en/tools/naoma-ai/`
  - `https://tools.utildesk.de/tools/hera/`
  - `https://tools.utildesk.de/en/tools/hera/`
  - `https://tools.utildesk.de/ratgeber/multimodale-agenten-warum-bild-video-und-code-jetzt-in-einem-workflow-landen-ein/`
- IndexNow submission succeeded for 9 derived URLs; both `api.indexnow.org` and Bing returned `200`.

### Operational note
- Windows `origin/master` and `origin/autobot` reached `8bc2854`; `C:\projects\utildesk-motia-production-sync` and VPS `/opt/utildesk-motia` were reset/synced to the same commit.
- Hub/Ubuntu mirror push to `jgdus@100.98.97.98` was blocked by a Tailscale SSH browser check, so `hub/master` and `hub/autobot` were still at `ce9109e` at the time of this note. Once Tailscale SSH is re-authorized, run the normal Windows sync with `-SyncHub` to mirror the current production refs to hub/Ubuntu.

## 2026-05-12 - Repair: Vyrill, Naoma AI, Hera expanded to full tool-card standard

- Replaced the earlier too-short Vyrill, Naoma AI, and Hera card bodies with full German and English editorial cards.
- Each repaired card now includes audience fit, use cases, practical workflow notes, features, pros/limits, workflow fit, privacy/data notes, pricing/costs, renderable internal alternatives, editorial assessment, and 5-item FAQ.
- Normalized alternatives to the renderable internal-link format (`[Tool](/tools/slug/): ...`) so the tool page template actually shows the alternatives grid.
- Rechecked editorial template, English translations, alternatives rendering, and the Astro production build before publication.

## 2026-05-12 - Ratgeber NotebookLM auth refreshed and visual upload unblocked

- Refreshed the local NotebookLM browser storage and copied the fresh `storage_state.json` to `opcl:/home/opcl/.notebooklm/storage_state.json`.
- Verified `scripts/notebooklm_auth_status.py` on `opcl`: `ok=true`, reason `notebooklm_auth_ready`, `notebook_count=21`.
- Manual runner checks after refresh:
  - `scripts/run_article_runner_host.sh` returned `ok=true` / no pending article jobs.
  - `scripts/run_article_rewrite_runner_host.sh` returned `ok=true` / `count=0`.
- Restored the Ratgeber Cloudflare candidate sync cron with `--allow-unapproved-visuals`, per current policy not to block review uploads on image quality while the contour lacks a reliable high-quality image-production stage.
- 2026-05-14: Added the next 50 varied editorial WebP illustrations for manually edited tool cards from Automation Anywhere through DataCamp; inserted localized DE/EN figure blocks and updated the illustration registry.
- 2026-05-15: Added the next 50 varied editorial WebP illustrations for active manually edited tool cards from Datadog through Google BigQuery; inserted localized DE/EN figure blocks, updated the illustration registry, and rejected generated variants with text/logo/dashboard artifacts.
- 2026-05-15: Added 30 varied editorial WebP illustrations for active manually edited tool cards from Google Chat through IBM Watson Speech to Text; inserted localized DE/EN figure blocks, updated the illustration registry, and rejected an early translation variant with symbol artifacts.

## 2026-05-18 - Vendor-card SEO repairs implemented

- Fixed high-risk vendor card issues: corrected Google Tasks and Google AI official URLs, deactivated duplicate Amazon/AWS, Google Cloud Translation, and Azure Synapse pages, and clarified the ambiguous `copilot` card as Assembly (formerly Copilot).
- Removed `copilot` from the Google force-index list so Microsoft Copilot remains the Google-priority Copilot page.
- Added `scripts/audit_vendor_tool_cards.mjs` plus `npm run audit:vendor`; the audit blocks known duplicate vendor pages, transient login/docs URLs, and ambiguous force-index entries.
- Added explicit Cloudflare Pages 301 redirects for disabled duplicate vendor slugs so stale static assets cannot keep returning 200 after deploy.

## 2026-05-21 - Compact thematic sitemap for search recovery

- Added a build-generated `sitemap-focus.xml` beside the existing Google and Bing sitemap files.
- Local build produced 96 focused URLs: core hubs/methodology, 24 German Ratgeber pages, 24 English Ratgeber pages, and 20 curated DE/EN tool-card pairs around AI assistants, coding agents, workflow automation, design/productivity, and BI.
- `robots.txt` remains unchanged and advertises only `https://tools.utildesk.de/sitemap.xml`; the focus sitemap is meant for explicit GSC/Bing submission, not broad crawler discovery.
- Production release commit: `9f08fcd9` (`seo: add focused sitemap`), published to `origin/master`, `origin/autobot`, and `hub`; direct Cloudflare Pages deploy was also used because the custom domain initially returned 404 for the new file.
- Live verification passed for `https://tools.utildesk.de/sitemap-focus.xml`: HTTP 200, XML content type, 96 `<loc>` entries, no machine endpoints, and `robots.txt` still lists only the main Google sitemap.
- Google Search Console submission succeeded for property `sc-domain:tools.utildesk.de`; API readback showed `lastSubmitted` and `lastDownloaded` on 2026-05-21, `warnings=0`, `errors=0`, and `submitted=96`.
- Bing Webmaster `SubmitFeed` succeeded for `https://tools.utildesk.de/sitemap-focus.xml`; immediate feed state was `Pending`, then `GetFeeds` refreshed to `Status=Success` and `UrlCount=96`, while broad `sitemap-bing.xml` stayed registered separately.
- IndexNow was submitted for all 96 focused canonical URLs to both `api.indexnow.org` and the direct Bing IndexNow endpoint; both returned HTTP 200.
﻿
## 2026-05-20 - Ratgeber hot-topic publication: AI agents, MCP governance, Vibe Coding

- Removed the duplicate `Browser-Agenten vs. Workflows` candidate from the NotebookLM/article pipeline and kept the already-published Browser-Agenten and AI Search Ratgeber pages as canonical.
- Created and manually edited three non-duplicate hot-topic Ratgeber articles in German and English:
  - `coding-agenten-2026-codex-claude-code-und-gemini-cli-im-entwickler-workflow`
  - `agent-security-und-mcp-governance-welche-guardrails-unternehmen-jetzt-brauchen`
  - `vibe-coding-nach-dem-hype-wie-teams-ai-code-pruefen-testen-und-reviewen`
- Generated two distinct narrative WebP illustrations per article via the ChatGPT/Codex OAuth image provider (`openai-codex`, not a standalone OpenAI API key) and inserted them as `coverImage` and `secondaryImage`.
- Ran `npm --prefix site run build`; build passed with 23 German and 23 English Ratgeber pages.
- Content commit: `96fb9b3f` (`content: publish AI agent workflow ratgeber`).
- Operational note: GitHub push alone did not make the new Ratgeber pages live within the first polling window, matching the 2026-05-12 behavior. Use `scripts/deploy_from_ubuntu.sh` or direct Wrangler Pages deployment if live URLs still return 404.

## 2026-05-23 - Catalog readability and masthead cleanup

- Improved the light-theme reading experience across the catalog homepage, tool detail pages, and Ratgeber detail pages by increasing practical contrast, text sizing, and content spacing.
- Moved the homepage `query_interface` and live feed blocks into the right `detail.preview` column, so the main hero has one clear editorial message instead of competing panels.
- Removed the nested right-column scrollbar by letting `detail.preview` grow with the page; the page now has one normal browser scroll.
- Replaced the rejected oversized rounded-card hero with a flatter compact masthead: Space Grotesk display title, subtle grid/green wash, and small stat pills under the intro copy.
- Verification before release: `npm --prefix site run build` passed with 3204 pages; direct Cloudflare Pages deployment `91446d24` was live-checked on `https://tools.utildesk.de/` with HTTP 200 and screenshot artifact `output/compact-masthead-live-production-light.png`.

## 2026-05-24 - Typography system cleanup

- Kept the live site typography to two active font roles: `Space Grotesk` for display headings and numeric emphasis, `JetBrains Mono` for catalogue/interface/body text.
- Removed the old inline `Plus Jakarta Sans` headings from German and English tool-detail alternative sections and replaced them with the shared `.alternatives-title` style.
- Fixed the 404 page to use the current `--display` and `--mono` font tokens instead of the stale `--font-mono` variable.
- Removed the unused legacy public stylesheet `site/public/styles/global.css`, which still described the old Inter/Plus Jakarta design system and was no longer imported by the Astro app.

## 2026-06-03 - Compact sitemap strategy for Google and Bing

- Live SEO check found no robots/fetch/canonical block on key pages, but Bing Webmaster still had broad `sitemap-bing.xml` registered alongside focused feeds.
- Policy audit found the broad Bing sitemap could include many long-tail URLs whose live pages returned global `noindex`, creating a mixed signal for Bing.
- Search strategy was changed away from broad sitemap submission: `sitemap.xml`, `sitemap-bing.xml`, and `sitemap-focus.xml` now all use the compact focus set: Ratgeber depth, core hubs/methodology, and the strongest curated tool cards.
- `scripts/bing_webmaster_api.py` now defaults feed submission to `https://tools.utildesk.de/sitemap-focus.xml`, and the postproduction pipeline submits only the focus sitemap to Bing.
- Bing Webmaster cleanup was performed immediately: removed registered `sitemap-bing.xml` and `sitemap.xml`, then resubmitted only `https://tools.utildesk.de/sitemap-focus.xml`; readback showed one feed, `UrlCount=102`, `Status=Pending` right after submission.
- Google Search Console compact sitemap was resubmitted for `sc-domain:tools.utildesk.de`; API returned `lastSubmitted=2026-06-03T21:10:12Z`, `warnings=0`, `errors=0`, while `lastDownloaded` remained the old 2026-05-21 value until Google recrawls it.
- IndexNow was submitted for all 102 live `sitemap-focus.xml` canonical URLs; both `https://api.indexnow.org/indexnow` and `https://www.bing.com/indexnow` returned HTTP 200.

## 2026-06-04 - Compact sitemap production deploy

- Committed the compact sitemap code as `1421f310` (`seo: compact search sitemaps`) and pushed it to `origin/master`.
- Cloudflare Git build for `1421f310` started, but a direct Cloudflare Pages deploy was used from verified local `site/dist` to avoid waiting on the long-running build. Direct deployment URL: `https://1ae7e7bf.utildesk-motia.pages.dev`.
- Live custom-domain verification passed immediately after deploy:
  - `https://tools.utildesk.de/sitemap.xml` -> `102` URLs;
  - `https://tools.utildesk.de/sitemap-bing.xml` -> `102` URLs;
  - `https://tools.utildesk.de/sitemap-focus.xml` -> `102` URLs;
  - `robots.txt` still advertises only `https://tools.utildesk.de/sitemap.xml`.
- Google Search Console main sitemap submit succeeded for `https://tools.utildesk.de/sitemap.xml`; final API readback after deploy showed `lastSubmitted=2026-06-04T11:13:09Z`, `lastDownloaded=2026-06-04T11:09:03Z`, `submitted=102`, `warnings=0`, `errors=0`.
- Bing Webmaster `sitemap-focus.xml` was resubmitted after deploy; follow-up feed readback showed `UrlCount=102`, `Status=Success`.

## 2026-06-04 - Qwant listing request

- Submitted the official Qwant website listing/contact form for `https://tools.utildesk.de/`.
- Used only non-personal project details: sender name `Utildesk`, email `utildesk@proton.me`, and a short note describing Utildesk as an editorial German/English AI tools directory with compact sitemap `https://tools.utildesk.de/sitemap.xml`.
- Qwant form returned the confirmation message: `Merci de nous avoir contacté ! Nous vous contacterons rapidement.`
- No personal first name, surname, or address was provided.

## 2026-06-08 - Whole-site mobile hardening pass

- Added a late decision-layout mobile hardening layer covering the homepage, inventory, tool detail, Ratgeber archive/articles, category/tag archives, methodology, imprint, and privacy pages.
- Mobile navigation now uses the black edition bar as the primary app-style nav, while the regular header is slimmed down to brand/liveness/language/theme utility controls to avoid the previous stacked desktop header on phones.
- Local QA covered DE/EN homepage, tools, tool detail, Ratgeber, category/tag, methodology, and legal routes at 390px, including load-more interaction and scroll-width checks.

## 2026-06-08 - Mobile header and footer alignment polish

- Added a final mobile-only decision-layout CSS layer so the compact language and `llms/feed` utility buttons render as true centered flex pills on phones instead of block-level text inside circular controls.
- Re-centered the mobile global footer and restored side padding so brand, editorial note, legal links, and feed link no longer hug the left viewport edge.
- Verification covered local dev and built `site/dist` at 390px on DE/EN homepage, tool index, Ratgeber index, ChatGPT tool detail, and privacy pages; header/footer metrics showed centered controls, centered footer links, no horizontal overflow, and no console errors.

## 2026-06-08 - Mobile homepage masthead balance

- Centered the homepage decision masthead on phones and widened the masthead subtitle to the available mobile width so it no longer reads like a narrow left-column label with an empty right half.
- Local mobile QA covered the homepage at 375px, 390px, and 430px; the masthead title/subtitle stayed centered, used the available width, and produced no horizontal overflow or console errors.

## 2026-06-14 - Sheet NEW hype tool publication batch

- Selected 20 high-signal `NEW` candidates from the Google Sheet source of truth and published full DE/EN editorial cards: `hugging-face-spaces`, `streamlit`, `gradio`, `litellm`, `anthropic-api`, `obsidian`, `roam-research`, `figjam`, `servicenow`, `apify`, `jax`, `d3-js`, `jupyter-notebook`, `trint`, `streamlabs`, `salesforce-lightning`, `callminer-eureka`, `nvidia-rtx-6000-ada-generation`, `ibm-api-connect`, `tibco-cloud-integration`.
- The legacy `scripts/publish_one_slug.mjs` path was attempted first on the production checkout, but the stored OpenAI API key returned 401; the touched Sheet row was reset from `IN_PROGRESS` back to `NEW`, then the batch was completed locally with manual full-card content.
- Updated `docs/04_operations/tool_card_editorial_registry.json` batch `2026-06-14-sheet-new-hype-20-publish`; generation intentionally kept the compact sitemap policy, so long-tail cards remain governed by the existing search-index rules instead of broad sitemap expansion.
- Verification before commit: English translations, `check:editorial`, `check:tool-quality`, internal alternative-link scan, manifest regeneration, and full `npm --prefix site run build`.

## 2026-06-14 - Sheet NEW hype 20 human editorial second pass

- Reworked the same 20 freshly published Sheet NEW tool cards with a broader manual editorial pass in German and English.
- Replaced the first-pass formulaic copy with tool-specific positioning, more concrete audience/use-case notes, sharper workflow caveats, privacy/cost considerations, stronger internal alternatives, and five-item FAQ blocks.
- Added editorial registry batch `2026-06-14-sheet-new-hype-20-human-polish`; future manual-card selections should continue skipping these slugs unless explicitly revisiting them.

## 2026-06-14 - OptiPlex Gemini web illustrations for first three Sheet NEW tools

- Added Gemini-authored editorial illustrations for `hugging-face-spaces`, `streamlit`, and `gradio`, covering both DE/EN tool pages with shared WebP assets.
- OpenClaw `image_generate` and Gemini CLI image paths on `jgdus-OptiPlex-3000` were checked first, but no usable Gemini image API credentials were available.
- Final artwork was generated as real raster images in Gemini web on OptiPlex under the paid `vasjakotov11@gmail.com` profile, exported from browser blobs, cropped to remove the Gemini UI sparkle, converted to WebP, and visually checked for varied styles.
- Updated `docs/04_operations/tool_card_illustration_registry.json` batch `2026-06-14-optiplex-gemini-web-first-3-sheet-new-illustrations`; future illustration batches should skip these slugs.

## 2026-07-03 - OptiPlex newsman candidate recovery

- Root cause for missing new Ratgeber candidates was split between stale/mostly published topic inputs and a NotebookLM contour mismatch on the physical OptiPlex.
- On `jgdus@100.98.97.98:/home/jgdus/projects/agent-newsman`, `auth/optiplex_runtime.env` was corrected so paid/article NotebookLM work uses the active paid browser profile at `/home/jgdus/.notebooklm` instead of the old `.utildesk-notebooklm-paid` path. A timestamped backup was left next to the env file.
- The `Agent Observability und Debugging: Wie Teams KI-Agenten nachvollziehbar machen` job still returned an empty NotebookLM answer with the full runner prompt. `article_execution/article_runner.py` on OptiPlex was patched with a compact fallback prompt used only after an empty first `ask`; a timestamped remote backup was left before the patch.
- After the fallback patch, the Agent Observability job completed successfully as `review_ready`: `artifacts/article_jobs/20260703-agent-observability-und-debugging-wie-teams-ki-agenten-nachvollziehbar-m-explainer-252b9711/`, with `article_quality.score=93`, `word_count=1030`, `section_count=5`, and queue status `done`.
- Added `scripts/sheet_seed_from_newsman_daily_candidates.mjs` in the main repo as a guarded bridge from OptiPlex `data/tool_candidates/daily_candidates.jsonl` to the Google Sheet source of truth. It deduplicates against Sheet and repo slugs, validates official URLs, can optionally resolve missing URLs through the existing DDG resolver, and defaults to writing only `NEEDS_REVIEW`.
- The 2026-07-02 newsman tool-candidate batch was filtered. Only one candidate was written to Sheet: `Tabstack`, row `1772`, slug `tabstack`, status `NEEDS_REVIEW`, official URL `https://tabstack.ai/`. Broader auto-writing was intentionally not performed because most Product Hunt items lacked stable official URLs or were ambiguous.

## 2026-07-08 - opcl newsman hot-topic fishing and Telegram digest repair

- Confirmed that the daily `newsman`/Telegram digest runner lives on `opcl` at `/opt/openclaw/workspace/agent-newsman`; the physical OptiPlex remains the paid NotebookLM/Gemini-browser article contour.
- `opcl` cron was still active and sent Telegram on 2026-07-07, but the digest had degraded to deterministic fallback because LLM providers were unavailable.
- Repaired the OpenAI OAuth path in `intel/intel_agent.py` so the runner accepts the stored OpenClaw `provider=openai` OAuth profile in addition to the older `openai-codex` provider id; dry-run verified `digest generation success mode=llm+human_editor provider=openai-codex model=gpt-5.5`.
- Repaired the Gemini fallback dependency path by installing `@mariozechner/pi-ai@0.73.1` locally under `opcl:/opt/openclaw/workspace/agent-newsman/intel` and updating `intel/gemini_digest_call.js` to use local `node_modules` plus dynamic ESM import. Gemini still needs a dedicated `google-gemini-cli` OAuth profile before it can be used by `agent-newsman`.
- Retargeted `opcl` hot-topic fishing: removed Habr/AI News noise from the Ratgeber harvester, added English AI feeds (`TechCrunch AI`, `The Verge AI`, `InfoQ AI ML`), expanded scoring around AI agents, memory/context, Office documents, agentic commerce, and agentic traffic, and added four incubating Ratgeber clusters.
- The new clusters are intentionally not queued yet because the stricter readiness gate requires at least three source families. Current incubating clusters: `agentic_document_office`, `shared_ai_workspaces_memory`, `always_on_research_agents`, and `agentic_traffic_visibility`.

## 2026-07-08 - Search recovery live audit and compact sitemap resubmission

- Added `docs/04_operations/search_recovery_action_plan_2026-07-08.md` from the Gemini Pro SEO strategy discussion: no domain change, no broad sitemap, focus on 100-ish perfect URLs and deep Ratgeber clusters.
- Ran a live focus sitemap audit against production. `robots.txt` advertises only `https://tools.utildesk.de/sitemap.xml`; `sitemap.xml`, `sitemap-focus.xml`, and `sitemap-bing.xml` each returned 116 URLs; all 116 unique focus URLs passed status/canonical/robots/X-Robots checks with zero live issues.
- Verified source-of-truth alignment: `site/scripts/generate_sitemap.mjs`, `site/src/lib/searchIndexPolicy.mjs`, `site/src/layouts/BaseLayout.astro`, and `site/public/robots.txt` still support the compact sitemap plus Googlebot-specific staging contract.
- Queried GSC through the `utildesk` service account. Google has freshly downloaded `https://tools.utildesk.de/sitemap.xml` with `submitted=116`, `warnings=0`, `errors=0`, but still reports `indexed=0`; representative core pages are `Crawled - currently not indexed`, while newer Ratgeber pages are still `URL is unknown to Google`.
- Resubmitted the official Google sitemap through GSC API and submitted all 116 focus URLs through IndexNow to the global endpoint and Bing endpoint; both IndexNow endpoints returned HTTP 200.
- Cleaned Bing Webmaster feeds: explicitly submitted `https://tools.utildesk.de/sitemap-focus.xml`, removed the stray `sitemap-bing.xml` feed entry that showed old broad metadata, and confirmed final Bing feed readback has one `Success` feed with `UrlCount=116`.
- Wrote the detailed status report to `docs/04_operations/search_recovery_live_audit_2026-07-08.md`. Current interpretation: the active problem is Google trust/discovery/reprocessing lag, not a live noindex/canonical/sitemap technical block.

## 2026-07-08 - OptiPlex Newsman source inbox

- Added a small source inbox on the physical OptiPlex at `jgdus@100.98.97.98:/home/jgdus/projects/agent-newsman/scripts/source_inbox.py`.
- The inbox stores manual/Perplexity/Reddit URL signals in `data/source_inbox/source_inbox.jsonl`, canonicalizes and deduplicates URLs, limits Reddit to selected AI/dev subreddits, and exports harvester-compatible JSONL to `data/source_inbox/source_inbox_candidates.jsonl`.
- Habr was deliberately removed from automatic fetch after live checks showed its `/en/rss/...` feeds returning Russian `/ru/` material. Keep Habr manual-only for concrete international AI/dev links, not as a broad automated source.
- Usage docs live on OptiPlex at `docs/source_inbox.md`; the existing opcl newsman/harvester can consume the exported file through `scripts/ratgeber_topic_harvester.py --candidates data/source_inbox/source_inbox_candidates.jsonl`.
- Added OptiPlex wrapper `scripts/run_source_inbox_fetch.sh`, which runs guarded Reddit source fetches, refreshes the candidates JSONL, and writes `logs/source_inbox_fetch_*.log`.
- Live verification filled the practical inbox with 8 `Reddit LocalLLaMA` signals and 8 exported candidate rows. Other configured Reddit feeds currently return HTTP 429 from the OptiPlex IP, so the wrapper uses delays and should be run gently rather than spammed.
- Expanded the OptiPlex source inbox fetcher with additional fishing sources: Hacker News AI/LLM via `hnrss.org`, arXiv `cs.AI`/`cs.CL`, Hugging Face Blog, Lobsters AI, Simon Willison, Latent Space, and a small GitHub Trending Daily parser for AI/open-source repositories.
- Added noise gates so Reddit megathread/moderator/support/usage-limit posts and generic non-AI web-feed items are kept out of the harvester export. Live verification after the expansion produced 62 raw inbox rows and 56 valid exported candidate rows.

## 2026-07-08 - NotebookLM seed for multi-model coding workflows

- Created a paid-profile NotebookLM research notebook on the physical OptiPlex for `Multi-Model Coding Workflows: Wenn Codex, Gemini und Claude sich gegenseitig prüfen`.
- Notebook id: `7dcc942f-d5f8-46ec-af8c-fc3eaa923f4e`; it uses `/home/jgdus/.notebooklm` and contains 11 ready sources, including Addy Osmani's 2026 coding workflow article, VS Code multi-agent development, MindStudio multi-model workflow, HN Mysti, several Reddit workflow discussions, DeployHQ/Tessl CLI comparisons, and an internal non-personal Utildesk workflow note.
- Generated completed NotebookLM artifacts: research briefing `3aa9bdfb-722b-4194-b04a-c1644b492ed7` and article draft `2f61f811-69c6-4e16-9a35-ad084c4c65b5` (`Codex fragt Gemini: Warum Multi-Model-Reviews beim Coding nützlich werden`).
- Downloaded the artifacts to OptiPlex at `artifacts/notebooklm_topic_seeds_20260708/multi-model-coding-workflows/research-briefing.md` and `article-draft.md`.
- Registered the topic in `data/article_jobs/notebooklm_research_topics.json` with `notebooklm_home=/home/jgdus/.notebooklm`; a dry-run of `scripts/notebooklm_research_to_article_jobs.py --min-sources 8` confirms it can create a pending workflow-article job with 10 URL sources, but no pending job was created yet.

## 2026-07-09 - Ratgeber Agent Observability publication

- Published the NotebookLM-first Ratgeber candidate `Agent Observability und Debugging: Wie Teams KI-Agenten nachvollziehbar machen` in DE/EN with a full manual editorial pass.
- The article uses the OptiPlex NotebookLM job `20260703-agent-observability-und-debugging-wie-teams-ki-agenten-nachvollziehbar-m-explainer-252b9711` plus the refreshed source briefing `source-rework-briefing-20260709.md`.
- Replaced the old generic visual direction with two distinct Gemini Web raster illustrations generated on the physical OptiPlex paid `vasjakotov11@gmail.com` browser profile, cropped to remove the Gemini watermark, and exported as WebP.
- The text grounds the topic in OpenAI Agents SDK tracing, LangSmith, Phoenix/OpenInference, OpenTelemetry GenAI, MLflow, Braintrust/Temporal, Microsoft AgentRx, trust-boundary labeling, PII/ZDR caveats, and practical 30-day rollout guidance.

## 2026-07-10 - KI-Blatt safe design stabilization

- Preserved the existing KI-Blatt newspaper identity and added a narrow `decision-refinements.css` layer instead of extending the historical override passes in `global.css`.
- Removed the duplicate light-header navigation while keeping the black edition bar as the primary navigation. Replaced the misleading `⌘ K -> llms.txt` link with a real DE/EN command search dialog; `llms.txt` and JSON Feed remain explicitly available as machine links.
- Normalized display typography: desktop Tool-Akte H1 now tops out at 88px instead of roughly 131px, inventory at 76px, and Ratgeber/article headings at 60px; mobile remains in the established 31-39px reading range.
- Tool editorial illustrations are extracted from the Markdown body and shown immediately after the masthead, without duplication. Illustrated catalog cards also expose their artwork in tile view.
- Added generated H2 anchors, compact DE/EN page navigation, and mobile-collapsed FAQ sections to tool dossiers and Ratgeber articles.
- Increased initial tool results to 12 on phones, 16 on tablets, 18 in desktop list view, and 24 in desktop tile view. Ratgeber archive now progressively reveals 8 cards on phones or 12 on desktop while keeping all cards in the static HTML.
- Final QA covered DE/EN tool index, tool detail, Ratgeber archive/article, homepage, command-search submission, load-more interactions, artwork placement, and 390px mobile geometry. No tested route had horizontal overflow; the full 3450-page Astro build and editorial/English checks passed.

## 2026-07-12 - Complete Ratgeber candidate factory migration to OptiPlex

- Moved the remaining daily Newsman/Ratgeber preparation runtime from `opcl` to the physical OptiPlex at `jgdus@100.98.97.98:/home/jgdus/projects/agent-newsman`. The old `opcl` 08:00 `agent-newsman` cron was removed after an end-to-end OptiPlex test; Petya and unrelated `opcl` jobs were left untouched. Backup: `/home/opcl/crontab-before-newsman-move-20260712T163611`.
- The managed OptiPlex factory now runs source-inbox fishing at 07:15, daily discovery at 08:00, NotebookLM research bridging, topic orchestration, article generation, rewrite/QA, private review sync, and publish/rework consumers. `ratgeber_topic_harvester.py` merges both `data/tool_candidates/daily_candidates.jsonl` and `data/source_inbox/source_inbox_candidates.jsonl` by default.
- Expanded the OptiPlex discovery/runtime copies with the current English source set and hot-topic clusters from the former `opcl` contour. A live inbox run fetched 64 items, added 46 new deduplicated signals, and exported 102 valid candidate rows; the combined harvester saw 7676 usable signals.
- Added `scripts/refresh_notebooklm_auth_from_chrome.py` on OptiPlex. Every NotebookLM stage refreshes `/home/jgdus/.notebooklm/storage_state.json` from the already authenticated paid Chrome profile on CDP port 9224/9225 before making CLI calls. Verification returned 114 cookies and 26 notebooks under the paid profile.
- Hardened failed-job retries and rewrite behavior. Stale failed jobs can be retried within bounded attempt limits, and a URL import timeout now records a skipped source instead of aborting the whole rewrite cycle. A live rewrite completed after a `tessl.io` timeout and correctly rejected a lower-scoring rewrite while preserving the stronger existing article.
- End-to-end live test created the candidate `20260712-shared-ai-workspaces-wie-teams-kontext-memory-und-agentenraeume--trend_piece-6b68f8e3` and NotebookLM notebook `445b5a3b-a946-45db-85a3-1b7064fece3b`: eight sources imported, 1140 German words generated, article QA 100/100, queue state `done`, review state `review_ready`. Generic fallback visuals remain intentionally unapproved and require the normal human-artwork stage before publication.
- Restored the private Ratgeber review API after recent static-only production deploys returned HTTP 405 for machine uploads. A clean full site build passed, direct Cloudflare Pages deployment `3425a919` explicitly uploaded the Functions bundle, and the upload endpoint returned the expected 401 without a token. The Shared AI Workspaces candidate then synced successfully to the private review backend at `2026-07-12T16:57:24Z`.
- Timestamped OptiPlex backups were written under `/home/jgdus/backups`, including the full pre-migration runtime snapshot `/home/jgdus/backups/agent-newsman-before-optiplex-factory-20260712T1810` and per-file/crontab backups made during the final wiring.

## 2026-07-12 - Shared AI Workspaces Ratgeber publication

- Published the NotebookLM-first candidate `20260712-shared-ai-workspaces-wie-teams-kontext-memory-und-agentenraeume--trend_piece-6b68f8e3` as the fully rewritten DE/EN Ratgeber `shared-ai-workspaces-team-kontext-memory-agenten`; source notebook `445b5a3b-a946-45db-85a3-1b7064fece3b` remains on the paid OptiPlex profile.
- Expanded the 1140-word source artifact into separate human-edited German and English articles covering shared project context, agent state, handoffs, permissions, durable artifacts, practical team scenarios, and a 30-day pilot. Fact checks use current official OpenAI, Anthropic, LangGraph, Slack, BitBoard, Sim, WUPHF, scritty, and Google Workspace CLI documentation.
- Added two deliberately different Gemini Web raster illustrations from the physical OptiPlex paid browser profile: a documentary team-workroom cover and a tactile isometric context-library scene. Both were cropped without visible Gemini watermark and exported as 1280x720 WebP.
- Added four mentioned but not yet publish-ready tools to the Google Sheet source of truth as `NEEDS_REVIEW`, without creating catalog cards: `sim-ai` row 1773, `bitboard` row 1774, `wuphf` row 1775, and `scritty` row 1776.
- Full editorial, English, tool-quality, link, and Astro build checks passed. The compact Google/Bing/focus sitemaps now contain 38 DE and 38 EN Ratgeber pages while retaining 15 staged tools per language.

## 2026-07-12 - Fill all six related-guide slots

- Raised the shared Ratgeber relation limit from four to six so the desktop three-column recommendation grid always renders two complete rows instead of leaving two empty cells.
- The change applies centrally to all 38 German and 38 English Ratgeber pages while preserving the existing topic, category, freshness, deduplication, and self-exclusion ranking.
- Full Astro build passed. Automated dist QA confirmed exactly six related-guide cards and zero self-links on all 76 localized article pages; a Playwright desktop screenshot confirmed the complete 3x2 layout visually.

## 2026-07-12 - Compact professional Ratgeber reading system

- Rebuilt the shared DE/EN article templates into a compact editorial layout with a two-column hero, consistently framed cover artwork, a constrained reading column, and a useful sticky sidecar instead of an underfilled right rail.
- The sidecar now combines the article summary, collapsible H2 navigation, optional editorial verdict, and publication dossier; on mobile it moves before the prose and remains a coherent article-overview card.
- Standardized cover and inline illustration presentation, removed the loose full-width strip treatment, tightened typography and vertical rhythm, and preserved the six related-guide slots on every article.
- The full 3452-page Astro build passed. Visual QA covered 1920px, 1440px, and 390px layouts, German and English routes, articles with and without an editorial note, inline illustrations, TOC interaction, console output, and horizontal overflow.

## 2026-07-12 - Compact Ratgeber archive storefront

- Rebuilt the shared DE/EN Ratgeber archive as an editorial storefront: one balanced lead story followed by a three-column grid instead of oversized full-width ledger rows with synthetic verdicts.
- Standardized every archive image to a clean 16:9 crop, added chronological issue labels, tightened excerpts and metadata, and reduced the first desktop batch to one feature plus three complete rows.
- Mobile now uses seven compact single-column cards initially, with six more per reveal; the previous first card was about 723px high, while the new card system is about 568px with no horizontal overflow.
- Added an isolated `ratgeber-archive.css` layer so archive-specific geometry does not affect article reading pages, the tool catalog, or other decision-template surfaces.
- Centered the archive load-more label explicitly in both axes so inherited button layout cannot pin the text to the upper-left edge.

## 2026-07-13 - KI-Video cover watermark crop

- Replaced the shared DE/EN KI-Video 2026 cover with a clean 16:9 crop that removes the residual Gemini mark from the lower-right corner while preserving the photographic composition.
- Kept the public asset URL unchanged and used the image-only sync path, so no tool-card or route rebuild was required.

## 2026-07-13 - Hybrid content runtime pilot

- Created an independent Cloudflare Worker/D1 pilot for the future hybrid architecture. The current Cloudflare Pages production deployment, canonical routes, Google sitemap, Bing sitemap, robots policy and static build remain unchanged.
- Added Markdown-to-D1 runtime export and targeted publisher scripts. The remote preview database contains all 38 German and 38 English Ratgeber entries, with content hashes and revisions so unchanged records are not rewritten.
- The Worker is a deliberately `noindex` preview at `https://utildesk-hybrid-preview.s-skorykov.workers.dev/runtime-preview/de/ratgeber/shared-ai-workspaces-team-kontext-memory-agenten/`; it renders from D1, uses the production image URL, and has a tested five-minute Cloudflare Cache API layer.
- Isolated the runtime Astro source tree under `site/runtime-src/`, so the Worker no longer bundles the legacy static tool/API/markdown route tree. Hybrid build is about 7 seconds and uploads only the runtime worker modules; existing full static builds remain supported.
- Added `docs/04_operations/hybrid_content_runtime.md` with commands, cache contract and a reversible rollout order. The renderer cache version is generated from runtime source hashes during each hybrid build, so template deployments invalidate old cached HTML without rebuilding editorial content.

## 2026-07-13 - D1-backed Ratgeber production runtime

- Completed the first hybrid production slice: all 38 DE and 38 EN Ratgeber entries are in the dedicated `utildesk-content-runtime-production` D1 database and are rendered by the separate `utildesk-content-runtime` Worker. Detailed articles and the archive preserve canonical URLs, hreflang, JSON-LD, editorial images, FAQ, internal links, sidebar data, and the existing BaseLayout visual system.
- Because `tools.utildesk.de` is a Cloudflare Pages custom domain under external INWX DNS rather than a Cloudflare zone, the production bridge is a narrowly scoped Pages middleware proxy instead of Worker Routes. It targets only Ratgeber paths, runtime assets, and the three compact sitemap files; all other site paths remain static Pages.
- The runtime merges D1 Ratgeber URLs with a generated snapshot of the compact static sitemap, keeping the existing staged tool URLs and robots/GSC/Bing contract while allowing future Ratgeber publication without a static build. Runtime cache keys include each D1 source revision/hash, so editorial updates bypass stale HTML automatically; sitemap cache TTL is five minutes.
- `site/dist-runtime/` is now isolated from the legacy `site/dist/` build output. A future editorial Ratgeber update is: source edit -> two targeted D1 upserts -> optional IndexNow; it does not build or upload thousands of tool pages.
- Added a fail-open and kill-switch safety model in Pages middleware. D1/Worker errors and missing imported entries fall back to static Pages. Setting `content-runtime:ratgeber=off` in the existing Pages `RATGEBER_REVIEW` KV instantly disables the proxy without a rebuild.

## 2026-07-13 - Tool-card quality campaign, first audited batch

- Added `scripts/audit_tool_editorial_coverage.mjs` to measure active DE/EN tool cards by actual editorial structure: independent assessment, copy depth, section depth, internal alternatives, FAQ, template signals, and locale parity. Do not treat old registry membership as proof of a broad human editorial pass.
- Baseline after separating text quality from illustration coverage: 1,229 active tools scanned; 1,009 require at least one editorial-content repair; 1,019 have an editorial illustration and 210 do not. Missing art is tracked separately and is not a substitute signal for text quality.
- Added a shared desktop presentation frame for every extracted `.tool-editorial-figure`: `16:10`, centered `object-fit: cover`, clipped rounded border. This normalizes 112 legacy square or unusual source-image ratios without destructive bulk cropping or replacing source artwork.
- First manual corrective DE/EN batch completed for `zoho-writer`, `airbyte`, `cohere`, and `languagetool`. The old German stubs and templated English passages were replaced with tool-specific workflow guidance, limits, governance notes, current official positioning, internal alternatives, and compact FAQs. Batch is recorded in `docs/04_operations/tool_card_editorial_registry.json` as `2026-07-13-tool-quality-campaign-01`.

## 2026-07-13 - Tool-card quality campaign, second audited batch

- Continued the campaign from the strict content audit rather than the historical illustration/editorial registry. The registry contains legacy status claims and must not be used as evidence that a card has received a broad human rewrite.
- Fully rewrote DE/EN cards for `anyword`, `copy-ai`, `open-webui`, and `algolia` with current official-product positioning, concrete rollout scenarios, operational limitations, governance notes, four internal alternatives, and three substantive FAQs. Existing editorial illustrations were retained.
- `Copy.ai` now describes the current GTM workflow platform rather than an obsolete generic copywriter; `Open WebUI` distinguishes self-hosted/local use from connected cloud-model data paths; `Algolia` covers index modelling, relevance testing, event quality, and hybrid search rather than merely listing features.
- Strict audit result after this batch: 224 clean cards (up from 220), 1,005 still requiring at least one content repair. Root `npm run check:editorial`, `npm run check:tools:en`, and `git diff --check` pass. Continue from the audit queue in small verified batches; do not blanket-toggle `editorial_reviewed`.

## 2026-07-13 - Tool-card quality campaign, browser automation start

- Replaced the near-empty legacy `Puppeteer` entry with a broad DE/EN editorial card. This also creates the previously missing English locale.
- The rewritten card distinguishes Puppeteer from a generic test suite: Chrome/Firefox control through CDP or WebDriver BiDi, browser-download setup, stable locator/wait discipline, failure artifacts, CI secrets, and bounded automation are covered alongside internal alternatives.
- Strict audit no longer flags `puppeteer`; root editorial and English checks pass. Continue this related cluster with Playwright and WebdriverIO, but keep each tool's actual trade-offs distinct.

## 2026-07-13 - Tool-card quality campaign, Playwright

- Rewrote the DE/EN `Playwright` card into a separate practical E2E-testing guide: cross-browser projects, context isolation, locator discipline, traces/videos/reports, controlled mocks and authentication state, CI browser versioning, and governance of flaky tests.
- The strict audit no longer flags `playwright`; `npm run check:editorial`, `npm run check:tools:en`, and whitespace validation pass.

## 2026-07-13 - Tool-card quality campaign, WebdriverIO

- Rewrote the DE/EN `WebdriverIO` card as a distinct WebDriver/Appium ecosystem guide, including runner and BDD choices, versioned configuration, Grid/cloud services, mobile-device coverage, report hygiene, parallelism, and least-privilege test accounts.
- The strict audit no longer flags `webdriverio`; root editorial, English, and whitespace checks pass. The browser-automation mini-cluster now has genuinely differentiated entries for Puppeteer, Playwright, and WebdriverIO.

## 2026-07-13 - Tool-card quality campaign, Pusher

- Replaced the generic DE/EN Pusher copy with a realtime-architecture editorial pass: authoritative-state design, private/presence channel authorisation, duplicate and delayed events, reconnect/fallback behaviour, load testing, payload minimisation, and usage-peak cost modelling.
- Strict audit no longer flags `pusher`; root editorial and English checks pass.

## 2026-07-13 - Tool-card quality campaign, Python

- Rebuilt the DE/EN Python entry around productive use rather than a language encyclopaedia: bounded first services, isolated and locked environments, CI version checks, data/AI privacy, type hints and tests, idempotent jobs, and measured performance work.
- Strict audit no longer flags `python`; root editorial, English, and whitespace validation pass.

## 2026-07-13 - Tool-card quality campaign, PostgreSQL

- Rebuilt the DE/EN PostgreSQL card around data-model decisions, constraints, realistic index work, migration and rollback risk, recovery testing, role separation, and managed-service boundaries.
- Strict audit no longer flags `postgresql`; root editorial, English, and whitespace validation pass.

## 2026-07-13 - Tool-card quality campaign, Prometheus

- Corrected a substantive catalog error: the previous DE/EN Prometheus card falsely described the monitoring system as an AI workflow tool. The replacement covers time-series metrics, SLO signals, label cardinality, PromQL/recording rules, alert hygiene, retention, and protected metric endpoints.
- Strict audit no longer flags `prometheus`; root editorial, English, and whitespace validation pass.

## 2026-07-13 - Tool-card quality campaign, Sistrix

- Rewrote the DE/EN Sistrix card around defensible SEO work: visibility-index interpretation, first-party Search Console/analytics cross-checks, intent-led keyword clustering, validation of technical and link signals, and controlled reporting.
- Strict audit no longer flags `sistrix`; root editorial, English, and whitespace validation pass.

## 2026-07-13 - Tool-card quality campaign, Snowflake

- Rewrote the DE/EN Snowflake card as a cloud-data-platform decision guide: separated storage/compute, virtual-warehouse cost controls, bounded data pilots, data ownership and sharing, and operational governance.
- Strict audit no longer flags `snowflake`; root editorial, English, and whitespace validation pass.

## 2026-07-13 - Tool-card quality campaign, Simplenote

- Rewrote the DE/EN Simplenote card around its intentional lightweight scope: tags and review habits, Markdown/version limits, small-team collaboration, sensitive-data boundaries, and a practical export test for portability.
- Strict audit no longer flags `simplenote`; root editorial, English, and whitespace validation pass.

## 2026-07-13 - Tool-card quality campaign, SmartRecruiters

- Rewrote the DE/EN SmartRecruiters card around responsible applicant tracking: structured scorecards, bounded AI assistance, human decision ownership, candidate-data role boundaries, retention/integration review, and meaningful rollout metrics.
- Strict audit no longer flags `smartrecruiters`; root editorial, English, and whitespace validation pass.

## 2026-07-13 - Tool-card quality campaign, 8x8

- Audit showed the existing DE/EN 8x8 editorial copy was already broad; its sole quality gap was zero internal alternatives. Replaced the unlinked vendor-name list with four locale-correct internal alternative links, keeping the substantive communication-platform guidance intact.
- Strict audit no longer flags `8x8`; root editorial, English, and whitespace validation pass.

## 2026-07-13 - Tool-card quality campaign, Aide

- Rebuilt the DE/EN Aide card against the current first-party product description: governed customer-experience agents, one-intent-at-a-time testing, agent vs copilot boundaries, MCP/API context, action traces, human escalation, and support-data governance.
- Strict audit no longer flags `aide`; root editorial, English, and whitespace validation pass. The existing `aide-editorial.webp` is thematically mismatched legacy art and remains a separate illustration-normalisation task, not a reason to misrepresent the text as unfinished.

## 2026-07-13 - Ratgeber runtime presentation recovery

- Diagnosed the production regression as a runtime-only styling gap: D1-rendered Ratgeber articles use `runtime-ratgeber-*` markup, while the static article template owns the established sheet classes and their CSS. Content, D1 reads, and canonical routing were healthy; only the article presentation had fallen back to generic BaseLayout typography.
- Added a responsive runtime editorial layer to `site/src/styles/ratgeber-editorial.css`: compact two-column hero, fixed 16:10 cover frame, constrained serif reading column, useful sticky sidecar, related-guide grid, and a single-column mobile reading flow without horizontal overflow.
- The runtime Worker is owned by a separate Cloudflare account from Pages. Its deployment token was unavailable during the repair, so Pages middleware now injects a versioned static stylesheet only into successful proxied runtime HTML responses. `site/scripts/sync_runtime_ratgeber_fallback_css.mjs` derives that public fallback stylesheet from the same source section during `postbuild`; do not hand-maintain a second CSS copy.
- Production verification: both DE and EN Ratgeber detail routes returned `200`, `X-Utildesk-Content-Runtime: ratgeber-v1`, `X-Utildesk-Runtime-Styles: pages-bridge-v1`, and the injected stylesheet. Browser QA covered Shared AI Workspaces and KI-Video at 1440px and 390px; no horizontal overflow was found.
- Corrected a runtime-only secondary-illustration duplication: when Markdown already contains its `secondaryImage`, the Pages bridge removes only the trailing duplicate figure. The runtime component now makes the same check, so a future Worker deployment cannot reintroduce it. Live KI-Video HTML now contains the provenance illustration once.
- Removed nested sidebar scrolling across Ratgeber detail pages. The table of contents and supporting cards are now fully expanded in a normal, non-sticky side column that scrolls with the document; the static fallback uses the same behavior.
- The existing production runtime archive still emitted D1 entries in legacy insertion order. Pages middleware now sorts only the `/ratgeber/` and `/en/ratgeber/` card lists by their rendered publication dates, reassigns issue numbers and keeps the existing load-more contract. Live archives now show newest guides first in both locales while the local runtime query remains date-descending for the next Worker release.
- Reframed all Ratgeber article heroes in both runtime and static fallback: compact full-width metadata/title/lead, followed by a wide 21:8 editorial cover on desktop. This removes the former cramped two-column hero and caps the heading at `3.45rem`; mobile retains a readable 16:10 cover, a `32px` heading, and no horizontal overflow.

## 2026-07-13 - Tool-card quality campaign, OpenClaw

- Rebuilt the DE/EN OpenClaw card from the current first-party product model: a self-hosted personal-agent runtime, chat channels, gateway, skills, model choice, recurring work, and local operational ownership. Removed the corrupted legacy German template text and unsupported generic feature claims.
- Added a practical scoped rollout, permission and data-flow guardrails, current comparison links, and reviewable FAQ answers. Strict audit no longer flags `openclaw`; root editorial, English, and whitespace validation pass.

## 2026-07-13 - Tool-card quality campaign, Orbit Intelligence

- Kept the substantive existing DE/EN patent-research guidance, but converted its legacy editorial label into the audited form and refreshed the review metadata.
- Replaced the isolated competitor list with six locale-correct internal comparisons: PatSnap, Derwent Innovation, Innography, Google Patents, Espacenet, and Lens.org. Strict audit no longer flags `orbit-intelligence`; root editorial, English, and whitespace validation pass.

## 2026-07-13 - Tool-card quality campaign, Apache Hadoop

- Rebuilt the DE/EN Hadoop card around its real distributed-computing role: HDFS, YARN, MapReduce, batch fit, self-hosted operational ownership, and the difference between a development setup and a production data platform.
- Added a bounded pilot, failure testing, Apache's Kerberos production requirement, costs of running the platform, and locale-correct internal alternatives. Strict audit no longer flags `apache-hadoop`; root editorial, English, and whitespace validation pass.

## 2026-07-13 - Tool-card quality campaign, AssemblyAI

- Rebuilt the DE/EN card from AssemblyAI's current voice-AI platform: recorded, synchronous and real-time STT, speech understanding, voice-agent APIs, and PII/content guardrails instead of generic transcription claims.
- Added an audio-quality pilot, evidence and review boundaries for CRM/agent use, privacy controls, practical API-fit alternatives, and verified FAQ answers. Strict audit no longer flags `assemblyai`; root editorial, English, and whitespace validation pass.

## 2026-07-13 - Tool-card quality campaign, Deepgram

- Rebuilt the DE/EN Deepgram card around the current Voice AI platform: real-time and batch STT, TTS, audio intelligence, the Voice Agent API, and cloud/self-hosted deployment rather than the legacy transcription-only template.
- Added a measured voice-agent pilot, latency and human-handoff controls, privacy and operating boundaries, current alternatives, and reviewable FAQ answers. Strict audit no longer flags `deepgram`; root editorial, English, and whitespace validation pass.

## 2026-07-13 - Tool-card quality campaign, Be My Eyes

- Rebuilt the DE/EN card as an accessibility guide: live volunteer assistance, Be My AI, Service Directory, desktop and smart-glasses context, with personal agency and privacy rather than generic automation language.
- Added practical safe-use boundaries for sensitive or high-stakes situations, a company-accessibility checklist, verified internal alternatives, and FAQ answers. Strict audit no longer flags `be-my-eyes`; root editorial, English, and whitespace validation pass.

## 2026-07-13 - Tool-card quality campaign, Dovetail

- Rebuilt the DE/EN Dovetail card around its current customer-intelligence platform: connected signals, evidence-backed AI analysis, chat/search, governance, and traceability rather than generic qualitative-data claims.
- Added a bounded rollout, source and counter-evidence rules, consent/retention boundaries, four verified internal alternatives, and FAQ answers. Strict audit no longer flags `dovetail`; root editorial, English, and whitespace validation pass.

## 2026-07-13 - Tool-card quality campaign, Google Patents

- Rebuilt the DE/EN card as a reproducible prior-art research guide, clearly separating the free search interface from legal status, FTO, filing, and patent-professional work.
- Added a search protocol, official-register cross-checks, documented uncertainty, five verified internal patent-research alternatives, and FAQ answers. Strict audit no longer flags `google-patents`; root editorial, English, and whitespace validation pass.

## 2026-07-13 - Tool-card quality campaign, KineMaster

- Rebuilt the DE/EN KineMaster card around the current mobile NLE: multi-layer timeline, captions, AI voice and video helpers, chroma key, audio work, 4K/60 export, and the difference between mobile production and desktop finishing.
- Added a repeatable production flow, AI/asset and rights checks, five verified internal video alternatives, and practical FAQ answers. Strict audit no longer flags `kinemaster`; root editorial, English, and whitespace validation pass.

## 2026-07-13 - Tool-card quality campaign, Aider

- The existing DE/EN Aider editorial guidance was already substantive. Its only strict-audit gap was an isolated legacy competitor list with no internal links.
- Added five verified locale-correct comparisons to OpenAI Codex, GitHub Copilot, Cline, OpenHands, and Cursor. Strict audit no longer flags `aider`; root editorial, English, and whitespace validation pass.

## 2026-07-13 - Tool-card quality campaign, Beautiful.ai, CapCut, and D-ID

- The existing DE/EN guidance in these three cards was already broad, but all comparison sections were isolated vendor-name lists. Added verified locale-correct links for five relevant alternatives per card.
- Corrected the English CapCut alternatives heading from a non-audited word order so its five existing links are actually recognised by the coverage audit. Strict audit no longer flags `beautiful-ai`, `capcut`, or `d-id`; root editorial, English, and whitespace validation pass.

## 2026-07-13 - Tool-card quality campaign, Google Cloud Vision AI

- Rebuilt the DE/EN card around the actual Cloud Vision API: OCR, image labels, logos and landmarks, SafeSearch, face detection without identification, and API-based integration rather than generic AI automation copy.
- Added a bounded evaluation method, cost and data-governance checks, explicit product-selection limits, verified alternatives, and practical FAQ answers. Strict audit no longer flags `google-cloud-vision-ai`; root editorial, English, and whitespace validation pass.

## 2026-07-13 - Tool-card quality campaign, Weglot

- Rebuilt the DE/EN card around the current website-localisation workflow: content detection, machine translation and visual review, glossary rules, language-specific URLs, `hreflang`, and a controlled multilingual rollout.
- Added practical SEO, cost, migration and editorial-risk boundaries, plus verified internal alternatives to DeepL, Lokalise, Crowdin, and Phrase. Strict audit no longer flags `weglot`; root editorial, English, and whitespace validation pass.

## 2026-07-13 - Tool-card quality campaign, Adobe Podcast

- Rebuilt the DE/EN card around the real speech-cleanup workflow: Enhance Speech, source-recording limits, artefact review, preserving originals, and the boundary between spoken-audio enhancement and a full DAW.
- Added rights and cloud-processing checks, a repeatable listening review, verified internal alternatives, and practical FAQ answers. Strict audit no longer flags `adobe-podcast`; root editorial, English, and whitespace validation pass.

## 2026-07-13 - Tool-card quality campaign, Amazon Aurora

- Rebuilt the DE/EN card around actual Aurora operations: PostgreSQL/MySQL-compatible editions, provisioned versus serverless capacity, replicas, Multi-AZ, global recovery, migration tests, and recovery practice.
- Added current I/O and capacity cost-model distinctions, governance boundaries, verified internal database alternatives, and practical FAQ answers. Strict audit no longer flags `amazon-aurora`; root editorial, English, and whitespace validation pass.

## 2026-07-13 - Tool-card quality campaign, Amazon Lex

- Rebuilt the DE/EN card around Lex V2 as a controlled conversational interface: voice and text, intents and slots, Assisted NLU, Lambda actions, Amazon Connect, testing, and human handoff rather than a generic chatbot claim.
- Added a bounded pilot protocol, security and transcript-governance limits, usage-cost distinctions, verified internal alternatives, and practical FAQ answers. Strict audit no longer flags `amazon-lex`; root editorial, English, and whitespace validation pass.

## 2026-07-13 - Tool-card quality campaign, Apache Beam

- Rebuilt the DE/EN card around Beam's actual role as a portable batch-and-streaming programming model, including SDKs, runners, event time, windows, state, timers, connectors, and the distinction between Beam code and execution backends.
- Added runner-capability boundaries, a production spike protocol, data-quality and recovery operations, verified internal alternatives, and practical FAQ answers. Strict audit no longer flags `apache-beam`; root editorial, English, and whitespace validation pass.

## 2026-07-13 - Tool-card quality campaign, Apigee

- Rebuilt the DE/EN card around Apigee as API-management rather than a generic gateway: API proxies, policies, API hub, developer portals, analytics, hybrid runtime, and API-product governance.
- Added a contract-first rollout, policy and secret controls, current cost dimensions, verified internal alternatives, and practical FAQ answers. Strict audit no longer flags `apigee`; root editorial, English, and whitespace validation pass.

## 2026-07-13 - Tool-card quality campaign, Are.na

- Rebuilt the DE/EN card around long-term research curation: blocks and channels, multiple contextual connections, private/closed/public permissions, collaboration, export, API, and the boundary from project management.
- Added a repeatable research practice, source and rights checks, archive guidance, verified internal alternatives, and practical FAQ answers. Strict audit no longer flags `are-na`; root editorial, English, and whitespace validation pass.

## 2026-07-13 - Tool-card quality campaign, Auto-sklearn

- Rebuilt the DE/EN card around the actual scikit-learn AutoML workflow: model and hyperparameter search, preprocessing, ensembles, resource limits, restricted search spaces, result inspection, and Dask parallelism.
- Added leakage-safe evaluation, baseline and holdout requirements, reproducibility and production-monitoring boundaries, verified internal alternatives, and practical FAQ answers. Strict audit no longer flags `auto-sklearn`; root editorial, English, and whitespace validation pass.
## 2026-07-13 - Tool-card quality campaign, AWS Bedrock

- Replaced an old generic DE/EN template with a current, fact-checked editorial card: multi-provider model access, AWS operating boundaries, Knowledge Bases, Guardrails, evaluations, agents, API portability, real cost dimensions and a pilot workflow.
- Added verified internal alternatives, operational security boundaries and practical FAQs. The strict editorial audit no longer flags `aws-bedrock`.
## 2026-07-13 - Tool-card quality campaign, Amazon MSK

- Replaced the empty German and generic English templates with a full DE/EN Kafka operating guide: Provisioned versus Serverless, Connect and Replicator, event contracts, partitioning, consumer idempotency, ownership, monitoring, security and real cost dimensions.
- Added verified internal alternatives and practical FAQ answers. Strict audit no longer flags `amazon-msk`.
## 2026-07-13 - Tool-card quality campaign, Avatoon

- Corrected a material factual error in the old card: Avatoon.net describes a human-artist commissioned-avatar service, not an AI avatar generator. Rewrote DE/EN around its actual order, review, file-delivery, briefing, privacy and licensing workflow.
- Added internal alternatives and practical FAQs; strict audit no longer flags `avatoon`.
## 2026-07-13 - Tool-card quality campaign, Avid Media Composer

- Replaced generic DE/EN copy with a fact-checked post-production workflow: media organisation, proxy policy, ScriptSync/PhraseFind, shared bins and lock discipline, review exports and delivery ownership.
- Added practical alternatives and FAQs. Strict audit no longer flags `avid-media-composer`.
## 2026-07-13 - Tool-card quality campaign, Avigilon Control Center

- Rebuilt DE/EN copy around the actual VMS and security-operations workflow: alarms, roles, event review, access-control integration, storage and evidence handling.
- Added explicit privacy and biometric-search boundaries, real alternatives and practical FAQs. Strict audit no longer flags `avigilon-control-center`.
## 2026-07-13 - Tool-card quality campaign, AWS Lambda

- Rebuilt DE/EN around current Lambda engineering: event-driven functions, stateless invocations, 15-minute boundary, idempotency, retries, dead letters, IAM isolation, VPC discipline and outcome-based cost control.
- Added current MicroVM/Durable Functions context, internal alternatives and practical FAQs. Strict audit no longer flags `aws-lambda`.
## 2026-07-13 - Tool-card quality campaign, AXIS Camera Station Pro

- Updated the stale product framing to AXIS Camera Station Pro and rebuilt DE/EN around local VMS operations, Smart Search, incident reports, redaction, access control, roles, retention and controlled exports.
- Added verified internal alternatives and practical FAQs. Strict audit no longer flags `axis-camera-station`.
## 2026-07-13 - Tool-card quality campaign, Babbel

- Rebuilt DE/EN around actual Babbel learning mechanics: short level-based lessons, spaced review, speech recognition, Babbel Speak, realistic practice and subscription/privacy boundaries.
- Added internal alternatives and practical FAQs; strict audit no longer flags `babbel`.
## 2026-07-13 - Tool-card quality campaign, Azure Functions

- Rebuilt DE/EN around current Azure Functions choices: Flex Consumption, Premium and Dedicated hosting, bindings, reliable event handling, Managed Identity, Application Insights and Durable Functions orchestration.
- Added verified internal alternatives and practical FAQs. Strict audit no longer flags `azure-functions`.

## 2026-07-13 - Tool-card quality campaign, BeFunky

- Replaced the short and template-driven DE/EN entries with a practical editorial guide to browser-based image editing, collages, templates, quality review, asset rights, exports and team operating boundaries.
- Added a repeatable rollout method, cost checks, verified internal alternatives and practical FAQs. Strict audit no longer flags `befunky`.

## 2026-07-13 - Tool-card quality campaign, BERT

- Replaced the short/generic DE and EN entries with a fact-checked guide to BERT as an encoder for bounded NLP work: classification, entity recognition, semantic retrieval, evaluation splits, error analysis, reproducibility and monitoring.
- Added model-selection boundaries, data and privacy ownership, verified internal alternatives and practical FAQs. Strict audit no longer flags `bert`.

## 2026-07-13 - Full tool-card exemplar, Hugging Face

- Rebuilt the DE/EN Hugging Face card as the canonical full editorial exemplar: current Hub, Model Cards, local libraries, Spaces, Inference Providers, dedicated Endpoints, evaluation, governance, security, cost boundaries and an explicit editorial verdict.
- Added five verified internal alternatives and four practical FAQ answers in both languages. The reusable Codex skill `utildesk-tool-editorial` records this full-card workflow and requires strict audit, complete build, live rendering and linked-route checks before completion is claimed.

## 2026-07-13 - Tool-card quality campaign, Cerebras Wafer-Scale Engine

- Rebuilt the DE/EN card around Cerebras as a specialised wafer-scale training and inference platform, separating WSE hardware, system software and delivery model instead of repeating generic accelerator claims.
- Added a measurable pilot workflow, MLOps and recovery boundaries, data governance, realistic cost dimensions, five verified internal alternatives, and five practical FAQ answers in both languages.
- Preserved the existing editorial illustration and updated only the paired card metadata and last-modified entries. The strict editorial guard no longer flags `cerebras-wafer-scale-engine`.

## 2026-07-13 - Tool-card quality campaign, Granola

- Rebuilt the DE/EN card around Granola's current AI notepad workflow: manually started device-audio capture, rough notes enhanced with transcript context, calendar context, search, sharing, integrations, and API/MCP boundaries.
- Added consent and retention guardrails, transcript-quality checks, current plan-cost dimensions, three verified internal alternatives, and practical FAQs. Preserved the existing illustration; source-gate passed.

## 2026-07-13 - Tool-card quality campaign, Pipedream

- Rebuilt the DE/EN card around Pipedream's event-driven workflows, code steps, triggers, connected accounts, retries, logs, and the boundary between a fast integration prototype and a governed production workflow.
- Added operational, privacy and cost guidance, verified internal alternatives, practical FAQs, and preserved the existing illustration; source-gate passed.

## 2026-07-13 - Tool-card quality campaign, Pixlr

- Rebuilt the DE/EN card around Pixlr's browser-based image editing workflow, format and export checks, AI-assisted operations, asset rights, and the limits of a lightweight editor for team production.
- Added a bounded rollout, verified internal alternatives, practical FAQs, and preserved the existing illustration; source-gate passed.

## 2026-07-13 - Tool-card quality campaign, RStudio

- Rebuilt the DE/EN card around RStudio Projects, R, R Markdown, Quarto, package reproducibility, Git, local versus server operations, and analysis governance rather than generic data-tool claims.
- Added privacy and operating boundaries, three verified internal alternatives, practical FAQs, and preserved the existing illustration; source-gate passed.

## 2026-07-13 - Tool-card quality campaign, AppDynamics, Apache Spark Structured Streaming, Articulate Storyline and Articulate 360

- Rebuilt the DE/EN cards around concrete workflows, operating boundaries, practical use cases, verified internal alternatives, and FAQs.
- Preserved each existing editorial illustration and changed no shared CSS, generators, or generated files. These four cards remain in the 100-card accumulation batch.

## 2026-07-13 - Tool-card quality campaign, Adapt Learning, Adobe Premiere Rush, Adot AI and AI Dungeon

- Rebuilt the DE/EN cards around concrete workflows, current product boundaries, practical use cases, verified internal alternatives, and FAQs.
- Adobe Premiere Rush explicitly records the product end-of-life status and support boundary. Existing editorial illustrations were preserved; no shared CSS, generators, or generated files were changed. These four cards remain in the 100-card accumulation batch.

## 2026-07-13 - Tool-card quality campaign, AI Explainability 360, AI21 Labs, Aira and Airbrush

- Rebuilt the DE/EN cards around concrete workflows, current product boundaries, practical use cases, verified internal alternatives, and FAQs; preserved each existing editorial illustration.
- Source-gate, editorial and EN checks passed. AI21 Labs and Aira could not run the local `verify` because the isolated worktrees lack `site/node_modules/sharp`; no workaround or generated files were introduced. These four cards remain in the 100-card accumulation batch.

## 2026-07-13 - Tool-card quality campaign, Alibaba Cloud AI, Amazon EMR, Amazon Kinesis Data Analytics and Amazon OpenSearch

- Rebuilt the DE/EN cards around current product boundaries, concrete workflows, practical use cases, verified internal alternatives, cost/privacy limits, and FAQs; preserved each existing editorial illustration.
- Editorial and EN checks passed. Alibaba Cloud AI and Kinesis also encountered the isolated-worktree `site/node_modules/sharp` limitation during `verify`; no workaround or generated files were introduced. These four cards remain in the 100-card accumulation batch.

## 2026-07-13 - Tool-card quality campaign, Amazon Redshift, Rekognition Video, SageMaker Autopilot and Transcribe

- Rebuilt the DE/EN cards around concrete AWS workflows, current service boundaries, security/privacy and cost considerations, verified internal alternatives, and FAQs; preserved the existing editorial illustrations.
- All four cards passed their source-gate checks and remain in the 100-card accumulation batch; no shared CSS, generators, generated files, commit, push or deploy were performed.

## 2026-07-13 - Tool-card quality campaign, Amazon Translate, AWS AI, AMD Instinct GPU and AMD Instinct MI100

- Rebuilt the DE/EN cards around concrete translation, managed-AI and accelerator workflows, current product boundaries, privacy/cost constraints, verified internal alternatives, and FAQs; preserved the existing editorial illustrations.
- Source-gate and editorial checks passed. These four cards remain in the 100-card accumulation batch; no shared CSS, generators, generated files, commit, push or deploy were performed.

## 2026-07-13 - Tool-card quality campaign, Anki, Apache Cassandra, Apache Druid and Apache HBase

- Rebuilt the DE/EN cards around concrete learning and data-platform workflows, current boundaries, privacy/cost considerations, verified internal alternatives, and FAQs; preserved the existing editorial illustrations.
- All four cards passed their source-gate checks. They remain in the 100-card accumulation batch; no shared CSS, generators, generated files, commit, push or deploy were performed.

## 2026-07-13 - Tool-card quality campaign, Apache Hive, Impala, Kafka and Pinot

- Rebuilt the DE/EN cards around concrete data-platform workflows, current boundaries, operational and security considerations, verified internal alternatives, and FAQs; preserved the existing editorial illustrations.
- All four cards passed their source-gate checks. They remain in the 100-card accumulation batch; no shared CSS, generators, generated files, commit, push or deploy were performed.

## 2026-07-13 - Tool-card quality campaign, Apache Pulsar, Spark SQL, AppSheet and Asana

- Rebuilt the DE/EN cards around concrete messaging, SQL, no-code automation and work-management workflows, current boundaries, governance/cost considerations, verified internal alternatives, and FAQs; preserved the existing editorial illustrations.
- All four cards passed their source-gate checks. They remain in the 100-card accumulation batch; no shared CSS, generators, generated files, commit, push or deploy were performed.

## 2026-07-13 - Tool-card quality campaign, AudioTool, Automation Anywhere, AWS Inferentia and AWS SageMaker

- Rebuilt the DE/EN cards around concrete audio, automation and AWS accelerator/ML workflows, current boundaries, governance/cost considerations, verified internal alternatives, and FAQs; preserved the existing editorial illustrations.
- All four cards passed their source-gate checks. They remain in the 100-card accumulation batch; no shared CSS, generators, generated files, commit, push or deploy were performed.

## 2026-07-13 - Tool-card quality campaign, Axure RP, Azure Synapse Analytics, Baidu AI Search and Balsamiq

- Rebuilt the DE/EN cards around concrete design, analytics, search and wireframing workflows, current boundaries, governance/cost considerations, verified internal alternatives, and FAQs; preserved the existing editorial illustrations.
- All four cards passed their source-gate checks; Axure's isolated verify was content-green but lacked `site/node_modules/sharp`. These cards remain in the 100-card accumulation batch; no shared CSS, generators, generated files, commit, push or deploy were performed.

## 2026-07-14 - Tool-card quality campaign, BambooHR, BeautyCam, Bitmoji and Bitwig Studio

- Rebuilt the DE/EN cards around concrete HR, photo-editing, avatar and music-production workflows, current boundaries, governance/cost considerations, verified internal alternatives, and FAQs; preserved the existing editorial illustrations.
- All four cards passed their source-gate checks. They remain in the 100-card accumulation batch; no shared CSS, generators, generated files, commit, push or deploy were performed.

## 2026-07-14 - Tool-card quality campaign, Blue Prism, Boomerang for Gmail, Botpress and Botsify

- Rebuilt the DE/EN cards around concrete automation, email, chatbot-building and conversational-AI workflows, current boundaries, governance/cost considerations, verified internal alternatives, and FAQs; preserved the existing editorial illustrations.
- All four cards passed their source-gate checks; Blue Prism's isolated verify was content-green but lacked `site/node_modules/sharp`. These cards remain in the 100-card accumulation batch; no shared CSS, generators, generated files, commit, push or deploy were performed.

## 2026-07-14 - Tool-card quality campaign, Brainly, Brainscape, BriefCam and Caffe

- Rebuilt the DE/EN cards around concrete learning, visual-security, computer-vision and ML-framework workflows, current boundaries, governance/cost considerations, verified internal alternatives, and FAQs; preserved the existing editorial illustrations.
- Editorial and EN checks passed. Brainscape, BriefCam and Caffe had the isolated-worktree `site/node_modules/sharp` limitation during verify; no workaround or generated files were introduced. These cards remain in the 100-card accumulation batch.

## 2026-07-14 - Tool-card quality campaign, Calendly, Candy Network, Certify and Chatfuel

- Rebuilt the DE/EN cards around concrete scheduling, companion-AI, expense-management and chatbot workflows, current product boundaries, governance/cost considerations, verified internal alternatives, and FAQs; preserved the existing editorial illustrations.
- All four cards passed their source-gate checks. These cards remain in the 100-card accumulation batch; no shared CSS, generators, generated files, commit, push or deploy were performed.
## 2026-07-14 - Tool-card quality campaign, ChoiceScript, Cisco Webex, Clarifai Video Recognition and Clarifai

- Rebuilt the DE/EN cards around concrete interactive-fiction, collaboration, video-recognition and AI-platform workflows, current boundaries, governance/cost considerations, verified internal alternatives, and FAQs; preserved the existing editorial illustrations.
- All four cards remain in the 100-card accumulation batch; no shared CSS, generators, generated files, commit, push or deploy were performed.
## 2026-07-14 - Tool-card quality campaign, Cleanvoice AI, Clearscope, ClickHouse Cloud and ClickUp

- Rebuilt the DE/EN cards around concrete audio cleanup, SEO/content optimization, analytical database and project-management workflows, current boundaries, governance/cost considerations, verified internal alternatives, and FAQs; preserved the existing editorial illustrations.
- These four cards complete the 100-card accumulation batch. No shared CSS, generators, or generated files were changed.
## 2026-07-14 - Coda full bilingual tool-card editorial pass

- Rewrote the single `coda` tool card in DE and EN from primary-source checks of Coda help, pricing/billing, security/trust, limits, Packs, AI, Automations, and the July 2026 Superhuman Docs naming update.
- Added a concrete implementation workflow, operating limits, export and ownership guidance, data/security governance, maker-based cost structure, editorial assessment, five internal alternatives, and six practical FAQs in each language.
- Preserved the existing single `coda-editorial.webp` illustration and refreshed only the two coda lastmod entries.

## 2026-07-14 - CodePen full bilingual tool-card editorial pass

- Rewrote the DE/EN cards around CodePen's documented Pens, Projects, collaboration, privacy modes, public-code licensing, editor limits, export workflow, and current pricing structure.
- Added a concrete prototype-to-handover workflow, quality criteria, security/governance guidance, editorial assessment, five verified internal alternatives, and five practical FAQs in each language.
- Preserved the existing single `codepen-editorial.webp` illustration and refreshed only the two CodePen lastmod entries.

## 2026-07-14 - CodeSandbox full bilingual tool-card editorial pass

- Rewrote the DE/EN cards around Browser Sandboxes, Devboxes/VM environments, Sandpack, the CodeSandbox SDK, GitHub review workflows, operational limits, security governance, and usage-based cost structure using official CodeSandbox sources.
- Added a concrete prototype-to-handover workflow, quality checks, editorial assessment, five verified internal alternatives, and five practical FAQs in each language.
- Preserved the existing single `codesandbox-editorial.webp` illustration and refreshed only the two CodeSandbox lastmod entries; no shared files, generators, registries, or other cards were changed.

## 2026-07-14 - Confluent Platform full bilingual tool-card editorial pass

- Rewrote the DE/EN cards around self-managed Apache Kafka distribution, Kafka Connect, Schema Registry, stream processing, operations, security/governance, recovery testing, and total-cost structure using official Confluent sources.
- Added a concrete rollout workflow, editorial assessment, five verified internal alternatives, and five practical FAQs in each language.
- Preserved the existing single `confluent-platform-editorial.webp` illustration and refreshed only the two Confluent Platform lastmod entries.

## 2026-07-14 - ContentStudio full bilingual tool-card editorial pass

- Rewrote the DE/EN cards around ContentStudio Publisher, Planner, AI Studio, RSS/Evergreen/Bulk automations, approvals, analytics, operations, governance, current pricing structure, and documented product boundaries.
- Added a concrete rollout workflow, evaluation criteria, editorial assessment, five verified internal alternatives, and five practical FAQs in each language.
- Preserved the existing single `contentstudio-editorial.webp` illustration and refreshed only the two ContentStudio lastmod entries.

## 2026-07-14 - Coursera full bilingual tool-card editorial pass

- Rewrote the DE/EN cards around Coursera's current course, Guided Project, Professional Certificate, Specialization, degree, AI Coach, and Coursera for Business boundaries using official Coursera product, pricing, privacy, and security sources.
- Added a concrete learning and team rollout workflow, evaluation criteria, operational ownership, governance and data guidance, variable cost structure, five verified internal alternatives, and five practical FAQs in both languages.
- Preserved the existing single `coursera-editorial.webp` illustration and refreshed only the two Coursera lastmod entries.

## 2026-07-14 - Deep Image full bilingual tool-card editorial pass

- Rewrote the DE/EN cards around Deep Image's documented enhancement, upscaling, API, async jobs, storage integrations, credit model, 40-day gallery retention, and provider privacy boundaries.
- Added a concrete image-processing workflow, evaluation criteria, security/governance guidance, editorial assessment, five verified internal alternatives, and five practical FAQs in both languages.
- Preserved the existing single `deep-image-editorial.webp` illustration and refreshed only the two Deep Image lastmod entries.

## 2026-07-14 - Deepfake full bilingual tool-card editorial pass

- Rewrote the DE/EN cards as a fact-checked, responsible-use guide to the deepfake technology category, explicitly documenting that the current official URL redirects to an 18+ platform rather than confirming a general production editor.
- Added a practical consent-to-release workflow, quality evaluation, governance, privacy, cost boundaries, editorial assessment, five verified internal alternatives, and five practical FAQs in both languages.
- Preserved the existing single `deepfake-editorial.webp` illustration and refreshed only the two deepfake lastmod entries.
## 2026-07-14 - Tool-card quality campaign, Discord

- Rebuilt the DE/EN card around Discord's server, channel, role, onboarding, app, moderation, and voice/video workflow, with explicit boundaries around project records and sensitive data.
- Added verified internal alternatives and practical FAQs, preserved the existing `discord-editorial.webp` illustration, and recorded the current pricing/privacy caveats without inventing fixed prices or limits.
## 2026-07-14 - Dollify.AI tool-card editorial rewrite

- Rewrote the DE/EN `dollify` cards from the obsolete mobile-avatar description to the current official Dollify.AI web studio for multi-model image and video generation.
- Grounded workflow, credit pricing, privacy, third-party processing, user-content licensing, and output-review guidance in the official site, pricing page, Privacy Policy, Terms, and model pages.
- Added five validated internal alternatives and five practical FAQs per language; retained the existing `dollify-editorial.webp` illustration in both cards.

## 2026-07-14 - Integrated editorial, illustration and Umami batch

- Integrated the completed OptiPlex editorial pass for 20 bilingual tool cards: CockroachDB, Coda, CodePen, CodeSandbox, Conceptboard, Confluent Platform, Connected Papers, ContentStudio, Coursera, Darktable, Databricks, DataCamp, Datadog, Deep Image, Deepfake, DesignEvo, Dialogflow, Dimensions, Discord and Dollify.AI.
- Added 20 distinct 1280x720 WebP editorial illustrations generated with Codex built-in image generation via the ChatGPT subscription, with one figure in each DE/EN card: Adobe Podcast, Airbyte, Amazon Aurora, Amazon MSK, Apache Beam, Apigee, Are.na, Avid Media Composer, Avigilon Control Center, AWS Bedrock, AWS Lambda, Axis Camera Station, Azure Functions, Blockly, Breezy HR, Brevo, Bruno, Carbon Black, Cisco Contact Center and Code.org. The batch is recorded in the illustration registry and its implementation manifest.
- Connected existing editorial WebP assets that had been present on disk but missing from one or both localized cards: 67 slugs and 75 Markdown files. A post-integration audit requires exactly one matching image reference in both language variants for every active paired card with an existing asset.
- Preserved the human-edited bodies while carrying forward only the latest `popularity` values for 42 DE cards from the divergent `autobot` Umami sync commit `8a25b89b`.

## 2026-07-15 - Tool detail runtime preview migration

- Added one shared tool public-state helper and exact 1228/1228 DE/EN reconcile, D1 schema v2 with atomic paired delta publishing and reversible route states, and one shared DE/EN detail view model.
- Added canonical and noindex preview runtime detail routes, revision-aware cache keys/headers, content-addressed WebP projection with R2-first/hash-verified Pages fallback, and a reproducible complete local D1 importer.
- Automated live/static/runtime parity now covers canonical, hreflang, robots/googlebot, JSON-LD, machine alternates, alternatives, Ratgeber backlinks, images, links, 390px/1440px overflow and cache MISS/HIT. Full local results: 2456 route responses and 10,754 resources with zero failures.
- Added a committed 20-slug production cohort and a default-off independent Pages proxy with tool-only kill switch and static fail-open tests. No push or production deploy was performed because the current credential does not own the configured production D1/Worker and the live Worker returns 404 for tool routes.

## 2026-07-16 - Complete tool runtime production migration

- Enforced a permanent 500-request live ledger with local-full, production-canary and production-delta contracts; every production entry point rejects live `--all`.
- Added runtime DE/EN tool catalogs, detail JSON/Markdown, homepage, Tool Index, categories and tags; added monotonic collection revisions and metadata-only shell caching.
- Normal builds now produced 1,053 pages in 9.80 seconds and zero tool-detail HTML/JSON/Markdown artifacts while the immutable frozen fallback remains reproducible.
- Added the paired atomic delta release wrapper with source/public-state guards, source/asset hash verification, route-state operations, changed-canonical IndexNow and no Astro/dist mutation for text-only releases.
- Applied D1 migration `0006`; deployed Worker `585af87a-af2c-40cc-a13c-f20cb3e02cf0` and Pages `2e3addbc-c918-419b-bf2a-a23e2ac22f35`.
- Production verification passed the exact 48-route detail canary, 24 unique machine routes, corrected shell category/tag retry, compact 114-URL sitemap contracts and byte-identical robots. The first shell mismatch was rolled back automatically, fixed locally, redeployed and retested.
- R2 was not enabled in the owning account, so the production binding remains absent and hash-verified Pages/frozen assets stay active. No credential or billing state was changed.

## 2026-07-16 - Local-only post-migration hardening

- Removed the unreferenced legacy `test_tool_route_entries` script and note; they described normal static tool-detail generation that no longer exists and did not cover the frozen fallback contract.
- Made the real postbuild guard fixture-testable. Normal shell builds now have regression coverage that rejects any emitted tool-detail HTML/JSON/Markdown artifact, while frozen builds require all six localized artifacts per active slug.
- Added a bounded one-card `release:tool-runtime` dry-run regression using the `dell-boomi` pair. It fingerprints `content/` and `site/dist`, reports `astroBuild: false` and `distUnchanged: true`, and creates no release output or ledger entry; after the illustration batch it also covers the R2 asset plan without issuing a live request.
- The normal local build completed in 7.21 seconds with 1,053 pages, zero static tool-detail/mirror artifacts, and unchanged compact 114-URL Google/Bing/focus sitemaps.
- One local-full capture covered all 2,456 DE/EN routes. Its final comparator exposed one German meta-description dash-cleaning regression; the locale-specific frozen-static behavior was restored and regression-tested. A targeted local Worker render of the affected Azure Text to Speech route brought the saved 2,456-record comparison to zero errors without repeating the exhaustive capture.
- Clarified runbook paths passed through `npm --prefix site`: evidence and ledger arguments now use explicit repository-root `$PWD` paths, preventing accidental `site/site/...` resolution.
- This hardening turn made no production, remote D1/KV/R2, IndexNow, deploy or push request.

## 2026-07-16 - R2 tool asset storage enabled

- Activated Cloudflare R2 after explicit account-owner approval; the subscription starts at `$0/month` with usage-based overages beyond the included allowance.
- Created Standard bucket `utildesk-tool-assets` in `WEUR` and added production Worker binding `TOOL_ASSETS`.
- Deployed Worker version `ebdbb3c0-23d8-4a51-907d-c36df1625f51`; Pages was not rebuilt or redeployed.
- Uploaded one content-addressed ChatGPT proof object. Upload/download and direct Worker delivery matched SHA-256 `7137d1d1776dfb0df9bae5fde01ad1b4b85ea711ed102d25c1356efa69d8ce3f`; the response was `200 image/webp`, immutable and marked `X-Utildesk-Asset-Source: r2`.
- No historical bulk migration or broad production crawl ran. The 1,146 historical objects remain on the verified Pages/frozen fallback until changed naturally.

## 2026-07-16 - Next 10 tool-card illustrations

- Added one distinct 1280x720 WebP editorial illustration to both DE and EN cards for Crisp, Dell Boomi, FLYR, Google Search Console, Microsoft Azure API Management, Playwright, PostgreSQL, Puppeteer, Python and Ren'Py.
- Generated the artwork with Codex built-in image generation through the ChatGPT subscription, without Gemini or API-key usage; all ten final scenes use different visual directions and contain no logos, readable UI text or watermarks.
- Registered the batch for future duplicate exclusion and refreshed only the 20 affected content-lastmod entries. Production publication uses the bounded D1/R2 delta workflow and does not rebuild Astro or Pages.
- Released the 20 localized entries from source commit `e19b950c`: D1 source-hash verification passed for all rows, ten content-addressed objects were served from `utildesk-tool-assets`, the 70-request production delta gate passed without failures, and both IndexNow endpoints accepted all 20 canonical URLs. `site/dist` remained unchanged and 72 active paired cards remain without illustrations.
## 2026-07-17 - Full editorial cleanup of remaining flagged tool cards

- Processed the deterministic strict-audit queue of 585 flagged active tool slugs in DE and EN; clean cards and illustrations were left untouched.
- Added or completed editorial assessment, verdict, practical workflow context, limitations, governance and cost criteria, localized FAQ coverage, internal alternatives, descriptions and reviewed metadata while preserving official URLs, popularity and existing images.
- Updated only the 1,170 corresponding content-lastmod entries. Local strict audit finished at 1,228 scanned, 0 flagged, 1,228 clean; English translation and editorial template checks passed.
- Per-card inspect and verify completed for all 585 slugs. Two legacy image geometry findings (branchtrack and ableton-live) remain guard warnings because their existing WebP illustrations were explicitly out of scope for modification; no image files were changed.
- No production deployment, Cloudflare request, push, IndexNow submission or Astro/Pages build was performed in this local editorial pass.
