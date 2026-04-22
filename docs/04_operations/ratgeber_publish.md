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
3. Выполнить:

```bash
python scripts/import_ratgeber_package.py --package-dir /path/to/package
```

4. Проверить diff только по:

- `content/ratgeber/*.md`
- `content/images/ratgeber/*`

5. Закоммитить и опубликовать этот отдельный change-set.

## IndexNow

После push manual `ratgeber`-релиза отправлять changed canonical HTML URL в IndexNow:

```bash
python scripts/indexnow_submit.py submit-git-range --rev-range HEAD~1..HEAD --wait-live
```

## Инварианты

- импорт разрешён только для `approved_for_publish` пакетов;
- `tools`-cron и `ratgeber`-publish не должны делить один и тот же грязный рабочий checkout;
- если в рабочем дереве видны посторонние изменения, `ratgeber` нужно публиковать из нового чистого worktree.
