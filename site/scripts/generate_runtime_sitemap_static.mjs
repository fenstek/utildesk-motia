import { readFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { RUNTIME_PATHS } from "./runtime-content.mjs";

const sourcePath = join(RUNTIME_PATHS.SITE_DIR, "dist", "sitemap.xml");
const outputDirectory = join(RUNTIME_PATHS.SITE_DIR, "runtime-src", "generated");
const outputPath = join(outputDirectory, "staticSitemapEntries.ts");
const detailPattern = /^https:\/\/tools\.utildesk\.de\/(?:en\/)?ratgeber\/[^/]+\/$/;

const xml = await readFile(sourcePath, "utf8");
const entries = [];
for (const match of xml.matchAll(/<url>([\s\S]*?)<\/url>/gi)) {
  const entry = `<url>${match[1]}</url>`;
  const location = match[1].match(/<loc>([\s\S]*?)<\/loc>/i)?.[1]?.trim();
  if (location && !detailPattern.test(location)) entries.push(entry);
}

if (!entries.length) {
  throw new Error("The static sitemap did not contain usable non-Ratgeber entries.");
}

await mkdir(outputDirectory, { recursive: true });
await writeFile(
  outputPath,
  `// Generated from the compact static sitemap. Do not edit manually.\nexport const STATIC_SITEMAP_ENTRIES = ${JSON.stringify(entries, null, 2)} as const;\n`,
  "utf8",
);
console.log(`Runtime sitemap base: ${entries.length} static entries -> ${outputPath}`);
