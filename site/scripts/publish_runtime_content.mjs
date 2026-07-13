import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { buildEntryUpsertSql, listRuntimeEntries, RUNTIME_PATHS } from "./runtime-content.mjs";

const args = process.argv.slice(2);
const valueFor = (flag) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};
const has = (flag) => args.includes(flag);
const kind = valueFor("--kind");
const locale = valueFor("--locale");
const slug = valueFor("--slug");
const publishAll = has("--all");
const database = valueFor("--database") || "utildesk-content-runtime-preview";
const configPath = valueFor("--config") || "wrangler.hybrid.jsonc";

if (!kind || !locale || (publishAll === Boolean(slug))) {
  throw new Error(
    "Usage: npm run publish:runtime -- --kind <tool|ratgeber> --locale <de|en> (--slug <slug> | --all) [--remote]",
  );
}
if (!["tool", "ratgeber"].includes(kind) || !["de", "en"].includes(locale)) {
  throw new Error("Expected --kind tool|ratgeber and --locale de|en");
}

const sourceEntries = await listRuntimeEntries({ kind, locale });
const entries = publishAll ? sourceEntries : sourceEntries.filter((candidate) => candidate.slug === slug);
if (!entries.length) {
  throw new Error(`No ${kind}:${locale}:${slug ?? "all"} source entries exist.`);
}

const outputDir = join(RUNTIME_PATHS.SITE_DIR, ".runtime", "upserts");
const sqlName = publishAll ? `${kind}-${locale}-all` : entries[0].contentKey.replace(/:/g, "-");
const sqlPath = join(outputDir, `${sqlName}.sql`);
await mkdir(outputDir, { recursive: true });
await writeFile(sqlPath, entries.map(buildEntryUpsertSql).join("\n"), "utf8");

if (!has("--remote")) {
  console.log(
    JSON.stringify(
      { prepared: true, entries: entries.map((entry) => entry.contentKey), sqlPath },
      null,
      2,
    ),
  );
  process.exit(0);
}

const wranglerEntrypoint = join(RUNTIME_PATHS.SITE_DIR, "node_modules", "wrangler", "bin", "wrangler.js");
const child = spawn(
  process.execPath,
  [wranglerEntrypoint, "d1", "execute", database, "--config", configPath, "--remote", "--file", sqlPath],
  { cwd: RUNTIME_PATHS.SITE_DIR, stdio: "inherit" },
);

child.once("exit", (code) => process.exit(code ?? 1));
