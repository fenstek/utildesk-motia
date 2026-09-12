# Bounded SEO recovery core — 2026-09-13

This release is based on `797b2dad` in live recovery mode. The committed
allowlist is `site/shared/recoveryManifest.mjs`; it is consumed by static SEO
policy, sitemap generation and Pages edge middleware. The sitemap remains
DE-only and contains exactly 20 canonical URLs: the existing 13 plus the seven
approved coding-core URLs. EN policy is not expanded.

## Evidence supplied for the approved additions

Before this change, live all-seven route checks were HTTP 200, self-canonical,
and carried global `noindex` plus `X-Robots-Tag: noindex,follow`.

GSC URL Inspection evidence for the five established additions:

- `/tools/openai-codex/`: Crawled — currently not indexed; last crawl 2026-08-09.
- `/tools/claude/`: Crawled — currently not indexed; last crawl 2026-04-12.
- `/tools/cursor/`: Crawled — currently not indexed; last crawl 2026-07-24.
- `/tools/github-copilot/`: Crawled — currently not indexed; last crawl 2026-04-12.
- `/ratgeber/coding-agenten-2026-codex-claude-code-und-gemini-cli-im-entwickler-workflow/`:
  Crawled — currently not indexed; last crawl 2026-08-13.

All five reported `ALLOWED`, `INDEXING_ALLOWED`, fetch `SUCCESSFUL`, and
self-canonical. The Vibe Coding and Multi-model Coding URLs were unknown in
GSC; no GSC state is inferred for them.

## Runtime D1 gate

No D1 import, publish, Worker deployment or Pages deployment is part of this
release. The runtime D1 projection remains out of scope for the live write.
Before any future runtime release, prepare a paired DE/EN content projection,
take the required fresh D1 backup, validate source and asset hashes, verify the
configured database identity, and run the bounded runtime release checks. This
document is evidence and a gate, not an import manifest.
