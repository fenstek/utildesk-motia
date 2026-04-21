# Decisions

## 2026-04-21

- `Ratgeber` publish закреплён как отдельный ручной flow поверх approved package с `opcl`, а не как часть `tools` cron.
- `scripts/cron_publish_push.sh` считать намеренно ограниченным `tools`-only publisher; его allowlist не ослаблять ради статей.
- Для import approved article package использовать `scripts/import_ratgeber_package.py`.
- Для manual article release использовать отдельный чистый checkout или worktree от свежего `origin/master`.
