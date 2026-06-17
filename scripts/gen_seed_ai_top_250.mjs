import 'dotenv/config';
import OpenAI from 'openai';
import { writeFileSync } from 'node:fs';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const prompt = `
Return ONLY a JSON array of 250 REAL, widely-known AI tools/products/services (global).
Rules:
- Product names only (no pricing tiers like Plus/Pro/Enterprise/Team).
- Mix across categories: chat/LLM, coding, image, video, audio, research, agents, marketing, productivity.
- Prefer well-known brands and tools people have heard of.
- No generic categories, no duplicates, no variants.
Output: JSON array of strings.
`;

const r = await openai.chat.completions.create({
  model,
  temperature: 0.2,
  messages: [{ role: 'user', content: prompt.trim() }],
});

const text = r.choices?.[0]?.message?.content?.trim() || '[]';

let arr = [];
try { arr = JSON.parse(text); } catch { arr = []; }

arr = (Array.isArray(arr) ? arr : [])
  .map(x => String(x || '').trim())
  .filter(Boolean);

writeFileSync('scripts/seed_ai_top_250.json', JSON.stringify(arr, null, 2) + '\n', 'utf-8');

console.log(JSON.stringify({ ok: true, count: arr.length, file: 'scripts/seed_ai_top_250.json' }, null, 2));
