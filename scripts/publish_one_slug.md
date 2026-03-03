# publish_one_slug

Назначение: опубликовать ровно один инструмент по `slug` из Google Sheet без запуска массового пайплайна.

Что делает:
- находит строку по `slug` в Sheet;
- для publishable статусов переводит статус в `IN_PROGRESS`;
- генерирует `content/tools/<slug>.md` через существующие скрипты:
  - `scripts/generate_tool_md.mjs`
  - `scripts/finalize_md.mjs`
  - `scripts/check_duplicates.mjs`
- при успехе publishable строки ставит `DONE`;
- при ошибке ставит `ERROR`.
- `DISABLED` / `BLACKLIST` не публикует и не поднимает статус;
- `NEEDS_REVIEW` по умолчанию пропускает; с `--allow-needs-review` делает только локальный rebuild без status transition и синхронизирует markdown в disabled-виде.

CLI:
```bash
node scripts/publish_one_slug.mjs <slug> [--allow-needs-review]
```

Примеры:
```bash
node scripts/publish_one_slug.mjs chai
node scripts/publish_one_slug.mjs figma
```

Требования:
- доступны Google credentials:
  - `GOOGLE_CLIENT_EMAIL` + `GOOGLE_PRIVATE_KEY`, или
  - файл `/opt/utildesk-motia/secrets/google-service-account.json`;
- настроены переменные для генерации markdown (`OPENAI_API_KEY`, `CONTENT_DIR`, `TEMPLATE_PATH`).
