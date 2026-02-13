#!/usr/bin/env node
/**
 * REBUILD pipeline: resolve official_url for rows with selected status.
 *
 * Default: dry-run (no writes).
 *
 * Usage:
 *   node scripts/sheet_rebuild_official_url.mjs [--status NAME] [--limit N] [--json]
 *   node scripts/sheet_rebuild_official_url.mjs --status NEEDS_REVIEW --use-gpt --gpt-fallback --strict --limit 20 --json
 *   node scripts/sheet_rebuild_official_url.mjs --status NEEDS_REVIEW --use-gpt --gpt-fallback --strict --apply --limit 20
 */

import process from "node:process";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { google } from "googleapis";
import OpenAI from "openai";

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || "";
const SHEET_NAME = process.env.SHEET_NAME || "Tabellenblatt1";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const args = process.argv.slice(2);

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
const traceGpt = args.includes("--trace-gpt");
const strictMode = args.includes("--strict");
const selectedStatus = String(getFlagValue("--status", "REBUILD")).trim();
const selectedStatusUpper = selectedStatus.toUpperCase();
const gptFallbackN = Math.min(8, Math.max(1, Number(getFlagValue("--gpt-fallback-n", "5")) || 5));
const validateTimeoutMs = Math.max(1000, Number(getFlagValue("--validate-timeout-ms", "8000")) || 8000);
const sleepMs = Math.max(0, Number(getFlagValue("--sleep-ms", "400")) || 400);
const minScore = Number(getFlagValue("--min-score", "3")) || 3;
const effectiveApply = applyMode && !dryValidateOnly;

const FORBIDDEN_HOSTS = new Set([
  "wikipedia.org",
  "wikidata.org",
  "github.com",
  "g2.com",
  "capterra.com",
  "alternativeto.net",
  "producthunt.com",
  "linkedin.com",
  "facebook.com",
  "instagram.com",
  "x.com",
  "twitter.com",
  "medium.com",
  "reddit.com",
  "duckduckgo.com",
]);

const BRAND_STOP_WORDS = new Set([
  "ai", "tool", "tools", "studio", "ml", "cloud", "service", "assistant", "framework", "platform",
  "by", "mit", "ehemals", "jetzt", "the", "and", "for", "official", "site", "app", "inc", "co"
]);

