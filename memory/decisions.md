# Decisions

## 2026-04-21

## 2026-04-22

- Treat `fa1c42d11a995127f3be253eb94477252e4c79ff` as the current good backup baseline for the repo and the live site state.
- Keep only one tracked markdown doc for the alternatives-render audit script: `scripts/audit_alternatives_render.md`.
- Do not keep case-only duplicate paths for the same document in git; Windows checkouts cannot represent them cleanly.
- Treat live sitemap hygiene as the first-line technical explanation for large GSC indexing error clusters on `tools.utildesk.de`.
- Keep alias redirects, but do not keep the same alias slugs as active published tool pages.
- Reserved route namespaces under `/tools/` (currently `tag`) must never be emitted as tool URLs in sitemap.
- Keep `origin/autobot` and `origin/master` aligned after manual releases; branch drift is an operational risk for tools publishing.
- `scripts/sync_autobot_to_master_ff.sh` must push from the remote-tracking ref, not assume a local `autobot` branch exists.

- `Ratgeber` publish закреплён как отдельный ручной flow поверх approved package с `opcl`, а не как часть `tools` cron.
- `scripts/cron_publish_push.sh` считать намеренно ограниченным `tools`-only publisher; его allowlist не ослаблять ради статей.
- Для import approved article package использовать `scripts/import_ratgeber_package.py`.
- Для manual article release использовать отдельный чистый checkout или worktree от свежего `origin/master`.
- `Ratgeber` hero covers must use the same lightbox contract as article inline images.
- `Ratgeber` cover rendering must respect the generated image's natural aspect ratio; do not force editorial SVG covers into a generic wide frame.
- Standalone inline article images in `ratgeber` should be rendered as dedicated figure blocks with explicit vertical spacing, not as naked markdown image paragraphs.
- If an article ships both `cover` and `workflow` editorial SVGs, the page renderer should avoid adding a second heavy frame around the artwork; the generated assets already carry their own composition.
- Hero cover SVGs should use a dense composition with minimal neutral border space, so the published page can render them large without creating a "small picture inside a big frame" effect.
- Treat AI retrieval as a first-class site contract, not as an afterthought:
  - keep `llms.txt`, `llms-full.txt`, feeds, catalogs, and page-level mirrors in the production codebase.
- Prefer the canonical trio for machine access to content:
  - human-facing HTML page
  - page-level JSON detail endpoint
  - page-level Markdown mirror
- Keep non-HTML agent endpoints crawlable but out of normal search result indexing via `X-Robots-Tag: noindex`.
- Do not rely on `process.cwd()/content` in the Astro app; use the shared content-root resolver so Windows pointer-file checkouts build the same as symlinked environments.
- Do not declare a fake `SearchAction` schema unless the public site exposes a stable query-parameter search contract that works server-side.
- Keep Bing Webmaster credentials local-only and git-ignored; never store the raw API key in repo-tracked files.
- Prefer a local env-file plus helper script for Bing operations instead of browser-only workflows.
- Treat Bing API coverage as partial compared to GSC: automate quota/submission/feed operations, but assume URL Inspection remains manual unless Microsoft exposes a public API later.
- For `tools.utildesk.de`, treat Bing crawl health as primarily a live-site contract check:
  - verify sitemap/feed state in Bing;
  - verify machine endpoints are fetchable but `noindex`;
  - verify canonical HTML pages stay indexable.
