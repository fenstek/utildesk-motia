import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import "dotenv/config";
import OpenAI from "openai";

function must(v, name) {
  if (!v) throw new Error(`Нет ${name} в .env`);
  return v;
}

const OPENAI_API_KEY = must(process.env.OPENAI_API_KEY, "OPENAI_API_KEY");
const MODEL = process.env.OPENAI_MODEL_TEXT || "gpt-4.1-mini";
const CONTENT_DIR = must(process.env.CONTENT_DIR, "CONTENT_DIR");
const TEMPLATE_PATH = must(process.env.TEMPLATE_PATH, "TEMPLATE_PATH");
const LANG = process.env.LANG || "de";

const client = new OpenAI({ apiKey: OPENAI_API_KEY });

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

  const template = loadTemplate();

  const system = `Ты пишешь SEO-страницы каталога инструментов. Язык: ${LANG}. Стиль: ясно, полезно, без воды, без упоминания что ты ИИ.`;
  const user = `
Сгенерируй контент для страницы инструмента по шаблону Markdown.

ДАННЫЕ:
- Tool name: ${topic}
- Slug: ${slug}
- Category: ${tool.category}
- Tags: ${tool.tags}
- Price model: ${tool.price_model}
- Affiliate URL: ${tool.affiliate_url || ""}

ТРЕБОВАНИЯ:
- Язык: немецкий
- Длина: 900–1400 слов
- Структура: H1, краткое intro, блок "Für wen geeignet", "Hauptfunktionen" (список), "Vorteile/Nachteile", "Preise", "Alternativen" (3–5), "FAQ" (5–8).
- Без выдуманных фактов: если не уверен — формулируй обобщённо (например "je nach Anbieter/Plan").
- Вставь affiliate ссылку только как placeholder: {{AFFILIATE_URL}} (если ссылки нет — оставь пустым).
- Верни ОДИН готовый Markdown документ.

ШАБЛОН (используй как основу, но заполни смыслом):
${template}
`;

  const resp = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.6,
  });

  const md = resp.choices?.[0]?.message?.content?.trim();
  if (!md) throw new Error("OpenAI вернул пустой ответ");

  const outDir = CONTENT_DIR;
  fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, `${slug}.md`);
  fs.writeFileSync(outPath, md, "utf8");

  console.log(JSON.stringify({ ok: true, outPath, slug }, null, 2));
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