const GENERIC_IRRELEVANT_HOSTS = new Set([
  "assistant.ai",
  "domodedovo.ru",
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
  const private_key = String(process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email: client_email,
    key: private_key,
    scopes: effectiveApply
      ? ["https://www.googleapis.com/auth/spreadsheets"]
      : ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  return google.sheets({ version: "v4", auth });
}

function sleep(ms) {
  if (!ms || ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function cleanUrlInput(raw) {
  return String(raw || "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim()
    .replace(/[\u3002\u3001\uFF0C\uFF0E\uFE10\uFE11,;:!?]+$/g, "")
    .trim();
}

function normalizeUrl(raw, withHttpsDefault = true) {
  let src = cleanUrlInput(raw);
  if (!src) return "";
  if (withHttpsDefault && !/^[a-z]+:\/\//i.test(src)) {
    src = `https://${src}`;
  }
  try {
    const u = new URL(src);
    if (!/^https?:$/.test(u.protocol)) return "";
    u.hash = "";
    u.username = "";
    u.password = "";
    if ((u.protocol === "https:" && u.port === "443") || (u.protocol === "http:" && u.port === "80")) {
      u.port = "";
    }
    if (u.pathname.length > 1) u.pathname = u.pathname.replace(/\/+$/g, "");
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

function isForbiddenHost(host) {
  for (const d of FORBIDDEN_HOSTS) {
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

function escapeRegex(s) {
  return String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsTokenBoundary(haystack, token) {
  const hs = String(haystack || "").toLowerCase();
  const tk = String(token || "").toLowerCase();
  if (!hs || !tk) return false;
  const re = new RegExp(`(^|[^a-z0-9])${escapeRegex(tk)}([^a-z0-9]|$)`);
  return re.test(hs);
}

function containsAnyToken(haystack, tokens) {
  return tokens.some((t) => containsTokenBoundary(haystack, t));
}

function extractTitleFromHtml(html) {
  const src = String(html || "");
  const m = src.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!m) return "";
  return m[1].replace(/\s+/g, " ").trim();
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

function validateObjectTemplate(inputUrl) {
  return {
    inputUrl,
    finalUrl: "",
    status: 0,
    ok: false,
    hostname: "",
    titleSnippet: "",
    score: -3,
    notes: "invalid_url",
    forbidden: false,
  };
}

async function validateCandidate(candidate, tokens) {
  const inputUrl = String(candidate?.url || "");
  const normalized = normalizeUrl(inputUrl, true);
  const base = validateObjectTemplate(inputUrl);

  if (!normalized) {
    return { ...base, notes: "invalid_url" };
  }

  let res = null;
  let usedGet = false;
  try {
    res = await fetchWithTimeout(normalized, { method: "HEAD" }, validateTimeoutMs);
    if (res.status === 405 || res.status === 501) {
      usedGet = true;
      res = await fetchWithTimeout(normalized, { method: "GET", headers: { Range: "bytes=0-2048" } }, validateTimeoutMs);
    }
  } catch {
    try {
      usedGet = true;
      res = await fetchWithTimeout(normalized, { method: "GET", headers: { Range: "bytes=0-2048" } }, validateTimeoutMs);
    } catch (e2) {
      return {
        ...base,
        finalUrl: normalized,
        notes: `request_failed:${e2?.name || "error"}`,
      };
    }
  }

  const status = Number(res.status || 0);
  const finalUrl = normalizeUrl(res.url || normalized, true) || normalized;
  const hostname = hostFromUrl(finalUrl);
  const forbidden = isForbiddenHost(hostname);
  const okHttp = status >= 200 && status < 400;

  let titleSnippet = "";
  if (usedGet) {
    try {
      const body = await res.text();
      titleSnippet = extractTitleFromHtml(body).slice(0, 140);
    } catch {
      titleSnippet = "";
    }
  }

  const tokenInHost = containsAnyToken(hostname, tokens);
  const tokenInTitle = containsAnyToken(titleSnippet, tokens);

  let score = 0;
  if (okHttp) score += 2;
  if (tokenInHost) score += 2;
  if (tokenInTitle) score += 1;
  if (!tokenInHost && !tokenInTitle) score -= 2;
  if (GENERIC_IRRELEVANT_HOSTS.has(hostname) && !tokenInHost) score -= 2;
  if (forbidden) score = -999;

  const notes = [];
  if (!okHttp) notes.push("http_not_ok");
  if (forbidden) notes.push("forbidden_domain");
  if (forbidden && (hostname === "duckduckgo.com" || hostname.endsWith(".duckduckgo.com"))) {
    notes.push("ddg_redirect_forbidden");
  }
  if (!tokenInHost && !tokenInTitle) notes.push("token_miss");
  if (!notes.length) notes.push("ok");

  return {
    inputUrl: normalized,
    finalUrl,
    status,
    ok: okHttp,
    hostname,
    titleSnippet,
    score,
    notes: notes.join(","),
    forbidden,
    source: String(candidate?.source || "unknown"),
  };
}

function dedupeCandidates(candidates) {
  const out = [];
  const seen = new Set();
  for (const c of candidates) {
    const url = normalizeUrl(c?.url, true);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push({ url, source: String(c?.source || "resolver") });
  }
  return out;
}

function extractCandidatesFromPayload(payload) {
  const bag = [];
  const walk = (node, source = "resolver") => {
    if (!node) return;
    if (typeof node === "string") {
      bag.push({ url: node, source });
      return;
    }
    if (Array.isArray(node)) {
      for (const x of node) walk(x, source);
      return;
    }
    if (typeof node === "object") {
      const raw = node.official_url || node.url || node.best_url || node.href || node.u;
      if (raw) bag.push({ url: raw, source: String(node.source || source) });
      for (const key of ["candidates", "results", "items", "sample_report"]) {
        if (node[key] !== undefined) walk(node[key], source);
      }
    }
  };
  walk(payload, "resolver");
  return dedupeCandidates(bag);
}

function readResolverCandidates(topic) {
  let stdout = "";
  const commands = [
    ["scripts/resolve_official_url_ddg_v1.mjs", String(topic || ""), "--json"],
    ["scripts/resolve_official_url_ddg_v1.mjs", "--json", String(topic || "")],
    ["scripts/resolve_official_url_ddg_v1.mjs", String(topic || "")],
  ];

  for (const cmd of commands) {
    try {
      stdout = execFileSync("node", cmd, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
      if (stdout && stdout.trim()) break;
    } catch (e) {
      const raw = e?.stdout;
      const text = typeof raw === "string" ? raw : Buffer.isBuffer(raw) ? raw.toString("utf8") : "";
      if (text && text.trim()) {
        stdout = text;
        break;
      }
    }
  }

  const parsed = parseJsonFromText(stdout);
  return extractCandidatesFromPayload(parsed);
}

function decodeDdqRedirect(url) {
  try {
    const u = new URL(url);
    const v = u.searchParams.get("uddg");
    if (v) return decodeURIComponent(v);
    return url;
  } catch {
    return url;
  }
}

async function fetchDdgHtmlCandidates(topic) {
  const queries = [
    `${topic} official site`,
    `${topic} official website`,
    `${topic} ai tool official`,
  ];
  const out = [];

  for (let qi = 0; qi < queries.length; qi++) {
    const q = encodeURIComponent(queries[qi]);
    const url = `https://html.duckduckgo.com/html/?q=${q}`;
    let html = "";
    try {
      const res = await fetchWithTimeout(url, { method: "GET" }, validateTimeoutMs);
      html = await res.text();
    } catch {
      continue;
    }

    const hrefRe = /<a[^>]*class="result__a"[^>]*href="([^"]+)"/gi;
    let m;
    while ((m = hrefRe.exec(html)) !== null) {
      const raw = decodeDdqRedirect(m[1]);
      out.push({ url: raw, source: "ddg_html" });
      if (out.length >= 12) break;
    }
    if (out.length >= 12) break;
    await sleep(sleepMs);
  }

  return dedupeCandidates(out);
}

function hashPrompt(prompt) {
  return createHash("sha256").update(String(prompt || "")).digest("hex").slice(0, 16);
}

function extractOpenAiText(resp) {
  if (resp?.output_text) return String(resp.output_text);
  const chunks = [];
  const output = Array.isArray(resp?.output) ? resp.output : [];
  for (const item of output) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const c of content) {
      if (typeof c?.text === "string" && c.text.trim()) chunks.push(c.text);
    }
  }
  return chunks.join("\n");
}

function extractUrlsFromText(raw, source = "gpt_fallback") {
  const s = String(raw || "");
  const re = /https?:\/\/[^\s"'<>`]+/gi;
  const out = [];
  let m;
  while ((m = re.exec(s)) !== null) {
    out.push({ url: m[0], source });
  }
  return dedupeCandidates(out);
}

function heuristicFallbackCandidates(topic, n) {
  const tokens = brandTokens(topic);
  if (!tokens.length) return [];
  const base = tokens[0];
  const out = [
    { url: `https://www.${base}.com`, source: "gpt_fallback_heuristic" },
    { url: `https://${base}.com`, source: "gpt_fallback_heuristic" },
    { url: `https://${base}.ai`, source: "gpt_fallback_heuristic" },
  ];
  if (tokens[1]) {
    out.push({ url: `https://${tokens[0]}${tokens[1]}.com`, source: "gpt_fallback_heuristic" });
  }
  return dedupeCandidates(out).slice(0, n);
}

async function gptChooseFromCandidates(topic, candidates) {
  const key = String(process.env.OPENAI_API_KEY || "").trim();
  const trace = {
    mode: "gpt_choose",
    model: OPENAI_MODEL,
    prompt_hash: "",
    raw_reply_first_400: "",
    parsed_items: 0,
    errors: [],
  };

  if (!key) {
    trace.errors.push("missing_openai_api_key");
    return { url: "", trace, error: "missing_openai_api_key" };
  }

  const list = candidates.map((c, i) => ({ index: i + 1, url: c.url, source: c.source }));
  const prompt = [
    "Pick exactly one best official product URL from candidates.",
    "Return strict JSON only: {\"url\":\"https://...\"}",
    "Reject directories, socials, wiki, marketplaces, profile pages.",
    `Topic: ${topic}`,
    `Candidates: ${JSON.stringify(list)}`,
  ].join("\n");

  trace.prompt_hash = hashPrompt(prompt);

  try {
    const client = new OpenAI({ apiKey: key });
    const resp = await client.responses.create({ model: OPENAI_MODEL, input: prompt, temperature: 0 });
    const raw = extractOpenAiText(resp);
    trace.raw_reply_first_400 = raw.slice(0, 400);
    const parsed = parseJsonFromText(raw);

    if (Array.isArray(parsed)) {
      trace.parsed_items = parsed.length;
      const first = parsed.find((x) => x && typeof x === "object");
      const u = normalizeUrl(first?.url || "", true);
      return { url: u, trace, error: u ? "" : "parse_empty" };
    }

    if (parsed && typeof parsed === "object") {
      trace.parsed_items = 1;
      const u = normalizeUrl(parsed.url || "", true);
      return { url: u, trace, error: u ? "" : "parse_empty" };
    }

    trace.errors.push("parse_failed");
    return { url: "", trace, error: "parse_failed" };
  } catch (e) {
    trace.errors.push(String(e?.message || "gpt_error").slice(0, 160));
    return { url: "", trace, error: "gpt_error" };
  }
}

async function gptFallbackGenerate(topic, n) {
  const key = String(process.env.OPENAI_API_KEY || "").trim();
  const trace = {
    mode: "gpt_fallback",
    model: OPENAI_MODEL,
    prompt_hash: "",
    raw_reply_first_400: "",
    parsed_items: 0,
    errors: [],
  };

  if (!key) {
    trace.errors.push("missing_openai_api_key");
    return { items: [], trace, error: "missing_openai_api_key" };
  }

  const prompt = [
    "Return strictly JSON array only.",
    `Topic: ${topic}`,
    `Return up to ${n} candidates: [{\"url\":\"https://...\",\"reason\":\"...\",\"confidence\":0.0}]`,
    "Find official product website URLs.",
    "Do NOT include socials, wikipedia, directories, review portals, marketplace listings, github repository pages.",
  ].join("\n");

  trace.prompt_hash = hashPrompt(prompt);

  try {
    const client = new OpenAI({ apiKey: key });
    const resp = await client.responses.create({ model: OPENAI_MODEL, input: prompt, temperature: 0 });
    const raw = extractOpenAiText(resp);
    trace.raw_reply_first_400 = raw.slice(0, 400);
    const parsed = parseJsonFromText(raw);
    if (!Array.isArray(parsed)) {
      trace.errors.push("parse_failed");
      const fromText = extractUrlsFromText(raw, "gpt_fallback");
      trace.parsed_items = fromText.length;
      if (fromText.length) return { items: fromText.slice(0, n), trace, error: "" };
      const heuristic = heuristicFallbackCandidates(topic, n);
      if (heuristic.length) {
        trace.errors.push("heuristic_used");
        trace.parsed_items = heuristic.length;
        return { items: heuristic, trace, error: "" };
      }
      return { items: [], trace, error: "parse_failed" };
    }

    trace.parsed_items = parsed.length;
    const items = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const url = normalizeUrl(item.url || "", true);
      if (!url) continue;
      items.push({
        url,
        source: "gpt_fallback",
        reason: String(item.reason || ""),
        confidence: Number(item.confidence || 0) || 0,
      });
      if (items.length >= n) break;
    }

    const dedup = dedupeCandidates(items);
    if (dedup.length) return { items: dedup, trace, error: "" };
    const heuristic = heuristicFallbackCandidates(topic, n);
    if (heuristic.length) {
      trace.errors.push("heuristic_used");
      trace.parsed_items = heuristic.length;
      return { items: heuristic, trace, error: "" };
    }
    return { items: [], trace, error: "parse_empty" };
  } catch (e) {
    trace.errors.push(String(e?.message || "gpt_error").slice(0, 160));
    const heuristic = heuristicFallbackCandidates(topic, n);
    if (heuristic.length) {
      trace.errors.push("heuristic_used");
      trace.parsed_items = heuristic.length;
      return { items: heuristic, trace, error: "" };
    }
    return { items: [], trace, error: "gpt_error" };
  }
}

function bestValidated(validated) {
  const eligible = validated.filter((v) => v.ok && !v.forbidden && v.score >= minScore);
  eligible.sort((a, b) => b.score - a.score);
  return eligible[0] || null;
}

function reasonFromSource(source, viaGptChoose = false) {
  if (viaGptChoose) return "gpt_choose_validated";
  if (String(source || "").startsWith("gpt_fallback")) return "gpt_fallback_validated";
  if (source === "current") return "current_validated";
  return "ddg_validated";
}

async function main() {
  const sheets = await createSheetsClient();

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

  const targets = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const statusNormalized = String(row[idx.status] || "").trim().toUpperCase();
    if (statusNormalized === selectedStatusUpper) {
      targets.push({ rowNumber: i + 2, row });
      if (targets.length >= limit) break;
    }
  }

  if (!targets.length) {
    console.log(jsonOutput ? "[]" : `No ${selectedStatusUpper} rows found`);
    return;
  }

  const out = [];
  for (const it of targets) {
    const topic = String(it.row[idx.topic] || "").trim();
    const cur = String(it.row[idx.official_url] || "").trim();
    const tokens = brandTokens(topic);

    let candidates = readResolverCandidates(topic);
    const ddgCandidates = await fetchDdgHtmlCandidates(topic);
    candidates = dedupeCandidates([...candidates, ...ddgCandidates]);

    const curUrl = normalizeUrl(cur, true);
    if (curUrl) {
      candidates = dedupeCandidates([...candidates, { url: curUrl, source: "current" }]);
    }

    let gptTrace = null;
    let gptFallbackUsed = false;
    let chooserUsed = false;

    if (!candidates.length && gptFallback) {
      gptFallbackUsed = true;
      const fb = await gptFallbackGenerate(topic, gptFallbackN);
      if (traceGpt) gptTrace = fb.trace;
      if (fb.error && !fb.items.length) {
        // keep empty candidates, reason handled below
      }
      candidates = dedupeCandidates([...candidates, ...(fb.items || [])]);
    }

    let gptChosenUrl = "";
    let gptChooseError = "";
    if (useGpt && candidates.length) {
      chooserUsed = true;
      const choice = await gptChooseFromCandidates(topic, candidates);
      gptChosenUrl = normalizeUrl(choice.url, true);
      gptChooseError = choice.error || "";
      if (traceGpt) gptTrace = choice.trace;
    } else if (traceGpt && !gptTrace) {
      gptTrace = {
        mode: useGpt ? "gpt_choose" : "none",
        model: OPENAI_MODEL,
        prompt_hash: "",
        raw_reply_first_400: "",
        parsed_items: 0,
        errors: [useGpt ? "no_candidates" : "use_gpt_disabled"],
      };
    }

    const validated = [];
    const seenValidation = new Set();

    const enqueue = [];
    if (gptChosenUrl) enqueue.push({ url: gptChosenUrl, source: "gpt_choose" });
    enqueue.push(...candidates);

    for (const c of enqueue) {
      const k = normalizeUrl(c.url, true);
      if (!k || seenValidation.has(k)) continue;
      seenValidation.add(k);
      const v = await validateCandidate(c, tokens);
      validated.push(v);
      await sleep(sleepMs);
    }

    const best = bestValidated(validated);
    let suggested = "";
    let reason = "no_suggestion";

    if (best) {
      suggested = best.finalUrl;
      reason = reasonFromSource(best.source, best.source === "gpt_choose");
    } else if (validated.length) {
      reason = "validate_failed";
    }

    if (useGpt && gptChooseError && reason === "no_suggestion" && !gptFallbackUsed) {
      reason = "gpt_error";
    }
    if (gptFallbackUsed && !validated.length && reason === "no_suggestion") {
      reason = gptTrace?.errors?.length ? "gpt_error" : "no_suggestion";
    }

    if (!strictMode && !suggested && candidates.length) {
      const fallback = normalizeUrl(candidates[0].url, true);
      const fallbackHost = hostFromUrl(fallback);
      if (fallback && !isForbiddenHost(fallbackHost)) {
        suggested = fallback;
        reason = "ddg";
      }
    }

    const finalSuggested = dryValidateOnly ? "" : suggested;

    const item = {
      row: it.rowNumber,
      topic,
      current_official_url: cur,
      candidates_count: candidates.length,
      chooser_used: chooserUsed,
      gpt_fallback_used: gptFallbackUsed,
      validated,
      suggested_official_url: finalSuggested,
      reason,
      apply: effectiveApply && !!finalSuggested,
    };

    if (traceGpt) item.gpt_trace = gptTrace;
    out.push(item);

    await sleep(sleepMs);
  }

  if (jsonOutput) {
    console.log(JSON.stringify(out, null, 2));
  } else {
    console.log(`Found ${out.length} ${selectedStatusUpper} rows (limit: ${limit}). apply=${effectiveApply}`);
  }

  if (!effectiveApply) return;

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
  console.error("ERROR:", e?.message || String(e));
  process.exit(1);
});
