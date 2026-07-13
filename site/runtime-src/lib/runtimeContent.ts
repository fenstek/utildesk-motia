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
  revision: number;
  sourcePublishedAt: string | null;
  sourceUpdatedAt: string | null;
}

type RuntimeContentRow = {
  kind: RuntimeContentKind;
  locale: RuntimeLocale;
  slug: string;
  title: string;
  excerpt: string;
  metadata_json: string;
  markdown: string;
  revision: number;
  source_published_at: string | null;
  source_updated_at: string | null;
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
      `SELECT kind, locale, slug, title, excerpt, metadata_json, markdown, revision,
              source_published_at, source_updated_at
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
    revision: Number(row.revision ?? 1),
    sourcePublishedAt: row.source_published_at,
    sourceUpdatedAt: row.source_updated_at,
  };
}

export async function listRuntimeContentEntries(
  kind: RuntimeContentKind,
  locale: RuntimeLocale,
): Promise<RuntimeContentEntry[]> {
  const result = await database()
    .prepare(
      `SELECT kind, locale, slug, title, excerpt, metadata_json, markdown, revision,
              source_published_at, source_updated_at
       FROM content_entries
       WHERE kind = ? AND locale = ?
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
    revision: Number(row.revision ?? 1),
    sourcePublishedAt: row.source_published_at,
    sourceUpdatedAt: row.source_updated_at,
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
      .prepare("SELECT source_hash, revision FROM content_entries WHERE kind = 'ratgeber' AND locale = ? AND slug = ?")
      .bind(locale, slug)
      .first<CacheVersionRow>();
    return row?.source_hash ? `${row.revision ?? 1}-${row.source_hash}` : null;
  }

  const row = await database()
    .prepare("SELECT COUNT(*) AS entries, MAX(revision) AS max_revision FROM content_entries WHERE kind = 'ratgeber' AND locale = ?")
    .bind(locale)
    .first<CacheVersionRow>();
  return row ? `${row.entries ?? 0}-${row.max_revision ?? 0}` : null;
}
