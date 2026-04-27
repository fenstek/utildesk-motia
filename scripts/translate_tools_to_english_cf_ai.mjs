#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "../site/node_modules/gray-matter/index.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_DIR = path.join(ROOT, "content", "tools");
const TARGET_DIR = path.join(ROOT, "content", "en", "tools");
const LOG_PATH = path.join(ROOT, "tmp", "translate-tools-en.jsonl");
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || "f95e0a354dedfcd2eb4f6213e8af207d";
const MODEL = process.env.CLOUDFLARE_TRANSLATION_MODEL || "@cf/meta/llama-3.2-3b-instruct";
const LIMIT = Number(process.env.TRANSLATE_LIMIT || process.argv.find((arg) => arg.startsWith("--limit="))?.split("=")[1] || 0);
const FORCE = process.argv.includes("--force");
const CONCURRENCY = Math.max(1, Number(process.env.TRANSLATE_CONCURRENCY || "2"));

const PRICE_MODEL_EN = new Map([
  ["Kostenlos", "Free"],
  ["Freemium", "Freemium"],
  ["Kostenpflichtig", "Paid"],
  ["Open Source", "Open Source"],
  ["Abonnement", "Subscription"],
  ["Nutzungsbasiert", "Usage-based"],
  ["Einmalzahlung", "One-time purchase"],
  ["Individuelles Angebot", "Custom quote"],
  ["Je nach Plan", "Plan-based"],
  ["Testversion", "Trial"],
  ["Auf Anfrage", "On request"],
]);

function readWranglerToken() {
  if (process.env.CLOUDFLARE_API_TOKEN) return process.env.CLOUDFLARE_API_TOKEN;
  const appData = process.env.APPDATA;
  if (!appData) return "";
  const configPath = path.join(appData, "xdg.config", ".wrangler", "config", "default.toml");
  if (!existsSync(configPath)) return "";
  const config = readFileSync(configPath, "utf8");
  return config.match(/oauth_token\s*=\s*"([^"]+)"/)?.[1] || config.match(/api_token\s*=\s*"([^"]+)"/)?.[1] || "";
}

const token = readWranglerToken();
if (!token) {
  console.error("Missing Cloudflare API token. Set CLOUDFLARE_API_TOKEN or log in with wrangler.");
  process.exit(1);
}

function normalizeData(data, translated) {
  const next = { ...data };
  if (translated.title) next.title = String(translated.title).trim();
  if (translated.description) next.description = String(translated.description).trim();
  if (translated.category) next.category = String(translated.category).trim();
  if (data.price_model) {
    next.price_model = PRICE_MODEL_EN.get(String(data.price_model)) || String(translated.price_model || data.price_model).trim();
  }
  if (Array.isArray(translated.tags) && translated.tags.length) {
    next.tags = translated.tags.map((tag) => String(tag).trim()).filter(Boolean);
  }
  next.source_language = "de";
  next.translation = "full";
  return next;
}

function extractJson(text) {
  const cleaned = String(text || "").replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("Model did not return parseable JSON.");
  }
}

function modelText(payload) {
  return (
    payload?.result?.response ||
    payload?.result?.choices?.[0]?.message?.content ||
    payload?.result?.output_text ||
    ""
  );
}

async function callModel(messages) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${MODEL}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages,
      temperature: 0.1,
      max_tokens: 8192,
    }),
  });
  const bodyText = await response.text();
  if (!response.ok) {
    throw new Error(`Cloudflare AI HTTP ${response.status}: ${bodyText.slice(0, 800)}`);
  }
  const payload = JSON.parse(bodyText);
  if (!payload.success && !payload.result) {
    throw new Error(`Cloudflare AI error: ${bodyText.slice(0, 800)}`);
  }
  return modelText(payload);
}

async function translate(entry) {
  const source = await readFile(entry.sourcePath, "utf8");
  const parsed = matter(source);
  const input = {
    title: parsed.data.title || entry.slug,
    description: parsed.data.description || parsed.data.summary || parsed.data.excerpt || "",
    category: parsed.data.category || "",
    price_model: parsed.data.price_model || "",
    tags: Array.isArray(parsed.data.tags) ? parsed.data.tags : [],
    body: parsed.content.trim(),
  };

  const system = [
    "You are a precise German-to-English localization editor for an AI tools directory.",
    "Translate the provided tool entry fully into natural English.",
    "Do not summarize, shorten, omit sections, reorder sections, add opinions, add claims, or invent facts.",
    "Preserve all Markdown structure, headings, lists, tables, links, URLs, product names, code spans, and CTA links.",
    "Return only strict JSON with keys: title, description, category, price_model, tags, body.",
  ].join(" ");

  const user = `Translate this JSON from German to English without losing any content:\n${JSON.stringify(input, null, 2)}`;
  let output = await callModel([
    { role: "system", content: system },
    { role: "user", content: user },
  ]);

  let translated;
  try {
    translated = extractJson(output);
  } catch {
    output = await callModel([
      { role: "system", content: `${system} Your previous response was not valid JSON. Return strict JSON only.` },
      { role: "user", content: user },
    ]);
    translated = extractJson(output);
  }

  const body = String(translated.body || "").trim();
  if (!body || body.length < Math.min(500, Math.floor(input.body.length * 0.35))) {
    throw new Error("Translated body is unexpectedly short.");
  }

  const data = normalizeData(parsed.data, translated);
  const rendered = matter.stringify(`${body}\n`, data, { lineWidth: -1 });
  const tmpPath = `${entry.targetPath}.tmp`;
  await writeFile(tmpPath, rendered, "utf8");
  await rename(tmpPath, entry.targetPath);
  await writeFile(LOG_PATH, JSON.stringify({ ok: true, slug: entry.slug, at: new Date().toISOString() }) + "\n", { flag: "a" });
}

async function main() {
  await mkdir(TARGET_DIR, { recursive: true });
  await mkdir(path.dirname(LOG_PATH), { recursive: true });
  const files = (await readdir(SOURCE_DIR))
    .filter((file) => file.endsWith(".md") && !file.startsWith("_"))
    .sort((a, b) => a.localeCompare(b, "en"));

  const queue = files
    .map((file) => {
      const slug = file.replace(/\.md$/, "");
      return {
        slug,
        sourcePath: path.join(SOURCE_DIR, file),
        targetPath: path.join(TARGET_DIR, file),
      };
    })
    .filter((entry) => FORCE || !existsSync(entry.targetPath));

  const selected = LIMIT > 0 ? queue.slice(0, LIMIT) : queue;
  console.log(JSON.stringify({ totalMissing: queue.length, selected: selected.length, targetDir: TARGET_DIR, model: MODEL }, null, 2));

  let index = 0;
  let done = 0;
  let failed = 0;

  async function worker(workerId) {
    while (index < selected.length) {
      const entry = selected[index++];
      try {
        await translate(entry);
        done += 1;
        console.log(`[${done}/${selected.length}] ok ${entry.slug}`);
      } catch (error) {
        failed += 1;
        const message = String(error?.message || error);
        await writeFile(LOG_PATH, JSON.stringify({ ok: false, slug: entry.slug, error: message, at: new Date().toISOString() }) + "\n", { flag: "a" });
        console.error(`[worker ${workerId}] failed ${entry.slug}: ${message}`);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, selected.length) }, (_, i) => worker(i + 1)));
  console.log(JSON.stringify({ ok: failed === 0, done, failed, remaining: Math.max(0, queue.length - selected.length) }, null, 2));
  if (failed) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
