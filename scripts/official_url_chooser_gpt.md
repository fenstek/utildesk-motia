# official_url_chooser_gpt

## Purpose

`scripts/lib/official_url_chooser_gpt.mjs` provides an optional chooser for selecting `official_url` from pre-collected candidates in `sheet_ai_autogen_9_strict_v2.mjs`.

## Exported API

- `isGptUrlEnabled(): boolean`
  - Reads `USE_GPT_URL` from environment (`1|true|yes|on`).
  - Returns whether GPT-based selection is enabled.

- `chooseOfficialUrlGpt(args): Promise<Result>`
  - Expected input shape:
    - `args.candidates`: array of candidate URLs (or objects with `url`, `domain`, `source`, `rank`, `score`).
    - Optional context fields (brand/topic/token) may be passed by caller.
  - Returns object with fields such as:
    - `ok` (`boolean`)
    - `official_url` (`string`)
    - `confidence` (`number`)
    - `reason` (`string`, on fallback/error)
    - `decision` (`object`)

## Usage in sheet autogen

`scripts/sheet_ai_autogen_9_strict_v2.mjs` loads the module dynamically:

```js
const gptMod = await import('./lib/official_url_chooser_gpt.mjs');
```

And falls back safely when unavailable:

- `chooseOfficialUrlGpt` defaults to returning `{ ok:false, reason:'gpt_module_unavailable' }`
- `isGptUrlEnabled` defaults to `false`

## Current mode

- If `USE_GPT_URL` is not enabled, chooser returns `ok:false` with `reason:'gpt_disabled'`.
- This keeps autogen deterministic and allows DDG fallback without network calls to GPT.

## Enabling GPT later

1. Set `USE_GPT_URL=true`.
2. Ensure OpenAI credentials/model env vars are configured for runtime.
3. Keep confidence threshold control in autogen (`OFFICIAL_URL_MIN_CONF`) for safe rollout.
