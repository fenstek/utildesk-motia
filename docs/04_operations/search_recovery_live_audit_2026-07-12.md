# Utildesk Search Recovery Live Audit - 2026-07-12

## Executive conclusion

`tools.utildesk.de` does not currently have a robots, canonical, HTTP, sitemap,
or rendering block on the compact search surface. Google and Bing can fetch the
site. The main problem is selection and trust: the site presents a compact
120-URL sitemap while its crawlable HTML graph still exposes a mass directory of
more than 3,000 generated pages.

Do not change the domain. The first recovery patch should make the crawlable
site architecture match the compact sitemap strategy, then strengthen the
closed Ratgeber clusters and earn real references to individual guides.

## Live technical audit

Audit time: `2026-07-12T00:45:01Z`.

- `robots.txt`: HTTP 200; advertises only `https://tools.utildesk.de/sitemap.xml`.
- `sitemap.xml`: HTTP 200, 120 URLs.
- `sitemap-focus.xml`: HTTP 200, 120 URLs.
- `sitemap-bing.xml`: HTTP 200, 120 URLs.
- All three sitemap URL sets are identical.
- All 120 unique focus URLs return HTTP 200 HTML.
- Focus URLs with robots, Googlebot, canonical, title, or content-type conflicts: 0.
- Median live response time during the parallel audit: 72 ms; p95: 229 ms.
- Googlebot and Bingbot user-agent checks return the same complete HTML as a
  desktop browser, without a Cloudflare challenge.
- HTML pages provide ETags and self-canonicals.

The compact surface is technically eligible. Repeated sitemap submission alone
cannot solve the current problem.

## Google Search Console

Property: `sc-domain:tools.utildesk.de`.

After a fresh verified submission on 2026-07-12:

- sitemap last submitted: `2026-07-12T00:55:31Z`;
- sitemap last downloaded: `2026-07-12T00:55:32Z`;
- submitted URLs: 120;
- indexed URLs reported for the sitemap: 0;
- warnings: 0;
- errors: 0.

Representative URL Inspection remains unchanged from July 8:

- `/`, `/tools/`, `/tools/chatgpt/`, and `/tools/claude/` are crawled but
  currently not indexed; crawling and indexing are allowed, fetching succeeded,
  and Google/user canonicals match.
- The latest crawl dates for these known core pages are still March-April 2026.
- `/ratgeber/`, `/en/ratgeber/`, the latest multi-model coding guide, and the
  code-search guide are still unknown to Google.

Search performance is effectively zero:

| Window | Clicks | Impressions |
| --- | ---: | ---: |
| 7 days | 0 | 1 |
| 28 days | 0 | 5 |
| 90 days | 1 | 51 |

The five 28-day impressions all came from one anonymized desktop search that
showed three old long-tail tool pages. Those pages now have Googlebot-specific
`noindex`, so this is not evidence that the current focus surface is recovering.

## Bing Webmaster

Current feed state after refresh:

- one registered feed: `https://tools.utildesk.de/sitemap-focus.xml`;
- status: `Success`;
- URL count: 120;
- current submission quota: 100 daily / 2,000 monthly.

Bing is crawling successfully:

- 30-day average crawled pages: 75.5/day;
- latest day: 40 crawled pages;
- days with robots blocks: 0;
- days with 5xx responses: 0.

However, Bing's reported index count is collapsing despite healthy crawling:

- 1,909 URLs on 2026-06-09;
- 1,216 URLs on 2026-06-23;
- 769 URLs on 2026-07-01;
- 360 URLs on 2026-07-07;
- 173 URLs on 2026-07-10.

Traffic data confirms that indexed volume did not produce useful visibility:

| Window | Clicks | Impressions |
| --- | ---: | ---: |
| 7 days | 0 | 0 |
| 28 days | 0 | 0 |
| 90 days | 5 | 670 |

The latest Bing page/query statistics with impressions are dated 2026-05-15.
The Bing backlink API currently reports zero recognized inbound-link targets.

## Primary architectural conflict

The sitemap is compact, but the crawl graph is not:

