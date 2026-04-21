# Next Steps

4. Re-check Search Console after the refreshed sitemap is downloaded again:
   - confirm that old alias URLs age out of the submitted/error set;
   - confirm that the newest `ratgeber` article leaves the `URL not known to Google` state.
5. If GSC still shows high non-error exclusion counts after sitemap cleanup, investigate content-quality or duplicate-selection cases separately from crawl-technical issues.

1. Следующие `ratgeber`-статьи публиковать тем же отдельным clean-worktree flow.
2. Дальше улучшать quality алгоритмов текста и иллюстраций на `opcl`, не смешивая эту работу с `tools`-cron.
3. Если появится полноценный article release cadence, вынести его в отдельный runbook или отдельную ops-утилиту поверх approved packages.
