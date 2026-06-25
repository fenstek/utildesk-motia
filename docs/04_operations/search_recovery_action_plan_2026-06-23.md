# Utildesk Search Recovery Action Plan

Дата составления: 2026-06-23

Цель: вернуть `tools.utildesk.de` в устойчивую видимость Google и Bing без
широкого sitemap-шума, без смены домена и без публикации слабого long-tail
контента в поисковые системы.

## 1. Текущая диагностика

### 1.1 Что проверено live

- `https://tools.utildesk.de/robots.txt` доступен и разрешает обход.
- В `robots.txt` рекламируется только Google-facing sitemap:
  `https://tools.utildesk.de/sitemap.xml`.
- `https://tools.utildesk.de/sitemap.xml` доступен, компактный, без ошибок
  HTTP.
- `https://tools.utildesk.de/sitemap-focus.xml` доступен и используется как
  компактный Bing feed.
- Основные HTML-страницы отдают `200`, self-canonical и
  `robots: index,follow`.
- Machine endpoints остаются fetchable, но с `X-Robots-Tag: noindex`, как и
  задумано: `/api/*`, `/markdown/*`, `/feed.*`, `/llms*.txt`.

### 1.2 Google Search Console

Последняя проверка: 2026-06-23.

- GSC property: `sc-domain:tools.utildesk.de`.
- Sitemap: `https://tools.utildesk.de/sitemap.xml`.
- GSC sitemap status: ошибок `0`, warnings `0`.
- GSC sitemap telemetry: `submitted = 110`, `indexed = 0`.
- Live sitemap уже содержит `116` URL, поэтому sitemap был повторно отправлен
  в GSC 2026-06-23.
- URL Inspection sample:
  - `/`: `Crawled - currently not indexed`
  - `/tools/`: `Crawled - currently not indexed`
  - `/tools/chatgpt/`: `Crawled - currently not indexed`
  - `/ratgeber/`: `URL is unknown to Google`
  - свежие Ratgeber-статьи: преимущественно `URL is unknown to Google`
- Для проверенных URL Google видит:
  - robots allowed;
  - indexing allowed;
  - fetch successful;
  - user canonical совпадает с Google canonical.

Вывод: это не блокировка robots/noindex/canonical. Google может получить часть
страниц, но не считает их достаточно сильными для индекса, а новые статьи ещё
не дошли до нормального discovery/crawl цикла.

### 1.3 Bing Webmaster

Последняя проверка: 2026-06-23.

- Bing feed: `https://tools.utildesk.de/sitemap-focus.xml`.
- Feed был повторно отправлен 2026-06-23 и перешёл в `Pending`.
- Предыдущий readback: `Status = Success`, `UrlCount = 110`.
- Last-30-day crawl summary:
  - latest `InIndex = 1216`;
  - average crawled pages per day: `111.17`;
  - days with robots blocks: `0`;
  - days with 5xx: `0`;
  - crawl errors low.

Вывод: Bing сайт видит и индексирует часть страниц. Проблема Bing сейчас больше
похожа на слабую выдачу и слабые сигналы ранжирования, а не на технический
запрет обхода.

## 2. Главная гипотеза

Поисковики не показывают сайт не потому, что он закрыт, а потому что он
выглядит для них как молодой/слабый каталог в сверхконкурентной AI-тематике:

- мало внешних доверенных упоминаний;
- много страниц типа tool-card, похожих на каталог;
- Google осторожно относится к массовым AI/tool directory страницам;
- новые Ratgeber-статьи не получают достаточно быстрых discovery-сигналов;
- внутренние кластеры ещё недостаточно явно показывают экспертность и
  редакционную глубину;
- компактный sitemap намеренно не пушит весь long-tail, поэтому рост должен
  идти через качество выбранных URL, а не через количество URL.

## 3. Правила, которые нельзя ломать

- Не менять домен и не переносить сайт без отдельного решения.
- Не возвращать широкий sitemap.
- Не рекламировать `sitemap-bing.xml` в `robots.txt`.
- Для Google использовать только `https://tools.utildesk.de/sitemap.xml`.
- Для Bing использовать только компактный
  `https://tools.utildesk.de/sitemap-focus.xml`.
- Не отправлять в IndexNow `/api/*`, `/markdown/*`, `/feed.*`, `/llms*.txt`.
- Не превращать long-tail tool pages в глобальный `noindex`; если страница
  исключена из Google staged sitemap, она должна оставаться global
  `index,follow` и получать только `googlebot: noindex,follow`, если это
  предусмотрено политикой.
- Не делать массовые косметические resubmit без реального контентного повода.

## 4. План действий на 30 дней

## Этап 1. Зафиксировать контрольную панель

Срок: день 1.

1. Обновить документ `docs/04_operations/search_console_health.md` свежими
   числами от 2026-06-23.
