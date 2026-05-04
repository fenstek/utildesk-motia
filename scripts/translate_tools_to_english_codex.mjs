#!/usr/bin/env node
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "../site/node_modules/gray-matter/index.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_DIR = path.resolve(process.env.TRANSLATE_SOURCE_DIR || path.join(ROOT, "content", "tools"));
const TARGET_DIR = path.resolve(process.env.TRANSLATE_TARGET_DIR || path.join(ROOT, "content", "en", "tools"));
const TMP_DIR = path.resolve(process.env.TRANSLATE_TMP_DIR || path.join(ROOT, "tmp", "codex-translations"));
const LOG_PATH = path.resolve(process.env.TRANSLATE_LOG_PATH || path.join(ROOT, "tmp", "translate-tools-en-codex.jsonl"));
const MODEL = String(process.env.CODEX_TRANSLATION_MODEL || "gpt-5.4-mini").trim();
const CONCURRENCY = Math.max(1, Number(process.env.CODEX_TRANSLATION_CONCURRENCY || process.env.TRANSLATE_CONCURRENCY || "1"));
const MAX_RETRIES = Math.max(0, Number(process.env.CODEX_TRANSLATION_RETRIES || process.env.TRANSLATE_RETRIES || "1"));
const LIMIT = Number(process.env.TRANSLATE_LIMIT || argValue("--limit") || 0);
const FORCE = hasArg("--force");
const DRY_RUN = hasArg("--dry-run");
const SLUGS = new Set(await resolveSlugSelection());
const SCHEMA_PATH = path.join(TMP_DIR, "tool-translation.schema.json");
const CODEX_FLAG_SUPPORT = new Map();

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

const FORBIDDEN_META_COPY = [
  /English overview/i,
  /Use this English/i,
  /listed on Utildesk/i,
  /translated from/i,
];

const LEFTOVER_GERMAN_HEADINGS = [
  /^#{1,4}\s*Für wen\b/im,
  /^#{1,4}\s*Hauptfunktionen\b/im,
  /^#{1,4}\s*Vorteile\b/im,
  /^#{1,4}\s*Nachteile\b/im,
  /^#{1,4}\s*Preise\b/im,
  /^#{1,4}\s*Alternativen\b/im,
  /^#{1,4}\s*Fazit\b/im,
  /^#{1,4}\s*Kurzfazit\b/im,
];

function argValue(name) {
  const prefix = `${name}=`;
  const eqForm = process.argv.find((arg) => arg.startsWith(prefix));
  if (eqForm) {
    return eqForm.slice(prefix.length);
  }
  const idx = process.argv.findIndex((arg) => arg === name);
  if (idx >= 0 && idx + 1 < process.argv.length) {
    return process.argv[idx + 1];
  }
  return "";
}

function hasArg(name) {
  return process.argv.includes(name);
}

async function resolveSlugSelection() {
  const filePath = String(process.env.TRANSLATE_SLUG_FILE || argValue("--slug-file") || "").trim();
  if (filePath) {
    const resolved = path.isAbsolute(filePath) ? filePath : path.join(ROOT, filePath);
    if (!existsSync(resolved)) {
      throw new Error(`Slug file not found: ${resolved}`);
    }
    const text = await readFile(resolved, "utf8");
    return text
      .split(/[\r\n,]+/g)
      .map((slug) => slug.trim())
      .filter(Boolean);
  }
  const raw = [
    process.env.TRANSLATE_SLUGS || "",
    argValue("--slug") || "",
    argValue("--slugs") || "",
  ].join(",");
  return raw
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean);
}

async function ensureSchema() {
  await mkdir(TMP_DIR, { recursive: true });
  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["title", "description", "category", "price_model", "tags", "body"],
    properties: {
      title: { type: "string" },
      description: { type: "string" },
      category: { type: "string" },
      price_model: { type: "string" },
      tags: { type: "array", items: { type: "string" } },
      body: { type: "string" },
    },
  };
  await writeFile(SCHEMA_PATH, `${JSON.stringify(schema, null, 2)}\n`, "utf8");
}

function extractJson(text) {
  const cleaned = String(text || "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("Codex did not return parseable JSON.");
  }
}

