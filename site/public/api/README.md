# Utildesk public content endpoints

These endpoints expose the public Utildesk directory and editorial guides as read-only content. They are not APIs for operating the third-party products listed in the directory.

The JSON catalogs and feeds are intentionally fetchable with `X-Robots-Tag: noindex`. Canonical HTML pages keep their normal search-indexing directives.

`GET /api/openapi.json` is a static OpenAPI 3.1 description of the two catalog GET endpoints and their observed top-level JSON fields. It does not describe detail routes or write operations.

## Tool catalog

- `GET /api/tools.json` returns the German tool directory catalog as JSON (`version: 1`). Its `items` array contains the currently public tool records.
- `GET /api/tools/<slug>.json` returns a tool detail record, including its canonical page URL, Markdown mirror URL, and editorial content when that slug is available.
- `GET /markdown/tools/<slug>.md` returns the Markdown mirror of a tool page.
- English catalog and detail routes are available under `/en/api/` and `/en/markdown/`.

The Pages Function can proxy `/api/tools.json` to the content Worker when the tool runtime is enabled. Individual tool detail JSON and Markdown routes are proxied only when the runtime is enabled for the requested slug. With the runtime disabled or unavailable, Pages falls back to the static catalog or frozen tool artifacts. The runtime is controlled independently from the Ratgeber content path.

## Ratgeber catalog

- `GET /api/ratgeber.json` returns the German public guide catalog as JSON (`version: 1`).
- `GET /api/ratgeber/<slug>.json` returns a guide detail record with canonical and Markdown URLs plus editorial content.
- `GET /markdown/ratgeber/<slug>.md` returns the Markdown mirror of a guide.
- English catalog and detail routes are available under `/en/api/` and `/en/markdown/`.

The Ratgeber JSON and Markdown endpoints are generated from published content during the static site build. The feeds are separate discovery resources: `GET /feed.xml` is RSS, and `GET /feed.json` is JSON Feed. English feed variants use `/en/feed.xml` and `/en/feed.json`.

## Use and limits

- Derive slugs from a catalog item instead of guessing them. A detail route can be absent for a retired item; use the canonical HTML page as the fallback source.
- Cite the canonical HTML page. For current pricing, availability, or provider capabilities, verify the linked official provider source.
- No authentication, write, transaction, MCP, OAuth, or vendor-operation contract is published here. Treat the content endpoints as read-only.
- `robots.txt` and `Content-Signal` state crawler preferences. They are voluntary instructions, not access controls, and they cannot force a crawler to comply. Do not put sensitive or restricted content on a public endpoint on the assumption that these signals protect it.
