# Utildesk Motia — Описание проекта

## Обзор

**Utildesk Motia** — автоматизированный каталог AI-инструментов на немецком языке.
Система обнаруживает, валидирует и публикует страницы AI-инструментов через
полностью автоматизированный pipeline.

Живой сайт разворачивается на Cloudflare Pages из ветки `master`.

---

## Архитектура

Проект состоит из трёх независимых компонентов:

```
utildesk-motia/
├── scripts/        # Content Pipeline (Node.js)
├── site/           # Astro Static Site
├── content/        # Сгенерированные MD-файлы (shared)
├── agent/          # Self-healing Verification Agent
├── compose/        # Docker Compose конфиги
└── docs/           # Документация
```

---

## 1. Content Pipeline (`scripts/`)

### Главный принцип

**Google Sheet** — единственный источник истины.
Все инструменты проходят цикл статусов: `NEW → IN_PROGRESS → DONE / ERROR`.

**Единственный оркестратор:** `scripts/test_run_9_full.mjs`
Все остальные скрипты — это «шаги», вызываемые оркестратором.

### Порядок обработки одного инструмента

1. `sheet_get_next_new.mjs` — взять следующий `NEW` инструмент из Sheet
2. `generate_tool_md.mjs` — сгенерировать Markdown на основе данных
3. `finalize_md.mjs` — финализировать frontmatter
4. `check_duplicates.mjs` — проверить на дубликаты slug
5. `sheet_set_status.mjs` — поставить `DONE` (или `ERROR`)

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

### Автоматический запуск (Cron на VPS)

```bash
# Каждые 6 часов — публикация инструментов
node scripts/test_run_9_full.mjs 3
bash scripts/cron_publish_push.sh

# Каждые 12 часов — обнаружение новых инструментов
FETCH_TIMEOUT_MS=6000 WIKIDATA_MIN_SITELINKS=15 AUTOGEN_MAX_LOOPS=200 \
  node scripts/sheet_ai_autogen_9_strict_v2.mjs 20
```

---

## 2. Static Site (`site/`)

**Framework:** Astro v5 + MDX

```
site/
├── src/
│   ├── pages/
│   │   ├── index.astro           # Главная страница
│   │   ├── tools/index.astro     # Каталог инструментов
│   │   ├── tools/[slug].astro    # Динамическая страница инструмента
│   │   ├── category/[slug].astro # Страница категории
│   │   ├── impressum.astro       # Impressum (нем. требование)
│   │   └── datenschutz.astro     # Политика конфиденциальности
│   ├── layouts/BaseLayout.astro
│   └── lib/
│       ├── categories.ts         # 8 немецких категорий
│       └── resolveLogoPath.ts    # Резолв логотипов
├── content → ../content          # Симлинк на shared content
└── public/
    ├── _headers                  # Cloudflare заголовки
    └── _redirects                # Cloudflare редиректы
```

### Команды сайта

```bash
cd site
npm run dev          # Dev-сервер на localhost:4321
npm run build        # Production build → dist/
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

**Текущий объём:** ~186 опубликованных инструментов

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

- Проверяет, что деактивированные инструменты (с префиксом `_`) не попадают в публикацию
- Создаёт backup-точки
- Запускает самовосстановительные циклы

```bash
node agent/cli.mjs
```

---

## 5. Git Workflow

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

## 6. Окружение и секреты

Конфигурация в `.env` (не коммитить):

| Переменная | Назначение |
|-----------|-----------|
| `OPENAI_API_KEY` | OpenAI API для LLM-обнаружения инструментов |
| `SPREADSHEET_ID` | ID Google Sheet (источник истины) |
| `SHEET_NAME` | Вкладка листа (по умолчанию: `Tabellenblatt1`) |
| `SA_JSON_PATH` | Путь к JSON Google Service Account |
| `CONTENT_DIR` | Выходная директория для Markdown |
| `LANG` | Язык контента (`de`) |

---

## 7. Ключевые ограничения

1. **Нельзя генерировать изображения** — только официальные favicon/SimpleIcons
2. **Нельзя обходить статус-трекинг** — все инструменты обязаны проходить через Sheet
3. **Нельзя коммитить вне allowlist** — только `content/tools/*.md`
4. **Нельзя нарушать паттерн оркестратора** — скрипты это «шаги», не автономные инструменты
5. **Весь контент — на немецком языке**

---

## 8. Технологический стек

| Слой | Технологии |
|------|-----------|
| Content Pipeline | Node.js (ESM), OpenAI API, Google Sheets API, Wikidata |
| Static Site | Astro v5, MDX, TypeScript |
| Deployment | Cloudflare Pages, GitHub Actions / gh CLI |
| Analytics | Umami (self-hosted) |
| Logos | SimpleIcons |
| Infrastructure | VPS (cron), Docker Compose, Traefik |

---

## 9. Логи (на VPS)

```
/var/log/utildesk-motia/publish.log  # Генерация контента и PR-флоу
/var/log/utildesk-motia/sheet.log    # Обнаружение инструментов
/tmp/utildesk_current_tool.json      # Текущий обрабатываемый инструмент
```
