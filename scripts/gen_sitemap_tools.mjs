import { readdirSync, readFileSync, statSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const TOOLS_DIR = join(ROOT, "content", "tools");
const OUT_DIR = join(ROOT, "site", "public");
const OUT_FILE = join(OUT_DIR, "sitemap.xml");

// Base URL for production
const BASE_URL = (process.env.SITEMAP_BASE_URL || "https://tools.utildesk.de").replace(/\/+$/, "");

function esc(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function getFrontmatter(md) {
  // very small YAML-frontmatter parser (only key: value lines)
  // expects:
  // ---
  // key: value
  // ---
  if (!md.startsWith("---\n")) return {};
  const end = md.indexOf("\n---\n", 4);
  if (end === -1) return {};
  const block = md.slice(4, end).trim();
  const fm = {};
  for (const line of block.split("\n")) {
    const m = line.match(/^([A-Za-z0-9_]+)\s*:\s*(.*)\s*$/);
    if (!m) continue;
    const k = m[1];
    let v = m[2] ?? "";
    v = v.trim();
    // strip quotes
    v = v.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
    fm[k] = v;
  }
  return fm;
}

function isoDate(d) {
  // sitemap wants YYYY-MM-DD or full ISO; keep date only
  const x = new Date(d);
  const yyyy = x.getUTCFullYear();
  const mm = String(x.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(x.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function urlEntry(loc, lastmod) {
  return [
    "  <url>",
    `    <loc>${esc(loc)}</loc>`,
    lastmod ? `    <lastmod>${esc(lastmod)}</lastmod>` : null,
    "  </url>",
  ].filter(Boolean).join("\n");
}

const files = readdirSync(TOOLS_DIR).filter(f => f.endsWith(".md"));

const toolUrls = [];
for (const f of files) {
  const p = join(TOOLS_DIR, f);
  const md = readFileSync(p, "utf8");
  const fm = getFrontmatter(md);

  // Only DONE tools in sitemap
  const status = (fm.status || "").toUpperCase();
  if (status && status !== "DONE") continue;

  const slug = f.replace(/\.md$/i, "");
  if (slug === "_TEMPLATE") continue;
  const st = statSync(p);

  toolUrls.push({
    loc: `${BASE_URL}/tools/${encodeURIComponent(slug)}/`,
    lastmod: isoDate(st.mtime),
  });
}

// Add a couple of main pages (safe minimal set)
const now = isoDate(Date.now());
const mainUrls = [
  { loc: `${BASE_URL}/`, lastmod: now },
  { loc: `${BASE_URL}/tools/`, lastmod: now },
];

const all = [...mainUrls, ...toolUrls];

const xml =
`<?xml version="1.0" encoding="UTF-8"?>\n` +
`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
all.map(u => urlEntry(u.loc, u.lastmod)).join("\n") +
`\n</urlset>\n`;

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_FILE, xml, "utf8");

console.log(JSON.stringify({
  ok: true,
  base: BASE_URL,
  tools_dir: TOOLS_DIR,
  out: OUT_FILE,
  total_urls: all.length,
  tool_urls: toolUrls.length,
}, null, 2));