- the static build contains 3,450 pages;
- `/tools/` is 3,782,876 bytes and includes 1,229 unique crawlable tool links;
- `/en/tools/` is 3,009,792 bytes;
- the tool index publishes 200 items in JSON-LD while rendering all 1,229 cards;
- a single category page can expose roughly 300 tool links;
- the build contains 434 DE and 453 EN tag pages; tag pages are correctly
  `noindex,follow`, but they still add crawl paths and some exceed 800 KB.

Search engines do not treat a sitemap as a crawl boundary. The current HTML
architecture therefore tells them that the whole mass catalogue matters, while
the sitemap says that only 120 URLs matter. This contradiction consumes crawl
attention and reinforces the appearance of scaled directory content.

## Content and authority gaps

- 27 of 37 DE Ratgeber articles do not link contextually to another Ratgeber
  article, so most guides do not form closed topical clusters.
- 12 recent Ratgeber articles have no `mentionedIn` backlink from any tool card.
- Two guides link to fewer than three tool cards.
- The current 19 focus tools are editorially substantial, but several are very
  competitive head terms with no supporting Ratgeber backlink.
- Historical impressions instead appeared on narrower-intent cards such as
  Litmaps, Paperpile, Elicit, Research Rabbit, Adobe Enhance Speech, FotoJet,
  AWS Cloud9, and similar tools.
- Public GitHub READMEs already contain a few relevant Utildesk guide links, but
  search and Bing backlink data do not yet show a meaningful authority graph.
- No exact-domain external search produced a useful set of independent editorial
  references.

Metadata cleanup is secondary but worthwhile:

- most Ratgeber titles are unnecessarily lengthened by the repeated
  `- Ratgeber - Utildesk` suffix;
- the EN ChatGPT description is only `OpenAI`;
- the EN Gemini description is only 35 characters.

## Umami reality check

Raw Umami totals are currently dominated by automated traffic and must not be
used as evidence of audience growth:

- 7 days: 1,194 visitors, 1,234 visits, 1,228 bounces;
- 990 of those visitors are attributed to China;
- 1,185 use the same Chrome/laptop combination;
- total measured time for all 1,234 visits is only 891 seconds;
- only one Google and one Yandex referrer are recorded in seven days.

The correct measurement layer should add an engaged-human event (for example,
10 seconds plus scroll or an internal/outbound click) and report that separately
from raw page views.

## Prioritized recovery plan

### P0 - Make the crawl graph compact (first code patch)

1. Keep `/tools/` fully usable for people, but server-render only 24-40 focus or
   editorial cards.
2. Load the remaining inventory from the existing noindex machine endpoint only
   after a user searches, filters, or requests more results.
3. Do not embed the remaining 1,200 anchors or their card HTML in the initial
   document.
4. Reduce the ItemList JSON-LD to the actually visible curated selection.
5. Apply the same bounded initial rendering to category pages.
6. Stop linking noindex tag archives from primary focus surfaces where they do
   not help a user decision.
7. Target initial HTML below roughly 150-200 KB for `/tools/` and its EN sibling.

This patch can preserve the long-tail robots contract: it changes discovery
priority, not the global index directive on tool pages.

### P1 - Build three closed editorial clusters

1. Coding and agents: multi-model review, code search, coding agents,
   observability, governance, local agents, and persistent memory.
2. Automation and documents: workflow automation, invoices, PDF extraction,
   OCR APIs, open-source OCR, and EU data processing.
3. AI discovery and commerce: AI-search visibility, agentic commerce, useful
   tool directories, browser agents, and launch/distribution.

Each guide should link to 2-4 sibling guides and 4-8 relevant strong tool cards.
Each central tool card should link back to one or two genuinely relevant guides.
The 12 recent guides with zero tool-card backlinks should be handled first.

### P1 - Rebalance, not broaden, the focus tool set

Keep the sitemap compact, but replace several unsupported, ultra-competitive
head-term cards with editorially complete pages that have demonstrated narrow
search intent or a strong cluster role. Candidate evidence includes Litmaps,
Paperpile, Elicit, Research Rabbit, Adobe Enhance Speech, FotoJet, Wispr Flow,
OpenClaw, and OpenAI Codex.

