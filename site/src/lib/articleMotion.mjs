const videoPathPattern = /^\/videos\/ratgeber\/[A-Za-z0-9][A-Za-z0-9._-]*\.mp4$/;
const posterPathPattern = /^\/images\/ratgeber\/[A-Za-z0-9][A-Za-z0-9._-]*\.webp$/;
const inlineImageBlockPattern = /<figure class="article-inline-image">\s*(<img\b[^>]*>)\s*<\/figure>|<p>\s*(<img\b[^>]*>)\s*<\/p>/g;

const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}[character]));

const safeIdPart = (value) => String(value ?? "")
  .toLowerCase()
  .replace(/[^a-z0-9_-]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 64) || "article";

const motionLabels = {
  de: {
    toggle: "Animation abspielen oder pausieren",
    play: "Animation abspielen",
    pause: "Animation pausieren",
  },
  en: {
    toggle: "Play or pause animation",
    play: "Play animation",
    pause: "Pause animation",
  },
};

export function buildArticleMotionMarkup({
  video,
  poster,
  alt,
  locale = "de",
  slug,
  position = "inline",
}) {
  const safeVideo = String(video ?? "");
  const safePoster = String(poster ?? "");
  const description = String(alt ?? "").trim();
  const language = locale === "en" ? "en" : "de";
  if (!videoPathPattern.test(safeVideo) || !posterPathPattern.test(safePoster) || !description) return "";

  const placement = position === "hero" ? "hero" : "inline";
  const id = `article-motion-${safeIdPart(slug)}-${language}-${placement}`;
  const labels = motionLabels[language];
  const posterLoading = placement === "hero" ? "eager" : "lazy";
  const fetchPriority = placement === "hero" ? ' fetchpriority="high"' : "";

  return `<div class="article-motion" data-article-motion role="group" aria-label="${escapeHtml(description)}">
  <div class="article-motion-frame">
    <img class="article-motion-poster" src="${safePoster}" alt="" loading="${posterLoading}" decoding="async" width="1280" height="720"${fetchPriority}>
    <video id="${escapeHtml(id)}" class="article-motion-video" data-motion-video data-src="${safeVideo}" data-poster="${safePoster}" data-play-label="${escapeHtml(labels.play)}" data-pause-label="${escapeHtml(labels.pause)}" aria-hidden="true" tabindex="-1" muted loop playsinline preload="none" width="1280" height="720"></video>
  </div>
  <button class="article-motion-toggle" type="button" data-article-motion-toggle aria-controls="${escapeHtml(id)}" aria-label="${escapeHtml(labels.toggle)}" aria-pressed="false">
    <span class="article-motion-icon" aria-hidden="true" data-motion-icon>▶</span>
    <span class="article-motion-label" aria-hidden="true" data-motion-label>${escapeHtml(labels.play)}</span>
  </button>
</div>`;
}

export function replaceInlineMotionImage(html, options) {
  const source = String(html ?? "");
  const video = String(options?.video ?? "");
  const poster = String(options?.poster ?? "");
  const description = String(options?.alt ?? "").trim();
  if (!videoPathPattern.test(video) || !posterPathPattern.test(poster) || !description) return source;

  const expectedAlt = escapeHtml(description);
  const imageBlocks = [...source.matchAll(inlineImageBlockPattern)];
  const matchingBlocks = imageBlocks.filter((match) => {
    const image = match[1] ?? match[2] ?? "";
    const src = image.match(/\bsrc="([^"]*)"/)?.[1];
    const alt = image.match(/\balt="([^"]*)"/)?.[1];
    return src === poster && alt === expectedAlt;
  });
  if (matchingBlocks.length === 0) return source;
  if (matchingBlocks.length !== 1) throw new Error(`Expected one inline poster image matching metadata; found ${matchingBlocks.length}`);

  const markup = buildArticleMotionMarkup({ ...options, position: "inline" });
  const match = matchingBlocks[0];
  const replacement = `<figure class="article-inline-image article-motion-inline">${markup}</figure>`;
  return source.slice(0, match.index) + replacement + source.slice(match.index + match[0].length);
}
