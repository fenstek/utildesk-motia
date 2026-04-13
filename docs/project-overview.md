# Utildesk Motia — Описание проекта

> Актуально на: 2026-04-13 (основано на ветке `master`, коммит `2076e04`)

## Обзор

**Utildesk Motia** — автоматизированный каталог AI-инструментов на немецком языке.
Система обнаруживает, валидирует и публикует страницы AI-инструментов через
полностью автоматизированный pipeline.

Живой сайт разворачивается на Cloudflare Pages из ветки `master`.

**Текущее состояние:**
- 751 опубликованный инструмент (856 файлов total, 105 деактивированы с префиксом `_`)
- Pipeline работает: каждые 6ч публикация, каждые 12ч обнаружение
- Последний коммит: `2076e04` — chore: sync popularity from Umami (2026-04-13)

---

## Архитектура

```
utildesk-motia/
├── scripts/        # Content Pipeline (Node.js, 100+ скриптов)
├── site/           # Astro v5 Static Site
├── content/        # Сгенерированные MD-файлы (shared с сайтом через symlink)
├── agent/          # Self-healing Verification Agent
├── backups/        # Снапшоты Sheet-патчей и аудит-логов
├── compose/        # Docker Compose конфиги (prod, traefik)
├── docs/           # Документация
├── memory/         # Состояние pipeline
└── reports/        # Результаты аудитов
```

---

## 1. Content Pipeline (`scripts/`)

### Главный принцип

**Google Sheet** — единственный источник истины.
Все инструменты проходят цикл статусов:

```
NEW → IN_PROGRESS → DONE
                 ↘ ERROR
                 ↘ NEEDS_REVIEW
                 ↘ REBUILD
                 ↘ DISABLED
                 ↘ BLACKLIST
```

**Единственный оркестратор:** `scripts/test_run_9_full.mjs`
Все остальные скрипты — это «шаги», вызываемые оркестратором.

### Тройные гейты публикации (v2.3)

| Гейт | Проверка |
|------|---------|
| Gate 1 | `official_url` валидирован в autogen |
| Gate 2 | Минимум 1 специфический тег |
| Gate 3 | `official_url` повторно проверен в оркестраторе |

### Порядок обработки одного инструмента

1. `sheet_get_next_new.mjs` — взять следующий `NEW` инструмент из Sheet
2. `generate_tool_md.mjs` — сгенерировать Markdown на основе данных
3. `finalize_md.mjs` — финализировать frontmatter
4. `check_duplicates.mjs` — проверить на дубликаты slug
5. `sheet_set_status.mjs` — поставить `DONE` (или `ERROR`)

Двухфазная финализация: если MD не отслеживается git — отложить статус до после коммита.

### Ключевые скрипты

| Скрипт | Назначение |
|--------|-----------|
| `test_run_9_full.mjs` | Главный оркестратор pipeline |
| `sheet_ai_autogen_9_strict_v2.mjs` | Автоматическое обнаружение AI-инструментов (LLM + Wikidata) |
| `sheet_get_next_new.mjs` | Получить следующий `NEW` инструмент из Sheet |
| `sheet_set_status.mjs` | Обновить статус в Sheet |
| `generate_tool_md.mjs` | Создать Markdown из данных инструмента |
| `finalize_md.mjs` | Финализировать frontmatter |
| `check_duplicates.mjs` | Предотвратить дублирование slug |
| `cron_publish_push.sh` | Cron-обёртка: генерация → коммит → PR → merge |
| `resolve_official_url_ddg_v1.mjs` | Резолв URL через DuckDuckGo |
| `umami_sync_popularity.mjs` | Синхронизация метрик популярности |
| `production_status.mjs` | Read-only проверка: working tree / HEAD / PR / Cloudflare |

### Библиотека (`scripts/lib/`)

