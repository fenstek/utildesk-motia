#!/usr/bin/env node
/**
 * postcheck_scan_suspicious.mjs
 *
 * Scans published (DONE) tools for suspicious / irrelevant entries using
 * offline heuristics only — NO network calls beyond Google Sheets.
 *
 * Always DRY-RUN: never modifies the Sheet or repository.
 * Results → stdout (JSON). Human-readable summary → stderr.
 *
 * Usage:
 *   node scripts/postcheck_scan_suspicious.mjs [options]
 *
 * Options:
 *   --limit <n>            Max rows to inspect (default: 200)
 *   --status <s>           Comma-separated statuses to scan (default: DONE)
 *   --out <path>           Save JSON output to file
 *   --format json|md       Output format (default: json)
 *   --strict               Raise confidence on weak signals
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { google } from "googleapis";

// ── Config ────────────────────────────────────────────────────────────────────
const SPREADSHEET_ID =
  process.env.SPREADSHEET_ID || "1SOlqd_bJdiRlSmcP19mPPzMG9Mhet26gljaYj1G_eGQ";
const SHEET_NAME = process.env.SHEET_NAME || "Tabellenblatt1";
const SA_JSON_PATH = "/opt/utildesk-motia/secrets/google-service-account.json";
const CONTENT_DIR = path.resolve(process.cwd(), "content/tools");

// ── CLI ───────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function arg(flag, def) {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : def;
}
const LIMIT = Number(arg("--limit", "200"));
const STATUSES = arg("--status", "DONE")
  .split(",")
  .map((s) => s.trim().toUpperCase());
const OUT_PATH = arg("--out", null);
const FORMAT = arg("--format", "json");
const STRICT = args.includes("--strict");

// ── Heuristic data ────────────────────────────────────────────────────────────

/** Path tokens that indicate content/spam sites, not AI tools. */
const SPAM_PATH_TOKENS = [
  "write-for-us",
  "guest-post",
  "guest-posting",
  "sponsored",
  "advertise",
  "advertising",
  "press-release",
  "press-releases",
  "casino",
  "betting",
  "loans",
  "coupons",
  "coupon",
  "deals",
  "affiliate",
  "promotion",
  "promo",
  "discount",
];

/** Hostname substrings that weakly suggest content sites (not AI products). */
const HOST_SPAM_MARKERS = ["magazine", "news", "blog", "press", "media"];

/**
 * Generic / ambiguous slugs: many products share these names.
 * Only a signal when combined with absent wikidata_id.
 */
const GENERIC_SLUGS = new Set([
  "verge",    "wave",     "nova",    "mint",     "spark",
  "boost",    "edge",     "pulse",   "flux",     "axis",
  "apex",     "core",     "arc",     "zen",      "halo",
  "aura",     "vibe",     "flow",    "leap",     "beam",
  "node",     "grid",     "chain",   "link",     "hub",
  "forge",    "craft",    "build",   "shift",    "lift",
  "rise",     "peak",     "summit",  "horizon",  "nexus",
  "orbit",    "vector",   "pilot",   "scout",    "ranger",
  "titan",    "atlas",    "echo",    "mirror",   "prism",
  "catalyst", "nucleus",  "trace",   "drift",    "glide",
]);

/**
 * Small seed list of domains confirmed to be non-AI content sites.
 * Keep short — only add after manual verification.
 */
const SEED_BLACKLIST_DOMAINS = new Set([
  "waveaid.com.au", // Australian content/news site, not an AI tool
  "vergeal.fr",     // French content site, not an AI tool
]);

/**
 * These domains are NEVER auto-recommended for BLACKLIST by heuristics alone.
 * They may still appear as NEEDS_REVIEW if there are very specific signals.
 */
const ALLOWLIST_DOMAINS = new Set([
  "openai.com",       "anthropic.com",    "google.com",
  "google.co.uk",     "microsoft.com",    "adobe.com",
  "github.com",       "atlassian.com",    "notion.so",
  "figma.com",        "huggingface.co",   "stability.ai",
  "midjourney.com",   "canva.com",        "grammarly.com",
  "deepl.com",        "jasper.ai",        "runway.ml",
  "elevenlabs.io",    "replika.ai",       "deepmind.com",
  "cohere.com",       "perplexity.ai",    "mistral.ai",
]);

