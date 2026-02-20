# Utildesk Motia — Automatisierung (Google Sheet → Content → Site)

Этот файл фиксирует текущее рабочее состояние автоматизации проекта Utildesk Motia.

КЛЮЧЕВОЕ ПРАВИЛО
- Картинки НЕ генерируем
- Используем официальные фавиконы и иконки брендов (official_url / SimpleIcons / favicon endpoints)
- Генерация изображений исключена из обязательного пайплайна
- `content/tools/_*.md` считаются disabled/ignored и должны пропускаться всеми guard-скриптами (включая `check_duplicates.mjs`)

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
5) Если `content/tools/<slug>.md` уже tracked на pre-commit этапе: `scripts/sheet_set_status.mjs <row_number> DONE`
6) Если на pre-commit этапе `md missing/untracked`: НЕ ставим `ERROR`, а откладываем финализацию (defer)
7) После commit (в wrapper): `node scripts/test_run_9_full.mjs --finalize-deferred`
   - если post-commit `exists + tracked` → `DONE`
   - иначе → `ERROR` с причиной `PUBLISH_ERROR: md missing/untracked post-commit`

Если на шагах 2–4 возникает ошибка и `row_number` уже известен:
- `scripts/sheet_set_status.mjs <row_number> ERROR`

### Two-phase status finalization (pre-commit defer, post-commit finalize)
- Почему: `git ls-files` на pre-commit может вернуть `untracked` для только что созданного md, хотя в этом же cron-run файл позже попадает в commit.
- Правило: guard `missing/untracked` не должен немедленно переводить строку в `ERROR`.
- Маркер defer в логах: `PUBLISH_DEFERRED: pre-commit md missing/untracked`.
- Пост-commit ошибка: `PUBLISH_ERROR: md missing/untracked post-commit`.
- Технически отложенные проверки сохраняются во временный файл `/tmp/utildesk_deferred_publish_checks.json`.
- Для локальной проверки без Google/сети: `DRY_STATUS_LOGIC=1 node scripts/test_run_9_full.mjs --self-test-status-logic`.

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

## STATUS PIPELINE (Lifecycle)

Row statuses control autogen deduplication, publishing, and terminal states:

### Publishing Statuses (picked by sheet_get_next_new.mjs)
- **NEW** - Ready for publishing. Picked by orchestrator → IN_PROGRESS → DONE/ERROR.

### Working Statuses (transient)
- **IN_PROGRESS** - Currently being processed by test_run_9_full.mjs.

### Terminal Statuses (published)
- **DONE** - Successfully published. Has MD file. Never reprocessed.

### Review Statuses (require manual action)
- **NEEDS_REVIEW** - Uncertain entity or suspicious URL. Set by autogen when validation is unclear. Blocks publishing until manually reviewed and changed to NEW.
- **REBUILD** - Valid AI tool but wrong/outdated data. Blocks publishing until data is fixed and status changed to NEW.
- **ERROR** - Processing failed. Needs investigation. Can be changed to NEW to retry.
- **DISABLED** - Manually turned off. Can be changed to NEW to re-enable.

### Exclusion Status (permanent)
- **BLACKLIST** - NOT an AI tool (wrong entity, city, person, generic software). NEVER publish. EXCLUDED from autogen deduplication (allows corrected entries later).

### Autogen Deduplication Rules
- NEW, DONE, IN_PROGRESS, ERROR, NEEDS_REVIEW, REBUILD, DISABLED: Block duplicate topic/slug/QID/URL
- BLACKLIST: Does NOT block (allows autogen to retry with corrected Wikidata matches)

### Publishing Rules (sheet_get_next_new.mjs)
- Picks: NEW only
- Ignores: All other statuses (BLACKLIST, NEEDS_REVIEW, REBUILD, DISABLED, ERROR, IN_PROGRESS, DONE)

---

# Cron Autopilot (Publish + Commit/Push + PR merge) — Stand 2026-02-07

