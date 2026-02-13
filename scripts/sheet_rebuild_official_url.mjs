#!/usr/bin/env node
/**
 * REBUILD pipeline: resolve official_url for rows with selected status.
 *
 * Default: dry-run (no writes).
 *
 * Usage:
 *   node scripts/sheet_rebuild_official_url.mjs [--status NAME] [--limit N] [--json]
 *   node scripts/sheet_rebuild_official_url.mjs --status NEEDS_REVIEW --use-gpt --gpt-fallback --limit 20 --json
 *   node scripts/sheet_rebuild_official_url.mjs --status NEEDS_REVIEW --use-gpt --gpt-fallback --apply --limit 20
 *
 * Notes:
 * - Reuses resolver CLI: scripts/resolve_official_url_ddg_v1.mjs
 * - Optional GPT chooser: scripts/lib/official_url_chooser_gpt.mjs
 * - Requires env: SPREADSHEET_ID, GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY
 */

import process from "node:process";
import { execFileSync } from "node:child_process";
import { google } from "googleapis";
import OpenAI from "openai";

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || "";
const SHEET_NAME = process.env.SHEET_NAME || "Tabellenblatt1";

const args = process.argv.slice(2);
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

function getFlagValue(name, fallback = "") {
  const i = args.indexOf(name);
  if (i < 0) return fallback;
  return String(args[i + 1] || fallback);
}

const limit = Math.max(1, Number(getFlagValue("--limit", "10")) || 10);
const jsonOutput = args.includes("--json");
const applyMode = args.includes("--apply");
const useGpt = args.includes("--use-gpt");
const gptFallback = args.includes("--gpt-fallback");
const dryValidateOnly = args.includes("--dry-validate-only");
const selectedStatus = String(getFlagValue("--status", "REBUILD")).trim();
const selectedStatusUpper = selectedStatus.toUpperCase();
const gptFallbackN = Math.min(8, Math.max(1, Number(getFlagValue("--gpt-fallback-n", "5")) || 5));
const validateTimeoutMs = Math.max(1000, Number(getFlagValue("--validate-timeout-ms", "8000")) || 8000);
const sleepMs = Math.max(0, Number(getFlagValue("--sleep-ms", "400")) || 400);
const effectiveApply = applyMode && !dryValidateOnly;

const HOST_BLACKLIST = new Set([
  "wikipedia.org",
  "github.com",
  "g2.com",
  "capterra.com",
  "alternativeto.net",
  "producthunt.com",
  "linkedin.com",
  "facebook.com",
  "x.com",
  "twitter.com",
  "instagram.com",
]);

const BRAND_STOP_WORDS = new Set([
  "ai",
  "tool",
  "tools",
  "studio",
  "ml",
  "cloud",
  "service",
  "assistant",
  "framework",
  "platform",
  "by",
  "mit",
  "ehemals",
  "jetzt",
  "the",
  "and",
  "for",
  "official",
  "site",
]);

function die(msg) {
  console.error(`\n[ERROR] ${msg}\n`);
  process.exit(1);
}

if (!SPREADSHEET_ID) die("SPREADSHEET_ID env var is missing");

function requireCreds() {
  const ce = process.env.GOOGLE_CLIENT_EMAIL || "";
  const pk = process.env.GOOGLE_PRIVATE_KEY || "";
  if (!ce || !pk) die("Missing GOOGLE_CLIENT_EMAIL/GOOGLE_PRIVATE_KEY env vars");
}

async function createSheetsClient() {
  requireCreds();
  const client_email = process.env.GOOGLE_CLIENT_EMAIL;
  let private_key = process.env.GOOGLE_PRIVATE_KEY;
  private_key = private_key.replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email: client_email,
    key: private_key,
    scopes: applyMode
      ? ["https://www.googleapis.com/auth/spreadsheets"]
      : ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  return google.sheets({ version: "v4", auth });
}

