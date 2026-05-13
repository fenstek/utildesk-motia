# Postproduction pipeline для Utildesk

Этот контур запускается **после публикации/деплоя** и не меняет контент сайта. Его задача — не ждать один Google, а сразу разносить опубликованные материалы по бесплатным каналам обнаружения и готовить промо-артефакты.

## Что делает

`scripts/postproduction_pipeline.mjs`:

1. Находит новые/изменённые публичные URL по git range, например `HEAD~1..HEAD`.
2. Добавляет связанные hub-страницы (`/tools/`, `/en/tools/`, `/ratgeber/`, `/en/ratgeber/`, `/`).
3. Опционально ждёт, пока URL реально доступны на production.
4. Отправляет URL в IndexNow, если это не отключено.
5. Отправляет URL и sitemap/feed в Bing Webmaster Tools, если доступны Bing credentials.
6. Снимает агрегированный Umami-снимок, если доступны Umami credentials.
7. Генерирует postproduction-артефакты:
   - `urls.txt` — список URL текущего прогона;
   - `outreach.jsonl` — черновики vendor outreach для новых tool-карточек;
   - `linkedin-drafts.md` — черновики LinkedIn-постов;
   - `newsletter-draft.md` — weekly roundup за текущий прогон;
   - `community-drafts.md` — заготовки для Makerhunt/Product Hunt/Reddit/HN без спам-автопостинга;
   - `report.json` и `latest.json` — машинный отчёт.

Все runtime-артефакты пишутся в `reports/postproduction/` и `tmp/postproduction-state.json`; оба пути игнорируются git.

## Быстрая проверка без внешних отправок

```bash
node scripts/postproduction_pipeline.mjs \
  --dry-run \
  --rev-range HEAD~1..HEAD \
  --no-indexnow \
  --no-bing \
  --no-umami \
  --json
```

Через npm:

```bash
npm run postproduction -- --dry-run --rev-range HEAD~1..HEAD --no-indexnow --no-bing --no-umami
```

## Боевой запуск вручную

```bash
node scripts/postproduction_pipeline.mjs \
  --rev-range HEAD~1..HEAD \
  --wait-live \
  --submit-bing-feeds
```

По умолчанию pipeline пытается выполнить IndexNow, Bing URL submission и Umami snapshot. Если каких-то секретов нет, соответствующий блок будет пропущен без печати секретов.

## Подключение к publish cron

`scripts/cron_publish_push.sh` вызывает pipeline в `run_post_deploy_hooks` после стандартного IndexNow-блока:

```bash
POST_DEPLOY_POSTPRODUCTION=1
```

Значение по умолчанию — `1`.

В cron-вызове IndexNow внутри postproduction отключён флагом `--no-indexnow`, потому что IndexNow уже выполняется отдельным существующим post-deploy hook. Это защищает от двойной отправки одного и того же deploy.

## Переменные окружения

Общие:

- `PROD_BASE_URL` — production base URL, по умолчанию `https://tools.utildesk.de`.
- `POSTPRODUCTION_REV_RANGE` — git range, по умолчанию берётся `INDEXNOW_REV_RANGE` или `HEAD~1..HEAD`.
- `POSTPRODUCTION_TIMEOUT_SECONDS` — ожидание live URL, по умолчанию `600`.
- `POSTPRODUCTION_POLL_INTERVAL` — интервал проверки live URL, по умолчанию `15`.
- `POSTPRODUCTION_RESUBMIT_WINDOW_HOURS` — защита от повторной отправки URL, по умолчанию `20`.
- `POSTPRODUCTION_MAX_SUBMIT_URLS` — максимум URL для внешней отправки за один прогон cron, по умолчанию `80`, чтобы не сжечь Bing daily quota.
- `POST_DEPLOY_POSTPRODUCTION=0` — полностью отключить postproduction hook.

Bing:

- `BING_WEBMASTER_API_KEY`
- `BING_WEBMASTER_SITE_URL`
- или файл `secrets/bing-webmaster.env` / `BING_ENV_FILE`.

Umami:

- `UMAMI_WEBSITE_ID`
- `UMAMI_USERNAME`
- `UMAMI_PASSWORD`
- `UMAMI_BASE_URL`, опционально, по умолчанию `https://stats.utildesk.de`.

## Безопасность и дисциплина

- Pipeline не рассылает email автоматически. Он создаёт outreach-очередь и тексты. Автоматическую отправку можно добавлять отдельным, явно разрешённым контуром, чтобы не устроить спам-пушку, о достойнейший.
- Секреты не логируются.
- Отчёты не коммитятся.
- State-файл нужен для идемпотентности: одинаковые URL не отправляются повторно в пределах `POSTPRODUCTION_RESUBMIT_WINDOW_HOURS`.
- Большие диапазоны не отправляются целиком: лишние URL попадут в `deferredSubmitUrls` в отчёте и будут обработаны отдельным/следующим прогоном.

## Минимальный ожидаемый результат после deploy

В логах cron:

```text
[cron] postproduction pipeline: base=https://tools.utildesk.de rev_range=HEAD~1..HEAD
[postproduction] changed_files=... content_items=... urls=... submit_urls=...
[postproduction] report: /opt/utildesk-motia/reports/postproduction/...
[cron] postproduction pipeline completed
```

В `reports/postproduction/latest.json` должны быть:

- `submissions.bing` — отправка URL или корректный skip при отсутствии Bing credentials;
- `submissions.bingFeeds` — отправка sitemap/feed или корректный skip;
- `outreach.count` — число vendor outreach drafts;
- `umami` — snapshot или корректный skip при отсутствии Umami credentials.
