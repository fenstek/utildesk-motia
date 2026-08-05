import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentRoot = path.resolve(siteRoot, "..", "content");
const locales = [
  { locale: "de", directory: path.join(contentRoot, "ratgeber") },
  { locale: "en", directory: path.join(contentRoot, "en", "ratgeber") },
];
const allowedDisclosureModes = new Set(["editorial-passport", "required-text", "none"]);
const allowedCoverModes = new Set(["ai-generated", "ai-modified", "none"]);
const policyStart = new Date("2026-08-05T00:00:00Z").getTime();
const failures = [];

const first = (data, keys) => keys.map((key) => data[key]).find((value) => value !== undefined && value !== null && value !== "");
const explicitFalse = (value) => value === false || value === 0 || ["false", "no", "nein", "0"].includes(String(value).toLowerCase());

for (const { locale, directory } of locales) {
  const files = (await readdir(directory)).filter((file) => file.endsWith(".md") && !file.startsWith("_"));
  for (const file of files) {
    const parsed = matter(await readFile(path.join(directory, file), "utf8"));
    const data = parsed.data;
    const reviewed = first(data, ["editorialReviewed", "editorial_reviewed", "humanReviewed", "human_reviewed"]);
    const disclosure = first(data, ["aiDisclosureMode", "ai_disclosure_mode", "disclosureMode", "disclosure_mode"]);
    const coverDisclosure = first(data, ["coverDisclosure", "cover_disclosure", "imageDisclosure", "image_disclosure"]);
    const reviewedAt = first(data, ["finalHumanApprovalAt", "final_human_approval_at", "editorialReviewedAt", "editorial_reviewed_at"]);
    const finalApprovalAt = first(data, ["finalHumanApprovalAt", "final_human_approval_at"]);
    const aiAssistance = first(data, ["aiAssistance", "ai_assistance", "aiAssisted", "ai_assisted"]);
    const reviewScope = first(data, ["editorialReviewScope", "editorial_review_scope"]);
    const effectiveDate = new Date(data.updated ?? data.date ?? 0).getTime();
    const requiresExplicitMetadata = Number.isFinite(effectiveDate) && effectiveDate >= policyStart;
    const label = `${locale}/${file}`;

    if (requiresExplicitMetadata) {
      if (reviewed === undefined) failures.push(`${label}: current publications require explicit editorial_reviewed metadata`);
      if (aiAssistance === undefined) failures.push(`${label}: current publications require explicit ai_assistance metadata`);
      if (disclosure === undefined) failures.push(`${label}: current publications require explicit ai_disclosure_mode metadata`);
      if (!explicitFalse(reviewed) && disclosure !== "editorial-passport") {
        failures.push(`${label}: reviewed current publications require ai_disclosure_mode=editorial-passport`);
      }
      if (!explicitFalse(reviewed) && finalApprovalAt === undefined) {
        failures.push(`${label}: reviewed current publications require final_human_approval_at`);
      }
      if (!explicitFalse(reviewed) && !String(reviewScope ?? "").trim()) {
        failures.push(`${label}: reviewed current publications require editorial_review_scope`);
      }
    }

    if (disclosure !== undefined && !allowedDisclosureModes.has(String(disclosure))) {
      failures.push(`${label}: unsupported AI disclosure mode ${JSON.stringify(disclosure)}`);
    }
    if (explicitFalse(reviewed) && disclosure !== "required-text") {
      failures.push(`${label}: editorial_reviewed=false requires ai_disclosure_mode=required-text`);
    }
    if (coverDisclosure !== undefined && !allowedCoverModes.has(String(coverDisclosure))) {
      failures.push(`${label}: unsupported cover disclosure ${JSON.stringify(coverDisclosure)}`);
    }
    if (["ai-generated", "ai-modified"].includes(String(coverDisclosure)) && !data.coverImage) {
      failures.push(`${label}: cover_disclosure requires coverImage`);
    }
    if (reviewedAt !== undefined && !Number.isFinite(new Date(reviewedAt).getTime())) {
      failures.push(`${label}: invalid editorial review date ${JSON.stringify(reviewedAt)}`);
    }
    if (explicitFalse(reviewed) && reviewedAt !== undefined) {
      failures.push(`${label}: unreviewed content cannot have a final human approval date`);
    }
  }
}

if (failures.length) {
  console.error(`Editorial transparency check failed with ${failures.length} issue(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Editorial transparency check passed.");