| Модуль | Назначение |
|--------|-----------|
| `category_matcher.mjs` | Маппинг тегов на 8 немецких категорий |
| `official_url_chooser_gpt.mjs` | GPT-выбор официального URL |
| `tag_enricher_gpt.mjs` | GPT-обогащение тегов |
| `tag_policy.mjs` | Правила валидации тегов |
| `url_policy.mjs` | Правила валидации URL |
| `url_suspicion.mjs` | Детект паркованных/подозрительных доменов |
| `http_verify_url.mjs` | Проверка доступности URL |
| `publish_status_guards.mjs` | Enforcement гейтов |
| `price_model_policy.mjs` | Нормализация price_model |
| `entity_disambiguation.mjs` | Разрешение неоднозначности Wikidata |
| `html_sniff_parking.mjs` | Детект паркованных страниц |

### Автоматический запуск (Cron на VPS)

```bash
# Каждые 6 часов — публикация (до 10 инструментов за раз)
bash scripts/cron_publish_push.sh
# Lock: /tmp/utildesk-motia_publish.lock

# Каждые 12 часов — обнаружение новых инструментов
FETCH_TIMEOUT_MS=6000 WIKIDATA_MIN_SITELINKS=15 AUTOGEN_MAX_LOOPS=200 \
  node scripts/sheet_ai_autogen_9_strict_v2.mjs 20
# Lock: /tmp/utildesk-motia_sheet.lock
```

Размер батча: 10 по умолчанию (переопределяется через `PUBLISH_BATCH_SIZE` или CLI аргументом).

---

## 2. Static Site (`site/`)

**Framework:** Astro v5 + MDX

```
site/
├── src/
│   ├── pages/
│   │   ├── index.astro              # Главная страница
│   │   ├── tools/index.astro        # Каталог инструментов
│   │   ├── tools/[slug].astro       # Динамическая страница инструмента
│   │   ├── category/[slug].astro    # Страница категории
│   │   ├── tag/[slug].astro         # Страница тега
│   │   ├── impressum.astro          # Impressum
│   │   └── datenschutz.astro        # Политика конфиденциальности
│   └── lib/
│       ├── categories.ts            # 8 немецких категорий
│       ├── resolveLogoPath.ts       # Резолв логотипов
│       ├── priceModel.ts            # Price model утилиты
│       └── tagRoutes.ts             # Роутинг по тегам
├── public/
│   └── styles/global.css            # Design system (здесь, не в src/styles!)
├── functions/                        # Cloudflare Workers
├── scripts/
│   └── generate_sitemap.mjs         # Post-build sitemap
└── content → ../content             # Симлинк на shared content
```

**Design system** (`site/public/styles/global.css`):
- Primary цвет: `#176259` (teal)
- Шрифты: Plus Jakarta Sans + Inter

### Команды сайта

```bash
cd site
npm run dev          # Dev-сервер на localhost:4321
npm run build        # Production build → dist/ + sitemap
npm run preview      # Превью production-сборки
npm run fetch:logos  # Скачать SimpleIcons логотипы
```

---

## 3. Контент (`content/`)

### Структура страницы инструмента

Каждый инструмент — Markdown-файл `content/tools/<slug>.md`:

```yaml
---
slug: "tool-name"
title: "Tool Name"
category: "ai-chatbots"
price_model: "freemium"   # free | freemium | paid
tags: ["ai", "chatbot", "text"]
official_url: "https://example.com"
affiliate_url: "https://example.com"
---
```

**Язык контента:** немецкий (DE)

**Структура статьи:**
- Введение / описание
- Для кого подходит?
- Ключевые функции
- Плюсы и минусы
- Тарифы
- Альтернативы
- FAQ

**Текущий объём:** 751 опубликованных инструментов, 105 деактивированных (префикс `_`)

### 8 категорий

| Slug | Название |
|------|----------|
| `ai-chatbots` | Chatbots & Assistenten |
| `schreiben-content` | Schreiben & Content |
| `design-kreativ` | Design & Kreativität |
| `audio-video` | Audio & Video |
| `produktivitaet` | Produktivität |
| `entwickler-tools` | Entwickler-Tools |
| `automatisierung` | Automatisierung |
| `marketing-vertrieb` | Marketing & Vertrieb |

