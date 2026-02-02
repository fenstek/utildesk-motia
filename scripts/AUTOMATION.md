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
