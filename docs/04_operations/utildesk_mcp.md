# Utildesk MCP

Local stdio MCP server for repeatable Utildesk operations.

The goal is to reduce token-heavy hand work around the same production
checklists: memory loading, git preflight, Ratgeber image checks, live checks,
Cloudflare Pages deploys, sitemap contract checks, and IndexNow submission.

## Start Command

From the repository root:

```powershell
npm run mcp:utildesk
```

Equivalent direct command:

```powershell
node C:\projects\utildesk-motia\scripts\mcp\utildesk-mcp.mjs
```

## Example MCP Client Config

```json
{
  "mcpServers": {
    "utildesk": {
      "command": "node",
      "args": [
        "C:\\projects\\utildesk-motia\\scripts\\mcp\\utildesk-mcp.mjs"
      ],
      "cwd": "C:\\projects\\utildesk-motia"
    }
  }
}
```

## Tools

- `memory_read` reads the standard project memory set:
  `memory/project_state.md`, `memory/decisions.md`,
  `memory/recent_changes.md`, `NEXT_STEPS.md`, and `HANDOFF.md`.
- `git_preflight` reports branch, head, upstream, remotes, dirty state, and the
  latest commit.
- `ratgeber_article_check` checks German and English Ratgeber markdown for
  missing images, identical `coverImage` / `secondaryImage`, and the common
  mistake where the hero cover is embedded again inline.
- `build_site` runs one standard validation target: full Astro build,
  editorial check, English tool check, tool-quality guard, or vendor audit.
- `live_check_urls` fetches live URLs with optional must-contain and
  must-not-contain checks.
- `sitemap_contract_check` verifies that `robots.txt` advertises only
  `sitemap.xml` and checks live compact sitemap availability.
- `deploy_pages` deploys `site/dist` to Cloudflare Pages using the git-ignored
  root `.env` token and the known fenstek Cloudflare account id. It requires
  `confirm: "deploy utildesk"`.
- `indexnow_submit_range` runs the existing IndexNow helper for a git range. It
  requires `confirm: "submit indexnow"`.

## Safety Notes

- The server is intentionally a thin wrapper over existing scripts and live
  checks; it should not become a second publishing system.
- Dangerous operations require explicit confirmation fields so read-only checks
  cannot accidentally deploy or notify search engines.
- The server loads `.env` only inside the process that needs Cloudflare deploy
  access and never returns the token value.
- Keep Google/GSC/Bing sitemap policy in `memory/decisions.md` as the source of
  truth. The MCP checks enforce the current compact sitemap contract, not a
  broad sitemap strategy.