---

## 4. Verification Agent (`agent/`)

Self-healing агент для валидации контента:

- `agent/checks/disabled_tools.mjs` — проверяет, что деактивированные инструменты не попадают в публикацию
- `agent/backup.mjs` — создаёт checkpoint-теги
- Self-healing loop через `agent/core.mjs`

```bash
node agent/cli.mjs
```

---

## 5. Документация (`docs/`)

```
docs/01_architecture/system_map.md           # Карта системы
docs/02_data_pipeline/qc_pipeline_handoff.md # QC pipeline
docs/03_agents/agent_playbook.md             # Плейбук агентов
docs/04_operations/failure_recovery_manual.md # Восстановление после сбоев
docs/04_operations/runtime_vps_deploy.md     # Деплой на VPS
docs/AUTOPILOT_CRON_STATE.md                 # Состояние cron-автопилота
docs/status_pipeline.md                      # Статусы pipeline
docs/project-overview.md                     # Этот файл
```

---

## 6. Git Workflow

```
autobot branch  →  PR  →  master branch  →  Cloudflare Pages
```

1. Cron-скрипт коммитит сгенерированный контент в ветку `autobot`
2. Создаётся PR: `autobot → master`
3. PR автоматически мёрджится (`gh pr merge --merge --admin`)
4. Cloudflare Pages детектирует изменения в `master` и деплоит сайт

**Allowlist для автокоммитов:** только `content/tools/*.md`

**Прямой пуш в `master` заблокирован.**

---

## 7. Окружение и секреты

Конфигурация в `.env` (не коммитить):

| Переменная | Назначение |
|-----------|-----------|
| `OPENAI_API_KEY` | OpenAI API для LLM-обнаружения инструментов |
| `SPREADSHEET_ID` | ID Google Sheet (источник истины) |
| `SHEET_NAME` | Вкладка листа (по умолчанию: `Tabellenblatt1`) |
| `SA_JSON_PATH` | Путь к JSON Google Service Account |
| `CONTENT_DIR` | Выходная директория для Markdown |
| `LANG` | Язык контента (`de`) |
| `CF_API_TOKEN` | Cloudflare API token |
| `CF_ACCOUNT_ID` | Cloudflare account ID |
| `CF_PROJECT_NAME` | Cloudflare Pages project name |

---

## 8. Ключевые ограничения

1. **Нельзя генерировать изображения** — только официальные favicon/SimpleIcons
2. **Нельзя обходить статус-трекинг** — все инструменты обязаны проходить через Sheet
3. **Нельзя коммитить вне allowlist** — только `content/tools/*.md`
4. **Нельзя нарушать паттерн оркестратора** — скрипты это «шаги», не автономные инструменты
5. **Весь контент — на немецком языке**
6. **CSS design system** — только через `site/public/styles/global.css`

---

## 9. Технологический стек

| Слой | Технологии |
|------|-----------|
| Content Pipeline | Node.js (ESM), OpenAI API, Google Sheets API, Wikidata |
| Static Site | Astro v5, MDX, TypeScript, Cloudflare Workers |
| Deployment | Cloudflare Pages, GitHub Actions / gh CLI |
| Analytics | Umami (self-hosted) |
| Logos | SimpleIcons |
| Infrastructure | VPS (cron), Docker Compose, Traefik |

---

## 10. Логи (на VPS)

```
/var/log/utildesk-motia/publish.log  # Генерация контента и PR-флоу
/var/log/utildesk-motia/sheet.log    # Обнаружение инструментов
/tmp/utildesk_current_tool.json      # Текущий обрабатываемый инструмент
/tmp/utildesk-motia_publish.lock     # Lock публикации
/tmp/utildesk-motia_sheet.lock       # Lock обнаружения
```

---

## 11. Известные особенности

- **Prisma Labs** (`prisma-ai.com`): ручной override slug, чтобы не коллизировать с Prisma ORM
- Деактивированные инструменты (`_` prefix) — исключены из публикации, верифицируются `agent/checks/disabled_tools.mjs`
