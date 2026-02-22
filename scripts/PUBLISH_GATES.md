# PUBLISH_GATES.md — Mandatory Publish Gates (v2.4)

This document describes every hard gate in the publish pipeline.
A gate is a check that, when it fails, **prevents** a row from advancing to `NEW`
(autogen) or from having its markdown generated (publish orchestrator).

---

## Gates Overview

| Gate | Where | Blocks what | Outcome on fail |
|---|---|---|---|
| **official_url present** | autogen | NEW status | `NEEDS_REVIEW` + note |
| **official_url valid** | autogen | NEW status | `NEEDS_REVIEW` + note |
| **wrong-entity domain** | autogen (url_policy) | NEW status | `NEEDS_REVIEW` + note |
| **tags ≥ 1 specific** | autogen | NEW status | `NEEDS_REVIEW` + note |
| **official_url present** | publish orchestrator | MD generation | `NEEDS_REVIEW` + skip row |
| **tags ≥ 1 specific** | publish orchestrator | MD generation | `NEEDS_REVIEW` + skip row |
| **deny-slug list** | autogen + guard_deny_md | any write | silently skipped |
| **Wikidata P31** | autogen (Wikidata) | row candidate | discarded (not written) |

**v2.4 key change:** Hostname mismatch is now a **non-blocking flag** (advisory only),
not a hard block. Only clearly wrong-entity domains (e.g., `transformers.hasbro.com`)
remain as blocking conditions.

**Final redirect destination checks (hard block/review):** QC resolves redirects and classifies
final destinations via `classifyFinalUrl()`:
- hard block: `redirected_to_denied_final_host`, `redirected_to_parking_or_domain_sale`,
  `final_host_parking_provider`, `final_url_matches_denied_pattern`
- review block: `final_url_suspicious_content_hub`

---

## Gate 1 — official_url (autogen, `sheet_ai_autogen_9_strict_v2.mjs`)

**Location:** gate v2.4, after `resolveOfficialForTopic()`.
Implemented via `validateOfficialUrl()` in `scripts/lib/url_policy.mjs`.

**Logic:**
```
status = NEEDS_REVIEW  if any of:
  - resolved official_url is empty / NaN / null
  - resolved official_url is not https
  - resolved official_url host is in DENY_HOSTS (wikipedia, socials, parking domains, etc.)
  - resolved official_url contains DENY_SUBSTR (gov, city, utm_ ...)
  - resolved official_url is a wrong-entity domain (see entity_disambiguation.mjs)
  - (hard override present → bypasses ALL checks unconditionally)

status = NEW  (with advisory flag logged) if:
  - hostname does NOT contain slug token  ← v2.4: no longer blocks
```

**Note written:** `blocked:missing/invalid official_url (<reason>)`

**Counter:** `blocked_missing_url` in url_resolution_summary.

**Advisory flag (non-blocking):** `url_flags:hostname_mismatch` — logged but does NOT set NEEDS_REVIEW.

---

## Gate 2 — tags (autogen, `sheet_ai_autogen_9_strict_v2.mjs`)

**Location:** gate v2.4, alongside Gate 1.

**Logic:**
```
status = NEEDS_REVIEW  if:
  - tags list (comma-separated, column D) has no specific tag
  - i.e. after removing "ai" and "produktivität", the list is empty
```

**Note written:** `blocked:missing/invalid tags`

**Counter:** `blocked_missing_tags` in url_resolution_summary.

---

## QC Helper (pre-publish, fail-closed)

**Location:** `scripts/cron_publish_push.sh` before `test_run_9_full.mjs`.

**Helper:** `scripts/qc_before_publish.mjs`

**Flow:**
1. Runs `node scripts/audit_new_inprogress_qc.mjs --apply=1 --json`
2. Prints QC report JSON
3. Prints machine-readable line:
   - `QC_MOVED_TO_NEEDS_REVIEW=<number>`

`cron_publish_push.sh` parses that line and behaves fail-closed:

- If value is missing/non-numeric -> treated as `9999`
- If helper errors/timeouts/invalid JSON -> helper prints:
  - `QC_ERROR=<message>`
  - `QC_MOVED_TO_NEEDS_REVIEW=9999`
  - exits `0`
- If `QC_MOVED_TO_NEEDS_REVIEW > 0` -> publish exits safely with no generation

This ensures queue-cleaning failures never allow unsafe publish progression.

### Final redirect destination policy

