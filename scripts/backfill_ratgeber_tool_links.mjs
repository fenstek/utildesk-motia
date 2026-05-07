import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const ARTICLE_SETS = [
  {
    locale: "de",
    articleDir: path.join(ROOT, "content", "ratgeber"),
    toolDir: path.join(ROOT, "content", "tools"),
    hrefPrefix: "/tools/",
  },
  {
    locale: "en",
    articleDir: path.join(ROOT, "content", "en", "ratgeber"),
    toolDir: path.join(ROOT, "content", "en", "tools"),
    hrefPrefix: "/en/tools/",
  },
];

const SKIP_TITLES = new Set([
  "ai",
  "api",
  "app",
  "apps",
  "audio",
  "automation",
  "chat",
  "code",
  "copilot",
  "data",
  "deep",
  "design",
  "developer",
  "flow",
  "free",
  "google",
  "image",
  "make",
  "marketing",
  "mobile",
  "open",
  "productivity",
  "research",
  "seo",
  "drift",
  "video",
  "voice",
  "web",
  "workflow",
  "writing",
]);

const MANUAL_ALIASES = {
  chatgpt: ["ChatGPT", "OpenAI ChatGPT"],
  claude: ["Claude"],
  gemini: ["Gemini"],
  perplexity: ["Perplexity"],
  "github-copilot": ["GitHub Copilot"],
  cursor: ["Cursor"],
  aider: ["Aider"],
  langchain: ["LangChain"],
  "crew-ai": ["CrewAI", "Crew AI"],
  "wispr-flow": ["Wispr Flow"],
  descript: ["Descript"],
  "otter-ai": ["Otter.ai", "Otter"],
  "bolt-new": ["Bolt.new", "Bolt"],
  lovable: ["Lovable"],
  replit: ["Replit"],
  v0: ["v0"],
  n8n: ["n8n"],
  zapier: ["Zapier"],
  manus: ["Manus"],
};

function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { frontmatter: "", body: text };
  return {
    frontmatter: match[0],
    body: text.slice(match[0].length),
  };
}

function titleFromMarkdown(text) {
  const quoted = text.match(/^title:\s*["'](.+?)["']\s*$/m);
  if (quoted) return quoted[1].trim();
  const plain = text.match(/^title:\s*(.+?)\s*$/m);
  return plain ? plain[1].trim() : "";
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeKey(value) {
  return value.trim().toLowerCase();
}

async function listMarkdownFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md") && !entry.name.startsWith("_"))
    .map((entry) => path.join(dir, entry.name));
}

async function loadTools(toolDir, hrefPrefix) {
  const files = await listMarkdownFiles(toolDir);
  const bySlug = new Map();
  for (const file of files) {
    const slug = path.basename(file, ".md");
    const text = await fs.readFile(file, "utf8");
    const title = titleFromMarkdown(text);
    if (!title) continue;
    bySlug.set(slug, { slug, title, href: `${hrefPrefix}${slug}/`, aliases: new Set([title]) });
  }

  for (const [slug, aliases] of Object.entries(MANUAL_ALIASES)) {
    const item = bySlug.get(slug);
    if (!item) continue;
    for (const alias of aliases) item.aliases.add(alias);
  }

  const aliases = [];
  for (const item of bySlug.values()) {
    for (const alias of item.aliases) {
      const clean = alias.trim();
      const key = normalizeKey(clean);
      if (!clean || SKIP_TITLES.has(key)) continue;
      if (clean.length < 4 && !["v0", "n8n"].includes(key)) continue;
      aliases.push({ alias: clean, href: item.href, slug: item.slug });
    }
  }

  aliases.sort((a, b) => b.alias.length - a.alias.length || a.alias.localeCompare(b.alias));
  return { bySlug, aliases };
}

function splitSources(body) {
  const sourceMatch = body.match(/\r?\n##\s+(Quellen|Sources|References|Weiterf[uü]hrende Quellen)\b/i);
  if (!sourceMatch || sourceMatch.index === undefined) return { main: body, tail: "" };
  return {
    main: body.slice(0, sourceMatch.index),
    tail: body.slice(sourceMatch.index),
  };
}

function protectMarkdown(text) {
  const tokens = [];
  const save = (match) => {
    const token = `\u0000MDTOKEN${tokens.length}\u0000`;
    tokens.push(match);
    return token;
  };

  let protectedText = text
    .replace(/```[\s\S]*?```/g, save)
    .replace(/`[^`\n]+`/g, save)
    .replace(/!\[[^\]]*]\([^)]+\)/g, save)
    .replace(/\[[^\]]+]\([^)]+\)/g, save);

  return {
    text: protectedText,
    restore(value) {
      return value.replace(/\u0000MDTOKEN(\d+)\u0000/g, (_, index) => tokens[Number(index)] ?? "");
    },
  };
}

function linkAlias(text, alias, href) {
  const escaped = escapeRegExp(alias);
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}_/\\-\\[])${escaped}(?![\\p{L}\\p{N}_/\\-\\]])`, "gu");
  return text.replace(pattern, (match) => `[${match}](${href})`);
}

function fixEnglishToolLinks(text, enTools) {
  return text.replace(/\]\(\/tools\/([a-z0-9-]+)\/\)/g, (match, slug) => {
    if (!enTools.has(slug)) return match;
    return `](/en/tools/${slug}/)`;
  });
}

async function processArticle(file, toolData, locale) {
  const original = await fs.readFile(file, "utf8");
  const { frontmatter, body } = parseFrontmatter(original);
  const { main, tail } = splitSources(body);
  let nextMain = main;

  for (const { alias, href } of toolData.aliases) {
    const current = protectMarkdown(nextMain);
    nextMain = current.restore(linkAlias(current.text, alias, href));
  }

  let next = `${frontmatter}${nextMain}${tail}`;
  if (locale === "en") {
    next = fixEnglishToolLinks(next, toolData.bySlug);
  }

  if (next !== original) {
    await fs.writeFile(file, next, "utf8");
    return true;
  }
  return false;
}

async function main() {
  let changed = 0;
  for (const set of ARTICLE_SETS) {
    const toolData = await loadTools(set.toolDir, set.hrefPrefix);
    const articles = await listMarkdownFiles(set.articleDir);
    for (const article of articles) {
      if (await processArticle(article, toolData, set.locale)) {
        changed += 1;
        console.log(`updated ${path.relative(ROOT, article)}`);
      }
    }
  }
  console.log(`Ratgeber link backfill complete. Changed files: ${changed}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
