import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import matter from "gray-matter";
import { marked } from "marked";
import {
  buildArticleMotionMarkup,
  replaceInlineMotionImage,
} from "../../src/lib/articleMotion.mjs";
import { onRequest as onPagesRequest } from "../../functions/_middleware.js";
import { listRuntimeEntries } from "../runtime-content.mjs";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const slug = "cloudflare-webmcp-browser-run-lab-operatoren-pruefen";
const sources = {
  de: path.join(siteRoot, "content/ratgeber", `${slug}.md`),
  en: path.join(siteRoot, "content/en/ratgeber", `${slug}.md`),
};
const assets = {
  heroVideo: "/videos/ratgeber/cloudflare-webmcp-browser-run-lab-hero-loop-da23b913e3cdc6c5.mp4",
  inlineVideo: "/videos/ratgeber/cloudflare-webmcp-railway-signal-loop-f2fd80a0345934e2.mp4",
  heroPoster: "/images/ratgeber/cloudflare-webmcp-browser-run-lab-hero-poster-7d734cb28f4d41c2.webp",
  inlinePoster: "/images/ratgeber/cloudflare-webmcp-railway-signal-poster-d08e5ef9d6376a80.webp",
};
const inlineAlts = {
  de: "Eine Fahrdienstleiterin stellt das Signal für einen wartenden automatisierten Triebwagen.",
  en: "A railway signal operator clears the signal for a waiting automated railcar.",
};
const publishedAssets = Object.fromEntries(Object.entries(assets).map(([key, value]) => [key, path.join(siteRoot, "public", value.slice(1))]));
const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");
const count = (source, pattern) => [...String(source).matchAll(pattern)].length;

const readArticles = async () => Object.fromEntries(await Promise.all(
  Object.entries(sources).map(async ([locale, file]) => [locale, matter(await readFile(file, "utf8"))]),
));

test("approved DE and EN article metadata keeps archive identity and truthful review status", async () => {
  const articles = await readArticles();
  for (const [locale, { data }] of Object.entries(articles)) {
    assert.equal(data.slug, slug);
    assert.equal(data.date, "2026-08-14");
    assert.equal(data.updated, "2026-11-07");
    assert.equal(data.releaseOrder, 52);
    assert.equal(data.editorial_reviewed, false);
    assert.equal(data.ai_assistance, true);
    assert.equal(data.ai_disclosure_mode, "required-text");
    assert.equal(data.cover_disclosure, "ai-generated");
    assert.equal(Object.hasOwn(data, "status"), false);
    assert.equal(data.canonicalUrl, `https://tools.utildesk.de/${locale === "en" ? "en/" : ""}ratgeber/${slug}/`);
    assert.equal(data.relatedTools.length, 3);
    assert.equal(data.coverVideo, assets.heroVideo);
    assert.equal(data.secondaryImage, assets.inlinePoster);
    assert.equal(data.inlineVideo, assets.inlineVideo);
    assert.equal(data.inlineVideoAlt, inlineAlts[locale]);
  }
});

test("Markdown mirrors retain a useful inline poster and expose no placeholders", async () => {
  const articles = await readArticles();
  for (const [locale, { data, content }] of Object.entries(articles)) {
    assert.doesNotMatch(content, /\[NEW (?:HERO|INLINE) MOTION\]/);
    const inlineImage = [...content.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)]
      .find(([, , source]) => source === assets.inlinePoster);
    assert.ok(inlineImage, `${locale} Markdown includes the new railway poster`);
    assert.equal(inlineImage[1], data.inlineVideoAlt);
    assert.equal(inlineImage[2], assets.inlinePoster);
    const markdownHtml = await marked.parse(content);
    assert.doesNotMatch(markdownHtml, /\[NEW (?:HERO|INLINE) MOTION\]/);

    const unchanged = replaceInlineMotionImage(markdownHtml, {
      video: "https://example.com/not-a-local-loop.mp4",
      poster: data.secondaryImage,
      alt: data.inlineVideoAlt,
      locale,
      slug,
    });
    assert.equal(unchanged, markdownHtml);
    assert.match(unchanged, new RegExp(`<img\\b[^>]+src="${assets.inlinePoster.replaceAll("/", "\\/")}"`));
  }
});

