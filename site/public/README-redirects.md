# Redirect Rules

## Why this exists
This Astro site is static (SSG). Non-existent pages must return real `404`, not homepage HTML with `200`.

A catch-all SPA rewrite such as `/* -> / (200)` is harmful for SEO because crawlers treat missing URLs as valid pages.

## Current rule
- `/tools/*  /404.html  404`

This prevents unknown tool URLs (for example `/tools/x-ai/`) from being rewritten to `/`.

## Verify
After deploy:

```bash
curl -sS -I https://utildesk-motia.pages.dev/tools/x-ai/ | head -n 5
```

Expected: `HTTP/... 404`.
