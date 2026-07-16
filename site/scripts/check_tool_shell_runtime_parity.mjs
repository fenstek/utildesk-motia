#!/usr/bin/env node
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { inspectToolHtml } from "./capture_tool_runtime_baseline.mjs";
import { assertLocalOnlyUrl } from "./lib/tool-runtime-live-budget.mjs";

const argv = process.argv.slice(2);
const valueFor = (flag, fallback) => {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : fallback;
};
const baseUrl = String(valueFor("--base-url", "http://127.0.0.1:8791")).replace(/\/+$/, "");
const distDir = resolve(valueFor("--dist", resolve(import.meta.dirname, "../dist")));
const outPath = valueFor("--out", null);
const concurrency = Number.parseInt(valueFor("--concurrency", "1"), 10);
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 4) {
  throw new Error("--concurrency must be an integer between 1 and 4");
}
assertLocalOnlyUrl(baseUrl, "tool shell parity base URL");

const directorySlugs = async (path) => (await readdir(path, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
const [categories, englishCategories, tags, englishTags] = await Promise.all([
  directorySlugs(join(distDir, "category")),
  directorySlugs(join(distDir, "en", "category")),
  directorySlugs(join(distDir, "tools", "tag")),
  directorySlugs(join(distDir, "en", "tools", "tag")),
]);
const paths = ["/", "/en/", "/tools/", "/en/tools/", "/category/", "/en/category/"]
  .concat(categories.map((slug) => `/category/${slug}/`))
  .concat(englishCategories.map((slug) => `/en/category/${slug}/`))
  .concat(tags.map((slug) => `/tools/tag/${slug}/`))
  .concat(englishTags.map((slug) => `/en/tools/tag/${slug}/`));

const results = [];
let cursor = 0;
await Promise.all(Array.from({ length: concurrency }, async () => {
  while (cursor < paths.length) {
    const position = cursor++;
    const path = paths[position];
    if (position % 25 === 0) console.error(`starting ${position + 1}/${paths.length}: ${path}`);
    const staticPath = join(distDir, path.replace(/^\//, ""), "index.html");
    const [expectedHtml, response] = await Promise.all([readFile(staticPath, "utf8"), fetch(`${baseUrl}${path}`)]);
    const actualHtml = await response.text();
    const expected = inspectToolHtml(expectedHtml);
    const actual = inspectToolHtml(actualHtml);
    const equal = response.status === 200 && JSON.stringify(actual) === JSON.stringify(expected);
    results.push({ path, status: response.status, equal, expected, actual });
    if ((position + 1) % 25 === 0 || position + 1 === paths.length) {
      console.error(`checked ${position + 1}/${paths.length} shell routes`);
    }
  }
}));
results.sort((left, right) => left.path.localeCompare(right.path));
const failures = results.filter((result) => !result.equal);
const report = { checkedAt: new Date().toISOString(), baseUrl, checked: results.length, failed: failures.length, failures };
if (outPath) await writeFile(resolve(outPath), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ checked: report.checked, failed: report.failed, sampleFailures: failures.slice(0, 10).map(({ path, status }) => ({ path, status })) }, null, 2));
if (failures.length) process.exitCode = 1;
