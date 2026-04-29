export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

export function pageShell(title, body, options = {}) {
  const pageTitle = `${title} | Utildesk Ratgeber Review`;
  const mainClass = options.wide
    ? "container review-container review-container--wide"
    : "container review-container";

  return `<!doctype html>
<html lang="de" data-accent="lime">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex,nofollow">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="icon" href="/favicon.ico">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <script>
      (() => {
        const storageKey = "utildesk-theme";
        try {
          const storedTheme = localStorage.getItem(storageKey);
          const theme = storedTheme === "dark" || storedTheme === "light" ? storedTheme : "dark";
          document.documentElement.dataset.theme = theme;
          document.documentElement.style.colorScheme = theme;
        } catch {
          document.documentElement.dataset.theme = "dark";
          document.documentElement.style.colorScheme = "dark";
        }
      })();
    </script>
    <title>${escapeHtml(pageTitle)}</title>
    <style>
      @import url("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&display=swap");

      :root {
        --mono: "JetBrains Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace;
        --container: 1480px;
        --transition: 140ms ease;
        --radius-full: 999px;
        --radius-lg: 0;
        --radius-md: 0;
        --radius-sm: 0;
        --space-4: 16px;
        --space-5: 24px;
        --space-6: 32px;
        --space-7: 48px;
        --space-8: 64px;
        font-synthesis: none;
        text-rendering: optimizeLegibility;
        -webkit-font-smoothing: antialiased;
      }

      :root[data-theme="dark"] {
        color-scheme: dark;
        --bg: #0c0d0a;
        --bg-2: #131410;
        --bg-3: #1a1c17;
        --line: #2a2c25;
        --line-2: #3a3d33;
        --fg: #d8d6c8;
        --fg-2: #9c9b8d;
        --fg-3: #6b6a5d;
        --accent: #b8f36b;
        --accent-d: #6fae3f;
        --ok: #84c267;
        --err: #d97070;
      }

      :root[data-theme="light"] {
        color-scheme: light;
        --bg: #f5f3ea;
        --bg-2: #ebe9df;
        --bg-3: #e2e0d4;
        --line: #c8c5b3;
        --line-2: #b1ad9a;
        --fg: #1d1e18;
        --fg-2: #54564a;
        --fg-3: #828275;
        --accent: #4f7f28;
        --accent-d: #365d1b;
        --ok: #4d7a32;
        --err: #a23737;
      }

      :root {
        --surface-container-low: var(--bg-2);
        --surface-container: var(--bg-2);
        --surface-container-high: var(--bg-3);
        --primary: var(--accent);
        --secondary: var(--fg-2);
        --on-surface: var(--fg);
        --on-surface-variant: var(--fg-2);
        --text-muted: var(--fg-2);
      }

      *,
      *::before,
      *::after {
        box-sizing: border-box;
      }

      html,
      body {
        margin: 0;
        padding: 0;
      }

      body {
        min-height: 100vh;
        font-family: var(--mono);
        background:
          linear-gradient(90deg, transparent 0, transparent calc(100% - 1px), color-mix(in srgb, var(--line) 48%, transparent) calc(100% - 1px)) center / 24px 24px,
          radial-gradient(circle at 14% 0%, color-mix(in srgb, var(--accent) 9%, transparent), transparent 28rem),
          var(--bg);
        color: var(--fg);
        font-size: 13px;
        line-height: 1.45;
        font-feature-settings: "calt" 0, "liga" 0;
      }

      ::selection {
        background: var(--accent);
        color: var(--bg);
      }

      img {
        display: block;
        max-width: 100%;
      }

      a {
        color: inherit;
        text-decoration: none;
        cursor: pointer;
      }

      a:hover {
        color: var(--accent);
      }

      button,
      input,
      select,
      textarea {
        font: inherit;
      }

      button {
        cursor: pointer;
      }

      :focus-visible {
        outline: 1px solid var(--accent);
        outline-offset: 3px;
      }

      .skip-link {
        position: absolute;
        left: 16px;
        top: 16px;
        z-index: 1000;
        padding: 8px 12px;
        border: 1px solid var(--accent);
        background: var(--bg);
        color: var(--accent);
        transform: translateY(-160%);
        transition: transform 0.2s ease;
      }

      .skip-link:focus {
        transform: translateY(0);
      }

      .container {
        width: min(var(--container), 100%);
        margin: 0 auto;
        padding: 0 18px;
      }

      .site-header .container,
      main.container,
      .site-footer .container {
        border-left: 1px solid var(--line);
        border-right: 1px solid var(--line);
      }

      main.container {
        min-height: 64vh;
      }

      .site-header {
        position: sticky;
        top: 0;
        z-index: 100;
        background: color-mix(in srgb, var(--bg) 92%, transparent);
        border-bottom: 1px solid var(--line);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
      }

      .site-header .container {
        padding: 0;
      }

      .hdr-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        padding: 9px 18px;
      }

      .hdr-top {
        border-bottom: 1px dashed var(--line);
      }

      .brand {
        display: inline-flex;
        align-items: baseline;
        gap: 12px;
        min-width: 0;
        color: var(--fg);
      }

      .brand-mark-text {
        color: var(--accent);
        font-weight: 800;
        letter-spacing: 0.04em;
      }

      .brand-sub {
        color: var(--fg-3);
        font-size: 12px;
      }

      .hdr-meta,
      .hdr-status {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        color: var(--fg-3);
        font-size: 11px;
      }

      .hdr-status {
        padding: 6px 18px;
        border-top: 1px dashed var(--line);
        background: var(--bg-2);
      }

      .live-dot {
        display: inline-block;
        width: 6px;
        height: 6px;
        margin-right: 5px;
        border-radius: 50%;
        background: var(--ok);
        vertical-align: middle;
        animation: pulse 1.4s ease-in-out infinite;
      }

      @keyframes pulse {
        0%,
        100% { opacity: 1; }
        50% { opacity: 0.35; }
      }

      .dot {
        color: var(--line-2);
      }

      .nav-links,
      .nav-actions {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
      }

      .nav-links a {
        position: relative;
        padding: 4px 0;
        margin-right: 16px;
        color: var(--fg-2);
        font-size: 12px;
        border-bottom: 1px solid transparent;
      }

      .nav-links a:hover {
        color: var(--fg);
        border-bottom-color: var(--line-2);
      }

      .nav-links a[aria-current="page"] {
        color: var(--accent);
        border-bottom-color: var(--accent);
      }

      .nav-links a[aria-current="page"]::before {
        content: "> ";
      }

      .btn-ghost,
      .theme-toggle,
      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 28px;
        border: 1px solid var(--line);
        background: transparent;
        color: var(--fg-2);
        padding: 5px 10px;
        font-size: 12px;
        letter-spacing: 0.02em;
        transition: color var(--transition), border-color var(--transition), background var(--transition);
      }

      .btn-ghost:hover,
      .theme-toggle:hover,
      .button:hover {
        background: var(--bg-2);
        border-color: var(--line-2);
        color: var(--fg);
        text-decoration: none;
      }

      .button {
        border-color: var(--accent);
        background: var(--accent);
        color: var(--bg);
        font-weight: 800;
      }

      .button:hover {
        background: var(--accent-d);
        border-color: var(--accent-d);
        color: var(--bg);
      }

      .button--ghost {
        border-color: var(--line);
        background: transparent;
        color: var(--fg-2);
      }

      .theme-toggle::before {
        content: "[";
        color: var(--fg-3);
      }

      .theme-toggle::after {
        content: "]";
        color: var(--fg-3);
      }

      .hero-panel {
        border-bottom: 1px solid var(--line);
        padding: 28px 0 30px;
      }

      .hero-panel h1 {
        margin: 0 0 10px;
        font-size: clamp(2rem, 3.5vw, 3.2rem);
        line-height: 1.08;
        letter-spacing: -0.03em;
      }

      .hero-panel p {
        max-width: 70ch;
        margin: 0;
        color: var(--fg-2);
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        border-left: 1px solid var(--line);
        border-top: 1px solid var(--line);
        margin: 24px 0 56px;
      }

      .card {
        border-right: 1px solid var(--line);
        border-bottom: 1px solid var(--line);
      }

      .candidate-card {
        padding: 18px;
        min-height: 230px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        background: color-mix(in srgb, var(--bg-2) 76%, transparent);
      }

      .candidate-card h2 {
        margin: 0 0 12px;
        font-size: 1.05rem;
        line-height: 1.35;
      }

      .candidate-card p {
        margin: 0 0 16px;
        color: var(--fg-2);
        line-height: 1.6;
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
        padding: 5px 10px;
        background: var(--bg-2);
        color: var(--fg-2);
        font-size: 0.78rem;
        font-weight: 600;
      }

      .badge--good {
        color: var(--accent);
        background: color-mix(in srgb, var(--accent) 10%, var(--bg-2));
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
      }

      .empty {
        padding: 32px;
        color: var(--fg-2);
        background: var(--bg-2);
        border: 1px dashed var(--line);
      }

                  .review-action-panel {
                    display: flex;
                    justify-content: space-between;
                    gap: 18px;
                    align-items: center;
        flex-wrap: wrap;
        padding: 12px 0;
        border-bottom: 1px solid var(--line);
                    color: var(--fg-2);
                  }

                  .review-action-panel--stacked {
                    align-items: flex-start;
                  }

      .review-action-panel p {
        margin: 0 0 4px;
        color: var(--fg-3);
        font-size: 11px;
      }

                  .review-action-panel strong {
                    color: var(--fg);
                    font-size: 12px;
                    word-break: break-word;
                  }

                  .review-rework-form {
                    display: grid;
                    gap: 8px;
                    min-width: min(560px, 100%);
                  }

                  .review-rework-label {
                    color: var(--fg-3);
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.12em;
                  }

                  .review-rework-form textarea {
                    width: 100%;
                    min-height: 86px;
                    border: 1px solid var(--line);
                    background: var(--bg-2);
                    color: var(--fg);
                    padding: 10px 12px;
                    resize: vertical;
                  }

      .article-head {
        max-width: 760px;
        padding: 32px 0;
        border-bottom: 1px solid rgba(190, 201, 197, 0.25);
      }

      .article-eyebrow {
        margin: 0 0 12px;
        font-size: 0.73rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        color: var(--primary);
      }

      .article-head h1 {
        margin: 0;
        font-size: clamp(1.6rem, 2.8vw, 2.4rem);
        line-height: 1.2;
        letter-spacing: -0.025em;
        font-weight: 800;
        max-width: 24ch;
      }

      .article-excerpt {
        margin: 16px 0 0;
        max-width: 62ch;
        color: var(--secondary);
        font-size: 1.05rem;
        line-height: 1.75;
      }

      .article-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 20px;
      }

      .pill {
        display: inline-flex;
        align-items: center;
        padding: 5px 12px;
        border-radius: var(--radius-full);
        background: var(--surface-container-low);
        color: var(--on-surface-variant);
        font-size: 0.78rem;
        font-weight: 600;
        border: 1px solid rgba(190, 201, 197, 0.3);
      }

      .pill--accent,
      .pill--tool {
        color: var(--primary);
        background: color-mix(in srgb, var(--primary) 7%, transparent);
        border-color: color-mix(in srgb, var(--primary) 20%, transparent);
      }

      .article-cover {
        margin: 28px 0 0;
        border-radius: clamp(24px, 2.4vw, 32px);
        overflow: visible;
        border: none;
        background: transparent;
        box-shadow: none;
      }

      .article-cover-trigger {
        display: block;
        width: 100%;
        padding: 0;
        border: none;
        margin: 0;
        background: transparent;
        cursor: zoom-in;
        text-align: left;
        border-radius: inherit;
        overflow: hidden;
      }

      .article-cover img {
        display: block;
        width: 100%;
        height: auto;
        object-fit: contain;
        max-height: min(88vh, 1020px);
        cursor: zoom-in;
        transition: filter var(--transition), opacity var(--transition);
      }

      .article-body {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 280px;
        gap: var(--space-6);
        align-items: start;
        margin-top: 40px;
      }

      .ratgeber-prose {
        font-size: 1rem;
        line-height: 1.8;
        color: var(--on-surface);
      }

      .ratgeber-prose > p:first-of-type {
        color: var(--on-surface-variant);
        font-size: 1.08rem;
        line-height: 1.78;
      }

      .ratgeber-prose h2 {
        margin: 2.4rem 0 0.9rem;
        padding-top: 1.4rem;
        border-top: 1px solid rgba(190, 201, 197, 0.3);
        font-size: clamp(1.3rem, 2.2vw, 1.75rem);
        line-height: 1.15;
        letter-spacing: -0.02em;
      }

      .ratgeber-prose h3 {
        margin: 1.6rem 0 0.6rem;
        font-size: 1.1rem;
        font-weight: 700;
      }

      .ratgeber-prose p {
        margin: 0 0 1rem;
        color: var(--on-surface);
      }

      .ratgeber-prose ul,
      .ratgeber-prose ol {
        margin: 0 0 1rem 1.4rem;
        padding: 0;
      }

      .ratgeber-prose li {
        margin-bottom: 0.4rem;
        color: var(--on-surface);
        line-height: 1.7;
      }

      .ratgeber-prose table {
        width: 100%;
        border-collapse: collapse;
        margin: 1.5rem 0;
        font-size: 0.92rem;
        border: 1px solid rgba(190, 201, 197, 0.3);
      }

      .ratgeber-prose th {
        background: var(--surface-container-low);
        font-weight: 700;
        text-align: left;
        padding: 10px 14px;
        border-bottom: 1px solid rgba(190, 201, 197, 0.3);
        font-size: 0.84rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .ratgeber-prose td {
        padding: 9px 14px;
        border-bottom: 1px solid rgba(190, 201, 197, 0.15);
        vertical-align: top;
      }

      .ratgeber-prose tr:last-child td {
        border-bottom: none;
      }

      .ratgeber-prose .article-inline-image {
        margin: clamp(2rem, 4vw, 2.8rem) 0 clamp(2.3rem, 4vw, 3.1rem);
      }

      .ratgeber-prose ul + .article-inline-image,
      .ratgeber-prose ol + .article-inline-image {
        margin-top: clamp(2.8rem, 5vw, 3.6rem);
      }

      .ratgeber-prose h2 + .article-inline-image {
        margin-top: 1.6rem;
      }

      .ratgeber-prose .article-inline-image + h2 {
        margin-top: clamp(2.8rem, 5vw, 3.4rem);
      }

      .ratgeber-prose img {
        display: block;
        width: 100%;
        margin: 0;
        padding: 6px;
        border: 1px solid rgba(190, 201, 197, 0.28);
        border-radius: var(--radius-md);
        background: var(--surface-container-low);
        cursor: zoom-in;
        object-fit: contain;
        transition: filter var(--transition), opacity var(--transition), border-color var(--transition), background var(--transition);
      }

      .ratgeber-prose a {
        color: var(--primary);
        text-decoration: underline;
        text-decoration-color: rgba(23, 98, 89, 0.28);
        text-underline-offset: 2px;
      }

      .ratgeber-prose blockquote {
        border-left: 3px solid var(--primary);
        margin: 1.5rem 0;
        padding: 0.5rem 0 0.5rem 1.2rem;
        color: var(--text-muted);
        font-style: italic;
      }

      .article-summary {
        position: sticky;
        top: 88px;
        background: var(--surface-container-low);
        border: 1px solid rgba(190, 201, 197, 0.28);
        border-radius: var(--radius-lg);
        padding: 22px 20px;
      }

      .summary-label {
        margin: 0 0 12px;
        color: var(--primary);
        font-size: 0.72rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.16em;
      }

      .summary-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin: 0;
        padding-left: 1.1rem;
      }

      .summary-list li {
        color: var(--secondary);
        font-size: 0.9rem;
        line-height: 1.6;
      }

      .article-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: var(--space-4);
        margin-top: var(--space-7);
        padding-top: var(--space-5);
        padding-bottom: var(--space-8);
        border-top: 1px solid rgba(190, 201, 197, 0.25);
      }

      .footer-back {
        color: var(--secondary);
        font-size: 0.9rem;
        font-weight: 700;
        opacity: 0.75;
      }

      .footer-back:hover {
        color: var(--primary);
        opacity: 1;
      }

      .site-footer {
        margin: 0;
        background: var(--bg-2);
        border-top: 1px solid var(--line);
      }

      .footer-content {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 18px;
        padding: 24px 0 18px;
      }

      .footer-brand {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: var(--fg);
        font-weight: 800;
      }

      .footer-brand img {
        width: 18px;
        height: 18px;
      }

      .footer-links {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
      }

      .footer-links a {
        color: var(--fg-2);
        font-size: 12px;
      }

      .footer-copy {
        margin: 0;
        padding: 12px 0 22px;
        border-top: 1px dashed var(--line);
        color: var(--fg-3);
        font-size: 11px;
      }

      .lightbox {
        width: 100vw;
        max-width: 100vw;
        height: 100vh;
        max-height: 100vh;
        border: none;
        padding: 24px;
        background: transparent;
        box-sizing: border-box;
        overflow: hidden;
      }

      dialog.lightbox[open] {
        display: grid;
        place-items: center;
      }

      .lightbox::backdrop {
        background: rgba(18, 20, 16, 0.92);
        backdrop-filter: blur(6px);
      }

      .lightbox img {
        width: auto;
        height: auto;
        max-width: min(95vw, 1500px);
        max-height: 90vh;
        margin: 0;
        padding: 0;
        border: none;
        border-radius: 12px;
        background: transparent;
        box-shadow: 0 0 80px rgba(0, 0, 0, 0.5);
        cursor: zoom-out;
        object-fit: contain;
      }

      .lightbox-close {
        position: absolute;
        top: 16px;
        right: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.12);
        color: #fff;
        font-size: 1.1rem;
      }

      :root[data-theme="dark"] .article-summary {
        background: var(--surface-container);
        border-color: rgba(139, 152, 145, 0.2);
      }

      :root[data-theme="dark"] .ratgeber-prose h2 {
        border-top-color: rgba(139, 152, 145, 0.2);
      }

      :root[data-theme="dark"] .article-cover img,
      :root[data-theme="dark"] .ratgeber-prose img {
        filter: brightness(0.72) saturate(0.9) contrast(0.98);
        opacity: 0.94;
      }

      :root[data-theme="dark"] .article-cover-trigger:hover img,
      :root[data-theme="dark"] .ratgeber-prose img:hover {
        filter: brightness(0.82) saturate(0.95) contrast(1);
        opacity: 0.98;
      }

      :root[data-theme="dark"] .ratgeber-prose img {
        background: var(--surface-container);
        border-color: rgba(139, 152, 145, 0.24);
      }

      @media (max-width: 860px) {
        .grid,
        .article-body,
        .footer-content {
          grid-template-columns: 1fr;
        }

        .article-summary {
          position: static;
          order: -1;
        }

        .hdr-row {
          align-items: flex-start;
          flex-direction: column;
        }

        .article-cover img {
          max-height: none;
        }
      }
    </style>
  </head>
  <body>
    <a href="#main-content" class="skip-link">Zum Inhalt springen</a>
    <header class="site-header">
      <div class="container">
        <div class="hdr-row hdr-top">
          <a href="/admin/ratgeber" class="brand">
            <span class="brand-mark-text">[ utildesk ]</span>
            <span class="brand-sub">// ki-werkzeugverzeichnis</span>
          </a>
          <div class="hdr-meta" aria-label="Systemstatus">
            <span>v4.2.0-catalog</span>
            <span class="dot">/</span>
            <span><span class="live-dot"></span>live</span>
            <span class="dot">/</span>
            <span>curated-no-ads</span>
          </div>
        </div>
        <nav class="nav hdr-row hdr-bottom" aria-label="Hauptnavigation">
          <div class="nav-links">
            <a href="/">Verzeichnis</a>
            <a href="/tools/">Tools</a>
            <a href="/ratgeber/" aria-current="page">Ratgeber</a>
            <a href="/category/">Kategorien</a>
          </div>
          <div class="nav-actions">
            <a class="btn-ghost" href="/llms.txt">llms.txt</a>
            <button type="button" class="theme-toggle btn-ghost" id="theme-toggle" aria-label="Design umschalten" aria-pressed="false" title="Design umschalten">
              <span data-theme-label>Dunkel</span>
            </button>
          </div>
        </nav>
        <div class="hdr-status">
          <span>db: tools + ratgeber</span>
          <span class="dot">/</span>
          <span>indexnow: aktiv</span>
          <span class="dot">/</span>
          <span>ai-readable manifests: online</span>
        </div>
      </div>
    </header>

    <main id="main-content" class="${mainClass}">
      ${body}
    </main>

    <footer class="site-footer">
      <div class="container">
        <div class="footer-content">
          <a href="/" class="footer-brand"><img src="/logo-grid.svg" alt="Utildesk" height="16">Utildesk</a>
          <div class="footer-links">
            <a href="/admin/ratgeber">Kandidaten</a>
            <a href="/ratgeber/">Ratgeber</a>
            <a href="/tools/">Tools</a>
            <a href="/category/">Kategorien</a>
          </div>
        </div>
        <p class="footer-copy">&copy; ${new Date().getFullYear()} Utildesk. Private Ratgeber review preview, not indexed.</p>
      </div>
    </footer>

    <dialog id="img-lightbox" class="lightbox">
      <button class="lightbox-close" aria-label="Schliessen">x</button>
      <img id="lightbox-img" src="" alt="">
    </dialog>

    <script>
      (() => {
        const storageKey = "utildesk-theme";
        const root = document.documentElement;
        const button = document.getElementById("theme-toggle");
        const label = button?.querySelector("[data-theme-label]");
        const applyTheme = (theme, persist = false) => {
          root.dataset.theme = theme;
          root.style.colorScheme = theme;
          if (button) {
            button.dataset.theme = theme;
            button.setAttribute("aria-pressed", String(theme === "dark"));
            button.title = theme === "dark" ? "Zum hellen Design wechseln" : "Zum dunklen Design wechseln";
          }
          if (label) label.textContent = theme === "dark" ? "Dunkel" : "Hell";
          if (persist) {
            try { localStorage.setItem(storageKey, theme); } catch {}
          }
        };
        applyTheme(root.dataset.theme === "light" ? "light" : "dark");
        button?.addEventListener("click", () => {
          applyTheme(root.dataset.theme === "dark" ? "light" : "dark", true);
        });
      })();

      (() => {
        const lightbox = document.getElementById("img-lightbox");
        const image = document.getElementById("lightbox-img");
        if (!lightbox || !image) return;
        const openLightbox = (src, alt) => {
          if (!src) return;
          image.src = src;
          image.alt = alt || "";
          lightbox.showModal();
        };

        document.querySelectorAll(".article-cover-trigger, .ratgeber-prose img").forEach((node) => {
          node.addEventListener("click", () => {
            const src = node.dataset.lightboxSrc || node.currentSrc || node.src || "";
            const alt = node.dataset.lightboxAlt || node.alt || "";
            openLightbox(src, alt);
          });
        });
        lightbox.addEventListener("click", (event) => {
          if (event.target === lightbox) lightbox.close();
        });
        document.querySelector(".lightbox-close")?.addEventListener("click", () => lightbox.close());
        image.addEventListener("click", () => lightbox.close());
        lightbox.addEventListener("close", () => {
          image.removeAttribute("src");
          image.removeAttribute("alt");
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
  articleHtml = articleHtml.replace(
    /<p>\s*(<img\b[^>]*>)\s*<\/p>/g,
    '<figure class="article-inline-image">$1</figure>',
  );

  const tags = Array.isArray(meta.tags) ? meta.tags : [];
  const pills = [
    meta.published,
    meta.readTime ? `${meta.readTime} Min. Lesen` : "",
    meta.category,
    ...tags,
  ].filter(Boolean);
  const pillHtml = pills.map((pill) => `<span class="pill">${escapeHtml(pill)}</span>`).join("");
  const coverUrl = coverName ? assetUrl(candidate.jobId, coverName) : "";
  const cover = coverUrl
    ? `<figure class="article-cover">
      <button type="button" class="article-cover-trigger js-lightbox-image" data-lightbox-src="${escapeAttribute(coverUrl)}" data-lightbox-alt="${escapeAttribute(meta.eyebrow || "Illustration")}" aria-label="Illustration vergroessern: ${escapeAttribute(candidate.title)}">
        <img src="${escapeAttribute(coverUrl)}" alt="${escapeAttribute(meta.eyebrow || "Illustration")}" loading="eager" decoding="async">
      </button>
    </figure>`
    : "";
  const sidebarPoints = Array.isArray(meta.sidebarPoints) ? meta.sidebarPoints : [];
  const summary = sidebarPoints.length
    ? `<aside class="article-summary"><p class="summary-label">${escapeHtml(meta.sidebarTitle || "Kurzfazit")}</p><ul class="summary-list">${sidebarPoints.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}</ul></aside>`
    : `<aside class="article-summary"><p class="summary-label">Kontrolle</p><ul class="summary-list"><li>Text und Bilder entsprechen dem aktuell hochgeladenen Kandidatenpaket.</li><li>Die Veroeffentlichung laeuft erst nach Klick auf Publizieren.</li></ul></aside>`;

  return `<section class="article-preview">
    <header class="article-head">
      <p class="article-eyebrow">${escapeHtml(meta.eyebrow || "Ratgeber")}</p>
      <h1>${escapeHtml(candidate.title)}</h1>
      <p class="article-excerpt">${escapeHtml(candidate.excerpt || "")}</p>
      <div class="article-pills">${pillHtml}</div>
    </header>
    ${cover}
    <div class="article-body">
      <article class="ratgeber-prose">${articleHtml}</article>
      ${summary}
    </div>
    <footer class="article-footer">
      <a href="/admin/ratgeber" class="footer-back">Zurueck zu Kandidaten</a>
    </footer>
  </section>`;
}
