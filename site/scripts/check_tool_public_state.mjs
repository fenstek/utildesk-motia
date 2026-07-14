import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { getToolPublicState } from "../shared/toolPublicState.mjs";

const SITE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_DIR = resolve(SITE_DIR, "..");
const SOURCES = {
  de: join(REPO_DIR, "content", "tools"),
  en: join(REPO_DIR, "content", "en", "tools"),
};

async function scan(locale) {
  const files = (await readdir(SOURCES[locale])).filter((file) => file.endsWith(".md")).sort();
  const rows = await Promise.all(files.map(async (filename) => {
    const parsed = matter(await readFile(join(SOURCES[locale], filename), "utf8"));
    return { locale, ...getToolPublicState({ filename, data: parsed.data }) };
  }));

  const active = rows.filter((row) => row.isPublishable);
  const duplicates = [...active.reduce((map, row) => {
    map.set(row.slug, [...(map.get(row.slug) ?? []), row.filename]);
    return map;
  }, new Map())].filter(([, names]) => names.length > 1);
  if (duplicates.length) {
    throw new Error(`${locale} has duplicate public slugs: ${duplicates.map(([slug, names]) => `${slug} (${names.join(", ")})`).join("; ")}`);
  }

  const reasons = Object.fromEntries([...rows.reduce((map, row) => {
    map.set(row.reason, (map.get(row.reason) ?? 0) + 1);
    return map;
  }, new Map())].sort(([left], [right]) => left.localeCompare(right)));
  return { rows, active, reasons };
}

const [de, en] = await Promise.all([scan("de"), scan("en")]);
const deSet = new Set(de.active.map((row) => row.slug));
const suppressedEnWithoutDe = en.active.map((row) => row.slug).filter((slug) => !deSet.has(slug)).sort();
const enSet = new Set(en.active.map((row) => row.slug).filter((slug) => deSet.has(slug)));
const missingEn = [...deSet].filter((slug) => !enSet.has(slug)).sort();

const summary = {
  ok: missingEn.length === 0,
  active: { de: deSet.size, en: enSet.size },
  reasons: { de: de.reasons, en: en.reasons },
  missingEn,
  suppressedEnWithoutDe,
};

console.log(JSON.stringify(summary, null, 2));
if (!summary.ok) process.exitCode = 1;
