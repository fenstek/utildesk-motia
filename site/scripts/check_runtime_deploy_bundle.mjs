import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(here, "..");

export async function inspectRuntimeDeployBundle({
  configPath = path.join(siteRoot, "dist-runtime", "server", "wrangler.json"),
  readAssetFiles = (assetsDir) => readdir(assetsDir, { recursive: true }),
} = {}) {
  const config = JSON.parse(await readFile(configPath, "utf8"));
  if (config.main !== "entry.mjs") {
    throw new Error(`Runtime deploy config must target entry.mjs, received ${config.main || "<missing>"}.`);
  }
  if (config.assets?.binding !== "ASSETS" || !config.assets?.directory) {
    throw new Error("Runtime deploy config must include the generated ASSETS binding and directory.");
  }

  const assetsDir = path.resolve(path.dirname(configPath), config.assets.directory);
  const files = await readAssetFiles(assetsDir);
  const stylesheets = files.filter((file) => file.endsWith(".css"));
  const scripts = files.filter((file) => file.endsWith(".js"));
  const sharedStylesheets = stylesheets.filter((file) => {
    const filename = file.replaceAll("\\", "/").split("/").at(-1);
    return filename === "BaseLayout.css" || (filename.startsWith("BaseLayout.") && filename.endsWith(".css"));
  });
  if (sharedStylesheets.length !== 1) {
    throw new Error(
      `Runtime deploy bundle must contain exactly one shared stylesheet named BaseLayout, found ${sharedStylesheets.length}.`,
    );
  }
  if (scripts.length < 2) {
    throw new Error(`Runtime deploy bundle must contain the localized inventory scripts, found ${scripts.length}.`);
  }

  const sharedStylesheet = sharedStylesheets[0];
  const stylesheetPath = path.join(assetsDir, sharedStylesheet);
  const stylesheetStat = await stat(stylesheetPath);
  if (stylesheetStat.size < 100_000) {
    throw new Error(`Runtime BaseLayout stylesheet is unexpectedly small: ${stylesheetStat.size} bytes.`);
  }

  const normalizedStylesheets = stylesheets.map((file) => file.replaceAll("\\", "/")).sort();

  return {
    configPath,
    assetsDir,
    stylesheet: sharedStylesheet.replaceAll("\\", "/"),
    stylesheetBytes: stylesheetStat.size,
    scriptCount: scripts.length,
    stylesheets: normalizedStylesheets,
    stylesheetCount: normalizedStylesheets.length,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await inspectRuntimeDeployBundle();
  console.log(JSON.stringify({ ok: true, ...result }, null, 2));
}
