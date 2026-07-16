import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(here, "..");

export async function inspectRuntimeDeployBundle({
  configPath = path.join(siteRoot, "dist-runtime", "server", "wrangler.json"),
} = {}) {
  const config = JSON.parse(await readFile(configPath, "utf8"));
  if (config.main !== "entry.mjs") {
    throw new Error(`Runtime deploy config must target entry.mjs, received ${config.main || "<missing>"}.`);
  }
  if (config.assets?.binding !== "ASSETS" || !config.assets?.directory) {
    throw new Error("Runtime deploy config must include the generated ASSETS binding and directory.");
  }

  const assetsDir = path.resolve(path.dirname(configPath), config.assets.directory);
  const files = await readdir(assetsDir, { recursive: true });
  const stylesheets = files.filter((file) => file.endsWith(".css"));
  const scripts = files.filter((file) => file.endsWith(".js"));
  if (stylesheets.length !== 1) {
    throw new Error(`Runtime deploy bundle must contain exactly one shared stylesheet, found ${stylesheets.length}.`);
  }
  if (scripts.length < 2) {
    throw new Error(`Runtime deploy bundle must contain the localized inventory scripts, found ${scripts.length}.`);
  }

  const stylesheetPath = path.join(assetsDir, stylesheets[0]);
  const stylesheetStat = await stat(stylesheetPath);
  if (stylesheetStat.size < 100_000) {
    throw new Error(`Runtime stylesheet is unexpectedly small: ${stylesheetStat.size} bytes.`);
  }

  return {
    configPath,
    assetsDir,
    stylesheet: stylesheets[0].replaceAll("\\", "/"),
    stylesheetBytes: stylesheetStat.size,
    scriptCount: scripts.length,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await inspectRuntimeDeployBundle();
  console.log(JSON.stringify({ ok: true, ...result }, null, 2));
}
