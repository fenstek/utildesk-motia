# English i18n rollout

Status date: 2026-04-26.

## Goal

Utildesk remains German-first at the canonical root. The English public layer lives under `/en/` and has its own canonical URLs, feeds, JSON APIs, Markdown mirrors, `llms` files, and sitemap entries.

The intended contract is:

- German default: `/`, `/tools/`, `/tools/<slug>/`, `/ratgeber/`, `/ratgeber/<slug>/`.
- English sibling: `/en/`, `/en/tools/`, `/en/tools/<slug>/`, `/en/ratgeber/`, `/en/ratgeber/<slug>/`.
- Search engines receive self-canonicals plus `hreflang` alternates for `de`, `en`, and `x-default`.
- Machine readers can use the same localized path pattern for `/api/*`, `/markdown/*`, `/feed.*`, `/llms.txt`, and `/llms-full.txt`.

## Production implementation

- Locale utilities live in `site/src/lib/i18n.ts`.
- English tool copy is generated from curated German metadata through `site/src/lib/englishContent.ts`.
- Ratgeber content is file-based:
  - German: `content/ratgeber/*.md`
  - English: `content/en/ratgeber/*.md`
- Localized Astro pages live under `site/src/pages/[locale]/`.
- The sitemap generator reads built pages from `site/dist` and includes both German and English public HTML pages.

## Ratgeber automation rule

Autonomous Ratgeber publication must ship a bilingual package.

The site-side importer now accepts an English sibling article from one of these package locations or manifest fields:

- `english_article_file`
- `article_file_en`
- `en_article_file`
- `englishArticleFile`
- `<slug>.en.md`
- `<slug>.en-US.md`
- `en/<slug>.md`
- `en/<slug>.en.md`
- `article.en.md`
- `article_en.md`

When the Cloudflare review publish consumer runs, it calls the importer with `--require-english`. That means the review button should not publish a new Ratgeber article unless the exported package contains both the German article and its English sibling. This is deliberate: after the multilingual rollout, publication should not create German-only article drift.

## Article factory requirement

The `opcl` article factory should produce the English sibling after the German article has passed editorial quality and visual gates. NotebookLM remains the article-writing stage, but the export package must include an English article rendered against the same final layout assumptions:

- same slug;
- translated title, excerpt, sidebar points, tags, body, and source section;
- same `coverImage` and `secondaryImage` URLs unless a localized image is intentionally created;
- no NotebookLM numeric citation residue like `[1-3]`;
- secondary image kept later in the body, not immediately after the intro.

## Current translated scope

- All current public Ratgeber articles have English sibling files.
- All tool detail pages have an English generated catalogue page.
- English category, tag, index, feed, API, Markdown, and `llms` routes are generated from the same production data.

## Verification baseline

The rollout is considered healthy when:

- `npm --prefix site run build` succeeds.
- `/en/`, `/en/tools/`, `/en/tools/<slug>/`, `/en/ratgeber/`, and `/en/ratgeber/<slug>/` return 200.
- English pages emit `lang="en"`, self-canonical URLs, and German/English `hreflang` alternates.
- `sitemap.xml` contains the English public URLs.
- Ratgeber autonomous publish accepts only package diffs under:
  - `content/ratgeber/*.md`
  - `content/en/ratgeber/*.md`
  - `content/images/ratgeber/*.{png,jpg,jpeg,webp}`
