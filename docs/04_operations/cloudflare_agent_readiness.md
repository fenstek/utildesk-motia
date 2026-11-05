# Cloudflare Agent Readiness implementation

This note records the static discovery and crawler-policy contract implemented for `tools.utildesk.de`.

Status: source-only work in the isolated review branch; it has not been deployed.

## Public discovery

- `/.well-known/api-catalog` serves an RFC 9727 Linkset with the real public JSON catalog endpoints, `service-desc` links to the static OpenAPI 3.1 description at `/api/openapi.json`, and `service-doc` links to `/api/README.md`.
- The root response advertises the catalog and preserves the existing Google Fonts preconnect in its `Link` header. The catalog response repeats the catalog relation for the RFC-required HEAD discovery behavior.
- `/.well-known/agent-skills/index.json` follows Cloudflare's Agent Skills discovery draft v0.2.0. It lists one read-only research skill whose `SKILL.md` digest is computed from the exact published file bytes.
- `/llms.txt` also points to both discovery documents and the API reference.
- The endpoint scope and runtime behavior are documented in `site/public/api/README.md`. The tool catalog and detail paths can be proxied to the content Worker only under their existing runtime switches; static/frozen Pages output remains the fallback. Ratgeber JSON catalogs and details are build-generated static content. Feeds are separate read-only discovery resources, not APIs.

These representations send `X-Robots-Tag: noindex` while remaining fetchable. Normal HTML continues to use its existing indexable robots metadata.

## Crawler policy

Every named crawler group and the wildcard group carries `Content-Signal: search=yes, ai-input=yes, ai-train=no`. `GPTBot` is disallowed from `/`, while the separate `OAI-SearchBot` and user-triggered `ChatGPT-User` groups keep their existing `Allow: /` rules. The draft `__usage_ai-training` preference group contains `Disallow: /` as a training preference token; it is not a crawler identity or crawl ban. The referenced Microsoft guidance says it will honor this token starting 2027-02-01, and Google has announced plans for 2027. This is future-facing, voluntary, and not retroactive or technically enforced. See [Microsoft's announcement](https://blogs.bing.com/search/2026/10/your-content-your-choice-clearer-preferences-for-training-and-grounding/) and the [IETF draft](https://www.ietf.org/archive/id/draft-kelley-aipref-training-preference-signal-00.html).

`Google-Extended` keeps its existing `Allow: /` by explicit owner choice, including the possibility that Google may use accessible content for Gemini training and grounding. This is an explicit exception to the general `ai-train=no` preference; the Content Signal does not change that choice.

Robots rules and Content Signals are voluntary crawler instructions, not access controls. They do not technically prevent a non-compliant client from requesting or using public content. Use authentication or other technical controls for restricted data. See [RFC 9309](https://www.rfc-editor.org/rfc/rfc9309), [Cloudflare's Content Signals explanation](https://blog.cloudflare.com/content-signals-policy/), [OpenAI crawler documentation](https://developers.openai.com/api/docs/bots), and [Google's Google-Extended documentation](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers).

## Standards references

- [RFC 9727 API Catalog](https://www.rfc-editor.org/rfc/rfc9727)
- [Cloudflare Agent Skills discovery draft](https://github.com/cloudflare/agent-skills-discovery-rfc) and [v0.2.0 schema URI](https://schemas.agentskills.io/discovery/0.2.0/schema.json)
- [Agent Skills specification](https://agentskills.io/specification)
- [Cloudflare Agent Readiness report checks](https://blog.cloudflare.com/agent-readiness/)

The OpenAPI document describes only the read-only GET operations for `/api/tools.json` and `/api/ratgeber.json`, their JSON responses, and the observed catalog envelope fields (`version`, `site`, `siteUrl`, `generatedAt`, `count`, and `items`). It does not claim writes, authentication, search, filters, or vendor operations. The site does not claim to provide MCP, OAuth, A2A, or an ARD manifest. No paid Markdown negotiation, external account changes, runtime routes, or deployment are part of this implementation.
