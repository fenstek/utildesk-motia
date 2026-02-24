# Report: Tools Grid Stability Fix

**Date:** 2026-02-24
**Branch:** fix/tools-grid-stability
**Backup tag:** ui-backup-before-tools-grid-fix-20260224-1359

---

## Root Cause

`site/src/styles/global.css` — `.tools-grid` used `repeat(auto-fit, minmax(260px, 1fr))`.

**CSS `auto-fit` behaviour:** when the last row has fewer items than the column count,
`auto-fit` collapses the empty column tracks to `0px`. The remaining items then each
receive a larger `1fr` share, expanding to fill the full row width. This makes the final
row visually wider than all other rows.

**Why it appears after several "Mehr anzeigen" clicks:**
With 283 tools and a step of 24 per page-block, the final batch reveals all 283 cards.
283 ÷ 4 columns = 70 full rows + 3 remaining cards. Those 3 cards each stretch to
≈ 1/3 of the container width instead of the expected 1/4 — clearly deformed.
The same effect occurs at any intermediate count not divisible by the column count,
and is especially pronounced after filtering by tag or search.

---

## Files Changed

| File | Change |
|------|--------|
| `site/src/styles/global.css` | 1 keyword changed + 3 defensive card properties added |

No other files were modified. No global styles outside `.tools-grid` / `.tool-card` were touched.

---

## CSS Rules Changed

### `.tools-grid`
```css
/* BEFORE */
grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));

/* AFTER */
grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
```
`auto-fill` keeps empty tracks at their natural width instead of collapsing them,
so all cards in the last row retain the same track width as cards in full rows.

### `.tool-card` (3 defensive properties added)
```css
min-width: 0;        /* prevents card content from forcing grid cell to grow */
width: 100%;         /* ensures card fills its track even after DOM re-insertion */
box-sizing: border-box; /* redundant with global * rule but explicit for safety */
```

---

## How to Verify Manually

1. Open `https://tools.utildesk.de/tools/` in a browser at ≥1024 px viewport width.
2. Confirm the initial grid shows 4 equal-width columns.
3. Click **"Mehr anzeigen"** 10 times (or until the button disappears).
4. Inspect every row — all cards must be the same width, including the last (partial) row.
5. Apply a tag filter (e.g. "chatbot") and repeat steps 3–4.
6. Apply a search query (e.g. "gpt") and confirm no column-width deviation.
7. Verify `/` (homepage) is visually unchanged — no grid is present there,
   `.tools-grid` is not used outside `/tools`.

---

## Build Verification

```
npm run build  →  287 pages built, 0 errors
Sitemap: 284 URLs (273 tools + 8 categories + 2 static)
```
