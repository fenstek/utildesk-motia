# Codex Prompt — Утилдеск KI-Blatt дизайн: доделать до конца

> **Дата создания:** 2026-05-29  
> **Ветка для работы:** создать новую от `master` — например `codex/ki-blatt-finish-20260529`  
> **Текущее состояние:** PR #202 смерджен в `master` (SHA `079e869d`). Cloudflare Pages задеплоил.  
> **Restore tag (безопасный откат):** `restore/pre-claude-code-design-20260529-baca47ac`

---

## 0. Прочитай сначала (token-saving order)

1. `CLAUDE.md` — обязательно, первым
2. `handoff/claude-code-design/README.md` — контекст миссии
3. `handoff/claude-code-design/TOKEN_SAVING.md` — правила экономии токенов
4. `handoff/claude-code-design/VISUAL_TARGETS.md` — список роутов и visual targets
5. `handoff/claude-code-design/reference/ki-blatt-template.html` — интерактивный React-прототип эталона
6. НЕ открывай `content/tools/`, `content/images/`, `node_modules/`, `site/dist/`, `.wrangler/`

---

## 1. Контекст: что уже сделано

Реализованы (5 коммитов, сейчас на `master`):

- **`site/src/styles/global.css`** — полная дизайн-система: шрифты Bricolage Grotesque + Source Serif 4 + JetBrains Mono, цвета `#f6f4ee` (paper), `#0c0c0a` (ink), `#c5251c` (vermillion). Активируется при `data-design="decision"` на `<html>`.
- **`site/src/layouts/BaseLayout.astro`** — `ds-nav` (тонкая полоска-навбар «utildesk · entscheidungsblatt»), блок `.decision-masthead` с «KI-Blatt.» — _но_ на главной странице он **скрыт CSS-правилом** (см. ниже).
- **`site/src/components/DecisionTemplateHome.astro`** — компонент главной: `ds-template > ds-stage > ds-frame > ds-front + ds-verdict + ds-stack + ds-evidence + ds-tasks + ds-index`. Используется в `index.astro`.
- **`site/src/pages/tools/[slug].astro`** — Tool-Akte: `akte-mast`, `akte-faktenblatt`, editorial masthead, Alternativen card grid, drop cap.
- **`site/src/pages/ratgeber/[slug].astro`** и **`ratgeber/index.astro`** — editorial reskin.
- **`site/src/pages/tools/index.astro`** — Tool-Index editorial reskin.

---

## 2. Диагностика: что именно не так

### Баг #1 — главная страница: masthead «KI-Blatt.» скрыт

В `global.css` есть правило:
```css
html[data-design="decision"]:has(.ds-template) .decision-masthead {
  display: none;
}
```
Это скрывает `.decision-masthead` (блок с «KI-Blatt.» 84px + тройная линия) на главной, потому что там есть `.ds-template`.

**Правильный результат по шаблону:** masthead должен быть ПЕРВЫМ блоком внутри `.ds-frame`, до `.ds-front`. Он не должен скрываться — он должен быть частью `DecisionTemplateHome`.

**Эталон из `ki-blatt-template.html`:**
```
DSNav  →  тонкая полоска (уже есть)
DSMasthead  →  3-колоночный блок: "Ausgabe 049" | "KI-Blatt." 84px italic | "25 Entscheidungen · 1171 Tools"
              + `border-bottom: 3px double #0c0c0a`
