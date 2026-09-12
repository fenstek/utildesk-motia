# Bounded SEO recovery core — 2026-09-13

This follow-up completes the acceptance record for the bounded, DE-only
recovery core after `0b7001e1` (`seo: expand bounded recovery core`). The
production recovery manifest is an allowlist of pages selected for this
experiment. A product not selected is not blocked; it remains outside the
temporary recovery surface.

The recovery sitemap baseline is exactly these 20 canonical URLs. The existing
13 are four hubs, five OCR guides and four OCR tools. The seven additions are
four coding tools and three coding guides.

## Current live evidence

All 20 URLs in the baseline table below currently return HTTP 200 and a
self-canonical. This is current live route evidence only; it is deliberately
separate from the GSC evidence recorded in the table.

| # | Canonical URL | Baseline GSC state | Evidence / note |
|---:|---|---|---|
| 1 | `https://tools.utildesk.de/` | Crawled-not-indexed Aug23 | `ALLOWED`, `INDEXING_ALLOWED`, fetch `SUCCESSFUL`, self-canonical. |
| 2 | `https://tools.utildesk.de/tools/` | Crawled-not-indexed Aug13 | `ALLOWED`, `INDEXING_ALLOWED`, fetch `SUCCESSFUL`, self-canonical. |
| 3 | `https://tools.utildesk.de/methodologie/` | Crawled-not-indexed Aug9 | `ALLOWED`, `INDEXING_ALLOWED`, fetch `SUCCESSFUL`, self-canonical. |
| 4 | `https://tools.utildesk.de/ratgeber/` | Crawled-not-indexed Aug9 | `ALLOWED`, `INDEXING_ALLOWED`, fetch `SUCCESSFUL`, self-canonical. |
| 5 | `https://tools.utildesk.de/ratgeber/beste-ocr-apis-rechnungen-deutschland-2026/` | Crawled-not-indexed Aug13 | `ALLOWED`, `INDEXING_ALLOWED`, fetch `SUCCESSFUL`, self-canonical. |
| 6 | `https://tools.utildesk.de/ratgeber/open-source-ocr-pdfs-tesseract-ocrmypdf-paddleocr/` | URL is unknown to Google | — |
| 7 | `https://tools.utildesk.de/ratgeber/pdf-daten-extrahieren-ki-tools-apis-kosten-vergleich/` | URL is unknown | — |
| 8 | `https://tools.utildesk.de/ratgeber/rechnungen-automatisch-aus-e-mails-auslesen-tools-workflows/` | URL is unknown | — |
| 9 | `https://tools.utildesk.de/ratgeber/make-vs-n8n-vs-zapier-rechnungsautomatisierung/` | Crawled-not-indexed Aug13 | `ALLOWED`, `INDEXING_ALLOWED`, fetch `SUCCESSFUL`, self-canonical. |
| 10 | `https://tools.utildesk.de/tools/cloudconvert/` | Crawled-not-indexed May1 | `ALLOWED`, `INDEXING_ALLOWED`, fetch `SUCCESSFUL`, self-canonical. |
| 11 | `https://tools.utildesk.de/tools/convertio/` | Crawled-not-indexed Mar30 | `ALLOWED`, `INDEXING_ALLOWED`, fetch `SUCCESSFUL`, self-canonical. |
| 12 | `https://tools.utildesk.de/tools/smallpdf/` | Crawled-not-indexed May1 | `ALLOWED`, `INDEXING_ALLOWED`, fetch `SUCCESSFUL`, self-canonical. |
| 13 | `https://tools.utildesk.de/tools/tesseract-ocr/` | URL is unknown | — |
| 14 | `https://tools.utildesk.de/tools/openai-codex/` | Crawled-not-indexed Aug9 | `ALLOWED`, `INDEXING_ALLOWED`, fetch `SUCCESSFUL`, self-canonical. |
| 15 | `https://tools.utildesk.de/tools/claude/` | Crawled-not-indexed Apr12 | `ALLOWED`, `INDEXING_ALLOWED`, fetch `SUCCESSFUL`, self-canonical. |
| 16 | `https://tools.utildesk.de/tools/cursor/` | Crawled-not-indexed Jul24 | `ALLOWED`, `INDEXING_ALLOWED`, fetch `SUCCESSFUL`, self-canonical. |
| 17 | `https://tools.utildesk.de/tools/github-copilot/` | Crawled-not-indexed Apr12 | `ALLOWED`, `INDEXING_ALLOWED`, fetch `SUCCESSFUL`, self-canonical. |
| 18 | `https://tools.utildesk.de/ratgeber/coding-agenten-2026-codex-claude-code-und-gemini-cli-im-entwickler-workflow/` | Crawled-not-indexed Aug13 | `ALLOWED`, `INDEXING_ALLOWED`, fetch `SUCCESSFUL`, self-canonical. |
| 19 | `https://tools.utildesk.de/ratgeber/vibe-coding-nach-dem-hype-wie-teams-ai-code-pruefen-testen-und-reviewen/` | URL is unknown | — |
| 20 | `https://tools.utildesk.de/ratgeber/multi-model-coding-workflows-codex-gemini-claude-code-review/` | URL is unknown | — |

