import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import OpenAI from "openai";
import { CANONICAL_PRICE_MODELS, normalizePriceModel } from "./lib/price_model_policy.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function must(v, name) {
  if (!v) throw new Error(`Нет ${name} в .env`);
  return v;
}

const TOOL_MD_BACKEND = normalizeBackend(process.env.TOOL_MD_BACKEND || process.env.GENERATE_TOOL_MD_BACKEND || "auto");
const CODEX_MODEL = String(process.env.CODEX_TOOL_MD_MODEL || process.env.CODEX_MODEL || "gpt-5.4-mini").trim();
const OPENAI_MODEL = process.env.OPENAI_MODEL_TEXT || "gpt-4.1-mini";
const CONTENT_DIR = path.resolve(process.env.CONTENT_DIR || path.join(ROOT, "content", "tools"));
const TEMPLATE_PATH = path.resolve(process.env.TEMPLATE_PATH || path.join(ROOT, "content", "tools", "_TEMPLATE.md"));
const LANG = process.env.LANG || "de";

const CODEX_FLAG_SUPPORT = new Map();

function normalizeBackend(value) {
  const backend = String(value || "auto").trim().toLowerCase();
  if (["auto", "codex", "openai"].includes(backend)) return backend;
  throw new Error(`Unsupported TOOL_MD_BACKEND="${value}". Use auto, codex, or openai.`);
}

function openAiKey() {
  return String(process.env.OPENAI_API_KEY || "").trim();
}

function loadTemplate() {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    throw new Error(`Шаблон не найден: ${TEMPLATE_PATH}`);
  }
  return fs.readFileSync(TEMPLATE_PATH, "utf8");
}

