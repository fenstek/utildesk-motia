#!/usr/bin/env node
import { readdirSync } from "node:fs";

const DENY_SLUGS = new Set(["bard", "tome", "slack"]); // keep in sync with sheet_ai_autogen_9_strict_v2.mjs DENY
const files = readdirSync(new URL("../content/tools/", import.meta.url));

const bad = [];
for (const f of files) {
  const m = f.match(/^(.+)\.md$/);
  if (!m) continue;
  const slug = m[1];
  if (DENY_SLUGS.has(slug)) bad.push(f);
}

if (bad.length) {
  console.error("[DENY-GUARD] Forbidden tool pages present:", bad.join(", "));
  process.exit(1);
}
console.log("[DENY-GUARD] OK");
