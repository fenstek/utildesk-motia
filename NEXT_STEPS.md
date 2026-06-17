# Next Steps

4. Re-check Search Console after the refreshed sitemap is downloaded again:
   - confirm that old alias URLs age out of the submitted/error set;
   - confirm that the newest `ratgeber` article leaves the `URL not known to Google` state.
5. If GSC still shows high non-error exclusion counts after sitemap cleanup, investigate content-quality or duplicate-selection cases separately from crawl-technical issues.
6. After the next deploy, verify live responses for the new AI-facing endpoints:
   - `/llms.txt`
   - `/llms-full.txt`
   - `/feed.xml`
   - `/feed.json`
   - `/api/tools.json`
   - `/api/ratgeber.json`
   - one sample `/api/tools/<slug>.json`
   - one sample `/api/ratgeber/<slug>.json`
7. If we later expose a real server-readable search query contract, consider adding `SearchAction` to the `WebSite` schema. Do not add it before that.
8. Bing Webmaster access is now working. Future Bing checks should start from:
   - `python scripts/bing_webmaster_api.py sites`
   - `python scripts/bing_webmaster_api.py feeds`
   - `python scripts/bing_webmaster_api.py crawl-summary --days 30`
   - and then verify `GetFeedDetails` against the live sitemap URL count.

## 2026-04-22 Bing Follow-Up

9. Re-check Bing Webmaster crawl and feed state after the next natural recrawl:
   - confirm the refreshed sitemap stays at `855` URLs;
   - watch whether Bing's `InIndex` count continues climbing after the manual submissions.
10. If a future release adds more machine-readable endpoints, extend the Cloudflare Pages Functions `noindex` guard in `site/functions/` alongside the route itself.
11. Monitor the first IndexNow batches after more real releases:
   - check whether later submissions keep returning `200` on both the global IndexNow endpoint and the direct Bing endpoint;
   - confirm that the cron-driven tools flow submits only changed canonical HTML pages.
12. If `ratgeber` release cadence increases, consider a tiny wrapper script that combines import, push, and `indexnow_submit.py submit-git-range` in one manual release command.
13. Re-check the Bing Webmaster `IndexNow` UI after the next refresh window:
   - confirm whether direct Bing endpoint submissions make the portal leave the onboarding-only `Get Started` state.

1. Следующие `ratgeber`-статьи публиковать тем же отдельным clean-worktree flow.
2. Дальше улучшать quality алгоритмов текста и иллюстраций на `opcl`, не смешивая эту работу с `tools`-cron.
3. Если появится полноценный article release cadence, вынести его в отдельный runbook или отдельную ops-утилиту поверх approved packages.
