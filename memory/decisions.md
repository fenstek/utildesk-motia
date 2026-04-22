# Decisions

## 2026-04-21

## 2026-04-22

- Treat `fa1c42d11a995127f3be253eb94477252e4c79ff` as the current good backup baseline for the repo and the live site state.
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
- Treat AI retrieval as a first-class site contract, not as an afterthought:
  - keep `llms.txt`, `llms-full.txt`, feeds, catalogs, and page-level mirrors in the production codebase.
- Prefer the canonical trio for machine access to content:
  - human-facing HTML page
  - page-level JSON detail endpoint
  - page-level Markdown mirror
- Keep non-HTML agent endpoints crawlable but out of normal search result indexing via `X-Robots-Tag: noindex`.
- Do not rely on `process.cwd()/content` in the Astro app; use the shared content-root resolver so Windows pointer-file checkouts build the same as symlinked environments.
- Do not declare a fake `SearchAction` schema unless the public site exposes a stable query-parameter search contract that works server-side.