2. Зафиксировать baseline:
   - GSC sitemap submitted/indexed;
   - GSC URL Inspection для 10 representative URL;
   - Bing feed status;
   - Bing `InIndex`;
   - Bing crawl errors;
   - Umami organic/search traffic;
   - публичный `site:tools.utildesk.de` sanity-check.
3. Создать короткую таблицу tracking-URL:
   - homepage;
   - `/tools/`;
   - `/ratgeber/`;
   - 10 Ratgeber URLs;
   - 20 strongest tool cards.
4. Для каждого tracking-URL хранить:
   - included in sitemap: yes/no;
   - GSC coverage state;
   - last crawl;
   - canonical state;
   - clicks/impressions;
   - internal links count;
   - external mention status.

Критерий готовности: есть один файл/таблица, где видно, какие URL мы лечим и
какой у них статус.

## Этап 2. Сузить Google sitemap до настоящего quality core

Срок: день 1-2.

1. Проверить все `116` URL текущего `sitemap.xml`.
2. Разделить их на группы:
   - core hubs;
   - Ratgeber;
   - methodology/editorial pages;
   - strongest tool cards;
   - сомнительные tool cards.
3. Убрать из Google sitemap всё, что не выдерживает планку:
   - слабые карточки без ручной редакторской глубины;
   - карточки без альтернатив/внутренних ссылок;
   - страницы с устаревшим описанием;
   - страницы, которые выглядят как generic directory entry.
4. Оставить в Google sitemap только URL, которые реально можно защищать как
   полезный редакционный контент.
5. Bing focus feed держать таким же компактным или чуть шире, но не возвращать
   long-tail.

Критерий готовности: `sitemap.xml` содержит не просто "лучшие из доступных",
а "лучшие из достаточно сильных".

## Этап 3. Усилить 10 главных Ratgeber-статей

Срок: день 2-7.

Приоритет: статьи, которые уже актуальны и могут собрать long-tail спрос:

1. Persistente KI-Memory 2026.
2. KI-Browser 2026.
3. Agentic Commerce 2026.
4. Lokale KI-Agenten 2026.
5. KI-Video 2026 nach Sora.
6. Produktivitäts-Agenten im Alltag.
7. Open-source AI agents comparison.
8. Coding-Agenten 2026.
9. AI search / agent crawlers / machine-readable websites.
10. E2A / email gateway for agents.

Для каждой статьи:

1. Проверить live URL, canonical, robots, sitemap inclusion.
2. Обновить intro так, чтобы первые 150 слов отвечали на реальный поисковый
   intent, а не звучали как журнал.
3. Добавить "Was ist neu 2026?" с конкретными продуктами и событиями.
4. Добавить "Praktische Entscheidung" или "Wann nehmen, wann nicht?".
5. Добавить FAQ из 4-6 вопросов.
6. Добавить внутренние ссылки:
   - на 3-6 tool cards;
   - на 2-4 соседние Ratgeber;
   - на category/tag hubs, если они сильные.
7. Проверить, что все упомянутые инструменты имеют ручную редактуру.
8. Если инструмент упомянут как важный, но карточка слабая, поставить её в
   очередь на редактуру перед resubmit.
9. Добавить/проверить structured data.
10. После deploy отправить только изменённые canonical HTML URLs через
    IndexNow.

Критерий готовности: каждая статья становится самостоятельной полезной страницей
с явным экспертным углом, а не просто пересказом темы.

## Этап 4. Усилить 30-40 сильнейших tool cards

Срок: день 5-14.

Выбор карточек:

1. Инструменты, которые упоминаются в Ratgeber.
2. Инструменты с высоким спросом и понятным search intent.
3. Инструменты, где Utildesk может дать практическую редакционную оценку.
4. Инструменты, где уже есть альтернативы внутри каталога.

Обязательная структура ручной правки:

1. Короткий честный TL;DR.
2. "Für wen geeignet".
3. "Typische Einsatzszenarien".
4. "Grenzen / worauf achten".
5. "Alternativen" с внутренними ссылками.
6. FAQ.
7. Обновлённый verdict.
8. Актуальность на 2026 год.
9. Немецкая и английская версия.
10. Отметка в editorial registry / source-of-truth, если применимо.

Особое внимание:

- ChatGPT
- Claude
- Gemini
- Perplexity
- OpenAI Codex
- Claude Code
- Cursor
- Cline
- OpenHands
- CrewAI
- LangGraph
- Zapier
- Make
- n8n
- Browserbase
- Apify
- Hugging Face Spaces
- Streamlit
- Gradio
- OpenClaw

Критерий готовности: сильные tool cards перестают быть каталоговыми карточками
и становятся внутренними посадочными страницами, на которые не стыдно ссылаться
из статей.

## Этап 5. Построить внутренние кластеры

