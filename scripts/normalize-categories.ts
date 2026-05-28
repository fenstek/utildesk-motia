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
    category: "AI Infrastructure",
    keywords: [
      "analytics",
      "bigquery",
      "clickhouse",
      "cloud",
      "data",
      "database",
      "databricks",
      "datenbank",
      "embedding",
      "infrastructure",
      "lakehouse",
      "mlops",
      "model",
      "pinecone",
      "platform",
      "query",
      "sql",
      "vector",
      "warehouse",
    ],
  },
  {
    category: "AI Chatbots",
    keywords: ["chatbot", "assistant", "assistenz", "llm", "gpt", "chat", "conversation"],
  },
  {
    category: "AI Coding",
    keywords: ["coding", "code", "developer", "dev", "github", "programming", "api", "sdk", "ide"],
  },
  {
    category: "AI Writing",
    keywords: ["writing", "content", "copywriting", "text", "blog", "article", "editor"],
  },
  {
    category: "AI Image",
    keywords: ["image", "bild", "photo", "design", "art", "visual", "grafik"],
  },
  {
    category: "AI Audio",
    keywords: ["audio", "voice", "speech", "tts", "transcription", "podcast", "sound", "music"],
  },
  {
    category: "AI Research",
    keywords: ["research", "search", "recherche", "science", "paper", "citation", "literature"],
  },
  {
    category: "AI Agents",
    keywords: ["agent", "agents", "autonomous", "automation", "workflow", "orchestration"],
  },
];

const normalizeTag = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");

const inferAiCategory = ({ slug, title, tags, body }: { slug: string; title: string; tags: unknown[]; body: string }) => {
  const normalizedTags = tags.map(normalizeTag);
  const normalizedText = normalizeTag(`${slug} ${title} ${body.slice(0, 2500)}`);
  const scores = aiCategoryRules.map((rule) => {
    let score = 0;
    for (const keyword of rule.keywords) {
      if (normalizedTags.some((candidate) => candidate.includes(keyword))) score += 2;
      if (normalizedText.includes(keyword)) score += 1;
    }
    return { category: rule.category, score };
  });

  scores.sort((a, b) => b.score - a.score);
  return scores[0]?.score > 0 ? scores[0].category : "AI Infrastructure";
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
let activeTools = 0;

for (const file of files) {
  const filePath = path.join(toolsDir, file);
  const raw = fs.readFileSync(filePath, "utf8");
  const data = parseSimpleFrontmatter(raw);
  if (data.disabled === true || String(data.disabled || "").toLowerCase() === "true") {
    continue;
  }
  activeTools += 1;
  const body = raw.replace(/^---\n[\s\S]*?\n---\n?/, "");
  const slug = String(data.slug || file.replace(/\.md$/, ""));
  const title = String(data.title || slug);
  const current = String(data.category || "").trim();
  const tags = Array.isArray(data.tags) ? data.tags : [];
  const mapped = canonicalMap.get(current) ?? current;
  const canonical =
    mapped === "AI" || mapped.startsWith("AI ")
      ? inferAiCategory({ slug, title, tags, body })
      : mapped;

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
  totalTools: activeTools,
  changed: changes.length,
  uniqueCategoriesAfter: categoryCounts.size,
  categoryCounts: Object.fromEntries([...categoryCounts.entries()].sort((a, b) => a[0].localeCompare(b[0], "de"))),
  changes,
  nextStep: write
    ? "Run site build to regenerate /api/tools.json and sitemap."
    : "Review changes, then rerun with --write after markdown-edit approval.",
};

console.log(JSON.stringify(summary, null, 2));
