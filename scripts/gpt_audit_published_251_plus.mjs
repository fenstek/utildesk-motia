#!/usr/bin/env node
import "dotenv/config";
import fs from "node:fs";
import process from "node:process";
import OpenAI from "openai";
import { google } from "googleapis";

const INPUT_PATH = "/tmp/published_251_plus.json";
const REPORT_PATH = "/tmp/gpt_audit_251_plus_report.json";
const CHANGED_SLUGS_PATH = "/tmp/gpt_audit_251_plus_changed_slugs.json";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const SPREADSHEET_ID = process.env.SPREADSHEET_ID || "";
const SHEET_NAME = process.env.SHEET_NAME || "Tabellenblatt1";
const OPENAI_API_KEY = String(process.env.OPENAI_API_KEY || "").trim();
const clientEmail = process.env.GOOGLE_CLIENT_EMAIL || "";
const privateKey = String(process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
const NOTE_PREFIX = "AUTO-GPT-AUDIT-251";

function die(message, code = 1) {
  console.error(message);
  process.exit(code);
}

function parseArgs(argv) {
  const opts = { limit: null };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = String(argv[i] || "");
    if (arg === "--limit") {
      opts.limit = Number(argv[i + 1] || 0);
      i += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return opts;
}

function colLetter(index) {
  let n = index + 1;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

function splitTags(value) {
  return String(value || "")
    .split(/[,\n]/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function normalizeTags(tags) {
  return [...new Set((Array.isArray(tags) ? tags : []).map((t) => String(t || "").trim().toLowerCase()).filter(Boolean))];
}

function stripHtml(input) {
  return String(input || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractMeta(html, pattern) {
  const match = html.match(pattern);
  return match ? String(match[1] || "").trim() : "";
}

async function fetchHtml(url) {
  if (!url || !/^https?:\/\//i.test(url)) {
    return {
      fetch_error: "invalid_url",
      final_url_after_redirect: "",
      title_from_site: "",
      og_title_from_site: "",
      h1_from_site: "",
      meta_description: "",
      canonical_from_site: "",
      final_domain: "",
    };
  }

  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: { "user-agent": "utildesk-gpt-audit/1.0" },
    });

    const contentType = String(res.headers.get("content-type") || "");
    if (!contentType.includes("text/html")) {
      return {
        fetch_error: `non_html:${contentType || "unknown"}`,
        final_url_after_redirect: res.url || url,
        title_from_site: "",
        og_title_from_site: "",
        h1_from_site: "",
        meta_description: "",
        canonical_from_site: "",
        final_domain: (() => {
          try { return new URL(res.url || url).hostname; } catch { return ""; }
        })(),
      };
    }

    const html = await res.text();
    return {
      fetch_error: "",
      final_url_after_redirect: res.url || url,
      title_from_site: extractMeta(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
      og_title_from_site: extractMeta(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i),
      h1_from_site: extractMeta(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i).replace(/\s+/g, " ").trim(),
      meta_description: extractMeta(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i),
      canonical_from_site: extractMeta(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i),
      final_domain: (() => {
        try { return new URL(res.url || url).hostname; } catch { return ""; }
      })(),
      body_excerpt: stripHtml(html).slice(0, 1200),
    };
  } catch (error) {
    return {
      fetch_error: error?.message || "fetch_failed",
      final_url_after_redirect: "",
      title_from_site: "",
      og_title_from_site: "",
      h1_from_site: "",
      meta_description: "",
      canonical_from_site: "",
      final_domain: "",
    };
  }
}

async function auditWithGPT(client, payload) {
  const prompt = [
    "You are auditing whether an official_url and tags match a software product.",
    "Return strict JSON only with keys: url_verdict, suggested_official_url, tags_verdict, suggested_tags, confidence, reasoning_short.",
    "Allowed url_verdict: PASS, FIX, FAIL.",
    "Allowed tags_verdict: PASS, FIX, FAIL.",
    "Never invent a URL unless the input clearly identifies the official product site.",
    "If unsure, choose FAIL or PASS conservatively and keep confidence below 0.85.",
    "Evaluate brand, product identity, official site fit, unrelated entities, marketplaces, parked domains, aggregators, and obvious tag mismatches.",
    "",
    JSON.stringify(payload, null, 2),
  ].join("\n");

  const resp = await client.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "Return strict JSON only." },
      { role: "user", content: prompt },
    ],
  });

  const text = String(resp.choices?.[0]?.message?.content || "").trim();
  return JSON.parse(text);
}

async function createSheetsClient() {
  if (!SPREADSHEET_ID) die("SPREADSHEET_ID env var is missing");
  if (!clientEmail || !privateKey) die("Missing GOOGLE_CLIENT_EMAIL/GOOGLE_PRIVATE_KEY env vars");
  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

async function getHeaderIndex(sheets) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:Z1`,
  });
  const header = (res.data.values?.[0] || []).map((cell) => String(cell || "").trim().toLowerCase());
  const idx = Object.fromEntries(header.map((name, i) => [name, i]));
  for (const required of ["status", "official_url", "notes", "tags"]) {
    if (!(required in idx)) die(`Missing column "${required}"`);
  }
  return idx;
}

async function applyUpdates(sheets, idx, item, audit) {
  const updates = [];
  const changes = {};
  const currentTags = splitTags(item.tags);
  const suggestedTags = normalizeTags(audit.suggested_tags);
  let nextStatus = item.status;
  let nextOfficial = item.official_url;
  let nextTags = item.tags;
  let note = "";

  if (audit.url_verdict === "FIX" && Number(audit.confidence || 0) >= 0.85 && audit.suggested_official_url) {
    nextOfficial = String(audit.suggested_official_url).trim();
    note = NOTE_PREFIX;
  } else if (audit.url_verdict === "FAIL") {
    nextStatus = "NEEDS_REVIEW";
    note = `${NOTE_PREFIX}: ${String(audit.reasoning_short || "").trim()}`;
  }

  if (audit.tags_verdict === "FIX" && Number(audit.confidence || 0) >= 0.85 && suggestedTags.length > 0) {
    nextTags = suggestedTags.join(", ");
    note = note ? `${note}` : NOTE_PREFIX;
  } else if (audit.tags_verdict === "FAIL") {
    nextStatus = "NEEDS_REVIEW";
    note = note || `${NOTE_PREFIX}: ${String(audit.reasoning_short || "").trim()}`;
  }

  if (nextStatus !== item.status) {
    updates.push({
      range: `${SHEET_NAME}!${colLetter(idx.status)}${item.row_number}`,
      values: [[nextStatus]],
    });
    changes.status = { before: item.status, after: nextStatus };
  }
  if (nextOfficial !== item.official_url) {
    updates.push({
      range: `${SHEET_NAME}!${colLetter(idx.official_url)}${item.row_number}`,
      values: [[nextOfficial]],
    });
    changes.official_url = { before: item.official_url, after: nextOfficial };
  }
  if (nextTags !== item.tags) {
    updates.push({
      range: `${SHEET_NAME}!${colLetter(idx.tags)}${item.row_number}`,
      values: [[nextTags]],
    });
    changes.tags = { before: currentTags, after: splitTags(nextTags) };
  }

  if (note) {
    const mergedNotes = item.notes ? `${item.notes} | ${note}` : note;
    if (mergedNotes !== item.notes) {
      updates.push({
        range: `${SHEET_NAME}!${colLetter(idx.notes)}${item.row_number}`,
        values: [[mergedNotes]],
      });
      changes.notes = { before: item.notes, after: mergedNotes };
    }
  }

  if (updates.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: "RAW",
        data: updates,
      },
    });
  }

  return changes;
}

async function main() {
  const opts = parseArgs(process.argv);
  if (!OPENAI_API_KEY) die("Missing OPENAI_API_KEY");
  if (!fs.existsSync(INPUT_PATH)) die(`Input file not found: ${INPUT_PATH}`);

  const input = JSON.parse(fs.readFileSync(INPUT_PATH, "utf8"));
  const rows = Array.isArray(input.rows) ? input.rows : [];
  const selected = opts.limit ? rows.slice(0, opts.limit) : rows;
  const client = new OpenAI({ apiKey: OPENAI_API_KEY });
  const sheets = await createSheetsClient();
  const idx = await getHeaderIndex(sheets);

  const report = [];
  const changedSlugs = [];

  for (const item of selected) {
    const site = await fetchHtml(item.official_url);
    const payload = {
      slug: item.slug,
      title: item.title,
      description: item.description,
      category: item.category,
      tags: splitTags(item.tags),
      official_url_current: item.official_url,
      final_url_after_redirect: site.final_url_after_redirect,
      title_from_site: site.title_from_site,
      og_title_from_site: site.og_title_from_site,
      h1_from_site: site.h1_from_site,
      meta_description: site.meta_description,
      canonical: site.canonical_from_site,
      final_domain: site.final_domain,
      fetch_error: site.fetch_error,
      body_excerpt: site.body_excerpt || "",
    };

    const audit = await auditWithGPT(client, payload);
    const changes = await applyUpdates(sheets, idx, item, audit);
    if (Object.keys(changes).length > 0) changedSlugs.push(item.slug);
    report.push({
      slug: item.slug,
      row_number: item.row_number,
      audit,
      changes,
      site: {
        final_url_after_redirect: site.final_url_after_redirect,
        final_domain: site.final_domain,
        title_from_site: site.title_from_site,
        h1_from_site: site.h1_from_site,
        meta_description: site.meta_description,
        canonical: site.canonical_from_site,
        fetch_error: site.fetch_error,
      },
    });
    console.log(JSON.stringify({ slug: item.slug, changes, url_verdict: audit.url_verdict, tags_verdict: audit.tags_verdict, confidence: audit.confidence }));
  }

  fs.writeFileSync(REPORT_PATH, JSON.stringify({ audited_at: new Date().toISOString(), count: report.length, report }, null, 2));
  fs.writeFileSync(CHANGED_SLUGS_PATH, JSON.stringify({ changed_slugs: changedSlugs }, null, 2));
  console.log(JSON.stringify({ ok: true, audited: report.length, changed: changedSlugs.length, report_path: REPORT_PATH, changed_slugs_path: CHANGED_SLUGS_PATH }, null, 2));
}

main().catch((error) => {
  console.error(`ERROR: ${error?.message || String(error)}`);
  process.exit(1);
});