Срок: день 7-18.

Сделать 5 SEO-кластеров:

### Cluster A. AI agents

- Ratgeber hub: open-source AI agents comparison.
- Tool cards: OpenClaw, OpenHands, CrewAI, LangGraph, AutoGen, Cline, Devin.
- Supporting articles: local agents, productivity agents, coding agents.

### Cluster B. Coding agents

- Ratgeber hub: Codex / Claude Code / Gemini CLI / Antigravity.
- Tool cards: OpenAI Codex, Claude Code, Cline, Cursor, GitHub Copilot,
  Replit, v0, Bolt.new.

### Cluster C. AI search and browsers

- Ratgeber hub: KI-Browser 2026.
- Tool cards: Perplexity, ChatGPT, Browserbase, Apify, WebMCP-related tools.
- Supporting articles: AI crawler visibility / machine-readable websites.

### Cluster D. Agentic commerce

- Ratgeber hub: Agentic Commerce 2026.
- Tool cards: ChatGPT, Stripe, Shopware, Zapier, Make, n8n, payment/search
  workflow tools.

### Cluster E. Local/private AI

- Ratgeber hub: Lokale KI-Agenten 2026.
- Tool cards: LM Studio, Jan AI, Ollama-related tools, local inference tools,
  NVIDIA hardware/tooling.

Для каждого кластера:

1. Назначить one main hub.
2. Добавить блок "Weiterlesen" на hub.
3. Добавить "Verwandte Werkzeuge" в статьи.
4. Добавить "In Ratgebern erwähnt" на tool cards.
5. Убедиться, что links двунаправленные.
6. Проверить, что anchor text естественный, а не одинаковый.

Критерий готовности: Google видит не набор одиночных страниц, а тематические
редакционные группы.

## Этап 6. Внешние сигналы без спама

Срок: день 10-25.

Цель: дать поисковикам доказательства, что сайт существует не в вакууме.

Действия:

1. Добавить аккуратные упоминания `tools.utildesk.de` в публичные GitHub repos,
   где это уместно:
   - README;
   - docs/resources;
   - related links;
   - без keyword stuffing.
2. Проверить уже созданные backlink-профили:
   - SaaSHub;
   - directories;
   - профили каталогов;
   - email confirmations.
3. Добавить 5-10 качественных directory/listing упоминаний, только если:
   - бесплатно;
   - без личных данных;
   - без оплаты;
   - можно указать бренд/сайт;
   - ссылка индексируемая или хотя бы профиль публичный.
4. Подготовить 3-5 нейтральных social/forum posts, но публиковать только там,
   где это не выглядит как спам:
   - practical comparison;
   - open-source AI agents list;
   - AI crawler checklist;
   - local AI agents 2026.
5. Не покупать ссылки.
6. Не делать массовый низкокачественный directory blast.

Критерий готовности: появляются первые внешние discovery-ссылки на homepage,
Ratgeber hubs и 2-3 tool cards.

## Этап 7. Bing и IndexNow discipline

Срок: постоянно после каждого publish.

После каждого значимого content release:

1. Проверить live URL.
2. Проверить canonical.
3. Проверить, что URL входит в compact sitemap, если он quality-core.
4. Отправить изменённые canonical HTML URLs:

```powershell
python scripts/indexnow_submit.py submit-git-range --rev-range HEAD~1..HEAD --wait-live
```

5. Если менялся sitemap:

```powershell
python scripts/bing_webmaster_api.py submit-feed --feed-url https://tools.utildesk.de/sitemap-focus.xml
```

6. Проверить Bing feed:

```powershell
python scripts/bing_webmaster_api.py feeds
python scripts/bing_webmaster_api.py crawl-summary --days 30
```

Критерий готовности: Bing feed остаётся компактным, `InIndex` не падает резко,
robots/5xx блокировок нет.

## Этап 8. Google GSC routine

Срок: 2 раза в неделю.

Проверять:

1. Sitemap report:
   - submitted;
   - indexed;
   - errors;
   - warnings;
   - last downloaded.
2. URL Inspection sample:
   - homepage;
   - `/tools/`;
   - `/ratgeber/`;
   - 5 последних Ratgeber;
   - 10 strongest tool cards.
3. Coverage buckets:
   - `Crawled - currently not indexed`;
   - `Discovered - currently not indexed`;
   - `Duplicate, Google chose different canonical`;
   - `Excluded by noindex`.
4. Search performance:
   - impressions;
   - clicks;
   - top pages;
   - top queries;
   - countries/devices.

Критерий готовности: через 2-4 недели хотя бы часть focus sitemap получает
impressions, а новые статьи уходят из `URL is unknown to Google`.

## Этап 9. Umami / real-user feedback

Срок: еженедельно.

Проверять:

