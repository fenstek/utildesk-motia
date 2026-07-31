# Bing Index Recovery Case - 2026-07-31

## Purpose

Record the live Bing baseline, preserve a bounded support packet, and keep the
recovery work aligned with the compact-sitemap policy. This document contains
no credentials or personal data.

## Current Contract

- Google and `robots.txt`: `https://tools.utildesk.de/sitemap.xml`
- Bing Webmaster feed: `https://tools.utildesk.de/sitemap-focus.xml`
- Do not submit a broad long-tail sitemap.
- Keep long-tail tool pages globally `index,follow`; Google staging remains a
  separate `googlebot: noindex,follow` signal where applicable.

## Live Baseline

Checked on 2026-07-31 through the Bing Webmaster API and direct production
requests:

- the live focus sitemap returns `200` and contains `146` canonical URLs;
- the only registered Bing feed is `sitemap-focus.xml`;
- the registered feed still reported the previous `UrlCount = 126` before the
  refresh;
- the focus feed was submitted once on 2026-07-31 and immediately moved to
  `Pending` while retaining the previous count until Bing re-reads it;
- latest Bing crawl statistics report `InIndex = 5` on 2026-07-30;
- earlier recorded snapshots were `InIndex = 1909` on 2026-06-09 and
  `InIndex = 173` on 2026-07-10;
- the latest 30-day window has `0` search impressions and `0` clicks;
- Bing continues to crawl the site, averaging about `25.47` crawled pages per
  day in the latest 30-day window;
- `GetCrawlIssues` returns no active issues;
- there were no days with robots blocking and no days with `5xx` responses;
- Bing's backlink API returns no inbound-link target pages for the property.

Direct Bingbot checks return `200` for the homepage, Ratgeber hub, a strong
tool page, and the focus sitemap. The checked HTML pages have no
`X-Robots-Tag: noindex` response header.

## Representative URL Sample

The API recognizes all checked URLs as pages. The sample separates crawl lag
from post-crawl exclusion:

| URL | Bing state on 2026-07-31 |
| --- | --- |
| `https://tools.utildesk.de/` | crawled, stored document, 3 known anchors |
| `https://tools.utildesk.de/ratgeber/` | crawled, stored document, 0 known anchors |
| `https://tools.utildesk.de/methodologie/` | crawled, stored document, 0 known anchors |
| `https://tools.utildesk.de/tools/chatgpt/` | crawled, stored document, 0 known anchors |
| `https://tools.utildesk.de/tools/litmaps/` | crawled, stored document, 0 known anchors |
| `https://tools.utildesk.de/tools/paperpile/` | crawled, stored document, 0 known anchors |
| `https://tools.utildesk.de/tools/openai-codex/` | crawled, but Bing reports document size 0 |
| `https://tools.utildesk.de/ratgeber/agentic-commerce-2026-chatgpt-stripe-shopware-und-universal-cart/` | crawled, but Bing reports document size 0 |
| `https://tools.utildesk.de/ratgeber/openai-hugging-face-agent-benchmark-incident/` | discovered as a page, not yet crawled |
| `https://tools.utildesk.de/ratgeber/qcon-ai-boston-production-ai-moves-beyond-prompts-to-platforms-harnesses-and-eva/` | discovered as a page, not yet crawled |

The public API does not expose the detailed exclusion reason shown in Bing
Webmaster URL Inspection. The portal-only inspection and AI Performance report
still require an authenticated UI session.

## Diagnosis

The evidence does not match a fetch, robots, canonical, `5xx`, or sitemap
availability failure. It is consistent with a sitewide index-quality or trust
reassessment:

1. Bing keeps crawling while the indexed count collapses.
2. Already crawled, technically valid pages disappear from the searchable
   corpus.
3. The property has almost no Bing-visible external authority.
4. The domain historically exposed a much broader, repetitive catalogue; the
   current compact and more editorial surface does not restore site-level trust
   immediately.

This is an evidence-based inference. Only Bing can confirm the internal
classification or a hidden exclusion reason.

## Support Case Template

**Subject**

`Severe sitewide index collapse despite healthy Bingbot crawl and a valid compact sitemap - tools.utildesk.de`

**Body**

```text
Hello Bing Webmaster Support,

Please review the verified property https://tools.utildesk.de for a severe
sitewide index collapse that is not explained by the available crawl data.

The Bing Webmaster API reported InIndex = 1909 on 2026-06-09, 173 on
2026-07-10, and only 5 on 2026-07-30. Bingbot continues to crawl the site. The
latest 30-day data has no robots-blocked days, no 5xx days, and GetCrawlIssues
returns no active issues. Representative URLs return HTTP 200, self-canonical
HTML and index,follow. The registered feed is the intentionally compact
https://tools.utildesk.de/sitemap-focus.xml, currently containing 146
editorially selected canonical URLs.

Search impressions and clicks are both zero in the latest 30-day Bing data.
Several representative pages are recognized and crawled by Bing but are no
longer searchable, while newer pages are discovered but remain uncrawled.

Could you please confirm whether the property is affected by a site-level
quality classification, an indexing pipeline issue, or another exclusion not
visible through the public API? We would especially appreciate the exact
exclusion reason for these samples:

https://tools.utildesk.de/
https://tools.utildesk.de/ratgeber/
https://tools.utildesk.de/methodologie/
https://tools.utildesk.de/tools/chatgpt/
https://tools.utildesk.de/tools/openai-codex/
https://tools.utildesk.de/ratgeber/coding-agenten-2026-codex-claude-code-und-gemini-cli-im-entwickler-workflow/
https://tools.utildesk.de/ratgeber/agentic-commerce-2026-chatgpt-stripe-shopware-und-universal-cart/

We deliberately removed broad sitemap submissions and now submit only the
compact editorial focus set. We are not requesting forced ranking; we are
requesting clarification of the sitewide exclusion and any remediation Bing
expects.
```

## Next Checks

1. Wait for the submitted feed to return from `Pending` to `Success` and verify
   that `UrlCount` updates from 126 to 146.
2. Inspect the representative URLs in the authenticated URL Inspection UI and
   record the exact exclusion strings.
3. Check AI Performance separately; blue-link search and AI citations are
   different surfaces.
4. Submit the support case now: the earlier compact-feed recovery check is more
   than two weeks old and `InIndex` has continued to fall.
5. Re-check `InIndex`, impressions, crawl issues, feed status, and Bing-visible
   backlinks on 2026-08-14.
6. Do not add more tool URLs to the focus sitemap during this observation
   window.

## Content And Authority Work

Three existing contextual public GitHub references were verified live on
2026-07-31:

- `fenstek/opcl` links to the OpenClaw card and open-source agents guide;
- `fenstek/obsidian-llm-wiki-local` links to the persistent AI memory guide;
- `fenstek/claude-code-starter` links to the coding-agents guide plus the
  Claude and OpenAI Codex cards.

Bing's backlink API does not expose these references yet. Do not respond with a
directory blast or duplicate self-controlled links; the next authority gains
must come from relevant third-party editorial or developer pages.

Keep five editorial clusters as the external-link targets:

1. AI agents and agent security.
2. Coding agents and production workflows.
3. AI search, browser agents, and machine-readable websites.
4. Agentic commerce and automation.
5. Local/private AI and persistent memory.

Each new flagship article should ship with one genuinely reusable asset such
as a benchmark table, CSV, checklist, or template in a relevant public GitHub
repository. Outreach should point to the specific asset or test, not request a
generic homepage backlink.