- Do not rely on Astro endpoint response headers alone for `X-Robots-Tag` on Cloudflare Pages machine endpoints.
- Enforce `X-Robots-Tag: noindex` for `/feed.*`, `/llms*.txt`, `/api/*`, and `/markdown/*` at the edge through `site/functions/`, with `_headers` kept only as a fallback/static declaration.
- After manual SEO or article releases, re-align `origin/autobot` to `origin/master` so the tools publishing branch does not drift behind production.
- Treat IndexNow as a first-class freshness signal alongside sitemap submission for `tools.utildesk.de`.
- Keep the IndexNow verification key public and repo-tracked at the site root; unlike Bing API credentials, it is not a secret.
- Automate IndexNow only for canonical HTML pages and only after they are live.
- Keep `ratgeber` IndexNow submission separate from the `tools` cron flow, just like the release process itself.
- Prefer dual IndexNow notification for this project:
  - submit to the global protocol endpoint for broad sharing;
  - also submit directly to Bing's own endpoint to improve Bing-side observability and reduce ambiguity in Webmaster tooling.
- Keep post-deploy freshness hooks reachable from the actual release path; do not leave IndexNow calls below early `exit 0` branches in cron automation.

## 2026-04-26

- Keep German as the default production language for `tools.utildesk.de`; publish English under `/en/`.
- English pages must use self-canonicals and reciprocal `hreflang` alternates, not canonicalize back to German.
- Treat multilingual Ratgeber publication as a package contract: autonomous publish requires both `content/ratgeber/<slug>.md` and `content/en/ratgeber/<slug>.md`.
- Keep English tool pages generated from the curated tool metadata until the sheet/backend has native English fields.
- Keep machine-readable discovery localized as well: `/en/api/*`, `/en/markdown/*`, `/en/feed.*`, `/en/llms.txt`, and `/en/llms-full.txt`.

## 2026-04-29

- Privacy rule: never submit, publish, or reuse the user's personal first name
  or surname in any project, account, outreach form, backlink submission, commit
  metadata, public profile, or third-party communication unless the user gives
  explicit permission for that exact use.
- For outreach/name fields, use only non-personal labels such as `Utildesk` or
  `Utildesk Team`. If a platform requires a real personal name, mark it blocked
  instead of guessing or copying names from legal/imprint pages.

## 2026-04-30

- For local Cloudflare diagnostics in `C:\projects\utildesk-motia`, use
  `CLOUDFLARE_API_TOKEN` from the git-ignored local `.env`.
- If the local `.env` must be restored, the approved source location is
  `C:\Users\sserg\OneDrive - JGDUS\projects\eventmanagement\.claude\worktrees\youthful-noether\.env.local`.
- Never commit or print the Cloudflare token value; store only variable names
  and source paths in tracked memory/docs.

## 2026-05-02

- A dedicated Proton mailbox may be used for our project work, including
  Utildesk affiliate registrations, verification links, vendor/platform
  communication, outreach, and operational mail.
- Credentials belong only in `secrets/proton-affiliate-webmail.env`, which is
  git-ignored. Never print, commit, or log the password.
- Browser automation may use this mailbox for project tasks, but must not
  change password, recovery data, forwarding, filters, account settings, or
  security settings.
- If a registration or reply requires tax data, payout details, personal
  identity, company identity, legal declarations, or non-project commitments,
  stop and ask before continuing.

## 2026-05-06

- Keep the search sitemap contract compact during indexing recovery:
  - Google Search Console and `robots.txt` use only `https://tools.utildesk.de/sitemap.xml`.
  - Bing should receive the same compact focus surface through `https://tools.utildesk.de/sitemap-focus.xml`; do not submit a broad long-tail sitemap.
