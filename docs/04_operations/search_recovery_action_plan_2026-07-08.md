# Utildesk Search Recovery Action Plan - 2026-07-08

## Context

This plan captures the July 2026 Gemini Pro strategy discussion and the project-specific guardrails for `tools.utildesk.de`.

The goal is to recover real impressions, visits, and useful referral/search traffic without broad sitemap expansion, domain migration, paid-ad dependency, personal-data outreach, or search-guideline violations.

## Strategic Decision

Primary 30-day focus: **100 perfect focus URLs plus deep Ratgeber clusters**.

The recovery surface is intentionally narrow:

- homepage and core index pages;
- Ratgeber archive and strong Ratgeber articles in German and English;
- category/methodology/hub pages that support those articles;
- only the strongest manually edited tool cards that are internally linked from Ratgeber clusters.

Do not make the site look like a mass AI-directory by pushing all long-tail tool pages into Google/Bing.

## Hard Guardrails

- Do not change the domain. Keep building trust for `tools.utildesk.de`.
- Do not reintroduce a broad sitemap.
- Do not advertise `sitemap-focus.xml` or `sitemap-bing.xml` in `robots.txt`.
- Do not globally `noindex` long-tail tool pages merely because Google staging excludes them.
- Keep the existing split: Google-facing focus sitemap plus optional Googlebot-specific staging, while Bing must not be harmed by global noindex.
- Do not mass-edit 1100+ tool cards as the primary SEO move.
- Do not buy cheap backlinks.
- Do not publish weak single-tool Ratgeber articles.
- Do not expose private personal data in outreach or third-party submissions.

## 48-Hour Execution Plan

1. Verify the live focus sitemap set.
   - Fetch `https://tools.utildesk.de/sitemap.xml`.
   - Fetch `https://tools.utildesk.de/sitemap-focus.xml`.
   - Confirm URL counts match the current compact search strategy.
   - Confirm no machine endpoints, redirects, 404s, or disabled/weak noindex pages are included.

2. Crawl every focus URL.
   - Require HTTP `200`.
   - Require self-canonical or an intentional canonical match.
   - Require no global robots noindex.
   - Require no `X-Robots-Tag: noindex` on HTML pages.
   - Record title, canonical, robots, googlebot robots, hreflang, content length, and status.

3. Separate allowed policy from real problems.
   - `googlebot: noindex` is acceptable only for pages intentionally excluded from Google staging and not present in the Google sitemap.
   - Any URL present in `sitemap.xml` must not have global noindex or Googlebot noindex.
   - Machine endpoints may stay fetchable with `X-Robots-Tag: noindex`.

4. Re-submit freshness only after live verification.
   - Google Search Console: submit `https://tools.utildesk.de/sitemap.xml`.
   - Bing Webmaster: submit `https://tools.utildesk.de/sitemap-focus.xml`.
   - IndexNow: submit the verified focus canonical HTML URLs.

## 14-Day Execution Plan

1. Pick 2-3 Ratgeber clusters as the growth spine.
   - Agent productivity / real workflow savings.
   - Local or private AI agents.
   - Agentic commerce / AI-ready checkout.
   - AI-search visibility / agentic traffic.

2. For each cluster, create a closed internal-link loop.
   - Ratgeber article links to 5-8 strong tool cards.
   - Tool cards link back to the relevant guide with a small "mentioned in Ratgeber" block.
   - Category/hub pages link to the guide and the strongest tool cards.

3. Update only high-leverage tool cards.
   - Prioritize tools that are mentioned in Ratgeber articles.
   - Prioritize tools with good real-world demand, recent product movement, and strong internal-link role.
   - Do not start broad editorial batches as the first recovery move.

4. Package distribution around the articles, not around the directory.
   - GitHub resource PRs only where the guide genuinely solves a developer problem.
   - German/European AI/dev newsletters with a compact editorial angle.
   - Vendor notifications for tools with strong cards, using only non-personal project identity.

## 30-Day Measurement Dashboard

Track these signals weekly:

- Google Search Console:
  - focus sitemap status;
  - impressions for Ratgeber long-tail queries;
  - `Submitted URL marked noindex`;
  - `Crawled - currently not indexed`;
  - representative URL Inspection for homepage, Ratgeber archive, 2 articles, 2 tool cards.
- Bing Webmaster:
  - focus feed status and URL count;
  - crawl summary;
  - IndexNow/feed submission success;
  - indexed URL count when available.
- Umami:
  - organic/referral sessions;
  - Ratgeber scroll depth;
  - outbound tool-link clicks;
  - entry pages and country/language mix.
- Server/CDN logs if available:
  - Googlebot/Bingbot hits on focus URLs;
  - whether bots waste crawl on non-focus long-tail.

Early success after 7 days:

- focus sitemap has no new technical conflicts;
- bots crawl verified focus URLs;
- no growth in submitted/noindex errors for focus URLs.

Early success after 14 days:

- first or increased impressions on long-tail Ratgeber queries;
- Bing feed remains successful;
- Umami shows at least some non-direct entries to Ratgeber pages.

Success after 30 days:

- stable impressions and a small but real organic/referral traffic base;
- Ratgeber pages become the main discovery surface;
- internal tool-card clicks prove that articles send users deeper into the catalogue.

## Codex-Specific Risks

- Do not turn this into a generic "SEO checklist" exercise.
- Do not implement Gemini's global long-tail noindex suggestion; it conflicts with the Utildesk search contract.
- Do not generate shallow Ratgeber content to hit cadence.
- Do not create tag-page or thin-hub explosions.
- Do not confuse the physical OptiPlex NotebookLM contour with the headless `opcl` newsman contour.

## Current First Task

Run a fresh live audit of the compact focus sitemap and produce a concrete issue list before making code changes.
