# Visual targets and route map

The goal is a coherent editorial "Entscheidungsblatt" system, not a hybrid between the old directory UI and the new concept.

## Current protected baseline

- Safe restore tag: `restore/pre-claude-code-design-20260529-baca47ac`
- Baseline commit: `baca47ac`
- Previous bad experiment: `8e145c09` — inspect only to understand what failed.

## Routes to align

| Area | Routes | Notes |
| --- | --- | --- |
| Home | `/` | Treat as current reference for shared header/footer unless explicitly redesigned. |
| Tool index / inventory | `/tools/` | Should become a clean editorial inventory, not a cramped category/sidebar hybrid. |
| Tool dossier / tool-akte | `/tools/zapier/`, `/tools/ableton-live/` | Use available tool illustrations/logos where they exist. Resize rather than crop badly. |
| Ratgeber index | `/ratgeber/` | Article cards need breathing room: image border must not stick to outer frame; CTA must not touch border. |
| Ratgeber article | choose one existing route | Article typography should feel edited and readable, not generated layout soup. |
| Legal/methodology | `/methodologie/`, `/impressum/`, `/datenschutz/` | Must keep consistent header/footer and readable legal layout. |

## Repeated user observations to respect

- Header/menu/header-meta must match across pages if shared.
- Footer must be consistent and include copyright.
- Datenschutz and Impressum must stay visible/reachable.
- Footer links should hover red consistently.
- Avoid awkward one/two-word line wraps in footer copy and menu blocks.
- Do not leave large empty black/white rectangles or unbalanced empty grid cells.
- Title/header blocks should scroll normally unless only the small top nav is intentionally sticky.
- If a design switch/old version link exists, place it intentionally in the top-right area, not in the central issue badge.

## Design source

The attached reference is stored at:

`handoff/claude-code-design/reference/claude_guide_v5_FINAL.pdf`

Use it as design direction. Do not blindly paste a static export over the Astro app.
