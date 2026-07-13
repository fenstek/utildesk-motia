import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const SITE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_DIR = resolve(SITE_DIR, "..");
const CONTENT_DIR = join(REPO_DIR, "content");

const CONTENT_SOURCES = [
  { kind: "tool", locale: "de", directory: join(CONTENT_DIR, "tools") },
  { kind: "tool", locale: "en", directory: join(CONTENT_DIR, "en", "tools") },
  { kind: "ratgeber", locale: "de", directory: join(CONTENT_DIR, "ratgeber") },
  { kind: "ratgeber", locale: "en", directory: join(CONTENT_DIR, "en", "ratgeber") },
];

const asString = (value) => (value == null ? "" : String(value).trim());

const firstParagraph = (markdown) =>
  String(markdown)
    .split(/\r?\n\s*\r?\n/)
    .map((part) => part.replace(/^#{1,6}\s+.*$/gm, "").replace(/[`*_]/g, "").trim())
    .find(Boolean) ?? "";

const serializableMetadata = (data) => JSON.parse(JSON.stringify(data ?? {}));

const toRuntimeEntry = ({ kind, locale, file, raw }) => {
  const parsed = matter(raw);
  const slug = asString(parsed.data.slug) || file.replace(/\.md$/i, "");
  const title = asString(parsed.data.title) || slug;
  const excerpt = asString(parsed.data.excerpt || parsed.data.description || parsed.data.summary) || firstParagraph(parsed.content);
  const sourceUpdatedAt = asString(parsed.data.updated || parsed.data.lastReviewed || parsed.data.last_reviewed);
  const sourcePublishedAt = asString(parsed.data.date || parsed.data.created_at || parsed.data.createdAt);

  return {
    contentKey: `${kind}:${locale}:${slug}`,
    kind,
    locale,
    slug,
    title,
    excerpt,
    metadata: serializableMetadata(parsed.data),
    markdown: parsed.content.trim(),
    sourceHash: createHash("sha256").update(raw).digest("hex"),
    sourcePublishedAt: sourcePublishedAt || null,
    sourceUpdatedAt: sourceUpdatedAt || sourcePublishedAt || null,
  };
};

export async function listRuntimeEntries({ kind, locale } = {}) {
  const selectedSources = CONTENT_SOURCES.filter(
    (source) => (!kind || source.kind === kind) && (!locale || source.locale === locale),
  );

  const groups = await Promise.all(
    selectedSources.map(async (source) => {
      const files = (await readdir(source.directory))
        .filter((file) => file.endsWith(".md") && !file.startsWith("_"))
        .sort((left, right) => left.localeCompare(right));
      return Promise.all(
        files.map(async (file) =>
          toRuntimeEntry({
            ...source,
            file,
            raw: await readFile(join(source.directory, file), "utf8"),
          }),
        ),
      );
    }),
  );

  return groups.flat().sort((left, right) => left.contentKey.localeCompare(right.contentKey));
}

const quoteSql = (value) => {
  if (value == null) return "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
};

export function buildEntryUpsertSql(entry) {
  const metadataJson = JSON.stringify(entry.metadata);
  const columns = [
    "content_key",
    "kind",
    "locale",
    "slug",
    "title",
    "excerpt",
    "metadata_json",
    "markdown",
    "source_hash",
    "source_published_at",
    "source_updated_at",
  ];
  const values = [
    entry.contentKey,
    entry.kind,
    entry.locale,
    entry.slug,
    entry.title,
    entry.excerpt,
    metadataJson,
    entry.markdown,
    entry.sourceHash,
    entry.sourcePublishedAt,
    entry.sourceUpdatedAt,
  ].map(quoteSql);

  return [
    `INSERT INTO content_entries (${columns.join(", ")})`,
    `VALUES (${values.join(", ")})`,
    "ON CONFLICT(kind, locale, slug) DO UPDATE SET",
    "  title = excluded.title,",
    "  excerpt = excluded.excerpt,",
    "  metadata_json = excluded.metadata_json,",
    "  markdown = excluded.markdown,",
    "  source_hash = excluded.source_hash,",
    "  source_published_at = excluded.source_published_at,",
    "  source_updated_at = excluded.source_updated_at,",
    "  revision = CASE WHEN content_entries.source_hash <> excluded.source_hash THEN content_entries.revision + 1 ELSE content_entries.revision END,",
    "  synced_at = CURRENT_TIMESTAMP",
    "WHERE content_entries.source_hash <> excluded.source_hash;",
    "",
  ].join("\n");
}

export const RUNTIME_PATHS = { SITE_DIR, REPO_DIR, CONTENT_DIR };
