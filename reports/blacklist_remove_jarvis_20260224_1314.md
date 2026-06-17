# BLACKLIST: jarvis — Отчёт об удалении

**Дата:** 2026-02-24
**Исполнитель:** Claude Code (fix/blacklist-jarvis)
**Ветка:** `fix/blacklist-jarvis` → `master`

---

## Причина блокировки

- `official_url` = `https://jarvis.com/` — **не AI-инструмент** (parked/generic domain)
- Запись является фантомом/алиасом для [jasper](https://www.jasper.ai/) — уже есть корректная страница `/tools/jasper`
- Status до: `DONE` с пустым `title/short_hint` — признак failed pipeline

---

## Изменения

### 1. Google Sheet (source of truth)

| Поле | До | После |
|------|----|-------|
| `row_index` | 320 | 320 |
| `slug` | `jarvis` | `jarvis` |
| `topic` | `Jarvis (Jasper)` | `Jarvis (Jasper)` |
| `official_url` | `https://jarvis.com/` | `https://jarvis.com/` _(не изменялся)_ |
| `status` | `DONE` | **`BLACKLIST`** |
| `notes` (before) | `ALT_SEED \| preflight:blocked: missing official_url; missing/invalid tags \| url_unresolved \| url_repaired(method=fallback_domain_guess) \| auto_repaired_full \| qc_passed:promote_in_progress_to_new \| retry_stuck_in_progress:2026-02-23T06:54:32.086Z` | _(см. ниже)_ |
| `notes` (after) | _(см. выше)_ | `…\| BLACKLIST: invalid official_url (jarvis.com not AI tool), phantom/alias; 2026-02-24` |

### 2. Файлы репозитория

| Действие | Файл |
|----------|------|
| **УДАЛЁН** | `content/tools/jarvis.md` |
| не существовал | `content/images/tools/jarvis.webp` |
| **ДОБАВЛЕН 301** | `site/public/_redirects` |

#### Добавленный redirect (`site/public/_redirects`):
```
# jarvis BLACKLIST (invalid official_url: jarvis.com not an AI tool; phantom/alias for jasper)
/tools/jarvis    /tools/    301
/tools/jarvis/   /tools/    301
```

---

## Проверки

### Build
```
npm run build — SUCCESS
287 page(s) built in ~37s
Sitemap: 284 URLs
```

### Jarvis в sitemap
```
grep jarvis site/dist/sitemap.xml → NOT FOUND ✅
```

### Jarvis в dist
```
ls site/dist/tools/ | grep jarvis → NOT FOUND ✅
```

### Redirect в _redirects
```
grep jarvis site/public/_redirects:
  /tools/jarvis    /tools/    301
  /tools/jarvis/   /tools/    301
✅
```

---

## Post-check (ожидаемый после деплоя)

```bash
curl -I https://tools.utildesk.de/tools/jarvis/
# HTTP/2 301
# location: /tools/
```

---

## Файлы изменённые в коммите

```
D content/tools/jarvis.md
M site/public/_redirects
A reports/blacklist_remove_jarvis_20260224_1314.md
```