`audit_new_inprogress_qc.mjs` resolves each `official_url` with `resolveFinalUrl()`.
Then `scripts/lib/url_suspicion.mjs` classifies the destination:
- `deny` -> row is blocked (`NEEDS_REVIEW`)
- `review` -> row is also routed to `NEEDS_REVIEW` for manual validation

Primary reason codes:
- `redirected_to_denied_final_host`
- `redirected_to_parking_or_domain_sale`
- `final_host_parking_provider`
- `final_url_matches_denied_pattern`
- `final_url_suspicious_content_hub`

On `--apply=1`, such rows are moved to `NEEDS_REVIEW`.
This prevents redirect-based squats/parking URLs from reaching publish.

---

## Gate 3 — official_url in publish orchestrator (`test_run_9_full.mjs`)

**Location:** immediately after reading the NEW row from the Sheet,
before calling `generate_tool_md.mjs`.

**Purpose:** Defense-in-depth. Even if a row somehow reaches NEW with an
empty official_url (manual edit, legacy data, bug), this gate catches it
before any markdown is generated.

**Logic:**
```
if official_url is empty / "NaN" / "null" / "undefined" / "none":
  → updateStatus(rowNum, 'NEEDS_REVIEW', 'publish blocked: missing official_url')
  → skip this row (continue to next)
  → publishCounters.publish_blocked_missing_url++
```

**Log line:** `[GATE] BLOCKED row=N slug=X: missing official_url`

---

## Gate 4 — tags in publish orchestrator (`test_run_9_full.mjs`)

**Location:** immediately after Gate 3, before `generate_tool_md.mjs`.

**Purpose:** Defense-in-depth for tags validation.

**Logic:**
```
if tags present but all are "ai" / "produktivität" (no specific tag):
  → updateStatus(rowNum, 'NEEDS_REVIEW', 'publish blocked: missing specific tags')
  → skip this row (continue to next)
  → publishCounters.publish_blocked_missing_tags++
```

**Log line:** `[GATE] BLOCKED row=N slug=X: missing specific tags`

---

## Pre-flight audit (`audit_publish_preflight.mjs`)

An independent audit tool that reads all `NEW` rows from the Sheet and
validates them against the same rules as Gates 1–2 above.

```bash
# Dry-run: see what would be blocked
node scripts/audit_publish_preflight.mjs

# Apply: move invalid rows to NEEDS_REVIEW
node scripts/audit_publish_preflight.mjs --apply

# Limit to specific slugs
node scripts/audit_publish_preflight.mjs --apply --only=chatgpt,claude

# Check first 50 NEW rows
node scripts/audit_publish_preflight.mjs --apply --limit=50
```

Run this before re-enabling the cron to clean up any legacy NEW rows
that might have reached NEW without passing the gates.

---

## DONE-row repair audit (`audit_done_missing_official_url.mjs`)

Finds DONE rows with empty official_url and attempts to repair them via
Wikidata P856 → DDG → GPT. Repairs Sheet + MD frontmatter.

```bash
# Dry-run: show what would change
node scripts/audit_done_missing_official_url.mjs

# Apply repairs
node scripts/audit_done_missing_official_url.mjs --apply=1

# Limit to specific slugs
node scripts/audit_done_missing_official_url.mjs --apply=1 --only=uipath,claude
```

Rows where URL cannot be found are moved to NEEDS_REVIEW.

---

## URL validation rules (v2.4)

These rules are implemented in `scripts/lib/url_policy.mjs` and shared by
autogen (Gate 1), the publish orchestrator, and the audit scripts.

### Always blocked hosts (`DENY_HOSTS`)
```
wikipedia.org, wikidata.org, wikimedia.org
facebook.com, instagram.com, linkedin.com, tiktok.com, youtube.com, youtu.be
twitter.com, x.com, imdb.com
tripadvisor.com, booking.com, expedia.com
apps.apple.com, play.google.com
duckduckgo.com, google.com, bing.com
medium.com, substack.com, dev.to
introvert.com, dot-tech.org, www.dot-tech.org, dot-attorney.org, www.dot-attorney.org
```

### Always blocked substrings (`DENY_SUBSTR`)
Government / municipality portals:
```
mairie, stadt, gemeinde, municip, municipal, kommune, council, gov, gouv, regierung
comune, townof, cityof, ville, township
```
Tourism / generic:
```
visit, tourism, tourist, stadtinfo, city, culture
```
Tracking / search params:
```
/search?, /search/, ?q=, &q=, utm_
```
Non-product paths:
```
/film, /movie, /stadt/, /city/, /wiki/
```