function normalizeData(data, translated) {
  const next = { ...data };
  if (translated.title) next.title = String(translated.title).trim();
  if (translated.description) next.description = String(translated.description).trim();
  if (translated.category) next.category = String(translated.category).trim();
  if (data.price_model) {
    next.price_model = PRICE_MODEL_EN.get(String(data.price_model)) || String(translated.price_model || data.price_model).trim();
  } else if (translated.price_model) {
    next.price_model = String(translated.price_model).trim();
  }
  if (Array.isArray(translated.tags) && translated.tags.length) {
    next.tags = translated.tags.map((tag) => String(tag).trim()).filter(Boolean);
  }
  next.translation = "full";
  delete next.source_language;
  delete next.translation_model;
  delete next.translation_provider;
  return next;
}

function validateTranslation(entry, input, translated) {
  for (const field of ["title", "description", "category", "price_model", "body"]) {
    if (typeof translated[field] !== "string") {
      throw new Error(`Missing string field "${field}".`);
    }
  }
  if (!Array.isArray(translated.tags)) {
    throw new Error('Missing array field "tags".');
  }

  const body = translated.body.trim();
  if (!body || body.length < Math.min(500, Math.floor(input.body.length * 0.35))) {
    throw new Error("Translated body is unexpectedly short.");
  }

  const allText = [
    translated.title,
    translated.description,
    translated.category,
    translated.price_model,
    translated.tags.join(" "),
    translated.body,
  ].join("\n");

  const forbidden = FORBIDDEN_META_COPY.find((pattern) => pattern.test(allText));
  if (forbidden) {
    throw new Error(`Translation contains forbidden meta copy: ${forbidden}`);
  }

  const germanHeading = LEFTOVER_GERMAN_HEADINGS.find((pattern) => pattern.test(body));
  if (germanHeading) {
    throw new Error(`Translation still contains a German section heading: ${germanHeading}`);
  }

  if (/Use this overview/i.test(allText) || /compare the tool.*before opening the provider website/i.test(allText)) {
    throw new Error("Translation looks like generated placeholder card copy.");
  }

  if (entry.slug && !String(input.title || "").trim()) {
    throw new Error(`Missing source title for ${entry.slug}.`);
  }
}

function buildPrompt(input) {
  return [
    "You are Codex acting as a careful human English localization editor for Utildesk.",
    "",
    "Task:",
    "Translate this German AI-tool directory entry into natural English.",
    "",
    "Hard rules:",
    "- Return only valid JSON matching the provided schema.",
    "- Translate the full body. Do not summarize, shorten, omit sections, or add filler.",
    "- Preserve Markdown structure, headings, lists, tables, links, URLs, product names, code spans, and CTA links.",
    "- Keep facts exactly as written. Do not invent features, prices, ratings, dates, or claims.",
    "- The result must read like a normal English page, not like a translation note.",
    "- Never mention that this is translated, an English overview, listed on Utildesk, or a source-language conversion.",
    "- Write the description as a useful human summary of the entry, not a template sentence.",
    "- Translate tags to concise English tags while preserving their meaning.",
    "- Translate price_model if it is German; leave already-English labels alone.",
    "",
    "Input JSON:",
    JSON.stringify(input, null, 2),
  ].join("\n");
}

function resolveCodexCommand() {
  if (process.env.CODEX_CLI_PATH) {
    return { command: process.env.CODEX_CLI_PATH, prefixArgs: [] };
  }
  if (process.platform === "win32" && process.env.APPDATA) {
    const codexJs = path.join(process.env.APPDATA, "npm", "node_modules", "@openai", "codex", "bin", "codex.js");
    if (existsSync(codexJs)) {
      return { command: process.execPath, prefixArgs: [codexJs] };
    }
    const codexCmd = path.join(process.env.APPDATA, "npm", "codex.cmd");
    if (existsSync(codexCmd)) {
      return { command: codexCmd, prefixArgs: [] };
    }
  }
  return { command: "codex", prefixArgs: [] };
}

function codexExecSupportsFlag(command, prefixArgs, flag) {
  const key = `${command}\0${prefixArgs.join("\0")}\0${flag}`;
  if (CODEX_FLAG_SUPPORT.has(key)) return CODEX_FLAG_SUPPORT.get(key);

  const proc = spawnSync(command, [...prefixArgs, "exec", "--help"], {
    cwd: ROOT,
    env: { ...process.env, NO_COLOR: "1" },
    encoding: "utf8",
    windowsHide: true,
  });
  const help = `${proc.stdout || ""}\n${proc.stderr || ""}`;
  const supported = proc.status === 0 && help.includes(flag);
  CODEX_FLAG_SUPPORT.set(key, supported);
  return supported;
}