test("static DE, static EN, and runtime renderer share motion handling", async () => {
  const renderers = [
    path.join(siteRoot, "src/pages/ratgeber/[slug].astro"),
    path.join(siteRoot, "src/pages/[locale]/ratgeber/[slug].astro"),
    path.join(siteRoot, "runtime-src/components/RuntimeRatgeberDetail.astro"),
  ];
  for (const renderer of renderers) {
    const source = await readFile(renderer, "utf8");
    assert.match(source, /articleMotion\.mjs/);
    assert.match(source, /buildArticleMotionMarkup\(/);
    assert.match(source, /replaceInlineMotionImage\(/);
  }
});

test("hero and inline output use one approved video each and localized descriptions", async () => {
  const articles = await readArticles();
  for (const [locale, { data, content }] of Object.entries(articles)) {
    const hero = buildArticleMotionMarkup({
      video: data.coverVideo,
      poster: data.coverImage,
      alt: data.coverVideoAlt,
      locale,
      slug,
      position: "hero",
    });
    const body = await marked.parse(content);
    const staticBody = body.replace(/<p>\s*(<img\b[^>]*>)\s*<\/p>/, '<figure class="article-inline-image">$1</figure>');
    const inline = replaceInlineMotionImage(staticBody, {
      video: data.inlineVideo,
      poster: data.secondaryImage,
      alt: data.inlineVideoAlt,
      locale,
      slug,
    });
    const runtimeInline = replaceInlineMotionImage(body, {
      video: data.inlineVideo,
      poster: data.secondaryImage,
      alt: data.inlineVideoAlt,
      locale,
      slug,
    });
    const html = `${hero}${inline}`;

    assert.equal(count(hero, /<video\b/g), 1);
    assert.equal(count(inline, /<video\b/g), 1);
    assert.ok(inline.includes(`data-src="${assets.inlineVideo}"`));
    assert.equal(inline, runtimeInline);
    assert.equal(count(html, /<video\b/g), 2);
    assert.equal(count(html, /<figure class="article-inline-image article-motion-inline">/g), 1);
    assert.equal(count(inline, /class="article-motion-poster"/g), 1);
    assert.equal(count(inline, /<img\b/g), 1);
    assert.doesNotMatch(html, /\[NEW (?:HERO|INLINE) MOTION\]/);
    assert.match(html, new RegExp(data.coverVideoAlt.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(html, new RegExp(data.inlineVideoAlt.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.equal(html.includes("cloudflare-webmcp-browser-run-lab-cover-pop-art.webp"), false);
    assert.equal(html.includes("cloudflare-webmcp-browser-run-lab-workflow-pop-art.webp"), false);
    assert.match(html, /muted loop playsinline preload="none"/);
    assert.match(html, /data-src="\/videos\/ratgeber\//);
    assert.match(html, /class="article-motion-poster" src="\/images\/ratgeber\//);
    assert.doesNotMatch(html, /<video[^>]+\ssrc=/);
  }
});

test("motion markup rejects unsafe asset paths and escapes localized descriptions", () => {
  const rejected = buildArticleMotionMarkup({
    video: '/videos/ratgeber/loop.mp4" onerror="alert(1)',
    poster: assets.heroPoster,
    alt: "Hotel desk",
    slug,
  });
  assert.equal(rejected, "");

  const markup = buildArticleMotionMarkup({
    video: assets.heroVideo,
    poster: assets.heroPoster,
    alt: 'A "hotel" & <robot>',
    locale: "en",
    slug,
    position: "hero",
  });
  assert.match(markup, /aria-label="A &quot;hotel&quot; &amp; &lt;robot&gt;"/);
  assert.doesNotMatch(markup, /<robot>|onerror=|<script\b/i);
  assert.match(markup, /aria-label="Play or pause animation"/);
  assert.match(markup, /type="button"[^>]*aria-pressed="false"/);
});

test("source media are the approved assets and runtime stores unreviewed status", async () => {
  for (const [name, file] of Object.entries(publishedAssets)) assert.equal(existsSync(file), true, `${name} is present`);

  assert.equal(await sha256(await readFile(publishedAssets.heroVideo)), "da23b913e3cdc6c555e21ca2c31e5519b96554badacffdbcdf4856a58376a126");
  assert.equal(await sha256(await readFile(publishedAssets.inlineVideo)), "f2fd80a0345934e2226405bf171500733e63b22c6d19ffee67e2bfd3f6298101");
  assert.equal(await sha256(await readFile(publishedAssets.heroPoster)), "7d734cb28f4d41c276ae551dcbaead26d5e3122ab06656490b51792ec2145525");
  assert.equal(await sha256(await readFile(publishedAssets.inlinePoster)), "d08e5ef9d6376a80ef0a9a6750567cc75bfd43e751bbcbdf7c01178e713341ba");

  for (const locale of ["de", "en"]) {
    const entry = (await listRuntimeEntries({ kind: "ratgeber", locale })).find((candidate) => candidate.slug === slug);
    assert.ok(entry, `${locale} runtime entry exists`);
    assert.equal(entry.editorialReviewed, 0);
    assert.equal(entry.sourcePublishedAt, "2026-08-14T00:00:00.000Z");
    assert.equal(entry.sourceUpdatedAt, "2026-11-07T00:00:00.000Z");
  }
});

test("reduced-motion handling is opt-in to manual play and keyboard-operable", async () => {
  const script = await readFile(path.join(siteRoot, "public/scripts/ratgeber-article-motion.js"), "utf8");
  assert.match(script, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/);
  assert.match(script, /new IntersectionObserver/);
  assert.match(script, /!motionPreference\.matches/);
  assert.match(script, /button\.addEventListener\("click"/);
  assert.match(script, /void playVideo\(true\)/);
  assert.match(script, /video\.pause\(\)/);

  const markup = buildArticleMotionMarkup({
    video: assets.heroVideo,
    poster: assets.heroPoster,
    alt: "A hotel clerk and a brass automaton at reception.",
    locale: "en",
    slug,
    position: "hero",
  });
  assert.match(markup, /aria-controls="article-motion-/);
  assert.match(markup, /aria-pressed="false"/);
  assert.match(markup, /muted loop playsinline preload="none"/);
  assert.doesNotMatch(markup, /<video[^>]+\ssrc=/);
});

test("Pages middleware leaves the new video paths on static asset serving", async () => {
  let nextCalls = 0;
  const staticAssetResponse = new Response("static video asset", { status: 200 });
  const env = new Proxy({}, {
    get() {
      throw new Error("video asset routing must not read a Worker binding");
    },
  });
  const result = await onPagesRequest({
    request: new Request(`https://tools.utildesk.de${assets.heroVideo}`),
    env,
    next() {
      nextCalls += 1;
      return staticAssetResponse;
    },
  });

  assert.equal(result, staticAssetResponse);
  assert.equal(nextCalls, 1);
});
