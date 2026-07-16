#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { assertLocalOnlyUrl } from "./lib/tool-runtime-live-budget.mjs";

const argv = process.argv.slice(2);
const valueFor = (flag, fallback = null) => {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : fallback;
};
const baseUrl = String(valueFor("--base-url", "http://127.0.0.1:8791")).replace(/\/+$/, "");
const distDir = resolve(valueFor("--dist", resolve(import.meta.dirname, "../dist")));
const slugs = JSON.parse(await readFile(resolve(valueFor("--slugs")), "utf8"));
const outPath = valueFor("--out");
assertLocalOnlyUrl(baseUrl, "machine parity base URL");

const jobs = slugs.flatMap((slug) => ["json", "markdown"].flatMap((kind) => ["de", "en"].map((locale) => {
  const prefix = locale === "en" ? "en/" : "";
  const relative = kind === "json" ? `${prefix}api/tools/${slug}.json` : `${prefix}markdown/tools/${slug}.md`;
  return { slug, locale, kind, relative };
})));
const normalizedJson = (body) => {
  const value = JSON.parse(body);
  if (typeof value?.data?.contentMarkdown === "string") value.data.contentMarkdown = value.data.contentMarkdown.trim();
  return value;
};
const results = [];
let cursor = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (cursor < jobs.length) {
    const job = jobs[cursor++];
    const [expected, response] = await Promise.all([
      readFile(join(distDir, job.relative), "utf8"),
      fetch(`${baseUrl}/${job.relative}`),
    ]);
    const actual = await response.text();
    const exact = actual === expected;
    let semantic = exact;
    let parseError = null;
    if (!exact && job.kind === "json") {
      try { semantic = JSON.stringify(normalizedJson(actual)) === JSON.stringify(normalizedJson(expected)); }
      catch (error) { parseError = error.message; }
    }
    const contentType = response.headers.get("content-type") || "";
    const headersOk = /\bnoindex\b/i.test(response.headers.get("x-robots-tag") || "")
      && (job.kind === "json" ? contentType.includes("application/json") : contentType.includes("text/markdown"));
    results.push({ ...job, status: response.status, exact, semantic, headersOk, parseError });
  }
}));
results.sort((left, right) => left.relative.localeCompare(right.relative));
const failures = results.filter((result) => result.status !== 200 || !result.semantic || !result.headersOk);
const exactDrift = results.filter((result) => !result.exact);
const report = { checkedAt: new Date().toISOString(), checked: results.length, slugs: slugs.length, failed: failures.length, exactDrift: exactDrift.length, failures, exactDriftRecords: exactDrift };
if (outPath) await writeFile(resolve(outPath), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ checked: report.checked, slugs: report.slugs, failed: report.failed, exactDrift: report.exactDrift }, null, 2));
if (failures.length) process.exitCode = 1;
