# Ratgeber Editorial Gate

## Article scope

Ratgeber is not an extended tool card.

Allowed candidates must be one of these:

- comparison article with several tools or approaches;
- market/trend overview with clear practical consequences;
- workflow/how-to guide that teaches a reusable process;
- strategic explainer with multiple sources and concrete decisions.

Rejected candidates:

- `tool_spotlight`;
- one-tool article with title pattern `Tool: Was das Tool im Alltag wirklich taugt`;
- article that only repeats a product card without comparison, alternatives, workflow, or market context.

The Cloudflare candidate sync enforces this before upload. Rejected artifacts get
`cloudflare_review_rejected.json` and are not sent to the review backend.

Operational enforcement points:

- `opcl:/opt/openclaw/workspace/agent-newsman/scripts/journalist_editor.py`
  rejects `tool_spotlight`, `tool_review`, `product_spotlight`, and
  `product_review` before jobs enter the article queue.
- `scripts/ratgeber_cloudflare_candidate_sync.py` is the final runtime guard
  before Cloudflare upload. It rejects forbidden single-tool formats, titles
  like `Tool: Was das Tool im Alltag wirklich taugt`, and candidates whose
  visual quality gate failed.
- If the local repo script is changed, the production copy on `opcl` must be
  updated too; otherwise the review backend can drift back to old behaviour.

## Illustration direction

Images must not become a cloned diagram factory.

Rules:

- use different visual styles across articles;
- at least one image per article should be an artistic narrative illustration;
- use a schematic only when it explains a real process;
- do not use two similar diagrams in one article by default;
- no internal service labels, debug captions, footer slogans, or prompt notes inside images;
- the picture must add editorial meaning: scene, metaphor, comparison, or memory hook.

Preferred styles rotate between:

- editorial narrative scene;
- human workbench story;
- magazine cutaway illustration;
- field report collage;
- comparison table as environment;
- product ecosystem scene;
- soft technical metaphor;
- restrained schematic only when useful.

If a human rework comment says the images are raw or unrelated, the rework consumer must regenerate both text and visuals and must not return the same image hashes or the same renderer variants.
