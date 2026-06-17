# `test_tool_route_entries.mjs`

Проверяет источник route-страниц для `site/src/pages/tools/[slug].astro`.

Гарантии:
- в build routes попадают только реально существующие активные файлы `content/tools/<slug>.md`
- disabled-файлы `content/tools/_<slug>.md` не могут попасть в список страниц

Запуск:

```bash
node scripts/test_tool_route_entries.mjs
```

Скрипт использует общий loader `site/src/lib/toolEntries.mjs`, чтобы route generation и самопроверка опирались на один и тот же источник данных.
