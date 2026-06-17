# AUDIT_DONE_SUSPICIOUS_OFFICIAL_URL.md

Defense-in-depth post-publish audit for `DONE` rows.
Finds rows whose `official_url` is suspicious **after** they have already
been published — catching cases that slipped through pre-publish gates.

---

## Цель

Pre-publish gates (`qc_before_publish.mjs`, `audit_publish_preflight.mjs`) защищают
от добавления плохих строк в `NEW`. Но некоторые URL могут попасть в `DONE` если:

- `url_policy` правила не покрывали паттерн на момент публикации (например,
  до v2.5 `introvert.com/?domain=...` проходило как валидный URL)
- Инструмент был добавлен вручную без прохода через autogen-гейты
- Wikidata/DDG вернул неправильный URL, который прошёл hostname check

---

## Критерии (flags)

| Флаг | Условие | Пример |
|---|---|---|
| `redirector_query` | Query содержит `domain=`, `redirect=`, `url=`, `dest=`, `target=`, `r=`, `u=`, `destination=` | `introvert.com/?domain=ghostwriter.io` |
| `denied_host:*` | Host в `DENY_HOSTS` (wikipedia, соцсети, `introvert.com`, ...) | `introvert.com/...` |
| `too_generic_root` | `huggingface.co` или `github.com` с менее чем 2 сегментами пути | `huggingface.co/SingleOrg` |
| `suspicious_url_pattern` | URL содержит `gov`, `city`, `utm_`, `/wiki/`, ... | любой govsite.gov |
| `wrong_entity_domain:*` | Домен явно другой сущности (Hasbro для transformers) | `transformers.hasbro.com` |
| `redirected_to_denied_final_host` | После `resolveFinalUrl()` final host в `DENY_HOSTS` (`dot-tech.org`, `dot-attorney.org`, ...) | `looker.org -> dot-attorney.org` |
| `redirected_to_parking_or_domain_sale` | Final URL ведёт на parking/domain-sale страницу | `dan.com/buy-domain/...`, `.../domain-for-sale` |
| `final_host_parking_provider` | Final host — известный parking/domain-sale provider | `sedo.com`, `dan.com`, `afternic.com` |
| `final_url_matches_denied_pattern` | Final URL match deny pattern (`/buy-domain`, `/domain-for-sale`, ...) | `https://example.com/domain-for-sale` |
| `final_url_suspicious_content_hub` | Final URL похож на контент-хаб/статью, не на продуктовую страницу | `https://somehub.com/blog/tool-x` |
| `suspicious_tld_org_net:*` | Host совпадает с `<slug>.org` или `<slug>.net`, не в allowlist OSS | `tableau.org` для slug `tableau` |
| `hostname_mismatch` | Токены slug не встречаются в hostname | `example.com` для slug `myproduct` |

### Severity
- **Blocking** (✗): `redirector_query`, `denied_host`, `too_generic_root`, `wrong_entity_domain`, `suspicious_url_pattern`, `redirected_to_denied_final_host`, `redirected_to_parking_or_domain_sale`, `final_host_parking_provider`, `final_url_matches_denied_pattern` — URL однозначно неверный
- **Review** (△): `final_url_suspicious_content_hub`, `suspicious_tld_org_net`, `hostname_mismatch` — требует ручной проверки

---

## Запуск

```bash
# Dry-run (default) — только отчёт, без изменений
node scripts/audit_done_suspicious_official_url.mjs

# Применить: перевести flagged строки в NEEDS_REVIEW
node scripts/audit_done_suspicious_official_url.mjs --apply=1

# Ограничить выборку
node scripts/audit_done_suspicious_official_url.mjs --limit=100

# Только определённые slug'и
node scripts/audit_done_suspicious_official_url.mjs --only=ghostwriter,tableau

# JSON-вывод (для парсинга)
node scripts/audit_done_suspicious_official_url.mjs --json

# Комбо: проверить конкретные + применить
node scripts/audit_done_suspicious_official_url.mjs --only=ghostwriter,tableau,generative-pre-trained-transformer --apply=1
```

---

## Примечания Notes field

При `--apply=1` в поле `notes` строки добавляется:
```
post_publish_qc:<reason>; prev_status=DONE
```

Чтобы восстановить строку после ручной правки URL:
1. Исправить `official_url` в Google Sheet
2. Сменить `status` → `NEW`
3. Строка будет перепубликована следующим cron-ом

---

## Интеграция в cron (опционально)

В `cron_publish_push.sh` добавлен опциональный dry-run шаг:

```bash
POST_PUBLISH_URL_AUDIT=1 bash scripts/cron_publish_push.sh
```

Шаг 6 запускает `audit_done_suspicious_official_url.mjs --json` и выводит:
```
[cron] done-url-audit: checked=210 flagged=3
[cron] WARN: 3 DONE rows have suspicious official_url -> run ...--apply=1 manually
```

Статусы **не меняются** автоматически — только информирование.

---

## Allowlist для .org / .net

OSS-проекты, для которых `.org` является каноническим доменом, не блокируются:
`gimp.org`, `inkscape.org`, `blender.org`, `libreoffice.org`, `mozilla.org`,
`python.org`, `pytorch.org`, `tensorflow.org`, `jupyter.org`, `postgresql.org` и другие.

Полный список: константа `ORG_TLD_ALLOWLIST` в `audit_done_suspicious_official_url.mjs`.
