
# Ratgeber imagegen workflow policy

Date: 2026-05-12

## Decision

Ratgeber illustrations should not default to the OpenAI Images API. The preferred path is to use the already-paid ChatGPT/Codex subscription through the existing `imagegen-workflow` style used for tool-card illustrations.

## Target architecture

1. `opcl` article pipeline finishes a Ratgeber artifact.
2. The artifact contains `article.md`, `job.json`, `review_packet.json`, and an image brief file for two narrative scenes:
   - `cover` — cinematic/story-led cover illustration;
   - `workflow` — a second, distinct narrative scene inside the article.
3. A Windows/Codex-side image worker consumes pending briefs and generates images through the subscription-backed imagegen workflow, not the API billing path.
4. Generated assets are copied back to the artifact as:
   - `cover.png`
   - `workflow.png`
   - `visual_generation.json`
5. Cloudflare candidate sync uploads the candidate to review. Until this image worker is dependable, upload must not be blocked solely by fallback artwork.

## Guardrails

- Avoid OpenAI Images API as the default cost path.
- Use API only after explicit approval or for small diagnostics.
- Images must be two distinct artistic scenes, not cloned variants and not raw SVG/diagram placeholders.
- If the image worker is unavailable, Ratgeber should still reach review with a clear visual metadata warning rather than blocking the whole article pipeline.