function parseJsonFromText(text) {
  const src = String(text || "").trim();
  if (!src) return null;
  try {
    return JSON.parse(src);
  } catch {
    // continue
  }
  const start = src.search(/[\[{]/);
  if (start < 0) return null;
  try {
    return JSON.parse(src.slice(start));
  } catch {
    return null;
  }
}

function sleep(ms) {
  if (!ms || ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeUrl(raw, withHttpsDefault = true) {
  let src = String(raw || "").trim();
  if (!src) return "";
  if (withHttpsDefault && !/^[a-z]+:\/\//i.test(src)) {
    src = `https://${src}`;
  }
  try {
    const u = new URL(src);
    if (!/^https?:$/.test(u.protocol)) return "";
    u.hash = "";
    return u.toString();
  } catch {
    return "";
  }
}

function hostFromUrl(u) {
  try {
    return new URL(u).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function isBlacklistedHost(host) {
  for (const d of HOST_BLACKLIST) {
    if (host === d || host.endsWith(`.${d}`)) return true;
  }
  return false;
}

function brandTokens(topic) {
  return String(topic || "")
    .toLowerCase()
    .replace(/[(){}[\],.:;/\\|!?"'`~@#$%^&*_+=<>-]+/g, " ")
    .split(/\s+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .filter((x) => x.length >= 3 && !BRAND_STOP_WORDS.has(x));
}

function containsAnyToken(haystack, tokens) {
  const s = String(haystack || "").toLowerCase();
  return tokens.some((t) => s.includes(t));
}

function extractCandidatesFromPayload(payload) {
  const out = [];
  const seen = new Set();

  const pushUrl = (raw, source = "resolver") => {
    const url = normalizeUrl(raw, true);
    if (!url || seen.has(url)) return;
    seen.add(url);
    out.push({ url, source });
  };

  const walk = (node) => {
    if (!node) return;
    if (typeof node === "string") {
      pushUrl(node);
      return;
    }
    if (Array.isArray(node)) {
      for (const x of node) walk(x);
      return;
    }
    if (typeof node === "object") {
      pushUrl(node.official_url || node.url || node.best_url || node.href || node.u, String(node.source || "resolver"));
      for (const key of ["candidates", "results", "items", "sample_report"]) {
        if (node[key] !== undefined) walk(node[key]);
      }
    }
  };

  walk(payload);
  return out;
}

function readResolverCandidates(topic) {
  let stdout = "";
  try {
    stdout = execFileSync("node", ["scripts/resolve_official_url_ddg_v1.mjs", String(topic || ""), "--json"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (e) {
    const raw = e?.stdout;
    stdout = typeof raw === "string" ? raw : Buffer.isBuffer(raw) ? raw.toString("utf8") : "";
  }
  const parsed = parseJsonFromText(stdout);
  return extractCandidatesFromPayload(parsed);
}

function extractTitleFromHtml(html) {
  const src = String(html || "");
  const m = src.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? String(m[1]).replace(/\s+/g, " ").trim() : "";
}

async function fetchWithTimeout(url, opts = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: controller.signal, redirect: "follow" });
  } finally {
    clearTimeout(t);
  }
}

async function validateCandidate(inputUrl, tokens) {
  const normalized = normalizeUrl(inputUrl, true);
  const base = {
    inputUrl,
    finalUrl: normalized || "",
    ok: false,
    status: 0,
    score: -3,
    note: "invalid_url",
  };
  if (!normalized) return base;

  let res;
  let usedGet = false;
  try {
    res = await fetchWithTimeout(normalized, { method: "HEAD" }, validateTimeoutMs);
    if (res.status === 405 || res.status === 501) {
      usedGet = true;
      res = await fetchWithTimeout(normalized, { method: "GET", headers: { Range: "bytes=0-0" } }, validateTimeoutMs);
    }
  } catch (e) {
    return { ...base, note: `request_failed:${e?.name || "error"}` };
  }

  const status = Number(res.status || 0);
  const finalUrl = normalizeUrl(res.url || normalized, true) || normalized;
  const host = hostFromUrl(finalUrl);
  const okHttp = status >= 200 && status < 400;
  const blacklisted = isBlacklistedHost(host);
  let title = "";
  let tokenInTitle = false;

  if (usedGet) {
    try {
      const body = await res.text();
      title = extractTitleFromHtml(body);
      tokenInTitle = containsAnyToken(title, tokens);
    } catch {
      // ignore
    }
  }

  const tokenInHost = containsAnyToken(host, tokens);
  let score = 0;
  if (okHttp) score += 2;
  if (tokenInHost) score += 2;
  if (tokenInTitle) score += 1;
  if (!tokenInHost && !tokenInTitle) score -= 1;
  if (blacklisted) score -= 3;

  let note = "validated";
  if (!okHttp) note = "http_not_ok";
  if (blacklisted) note = note === "validated" ? "blacklisted_domain" : `${note},blacklisted_domain`;
  if (!tokenInHost && !tokenInTitle) note = note === "validated" ? "no_brand_token" : `${note},no_brand_token`;

  return {
    inputUrl: normalized,
    finalUrl,
    ok: okHttp && !blacklisted,
    status,
    score,
    note,
  };
}

function pickBestValidated(validated) {
  const sorted = [...validated].sort((a, b) => b.score - a.score);
  return sorted[0] || null;
}

function extractOpenAiText(resp) {
  if (resp?.output_text) return String(resp.output_text);
  const chunks = [];
  const out = Array.isArray(resp?.output) ? resp.output : [];
  for (const item of out) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const c of content) {
      if (typeof c?.text === "string" && c.text.trim()) {
        chunks.push(c.text);
      }
    }
  }
  return chunks.join("\n");
}

async function chooseCandidateWithGptDirect(topic, candidates) {
  const key = process.env.OPENAI_API_KEY || "";
  if (!key) throw new Error("missing_openai_api_key");
  const normalized = candidates.map((c, i) => ({
    index: i + 1,
    url: normalizeUrl(c.url, true),
    source: String(c.source || "resolver"),
  })).filter((c) => c.url);
  if (!normalized.length) return "";

  const prompt = [
    "Select the single best official product website URL from candidates.",
    "Return STRICT JSON only, format: {\"url\":\"https://...\"}",
    "Do not return social media, directories, marketplaces, or docs/blog pages.",
    `Topic: ${topic}`,
    `Candidates: ${JSON.stringify(normalized)}`
  ].join("\n");

  const client = new OpenAI({ apiKey: key });
  const resp = await client.responses.create({
    model: OPENAI_MODEL,
    input: prompt,
    temperature: 0,
  });
  const text = extractOpenAiText(resp);
  const parsed = parseJsonFromText(text);
  const picked = normalizeUrl(parsed?.url || "", true);
  if (!picked) return "";
  const allow = new Set(normalized.map((c) => c.url));
  return allow.has(picked) ? picked : "";
}

async function gptFallbackCandidates(topic, n) {
  const key = process.env.OPENAI_API_KEY || "";
  if (!key) {
    throw new Error("missing_openai_api_key");
  }
  const client = new OpenAI({ apiKey: key });
  const prompt = [
    "Return strictly JSON only.",
    "Task: suggest official product website URLs for this AI tool topic.",
    `Topic: ${topic}`,
    `Return an array with up to ${n} items, each: {"url":"https://...","reason":"...","confidence":0..1}.`,
    "Avoid social profiles, marketplaces, directories, wikipedia, crunchbase, g2, capterra, producthunt.",
    "Prefer official product domains, not blog/news/press/partner pages.",
  ].join("\n");

  const resp = await client.responses.create({
    model: OPENAI_MODEL,
    input: prompt,
    temperature: 0,
  });
  const text = extractOpenAiText(resp);
  const parsed = parseJsonFromText(text);
  if (!Array.isArray(parsed)) return [];
  const out = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const url = normalizeUrl(item.url, true);
    if (!url) continue;
    out.push({
      url,
      reason: String(item.reason || ""),
      confidence: Number(item.confidence || 0) || 0,
      source: "gpt_fallback",
    });
    if (out.length >= n) break;
  }
  return out;
}

async function main() {
  const sheets = await createSheetsClient();
  let chooseOfficialUrlGpt = null;
  if (useGpt) {
    try {
      const mod = await import("./lib/official_url_chooser_gpt.mjs");
      if (typeof mod?.chooseOfficialUrlGpt === "function") {
        chooseOfficialUrlGpt = mod.chooseOfficialUrlGpt;
      }
    } catch {
      chooseOfficialUrlGpt = null;
    }
  }

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:Z`,
  });

  const values = res.data.values || [];
  if (values.length < 2) {
    console.log(jsonOutput ? "[]" : "No data");
    return;
  }

  const header = values[0].map((h) => String(h).trim());
  const rows = values.slice(1);
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));

  if (!("status" in idx)) die('Column "status" not found');
  for (const col of ["topic", "official_url"]) {
    if (!(col in idx)) die(`Column "${col}" not found`);
  }

  const rebuild = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const statusNormalized = String(row[idx.status] || "").trim().toUpperCase();
    if (statusNormalized === selectedStatusUpper) {
      rebuild.push({ rowNumber: i + 2, row });
      if (rebuild.length >= limit) break;
    }
  }

  if (rebuild.length === 0) {
    console.log(jsonOutput ? "[]" : `No ${selectedStatusUpper} rows found`);
    return;
  }

  const out = [];
  for (const it of rebuild) {
    const topic = String(it.row[idx.topic] || "").trim();
    const cur = String(it.row[idx.official_url] || "").trim();
    const tokens = brandTokens(topic);
    let candidates = readResolverCandidates(topic);
    const currentCandidate = normalizeUrl(cur, true);
    if (currentCandidate && !candidates.some((c) => c.url === currentCandidate)) {
      candidates.push({ url: currentCandidate, source: "current" });
    }

    let suggestedOfficialUrl = "";
    let reason = "no_suggestion";
    let chooserUsed = false;
    let gptFallbackUsed = false;
    const validated = [];

    if (candidates.length > 0) {
      if (useGpt) {
        chooserUsed = true;
        if (chooseOfficialUrlGpt) {
          try {
            const picked = await chooseOfficialUrlGpt({ topic, candidates });
            if (picked?.ok && picked?.official_url) {
              suggestedOfficialUrl = normalizeUrl(picked.official_url, true);
              reason = suggestedOfficialUrl ? "gpt_choose" : "no_suggestion";
            } else {
              reason = String(picked?.reason || "no_suggestion");
            }
          } catch {
            reason = "gpt_error";
          }
        }

        if (!suggestedOfficialUrl && (reason === "gpt_disabled" || reason === "gpt_error" || reason === "no_suggestion")) {
          try {
            const direct = await chooseCandidateWithGptDirect(topic, candidates);
            if (direct) {
              suggestedOfficialUrl = direct;
              reason = "gpt_choose";
            }
          } catch {
            // keep previous reason
          }
        }

        if (!suggestedOfficialUrl) {
          suggestedOfficialUrl = normalizeUrl(candidates[0]?.url, true);
          if (suggestedOfficialUrl) {
            reason = "ddg";
          }
        }
      } else {
        suggestedOfficialUrl = normalizeUrl(candidates[0]?.url, true);
        reason = suggestedOfficialUrl ? "ddg" : "no_suggestion";
      }
    } else if (gptFallback) {
      gptFallbackUsed = true;
      let generated = [];
      try {
        generated = await gptFallbackCandidates(topic, gptFallbackN);
      } catch {
        reason = "gpt_error";
        generated = [];
      }
      if (generated.length > 0) {
        for (let i = 0; i < generated.length; i++) {
          if (i > 0) await sleep(sleepMs);
          const v = await validateCandidate(generated[i].url, tokens);
          validated.push(v);
        }
        const best = pickBestValidated(validated);
        if (best && best.score >= 2) {
          suggestedOfficialUrl = best.finalUrl;
          reason = "gpt_fallback";
        } else {
          reason = validated.length ? "validate_failed" : "no_suggestion";
        }
      } else if (reason !== "gpt_error") {
        reason = "no_suggestion";
      }
    }

    const finalSuggested = dryValidateOnly ? "" : suggestedOfficialUrl;

    out.push({
      row: it.rowNumber,
      topic,
      current_official_url: cur,
      candidates_count: candidates.length,
      chooser_used: chooserUsed,
      gpt_fallback_used: gptFallbackUsed,
      validated,
      suggested_official_url: finalSuggested || "",
      reason,
      apply: effectiveApply && !!finalSuggested,
    });

    await sleep(sleepMs);
  }

  if (jsonOutput) {
    console.log(JSON.stringify(out, null, 2));
  } else {
    console.log(`Found ${out.length} ${selectedStatusUpper} rows (limit: ${limit}). apply=${applyMode}\n`);
    for (const r of out) {
      console.log(`- row ${r.row}: ${r.topic}`);
      console.log(`  current:   ${r.current_official_url || "(empty)"}`);
      console.log(`  suggested: ${r.suggested_official_url || "(none)"}`);
      console.log(`  reason:    ${r.reason}`);
      console.log();
    }
  }

  if (!effectiveApply) return;

  // Apply updates (official_url + set status NEW) for rows with suggestions
  const statusCol = "status";
  const urlCol = "official_url";

  for (const r of out) {
    if (!r.apply) continue;

    const urlCell = `${SHEET_NAME}!${String.fromCharCode("A".charCodeAt(0) + idx[urlCol])}${r.row}`;
    const statusCell = `${SHEET_NAME}!${String.fromCharCode("A".charCodeAt(0) + idx[statusCol])}${r.row}`;

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: urlCell,
      valueInputOption: "RAW",
      requestBody: { values: [[r.suggested_official_url]] },
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: statusCell,
      valueInputOption: "RAW",
      requestBody: { values: [["NEW"]] },
    });

    console.log(JSON.stringify({ ok: true, updated: { row: r.row, official_url: r.suggested_official_url, status: "NEW" } }, null, 2));
  }
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
