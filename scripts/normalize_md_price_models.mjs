#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { normalizePriceModel } from "./lib/price_model_policy.mjs";

const CONTENT_DIR = path.resolve(process.env.CONTENT_DIR || "content/tools");
const argv = process.argv.slice(2);
const apply = argv.includes("--apply");
const limitArg = argv.find((arg) => arg.startsWith("--limit="));
const limit = Math.max(0, Number(limitArg?.split("=")[1] || 0) || 0);

function parseFrontmatter(text) {
  const normalized = text.replace(/^\uFEFF/, "");
  if (!normalized.startsWith("---")) return null;
  const match = normalized.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return null;
  const fullMatch = match[0];
  const frontmatter = match[1];
  const body = normalized.slice(fullMatch.length);
  return {
    fm: frontmatter,
    body,
  };
}

function normalizeFrontmatterPriceModel(frontmatter) {
  const lines = frontmatter.split(/\r?\n/);
  const index = lines.findIndex((line) => /^\s*price_model\s*:/.test(line));
  if (index === -1) return null;

  const match = lines[index].match(/^\s*price_model\s*:\s*(.*)\s*$/);
  const rawValue = String(match?.[1] || "").trim().replace(/^['"]|['"]$/g, "");
  const normalized = normalizePriceModel(rawValue);
  if (rawValue === normalized) return null;

  lines[index] = normalized
    ? `price_model: ${JSON.stringify(normalized)}`
    : "price_model: \"\"";

  return {
    before: rawValue,
    after: normalized,
    frontmatter: lines.join("\n"),
  };
}

const files = fs
  .readdirSync(CONTENT_DIR)
  .filter((file) => file.endsWith(".md"))
  .sort((a, b) => a.localeCompare(b));

const changes = [];
for (const file of files) {
  if (limit && changes.length >= limit) break;
  const fullPath = path.join(CONTENT_DIR, file);
  const text = fs.readFileSync(fullPath, "utf8");
  const parsed = parseFrontmatter(text);
  if (!parsed) continue;

  const result = normalizeFrontmatterPriceModel(parsed.fm);
  if (!result) continue;

  changes.push({
    file: fullPath,
    slug: path.basename(file, ".md"),
    before: result.before,
    after: result.after,
  });

  if (apply) {
    const nextText = `---\n${result.frontmatter}\n---\n${parsed.body.replace(/^\n+/, "\n")}`;
    fs.writeFileSync(fullPath, nextText, "utf8");
  }
}

console.log(JSON.stringify({
  ok: true,
  apply,
  total_md: files.length,
  would_change: changes.length,
  changed: apply ? changes.length : 0,
  sample: changes.slice(0, 20),
}, null, 2));