## Ziel
Vollautomatische Veröffentlichung neuer Tool-Seiten:
- Cron läuft auf VPS
- Generiert neue `content/tools/*.md` aus Google Sheet
- Commit/Push passiert **nur**, wenn neue/änderte MD entstanden sind
- Änderungen gehen **nicht direkt nach master**, sondern:
  - push nach `autobot`
  - PR `autobot -> master`
  - Merge per `gh pr merge --merge --admin`
- Cloudflare Pages deployt automatisch nach Merge in `master`

## Cron Jobs (root crontab)
```cron
0 */6 * * * flock -n /tmp/utildesk-motia_publish.lock bash -lc 'cd /opt/utildesk-motia && bash scripts/cron_publish_push.sh' >> /var/log/utildesk-motia/publish.log 2>&1
15 */12 * * * flock -n /tmp/utildesk-motia_sheet.lock bash -lc 'cd /opt/utildesk-motia && FETCH_TIMEOUT_MS=6000 WIKIDATA_MIN_SITELINKS=15 AUTOGEN_MAX_LOOPS=200 node scripts/sheet_ai_autogen_9_strict_v2.mjs 20' >> /var/log/utildesk-motia/sheet.log 2>&1
```

### Locks / Logs
- Publish Lock: `/tmp/utildesk-motia_publish.lock`
- Sheet Lock: `/tmp/utildesk-motia_sheet.lock`
- Publish Log: `/var/log/utildesk-motia/publish.log`
- Sheet Log: `/var/log/utildesk-motia/sheet.log`

## Wrapper Script
Pfad: `scripts/cron_publish_push.sh`

Verhalten (Kurzfassung):
1) `git fetch --all --prune`
2) `git checkout autobot` (falls nicht vorhanden: erstellen)
3) `git reset --hard origin/autobot` (sauberer Zustand)
4) `node scripts/test_run_9_full.mjs 3`
5) Prüft Änderungen via `git status --porcelain`
6) **Allowlist**: commit/push nur, wenn Änderungen ausschließlich in:
   - `content/tools/*.md`
7) Commit: `content: autogen tools (YYYY-MM-DD HH:MM UTC)`
8) Push nach `origin/autobot`
9) PR suchen/erstellen (Logik):
   - Suche offenen PR: `gh pr list --head autobot --base master --state open`
   - Falls gefunden: PR-Nummer verwenden, kein create nötig
   - Falls nicht gefunden: `gh pr create --base master --head autobot ...`
   - Falls create fehlschlägt (PR existiert bereits, Rate-limit): erneut suchen
   - Nur wenn weder PR gefunden noch create möglich → `exit 0` (kein Merge möglich)
   - **create-Fehler blockiert NICHT den Merge** (kein `exit 0` bei vorhandenem PR)
10) Merge PR automatisch per:
   - `gh pr merge --merge --admin --delete-branch=false <PR_NUMBER>`
   - `gh pr merge` läuft **immer**, wenn PR-Nummer bekannt ist

## Hinweise / Risiken
- GitHub Branch Protection verlangt PR (master ist geschützt). Lösung: Autobranche + PR + Admin-merge.
- Git Operations laufen über GitHub CLI (`gh auth status -h github.com` muss OK sein).
- Wenn `gh` Token/Session ausfällt: cron stoppt beim PR/Merge → dann `publish.log` prüfen.
- **Typischer Dauerfall**: PR bleibt offen (z.B. manuell geöffnet oder nach erstem Commit). Jeder cron-Run findet den PR per `gh pr list` und geht direkt zu `gh pr merge`. `gh pr create` wird in diesem Fall nie aufgerufen.

### PR-Flow Troubleshooting
- Suche offener PRs: `gh pr list --head autobot --base master --state open`
- Manueller Merge: `gh pr merge --merge --admin --delete-branch=false <PR_NUMBER>`
- Logs prüfen auf: `open PR found: #NNN` (PR gefunden) oder `PR created: #NNN` (neu erstellt)

## Schnelltests
- Manuell Publish-Lauf:
```bash
cd /opt/utildesk-motia && bash scripts/cron_publish_push.sh
```
- Cron anzeigen:
```bash
crontab -l
```
- Logs:
```bash
tail -n 200 /var/log/utildesk-motia/publish.log
tail -n 200 /var/log/utildesk-motia/sheet.log
```
