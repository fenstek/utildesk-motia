# postcheck_scan_suspicious.mjs

Scans published (DONE) tools in the Google Sheet for suspicious or irrelevant entries using **offline heuristics only** — no external network calls beyond reading the Sheet.

Always **DRY-RUN**: never modifies the Sheet or the repository.

## Purpose

After the publish pipeline marks a tool as `DONE` and generates its markdown page, this script performs a second-pass quality check to surface false positives: URLs pointing to content sites, news outlets, gambling domains, or otherwise non-AI tools.

Results are intended to be fed into `postcheck_apply_actions.mjs`.

## Inputs

**Google Sheet columns read** (all other columns are ignored):
| Column | Used for |
|--------|----------|
| `slug` | identify entry, match to MD file, slug heuristics |
| `status` | filter rows (default: `DONE`) |
| `official_url` | all URL-based heuristics |
| `wikidata_id` | absence → amplifies generic-slug signal |
| `topic` / `title` | display in output |

**Filesystem:**
- `content/tools/<slug>.md` — checked for existence (missing → `done_but_no_md_file` signal)

## CLI options

| Option | Default | Description |
|--------|---------|-------------|
| `--limit <n>` | `200` | Max rows to inspect |
| `--status <s>` | `DONE` | Comma-separated statuses to scan, e.g. `DONE,NEEDS_REVIEW` |
| `--out <path>` | _(none)_ | Save JSON output to file (in addition to stdout) |
| `--format json\|md` | `json` | Output format. `md` prints a Markdown table |
| `--strict` | off | Raise confidence on weak signals (generic slug, exotic TLD) |

## Output format (JSON)

```json
[
  {
    "row": 163,
    "slug": "waveai",
    "title": "WaveAI",
    "official_url": "https://www.waveaid.com.au/",
    "wikidata_id": null,
    "md_exists": true,
    "reasons": ["seed_blacklist_domain", "exotic_tld:.com.au", "slug_url_domain_mismatch"],
    "recommended_status": "BLACKLIST",
    "confidence": 0.95
  }
]
```

`recommended_status` is either `BLACKLIST` or `NEEDS_REVIEW`.
`confidence` is `0.0 – 1.0` (highest single heuristic signal).

Human-readable summary is written to **stderr**. Only JSON (or Markdown) goes to **stdout**.

## Heuristics (14)

| # | Name | Signal strength | Recommended status |
|---|------|-----------------|--------------------|
| 1 | `seed_blacklist_domain` | Strong (0.95) | BLACKLIST |
| 2 | `spam_path_token:<token>` | Strong (0.85) | BLACKLIST |
| 3 | `hard_url_token:<token>` | Strong (0.95) | BLACKLIST |
| 4 | `non_https_url` | Weak (0.40) | NEEDS_REVIEW |
| 5 | `host_spam_marker:<marker>` | Weak (0.35) | NEEDS_REVIEW |
| 6 | `exotic_tld:<suffix>` | Very weak (0.25) | NEEDS_REVIEW |
| 7 | `tracking_params_in_url` | Weak (0.40) | NEEDS_REVIEW |
| 8 | `news_site_theverge` | Medium (0.70) | NEEDS_REVIEW |
| 9 | `generic_slug_no_wikidata:<slug>` | Weak (0.30) | NEEDS_REVIEW |
| 10 | `slug_url_domain_mismatch` | Weak (0.25) | NEEDS_REVIEW |
| 11 | `deep_url_path_not_homepage` | Very weak (0.30) | NEEDS_REVIEW |
| 12 | `ip_address_url` | Medium (0.60) | NEEDS_REVIEW |
| 13 | `non_public_hostname` | Medium (0.80) | NEEDS_REVIEW |
| 14 | `done_but_no_md_file` | Medium (0.60) | NEEDS_REVIEW |

## Allowlist domains

The following domains will never receive a `BLACKLIST` recommendation from heuristics alone:

```
openai.com, anthropic.com, google.com, microsoft.com, adobe.com,
github.com, atlassian.com, notion.so, figma.com, huggingface.co,
stability.ai, midjourney.com, canva.com, grammarly.com, deepl.com,
jasper.ai, runway.ml, elevenlabs.io, replika.ai, deepmind.com,
cohere.com, perplexity.ai, mistral.ai
```

## Examples

```bash
# Dry-run scan of all DONE entries (default):
node scripts/postcheck_scan_suspicious.mjs

# Save output for apply script:
node scripts/postcheck_scan_suspicious.mjs --out /tmp/postcheck_candidates.json

# Scan with strict mode, include NEEDS_REVIEW rows too:
node scripts/postcheck_scan_suspicious.mjs --strict --status DONE,NEEDS_REVIEW

# Markdown report to stdout:
node scripts/postcheck_scan_suspicious.mjs --format md
```

## Safety notes

- This script is **read-only** by design. It cannot modify the Sheet or repository.
- Only heuristics that can be evaluated without network access are used (no DNS lookups, no HTTP requests).
- A single heuristic signal is rarely conclusive. Review all candidates before applying changes.
- Use `postcheck_apply_actions.mjs` with `--max-delete 2` (default) to apply changes safely.
