import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const runtimeDir = join(siteDir, "runtime-src");
const outputPath = join(runtimeDir, "generated", "cacheVersion.ts");
const sourceRoots = [runtimeDir, join(siteDir, "shared"), join(siteDir, "src")];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return walk(path);
      if (path === outputPath) return [];
      return [path];
    }),
  );
  return files.flat();
}

const sourceFiles = (await Promise.all(sourceRoots.map(walk))).flat().sort();
const hash = createHash("sha256");
for (const file of sourceFiles) {
  hash.update(relative(siteDir, file));
  hash.update(await readFile(file));
}

const version = `runtime-${hash.digest("hex").slice(0, 16)}`;
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  `// Generated from runtime renderer sources. Do not edit manually.\nexport const RENDERER_CACHE_VERSION = "${version}";\n`,
  "utf8",
);
console.log(`Runtime renderer cache version: ${version}`);