function safeSlug(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function resolveCodexCommand() {
  if (process.env.CODEX_CLI_PATH) {
    return { command: process.env.CODEX_CLI_PATH, prefixArgs: [] };
  }
  if (process.platform === "win32" && process.env.APPDATA) {
    const codexJs = path.join(process.env.APPDATA, "npm", "node_modules", "@openai", "codex", "bin", "codex.js");
    if (fs.existsSync(codexJs)) {
      return { command: process.execPath, prefixArgs: [codexJs] };
    }
    const codexCmd = path.join(process.env.APPDATA, "npm", "codex.cmd");
    if (fs.existsSync(codexCmd)) {
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

function stripMarkdownFence(text) {
  return String(text || "")
    .replace(/^```(?:markdown|md)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

async function runCodex(prompt, slug) {
  const outPath = path.join(ROOT, "tmp", `tool-md-${process.pid}-${Date.now()}-${slug}.md`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  const { command, prefixArgs } = resolveCodexCommand();
  const args = [...prefixArgs, "-a", "never", "exec"];
  if (CODEX_MODEL) {
    args.push("-m", CODEX_MODEL);
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
    outPath,
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
    child.on("close", (code) => {
      try {
        if (code !== 0) {
          reject(new Error(`codex exec failed with code ${code}: ${(stderr || stdout).slice(-1200)}`));
          return;
        }
        if (!fs.existsSync(outPath)) {
          reject(new Error(`codex exec did not write ${outPath}. ${(stderr || stdout).slice(-1200)}`));
          return;
        }
        const output = fs.readFileSync(outPath, "utf8");
        fs.unlinkSync(outPath);
        resolve(stripMarkdownFence(output));
      } catch (error) {
        reject(error);
      }
    });
    child.stdin.end(prompt);
  });
}

async function runOpenAi(messages) {
  const apiKey = openAiKey();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set for TOOL_MD_BACKEND=openai.");
  }
  const client = new OpenAI({ apiKey });
  const resp = await client.chat.completions.create({
    model: OPENAI_MODEL,
    messages,
    temperature: 0.6,
  });
  const md = resp.choices?.[0]?.message?.content?.trim();
  if (!md) throw new Error("OpenAI вернул пустой ответ");
  return stripMarkdownFence(md);
}

async function runGenerator(messages, prompt, slug) {
  if (TOOL_MD_BACKEND === "codex") {
    return { backend: "codex-oauth", model: CODEX_MODEL || "codex-default", markdown: await runCodex(prompt, slug) };
  }
  if (TOOL_MD_BACKEND === "openai") {
    return { backend: "openai-api", model: OPENAI_MODEL, markdown: await runOpenAi(messages) };
  }

  try {
    return { backend: "codex-oauth", model: CODEX_MODEL || "codex-default", markdown: await runCodex(prompt, slug) };
  } catch (error) {
    if (!openAiKey()) throw error;
    console.warn(`[generate_tool_md] Codex backend failed for ${slug}; falling back to OpenAI API.`);
    return { backend: "openai-api", model: OPENAI_MODEL, markdown: await runOpenAi(messages) };
  }
}

async function main() {
  // Вход: JSON одной строки tool (мы подаём из предыдущего шага)
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Использование: node generate_tool_md.mjs <tool.json>");
    process.exit(1);
  }

  const tool = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const topic = tool.topic;
  const slug = tool.slug || safeSlug(topic);
  const priceModel = normalizePriceModel(tool.price_model || "");

  const template = loadTemplate();

  const system = `Ты пишешь SEO-страницы каталога инструментов. Язык: ${LANG}. Стиль: ясно, полезно, без воды, без упоминания что ты ИИ.`;
  const user = `
Сгенерируй контент для страницы инструмента по шаблону Markdown.

ДАННЫЕ:
- Tool name: ${topic}
- Slug: ${slug}
- Category: ${tool.category}
- Tags: ${tool.tags}
- Price model: ${priceModel}
- Affiliate URL: ${tool.affiliate_url || ""}

ТРЕБОВАНИЯ:
- Язык: немецкий
- Длина: 900–1400 слов
- Структура: H1, краткое intro, блок "Für wen geeignet", "Hauptfunktionen" (список), "Vorteile/Nachteile", "Preise", "Alternativen" (3–5), "FAQ" (5–8).
- Без выдуманных фактов: если не уверен — формулируй обобщённо (например "je nach Anbieter/Plan").
- Если в frontmatter или в тексте упоминается Preis/Preismodell, используй только канонические формулировки: ${CANONICAL_PRICE_MODELS.join(", ")}.
- Не добавляй псевдоредакционные блоки или bulletpoints с формулировками "Prüfpunkt für", "Praxislauf mit", "Qualitätssicherung in", "Übergabe mit", "Guter Start für" или "Risiko bei".
- Не используй claims "kuratiert", "redaktionell geprüft" или "zuletzt geprüft", если они не переданы во входных данных.
- Вставь affiliate ссылку только как placeholder: {{AFFILIATE_URL}} (если ссылки нет — оставь пустым).
- Верни ОДИН готовый Markdown документ.

ШАБЛОН (используй как основу, но заполни смыслом):
${template}
`;

  const sourceHints = [
    tool.short_hint ? `Short hint: ${tool.short_hint}` : "",
    tool.notes ? `Editorial notes: ${tool.notes}` : "",
    tool.official_url ? `Official URL: ${tool.official_url}` : "",
  ].filter(Boolean).join("\n");

  const editorialSystem = `You write full editorial German tool catalogue pages for Utildesk. Language target: ${LANG}. Be practical, concrete, sober, and useful. Do not mention that you are AI. Do not create a short quick card.`;
  const editorialUser = `
Create one complete Markdown document for this German tool page.

DATA:
- Tool name: ${topic}
- Slug: ${slug}
- Category: ${tool.category}
- Tags: ${tool.tags}
- Price model: ${priceModel}
- Official URL: ${tool.official_url || ""}
- Affiliate URL: ${tool.affiliate_url || ""}
- Source hints:
${sourceHints || "(none)"}

REQUIREMENTS:
- Write in German.
- Length: 1100-1700 words. It must feel like a full editorial card, not a stub.
- Use the provided Markdown template as structure, but fill it with tool-specific substance.
- Required sections: H1; strong intro; "Für wen eignet sich ...?"; practical everyday use cases; workflow fit; main functions; strengths and limitations; privacy/data notes if relevant; pricing/cost notes; internal-style alternatives; editorial assessment; FAQ with 5-8 questions.
- Use the official URL, short hint, notes, category, and tags as grounding. Do not invent exact launch dates, customer counts, pricing tiers, certifications, or features unless they are present in the input.
- If a feature or pricing detail is uncertain, phrase it cautiously, e.g. "je nach Plan", "laut Anbieter", "sollte geprüft werden", or "in der Praxis hängt das vom Setup ab".
- Price wording must use only these canonical labels when a price model is named: ${CANONICAL_PRICE_MODELS.join(", ")}.
- Do not add pseudo-editorial boilerplate or repeated phrases such as "Prüfpunkt für", "Praxislauf mit", "Qualitätssicherung in", "Übergabe mit", "Guter Start für", or "Risiko bei".
- Do not claim "kuratiert", "redaktionell geprüft", "zuletzt geprüft", "getestet", or "eigene Erfahrung" unless the input explicitly says so.
- If affiliate_url is needed, use only the placeholder {{AFFILIATE_URL}}. If it is missing, leave the frontmatter affiliate field empty.
- Return exactly one final Markdown document, no explanations.

TEMPLATE:
${template}
`;

  const messages = [
    { role: "system", content: editorialSystem },
    { role: "user", content: editorialUser },
  ];
  const prompt = `${editorialSystem}\n\n${editorialUser}\n\nReturn only the final Markdown document.`;
  const result = await runGenerator(messages, prompt, slug);
  const md = result.markdown;
  if (!md) throw new Error(`${result.backend} вернул пустой ответ`);

  const outDir = CONTENT_DIR;
  fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, `${slug}.md`);
  fs.writeFileSync(outPath, md, "utf8");

  console.log(JSON.stringify({ ok: true, outPath, slug, backend: result.backend, model: result.model }, null, 2));
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
