import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { getToolPublicState } from "../shared/toolPublicState.mjs";
import { createToolAddedAtRankMap, getToolSearchIndexDecision } from "../src/lib/searchIndexPolicy.mjs";
import { isCuratedToolEntry } from "../src/lib/toolQuality.mjs";

const SITE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_DIR = resolve(SITE_DIR, "..");
const CONTENT_DIR = join(REPO_DIR, "content");
const toolAddedAtManifest = JSON.parse(await readFile(join(SITE_DIR, "src", "data", "tool-added-at.json"), "utf8"));
const toolAddedAtRankMap = createToolAddedAtRankMap(toolAddedAtManifest);
const DEFAULT_ROBOTS = "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";

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

const findToolIllustration = (markdown) => {
  const figure = String(markdown).match(
    /<figure\b[^>]*class=["'][^"']*\btool-editorial-figure\b[^"']*["'][^>]*>[\s\S]*?<img\b[^>]*\bsrc=["']([^"']+)["']/i,
  );
  if (figure?.[1]) return figure[1].trim();
  const markdownImage = String(markdown).match(/!\[[^\]]*]\((\/images\/tools\/[^)\s]+)[^)]*\)/i);
  return markdownImage?.[1]?.trim() || null;
};

const toRuntimeEntry = ({ kind, locale, file, raw, primaryEntry = null }) => {
  const parsed = matter(raw);
  const slug = asString(parsed.data.slug) || file.replace(/\.md$/i, "");
  const title = asString(parsed.data.title) || slug;
  const excerpt = asString(parsed.data.excerpt || parsed.data.description || parsed.data.summary) || firstParagraph(parsed.content);
  const sourceUpdatedAt = asString(parsed.data.updated || parsed.data.lastReviewed || parsed.data.last_reviewed);
  const sourcePublishedAt = asString(parsed.data.date || parsed.data.created_at || parsed.data.createdAt);

  const basis = primaryEntry ?? { slug, data: parsed.data, content: parsed.content };
  const searchDecision = kind === "tool"
    ? getToolSearchIndexDecision(basis, { addedAtRank: toolAddedAtRankMap.get(slug) ?? 0 })
    : { robots: DEFAULT_ROBOTS, googlebotRobots: null };
  const canonicalPath = `${locale === "en" ? "/en" : ""}/${kind === "tool" ? "tools" : "ratgeber"}/${slug}/`;

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
    isActive: 1,
    routeState: "active",
    canonicalPath,
    robotsPolicy: searchDecision.robots,
    googlebotPolicy: searchDecision.googlebotRobots,
    editorialReviewed: kind === "tool" ? Number(isCuratedToolEntry(basis)) : 1,
    illustrationPath: kind === "tool" ? findToolIllustration(parsed.content) : null,
    sourceCommit: null,
    deletedAt: null,
    category: asString(parsed.data.category) || null,
    priceModel: asString(parsed.data.price_model) || null,
    popularity: Number.isFinite(Number(parsed.data.popularity)) ? Number(parsed.data.popularity) : 0,
  };
};

export async function listRuntimeEntries({ kind, locale } = {}) {
  const selectedSources = CONTENT_SOURCES.filter(
    (source) => (!kind || source.kind === kind) && (!locale || source.locale === locale),
  );

  let primaryToolSlugs = null;
  let primaryToolEntries = null;
  if (selectedSources.some((source) => source.kind === "tool" && source.locale === "en")) {
    const primarySource = CONTENT_SOURCES.find((source) => source.kind === "tool" && source.locale === "de");
    const primaryFiles = (await readdir(primarySource.directory)).filter((file) => file.endsWith(".md"));
    const primaryStates = await Promise.all(primaryFiles.map(async (file) => {
      const parsed = matter(await readFile(join(primarySource.directory, file), "utf8"));
      const state = getToolPublicState({ filename: file, data: parsed.data });
      return { state, entry: { slug: state.slug, data: parsed.data, content: parsed.content } };
    }));
    const publicPrimary = primaryStates.filter(({ state }) => state.isPublishable);
    primaryToolSlugs = new Set(publicPrimary.map(({ state }) => state.slug));
    primaryToolEntries = new Map(publicPrimary.map(({ state, entry }) => [state.slug, entry]));
  }

  const groups = await Promise.all(
    selectedSources.map(async (source) => {
      const files = (await readdir(source.directory))
        .filter((file) => file.endsWith(".md"))
        .sort((left, right) => left.localeCompare(right));
      const entries = await Promise.all(
        files.map(async (file) =>
          toRuntimeEntry({
            ...source,
            file,
            raw: await readFile(join(source.directory, file), "utf8"),
            primaryEntry: source.kind === "tool" && source.locale === "en"
              ? primaryToolEntries.get(file.replace(/\.md$/i, "")) ?? null
              : null,
          }),
        ),
      );
      return source.kind === "tool"
        ? entries.filter((entry, index) =>
            getToolPublicState({
              filename: files[index],
              slug: entry.slug,
              data: entry.metadata,
              primaryPublishable: source.locale === "en" ? primaryToolSlugs.has(entry.slug) : undefined,
            }).isPublishable,
          )
        : entries.filter((_entry, index) => !files[index].startsWith("_"));
    }),
  );

  return groups.flat().sort((left, right) => left.contentKey.localeCompare(right.contentKey));
}

