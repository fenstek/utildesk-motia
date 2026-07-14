#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const parseArgs = (argv) => {
  const result = { manifest: "", resolveBase: "", out: "" };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--manifest") result.manifest = argv[++index];
    else if (argv[index] === "--resolve-base") result.resolveBase = argv[++index];
    else if (argv[index] === "--out") result.out = argv[++index];
    else throw new Error(`Unknown argument: ${argv[index]}`);
  }
  if (!result.manifest || !result.resolveBase) throw new Error("--manifest and --resolve-base are required");
  return result;
};

const options = parseArgs(process.argv.slice(2));
const manifest = JSON.parse(await readFile(resolve(options.manifest), "utf8"));
const base = options.resolveBase.replace(/\/+$/, "");
const resources = new Map();
const add = (value, kind, owner) => {
  if (!value || value.startsWith("data:") || value.startsWith("#")) return;
  const url = /^https?:\/\//i.test(value) ? value : new URL(value, `${base}/`).toString();
  const current = resources.get(url) ?? { url, kinds: new Set(), owners: new Set() };
  current.kinds.add(kind);
  current.owners.add(owner);
  resources.set(url, current);
};
for (const record of manifest.records) {
  const owner = `${record.locale}:${record.slug}`;
  for (const href of record.html.internalToolHrefs ?? []) add(href, "tool-link", owner);
  for (const href of record.html.guideHrefs ?? []) add(href, "guide-link", owner);
  for (const alternate of record.html.machineAlternates ?? []) add(alternate.href, "machine-alternate", owner);
  for (const image of record.html.images ?? []) add(image, "image", owner);
}

const queue = [...resources.values()];
const results = [];
let cursor = 0;
const worker = async () => {
  while (cursor < queue.length) {
    const resource = queue[cursor++];
    let status = 0;
    let error = null;
    try {
      let response = await fetch(resource.url, { method: "HEAD", redirect: "manual" });
      if (response.status === 405) response = await fetch(resource.url, { method: "GET", redirect: "manual" });
      status = response.status;
    } catch (caught) { error = caught.message; }
    results.push({
      url: resource.url,
      kinds: [...resource.kinds].sort(),
      owners: [...resource.owners].sort(),
      status,
      ok: status >= 200 && status < 400,
      error,
    });
  }
};
await Promise.all(Array.from({ length: Math.min(8, queue.length || 1) }, worker));
results.sort((left, right) => left.url.localeCompare(right.url));
const failures = results.filter((result) => !result.ok);
const report = { checkedAt: new Date().toISOString(), resolveBase: base, checked: results.length, failed: failures.length, failures, results };
if (options.out) await writeFile(resolve(options.out), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ checked: report.checked, failed: report.failed, failures: failures.slice(0, 20) }, null, 2));
if (failures.length) process.exitCode = 1;
