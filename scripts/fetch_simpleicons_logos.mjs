import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");
const outputDir = join(repoRoot, "site", "public", "images", "logos");

const args = new Set(process.argv.slice(2));
const force = args.has("--force");

const normalizeKey = (value = "") =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

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

const getBaseSlug = (filename) =>
  filename.replace(/\.(md|mdx)$/i, "");

const getToolsDir = () => {
  const candidates = [
    join(repoRoot, "site", "src", "content", "tools"),
    join(repoRoot, "site", "content", "tools"),
    join(repoRoot, "content", "tools"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
};

const loadIconsFromPackage = async () => {
  try {
    const mod = await import("simple-icons");
    return mod.icons ?? null;
  } catch {
    return null;
  }
};

const loadIconsFromDataset = async () => {
  const response = await fetch(
    "https://raw.githubusercontent.com/simple-icons/simple-icons/develop/_data/simple-icons.json"
  );
  if (!response.ok) {
    throw new Error(`Failed to download Simple Icons dataset: ${response.status}`);
  }
  const data = await response.json();
  const entries = Array.isArray(data.icons) ? data.icons : [];
  const icons = {};

  for (const entry of entries) {
    if (!entry?.slug || !entry?.path) continue;
    const slugKey = normalizeKey(entry.slug);
    icons[slugKey] = {
      title: entry.title,
      slug: entry.slug,
      path: entry.path,
    };
    const titleKey = normalizeKey(entry.title);
    if (titleKey && !icons[titleKey]) {
      icons[titleKey] = {
        title: entry.title,
        slug: entry.slug,
        path: entry.path,
      };
    }
  }

  return icons;
};

const resolveIcon = (icons, title, brandKey) => {
  const candidates = [];
  if (brandKey) {
    candidates.push(brandKey, normalizeKey(brandKey));
  }
  candidates.push(normalizeKey(title));

  for (const key of candidates) {
    if (!key) continue;
    if (icons[key]) return { key, icon: icons[key] };
  }
  return null;
};

const toSvg = (icon) => {
  const path = icon.svg ?? icon.path;
  return `<svg xmlns="http://www.w3.org/2000/svg" role="img" viewBox="0 0 24 24"><path d="${path}"/></svg>`;
};

const run = async () => {
  const toolsDir = getToolsDir();
  if (!toolsDir) {
    console.error(
      "No tools directory found. Checked site/src/content/tools, site/content/tools, and content/tools."
    );
    process.exit(1);
  }

  const iconsFromPackage = await loadIconsFromPackage();
  const icons = iconsFromPackage ?? (await loadIconsFromDataset());

  await mkdir(outputDir, { recursive: true });
  const files = (await readdir(toolsDir)).filter(
    (file) =>
      (file.endsWith(".md") || file.endsWith(".mdx")) && !file.startsWith("_")
  );

  const report = {
    created: [],
    skipped: [],
    missing: [],
  };

  for (const file of files) {
    const fullPath = join(toolsDir, file);
    const raw = await readFile(fullPath, "utf-8");
    const frontmatter = parseFrontmatter(raw);
    const slug = frontmatter.slug ?? frontmatter.id ?? getBaseSlug(file);
    const title = frontmatter.title ?? slug;
    const brandKey = frontmatter.brandKey ?? null;
    const resolved = resolveIcon(icons, title, brandKey);
    const outputPath = join(outputDir, `${slug}.svg`);

    if (!resolved) {
      report.missing.push({ slug, title, brandKey });
      continue;
    }

    if (!force && existsSync(outputPath)) {
      report.skipped.push({ slug, key: resolved.key });
      continue;
    }

    await writeFile(outputPath, toSvg(resolved.icon), "utf-8");
    report.created.push({ slug, key: resolved.key });
  }

  console.log(`Created: ${report.created.length}`);
  report.created.forEach(({ slug, key }) => {
    console.log(`  ✓ ${slug} -> ${key}`);
  });

  console.log(`Skipped: ${report.skipped.length}`);
  report.skipped.forEach(({ slug, key }) => {
    console.log(`  • ${slug} -> ${key}`);
  });

  console.log(`Missing: ${report.missing.length}`);
  report.missing.forEach(({ slug, title, brandKey }) => {
    console.log(`  ✕ ${slug} (${title})${brandKey ? ` [${brandKey}]` : ""}`);
  });
};

run().catch((error) => {
  console.error("Failed to fetch logos:", error);
  process.exit(1);
});
