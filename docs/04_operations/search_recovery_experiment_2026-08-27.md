# Search recovery experiment — 2026-08-27

## Scope and evidence

This is a reversible 6–8 week experiment for `tools.utildesk.de`. The
technical access path is healthy, while search demand is not: the supplied
baseline is 315 impressions / 3 clicks in GSC over 180 days, 0 impressions in
the last 7 days, and 178 submitted / 0 indexed sitemap URLs. Bing reports a
successful feed, `latestInIndex = 0`, almost no crawl errors, and 0 recognized
backlinks. No credentials or secret values are recorded here.

We do not change the domain or IP: robots access, canonical delivery, sitemap
fetching and crawl infrastructure are healthy, and a move would destroy
continuity while adding no evidence-backed remedy.

## Deliberately narrow proof cluster

The recovery sitemap contains exactly 20 URLs: the original 13 URLs below plus
the seven approved coding-core URLs listed after them.

- `https://tools.utildesk.de/`
- `https://tools.utildesk.de/tools/`
- `https://tools.utildesk.de/methodologie/`
- `https://tools.utildesk.de/ratgeber/`
- `https://tools.utildesk.de/ratgeber/beste-ocr-apis-rechnungen-deutschland-2026/`
- `https://tools.utildesk.de/ratgeber/open-source-ocr-pdfs-tesseract-ocrmypdf-paddleocr/`
- `https://tools.utildesk.de/ratgeber/pdf-daten-extrahieren-ki-tools-apis-kosten-vergleich/`
- `https://tools.utildesk.de/ratgeber/rechnungen-automatisch-aus-e-mails-auslesen-tools-workflows/`
- `https://tools.utildesk.de/ratgeber/make-vs-n8n-vs-zapier-rechnungsautomatisierung/`
- `https://tools.utildesk.de/tools/cloudconvert/`
- `https://tools.utildesk.de/tools/convertio/`
- `https://tools.utildesk.de/tools/smallpdf/`
- `https://tools.utildesk.de/tools/tesseract-ocr/`
- `https://tools.utildesk.de/tools/openai-codex/`
- `https://tools.utildesk.de/tools/claude/`
- `https://tools.utildesk.de/tools/cursor/`
- `https://tools.utildesk.de/tools/github-copilot/`
- `https://tools.utildesk.de/ratgeber/coding-agenten-2026-codex-claude-code-und-gemini-cli-im-entwickler-workflow/`
- `https://tools.utildesk.de/ratgeber/vibe-coding-nach-dem-hype-wie-teams-ai-code-pruefen-testen-und-reviewen/`
- `https://tools.utildesk.de/ratgeber/multi-model-coding-workflows-codex-gemini-claude-code-review/`

Requested tool slugs absent from source and therefore excluded: `abbyy-vantage`,
`mistral-ocr`, `ocrmypdf`, `paddleocr`.

`site/shared/recoveryManifest.mjs` is the single allowlist consumed by static
robots policy, sitemap generation and edge middleware. `sitemap.xml`,
`sitemap-focus.xml` and `sitemap-bing.xml` are intentionally identical. Tags
remain routable, but tag archives and tag links are removed from the primary
homepage/catalog graph and are not in recovery sitemaps. `opencode`, `qodo`,
`mem0` and `openclaw` are explicitly excluded.

## Switch and rollback

The switch is `SEARCH_RECOVERY_MODE = true` in
`site/src/lib/searchIndexPolicy.mjs`. To roll back, set it to `false` and
restore the previous proof lists / focus list in that file and
`site/src/lib/searchFocus.mjs`, then rebuild and deploy. The sitemap generator
returns to its pre-experiment compact behavior when the mode is false.

Unlike the previous Googlebot-only staging, recovery uses global
`noindex,follow` for every non-proof tool and every non-proof/EN page. This is
intentional: all crawlers receive one unambiguous temporary surface while the
experiment runs.

## Measurement

At day 14, check GSC sitemap submitted/indexed, URL Inspection for all hubs,
the five guides and four tools, impressions/clicks, canonical and last crawl.
Check Bing feed status, indexed count, crawl errors and feed URL count. Check
Umami organic/search landing sessions and conversions without exposing user
data. Repeat at weeks 6–8 and compare against the baseline.

Do not mass-publish, mass-resubmit, or manually submit every page. Only submit
the compact sitemap and, where supported, changed canonical URLs with a real
content change.