/**
 * Regional / exotic TLDs — weak negative signal only (NEEDS_REVIEW).
 * Ends-with matching against full hostname.
 */
const EXOTIC_TLD_SUFFIXES = [
  ".com.au", ".co.nz", ".co.za", ".co.in",
  ".ru",     ".cn",    ".vn",    ".bd",
  ".pk",     ".ng",    ".gh",    ".ke",
];

/** Patterns in the URL body that signal tracking/affiliate links. */
const TRACKING_PARAMS = ["utm_", "trackid=", "ref=", "affiliate_id=", "click_id="];

/** Terms anywhere in the URL that indicate adult/gambling content. */
const HARD_URL_TOKENS = [
  "casino", "bet365", "poker", "slots", "payday-loan", "xxx",
];

// ── Auth ──────────────────────────────────────────────────────────────────────
async function sheetsClient() {
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  if (email && rawKey) {
    const auth = new google.auth.JWT({
      email,
      key: rawKey.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
    return google.sheets({ version: "v4", auth });
  }
  const auth = new google.auth.GoogleAuth({
    keyFile: SA_JSON_PATH,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  return google.sheets({ version: "v4", auth });
}

// ── URL helpers ───────────────────────────────────────────────────────────────
function parseUrl(raw) {
  try {
    return new URL(raw.trim());
  } catch {
    return null;
  }
}

/**
 * Return the apex domain (e.g., "example.com" from "sub.example.com"),
 * handling common two-part TLDs.
 */
function apexDomain(hostname) {
  const h = hostname.toLowerCase();
  const knownTwoPartTlds = [
    "co.uk", "co.nz", "com.au", "co.au", "co.za", "co.in",
    "org.uk", "net.au",
  ];
  const parts = h.split(".");
  const twoLast = parts.slice(-2).join(".");
  if (knownTwoPartTlds.includes(twoLast) && parts.length > 2) {
    return parts.slice(-3).join(".");
  }
  return parts.slice(-2).join(".");
}

// ── Heuristic engine ──────────────────────────────────────────────────────────
/**
 * Run all URL-based heuristics against a single entry.
 * Returns { reasons, confidence, recommended_status } or null if clean.
 */
function runUrlHeuristics(officialUrl, parsedUrl, slug, wikidataId) {
  const findings = []; // { reason, status, confidence }

  function flag(reason, status, confidence) {
    findings.push({ reason, status, confidence });
  }

  if (!parsedUrl) {
    flag("missing_official_url", "NEEDS_REVIEW", 0.5);
    return summarise(findings);
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const apex = apexDomain(hostname);
  const fullUrl = parsedUrl.href.toLowerCase();
  const pathLower = parsedUrl.pathname.toLowerCase();
  const isAllowlisted = ALLOWLIST_DOMAINS.has(apex) || ALLOWLIST_DOMAINS.has(hostname);

  // Heuristic 1: Seed blacklist domain
  if (!isAllowlisted && SEED_BLACKLIST_DOMAINS.has(apex)) {
    flag("seed_blacklist_domain", "BLACKLIST", 0.95);
  }

  // Heuristic 2: Non-HTTPS
  if (parsedUrl.protocol !== "https:") {
    flag("non_https_url", "NEEDS_REVIEW", STRICT ? 0.55 : 0.40);
  }

  // Heuristic 3: Spam path tokens
  if (!isAllowlisted) {
    for (const token of SPAM_PATH_TOKENS) {
      if (pathLower.includes(`/${token}`) || pathLower.startsWith(`${token}/`)) {
        flag(`spam_path_token:${token}`, "BLACKLIST", 0.85);
        break;
      }
    }
  }

  // Heuristic 4: Host spam markers (content/media sites)
  if (!isAllowlisted) {
    for (const marker of HOST_SPAM_MARKERS) {
      if (hostname.includes(marker)) {
        flag(`host_spam_marker:${marker}`, "NEEDS_REVIEW", STRICT ? 0.45 : 0.35);
        break;
      }
    }
  }

  // Heuristic 5: Exotic / regional TLD
  if (!isAllowlisted) {
    for (const suffix of EXOTIC_TLD_SUFFIXES) {
      if (apex.endsWith(suffix)) {
        flag(`exotic_tld:${suffix}`, "NEEDS_REVIEW", 0.25);
        break;
      }
    }
  }

  // Heuristic 6: Tracking / affiliate params in stored URL
  for (const param of TRACKING_PARAMS) {
    if (fullUrl.includes(param)) {
      flag("tracking_params_in_url", "NEEDS_REVIEW", 0.40);
      break;
    }
  }

  // Heuristic 7: theverge.com — news site, not an AI product
  if (hostname.includes("theverge.com")) {
    flag("news_site_theverge", "NEEDS_REVIEW", 0.70);
  }

  // Heuristic 8: Generic slug + no wikidata_id
  const slugNorm = (slug || "").toLowerCase().replace(/-/g, "");
  const matchedGeneric = Array.from(GENERIC_SLUGS).find(
    (g) => slugNorm === g || slug.toLowerCase() === g
  );
  if (matchedGeneric && !wikidataId) {
    flag(
      `generic_slug_no_wikidata:${matchedGeneric}`,
      "NEEDS_REVIEW",
      STRICT ? 0.45 : 0.30
    );
  }

  // Heuristic 9: Slug-URL domain mismatch
  // e.g., slug=waveai but domain=waveaid.com.au
  if (!isAllowlisted && slug && slug.length > 3) {
    const slugCore = slugNorm.replace(/ai$|app$|io$|hub$/, "");
    const apexCore = apex.replace(/\./g, "");
    if (
      slugCore.length > 3 &&
      !apexCore.includes(slugCore) &&
      !slugCore.includes(apexCore.replace(/com|net|io|ai|org/, ""))
    ) {
      flag("slug_url_domain_mismatch", "NEEDS_REVIEW", STRICT ? 0.40 : 0.25);
    }
  }

  // Heuristic 10: Very deep URL path (not a homepage)
  const pathSegments = pathLower.split("/").filter(Boolean);
  if (pathSegments.length > 3) {
    flag("deep_url_path_not_homepage", "NEEDS_REVIEW", 0.30);
  }

  // Heuristic 11: Hard gambling/adult tokens anywhere in URL
  if (!isAllowlisted) {
    for (const token of HARD_URL_TOKENS) {
      if (fullUrl.includes(token)) {
        flag(`hard_url_token:${token}`, "BLACKLIST", 0.95);
        break;
      }
    }
  }

  // Heuristic 12: IP address instead of hostname
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    flag("ip_address_url", "NEEDS_REVIEW", 0.60);
  }

  // Heuristic 13: Bare localhost or non-public hostname
  if (hostname === "localhost" || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    flag("non_public_hostname", "NEEDS_REVIEW", 0.80);
  }

  // Heuristic 14: Slug is only digits or very short (< 2 chars)
  if (slug && (slug.length < 2 || /^\d+$/.test(slug))) {
    flag("invalid_slug_format", "NEEDS_REVIEW", 0.50);
  }

  if (findings.length === 0) return null;

  // Downgrade BLACKLIST to NEEDS_REVIEW for allowlisted domains
  if (isAllowlisted) {
    for (const f of findings) {
      if (f.status === "BLACKLIST") f.status = "NEEDS_REVIEW";
    }
  }

  return summarise(findings);
}

function summarise(findings) {
  const reasons = findings.map((f) => f.reason);
  const confidence = Number(Math.max(...findings.map((f) => f.confidence)).toFixed(2));
  const hasBlacklist = findings.some((f) => f.status === "BLACKLIST");
  const recommended_status = hasBlacklist ? "BLACKLIST" : "NEEDS_REVIEW";
  return { reasons, confidence, recommended_status };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  process.stderr.write(
    `[scan] start ts=${new Date().toISOString()} statuses=${STATUSES.join(",")} ` +
    `limit=${LIMIT}${STRICT ? " strict" : ""}\n`
  );

  const sheets = await sheetsClient();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:Z`,
  });

  const values = res.data.values || [];
  if (values.length < 2) {
    process.stderr.write("[scan] sheet is empty\n");
    emit([]);
    return;
  }

  const header = values[0].map((h) => String(h).trim().toLowerCase());
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));

  for (const col of ["slug", "status"]) {
    if (!(col in idx)) {
      process.stderr.write(`[scan] ERROR: missing required column "${col}"\n`);
      process.exit(1);
    }
  }

  const candidates = [];
  let scanned = 0;

  for (let i = 1; i < values.length; i++) {
    if (scanned >= LIMIT) break;

    const row = values[i];
    const status = String(row[idx.status] ?? "").trim().toUpperCase();
    if (!STATUSES.includes(status)) continue;

    scanned++;

    const slug         = String(row[idx.slug]         ?? "").trim();
    const title        = String(row[idx.topic]        ?? row[idx.title] ?? "").trim();
    const official_url = String(row[idx.official_url] ?? "").trim();
    const wikidata_id  = String(row[idx.wikidata_id]  ?? "").trim() || null;
    const rowNumber    = i + 1;

    const allReasons = [];
    let bestStatus    = null;
    let bestConf      = 0;

    // Signal: DONE in Sheet but no markdown file
    const mdPath  = path.join(CONTENT_DIR, `${slug}.md`);
    const mdExists = fs.existsSync(mdPath);
    if (!mdExists) {
      allReasons.push("done_but_no_md_file");
      if (!bestStatus) bestStatus = "NEEDS_REVIEW";
      bestConf = Math.max(bestConf, 0.60);
    }

    // URL heuristics
    if (!official_url) {
      allReasons.push("missing_official_url");
      if (!bestStatus) bestStatus = "NEEDS_REVIEW";
      bestConf = Math.max(bestConf, 0.50);
    } else {
      const parsedUrl = parseUrl(official_url);
      const urlResult = runUrlHeuristics(official_url, parsedUrl, slug, wikidata_id);
      if (urlResult) {
        allReasons.push(...urlResult.reasons);
        bestConf = Math.max(bestConf, urlResult.confidence);
        if (urlResult.recommended_status === "BLACKLIST") {
          bestStatus = "BLACKLIST";
        } else if (!bestStatus) {
          bestStatus = "NEEDS_REVIEW";
        }
      }
    }

    if (allReasons.length === 0) continue;

    candidates.push({
      row: rowNumber,
      slug,
      title,
      official_url,
      wikidata_id,
      md_exists: mdExists,
      reasons: allReasons,
      recommended_status: bestStatus,
      confidence: Number(bestConf.toFixed(2)),
    });
  }

  // Sort by confidence DESC, then BLACKLIST first
  candidates.sort((a, b) => {
    if (a.recommended_status !== b.recommended_status) {
      return a.recommended_status === "BLACKLIST" ? -1 : 1;
    }
    return b.confidence - a.confidence;
  });

  process.stderr.write(
    `[scan] scanned=${scanned} candidates=${candidates.length} ` +
    `blacklist=${candidates.filter((c) => c.recommended_status === "BLACKLIST").length} ` +
    `needs_review=${candidates.filter((c) => c.recommended_status === "NEEDS_REVIEW").length}\n`
  );

  for (const c of candidates) {
    process.stderr.write(
      `[scan]   row=${c.row} slug=${c.slug} status=${c.recommended_status} ` +
      `conf=${c.confidence} reasons=${c.reasons.join(",")}\n`
    );
  }

  emit(candidates);
}

function emit(candidates) {
  let output;
  if (FORMAT === "md") {
    output = toMarkdown(candidates);
  } else {
    output = JSON.stringify(candidates, null, 2);
  }
  process.stdout.write(output + "\n");
  if (OUT_PATH) {
    fs.writeFileSync(OUT_PATH, output, "utf-8");
    process.stderr.write(`[scan] results saved to ${OUT_PATH}\n`);
  }
}

function toMarkdown(candidates) {
  if (candidates.length === 0) {
    return "# Post-check Scan Results\n\nNo suspicious entries found.\n";
  }
  const lines = [
    "# Post-check Scan Results",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    `Found ${candidates.length} candidate(s).`,
    "",
    "| Row | Slug | Rec. Status | Confidence | Reasons |",
    "|-----|------|-------------|------------|---------|",
  ];
  for (const c of candidates) {
    lines.push(
      `| ${c.row} | \`${c.slug}\` | **${c.recommended_status}** | ${c.confidence} | ${c.reasons.join(", ")} |`
    );
  }
  return lines.join("\n");
}

main().catch((err) => {
  process.stderr.write(`[scan] ERROR: ${err.message}\n`);
  process.exit(1);
});