function pushOptionalCodexExecFlag(args, command, prefixArgs, flag) {
  if (codexExecSupportsFlag(command, prefixArgs, flag)) {
    args.push(flag);
  }
}

function compactStreamChunk(previous, chunk, maxLength = 5000) {
  const combined = previous + chunk;
  if (combined.length <= maxLength) return combined;
  return combined.slice(combined.length - maxLength);
}

async function runCodex(prompt, entry) {
  const outputPath = path.join(TMP_DIR, `${process.pid}-${Date.now()}-${entry.slug}.json`);
  const { command, prefixArgs } = resolveCodexCommand();
  const args = [...prefixArgs, "-a", "never", "exec"];
  if (MODEL) {
    args.push("-m", MODEL);
  }
  args.push(
    "-C",
    ROOT,
    "--skip-git-repo-check",
    "--sandbox",
    "read-only",
    "--ephemeral",
  );
  pushOptionalCodexExecFlag(args, command, prefixArgs, "--ignore-user-config");
  pushOptionalCodexExecFlag(args, command, prefixArgs, "--ignore-rules");
  args.push(
    "--output-last-message",
    outputPath,
    "--output-schema",
    SCHEMA_PATH,
    "--color",
    "never",
    "-",
  );

  return await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      env: { ...process.env, NO_COLOR: "1" },
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout = compactStreamChunk(stdout, chunk.toString("utf8"));
    });
    child.stderr.on("data", (chunk) => {
      stderr = compactStreamChunk(stderr, chunk.toString("utf8"));
    });
    child.on("error", reject);
    child.on("close", async (code) => {
      try {
        if (code !== 0) {
          reject(new Error(`codex exec failed with code ${code}: ${(stderr || stdout).slice(-1200)}`));
          return;
        }
        if (!existsSync(outputPath)) {
          reject(new Error(`codex exec did not write ${outputPath}. ${(stderr || stdout).slice(-1200)}`));
          return;
        }
        const output = await readFile(outputPath, "utf8");
        await unlink(outputPath).catch(() => {});
        resolve(output);
      } catch (error) {
        reject(error);
      }
    });
    child.stdin.end(prompt);
  });
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

  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const output = await runCodex(buildPrompt(input), entry);
      const translated = extractJson(output);
      validateTranslation(entry, input, translated);
      const rendered = matter.stringify(`${translated.body.trim()}\n`, normalizeData(parsed.data, translated), { lineWidth: -1 });
      const tmpPath = `${entry.targetPath}.tmp`;
      await writeFile(tmpPath, rendered, "utf8");
      await rename(tmpPath, entry.targetPath);
      await writeFile(LOG_PATH, JSON.stringify({ ok: true, slug: entry.slug, at: new Date().toISOString() }) + "\n", { flag: "a" });
      return;
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRIES) {
        await writeFile(
          LOG_PATH,
          JSON.stringify({ ok: false, retry: attempt + 1, slug: entry.slug, error: String(error?.message || error), at: new Date().toISOString() }) + "\n",
          { flag: "a" },
        );
      }
    }
  }
  throw lastError;
}

async function main() {
  await mkdir(TARGET_DIR, { recursive: true });
  await mkdir(path.dirname(LOG_PATH), { recursive: true });
  await ensureSchema();

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
    .filter((entry) => SLUGS.size === 0 || SLUGS.has(entry.slug))
    .filter((entry) => FORCE || !existsSync(entry.targetPath));

  const selected = LIMIT > 0 ? queue.slice(0, LIMIT) : queue;
  console.log(
    JSON.stringify(
      {
        backend: "codex-oauth",
        model: MODEL || "codex-default",
        totalQueued: queue.length,
        selected: selected.length,
        sourceDir: SOURCE_DIR,
        targetDir: TARGET_DIR,
        dryRun: DRY_RUN,
      },
      null,
      2,
    ),
  );

  if (DRY_RUN || selected.length === 0) {
    if (selected.length) {
      console.log(selected.map((entry) => entry.slug).join("\n"));
    }
    return;
  }

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
  console.log(JSON.stringify({ ok: failed === 0, done, failed, remainingQueued: Math.max(0, queue.length - selected.length) }, null, 2));
  if (failed) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
