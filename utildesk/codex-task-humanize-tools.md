# Codex Task: Очеловечивание tool-страниц Utildesk Motia

**Репозиторий:** `fenstek/utildesk-motia`
**Контекст:** Utildesk Motia — каталог из 1171 AI-инструментов. Текущий статус: ~80% страниц используют автоматический template-fill (одни и те же фразы вроде "Prüfpunkt für {tool}", "Praxislauf mit {tool}", "Übergabe mit {tool}" встречаются на десятках страниц дословно). Это создаёт антисигналы для Google Helpful Content и подрывает обещание "redaktionell geprüft".

## Контекстная аналитика (база для решений)

На сэмпле 46 страниц выявлено:
- Boilerplate `Prüfpunkt für` встречается на 13% всех страниц
- Семь фраз (`Praxislauf mit`, `Qualitätssicherung in`, `Übergabe mit`, `kleinen Vorher-nachher-Vergleich`, `Guter Start für`, `Risiko bei`, `spart wenig, wenn Einrichtung, Kontrolle und Nacharbeit`) — на 7%
- Только 17% случайных страниц имеют `zuletzt geprüft`
- 52% случайных страниц содержат дословные внутренние повторы фраз 60+ символов

## Цель задания

Не переписать 1171 страницу вручную. Цель — **поэтапная стратегия** с измеримыми результатами и **отказом от ложных сигналов редактуры**.

---

## Этап 0: Аудит (1 день)

Запусти из корня репозитория:

```bash
# Скрипт C:\projects\utildesk-ops\audit-templates.py
# Должен пройти по всем content/tools/*.md (или эквиваленту) и собрать:
```

Сохранить отчёт в `reports/template-audit-{date}.json`:

```json
{
  "totalTools": 1171,
  "templatePhrases": {
    "Prüfpunkt für": { "count": 156, "slugs": [...] },
    "Praxislauf mit": { "count": 89, "slugs": [...] },
    ...
  },
  "duplicateBlocks": [
    { "phrase": "Datenqualität, Laufzeit, Wartbarkeit, Ergebnisstabilität und Akzeptanz",
      "occurrences": 47,
      "slugs": [...] }
  ],
  "tools": [
    { "slug": "clickhouse",
      "bodyLen": 9883,
      "editorialBlocks": ["Redaktionelle Einschätzung"],
      "hasLastReviewed": false,
      "templatePhraseCount": 8,
      "internalRepeats": 3,
      "tier": "C"
    }
  ]
}
```

**Tier classification:**
- **A** — упомянут в ратгеберах, переписан вручную (определяется по white-list из 25 ратгеберов)
- **B** — `hasLastReviewed=true` И `templatePhraseCount < 2`
- **C** — `templatePhraseCount >= 3` ИЛИ `internalRepeats >= 2`
- **D** — body < 4000 симв ИЛИ нет редакторских блоков вовсе

## Этап 1: Удалить ложные сигналы редактуры (1-2 дня)

**Принцип: лучше честный auto-text без претензий, чем фейковая «редактура».**

Перепиши генератор tool-страниц (вероятно где-то в `src/content/tools/` или скриптах под `scripts/`) так, чтобы:

### 1.1. Убрать template-fill блоки
Удалить блоки **из всех tier-C и tier-D страниц**:
- `Prüfpunkt für {tool}: ...`
- `Praxislauf mit {tool}: ...`
- `Qualitätssicherung in {tool}: ...`
- `Übergabe mit {tool}: ...`
- `Guter Start für {tool}: ...`
- `Risiko bei {tool}: ...`
- Все универсальные boilerplate-фразы (см. отчёт аудита)

Эти блоки сейчас вставляются автоматически и выглядят как редактура, но Google их распознаёт как scaled content.

### 1.2. Убрать ложное "Kuratiert von Utildesk Redaktion"
Для tier-C/D заменить на нейтральное:
```
Eintrag automatisch erstellt aus öffentlichen Quellen · Stand: {generatedAt}
```

Для tier-A/B оставить как есть.

### 1.3. Убрать ложное "zuletzt geprüft"
Если страницу никто реально не правил руками — убрать поле. Не подделывать дату для красоты.

### 1.4. Поменять формулировку на главной
Сейчас: "Erst redaktionelle Einordnung, dann Tools"
Заменить на правдивое: "25 redaktionelle Ratgeber + 1171 indizierte Tools mit öffentlichen Quellen"

## Этап 2: Расширить ратгеберный слой (постоянная работа)

Tier-A (≈30 страниц) — это страницы, которые **уже** упомянуты в ратгеберах. Это твой настоящий E-E-A-T актив. Их надо:

