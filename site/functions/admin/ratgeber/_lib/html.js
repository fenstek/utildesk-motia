export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function pageShell(title, body, options = {}) {
  const pageTitle = `${title} | Utildesk Ratgeber Review`;
  const wideClass = options.wide ? " app--wide" : "";
  return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex,nofollow">
    <title>${escapeHtml(pageTitle)}</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f4efe6;
        --paper: #fffaf1;
        --paper-strong: #fffdf8;
        --ink: #17211d;
        --muted: #64716c;
        --brand: #0d5b53;
        --brand-2: #7ee2d1;
        --line: rgba(34, 57, 49, 0.14);
        --shadow: 0 24px 80px rgba(20, 31, 27, 0.12);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: var(--ink);
        background:
          radial-gradient(circle at top left, rgba(126,226,209,0.22), transparent 28rem),
          linear-gradient(135deg, #f8f3ea 0%, #ede6da 100%);
      }
      a { color: var(--brand); text-decoration: none; }
      a:hover { text-decoration: underline; }
      .app {
        width: min(1180px, calc(100vw - 40px));
        margin: 0 auto;
        padding: 32px 0 56px;
      }
      .app--wide { width: min(1380px, calc(100vw - 40px)); }
      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 28px;
      }
      .brand {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        font-weight: 900;
        letter-spacing: -0.03em;
      }
      .brand-mark {
        width: 34px;
        height: 34px;
        border-radius: 11px;
        background: linear-gradient(135deg, var(--brand), #12352f);
        box-shadow: inset 0 0 0 1px rgba(255,255,255,0.14);
      }
      .nav {
        display: flex;
        align-items: center;
        gap: 14px;
        color: var(--muted);
        font-size: 0.94rem;
      }
      .hero-panel,
      .card,
      .article-shell {
        background: rgba(255, 250, 241, 0.86);
        border: 1px solid var(--line);
        border-radius: 28px;
        box-shadow: var(--shadow);
      }
      .hero-panel {
        padding: 28px;
        margin-bottom: 22px;
      }
      .hero-panel h1 {
        margin: 0 0 10px;
        font-size: clamp(2rem, 4vw, 4.2rem);
        line-height: 0.98;
        letter-spacing: -0.07em;
      }
      .hero-panel p {
        max-width: 70ch;
        margin: 0;
        color: var(--muted);
        font-size: 1.05rem;
        line-height: 1.65;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 18px;
      }
      .candidate-card {
        padding: 22px;
        min-height: 220px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .candidate-card h2 {
        margin: 0 0 12px;
        font-size: 1.3rem;
        letter-spacing: -0.035em;
      }
      .candidate-card p {
        margin: 0 0 16px;
        color: var(--muted);
        line-height: 1.55;
      }
      .meta-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        border: 1px solid var(--line);
        border-radius: 999px;
        padding: 5px 10px;
        background: rgba(255,255,255,0.55);
        color: var(--muted);
        font-size: 0.8rem;
        font-weight: 750;
      }
      .badge--good { color: var(--brand); background: rgba(126,226,209,0.16); }
      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border: 0;
        border-radius: 999px;
        padding: 11px 18px;
        background: var(--brand);
        color: white;
        font: inherit;
        font-weight: 850;
        cursor: pointer;
      }
      .button:hover { text-decoration: none; background: #0b4c46; }
      .button--ghost {
        color: var(--brand);
        background: rgba(13, 91, 83, 0.08);
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
      }
      .empty {
        padding: 32px;
        color: var(--muted);
        background: rgba(255,255,255,0.45);
        border: 1px dashed var(--line);
        border-radius: 24px;
      }
      .article-head {
        max-width: 860px;
        padding: 10px 0 30px;
      }
      .article-eyebrow {
        color: var(--brand);
        font-weight: 900;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        font-size: 0.78rem;
        margin: 0 0 12px;
      }
      .article-head h1 {
        margin: 0;
        font-size: clamp(2.2rem, 5vw, 5rem);
        line-height: 0.98;
        letter-spacing: -0.07em;
      }
      .article-excerpt {
        margin: 18px 0 0;
        color: var(--muted);
        max-width: 70ch;
        line-height: 1.75;
        font-size: 1.1rem;
      }
      .article-cover {
        margin: 18px auto 42px;
        width: min(1220px, 100%);
        border-radius: 32px;
        overflow: hidden;
        border: 1px solid var(--line);
        background: #fff8ec;
        box-shadow: 0 22px 60px rgba(24, 36, 32, 0.12);
      }
      .article-cover img {
        display: block;
        width: 100%;
        max-height: 720px;
        object-fit: contain;
        cursor: zoom-in;
      }
      .article-layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 300px;
        gap: 48px;
        align-items: start;
      }
      .prose {
        font-size: 1.05rem;
        line-height: 1.82;
      }
      .prose h2 {
        margin: 2.55rem 0 1rem;
        padding-top: 1.4rem;
        border-top: 1px solid var(--line);
        font-size: clamp(1.45rem, 2vw, 2rem);
        line-height: 1.16;
        letter-spacing: -0.04em;
      }
      .prose h3 { margin: 1.6rem 0 0.6rem; font-size: 1.16rem; }
      .prose p { margin: 0 0 1.05rem; }
      .prose img {
        display: block;
        width: 100%;
        margin: 2.4rem 0;
        border-radius: 28px;
        border: 1px solid var(--line);
        background: #fff8ec;
        cursor: zoom-in;
        box-shadow: 0 18px 44px rgba(24, 36, 32, 0.10);
      }
      .summary {
        position: sticky;
        top: 18px;
        padding: 22px;
        background: rgba(255, 255, 255, 0.54);
        border: 1px solid var(--line);
        border-radius: 24px;
      }
      .summary h2 { margin: 0 0 12px; font-size: 0.92rem; text-transform: uppercase; letter-spacing: 0.16em; }
      .summary ul { margin: 0; padding-left: 1.1rem; color: var(--muted); line-height: 1.55; }
      .lightbox {
        position: fixed;
        inset: 0;
        z-index: 50;
        display: none;
        place-items: center;
        padding: 28px;
        background: rgba(9, 18, 15, 0.82);
      }
      .lightbox.is-open { display: grid; }
      .lightbox img {
        max-width: min(96vw, 1600px);
        max-height: 92vh;
        border-radius: 20px;
        background: #fff8ec;
      }
      @media (max-width: 860px) {
        .grid,
        .article-layout { grid-template-columns: 1fr; }
        .summary { position: static; }
        .topbar { align-items: flex-start; flex-direction: column; }
      }
    </style>
  </head>
  <body>
    <main class="app${wideClass}">
      <div class="topbar">
        <a class="brand" href="/admin/ratgeber"><span class="brand-mark"></span><span>Utildesk Ratgeber Review</span></a>
        <nav class="nav"><a href="/admin/ratgeber">Kandidaten</a><a href="https://tools.utildesk.de/ratgeber/">Live-Ratgeber</a></nav>
      </div>
      ${body}
    </main>
    <div class="lightbox" data-lightbox><img alt=""></div>
    <script>
      (() => {
        const lightbox = document.querySelector("[data-lightbox]");
        const image = lightbox && lightbox.querySelector("img");
        if (!lightbox || !image) return;
        document.addEventListener("click", (event) => {
          const target = event.target.closest("img[data-lightbox-src], .prose img, .article-cover img");
          if (!target) return;
          image.src = target.getAttribute("data-lightbox-src") || target.currentSrc || target.src;
          lightbox.classList.add("is-open");
        });
        lightbox.addEventListener("click", () => {
          lightbox.classList.remove("is-open");
          image.removeAttribute("src");
        });
        document.addEventListener("keydown", (event) => {
          if (event.key === "Escape") lightbox.classList.remove("is-open");
        });
      })();
    </script>
  </body>