Do not add a candidate merely because it once had an impression. It must pass
the full DE/EN editorial and factual review before entering the focus set.

### P1 - Earn references to guides, not the generic directory

1. Publish one genuinely reusable benchmark, checklist, or small dataset per
   primary cluster in a public GitHub repository with the related guide as the
   canonical explanation.
2. Notify cited vendors or open-source maintainers only when a guide contains a
   useful, accurate comparison; use the Utildesk project identity and no private
   personal data.
3. Pitch a small number of German/EU AI, developer, privacy, and commerce
   newsletters with a concrete finding, not a directory listing.
4. Do not buy links and do not repeat low-value directory registrations.

### P2 - Snippet and measurement cleanup

1. Shorten Ratgeber title templates and front-load the real query intent.
2. Repair the two weak EN focus-card descriptions.
3. Add an engaged-human Umami event and a weekly filtered report.
4. Monitor Google/Bing focus URLs weekly, not through daily resubmission.

## Actions completed during this audit

### Recovery patch implemented later on 2026-07-12

- `/tools/` and `/en/tools/` now server-render 36 prioritized files; the complete inventory is fetched from the noindex JSON API only after a user searches, filters, changes sorting, follows a letter filter, or requests more results.
- Category pages expose 24 prioritized tool links and a route into the full filtered inventory instead of hundreds of direct links.
- The shared focus list was tightened around three evidence-backed clusters and moved to `site/src/lib/searchFocus.mjs`; Google and Bing remain on the same compact sitemap contract.
- Every Ratgeber page receives up to four related guides from a deterministic cluster/similarity pass.
- Ratgeber `relatedTools` metadata generates a build-time reverse-link manifest, so relevant tool cards link back to their guides without repeated manual frontmatter.
- Ratgeber titles use the shorter `<article title> | Utildesk` template; weak English ChatGPT and Gemini descriptions were rewritten.
- Umami receives `engaged-human` only after ten seconds plus a meaningful scroll or internal click.
- A public AI-agent evaluation checklist and repository README provide a non-personal, linkable GitHub resource.
- Build result: 3,450 pages; compact sitemap: 112 URLs; `/tools/` HTML: 164,289 bytes; `/en/tools/` HTML: 136,241 bytes.

- Full 120-URL live crawl passed with zero focus-surface conflicts.
- Google sitemap was resubmitted and downloaded successfully with 120 URLs,
  zero warnings, and zero errors.
- Bing focus feed was resubmitted and read back as `Success` with 120 URLs.
- Nine changed Ratgeber/home URLs were sent to both global IndexNow and the Bing
  IndexNow endpoint; both returned HTTP 200 and all live checks returned 200.

## Decision guardrails

- Do not change the domain.
- Do not restore a broad sitemap.
- Do not globally `noindex` long-tail tool cards in this first patch.
- Do not assume that sitemap resubmission is an indexing request or a ranking
  signal.
- Do not mass-publish new cards or articles until the crawl graph and cluster
  loops are corrected.
- Do not trust raw Umami visitor totals until automated traffic is separated.

## Success criteria

Within 7-14 days after the P0/P1 patches:

- Google recrawls at least the homepage, `/tools/`, `/ratgeber/`, two guides,
  and two focus cards with current timestamps;
- GSC starts associating inspected focus URLs with the submitted sitemap;
- at least one Ratgeber or focus tool URL moves out of `unknown` or
  `crawled-currently-not-indexed`;
- Bing index decline stabilizes and focus pages regain impressions;
- engaged-human sessions become measurable separately from crawler noise.

If Bing remains at zero impressions for two weeks after the structural cleanup,
open a Bing Webmaster support/re-evaluation case with the crawl and feed evidence.

## Official references

- Google: [Sitemaps overview](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview)
- Google: [Creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- Google: [Crawling and indexing FAQ](https://developers.google.com/search/help/crawling-index-faq)
- Bing: [Webmaster Guidelines](https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a)
- Bing: [Why is my site not in the index?](https://www.bing.com/webmasters/help/why-is-my-site-not-in-the-index-2141dfab)
- Bing: [URL submission and IndexNow](https://www.bing.com/webmasters/help/url-submission-62f2860b)
