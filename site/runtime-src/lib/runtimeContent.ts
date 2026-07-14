import { env } from "cloudflare:workers";

export type RuntimeContentKind = "tool" | "ratgeber";
export type RuntimeLocale = "de" | "en";

export interface RuntimeContentEntry {
  kind: RuntimeContentKind;
  locale: RuntimeLocale;
  slug: string;
  title: string;
  excerpt: string;
  metadata: Record<string, unknown>;
  markdown: string;
  sourceHash: string;
  revision: number;
  sourcePublishedAt: string | null;
  sourceUpdatedAt: string | null;
  isActive: boolean;
  routeState: "active" | "redirect" | "disabled" | "tombstone";
  canonicalPath: string;
  robotsPolicy: string;
  googlebotPolicy: string | null;
  editorialReviewed: boolean;
  illustrationPath: string | null;
  sourceCommit: string | null;
  deletedAt: string | null;
  category: string | null;
  priceModel: string | null;
  popularity: number;
}

type RuntimeContentRow = {
  kind: RuntimeContentKind;
  locale: RuntimeLocale;
  slug: string;
  title: string;
  excerpt: string;
  metadata_json: string;
  markdown: string;
  source_hash: string;
  revision: number;
  source_published_at: string | null;
  source_updated_at: string | null;
  is_active: number;
  route_state: "active" | "redirect" | "disabled" | "tombstone";
  canonical_path: string;
  robots_policy: string;
  googlebot_policy: string | null;
  editorial_reviewed: number;
  illustration_path: string | null;
  source_commit: string | null;
  deleted_at: string | null;
  category: string | null;
  price_model: string | null;
  popularity: number;
};

type RuntimeDatabase = {
  prepare(query: string): {
    bind(...values: unknown[]): {
      first<T>(): Promise<T | null>;
      all<T>(): Promise<{ results: T[] }>;
    };
  };
};

const database = () => (env as unknown as { UTILDESK_CONTENT: RuntimeDatabase }).UTILDESK_CONTENT;

function parseMetadata(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export async function getRuntimeContentEntry(
  kind: RuntimeContentKind,
  locale: RuntimeLocale,
  slug: string,
): Promise<RuntimeContentEntry | null> {
  const row = await database()
    .prepare(
      `SELECT kind, locale, slug, title, excerpt, metadata_json, markdown, source_hash, revision,
              source_published_at, source_updated_at, is_active, route_state, canonical_path,
              robots_policy, googlebot_policy, editorial_reviewed, illustration_path,
              source_commit, deleted_at, category, price_model, popularity
       FROM content_entries WHERE kind = ? AND locale = ? AND slug = ?`,
    )
    .bind(kind, locale, slug)
    .first<RuntimeContentRow>();

  if (!row) return null;
  return {
    kind: row.kind,
    locale: row.locale,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    metadata: parseMetadata(row.metadata_json),
    markdown: row.markdown,
    sourceHash: row.source_hash,
    revision: Number(row.revision ?? 1),
    sourcePublishedAt: row.source_published_at,
    sourceUpdatedAt: row.source_updated_at,
    isActive: Number(row.is_active) === 1,
    routeState: row.route_state,
    canonicalPath: row.canonical_path,
    robotsPolicy: row.robots_policy,
    googlebotPolicy: row.googlebot_policy,
    editorialReviewed: Number(row.editorial_reviewed) === 1,
    illustrationPath: row.illustration_path,
    sourceCommit: row.source_commit,
    deletedAt: row.deleted_at,
    category: row.category,
    priceModel: row.price_model,
    popularity: Number(row.popularity ?? 0),
  };
}

export async function listRuntimeContentEntries(
  kind: RuntimeContentKind,
  locale: RuntimeLocale,
): Promise<RuntimeContentEntry[]> {
  const result = await database()
    .prepare(
      `SELECT kind, locale, slug, title, excerpt, metadata_json, markdown, source_hash, revision,
              source_published_at, source_updated_at, is_active, route_state, canonical_path,
              robots_policy, googlebot_policy, editorial_reviewed, illustration_path,
              source_commit, deleted_at, category, price_model, popularity
       FROM content_entries
       WHERE kind = ? AND locale = ? AND is_active = 1 AND route_state = 'active'
       ORDER BY COALESCE(source_published_at, '') DESC, title ASC`,
    )
    .bind(kind, locale)
    .all<RuntimeContentRow>();

  return result.results.map((row) => ({
    kind: row.kind,
    locale: row.locale,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    metadata: parseMetadata(row.metadata_json),
    markdown: row.markdown,
    sourceHash: row.source_hash,
    revision: Number(row.revision ?? 1),
    sourcePublishedAt: row.source_published_at,
    sourceUpdatedAt: row.source_updated_at,
    isActive: Number(row.is_active) === 1,
    routeState: row.route_state,
    canonicalPath: row.canonical_path,
    robotsPolicy: row.robots_policy,
    googlebotPolicy: row.googlebot_policy,
    editorialReviewed: Number(row.editorial_reviewed) === 1,
    illustrationPath: row.illustration_path,
    sourceCommit: row.source_commit,
    deletedAt: row.deleted_at,
    category: row.category,
    priceModel: row.price_model,
    popularity: Number(row.popularity ?? 0),
  }));
}

type CacheVersionRow = { source_hash?: string; revision?: number; entries?: number; max_revision?: number };

export async function getRatgeberCacheVersion(pathname: string): Promise<string | null> {
  const match = pathname.match(/^\/(en\/)?ratgeber(?:\/([^/]+))?\/?$/);
  if (!match) return null;

  const locale: RuntimeLocale = match[1] ? "en" : "de";
  const slug = match[2];
  if (slug) {
    const row = await database()
    .prepare("SELECT source_hash, revision FROM content_entries WHERE kind = 'ratgeber' AND locale = ? AND slug = ? AND is_active = 1 AND route_state = 'active'")
      .bind(locale, slug)
      .first<CacheVersionRow>();
    return row?.source_hash ? `${row.revision ?? 1}-${row.source_hash}` : null;
  }

  const row = await database()
    .prepare("SELECT COUNT(*) AS entries, MAX(revision) AS max_revision FROM content_entries WHERE kind = 'ratgeber' AND locale = ? AND is_active = 1 AND route_state = 'active'")
    .bind(locale)
    .first<CacheVersionRow>();
  return row ? `${row.entries ?? 0}-${row.max_revision ?? 0}` : null;
}
