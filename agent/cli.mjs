#!/usr/bin/env node
import { loadConfig } from "./config.mjs";
import { runLoop } from "./core.mjs";

async function main() {
  const cfg = loadConfig();
  const code = await runLoop(cfg);
  process.exit(code);
}

main().catch((err) => {
  console.error("ERROR:", err && err.message ? err.message : String(err));
  process.exit(1);
});