DSFrontDecision  →  featured article (уже есть как ds-front)
DSDecisionStack  →  2 дополнительных решения (уже есть как ds-stack)
...
```

**Что делать:**
1. Убрать CSS `display: none` из правила `:has(.ds-template) .decision-masthead`
2. Или, лучше: добавить masthead-блок внутрь `DecisionTemplateHome.astro` как первый дочерний элемент `ds-frame`, а `BaseLayout.decision-masthead` оставить только для interior-страниц

### Баг #2 — главная страница: `ds-stage` слишком тёмный / масштаб рамки

Шаблон показывает `ds-frame` как белую/пергаментную рамку на тёмном фоне `#1a1a18`. Убедись что:
- `body` background при `data-design="decision"` и `:has(.ds-template)` равен `#1a1a18` или `var(--bg)` тёмный
- `ds-frame` имеет `background: var(--paper)` (#f6f4ee)
- `ds-stage` даёт padding 64px вокруг рамки

Проверь что CSS это обеспечивает; если нет — дополни.

### Задача #3 — Legal-страницы: визуальный QA

Файлы:
- `site/src/pages/impressum.astro`
- `site/src/pages/datenschutz.astro`
- `site/src/pages/methodologie.astro`

CSS для них уже есть (`[data-design="decision"]:not(:has(.ds-template)) .legal`). Но надо:
1. Убедиться что каждый файл имеет `<section class="legal">` как wrapper
2. Локально запустить `npm run dev` и проверить визуально
3. Если типографика не соответствует (слишком маленький шрифт, неправильные отступы, неправильный цвет заголовков) — отладить CSS

### Задача #4 — Locale-эквиваленты

Файлы:
- `site/src/pages/[locale]/imprint.astro`
- `site/src/pages/[locale]/privacy.astro`
- `site/src/pages/[locale]/methodology.astro`
- `site/src/pages/[locale]/index.astro` (EN главная)
- `site/src/pages/[locale]/tools/[slug].astro`
- `site/src/pages/[locale]/ratgeber/index.astro` и `[slug].astro`

Каждый из этих файлов должен иметь такую же editorial структуру, как DE-версия. Если DE-версия исправлена — EN-эквивалент должен зеркалить эти изменения.

### Задача #5 — Visual QA по всем роутам

После каждого batch запусти `npm run dev` в `site/` и проверь:
- `localhost:4321/` — главная (masthead виден, ds-frame на тёмном фоне)
- `localhost:4321/tools/zapier/` — tool-akte (editorial masthead OK)
- `localhost:4321/tools/` — tool index (editorial)
- `localhost:4321/ratgeber/` — ratgeber index
- `localhost:4321/ratgeber/[slug]/` — один article
- `localhost:4321/impressum/` — legal page
- `localhost:4321/datenschutz/` — legal page
- `localhost:4321/methodologie/` — methodology page
- Каждый EN-эквивалент выше

---

## 3. Многоагентная архитектура (рекомендуется)

Используй **субагентов через Task tool**. Каждый субагент работает в изоляции (`isolation: "worktree"`), делает одно конкретное изменение, коммитит. Дирижёр объединяет.

```
Дирижёр (ты сам — Claude Code)
│
├── Агент A: Masthead fix (Баг #1 + #2)
│   Файлы: DecisionTemplateHome.astro, global.css
│   Проверка: npm run dev → localhost:4321/
│
├── Агент B: Legal pages QA + fix
│   Файлы: impressum.astro, datenschutz.astro, methodologie.astro, global.css
│   Проверка: 3 legal routes
│
├── Агент C: EN locale equivalents
│   Файлы: [locale]/imprint.astro, [locale]/privacy.astro, [locale]/methodology.astro
│   Зависит от: Агент B (берёт готовую структуру)
│
└── Агент D: Final visual QA
    Проверяет все роуты, скриншоты, список несоответствий
    Финальный коммит с фиксами
```

**Порядок запуска:**
1. Агент A и Агент B — параллельно (независимые файлы)
2. Агент C — после B
3. Агент D — после всех

---

## 4. Детальные инструкции по каждому batch

### Batch 1: Агент A — Masthead fix (наивысший приоритет)

**Цель:** Главная страница показывает «KI-Blatt.» masthead между навом и контентом, точно как в `ki-blatt-template.html` функция `DSMasthead`.

**Шаги:**

1. Открой `site/src/components/DecisionTemplateHome.astro`
2. Найди `<div class="ds-frame">` (открывающий тег)
3. Добавь сразу после него masthead-блок:

```astro
<div class="ds-masthead-ki">
  <div class="ds-masthead-ki-side">
    {copy.issueLine} 049<br />
    Mittwoch · 27. Mai 2026<br />
    {copy.edited}
  </div>
  <div class="ds-masthead-ki-main">
    <span>{copy.masthead}<em>.</em></span>
    <p>{copy.mastSub}</p>
  </div>
  <div class="ds-masthead-ki-side ds-masthead-ki-side-right">
    {totalGuides} {isEn ? "decisions" : "Entscheidungen"} · {toolsCount} {isEn ? "tools" : "Tools indiziert"}<br />
    0 {isEn ? "paid placements" : "bezahlte Platzierungen"}
  </div>
</div>
```

4. Убедись что в `copy` есть все нужные строки (есть: `masthead`, `issueLine`, `edited`, `mastSub`). Если нет — добавь.

5. В `global.css` добавь CSS для `.ds-masthead-ki`:

```css
.ds-masthead-ki {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: flex-end;
  gap: 32px;
  padding: 28px 56px 24px;
  border-bottom: 3px double var(--ink);
  font-family: var(--mono);
  font-size: 11px;
  color: var(--ink-soft);
  line-height: 1.7;
}
.ds-masthead-ki-main {
  text-align: center;
}
.ds-masthead-ki-main span {
  display: block;
  font-family: var(--serif);
  font-size: clamp(3.5rem, 6vw, 5.25rem);
  font-style: italic;
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1;
  color: var(--ink);
}
.ds-masthead-ki-main span em {
  font-style: inherit;
  color: var(--vermillion);
}
.ds-masthead-ki-main p {
  margin: 10px 0 0;
  font-size: 11px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--ink-soft);
}
.ds-masthead-ki-side-right {
  text-align: right;
}
@media (max-width: 720px) {
  .ds-masthead-ki {
    grid-template-columns: 1fr;
    text-align: center;
    padding: 20px 20px 18px;
  }
  .ds-masthead-ki-side,
  .ds-masthead-ki-side-right { display: none; }
  .ds-masthead-ki-main span { font-size: 3rem; }
}
```

6. Убери или закомментируй CSS-правило которое скрывает `.decision-masthead` на главной:
```css
/* УДАЛИТЬ или закомментировать: */
html[data-design="decision"]:has(.ds-template) .decision-masthead {
  display: none;
}
```
Теперь `.decision-masthead` из `BaseLayout` будет показываться на interior-страницах. На главной теперь показывается новый `.ds-masthead-ki` внутри `ds-frame`.

7. **Проверка:**
```bash
cd site && npm run dev
# открой localhost:4321/
# должен видеть: nav → (чёрный bg тёмной stage) → ds-frame с белым фоном:
#   ┌──────────────────────────────────────────────────────┐
#   │  Ausgabe 049        KI-Blatt.         25 Entsch...   │
#   │  Mittwoch·27.5.26   ══════════════    0 bezahlte     │
#   │  Redigiert...       Entscheidungs...                 │
#   ├══════════════════════════════════════════════════════╡ ← 3px double border
#   │  ENTSCHEIDUNG № 049 · AI-TOOL REVIEW                 │
#   │  Soll mein Team KI-Tools kontrolliert einführen?     │
#   ...
```

8. Коммит: `design(home): add KI-Blatt masthead block inside ds-frame`

---

### Batch 2: Агент B — Legal pages

**Цель:** `/impressum/`, `/datenschutz/`, `/methodologie/` выглядят как editorial-страницы: правильный шрифт, читаемая типографика, консистентный header/footer.

**Проверь перед началом:**
```bash
cd site && npm run dev
# открой localhost:4321/impressum/
```

Ожидаемое (при `data-design="decision"`):
- `body` bg = parchment `#f6f4ee`
- `h1` = Source Serif 4, large, слева с горизонтальной линией под ним
- `p`, `li` = Bricolage Grotesque, 17–18px, line-height 1.6, color `#3a3a35`
- `h2` = Source Serif 4, bold, с separator
- Header: тот же `ds-nav` что и везде
- Footer: такой же

**Если не соответствует:**

1. Открой `global.css`, найди блок примерно на строке 3580:
```css
html[data-design="decision"]:not(:has(.ds-template)) .legal {
```
2. Проверь/исправь CSS для `.legal` на interior-страницах — сравни с шаблоном `DSSheet()` в `ki-blatt-template.html` (строки 1404–1445 шаблона)
3. Убедись что `impressum.astro`, `datenschutz.astro`, `methodologie.astro` используют `<section class="legal">` или обёрнуты в нужный контейнер

**Коммит:** `design(legal): align impressum/datenschutz/methodologie with editorial system`

---

### Batch 3: Агент C — EN locale equivalents

**Зависит от Batch 1 и 2.**

Файлы для синхронизации:
- `site/src/pages/[locale]/index.astro` → зеркало `index.astro` (EN главная с masthead)
- `site/src/pages/[locale]/tools/[slug].astro` → зеркало `tools/[slug].astro`
- `site/src/pages/[locale]/tools/index.astro` → зеркало `tools/index.astro`
- `site/src/pages/[locale]/ratgeber/index.astro` → зеркало `ratgeber/index.astro`
- `site/src/pages/[locale]/ratgeber/[slug].astro` → зеркало `ratgeber/[slug].astro`
- `site/src/pages/[locale]/imprint.astro` → зеркало `impressum.astro`
- `site/src/pages/[locale]/privacy.astro` → зеркало `datenschutz.astro`
- `site/src/pages/[locale]/methodology.astro` → зеркало `methodologie.astro`

**Метод:** Для каждой пары DE/EN сравни структуру HTML-шаблона. Если EN-страница использует старые классы или другую структуру — приведи к такой же как DE, меняя только строки (переводы через `UI[locale]` или `copy`). CSS общий — переводить не нужно.

**Коммит:** `design(locale): sync EN locale pages with DE editorial structure`

---

### Batch 4: Агент D — Final Visual QA

**Запусти dev-сервер и проверь каждый роут:**

```bash
cd site && npm run dev
```

Чеклист для каждой страницы:

| Route | Проверить |
|---|---|
| `/` | KI-Blatt. masthead виден, 3px double border, ds-frame на тёмном bg |
| `/en/` | То же, на английском |
| `/tools/zapier/` | akte-mast с "Zapier.", Faktenblatt sidebar, drop cap |
| `/tools/ableton-live/` | То же |
| `/tools/` | Tool-index editorial layout |
| `/ratgeber/` | Article cards с breathing room |
| `/ratgeber/[любой-slug]/` | Article typography, editorial masthead |
| `/impressum/` | Legal typography, readable |
| `/datenschutz/` | То же |
| `/methodologie/` | То же |
| `/en/tools/zapier/` | EN эквивалент |
| `/en/impressum/` | EN эквивалент |

**Для каждого несоответствия** создавай отдельный мини-коммит.

**Финальный коммит:** `design(qa): final visual alignment pass`

---

## 5. Ограничения (обязательно соблюдать)

```
НЕ ТРОГАТЬ:
- content/tools/*.md и content/en/tools/*.md (контент-пайплайн)
- scripts/ (автоматизация)
- .env и конфиги деплоя
- site/public/images/, logos/ (ассеты)
- Любой файл вне site/src/ кроме CLAUDE.md и handoff/
```

```
ТОЛЬКО РЕДАКТИРОВАТЬ:
- site/src/styles/global.css
- site/src/layouts/BaseLayout.astro
- site/src/components/DecisionTemplateHome.astro
- site/src/pages/*.astro (только структура/классы, не контент)
- site/src/pages/[locale]/*.astro
- site/src/pages/tools/[slug].astro
- site/src/pages/tools/index.astro
- site/src/pages/ratgeber/*.astro
- site/src/pages/[locale]/tools/*.astro
- site/src/pages/[locale]/ratgeber/*.astro
```

---

## 6. Деплой

После завершения всех batch — **push ветки и создай PR в `master`**:

```bash
git push origin codex/ki-blatt-finish-20260529
gh pr create --base master --title "design: complete KI-Blatt editorial system" \
  --body "Completes the Entscheidungsblatt design: masthead fix, legal pages, EN locale sync, visual QA"
gh pr merge --merge --admin
```

Cloudflare Pages задеплоит автоматически.

---

## 7. Контроль качества дирижёра

После каждого агента дирижёр должен:
1. Прочитать diff (`git diff HEAD~1`) и убедиться что изменения минимальны и прицельны
2. Проверить что не тронуты запрещённые файлы
3. Подтвердить что build проходит (`npm run build` в `site/`)
4. Только тогда пускать следующего агента

---

## 8. Ожидаемый конечный результат

Живой сайт `tools.utildesk.de` должен выглядеть как `ki-blatt-template.html` с активным табом "Home":

- Тёмный фон страницы (`#1a1a18` или эквивалент)
- Белая пергаментная рамка (1440px) в центре
- Газетный masthead: «Ausgabe 049 | KI-Blatt. | 25 Entscheidungen · 1171 Tools»
- Тройная горизонтальная линия под masthead
- Featured decision с вердикт-блоком, тулами, anti-recs
- Tool-Akte с editorial masthead (уже хорошо)
- Все legal-страницы читаемы в editorial-стиле
- EN-версии зеркалят DE

---

_Промпт создан Cowork-сессией 2026-05-29 после деплоя PR #202. Сохранён в `handoff/claude-code-design/CODEX_PROMPT.md`._
