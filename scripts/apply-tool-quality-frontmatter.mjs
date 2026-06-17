#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  classifyToolEntry,
  countInternalRepeats,
  countTemplatePhrases,
  findEditorialBlocks,
  hasLastReviewed,
  parseSimpleFrontmatter,
  splitMarkdownDocument,
  stripTemplateBoilerplate,
} from "../site/src/lib/toolQuality.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const toolsDir = path.join(repoRoot, "content", "tools");
const ratgeberDir = path.join(repoRoot, "content", "ratgeber");
const write = process.argv.includes("--write");

const managedKeys = new Set([
  "tier",
  "lastReviewed",
  "last_reviewed",
  "lastReviewedAt",
  "last_reviewed_at",
  "mentionedIn",
  "generated_at",
  "generatedAt",
]);

const extractRatgeberLinks = (content) => {
  const slugs = new Set();
  for (const match of String(content ?? "").matchAll(/\/ratgeber\/([a-z0-9-]+)\/?/gi)) {
    slugs.add(match[1]);
  }
  return slugs;
};

const getLastGitDate = (relativePath) => {
  try {
    const date = execFileSync("git", ["log", "-1", "--format=%cs", "--", relativePath], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return date || null;
  } catch {
    return null;
  }
};

const formatScalar = (value) => JSON.stringify(String(value));

const formatArray = (values) => `[${values.map((value) => JSON.stringify(String(value))).join(", ")}]`;

const upsertManagedFrontmatter = (raw, fields) => {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  const body = match ? raw.slice(match[0].length) : raw;
  const sourceLines = match ? match[1].split("\n") : [];
  const nextLines = sourceLines.filter((line) => {
    const keyMatch = line.match(/^([A-Za-z0-9_]+):/);
    return !keyMatch || !managedKeys.has(keyMatch[1]);
  });

  const insertAfter = (key, line) => {
    const index = nextLines.findIndex((item) => item.match(new RegExp(`^${key}:`)));
    if (index === -1) {
      nextLines.push(line);
      return;
    }
    nextLines.splice(index + 1, 0, line);
  };

  insertAfter("affiliate_url", `tier: ${formatScalar(fields.tier)}`);

  if (fields.lastReviewed) {
    insertAfter("tier", `lastReviewed: ${formatScalar(fields.lastReviewed)}`);
  }
  if (fields.mentionedIn?.length) {
    insertAfter(fields.lastReviewed ? "lastReviewed" : "tier", `mentionedIn: ${formatArray(fields.mentionedIn)}`);
  }
  if (fields.generated_at) {
    insertAfter("tier", `generated_at: ${formatScalar(fields.generated_at)}`);
  }

  return `---\n${nextLines.join("\n")}\n---\n${body.trimStart()}`;
};

const ratgeberTexts = fs.existsSync(ratgeberDir)
  ? fs
      .readdirSync(ratgeberDir)
      .filter((file) => file.endsWith(".md") && !file.startsWith("_"))
      .map((file) => ({
        slug: file.replace(/\.md$/, ""),
        text: fs.readFileSync(path.join(ratgeberDir, file), "utf8"),
      }))
  : [];

const files = fs
  .readdirSync(toolsDir)
  .filter((file) => file.endsWith(".md") && !file.startsWith("_"))
  .sort((a, b) => a.localeCompare(b, "de"));

const changes = [];
const tierCounts = {};

for (const file of files) {
  const filePath = path.join(toolsDir, file);
  const relativePath = `content/tools/${file}`;
  const raw = fs.readFileSync(filePath, "utf8");
  const data = parseSimpleFrontmatter(raw);
  const { body } = splitMarkdownDocument(raw);
  const slug = String(data.slug || file.replace(/\.md$/, ""));
  const mentionedIn = extractRatgeberLinks(body);

  for (const article of ratgeberTexts) {
    if (article.text.includes(`/tools/${slug}/`)) {
      mentionedIn.add(article.slug);
    }
  }

  const quality = classifyToolEntry({ slug, data: { ...data, tier: "" }, content: body });
  const linkedRatgeber = [...mentionedIn].sort();
  let tier = linkedRatgeber.length > 0 ? "A" : quality.tier;
  if (tier === "B" && !hasLastReviewed(data)) tier = "C";

  const lastGitDate = getLastGitDate(relativePath);
  const fields = {
    tier,
    lastReviewed: tier === "A" ? lastGitDate : null,
    mentionedIn: tier === "A" ? linkedRatgeber : [],
    generated_at: tier === "A" || tier === "B" ? null : lastGitDate,
  };

  const nextBody = tier === "A" || tier === "B" ? body.trim() : stripTemplateBoilerplate(body);
  let nextRaw = upsertManagedFrontmatter(raw, fields).replace(
    splitMarkdownDocument(upsertManagedFrontmatter(raw, fields)).body,
    `${nextBody.trim()}\n`,
  );

  if (!nextRaw.endsWith("\n")) nextRaw += "\n";
  if (nextRaw !== raw) {
    changes.push({
      slug,
      file: relativePath,
      tier,
      mentionedIn: linkedRatgeber,
      lastReviewed: fields.lastReviewed,
      generated_at: fields.generated_at,
      templatePhraseCountBefore: countTemplatePhrases(body),
      templatePhraseCountAfter: countTemplatePhrases(nextBody),
      internalRepeatsBefore: countInternalRepeats(body),
      editorialBlocksBefore: findEditorialBlocks(body),
    });
    if (write) fs.writeFileSync(filePath, nextRaw, "utf8");
  }

  tierCounts[tier] = (tierCounts[tier] ?? 0) + 1;
}

console.log(
  JSON.stringify(
    {
      dryRun: !write,
      totalTools: files.length,
      changed: changes.length,
      tierCounts,
      changes,
    },
    null,
    2,
  ),
);
