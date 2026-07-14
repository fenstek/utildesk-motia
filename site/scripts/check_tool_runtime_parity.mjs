#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const NOINDEX_PREVIEW = "noindex,nofollow,noarchive";
const comparableFields = [
  "title",
  "description",
  "canonical",
  "hreflang",
  "machineAlternates",
  "jsonLd",
  "headingCounts",
  "featureCounts",
];
const keyFor = (record) => `${record.locale}:${record.slug}`;
const stable = (value) => JSON.stringify(value);

export function compareToolRuntimeManifests(baseline, candidate, { preview = false, allowedRemovedUrls = new Set() } = {}) {
  const expected = new Map(baseline.records.map((record) => [keyFor(record), record]));
  const actual = new Map(candidate.records.map((record) => [keyFor(record), record]));
  const errors = [];
  for (const key of [...expected.keys()].sort()) {
    const left = expected.get(key);
    const right = actual.get(key);
    if (!right) { errors.push(`${key}: missing candidate record`); continue; }
    if (right.status !== left.status) errors.push(`${key}: status ${right.status} != ${left.status}`);
    for (const field of comparableFields) {
      if (stable(right.html[field]) !== stable(left.html[field])) errors.push(`${key}: html.${field} mismatch`);
    }
    for (const field of ["internalToolHrefs", "guideHrefs"]) {
      const expectedLinks = (left.html[field] ?? []).filter((href) => !allowedRemovedUrls.has(href));
      if (stable(right.html[field] ?? []) !== stable(expectedLinks)) errors.push(`${key}: html.${field} mismatch`);
    }
    const expectedRobots = preview ? NOINDEX_PREVIEW : left.html.robots;
    const expectedGooglebot = preview ? NOINDEX_PREVIEW : left.html.googlebot;
    if (right.html.robots !== expectedRobots) errors.push(`${key}: robots ${right.html.robots} != ${expectedRobots}`);
    if (right.html.googlebot !== expectedGooglebot) errors.push(`${key}: googlebot ${right.html.googlebot} != ${expectedGooglebot}`);
    if (right.viewport?.overflowX) errors.push(`${key}: horizontal overflow at ${candidate.viewport?.width ?? "unknown"}px`);
  }
  for (const key of [...actual.keys()].sort()) if (!expected.has(key)) errors.push(`${key}: unexpected candidate record`);
  if (candidate.activeSetParity === false) errors.push("candidate active DE/EN set differs");
  return { ok: errors.length === 0, compared: expected.size, errors };
}

const parseArgs = (argv) => {
  const result = { baseline: "", candidate: "", preview: false, allowBrokenResources: "" };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--baseline") result.baseline = argv[++index];
    else if (argv[index] === "--candidate") result.candidate = argv[++index];
    else if (argv[index] === "--preview") result.preview = true;
    else if (argv[index] === "--allow-broken-resources") result.allowBrokenResources = argv[++index];
    else throw new Error(`Unknown argument: ${argv[index]}`);
  }
  if (!result.baseline || !result.candidate) throw new Error("--baseline and --candidate are required");
  return result;
};

if (process.argv[1]?.endsWith("check_tool_runtime_parity.mjs")) {
  const options = parseArgs(process.argv.slice(2));
  const [baseline, candidate] = await Promise.all([
    readFile(resolve(options.baseline), "utf8").then(JSON.parse),
    readFile(resolve(options.candidate), "utf8").then(JSON.parse),
  ]);
  const allowedRemovedUrls = new Set();
  if (options.allowBrokenResources) {
    const report = JSON.parse(await readFile(resolve(options.allowBrokenResources), "utf8"));
    for (const failure of report.failures ?? []) {
      allowedRemovedUrls.add(failure.url);
      try { allowedRemovedUrls.add(new URL(failure.url).pathname); } catch {}
    }
  }
  const result = compareToolRuntimeManifests(baseline, candidate, { ...options, allowedRemovedUrls });
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}