1. Organic/search sessions.
2. Referrers:
   - Google;
   - Bing;
   - DuckDuckGo;
   - Perplexity/AI referrers, если появляются.
3. Landing pages.
4. Article engagement:
   - visits;
   - average time;
   - scroll/depth if available.
5. Pages with visits but weak internal follow-through.

Критерий готовности: мы оптимизируем не только для crawl, но и для реальных
страниц, которые уже получают признаки жизни.

## 5. План на ближайшие 7 дней

### День 1

1. Обновить `search_console_health.md` свежими числами.
2. Сформировать tracking list из 30-40 URL.
3. Проверить текущие `116` sitemap URLs.
4. Отметить слабые URL, которые не должны быть в Google sitemap.

### День 2

1. Усилить 2 Ratgeber-статьи из top-priority списка.
2. Проверить все tool cards, на которые эти статьи ссылаются.
3. Добавить недостающие внутренние ссылки.
4. Deploy.
5. IndexNow для изменённых canonical HTML URL.

### День 3

1. Усилить ещё 2 Ratgeber-статьи.
2. Добавить/починить alternatives на связанных tool cards.
3. Проверить DE/EN parity.
4. Deploy + IndexNow.

### День 4

1. Отредактировать 10 сильных tool cards.
2. Добавить двунаправленные ссылки Ratgeber <-> tool.
3. Проверить registry/source-of-truth.

### День 5

1. Отредактировать ещё 10 сильных tool cards.
2. Собрать первый AI agents cluster.
3. Проверить sitemap inclusion только для quality-core URL.

### День 6

1. Добавить внешние упоминания в публичные GitHub repos, где это уместно.
2. Проверить SaaSHub/directories email actions.
3. Подготовить список 10 безопасных backlink opportunities.

### День 7

1. Повторить GSC URL Inspection sample.
2. Повторить Bing crawl-summary.
3. Проверить Umami organic/referrers.
4. Сравнить с baseline.
5. Принять решение: ещё сужать sitemap или продолжать усиливать кластеры.

## 6. Метрики успеха

### Через 7 дней

- GSC last downloaded обновился после resubmit.
- Новые Ratgeber больше не все `URL is unknown to Google`.
- В Bing feed status вернулся в `Success`.
- Нет robots/5xx блокировок.
- Есть минимум 20 усиленных внутренних ссылок между статьями и tool cards.

### Через 14 дней

- Часть focus sitemap URL получает impressions в GSC.
- `Crawled - currently not indexed` перестаёт быть единственным состоянием для
  core pages.
- Bing `InIndex` стабилен или растёт.
- Появляются первые внешние discovery-ссылки.

### Через 30 дней

- У Google появляются регулярные impressions по нескольким Ratgeber/tool
  страницам.
- В sitemap report indexed больше не равен `0`.
- У сайта есть минимум 5 сильных тематических кластеров.
- В Umami видны поисковые/referral заходы не только случайными единицами.

## 7. Что делать, если через 30 дней нет прогресса

1. Не менять домен сразу.
2. Провести независимый quality audit 20 focus URLs.
3. Проверить mobile rendering и visible main content через Google-like fetch.
4. Проверить, не выглядит ли homepage как каталог без явного редакционного
   purpose.
5. Сузить sitemap ещё сильнее до 30-50 URL.
6. Сделать 3-5 flagship pages:
   - не карточки;
   - не каталог;
   - глубокие редакционные материалы с оригинальным сравнением.
7. Добавить более явный About/Methodology/Editorial policy блок.
8. Добрать внешние упоминания с тематически релевантных площадок.

## 8. Команды для регулярной проверки

### Live sitemap / robots

```powershell
Invoke-WebRequest -UseBasicParsing https://tools.utildesk.de/robots.txt
Invoke-WebRequest -UseBasicParsing https://tools.utildesk.de/sitemap.xml
Invoke-WebRequest -UseBasicParsing https://tools.utildesk.de/sitemap-focus.xml
```

### Bing

```powershell
python scripts/bing_webmaster_api.py smoke
python scripts/bing_webmaster_api.py feeds
python scripts/bing_webmaster_api.py crawl-summary --days 30
```

### IndexNow

```powershell
python scripts/indexnow_submit.py smoke
python scripts/indexnow_submit.py submit-git-range --rev-range HEAD~1..HEAD --wait-live
```

### Build check before deploy

```powershell
npm --prefix site run build
```

## 9. Короткое резюме

Текущая проблема не похожа на технический запрет. Google страницы получает, но
не хочет брать их в индекс; Bing сайт видит, но ранжирует слабо. Поэтому
правильная стратегия: меньше URL, больше редакционной глубины, сильнее
внутренняя перелинковка, понятные тематические кластеры и аккуратные внешние
сигналы.

Главный принцип на ближайший месяц: не ширина каталога, а доказуемая полезность
выбранных страниц.
