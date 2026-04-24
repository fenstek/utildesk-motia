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
