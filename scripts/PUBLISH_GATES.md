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

---

## Gate 1 — official_url (autogen, `sheet_ai_autogen_9_strict_v2.mjs`)

**Location:** gate v2.4, after `resolveOfficialForTopic()`.
Implemented via `validateOfficialUrl()` in `scripts/lib/url_policy.mjs`.

**Logic:**
```
status = NEEDS_REVIEW  if any of:
  - resolved official_url is empty / NaN / null
  - resolved official_url is not https
  - resolved official_url host is in DENY_HOSTS (wikipedia, socials, etc.)
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
