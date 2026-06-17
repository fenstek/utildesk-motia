# Blacklist + Remove: lifelike (row 295)

Date (UTC): 2026-02-24 05:23
Target slug: `lifelike`
Target row: `295`

## 1) Sheet inventory (before)
- row_index: 295
- name: *(empty)*
- slug: lifelike
- topic: Lifelike
- tags: ai,assistant,automation
- pricing: *(empty)*
- status: NEEDS_REVIEW
- official_url: https://www.lifelike.io/
- notes: NEEDS_REVIEW: lifelike.io parked (/lander→afternic.com/forsale); official site not confidently identified (lifelike.app=NXDOMAIN, lifelike.com=timeout, lifelike.ai=SSL-expired+under-construction); 2026-02-23
- ref_url/ref_text/ref1/ref2/ref3: *(all empty)*

## 2) Sheet changes applied
- `status` updated to `BLACKLIST` (enum aligned with existing `magician`/`pindar` cases)
- `notes` updated to:
  - NEEDS_REVIEW: lifelike.io parked (/lander→afternic.com/forsale); official site not confidently identified (lifelike.app=NXDOMAIN, lifelike.com=timeout, lifelike.ai=SSL-expired+under-construction); 2026-02-23 | BLACKLIST: parked/lander official_url + tool not identifiable; remove from catalog; 2026-02-24

## 3) Sheet inventory (after)
- row_index: 295
- name: *(empty)*
- slug: lifelike
- topic: Lifelike
- tags: ai,assistant,automation
- pricing: *(empty)*
- status: BLACKLIST
- official_url: https://www.lifelike.io/
- notes: NEEDS_REVIEW: lifelike.io parked (/lander→afternic.com/forsale); official site not confidently identified (lifelike.app=NXDOMAIN, lifelike.com=timeout, lifelike.ai=SSL-expired+under-construction); 2026-02-23 | BLACKLIST: parked/lander official_url + tool not identifiable; remove from catalog; 2026-02-24
- ref_url/ref_text/ref1/ref2/ref3: *(all empty)*

## 4) Repo changes
Deleted files:
- `content/tools/lifelike.md` (via `git rm`)

Redirects:
- Existing redirect rules for `lifelike` were already present in `site/public/_redirects`
- Kept rules:
  - `/tools/lifelike    /tools/    301`
  - `/tools/lifelike/   /tools/    301`
- Updated comment to reflect BLACKLIST state:
  - `# lifelike BLACKLIST (parked/lander official_url + tool not identifiable)`

## 5) Build/publish checks
Build run:
- `cd /opt/utildesk-motia/site && npm run build`
- Result: success (Astro build complete, sitemap generated)

## 6) Post-check (live)
`curl -I https://tools.utildesk.de/tools/lifelike/`:
- HTTP/2 301
- `location: /tools/`

Live sitemap check:
- `curl -s https://tools.utildesk.de/sitemap.xml | rg -n "lifelike"`
- Current result: contains `https://tools.utildesk.de/tools/lifelike/` (pending deploy/refresh)

Local built sitemap check:
- `rg -n "lifelike" site/dist/sitemap.xml`
- Result: no matches

## 7) Notes
- Cron schedules/infrastructure were not modified.
- Removal executed as managed action: Sheet BLACKLIST + repo deletion + redirects validation.
