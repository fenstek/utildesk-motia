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
    bind(...values: unknown[]): { first<T>(): Promise<T | null> };
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
