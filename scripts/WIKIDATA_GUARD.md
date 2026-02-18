# Wikidata P31 Guard

**File:** `scripts/sheet_ai_autogen_9_strict_v2.mjs`
**Functions:** `validateInstanceOf()`, `isLikelyAITool()`, called inside `pickWikidata()`

---

## Purpose

Prevents the autogen pipeline from accepting a Wikidata entity that clearly represents a
non-software object (aircraft, airport, award, military branch, person, etc.) as the canonical
match for an AI tool name.

Without this guard the pipeline can pick a famous but completely wrong Wikidata entity whenever
the tool name is ambiguous — e.g., "Phantom" → F-4 Phantom II jet fighter, "Writer" → WGA
screenplay award, "Copilot" → aircraft pilot profession.

---

## How It Works

Two sequential checks run for every Wikidata candidate inside `pickWikidata()`:

### 1. P31 (instance of) check — `validateInstanceOf(entity)`

Reads all `P31` (instance of) claims from the Wikidata entity.

| Outcome | Logic | Result |
|---------|-------|--------|
| **REJECTED** | Any P31 value is in `REJECTED_P31` | `valid: false` → entity skipped |
| **ACCEPTED** | At least one P31 is in `ACCEPTED_P31` (and none rejected) | `valid: true` |
| **NEUTRAL** | P31 present but in neither set | `valid: true, reason: 'no_rejected'` |
| **NO P31** | Entity has no P31 claims at all | `valid: true, reason: 'no_P31_but_has_url'` |

### 2. AI relevance check — `isLikelyAITool(name, description, p31Instances)`

Secondary filter that requires at least one positive AI signal in name+description or P31:

- Keywords: `ai`, `machine learning`, `llm`, `chatbot`, `generative`, `neural`, `gpt`, …
- P31 types: `Q28598683` (AI system), `Q22811534` (language model)
- Name patterns: `chat`, `voice`, `tts`, `image generat*`, `code assist*`, …
- Known AI companies/products listed in `knownAI` array

If neither check passes → entity is skipped.

---

## What It Blocks (examples from real audit, Feb 2026)

| Topic | Wikidata match (wrong) | P31 | Rejection reason |
|-------|------------------------|-----|-----------------|
| Phantom | Q151432 — F-4 Phantom II aircraft | Q15056993 (aircraft model) | `rejected_p31` |
| Writer | Q1415017 — WGA screenplay award | Q618779 (award) | `rejected_p31` |
| Copilot | Q2095549 — aircraft pilot | Q28640 (profession) | `rejected_p31` |
| Domo | Q186614 — Domodedovo Airport | Q1248784 (airport) | `rejected_p31` |
| Chai | Q11223 — US Air Force | Q8473 (military branch) | `rejected_p31` |
| Rev | Q42603 — priest (clergy) | Q28640 (profession) | `rejected_p31` |
| Pindar | Q37383 — peanut | Q16521 (taxon) | `rejected_p31` |

> **Note:** these entities were inserted into the Sheet *before* the guard was implemented or
> before the relevant Q-ids were added to `REJECTED_P31`. The guard prevents new occurrences.

---

## What It Allows

`ACCEPTED_P31` contains software/service/tech types:

| Q-id | Label |
|------|-------|
| Q7397 | software |
| Q1172284 | web application |
| Q166142 | online service |
| Q1172486 | web service |
| Q17155032 | SaaS |
| Q20826540 | mobile app |
| Q1639024 | application software |
| Q15634736 | software framework |
| Q28598683 | artificial intelligence system |
| Q22811534 | language model |
| Q21127166 | chatbot software |
| Q1194128 | API |
| Q1407659 | cloud service |
| … | (see `ACCEPTED_P31` set in source) |

---

## Effect on Status and URL Resolution

When an entity is rejected by the guard:

- The candidate is **skipped entirely** in `pickWikidata()` — the loop `continue`s to the next result.
- If **all** Wikidata candidates for a topic are rejected, `pickWikidata()` returns `null` → the topic is dropped from the autogen batch (not written to Sheet at all).
- The official URL from `P856` of a rejected entity is **never used**.
- No `wikidata_id` is written for the topic.

> This is the safest outcome: a dropped topic is never published. It can be re-added manually
> with the correct Wikidata entity once the tool is properly identified.

---

## Logging

Every rejection emits a line to **stderr**:

```
[wikidata-guard] rejected P31=rejected_P31:Q618779 entity=Q1415017(Writers Guild of America Award) topic="Writer" reason=rejected_p31
[wikidata-guard] rejected entity=Q2095549(aircraft pilot) topic="Copilot" reason=not_ai_tool p31=[Q28640] desc="profession of flying aircraft"
```

Fields:
- `rejected P31=<reason>` — which P31 Q-id triggered rejection (for P31 check)
- `entity=<QID>(<label>)` — the Wikidata entity that was rejected
- `topic="<name>"` — the tool name being searched
- `reason=rejected_p31 | not_ai_tool` — which check failed
- `p31=[...]` — P31 Q-ids present on entity (for `not_ai_tool` rejections)
- `desc="..."` — first 80 chars of entity description

These lines can be counted / grepped from the cron log:

```bash
grep '\[wikidata-guard\]' /var/log/utildesk-motia/sheet.log | wc -l
grep '\[wikidata-guard\] rejected P31=rejected_P31' /var/log/utildesk-motia/sheet.log
```

---

## How to Adjust the Lists

### Add a new rejected type

Find the Wikidata Q-id for the entity class (e.g., search `https://www.wikidata.org/wiki/Q618779`),
then add it to `REJECTED_P31` in `sheet_ai_autogen_9_strict_v2.mjs`:

```javascript
const REJECTED_P31 = new Set([
  // ...
  'Q618779',  // award   ← add with a comment
]);
```

### Add a new accepted type

Same pattern, add to `ACCEPTED_P31`:

```javascript
const ACCEPTED_P31 = new Set([
  // ...
  'Q12345678',  // your new software type
]);
```

### The guard is too strict / drops a legitimate tool

If a real AI tool is being rejected (verify via `[wikidata-guard]` logs):

1. Check the entity's P31 in Wikidata — maybe it lacks a proper `instance of: software` claim.
2. If the entity is genuinely software, add its P31 type to `ACCEPTED_P31`.
3. Alternatively, add the tool to `SEED_AI` array — seed tools bypass Wikidata validation and go directly to the DDG URL resolver.

### The guard is too lenient

Add the blocking P31 type to `REJECTED_P31`. If `isLikelyAITool` is the weak point (name
matches AI keywords by accident), tighten `isLikelyAITool()` — but be conservative, as
false negatives (dropping real AI tools) are harder to notice.

---

## Known Limitations

- P31 check only rejects if the **exact** Q-id is in the set. Wikidata uses deep class hierarchies
  (e.g., "combat aircraft" → "military aircraft" → "aircraft"). If an entity uses a subclass not
  in `REJECTED_P31`, it may slip through. Expanding the list incrementally from `[wikidata-guard]`
  logs is the recommended approach.
- The `isLikelyAITool` text check can produce false positives (e.g., a news article *about* AI
  triggering a match). The P31 check is the stronger gate.
- Neither check can catch *correct* Wikidata entities that point to the wrong official URL
  (P856). For that, the separate `isSuspiciousOfficialUrl()` filter and the `postcheck_scan_suspicious.mjs`
  post-publication audit are the safety nets.
