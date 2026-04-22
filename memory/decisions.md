# Decisions

## 2026-04-21

## 2026-04-22

- Keep only one tracked markdown doc for the alternatives-render audit script: `scripts/audit_alternatives_render.md`.
- Do not keep case-only duplicate paths for the same document in git; Windows checkouts cannot represent them cleanly.
- Treat live sitemap hygiene as the first-line technical explanation for large GSC indexing error clusters on `tools.utildesk.de`.
- Keep alias redirects, but do not keep the same alias slugs as active published tool pages.
- Reserved route namespaces under `/tools/` (currently `tag`) must never be emitted as tool URLs in sitemap.
- Keep `origin/autobot` and `origin/master` aligned after manual releases; branch drift is an operational risk for tools publishing.
- `scripts/sync_autobot_to_master_ff.sh` must push from the remote-tracking ref, not assume a local `autobot` branch exists.

- `Ratgeber` publish закреплён как отдельный ручной flow поверх approved package с `opcl`, а не как часть `tools` cron.
- `scripts/cron_publish_push.sh` считать намеренно ограниченным `tools`-only publisher; его allowlist не ослаблять ради статей.
- Для import approved article package использовать `scripts/import_ratgeber_package.py`.
- Для manual article release использовать отдельный чистый checkout или worktree от свежего `origin/master`.
- `Ratgeber` hero covers must use the same lightbox contract as article inline images.
- `Ratgeber` cover rendering must respect the generated image's natural aspect ratio; do not force editorial SVG covers into a generic wide frame.
- Standalone inline article images in `ratgeber` should be rendered as dedicated figure blocks with explicit vertical spacing, not as naked markdown image paragraphs.
- If an article ships both `cover` and `workflow` editorial SVGs, the page renderer should avoid adding a second heavy frame around the artwork; the generated assets already carry their own composition.
- Hero cover SVGs should use a dense composition with minimal neutral border space, so the published page can render them large without creating a "small picture inside a big frame" effect.
