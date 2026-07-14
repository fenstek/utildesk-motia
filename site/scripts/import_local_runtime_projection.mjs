#!/usr/bin/env node
import { buildEntriesUpsertStatement, listRuntimeEntries } from "./runtime-content.mjs";
import { gitReleaseState, loadToolRelease } from "./lib/tool-runtime-publisher.mjs";

const urlIndex = process.argv.indexOf("--url");
if (urlIndex < 0 || !process.argv[urlIndex + 1]) throw new Error("--url is required");
const baseUrl = process.argv[urlIndex + 1].replace(/\/+$/, "");
if (!/^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/.test(baseUrl)) throw new Error("Local importer refuses a non-localhost URL");

const releaseState = gitReleaseState();
const tools = await loadToolRelease(null, releaseState.commit);
const guides = (await Promise.all([
  listRuntimeEntries({ kind: "ratgeber", locale: "de" }),
  listRuntimeEntries({ kind: "ratgeber", locale: "en" }),
])).flat().map((entry) => ({ ...entry, sourceCommit: releaseState.commit }));
const entries = [...tools.entries, ...guides];
const statements = [];
for (let offset = 0; offset < entries.length; offset += 4) statements.push(buildEntriesUpsertStatement(entries.slice(offset, offset + 4)));

let batches = 0;
for (let offset = 0; offset < statements.length; offset += 20) {
  const response = await fetch(`${baseUrl}/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Utildesk-Local-Projection": "1" },
    body: JSON.stringify({ statements: statements.slice(offset, offset + 20) }),
  });
  if (!response.ok) throw new Error(`Local D1 batch ${batches + 1} failed (${response.status}): ${await response.text()}`);
  batches += 1;
  if (batches % 10 === 0 || offset + 20 >= statements.length) console.log(`imported batch ${batches}/${Math.ceil(statements.length / 20)}`);
}
const countsResponse = await fetch(`${baseUrl}/counts`);
if (!countsResponse.ok) throw new Error(`Local D1 count verification failed (${countsResponse.status})`);
console.log(JSON.stringify({
  sourceCommit: releaseState.commit,
  toolSlugs: tools.activeSlugs.size,
  toolLocaleEntries: tools.entries.length,
  ratgeberLocaleEntries: guides.length,
  statements: statements.length,
  batches,
  counts: await countsResponse.json(),
}, null, 2));
