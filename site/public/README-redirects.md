# Redirect Rules

## Why this exists
This Astro site is static (SSG). Non-existent pages must return real `404`, not homepage HTML with `200`.

A catch-all SPA rewrite such as `/* -> / (200)` is harmful for SEO because crawlers treat missing URLs as valid pages.

## Cloudflare Pages limitation
**Cloudflare Pages `_redirects` does not accept status code 404.**

The rule `/tools/*  /404.html  404` causes deploy failures with error:
```
Invalid redirect status code: 404
```

## Proper fix
Disable any **SPA fallback rewrite** (e.g., `/* /index.html 200`) in the Cloudflare Pages dashboard:
- Go to Pages project → Settings → Build & deployments → Functions
- Ensure no catch-all rewrite is enabled

This ensures missing tool URLs return proper 404 responses instead of rewriting to the homepage.

## Verify
After deploy:

```bash
curl -sS -I https://utildesk-motia.pages.dev/tools/x-ai/ | head -n 5
```

Expected: `HTTP/... 404`.
