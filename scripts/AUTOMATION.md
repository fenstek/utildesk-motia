# Utildesk Motia — Automatisierung (Google Sheet → Content → Site)

Этот файл фиксирует текущее рабочее состояние автоматизации проекта Utildesk Motia.

КЛЮЧЕВОЕ ПРАВИЛО
- Картинки НЕ генерируем
- Используем официальные фавиконы и иконки брендов (official_url / SimpleIcons / favicon endpoints)
- Генерация изображений исключена из обязательного пайплайна

СТРУКТУРА
- scripts/ — автоматизация
- content/tools/ — markdown инструментов
- /tmp/utildesk_current_tool.json — временный файл пайплайна

АВТОДОБАВЛЕНИЕ В GOOGLE SHEET
Главный скрипт:
- scripts/sheet_ai_autogen_9_strict_v2.mjs

Назначение:
- генерация кандидатов через LLM
- проверка через Wikidata
- дедупликация
- запись строк A..P через строгий writer

Пример запуска (одна строка):
FETCH_TIMEOUT_MS=6000 WIKIDATA_MIN_SITELINKS=15 AUTOGEN_MAX_LOOPS=200 node scripts/sheet_ai_autogen_9_strict_v2.mjs 20

## КОНСТИТУЦИЯ ПАЙПЛАЙНА (фиксируем навсегда)

### 1) Единственный дирижёр (оркестратор)
**scripts/test_run_9_full.mjs** — это единственный “дирижёр” публикации.
Все остальные файлы в `scripts/` — это *шаги*, которые дирижёр вызывает.

### 2) Контракт дирижёра (что он обязан делать)
Входы:
- Google Sheet — источник правды (строки инструментов)
- `/tmp/utildesk_current_tool.json` — временный файл текущего инструмента

Выходы:
- `content/tools/<slug>.md` (страницы инструментов)
- обновление `status` в Google Sheet

**Статусы (обязательная логика):**
- `NEW` → `IN_PROGRESS` (ставит `sheet_get_next_new.mjs`)
- `DONE` — ставит дирижёр при успешной обработке
- `ERROR` — ставит дирижёр при любой ошибке после того, как известен `row_number`

Важно:
- **Картинки НЕ генерируем** (любые image/logo шаги отсутствуют и не возвращаются).
- Дирижёр не “умнеет” сам: не меняет архитектуру, не делает глобальных рефакторингов — только вызывает шаги.

### 3) Порядок шагов дирижёра (канонический)
На каждый инструмент (каждый STEP):
1) `scripts/sheet_get_next_new.mjs` (находит `NEW`, ставит `IN_PROGRESS`, отдаёт JSON с `row_number`)
2) `scripts/generate_tool_md.mjs /tmp/utildesk_current_tool.json`
3) `scripts/finalize_md.mjs /tmp/utildesk_current_tool.json`
4) `scripts/check_duplicates.mjs`
5) `scripts/sheet_set_status.mjs <row_number> DONE`

Если на шагах 2–4 возникает ошибка и `row_number` уже известен:
- `scripts/sheet_set_status.mjs <row_number> ERROR`

### 4) Где это “в проде”
Cloudflare Pages должен деплоить ветку **master**. Поэтому любые изменения дирижёра считаются “зафиксированными” только после мержа в `master`.


ПУБЛИКАЦИЯ НА САЙТ
Главный оркестратор:
- scripts/test_run_9_full.mjs

Цикл статусов:
NEW -> IN_PROGRESS -> DONE

Команда запуска:
node scripts/test_run_9_full.mjs 3

ОБЯЗАТЕЛЬНЫЕ СКРИПТЫ ПАЙПЛАЙНА
- sheet_ai_autogen_9_strict_v2.mjs
- sheet_write_rows_strict_AP_v2.mjs
- test_run_9_full.mjs
- sheet_get_next_new.mjs
- sheet_set_status.mjs
- generate_tool_md.mjs
- finalize_md.mjs
- check_duplicates.mjs

Этот файл — точка истины по автоматизации.