</html>`;
}

export function renderCandidateCard(candidate) {
  const score = candidate.score === null || candidate.score === undefined ? "n/a" : String(candidate.score);
  const publish = candidate.publish?.status ? `Publish: ${candidate.publish.status}` : "not queued";
  return `<article class="card candidate-card">
    <div>
      <h2><a href="/admin/ratgeber/candidate/${encodeURIComponent(candidate.jobId)}">${escapeHtml(candidate.title)}</a></h2>
      <p>${escapeHtml(candidate.excerpt || "Kein Auszug vorhanden.")}</p>
      <div class="meta-row">
        <span class="badge badge--good">${escapeHtml(candidate.status || "review_ready")}</span>
        <span class="badge">Score ${escapeHtml(score)}</span>
        <span class="badge">${escapeHtml(candidate.visualStatus || "visual")}</span>
        <span class="badge">${escapeHtml(publish)}</span>
      </div>
    </div>
    <div class="actions">
      <a class="button button--ghost" href="/admin/ratgeber/candidate/${encodeURIComponent(candidate.jobId)}">Final ansehen</a>
    </div>
  </article>`;
}

export function assetUrl(jobId, name) {
  return `/admin/ratgeber/asset?jobId=${encodeURIComponent(jobId)}&name=${encodeURIComponent(name)}`;
}

export function renderFinalArticle(candidate) {
  const meta = candidate.meta || {};
  const coverName = candidate.assets?.cover?.name;
  const workflowName = candidate.assets?.workflow?.name;
  let articleHtml = candidate.articleHtml || "";

  if (workflowName) {
    articleHtml = articleHtml.replaceAll("__WORKFLOW_IMAGE_URL__", assetUrl(candidate.jobId, workflowName));
  }

  const tags = Array.isArray(meta.tags) ? meta.tags : [];
  const pills = [
    meta.published,
    meta.readTime ? `${meta.readTime} Min. Lesen` : "",
    meta.category,
    ...tags,
  ].filter(Boolean);
  const pillHtml = pills.map((pill) => `<span class="badge">${escapeHtml(pill)}</span>`).join("");
  const cover = coverName
    ? `<figure class="article-cover"><img src="${assetUrl(candidate.jobId, coverName)}" data-lightbox-src="${assetUrl(candidate.jobId, coverName)}" alt="${escapeHtml(meta.eyebrow || "Ratgeber Illustration")}" loading="eager"></figure>`
    : "";
  const sidebarPoints = Array.isArray(meta.sidebarPoints) ? meta.sidebarPoints : [];
  const summary = sidebarPoints.length
    ? `<aside class="summary"><h2>${escapeHtml(meta.sidebarTitle || "Kurzfazit")}</h2><ul>${sidebarPoints.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}</ul></aside>`
    : `<aside class="summary"><h2>Kontrolle</h2><ul><li>Text und Bilder entsprechen dem aktuell hochgeladenen Kandidatenpaket.</li><li>Die Veröffentlichung läuft erst nach Klick auf Publizieren.</li></ul></aside>`;

  return `<section class="article-shell" style="padding: clamp(22px, 4vw, 54px);">
    <div class="article-head">
      <p class="article-eyebrow">${escapeHtml(meta.eyebrow || "Ratgeber")}</p>
      <h1>${escapeHtml(candidate.title)}</h1>
      <p class="article-excerpt">${escapeHtml(candidate.excerpt || "")}</p>
      <div class="meta-row" style="margin-top: 20px;">${pillHtml}</div>
    </div>
    ${cover}
    <div class="article-layout">
      <article class="prose">${articleHtml}</article>
      ${summary}
    </div>
  </section>`;
}