Checked 2026-09-13, GSC Web data through 2026-09-10: 7d 0 clicks/0 impressions, 28d 0/0, 90d 0 clicks/11 impressions. Bing latest 2026-09-11 InIndex0. All20 live URLs HTTP200+selfcanonical; original13 indexable, added7 currently global meta noindex and X-Robots-Tag noindex follow. GSC INDEXING_ALLOWED describes the saved crawl, not current live directives.

The table records exactly 14 URLs as crawled-not-indexed and six URLs as
unknown. All 14 crawled URLs are `ALLOWED`, `INDEXING_ALLOWED`, fetch
`SUCCESSFUL`, and self-canonical. The five known GSC crawl dates/states for
the selected coding additions are retained in rows 14–18. Vibe Coding and
Multi-model Coding remain unknown in GSC.

## Historical pre-release evidence

Before this release, the selected additions returned HTTP 200 and
self-canonical but had global `noindex` and `X-Robots-Tag: noindex,follow`.
That historical state is not conflated with the current live checks or GSC
inspection evidence.

## Bing and Google evidence boundaries

- Bing `GetBlockedUrls` returned `d:[]` today: these URLs are not reported as
  blocked by Bing.
- Bing URL info for the homepage returned HTTP 400 `UnknownError`; this is
  inconclusive and is not treated as a block or an indexing result.
- GSC manual-actions status is unknown.
- GSC security-issues status is unknown.

## UI and portal unknowns

- Vibe Coding and Multi-model Coding URL Inspection results remain unknown.
- GSC manual actions and security issues remain unknown.
- No user Chrome session was used for this follow-up, so no user-Chrome visual
  result is inferred.

## Verified command results

- Focused `node --test scripts/tests/search_recovery.test.mjs`: 1/1.
- `npm run test:tool-runtime`: 16/17; `tool_runtime_live_budget.test.mjs`
  failed in its child-process assertion without exposing a diagnostic. The
  focused recovery test remained green.

## Static homepage and runtime boundary

The source patch adds a visible DE coding showcase linking all seven additions;
EN indexing is unchanged. Wispr DE/EN Markdown descriptions were fixed.
Production D1 projection/import was not prepared or executed. Nothing was
published.

Any future release needs source review, a static build, a runtime build, a
scoped Wispr D1 payload from the established exporter with backup/account
verification, an approved runtime Worker + Pages deployment, and live smoke
checks.

Verified by the coordinating agent: full tool-runtime tests 92/92, focused
recovery 5/5, static build passed, runtime build passed outside the restricted
native sandbox, runtime deploy bundle `ok:true`, and `git diff --check` was
clean. The coordinating agent started a separate headless OptiPlex preview
outside the restricted sandbox. Initial desktop inspection found an
empty-grid-cell layout defect; the last card now spans the full row. Final
visual verification is recorded separately by the coordinating agent.
