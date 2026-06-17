# test_status_invariants

Назначение: зафиксировать инварианты статусов вокруг `publish_one_slug`.

Что проверяет:
- `DISABLED` и `BLACKLIST` никогда не считаются publishable;
- `NEEDS_REVIEW` по умолчанию блокируется;
- `--allow-needs-review` переводит только в режим локального rebuild без status writes;
- любые переходы из `DISABLED` / `BLACKLIST` / `NEEDS_REVIEW` в `IN_PROGRESS` / `DONE` запрещены.

Запуск:

```bash
node scripts/test_status_invariants.mjs
```

Гарантия:
- тест не читает Sheet;
- тест не пишет markdown;
- тест не требует сети и проверяет только чистую guard-логику.
