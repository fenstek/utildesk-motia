import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { listRuntimeEntries, RUNTIME_PATHS } from "./runtime-content.mjs";

const args = process.argv.slice(2);
const valueFor = (flag) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};
const kind = valueFor("--kind");
const locale = valueFor("--locale");
const outputPath = resolve(valueFor("--out") || join(RUNTIME_PATHS.SITE_DIR, ".runtime", "content.ndjson"));

if (kind && !["tool", "ratgeber"].includes(kind)) {
  throw new Error("--kind must be tool or ratgeber");
}
if (locale && !["de", "en"].includes(locale)) {
  throw new Error("--locale must be de or en");
}

const entries = await listRuntimeEntries({ kind, locale });
await mkdir(resolve(outputPath, ".."), { recursive: true });
await writeFile(outputPath, `${entries.map((entry) => JSON.stringify(entry)).join("\n")}\n`, "utf8");

const summary = entries.reduce((result, entry) => {
  const key = `${entry.kind}:${entry.locale}`;
  result[key] = (result[key] ?? 0) + 1;
  return result;
}, {});

console.log(JSON.stringify({ outputPath, entries: entries.length, summary }, null, 2));
