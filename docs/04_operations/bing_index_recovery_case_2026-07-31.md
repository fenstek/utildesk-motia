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
- the focus feed was submitted exactly once on 2026-07-31, briefly moved to
  `Pending`, then returned to `Success` with `UrlCount = 146` after Bing read
  the current file;
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

The authenticated URL Inspection UI reports the same exclusion on every
manually checked focus URL: `Discovered, but content crawl not performed` and
`URL cannot appear on Bing`. This was confirmed for the homepage, Ratgeber
hub, Methodik, ChatGPT, OpenAI Codex, and the Agentic Commerce guide. The
portal therefore treats the current index record as unavailable even where
the API retains historical crawl metadata or a stored document.

Three bounded manual indexing requests were submitted successfully on
2026-07-31: the homepage, the Ratgeber hub, and the Agentic Commerce guide.
Do not repeat these requests during the observation window.

## AI Performance

Bing AI Performance is a separate and materially healthier surface than
blue-link search. For the three-month view ending 2026-07-30 it reports 121
citations across 28 Utildesk pages. The leading cited pages include Adobe
Enhance Speech (24), FotoJet (12), Research Rabbit (11), Workday HCM (8),
DaVinci Resolve (6), Zotero (6), Continue (5), Talon (5), and Remove.bg (5).
The visible activity is concentrated in late April and early May; the report
shows no subsequent citation activity in the displayed chart.

The IndexNow UI also reports 840 submitted URLs in the latest 15 hours and
about 15,400 submissions in total. This is much broader than the 146-URL focus
sitemap and is caused by runtime editorial batch releases. During recovery,
mass tool-card IndexNow submissions should stop: submit only changed Ratgeber,
hub, and explicitly selected focus URLs.

## Diagnosis

The evidence does not match a fetch, robots, canonical, `5xx`, or sitemap
availability failure. The portal's exact message identifies a current Bing
indexing-pipeline exclusion rather than a transport failure. The broader
pattern remains consistent with a sitewide quality/trust reassessment:

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

1. Keep the registered feed at `Success` with `UrlCount = 146`; do not resubmit
   it again without a real sitemap change.
2. Do not repeat the three manual indexing requests submitted on 2026-07-31.
3. Preserve AI Performance separately; 121 citations across 28 pages confirm
   that Bing AI can use Utildesk even while blue-link indexing is collapsed.
4. Stop bulk IndexNow submissions for non-focus tool-card batches during the
   observation window.
5. Submit the support case now: the earlier compact-feed recovery check is more
   than two weeks old and `InIndex` has continued to fall.
6. Re-check `InIndex`, impressions, crawl issues, feed status, and Bing-visible
   backlinks on 2026-08-14.
7. Do not add more tool URLs to the focus sitemap during this observation
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