1. Помечать в frontmatter: `tier: A`, `lastReviewed: <date>`, `mentionedIn: [ratgeber-slug1, ratgeber-slug2]`
2. Автоматически проставлять `zuletzt geprüft` на основе даты последнего редактирования файла в git
3. Внутри страницы давать **прямые ссылки** на ратгеберы, где этот tool разбирается («→ Wir haben {Tool} in unserem Ratgeber zu {Topic} analysiert»)

**Бэклог для редактуры (приоритет):**
- Все 84 страницы с `affiliateUrl` (там есть монетизация → ROI на редактуру)
- Все страницы, упомянутые в ратгеберах, но без `tier: A`
- Топ-50 по поисковому объёму в DACH (нужен Ahrefs/Semrush)

## Этап 3: Категории и фасеты (1 день)

В каталоге сейчас бардак:
- `AI` (737) и `AI Agents`, `AI Infrastructure`, `AI Chatbots & Assistenten`
- `Automatisierung` (14) и `Automation` (1)
- `Entwickler-Tools` (11) и `Developer` (125)
- `Design` (54) и `Design & Kreativitat` (1)
- `Audio` (43) и `Audio & Video` (5)

**Задание:** в `scripts/normalize-categories.ts`:
1. Создать canonical map: `Automation` → `Automatisierung`, `Developer` → `Entwickler-Tools`, `Design & Kreativitat` → `Design`
2. Пройти по всем tool-md файлам и нормализовать поле category
3. Категория `AI` (737 шт) **слишком общая** — разбить по тегам на под-категории: AI Chatbots, AI Coding, AI Writing, AI Image, AI Audio, AI Research, AI Agents, AI Infrastructure
4. Обновить `/api/tools.json` и sitemap после нормализации

## Этап 4: Защита от Helpful Content Update (1 день)

### 4.1. Noindex для самых тонких страниц
Все tier-D с `bodyLen < 4000` ИЛИ без affiliate/трафика — поставить `<meta name="robots" content="noindex,follow">`. Это убирает их из индекса, но оставляет ссылочный сок.

### 4.2. JSON-LD только для tier A/B
SoftwareApplication schema-org markup оставить только для страниц, которые мы реально проверили. Для tier-C/D — никакого rich-schema (без ratings, без author, без datePublished).

### 4.3. Honest pages — без претензий
Tier-C/D страницы должны открыто признавать формат:
```
> Dieser Eintrag wurde automatisch aus öffentlichen Anbieterinformationen
> erstellt und nicht redaktionell geprüft. Für eine kuratierte Einordnung
> siehe unsere Ratgeber: [link].
```

Это снимает претензию «kuratiert» и одновременно перенаправляет трафик на ратгеберы (которые реально редактированы).

---

## Критерии готовности (Definition of Done)

- [ ] `reports/template-audit-{date}.json` существует и показывает tier для всех 1171 tool
- [ ] Boilerplate-фразы исключены из tier-C/D генерации (verify: повторный аудит → 0 страниц с `Prüfpunkt für` если они не tier-A)
- [ ] Tier-A страницы имеют корректное `lastReviewed` из git history
- [ ] Категории нормализованы (verify: `cat tools.json | jq '[.items[].category] | unique | length'` < 15)
- [ ] Tier-D страницы имеют `noindex,follow`
- [ ] Главная страница и описания не содержат необоснованных claims про "kuratiert" для tier-C/D
- [ ] Полный rebuild + deploy + IndexNow ping для обновлённых URL

---

## ВАЖНО: ограничения

1. **ЗАПРЕТ из CLAUDE.md/AGENTS.md:** Не модифицировать `.md` файлы в `fenstek/utildesk-motia` без отдельного per-change подтверждения от Сергея. **Применительно к этой задаче:** Codex генерирует **patch-set** (diff-предложения), Сергей review-ит и approve-ит блоками.
2. Никаких массовых LLM-перезаписей текста tools (это создаст ту же проблему, что уже есть). Удаление шаблонов — это **уменьшение** контента, не добавление.
3. Ратгеберы НЕ трогать.

## План коммитов

```
chore(audit): add template-detection script + initial report
refactor(generator): remove template-fill boilerplate from tier-C/D
chore(categories): normalize taxonomy, dedupe variants
feat(tier-d): mark thin pages as noindex,follow
feat(honest): add disclosure block to non-curated entries
chore(rebuild): regenerate JSON catalog + sitemap + ping IndexNow
```

Каждый коммит должен быть squash-able, ≤200 lines diff где возможно.
