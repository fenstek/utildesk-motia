import fs from "node:fs/promises";
import path from "node:path";
import sharp from "../site/node_modules/sharp/lib/index.js";
import {
  countTemplatePhrases,
  findEditorialBlocks,
  hasManualEditorialReview,
  parseSimpleFrontmatter,
  splitMarkdownDocument,
} from "../site/src/lib/toolQuality.mjs";

const root = path.resolve(import.meta.dirname, "..");
const toolsDir = path.join(root, "content", "tools");
const englishToolsDir = path.join(root, "content", "en", "tools");
const imagesDir = path.join(root, "content", "images", "tools");
const limit = Number(process.argv.find((arg) => arg.startsWith("--limit="))?.slice(8) || 100);

function words(markdown) {
  return splitMarkdownDocument(markdown).body
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

function headings(markdown) {
  return (splitMarkdownDocument(markdown).body.match(/^##\s+.+$/gm) ?? []).length;
}

function alternativeLinks(markdown) {
  const match = splitMarkdownDocument(markdown).body.match(/##\s+(?:Alternativen|Alternatives)[\s\S]*?(?=\n##\s|$)/i);
  return match ? (match[0].match(/\]\(\/(?:en\/)?tools\/[a-z0-9-]+\//gi) ?? []).length : 0;
}

function faqCount(markdown) {
  const match = splitMarkdownDocument(markdown).body.match(/##\s+FAQ[\s\S]*?(?=\n##\s|$)/i);
  return match ? (match[0].match(/^\*\*[^*]+\?\*\*/gm) ?? []).length : 0;
}

function imageReference(markdown) {
  return markdown.match(/<figure class="tool-editorial-figure">[\s\S]*?<img[^>]+src="\/images\/tools\/([^"?]+)"/i)?.[1] || "";
}

function isActive(data) {
  return String(data.active ?? "").toLowerCase() !== "false" &&
    String(data.disabled ?? "").toLowerCase() !== "true" &&
    String(data.draft ?? "").toLowerCase() !== "true";
}

async function audit(slug) {
  const dePath = path.join(toolsDir, `${slug}.md`);
  const enPath = path.join(englishToolsDir, `${slug}.md`);
  const de = await fs.readFile(dePath, "utf8");
  const deData = parseSimpleFrontmatter(de);
  if (!isActive(deData)) return null;

  let en = "";
  try { en = await fs.readFile(enPath, "utf8"); } catch { /* reported below */ }
  const enData = en ? parseSimpleFrontmatter(en) : {};
  const deWords = words(de);
  const enWords = en ? words(en) : 0;
  const issues = [];

  if (!en) issues.push("missing_en");
  if (!hasManualEditorialReview(deData) || (en && !hasManualEditorialReview(enData))) issues.push("unverified_editorial_status");
  if (findEditorialBlocks(de).length === 0 || (en && findEditorialBlocks(en).length === 0)) issues.push("missing_editorial_assessment");
  if (deWords < 420 || (en && enWords < 360)) issues.push("thin_copy");
  if (headings(de) < 7 || (en && headings(en) < 7)) issues.push("thin_structure");
  if (alternativeLinks(de) < 2 || (en && alternativeLinks(en) < 2)) issues.push("weak_internal_alternatives");
  if (faqCount(de) < 2 || (en && faqCount(en) < 2)) issues.push("thin_faq");
  if (countTemplatePhrases(de) >= 3 || (en && countTemplatePhrases(en) >= 3)) issues.push("template_signals");
  if (en && enWords / Math.max(deWords, 1) < 0.62) issues.push("english_depth_gap");

  const image = imageReference(de);
  let imageSize = null;
  let sourceRatio = null;
  if (image) {
    const metadata = await sharp(path.join(imagesDir, image)).metadata();
    imageSize = { width: metadata.width, height: metadata.height };
    sourceRatio = Number((metadata.width / metadata.height).toFixed(3));
  }

  const severity = issues.reduce((total, issue) => total + ({
    missing_en: 8,
    unverified_editorial_status: 5,
    missing_editorial_assessment: 4,
    thin_copy: 4,
    thin_structure: 3,
    weak_internal_alternatives: 3,
    thin_faq: 2,
    template_signals: 3,
    english_depth_gap: 3,
  }[issue] ?? 0), 0);

  return {
    slug,
    title: String(deData.title || slug),
    popularity: Number(deData.popularity || 0),
    severity,
    issues,
    deWords,
    enWords,
    deHeadings: headings(de),
    enHeadings: en ? headings(en) : 0,
    alternatives: alternativeLinks(de),
    faq: faqCount(de),
    image: image ? { path: `content/images/tools/${image}`, ...imageSize, sourceRatio } : null,
  };
}

const files = (await fs.readdir(toolsDir)).filter((file) => file.endsWith(".md") && !file.startsWith("_"));
const results = (await Promise.all(files.map((file) => audit(file.slice(0, -3))))).filter(Boolean);
const flagged = results
  .filter((entry) => entry.severity > 0)
  .sort((a, b) => (b.severity * 1000 + b.popularity) - (a.severity * 1000 + a.popularity));

console.log(JSON.stringify({
  scanned: results.length,
  flagged: flagged.length,
  clean: results.length - flagged.length,
  issueCounts: Object.fromEntries(
    [...new Set(flagged.flatMap((entry) => entry.issues))]
      .sort()
      .map((issue) => [issue, flagged.filter((entry) => entry.issues.includes(issue)).length]),
  ),
  illustrationCoverage: {
    withIllustration: results.filter((entry) => entry.image).length,
    withoutIllustration: results.filter((entry) => !entry.image).length,
    sourceRatioOutliers: results.filter((entry) => entry.image && (entry.image.sourceRatio < 1.35 || entry.image.sourceRatio > 1.9)).length,
    presentation: "All tool editorial figures are normalized to a 16:10 cover frame by decision-refinements.css.",
  },
  candidates: flagged.slice(0, limit),
}, null, 2));
