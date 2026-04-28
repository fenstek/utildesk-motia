import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd().endsWith("\\site") || process.cwd().endsWith("/site")
  ? join(process.cwd(), "..")
  : process.cwd();
const manifest = JSON.parse(
  readFileSync(join(repoRoot, "site", "src", "data", "tool-added-at.json"), "utf8"),
);

const decodeHtml = (value) =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

const readCards = (relativePath) => {
  const html = readFileSync(join(repoRoot, "site", "dist", relativePath), "utf8");
  const cards = [];
  const cardPattern = /<a\b(?=[^>]*\btool-card\b)([^>]*)>([\s\S]*?)<\/a>/g;
  let match;

  while ((match = cardPattern.exec(html))) {
    const attrs = match[1];
    const body = match[2];
    const href = (attrs.match(/\bhref="([^"]+)"/) || [])[1] || "";
    const slug = href.replace(/^\/(?:en\/)?tools\//, "").replace(/\/$/, "");
    const title = decodeHtml((body.match(/<h3 class="tool-title">([\s\S]*?)<\/h3>/) || [])[1] || slug);
    const addedAt = Number((attrs.match(/\bdata-added="([^"]+)"/) || [])[1] || 0);
    const addedAtOrder = Number((attrs.match(/\bdata-added-order="([^"]+)"/) || [])[1] || 0);
    cards.push({ slug, title: title.trim(), addedAt, addedAtOrder });
  }

  return cards;
};

const assertNewestSort = (label, relativePath) => {
  const cards = readCards(relativePath);
  if (cards.length === 0) {
    throw new Error(`${label}: no tool cards found in ${relativePath}`);
  }

  for (let index = 1; index < cards.length; index += 1) {
    const previous = cards[index - 1];
    const current = cards[index];
    const isSorted =
      previous.addedAt > current.addedAt ||
      (previous.addedAt === current.addedAt && previous.addedAtOrder >= current.addedAtOrder);
    if (!isSorted) {
      throw new Error(
        `${label}: newest sort break at ${index}: ${previous.slug} (${previous.addedAt}) before ${current.slug} (${current.addedAt})`,
      );
    }
  }

  const topFive = cards.slice(0, 5);
  const missingManifest = topFive.filter((card) => Number(manifest[card.slug] || 0) !== card.addedAt);
  if (missingManifest.length > 0) {
    throw new Error(
      `${label}: top cards do not match manifest timestamps: ${missingManifest.map((card) => card.slug).join(", ")}`,
    );
  }

  console.log(`${label}:`);
  for (const card of topFive) {
    console.log(`- ${card.title} (${card.slug}) ${new Date(card.addedAt).toISOString()}`);
  }
};

assertNewestSort("DE /tools/?sort=new", "tools/index.html");
assertNewestSort("EN /en/tools/?sort=new", "en/tools/index.html");
