# Ratgeber Publish

`Ratgeber` нужно публиковать отдельно от `tools`-cron.

## Почему

`scripts/cron_publish_push.sh` намеренно работает только с `content/tools/*.md`.

В нём уже есть жёсткий allowlist:

- любые изменения вне `content/tools/*.md` приводят к отказу коммита и push;
- это защита от случайного смешивания `ratgeber`-публикаций с автогеном инструментов.

Из этого следует правило:

- не импортировать `publish_ready/ratgeber/*` в тот же checkout на VPS, где крутится `cron_publish_push.sh`;
- для `ratgeber` всегда использовать отдельный чистый worktree или отдельную локальную рабочую копию от актуального `origin/master`.

## Базовый безопасный flow

1. Забрать approved package с `opcl`.
2. Перейти в чистый checkout от свежего `origin/master`.
3. Сначала выполнить preflight:

```bash
python scripts/import_ratgeber_package.py --package-dir /path/to/package --preflight-only
```

Для полностью автономного выпуска использовать строгий режим. В нём даже предупреждения считаются блокером:

```bash
python scripts/import_ratgeber_package.py --package-dir /path/to/package --preflight-only --strict-warnings
```

4. Если preflight чистый, выполнить импорт:

```bash
python scripts/import_ratgeber_package.py --package-dir /path/to/package
```

5. Проверить diff только по:

- `content/ratgeber/*.md`
- `content/images/ratgeber/*`

6. Закоммитить и опубликовать этот отдельный change-set.

## Автономный preflight

`scripts/import_ratgeber_package.py` теперь является выпускным шлюзом, а не просто копировщиком файлов.

Он блокирует пакет, если:

- пакет не имеет `review_status=approved_for_publish` или нет `approved_at`;
- отсутствуют `review_packet.json` / `editorial_verdict.json`;
- article quality или visual quality не прошли;
- остались blocker-коды, generic visual fallback или editorial visual issue codes;
- slug уже существует в `content/ratgeber`;
- frontmatter не совпадает с manifest, не хватает обязательных полей, тегов, секций или inline secondary image;
- в тексте остались NotebookLM-цитаты вида `[1]`;
- статья слишком короткая или содержит слишком мало H2-секций;
- картинки или целевые пути не совпадают с `/images/ratgeber/...`.

В обычном режиме предупреждения не блокируют ручной импорт, но выводятся в JSON. В `--strict-warnings` они блокируют выпуск. Это режим для будущего робота-публикатора.

Сейчас предупреждения используются для автономного качества, например:

- вторичная иллюстрация стоит слишком рано в тексте;
- мало `relatedTools`;
- слабый excerpt;
- мало source links;
- quality score ниже желаемого автономного уровня.

## IndexNow

После push manual `ratgeber`-релиза отправлять changed canonical HTML URL в IndexNow:

```bash
python scripts/indexnow_submit.py submit-git-range --rev-range HEAD~1..HEAD --wait-live
```

## Инварианты

- импорт разрешён только для `approved_for_publish` пакетов;
- `tools`-cron и `ratgeber`-publish не должны делить один и тот же грязный рабочий checkout;
- если в рабочем дереве видны посторонние изменения, `ratgeber` нужно публиковать из нового чистого worktree.
- автономный robot publish должен запускать `--preflight-only --strict-warnings` до импорта.

## Cloudflare publish consumer

`scripts/ratgeber_cloudflare_publish_consumer.py` забирает pending-заявки из закрытого Cloudflare review backend и публикует их отдельным контуром.

Защиты от поломки production tools:

- consumer не запускает и не меняет `scripts/cron_publish_push.sh`;
- каждая заявка обрабатывается в новом checkout под `RATGEBER_PUBLISH_ROOT`, а не в `/opt/utildesk-motia`;
- перед commit выполняется `scripts/import_ratgeber_package.py --preflight-only --strict-warnings`;
- staged diff разрешён только для `content/ratgeber/*.md` и `content/images/ratgeber/*`;
- любые изменения в `content/tools/*`, `site/*`, `scripts/cron_publish_push.sh` или других путях являются fail-closed блокером;
- перед тем как пометить заявку `publishing`, consumer делает `git push --dry-run`; если GitHub write credential не настроен, pending-заявка остаётся pending, а production не трогается.

Ожидаемый cron на `opcl`:

```bash
*/5 * * * * flock -n /opt/openclaw/workspace/ratgeber-publisher/publish.lock bash -lc 'cd /opt/openclaw/workspace/agent-newsman && ./.venv/bin/python /opt/openclaw/workspace/ratgeber-publisher/utildesk-motia-control/scripts/ratgeber_cloudflare_publish_consumer.py --token-env auth/utildesk_ratgeber_review.env --limit 1 >> logs/ratgeber_publish_consumer.log 2>&1'
```

Для настоящего push с `opcl` нужен один из вариантов:

- `GITHUB_TOKEN` в `auth/utildesk_ratgeber_review.env`; consumer использует `GIT_ASKPASS`, не пишет токен в remote URL;
- или SSH/deploy key, уже настроенный на `opcl`, и `RATGEBER_PUBLISH_REPO_URL=git@github.com:fenstek/utildesk-motia.git`.
