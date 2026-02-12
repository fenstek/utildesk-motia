# PRODUCTION_STATUS

## Purpose

`production_status.mjs` is a read-only status check script for quickly answering:

- is the working tree clean?
- what is local `HEAD`?
- what is `origin/master` `HEAD`?
- is local commit already contained in `origin/master`?
- is there an open PR for current branch?
- optionally: does Cloudflare Production appear to be deployed for the same commit?

The script does not modify repository files.

## Usage

```bash
node scripts/production_status.mjs [options]
```

## Options

- `--no-fetch`: skip `git fetch origin --quiet`.
- `--no-gh`: skip GitHub CLI PR check.
- `--no-cf`: skip Cloudflare deployment check.

## Cloudflare Environment Variables

Cloudflare check runs only when all env vars are present:

- `CF_API_TOKEN`
- `CF_ACCOUNT_ID`
- `CF_PROJECT_NAME`

If any are missing, script prints `Cloudflare: skipped (no env)`.

## Output

Human-readable report, for example:

```text
=== Production status ===
Repo: /opt/utildesk-motia
Branch: autobot
Working tree: CLEAN
Local HEAD: ca7ca7a "fix: improve alternatives parsing + add audits"
origin/master: 742f16a
In master: NO
Open PR: #39 fix: alternatives parsing + audit scripts https://github.com/.../pull/39
Cloudflare Production: deployed UNKNOWN (commit unknown, time ...)

Next actions:
- merge PR
```

## Examples

```bash
# Full check
node scripts/production_status.mjs

# Skip network-related checks
node scripts/production_status.mjs --no-fetch --no-gh --no-cf

# Skip only Cloudflare
node scripts/production_status.mjs --no-cf
```
