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

- `opcl:/opt/openclaw/workspace/agent-newsman/scripts/ratgeber_topic_harvester.py`
  is the source-driven topic collector. It accumulates multi-source clusters
  from the latest intel manifest, local tool candidates, RSS feeds, and optional
  Perplexity enrichment. It may append jobs only when a cluster has several
  sources and several tools/approaches; it must never emit a one-tool article.
- `opcl:/opt/openclaw/workspace/agent-newsman/scripts/journalist_editor.py`
  rejects `tool_spotlight`, `tool_review`, `product_spotlight`, and
  `product_review` before jobs enter the article queue.
- `scripts/ratgeber_cloudflare_candidate_sync.py` is the final runtime guard
  before Cloudflare upload. It rejects forbidden single-tool formats, titles
  like `Tool: Was das Tool im Alltag wirklich taugt`, and candidates whose
  visual quality gate failed.
- If the local repo script is changed, the production copy on `opcl` must be
  updated too; otherwise the review backend can drift back to old behaviour.
- `opcl:/opt/openclaw/workspace/agent-newsman/intel/run_daily_host.sh` runs the
  topic harvester after the daily intel/news pass. The hourly orchestrator then
  queues only jobs accepted by `journalist_editor.py`.

## Source policy

Ratgeber source material is German/English only.

Hard rejects:

- Russian-language or Chinese-language source text;
- `/ru/`, `/zh/`, `/cn/`, `.ru`, `.cn`, Russian/Chinese locale URLs;
- Russian corporate PR, Russian state/local-market "know-how", and sources around
  Sber/Sberbank/SberTech, Platform V, Yandex, VK, Mail.ru, Rambler, Rutube,
  Skolkovo, Tinkoff/T-Bank, MTS, Kaspersky, or Habr.

If a capable Russian-speaking author or founder is used as a source, they must be
working in an international context and publishing in English or German. The site
must not use Russian or Chinese language excerpts in article sources, article
bodies, public previews, metadata, or sidebars.

## Tool linking contract

Ratgeber articles are part of the Utildesk catalog, not detached blog posts.

Rules:

- every recognized tool name in the article body should link to its internal
  Utildesk card when that card exists;
- source links remain only in the `Quellen` section or explicit source context;
- if the article mentions a relevant tool that has no Utildesk card yet, the
  pipeline must add it to the tool-candidate queue/Sheets review flow and leave
  the mention unlinked until the card exists;
- after the missing card is published, the article can be re-exported so the
  mention becomes an internal link.

## Topic harvesting

Ratgeber topic production is intentionally cluster-first:

- gather signals from Hacker News, Product Hunt, the existing daily candidates
  file, and optional Perplexity research;
- do not gather Habr or other RU/CN/CJK/Russian-corporate sources;
- keep a persistent pool in
  `data/article_jobs/ratgeber_topic_pool.json`;
- wait until a topic has source diversity, enough URLs, and multiple relevant
  tools or approaches;
- append only comparison, trend, workflow, how-to, or explainer jobs to
  `data/article_jobs/latest_run.json`;
- let NotebookLM/article runner produce the article only after the orchestrator
  and editor gate accept the job.

This means zero candidates is an acceptable state. A weak one-tool candidate is
not acceptable.

## Illustration direction

Images must not become a cloned diagram factory.

Rules:

- use different visual styles across articles;
- at least one image per article should be an artistic narrative illustration;
- use a schematic only when it explains a real process;
- do not use two similar diagrams in one article by default;
- no internal service labels, debug captions, footer slogans, or prompt notes inside images;
- the picture must add editorial meaning: scene, metaphor, comparison, or memory hook.
- the built-in HTML/PNG renderer is a draft fallback only; its output must not be uploaded as `review_ready` final artwork.
- final review artwork must carry approved visual metadata such as `source: chatgpt_manual` or `manual_approved_artwork` plus `approvedForReview: true`.

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

Operationally, this means `scripts/ratgeber_cloudflare_candidate_sync.py` rejects:

- local HTML fallback renderer output;
- untagged pre-existing PNG pairs;
- identical cover/workflow hashes;
- visual metadata that still contains generic diagram, placeholder, debug, or service-label signals.