- Do not advertise `sitemap-bing.xml` or `sitemap-focus.xml` in `robots.txt`; `robots.txt` keeps the canonical `sitemap.xml` line only.
- Long-tail tool pages excluded from Google's staged sitemap must keep generic `robots: index,follow` and receive only a Google-specific `googlebot: noindex,follow`.
- Never replace the Google-specific staging with global `noindex` unless the page is intentionally disabled or explicitly marked noindex in frontmatter.
- Treat `site/scripts/generate_sitemap.mjs`, `site/src/lib/searchIndexPolicy.mjs`, and `site/src/layouts/BaseLayout.astro` as the coupled source of truth for sitemap and robots behavior; changing one without the others risks breaking search behavior.
- Ratgeber candidates about exactly one tool are forbidden for publication review, even when the text score is 100. `tool_spotlight`, `tool_review`, `product_spotlight`, `product_review`, and titles like `Tool: Was das Tool im Alltag wirklich taugt` must be rejected before Cloudflare upload.
- Ratgeber visual quality is also a hard gate: `visual_quality.pass = false`, generic workflow fallback, placeholder/empty/raw/unrelated/cloned/debug visuals must not reach the admin review list.
- Ratgeber final artwork must not come from the local HTML/PNG fallback renderer. Final candidate uploads require an approved visual source marker such as `chatgpt_manual`, `chatgpt_web`, or `manual_approved_artwork` with `approvedForReview: true`; untagged PNG pairs and identical cover/workflow hashes are rejected.
- The live Ratgeber article factory on `opcl` has its own production copies of the sync/editor scripts. After changing local Ratgeber guardrails, update `/opt/openclaw/workspace/agent-newsman/scripts/ratgeber_cloudflare_candidate_sync.py` and the `journalist_editor.py` copies on `opcl`; do not assume a git push alone updates that runtime.
- Ratgeber topic creation is cluster-first, not release-first. The production collector is `/opt/openclaw/workspace/agent-newsman/scripts/ratgeber_topic_harvester.py`; it accumulates Habr/Hacker News/Product Hunt/local-candidate signals plus optional Perplexity enrichment into `data/article_jobs/ratgeber_topic_pool.json`, and only emits multi-source, multi-tool comparison/trend/workflow/how-to/explainer jobs.
- The old `intel_agent.py` single-release fallback must stay disabled. If no mature topic cluster exists, the correct result is no Ratgeber candidate, not a `tool_spotlight` article.
- Ratgeber admin candidates do not continuously self-improve. A candidate waits for human action; only the `Ueberarbeiten`/rework button creates a Cloudflare KV rework request. The `openclaw-ratgeber-rework-consumer` cron must then hide the old preview, process text and visual polish, and return the candidate only after real content or asset changes.
- Update the Ratgeber source rule: do not use Russian-language or Chinese-language sources, `/ru/`, `/zh/`, `/cn/`, `.ru`, `.cn`, Russian/Chinese locale URLs, Habr, or Russian corporate PR/claimed local know-how as article source material. This includes Sber/Sberbank/SberTech, Platform V, Yandex, VK, Mail.ru, Rambler, Rutube, Skolkovo, Tinkoff/T-Bank, MTS, and Kaspersky. International Russian-speaking authors are acceptable only when the source itself is English/German and independent of Russian corporate/state PR.
- Ratgeber articles must internally link every recognized tool name to its Utildesk card when the card exists. If a mentioned tool has no card, add it to the tool-candidate/Sheets review flow and keep the article mention unlinked until the card is published.

## 2026-05-11

- Remote deploy state must use GitHub `origin/master` as the source of truth, with `origin/autobot` aligned to the same commit after every manual release.
- Ubuntu-originated production changes must carry their project memory in git (`memory/recent_changes.md`, `memory/decisions.md`, or `HANDOFF.md`) so the Windows laptop can sync knowledge by fetching/pulling, not by relying on chat history.
- If the Windows main checkout is dirty, do not force-update it during remote deploy sync; update a clean production-memory mirror instead and leave local work-in-progress untouched.


## 2026-05-12

- Tool card publication rule: never publish a short/minimal "quick card" for a tool. New or repaired tool cards must use the full editorial catalogue structure, including audience fit, typical use cases, day-to-day workflow notes, key features, pros/limitations, workflow fit, privacy/data notes when relevant, pricing/costs, strong alternatives, editorial assessment, and FAQ in both German and English.
- If a tool must be published urgently from a Ratgeber mention, urgency does not lower the editorial bar. Either publish a full card or keep the item blocked until the full card is ready.
- The earlier Vyrill/Naoma AI/Hera minimal-card release is explicitly treated as a mistake to repair, not as a reusable pattern.

