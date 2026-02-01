import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();
const toolsDir = join(repoRoot, "content", "tools");
const publicBrandsDir = join(repoRoot, "site", "public", "brands");
const dataIndexPath = join(repoRoot, "site", "src", "data", "brands-index.json");
const publicIndexPath = join(publicBrandsDir, "_index.json");

const normalizeKey = (value = "") =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .trim();

const parseFrontmatter = (raw) => {
  if (!raw.startsWith("---")) return {};
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return {};
  const fmBlock = raw.slice(3, end).trim();
  const data = {};

  fmBlock.split("\n").forEach((line) => {
    const match = line.match(/^([A-Za-z0-9_]+):\s*(.+)?$/);
    if (!match) return;
    const key = match[1];
    let value = (match[2] ?? "").trim();
    value = value.replace(/^['"]|['"]$/g, "");
    if (value) data[key] = value;
  });

  return data;
};

const getToolBySlug = async (slug) => {
  if (!existsSync(toolsDir)) return null;
  const files = (await import("node:fs/promises")).readdir(toolsDir);
  const list = await files;
  for (const file of list) {
    if (!file.endsWith(".md") || file.startsWith("_")) continue;
    const fullPath = join(toolsDir, file);
    const raw = await readFile(fullPath, "utf-8");
    const fm = parseFrontmatter(raw);
    const fileSlug = String(fm.slug ?? file.replace(/\.md$/, ""));
    if (fileSlug === slug) return { slug: fileSlug, data: fm };
  }
  return null;
};

const getAttr = (tag, attr) => {
  const match = tag.match(new RegExp(`${attr}\\s*=\\s*(["'])(.*?)\\1`, "i"));
  return match ? match[2].trim() : "";
};

const parseLinkTags = (html) => {
  const links = [];
  const regex = /<link\b[^>]*>/gi;
  let match;
  while ((match = regex.exec(html))) {
    const tag = match[0];
    const rel = getAttr(tag, "rel").toLowerCase();
    const href = getAttr(tag, "href");
    const sizes = getAttr(tag, "sizes");
    if (!href) continue;
    links.push({ rel, href, sizes });
  }
  return links;
};

const parseSizes = (sizesValue) => {
  if (!sizesValue) return 0;
  const parts = sizesValue.split(/\s+/);
  let max = 0;
  for (const part of parts) {
    const match = part.match(/(\d+)x(\d+)/i);
    if (!match) continue;
    const size = Number(match[1]) * Number(match[2]);
    if (size > max) max = size;
  }
  return max;
};

const chooseAppleTouchIcon = (links) => {
  const candidates = links
    .filter((link) => link.rel.split(/\s+/).includes("apple-touch-icon"))
    .map((link) => ({
      href: link.href,
      size: parseSizes(link.sizes),
    }))
    .sort((a, b) => b.size - a.size);
  return candidates[0]?.href ?? null;
};

const chooseRelIcon = (links) => {
  const candidates = links.filter((link) => link.rel.split(/\s+/).includes("icon"));
  const svg = candidates.find((link) => link.href.toLowerCase().endsWith(".svg"));
  if (svg) return svg.href;
  const png = candidates.find((link) => link.href.toLowerCase().endsWith(".png"));
  return png ? png.href : null;
};

const findManifest = (links) =>
  links.find((link) => link.rel.split(/\s+/).includes("manifest"))?.href ?? null;

const chooseFromManifest = async (manifestUrl) => {
  try {
    const response = await fetch(manifestUrl);
    if (!response.ok) return null;
    const manifest = await response.json();
    const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
    const candidates = icons
      .filter((icon) => icon?.src)
      .map((icon) => ({
        src: icon.src,
        sizes: parseSizes(icon.sizes || ""),
        type: String(icon.type || "").toLowerCase(),
      }))
      .sort((a, b) => b.sizes - a.sizes);
    const png = candidates.find((icon) => icon.type.includes("png"));
    return (png ?? candidates[0])?.src ?? null;
  } catch {
    return null;
  }
};

const resolveUrl = (base, href) => {
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
};

const extFromUrl = (url) => {
  if (!url) return "";
  const lower = url.toLowerCase();
  if (lower.endsWith(".svg")) return "svg";
  if (lower.endsWith(".png")) return "png";
  if (lower.endsWith(".ico")) return "ico";
  return "";
};

const extFromContentType = (contentType) => {
  if (!contentType) return "";
  const lower = contentType.toLowerCase();
  if (lower.includes("image/svg")) return "svg";
  if (lower.includes("image/png")) return "png";
  if (lower.includes("image/x-icon") || lower.includes("image/vnd.microsoft.icon")) return "ico";
  return "";
};

const readIndex = async () => {
  try {
    const raw = await readFile(publicIndexPath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const writeIndex = async (index) => {
  await mkdir(publicBrandsDir, { recursive: true });
  await mkdir(join(repoRoot, "site", "src", "data"), { recursive: true });
  await writeFile(publicIndexPath, JSON.stringify(index, null, 2));
  await writeFile(dataIndexPath, JSON.stringify(index, null, 2));
};

export const fetchSiteIconForSlug = async (slug) => {
  if (!slug) {
    return { ok: false, reason: "missing slug" };
  }
  const tool = await getToolBySlug(slug);
  if (!tool) {
    return { ok: false, reason: "tool not found" };
  }
  const homepage = tool.data.homepage;
  if (!homepage) {
    return { ok: false, reason: "missing homepage" };
  }

  let html;
  try {
    const response = await fetch(homepage);
    if (!response.ok) {
      return { ok: false, reason: `homepage fetch failed (${response.status})` };
    }
    html = await response.text();
  } catch (error) {
    return { ok: false, reason: `homepage fetch failed (${error?.message ?? "unknown"})` };
  }

  const links = parseLinkTags(html);
  const appleTouch = chooseAppleTouchIcon(links);
  const relIcon = chooseRelIcon(links);
  const manifestLink = findManifest(links);

  let chosen = appleTouch ?? relIcon;

  if (!chosen && manifestLink) {
    const manifestUrl = resolveUrl(homepage, manifestLink);
    if (manifestUrl) {
      const manifestIcon = await chooseFromManifest(manifestUrl);
      if (manifestIcon) {
        chosen = resolveUrl(manifestUrl, manifestIcon);
      }
    }
  }

  if (!chosen) {
    chosen = resolveUrl(homepage, "/favicon.ico");
  } else {
    chosen = resolveUrl(homepage, chosen);
  }

  if (!chosen) {
    return { ok: false, reason: "no icon candidate" };
  }

  try {
    const response = await fetch(chosen);
    if (!response.ok) {
      return { ok: false, reason: `icon fetch failed (${response.status})` };
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get("content-type") || "";
    const ext = extFromContentType(contentType) || extFromUrl(chosen) || "ico";
    const filename = `${slug}.${ext}`;
    await mkdir(publicBrandsDir, { recursive: true });
    await writeFile(join(publicBrandsDir, filename), buffer);
    const index = await readIndex();
    index[slug] = filename;
    await writeIndex(index);
    return { ok: true, filename };
  } catch (error) {
    return { ok: false, reason: `icon download failed (${error?.message ?? "unknown"})` };
  }
};

const run = async () => {
  const slug = process.argv[2];
  const result = await fetchSiteIconForSlug(slug);
  if (!result.ok) {
    console.error(JSON.stringify(result));
  } else {
    console.log(JSON.stringify(result));
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}
