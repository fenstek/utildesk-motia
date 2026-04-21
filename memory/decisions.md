# Decisions

## 2026-04-21

## 2026-04-22

- Treat live sitemap hygiene as the first-line technical explanation for large GSC indexing error clusters on `tools.utildesk.de`.
- Keep alias redirects, but do not keep the same alias slugs as active published tool pages.
- Reserved route namespaces under `/tools/` (currently `tag`) must never be emitted as tool URLs in sitemap.
- Keep `origin/autobot` and `origin/master` aligned after manual releases; branch drift is an operational risk for tools publishing.
- `scripts/sync_autobot_to_master_ff.sh` must push from the remote-tracking ref, not assume a local `autobot` branch exists.

- `Ratgeber` publish закреплён как отдельный ручной flow поверх approved package с `opcl`, а не как часть `tools` cron.
- `scripts/cron_publish_push.sh` считать намеренно ограниченным `tools`-only publisher; его allowlist не ослаблять ради статей.
- Для import approved article package использовать `scripts/import_ratgeber_package.py`.
- Для manual article release использовать отдельный чистый checkout или worktree от свежего `origin/master`.