const quoteSql = (value) => {
  if (value == null) return "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
};

export function buildEntryUpsertSql(entry) {
  const statement = buildEntryUpsertStatement(entry);
  const values = statement.params.map(quoteSql);
  let valueIndex = 0;
  return statement.sql.replace(/\?/g, () => values[valueIndex++]);
}

export function buildEntryUpsertStatement(entry) {
  return buildEntriesUpsertStatement([entry]);
}

const UPSERT_COLUMNS = [
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
    "is_active",
    "route_state",
    "canonical_path",
    "robots_policy",
    "googlebot_policy",
    "editorial_reviewed",
    "illustration_path",
    "source_commit",
    "deleted_at",
    "category",
    "price_model",
    "popularity",
];

const entryValues = (entry) => [
    entry.contentKey,
    entry.kind,
    entry.locale,
    entry.slug,
    entry.title,
    entry.excerpt,
    JSON.stringify(entry.metadata),
    entry.markdown,
    entry.sourceHash,
    entry.sourcePublishedAt,
    entry.sourceUpdatedAt,
    entry.isActive,
    entry.routeState,
    entry.canonicalPath,
    entry.robotsPolicy,
    entry.googlebotPolicy,
    entry.editorialReviewed,
    entry.illustrationPath,
    entry.sourceCommit,
    entry.deletedAt,
    entry.category,
    entry.priceModel,
    entry.popularity,
];

export function buildEntriesUpsertStatement(entries) {
  if (!Array.isArray(entries) || entries.length === 0 || entries.length > 4) {
    throw new Error("buildEntriesUpsertStatement expects 1-4 entries (D1 has a 100 bound-parameter limit)");
  }
  const values = entries.flatMap(entryValues);

  const sql = [
    `INSERT INTO content_entries (${UPSERT_COLUMNS.join(", ")})`,
    `VALUES ${entries.map(() => `(${UPSERT_COLUMNS.map(() => "?").join(", ")})`).join(", ")}`,
    "ON CONFLICT(kind, locale, slug) DO UPDATE SET",
    "  title = excluded.title,",
    "  excerpt = excluded.excerpt,",
    "  metadata_json = excluded.metadata_json,",
    "  markdown = excluded.markdown,",
    "  source_hash = excluded.source_hash,",
    "  source_published_at = excluded.source_published_at,",
    "  source_updated_at = excluded.source_updated_at,",
    "  is_active = excluded.is_active,",
    "  route_state = excluded.route_state,",
    "  canonical_path = excluded.canonical_path,",
    "  robots_policy = excluded.robots_policy,",
    "  googlebot_policy = excluded.googlebot_policy,",
    "  editorial_reviewed = excluded.editorial_reviewed,",
    "  illustration_path = excluded.illustration_path,",
    "  source_commit = excluded.source_commit,",
    "  deleted_at = excluded.deleted_at,",
    "  category = excluded.category,",
    "  price_model = excluded.price_model,",
    "  popularity = excluded.popularity,",
    "  revision = CASE WHEN content_entries.source_hash <> excluded.source_hash OR content_entries.is_active <> excluded.is_active OR content_entries.route_state <> excluded.route_state THEN content_entries.revision + 1 ELSE content_entries.revision END,",
    "  synced_at = CURRENT_TIMESTAMP",
    "WHERE content_entries.source_hash <> excluded.source_hash",
    "   OR content_entries.is_active <> excluded.is_active",
    "   OR content_entries.route_state <> excluded.route_state",
    "   OR content_entries.canonical_path <> excluded.canonical_path;",
  ].join("\n");
  return { sql, params: values };
}

export const RUNTIME_PATHS = { SITE_DIR, REPO_DIR, CONTENT_DIR };
