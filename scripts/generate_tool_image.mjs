import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import crypto from "node:crypto";
import dotenv from "dotenv";
import OpenAI from "openai";

// Всегда читаем .env по абсолютному пути (можно запускать из любой папки)
dotenv.config({ path: "/opt/utildesk-motia/.env" });

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("ERROR: OPENAI_API_KEY не найден. Проверь /opt/utildesk-motia/.env");
  process.exit(1);
}

const client = new OpenAI({ apiKey });

const slug = process.argv[2];
const title = process.argv[3];

if (!slug || !title) {
  console.error("Usage: node generate_tool_image.mjs <slug> <title>");
  process.exit(1);
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function seedTag() {
  return crypto.randomBytes(3).toString("hex"); // короткий id
}

// Archetypes v2 (A–F) + подтипы
const archetypes = [
  // A — SaaS UI
  { id: "A1", scene: "a modern ultrabook on a clean desk, generic chat-style SaaS UI on screen (no readable text)" },
  { id: "A2", scene: "a desktop monitor (iMac-like) on an office desk, generic dashboard UI with cards and sidebar (no readable text)" },
  { id: "A3", scene: "close-up 45-degree angle of a laptop screen, abstract AI assistant UI, background softly blurred (no readable text)" },
  { id: "A4", scene: "top-down shot: laptop on desk with notebook and pen, generic SaaS UI visible (no readable text)" },

  // B — Human at work (без портретов)
  { id: "B1", scene: "hands typing on a keyboard, laptop screen shows generic AI assistant UI, face not visible" },
  { id: "B2", scene: "person wearing headphones working on a laptop, shot from behind/side, face not visible, generic AI UI on screen" },
  { id: "B3", scene: "one hand holding a coffee mug near a laptop, generic AI assistant UI on screen, cozy professional vibe" },
  { id: "B4", scene: "two coworkers blurred in background, one laptop in focus with generic AI UI, modern office vibe" },

  // C — Desk / Workspace
  { id: "C1", scene: "minimalist desk setup: laptop, small plant, daylight, premium clean look, generic AI UI on screen" },
  { id: "C2", scene: "night setup: warm desk lamp, laptop, keyboard, premium mood lighting, generic AI UI on screen" },
  { id: "C3", scene: "creative desk: laptop plus tablet/stylus nearby, modern design vibe, generic AI UI on screen" },
  { id: "C4", scene: "startup desk: dual monitors, tidy cable management, modern office, generic AI UI on one screen" },

  // D — Abstract tech (НЕ серверная)
  { id: "D1", scene: "close-up of a modern monitor edge with abstract blurred UI glow, tech mood, shallow depth of field" },
  { id: "D2", scene: "glass reflection of a generic UI on a laptop screen, realistic premium look, soft bokeh background" },
  { id: "D3", scene: "macro detail: keyboard/trackpad with subtle screen glow, abstract UI shapes reflected, realistic photo" },
  { id: "D4", scene: "dark tech mood: device glow from laptop/phone, abstract UI shapes, no readable text, premium lighting" },

  // E — Mobile usage
  { id: "E1", scene: "smartphone in hand showing generic AI assistant app UI (no readable text), modern lifestyle photo" },
  { id: "E2", scene: "smartphone on desk next to laptop (multi-device), both show abstract generic UI (no readable text)" },
  { id: "E3", scene: "on-the-go: hand holding smartphone, background cafe/city blurred, generic AI UI on screen (no readable text)" },
  { id: "E4", scene: "close-up swipe gesture on a phone screen with abstract AI UI, no readable text, premium lighting" },

  // F — Conceptual realism (редко, но красиво)
  { id: "F1", scene: "realistic office scene with subtle holographic-like UI overlay reflection (photoreal, not sci-fi), no readable text" },
  { id: "F2", scene: "notebook and laptop on desk, subtle digital overlay reflections, premium photoreal composition, no readable text" },
  { id: "F3", scene: "reflection of abstract UI on glasses or glass surface, premium photoreal look, no readable text" },
  { id: "F4", scene: "photoreal composite: floating UI cards effect but realistic lighting, no readable text, premium SaaS vibe" },
];

const lighting = [
  "daylight, soft natural colors",
  "warm indoor light, cozy premium look",
  "moody low-light, cinematic but realistic",
  "bright modern office light, clean and sharp",
];

const camera = [
  "35mm lens look, shallow depth of field",
  "50mm lens look, soft bokeh background",
  "slight top-down angle, clean composition",
  "45-degree angle, modern product photography",
];

const background = [
  "modern home office background softly blurred",
  "minimalist office background, neutral tones",
  "startup workspace background, clean and contemporary",
  "cafe-like background blurred, premium lifestyle vibe",
];

const chosen = pick(archetypes);
const styleBits = [pick(lighting), pick(camera), pick(background)];

const prompt = `
Photorealistic modern SaaS product hero image for a tool page about: "${title}".

Scene:
- ${chosen.scene}
- ${styleBits.join(", ")}

Style requirements:
- ultra realistic photography (NOT illustration, NOT cartoon, NOT vector)
- premium modern tech startup aesthetic
- natural colors, soft shadows, realistic reflections

Hard rules:
- NO logos
- NO brand names
- NO readable text (UI can be abstract shapes/lines only)
- NO watermark
- must look like real product photography used on SaaS landing pages
`;

const outDir = "/opt/utildesk-motia/content/images/tools";
fs.mkdirSync(outDir, { recursive: true });

// Сохраняем каждый вариант отдельным файлом (чтобы выбрать лучший)
const tag = seedTag();
const outFile = `${slug}__${chosen.id}__${tag}.png`;
const outPath = path.join(outDir, outFile);

async function main() {
  const resp = await client.images.generate({
    model: process.env.OPENAI_MODEL_IMAGE || "gpt-image-1",
    prompt,
    size: "1024x1024",
  });

  const b64 = resp.data?.[0]?.b64_json;
  if (!b64) throw new Error("images.generate не вернул b64_json");

  fs.writeFileSync(outPath, Buffer.from(b64, "base64"));
  console.log(JSON.stringify({ ok: true, archetype: chosen.id, outPath }, null, 2));
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
