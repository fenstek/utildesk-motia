---
name: utildesk-research
description: Find, compare, and cite AI tools and editorial guides from the public Utildesk directory. Use when researching tool options, workflows, or Utildesk Ratgeber content.
---

# Utildesk research

Use this workflow to retrieve public Utildesk directory content accurately.

1. Start with `https://tools.utildesk.de/llms.txt` or the RFC 9727 catalog at `https://tools.utildesk.de/.well-known/api-catalog`.
2. For tool discovery, read `https://tools.utildesk.de/api/tools.json`. For editorial guides, read `https://tools.utildesk.de/api/ratgeber.json`. Search each `items` array by title, slug, category, tags, and the user's stated workflow.
3. Copy a matching `slug` from the catalog. Then try its detail JSON at `/api/tools/<slug>.json` or `/api/ratgeber/<slug>.json`; use the item's canonical page URL and Markdown mirror URL when present. Tool detail JSON may depend on the site's opt-in content runtime, so fall back to the canonical page or Markdown mirror if it is unavailable.
4. Use `/feed.xml` or `/feed.json` to find recent German guides. English catalogs and feeds are under `/en/`.
5. Cite the canonical Utildesk HTML page for directory or editorial claims. For current prices, availability, integrations, or provider policies, follow the official-provider link and verify it directly. Separate Utildesk's editorial assessment from the vendor's own claims.

These are public read-only content endpoints. They do not let an agent operate the listed vendors' products, and they publish no transaction or write API. The noindex header asks search engines to exclude machine representations while leaving them fetchable. Crawler rules and Content Signals express voluntary preferences and do not enforce access restrictions.
