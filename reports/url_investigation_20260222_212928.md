# URL Investigation

Generated UTC: 2026-02-22T21:29:32.690Z

## snorkel

Mapping: single_row

### Sheet state

| row_index | title | status | official_url | note |
|---:|---|---|---|---|
| 175 |  | DONE | https://snorkel.ai/ | slug_repair:ok url_flags=none tags=gpt+heuristic |

### Repo md state

| file_path | title | official_url | excerpt |
|---|---|---|---|
| content/tools/snorkel.md | "Snorkel" | "https://snorkel.ai/" | Snorkel ist eine Open-Source-Plattform zur automatisierten Datenkennzeichnung und Datenvorbereitung für maschinelles Lernen. Sie ermöglicht es Unternehmen und Forschern, große Mengen unstrukturierter Daten effizient mit  |

### resolveFinalUrl state

| input_url | finalUrl | finalHost | httpStatus | ok | error |
|---|---|---|---:|---|---|
| https://snorkel.ai/ | https://snorkel.ai/ | snorkel.ai | 200 | true |  |

Redirect chain:

- 200 https://snorkel.ai/

## lex

Mapping: single_row

### Sheet state

| row_index | title | status | official_url | note |
|---:|---|---|---|---|
| 294 |  | DONE | https://lex.page/ | slug_repair:ok url_flags=none tags=gpt+heuristic |

### Repo md state

| file_path | title | official_url | excerpt |
|---|---|---|---|
| content/tools/lex.md | "Lex" | "https://lex.page/" | Lex ist ein innovatives KI-Tool, das speziell für das Schreiben und die kreative Textproduktion entwickelt wurde. Es unterstützt Nutzer dabei, produktiver zu arbeiten, indem es Schreibprozesse automatisiert und kreative  |

### resolveFinalUrl state

| input_url | finalUrl | finalHost | httpStatus | ok | error |
|---|---|---|---:|---|---|
| https://lex.page/ | https://lex.page/ | lex.page | 200 | true |  |

Redirect chain:

- 200 https://lex.page/

## lifelike

Mapping: single_row

### Sheet state

| row_index | title | status | official_url | note |
|---:|---|---|---|---|
| 295 |  | NEEDS_REVIEW | https://lifelike.io/ | validated:AI qid=Q494002 sl=29 wikidata_only blocked_official_url:not_selected used_gpt=0 \| url_unresolved \| url_repaired(method=fallback_domain_guess) \| auto_repaired_full \| blocked:ambiguous_entity (lifelike) — redirected to junk |

### Repo md state

| file_path | title | official_url | excerpt |
|---|---|---|---|
| content/tools/_lifelike.md | "Lifelike" | "https://lifelike.io/" | Lifelike ist eine innovative KI-gestützte Plattform, die entwickelt wurde, um digitale Assistenten und Automatisierungslösungen besonders realistisch und effizient zu gestalten. Mit fortschrittlichen Algorithmen ermöglic |

### resolveFinalUrl state

| input_url | finalUrl | finalHost | httpStatus | ok | error |
|---|---|---|---:|---|---|
| https://lifelike.io/ | https://lifelike.io/ | lifelike.io | 200 | true |  |

Redirect chain:

- 200 https://lifelike.io/

## Breakage Conclusions

| slug | stage | conclusion |
|---|---|---|
| snorkel | S1 bad URL already in Sheet | Исторически URL был заменен fallback-логикой на неофициальный домен; сейчас исправлено на snorkel.ai и синхронизировано в repo. |
| lex | S1 bad URL already in Sheet | Исторически URL в Sheet был parking/junk (dn.org), откуда попал в publish; сейчас исправлено на lex.page и синхронизировано в repo. |
| lifelike | S3 ambiguous entity/wrong tool | Сущность не подтверждена однозначно; оставлен в NEEDS_REVIEW и страница отключена (_lifelike.md + redirect). |
