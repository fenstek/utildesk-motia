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
const enToolsDir = path.join(repoRoot, "content", "en", "tools");

const minActiveTools = Number(process.env.UTILDESK_MIN_ACTIVE_TOOLS || 1124);
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
const allowedEditorialVerdicts = new Set(["recommend", "caution", "overrated", "reject"]);
let explicitEditorialVerdicts = 0;

const normalizeEvidence = (value) => String(value || "")
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase();

const verdictEvidence = (data, body, locale) => {
  const label = locale === "en" ? "Editorial verdict" : "Redaktionelles Verdikt";
  const markerPattern = new RegExp(`^\\*\\*${label}:\\s*([^*]+)\\*\\*`, "gim");
  const markers = [...body.matchAll(markerPattern)].map((match) => match[1]);
  return normalizeEvidence([
    data.editorial_verdict_headline,
    data.editorial_verdict_text,
    ...markers,
  ].filter(Boolean).join(" "));
};

const evidenceMatchesVerdict = (verdict, evidence, locale) => {
  if (!evidence) return false;
  const patterns = locale === "en"
    ? {
        recommend: /\b(recommend|recommended|recommendation)\b/,
        caution: /\b(with caveat|caveat|caution|reservation|conditionally)\b/,
        overrated: /\b(overrated|oversold)\b/,
        reject: /\b(not recommended|do not recommend|reject)\b/,
      }
    : {
        recommend: /\b(empfehlen|empfohlen|empfehlung)\b/,
        caution: /\b(mit vorbehalt|vorbehalt|vorsicht|bedingt)\b/,
        overrated: /\b(uberbewertet|ueberbewertet)\b/,
        reject: /\b(nicht empfohlen|nicht empfehlen|ablehnen)\b/,
      };
  return patterns[verdict]?.test(evidence) === true;
};

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
  const enFilePath = path.join(enToolsDir, file);
  const enRaw = fs.existsSync(enFilePath) ? fs.readFileSync(enFilePath, "utf8") : "";
  const enData = enRaw ? parseSimpleFrontmatter(enRaw) : {};
  const enBody = enRaw ? splitMarkdownDocument(enRaw).body : "";

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

  if (!enRaw) {
    failures.push(`${slug}: active German card has no English counterpart`);
    continue;
  }

  const deVerdict = String(data.editorial_verdict || "").trim().toLowerCase();
  const enVerdict = String(enData.editorial_verdict || "").trim().toLowerCase();
  const deHasVerdictCopy = Boolean(data.editorial_verdict_headline || data.editorial_verdict_text);
  const enHasVerdictCopy = Boolean(enData.editorial_verdict_headline || enData.editorial_verdict_text);
  if (!deVerdict && !enVerdict) {
    if (deHasVerdictCopy || enHasVerdictCopy) {
      failures.push(`${slug}: verdict copy exists without an explicit editorial_verdict`);
    }
    continue;
  }

  explicitEditorialVerdicts += 1;
  if (!deVerdict || !enVerdict) {
    failures.push(`${slug}: editorial_verdict must be present in both DE and EN`);
    continue;
  }
  if (!allowedEditorialVerdicts.has(deVerdict) || !allowedEditorialVerdicts.has(enVerdict)) {
    failures.push(`${slug}: invalid editorial_verdict (DE=${deVerdict}, EN=${enVerdict})`);
    continue;
  }
  if (deVerdict !== enVerdict) {
    failures.push(`${slug}: editorial_verdict differs between DE (${deVerdict}) and EN (${enVerdict})`);
    continue;
  }
  if (!editorialReviewed || !(enData.editorial_reviewed === true || String(enData.editorial_reviewed || "").toLowerCase() === "true")) {
    failures.push(`${slug}: explicit editorial_verdict requires editorial_reviewed=true in DE and EN`);
  }
  if (!evidenceMatchesVerdict(deVerdict, verdictEvidence(data, body, "de"), "de")) {
    failures.push(`${slug}: German textual verdict does not confirm editorial_verdict=${deVerdict}`);
  }
  if (!evidenceMatchesVerdict(enVerdict, verdictEvidence(enData, enBody, "en"), "en")) {
    failures.push(`${slug}: English textual verdict does not confirm editorial_verdict=${enVerdict}`);
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
      explicitEditorialVerdicts,
      unratedTools: activeTools.length - explicitEditorialVerdicts,
      uniqueCategories: categoryCounts.size,
      categoryCounts: Object.fromEntries([...categoryCounts.entries()].sort((a, b) => a[0].localeCompare(b[0], "de"))),
    },
    null,
    2,
  ),
);
