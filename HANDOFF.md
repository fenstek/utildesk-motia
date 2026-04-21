# Handoff

## What Changed

- Добавлен безопасный import approved `ratgeber` packages: `scripts/import_ratgeber_package.py`
- Зафиксирован ops-guardrail: `tools` cron и `ratgeber` publish должны жить раздельно
- Добавлен runbook: `docs/04_operations/ratgeber_publish.md`
- Импортирована и подготовлена к production release статья `wie-agentische-developer-workflows-gerade-produktionsreif-werden-einordnung-prax`

## Release Note

Если понадобится следующая article release:

1. взять approved package с `opcl`
2. открыть чистый checkout от свежего `origin/master`
3. выполнить `python scripts/import_ratgeber_package.py --package-dir ...`
4. проверить diff только по `content/ratgeber` и `content/images/ratgeber`
5. коммитить и публиковать отдельно от `tools`