### Wrong-entity detection (`scripts/lib/entity_disambiguation.mjs`)
ML library slugs (e.g., `transformers`, `llama`, `bert`) are checked against
wrong-entity domain tokens (e.g., `hasbro`, `lego`, `disney`).
If the resolved host contains a wrong-entity token, the URL is **blocked**.

Example: `transformers` + `hasbro.com` → **blocked** (Hasbro toy brand)

### Hard URL overrides (bypass all checks)
| slug | url | reason |
|---|---|---|
| `prisma` | `https://prisma-ai.com/` | Prisma Labs ≠ prisma.io ORM |

### Docs-URL normalization
Paths starting with `/docs`, `/documentation`, `/developers`, `/api`
are normalized to the origin (scheme+host only) before validation.

### Hostname mismatch — advisory flag only (v2.4)
If the resolved hostname does not contain the slug token, a `hostname_mismatch`
flag is logged (`url_flags:hostname_mismatch`), but the row is **NOT** blocked.
This allows valid URLs like `huggingface.co` for slug `transformers`.

### Allowed hosts by entity class
For `library_or_model` entities, the following hosts bypass the hostname-mismatch flag:
```
huggingface.co, pytorch.org, tensorflow.org, github.com,
readthedocs.io, paperswithcode.com, arxiv.org
```

---

## Tags validation rules

**Minimum requirement:** at least 1 tag from the specific allowlist
(i.e. after removing `"ai"` and `"produktivität"`, the list must be non-empty).

**Allowlist** (TAG_ALLOWLIST in `scripts/lib/tag_enricher_gpt.mjs`):
```
chatbot, assistant, writing, content, marketing, seo, social-media,
design, image, video, audio, transcription,
productivity, automation, workflow, no-code,
data, analytics, spreadsheet, crm,
coding, developer-tools, api, translation, education, customer-support, meeting
```

**Additional domain-specific tags** generated by autogen:
```
llm, image, video, audio, devtools, automation, writing, productivity, design
```

If a row's tags are only `"ai"` or empty, it fails this gate.

---

## Counter summary in autogen output (v2.4)

Every run of `sheet_ai_autogen_9_strict_v2.mjs` emits a `url_resolution_summary`
JSON block including:

```json
{
  "blocked_missing_url": 0,
  "blocked_missing_tags": 0,
  "needs_review_written": 0,
  "url_flagged": 0,
  "wikidata_guard_rejected": 12,
  "wikidata_guard_allowed": 8
}
```

`url_flagged` counts rows that received a non-blocking advisory flag
(e.g., `hostname_mismatch`) but were still written as `NEW`.

## Counter summary in publish output (v2.4)

Every run of `test_run_9_full.mjs` emits a `publish_counters` JSON block:

```json
{
  "publish_blocked_missing_url": 0,
  "publish_blocked_missing_tags": 0,
  "publish_done": 3,
  "publish_deferred": 0,
  "publish_error": 0
}
```

Use these counters to verify the gates are firing correctly.

---

## Repo-level post-publish audit (`audit_repo_tools_missing_official_url.mjs`)

**What it checks:**
Scans every `content/tools/*.md` file and flags those where `official_url`
in the frontmatter is absent, empty, or a placeholder value (`-`, `n/a`, etc.).
Files beginning with `_` (templates, disabled) are skipped.

**Source of truth:** Google Sheet column K (`official_url`).
This audit patches MD files only — Sheet status is never changed.

**Blocks what:** Nothing automatically (manual tool). But a file without
`official_url` in frontmatter will render without a link on the site.

**When to run:**

| Trigger | Command |
|---|---|
| Before re-enabling cron after a pause | `node scripts/audit_repo_tools_missing_official_url.mjs --apply=1` |
| After bulk import or manual MD creation | `--apply=1` |
| Periodic health check | dry-run (alert if count > 0) |
| After merging a large batch PR | dry-run |

**Outcome on "still missing in Sheet":**
The MD file is left unchanged. The slug appears in `still_missing_in_sheet`
in the JSON summary — investigate via `audit_done_missing_official_url.mjs`
(Wikidata/DDG repair) or manually set the Sheet row to NEEDS_REVIEW.

**Related scripts:**
- `audit_done_missing_official_url.mjs` — repairs DONE rows in the Sheet itself
- `audit_publish_preflight.mjs` — validates NEW rows before they enter the publish queue
