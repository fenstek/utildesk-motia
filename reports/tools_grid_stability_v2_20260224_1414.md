# Report: Tools Grid Stability Fix v2

**Date:** 2026-02-24
**Branch:** fix/tools-grid-stability-v2
**Supersedes:** PR #157 (fix/tools-grid-stability) — which was ineffective

---

## 1. Prod CSS Verification

CSS loaded on prod: `https://tools.utildesk.de/styles/global.css`

Fetched and checked on 2026-02-24:

```css
/* BEFORE this fix — what prod actually had */
@media (min-width: 1024px) {
  .tools-grid {
    grid-template-columns: repeat(4, 1fr);   /* ← bug */
  }
}

.tool-card {
  display: flex;
  flex-direction: column;
  padding: 16px;
  height: 100%;
  color: inherit;
  /* ← no min-width: 0 */
  transition: border-color 0.2s ease;
}
```

**PR #157 was ineffective** because it edited `site/src/styles/global.css`.
That file is dead code: it is never imported by Vite — the layout uses
`<link rel="stylesheet" href="/styles/global.css">` which maps to
`site/public/styles/global.css` (copied verbatim by Astro to `dist/`).
The `src/` version is never bundled or served.

---

## 2. Root Cause

### CSS Grid `1fr` minimum sizing bug

`repeat(4, 1fr)` does NOT guarantee equal column widths.

Per the CSS Grid spec, `1fr` tracks have a default minimum of `auto`, which resolves
to the item's `min-content` width. The sizing algorithm:

1. Each track is given at least its `min-content` size
2. Remaining space is then distributed by `fr` ratio

If one card contains content with a wider `min-content` (long unbreakable badge text,
an image that doesn't shrink, or a tool name without word-break), its column expands
to `min-content`. The other 3 columns shrink to share the leftover space.

**Example** (1140px container, 24px side padding, 14px×3 gaps = 1050px available):
- Normal: 4 equal columns = 262.5px each
- If one card forces 300px min-content: that column = 300px; others = (1050−300−42)/3 ≈ 236px
- Visible deformation: one wide column, three narrower columns

### Why it appears after several "Mehr anzeigen" clicks

The first 24 cards (alphabetically sorted: Adalo, Adept, Adobe…) happen to have
short-enough content. After loading more batches, cards with longer tool names,
longer badge labels, or favicon images at non-`flex-shrink` sizes enter the DOM.
One of these triggers the min-content widening of its column track.

### `.tool-card` missing `min-width: 0`

Without `min-width: 0` on the flex item (the card), the card itself also resists
shrinking below its content minimum, compounding the track widening effect.

---

## 3. Files Changed

Only one file modified:

| File | Lines changed |
|------|---------------|
| `site/public/styles/global.css` | 4 lines (2 selectors) |

`site/src/styles/global.css` — unchanged (dead code, not served).

---

## 4. CSS Rules Added/Changed (v2)

### `.tools-grid` media queries

```css
/* BEFORE */
@media (min-width: 640px) {
  .tools-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 1024px) {
  .tools-grid { grid-template-columns: repeat(4, 1fr); }
}

/* AFTER */
@media (min-width: 640px) {
  .tools-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (min-width: 1024px) {
  .tools-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
```

`minmax(0, 1fr)` sets track minimum to 0 (instead of `auto`/`min-content`),
forcing all 4 tracks to always share available space equally regardless of content.

### `.tool-card`

```css
/* ADDED */
min-width: 0;   /* allows card to shrink below its content min-width */
width: 100%;    /* fills the track width after shrink */
```

---

## 5. How to Verify Manually

1. Open `https://tools.utildesk.de/tools/` at viewport ≥ 1024px (desktop).
2. Open DevTools → inspect `.tools-grid` computed styles:
   - `grid-template-columns` should read `NNNpx NNNpx NNNpx NNNpx` (all equal values).
3. Click **Mehr anzeigen** until the button disappears (10–12 clicks for 283 tools).
4. Re-inspect `.tools-grid` computed `grid-template-columns` — must still be 4 equal values.
5. Measure `getBoundingClientRect().width` on cards from different rows — all should match.
6. Apply a tag filter → click Mehr anzeigen → same check.
7. Open `/` (homepage) — verify visually unchanged (`.home-card-grid` was not modified).

### Quick JS console snippet (DevTools):
```js
// After loading all tools, run in console:
const cards = [...document.querySelectorAll('.tool-card')];
const widths = cards.map(c => Math.round(c.getBoundingClientRect().width));
const unique = [...new Set(widths)];
console.log('Unique card widths:', unique); // Should show exactly 1 value
```

---

## 6. Build Verification

```
npm run build → 287 pages, 0 errors
dist/styles/global.css: contains repeat(4, minmax(0, 1fr)) ✅
```
