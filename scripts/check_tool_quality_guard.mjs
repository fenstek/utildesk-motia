#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  TEMPLATE_PHRASES,
  countTemplatePhrases,
  parseSimpleFrontmatter,
  splitMarkdownDocument,
} from "../site/src/lib/toolQuality.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const toolsDir = path.join(repoRoot, "content", "tools");

const minActiveTools = Number(process.env.UTILDESK_MIN_ACTIVE_TOOLS || 1167);
// The catalog now uses the expanded editorial taxonomy (24 active labels).
// Keep this guard focused on accidental explosions, not intentional taxonomy.
const maxCategories = Number(process.env.UTILDESK_MAX_TOOL_CATEGORIES || 24);
const bannedCategoryValues = new Set([
  "AI",
  "Automation",
  "Developer",
  "Design & Kreativitat",
  "Design & Kreativität",
]);

const activeTools = [];
const failures = [];
const categoryCounts = new Map();

const files = fs
  .readdirSync(toolsDir)
  .filter((file) => file.endsWith(".md") && !file.startsWith("_"))
  .sort((a, b) => a.localeCompare(b, "de"));

for (const file of files) {
  const filePath = path.join(toolsDir, file);
  const raw = fs.readFileSync(filePath, "utf8");
  const data = parseSimpleFrontmatter(raw);
  const disabled = data.disabled === true || String(data.disabled || "").toLowerCase() === "true";
  if (disabled) continue;

  const slug = String(data.slug || file.replace(/\.md$/, ""));
  const tier = String(data.tier || "").toUpperCase();
  const { body } = splitMarkdownDocument(raw);
  const category = String(data.category || "").trim();
  const templatePhraseCount = countTemplatePhrases(body);

  activeTools.push(slug);
  categoryCounts.set(category || "(missing)", (categoryCounts.get(category || "(missing)") ?? 0) + 1);

  if (!["A", "B", "C", "D"].includes(tier)) {
    failures.push(`${slug}: missing or invalid tier "${data.tier ?? ""}"`);
  }

  if (tier !== "A" && templatePhraseCount > 0) {
    const phrases = TEMPLATE_PHRASES.filter((phrase) => body.includes(phrase));
    failures.push(`${slug}: non-A page contains template phrase(s): ${phrases.join(", ")}`);
  }

  const editorialReviewed = data.editorial_reviewed === true || String(data.editorial_reviewed || "").toLowerCase() === "true";
  if ((tier === "C" || tier === "D") && !editorialReviewed && /lastReviewed|last_reviewed|zuletzt geprüft/i.test(raw)) {
    failures.push(`${slug}: non-curated page contains a last-reviewed signal`);
  }

  if ((tier === "C" || tier === "D") && /Kuratiert von Utildesk Redaktion/i.test(raw)) {
    failures.push(`${slug}: non-curated page contains false curated attribution`);
  }

  if (bannedCategoryValues.has(category)) {
    failures.push(`${slug}: non-canonical category "${category}"`);
  }
}

if (activeTools.length < minActiveTools) {
  failures.push(`active tool count ${activeTools.length} is below expected minimum ${minActiveTools}`);
}

if (categoryCounts.size > maxCategories) {
  failures.push(`active category count ${categoryCounts.size} exceeds maximum ${maxCategories}`);
}

if (categoryCounts.has("(missing)")) {
  failures.push(`${categoryCounts.get("(missing)")} active tool(s) have no category`);
}

if (failures.length) {
  console.error(`Tool quality guard failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      activeTools: activeTools.length,
      uniqueCategories: categoryCounts.size,
      categoryCounts: Object.fromEntries([...categoryCounts.entries()].sort((a, b) => a[0].localeCompare(b[0], "de"))),
    },
    null,
    2,
  ),
);
