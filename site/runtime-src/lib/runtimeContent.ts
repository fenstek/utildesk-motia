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
  assetKey: string | null;
  assetHash: string | null;
  sourceCommit: string | null;
  deletedAt: string | null;
  category: string | null;
  priceModel: string | null;
  popularity: number;
}

export interface RuntimeToolContextEntry {
  slug: string;
  title: string;
  excerpt: string;
  metadata: Record<string, unknown>;
  category: string | null;
  priceModel: string | null;
}

export interface RuntimeGuideContextEntry {
  slug: string;
  title: string;
  excerpt: string;
  metadata: Record<string, unknown>;
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
  asset_key: string | null;
  asset_hash: string | null;
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
              asset_key, asset_hash, source_commit, deleted_at, category, price_model, popularity
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
    assetKey: row.asset_key,
    assetHash: row.asset_hash,
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
              asset_key, asset_hash, source_commit, deleted_at, category, price_model, popularity
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
    assetKey: row.asset_key,
    assetHash: row.asset_hash,
    sourceCommit: row.source_commit,
    deletedAt: row.deleted_at,
    category: row.category,
    priceModel: row.price_model,
    popularity: Number(row.popularity ?? 0),
  }));
}

export async function listRuntimeToolContext(
  locale: RuntimeLocale,
  requestedSlugs: string[],
  requestedTitles: string[],
): Promise<RuntimeToolContextEntry[]> {
  const slugs = [...new Set(requestedSlugs)]
    .filter((slug) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
    .slice(0, 48);
  const titles = [...new Set(requestedTitles.map((title) => String(title).trim()).filter(Boolean))].slice(0, 32);
  const conditions: string[] = [];
  const values: unknown[] = [locale];
  if (slugs.length) {
    conditions.push(`slug IN (${slugs.map(() => "?").join(", ")})`);
    values.push(...slugs);
  }
  if (titles.length) {
    const titleKeys = [...new Set(titles.flatMap((title) => {
      const stem = title.replace(/\s*\([^)]*\)\s*$/g, "").trim();
      return stem && stem !== title ? [title, stem] : [title];
    }))];
    conditions.push(`EXISTS (
      SELECT 1 FROM json_each(?) AS requested_title
      WHERE lower(title) = lower(requested_title.value)
         OR lower(trim(CASE
              WHEN instr(title, '(') > 0 THEN substr(title, 1, instr(title, '(') - 1)
              ELSE title
            END)) = lower(requested_title.value)
    )`);
    values.push(JSON.stringify(titleKeys));
  }
  if (!conditions.length) return [];
  const result = await database()
    .prepare(
      `SELECT slug, title, excerpt, metadata_json, category, price_model
       FROM content_entries
       WHERE kind = 'tool' AND locale = ? AND is_active = 1 AND route_state = 'active'
         AND (${conditions.join(" OR ")})
       ORDER BY title ASC`,
    )
    .bind(...values)
    .all<Pick<RuntimeContentRow, "slug" | "title" | "excerpt" | "metadata_json" | "category" | "price_model">>();
  return result.results.map((row) => ({
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    metadata: parseMetadata(row.metadata_json),
    category: row.category,
    priceModel: row.price_model,
  }));
}

export async function listRuntimeGuideBacklinkContext(
  locale: RuntimeLocale,
  toolSlug: string,
): Promise<RuntimeGuideContextEntry[]> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(toolSlug)) return [];
  const result = await database()
    .prepare(
      `SELECT slug, title, excerpt, metadata_json
       FROM content_entries
       WHERE kind = 'ratgeber' AND locale = ? AND is_active = 1 AND route_state = 'active'
         AND (instr(metadata_json, ?) > 0 OR instr(metadata_json, ?) > 0)
       ORDER BY slug ASC`,
    )
    .bind(locale, `/tools/${toolSlug}/`, `/en/tools/${toolSlug}/`)
    .all<Pick<RuntimeContentRow, "slug" | "title" | "excerpt" | "metadata_json">>();
  return result.results.map((row) => ({
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    metadata: parseMetadata(row.metadata_json),
  }));
}

type CacheVersionRow = { source_hash?: string; revision?: number; entries?: number; max_revision?: number };

export type RuntimeCacheIdentity = {
  cluster: "tool" | "ratgeber";
  version: string;
  revision: number | null;
  sourceHash: string | null;
};

const routeIdentity = (pathname: string) => {
  const preview = pathname.match(/^\/runtime-preview\/(de|en)\/(tools|ratgeber)\/([^/]+)\/?$/);
  if (preview) return {
    kind: preview[2] === "tools" ? "tool" as const : "ratgeber" as const,
    locale: preview[1] as RuntimeLocale,
    slug: preview[3],
  };
  const detail = pathname.match(/^\/(en\/)?(tools|ratgeber)\/([^/]+)\/?$/);
  if (detail) return {
    kind: detail[2] === "tools" ? "tool" as const : "ratgeber" as const,
    locale: detail[1] ? "en" as const : "de" as const,
    slug: detail[3],
  };
  const index = pathname.match(/^\/(en\/)?(tools|ratgeber)\/?$/);
  if (index) return {
    kind: index[2] === "tools" ? "tool" as const : "ratgeber" as const,
    locale: index[1] ? "en" as const : "de" as const,
    slug: null,
  };
  return null;
};

export async function getRuntimeCacheIdentity(pathname: string): Promise<RuntimeCacheIdentity | null> {
  const route = routeIdentity(pathname);
  if (!route) return null;
  if (route.slug) {
    const row = await database()
      .prepare("SELECT source_hash, revision FROM content_entries WHERE kind = ? AND locale = ? AND slug = ? AND is_active = 1 AND route_state = 'active'")
      .bind(route.kind, route.locale, route.slug)
      .first<CacheVersionRow>();
    return row?.source_hash ? {
      cluster: route.kind,
      version: `${row.revision ?? 1}-${row.source_hash}`,
      revision: Number(row.revision ?? 1),
      sourceHash: row.source_hash,
    } : null;
  }
  const row = await database()
    .prepare("SELECT COUNT(*) AS entries, MAX(revision) AS max_revision FROM content_entries WHERE kind = ? AND locale = ? AND is_active = 1 AND route_state = 'active'")
    .bind(route.kind, route.locale)
    .first<CacheVersionRow>();
  return row ? {
    cluster: route.kind,
    version: `${row.entries ?? 0}-${row.max_revision ?? 0}`,
    revision: Number(row.max_revision ?? 0),
    sourceHash: null,
  } : null;
}

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

export async function getRuntimeToolAsset(assetHash: string): Promise<{ key: string; fallbackPath: string } | null> {
  const row = await database()
    .prepare("SELECT asset_key, illustration_path FROM content_entries WHERE kind = 'tool' AND is_active = 1 AND route_state = 'active' AND asset_hash = ? AND asset_key IS NOT NULL AND illustration_path IS NOT NULL LIMIT 1")
    .bind(assetHash)
    .first<{ asset_key: string; illustration_path: string }>();
  return row ? { key: row.asset_key, fallbackPath: row.illustration_path } : null;
}