## 2026-05-12

- Ratgeber visual gate runtime policy: until the Ratgeber production contour has a reliable source for high-quality artistic images, do not block review-candidate upload solely because artwork is unapproved or generated by the fallback renderer. Keep the admin/human review gate responsible for deciding whether visuals are acceptable before publication.
- Keep `--allow-unapproved-visuals` on the `opcl` Cloudflare candidate sync cron for now. Remove it only after a dependable production image-generation/rework path exists in the Ratgeber contour.

## 2026-05-12

- Ratgeber image production cost policy: do not make OpenAI Images API the default production path for Ratgeber illustrations. The project should use the existing ChatGPT/Codex subscription-backed `imagegen-workflow` whenever possible, because the subscription is already paid for and should be consumed before adding API image costs.
- API-based image generation may be used only as an explicitly approved fallback or for small technical tests. The preferred architecture is: `opcl` Ratgeber pipeline creates image briefs and queue artifacts; Windows/Codex consumes those briefs with the subscription-backed imagegen workflow; generated assets are copied back as `cover.png` and `workflow.png` with approved visual metadata.

## 2026-05-13

- Ratgeber final imagery must be real compressed WebP artwork, not SVG/technical placeholders. If the user rejects a plot/style as repetitive, replace the visual concept and filenames instead of recoloring the same composition.
- Named artist references for Ratgeber visuals are allowed only as loose mood/art-direction references. Do not reproduce known compositions, signatures, or direct copies; generate legally distinct story scenes tied to the article topic.
- For live replacements, use new cache-busting filenames such as `-chagall.webp`, update both DE/EN frontmatter and inline image references, then verify the live HTML no longer points at the old assets.

## 2026-05-15

- Umami Session Replay stays disabled by default. Even though Umami v3.1.0 adds replay support, enabling it requires a separate privacy/GDPR decision and review of masking settings.
- Pin the production Umami container to an explicit version tag after upgrades (`docker.umami.is/umami-software/umami:3.1.0` as of 2026-05-15) instead of relying on floating `latest`/`postgresql-latest` tags.

## 2026-05-18 - Vendor-card SEO repair policy

- During the Google indexing recovery phase, hyperscaler/vendor pages are curated rather than mass-promoted. Ambiguous or duplicate vendor pages must not be forced into the Google sitemap.
- Canonical vendor choices from the first repair pass: keep `aws-sagemaker`, `amazon-emr`, `google-cloud-translation`, and `azure-synapse-analytics`; disable the duplicate pages `amazon-sagemaker`, `aws-emr`, `google-cloud-translation-api`, and `microsoft-azure-synapse-analytics`.
- The ambiguous `copilot` slug represents Assembly's client-portal product, not Microsoft Copilot or GitHub Copilot; keep it out of `FORCE_INDEX_TOOL_SLUGS` unless it later earns index eligibility through real traffic or manual strategy.
- Run `npm run audit:vendor` before re-enabling automatic tool-card publication.
- Disabled duplicate vendor pages must also have explicit 301 redirects in `site/public/_redirects`; otherwise old Cloudflare Pages assets can continue returning 200 even after the page is removed from the build output.

## 2026-05-21 - Compact search-recovery sitemap

- `https://tools.utildesk.de/sitemap-focus.xml` is the compact thematic sitemap for direct Bing submission during search recovery.
- Keep `robots.txt` pointing only at `https://tools.utildesk.de/sitemap.xml`. The generated `sitemap.xml`, `sitemap-bing.xml`, and `sitemap-focus.xml` should all stay compact: Ratgeber depth plus the strongest curated tool cards.
- Build the focus sitemap only from pages that are already Google-indexable: Ratgeber depth, core hubs, methodology pages, and a small curated set of AI/automation/productivity tool cards. Do not use it to sneak Googlebot-noindex long-tail pages into GSC.
