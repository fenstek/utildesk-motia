import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(here, "..");
const sourcePath = path.join(siteRoot, "src", "styles", "ratgeber-editorial.css");
const targetPath = path.join(siteRoot, "dist", "runtime-ratgeber-detail.css");
const startMarker = "/* The D1 renderer intentionally uses its own semantic markup.";
const endMarker = "\nhtml[data-design=\"decision\"] .sheet-wrap > .akte-crumb {";

const source = await readFile(sourcePath, "utf8");
const start = source.indexOf(startMarker);
const end = source.indexOf(endMarker, start);

if (start === -1 || end === -1) {
  throw new Error("Could not extract the runtime Ratgeber fallback stylesheet.");
}

await mkdir(path.dirname(targetPath), { recursive: true });
await writeFile(targetPath, `${source.slice(start, end).trim()}\n`, "utf8");
console.log(`Runtime Ratgeber fallback stylesheet: ${targetPath}`);
