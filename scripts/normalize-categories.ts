#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseSimpleFrontmatter } from "../site/src/lib/toolQuality.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const toolsDir = path.join(repoRoot, "content", "tools");
const write = process.argv.includes("--write");

const canonicalMap = new Map([
  ["Analytics", "AI Infrastructure"],
  ["Audio", "Audio & Video"],
  ["Automation", "Automatisierung"],
  ["Business", "Produktivität"],
  ["Chatbots & Assistenten", "AI Chatbots"],
  ["Cloud", "AI Infrastructure"],
  ["Developer", "Entwickler-Tools"],
  ["Design & Kreativitat", "Design"],
  ["Design & Kreativität", "Design"],
  ["Marketing", "Marketing & Vertrieb"],
  ["Schreiben & Content", "AI Writing"],
  ["SEO", "Marketing & Vertrieb"],
  ["Video", "Audio & Video"],
]);

const aiCategoryRules = [
  {
    category: "AI Chatbots",
    tags: ["chatbot", "assistant", "assistenz", "llm", "gpt", "chat", "conversation"],
  },
  {
    category: "AI Coding",
    tags: ["coding", "code", "developer", "dev", "github", "programming", "api", "sdk", "ide"],
  },
  {
    category: "AI Writing",
    tags: ["writing", "content", "copywriting", "text", "blog", "article", "editor"],
  },
  {
    category: "AI Image",
    tags: ["image", "bild", "photo", "design", "art", "visual", "grafik"],
  },
  {
    category: "AI Audio",
    tags: ["audio", "voice", "speech", "tts", "transcription", "podcast", "sound", "music"],
  },
  {
    category: "AI Research",
    tags: ["research", "search", "recherche", "science", "paper", "citation", "literature"],
  },
  {
    category: "AI Agents",
    tags: ["agent", "agents", "autonomous", "automation", "workflow", "orchestration"],
  },
  {
    category: "AI Infrastructure",
    tags: ["infrastructure", "mlops", "model", "database", "data", "cloud", "vector", "embedding"],
  },
];

const normalizeTag = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");

const inferAiCategory = (tags: unknown[]) => {
  const normalizedTags = tags.map(normalizeTag);
  const match = aiCategoryRules.find((rule) =>
    rule.tags.some((tag) => normalizedTags.some((candidate) => candidate.includes(tag))),
  );
  return match?.category ?? "AI Infrastructure";
};

const replaceFrontmatterCategory = (raw: string, category: string) => {
  const safeCategory = JSON.stringify(category);
  if (/^category:\s*.*$/m.test(raw)) {
    return raw.replace(/^category:\s*.*$/m, `category: ${safeCategory}`);
  }

  return raw.replace(/^---\n/, `---\ncategory: ${safeCategory}\n`);
};

const files = fs
  .readdirSync(toolsDir)
  .filter((file) => file.endsWith(".md") && !file.startsWith("_"))
  .sort((a, b) => a.localeCompare(b, "de"));

const changes = [];
const categoryCounts = new Map();

for (const file of files) {
  const filePath = path.join(toolsDir, file);
  const raw = fs.readFileSync(filePath, "utf8");
  const data = parseSimpleFrontmatter(raw);
  const slug = String(data.slug || file.replace(/\.md$/, ""));
  const current = String(data.category || "").trim();
  const tags = Array.isArray(data.tags) ? data.tags : [];
  const canonical = canonicalMap.get(current) ?? (current === "AI" ? inferAiCategory(tags) : current);

  categoryCounts.set(canonical || "(missing)", (categoryCounts.get(canonical || "(missing)") ?? 0) + 1);

  if (canonical && canonical !== current) {
    changes.push({ slug, file: `content/tools/${file}`, from: current || null, to: canonical });
    if (write) {
      fs.writeFileSync(filePath, replaceFrontmatterCategory(raw, canonical), "utf8");
    }
  }
}

const summary = {
  dryRun: !write,
  totalTools: files.length,
  changed: changes.length,
  uniqueCategoriesAfter: categoryCounts.size,
  categoryCounts: Object.fromEntries([...categoryCounts.entries()].sort((a, b) => a[0].localeCompare(b[0], "de"))),
  changes,
  nextStep: write
    ? "Run site build to regenerate /api/tools.json and sitemap."
    : "Review changes, then rerun with --write after markdown-edit approval.",
};

console.log(JSON.stringify(summary, null, 2));
