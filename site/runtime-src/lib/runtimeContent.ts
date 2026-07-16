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
  redirectTargetPath: string | null;
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
  redirect_target_path: string | null;
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

async function inheritMissingEnglishToolMetadata(
  kind: RuntimeContentKind,
  locale: RuntimeLocale,
  slug: string,
  metadata: Record<string, unknown>,
) {
  if (kind !== "tool" || locale !== "en" || Array.isArray(metadata.tags)) return metadata;
  const source = await database()
    .prepare("SELECT metadata_json FROM content_entries WHERE kind = 'tool' AND locale = 'de' AND slug = ? AND is_active = 1 AND route_state = 'active'")
    .bind(slug)
    .first<Pick<RuntimeContentRow, "metadata_json">>();
  const sourceMetadata = source ? parseMetadata(source.metadata_json) : {};
  return Array.isArray(sourceMetadata.tags) ? { ...metadata, tags: sourceMetadata.tags } : metadata;
}

export async function getRuntimeContentEntry(
  kind: RuntimeContentKind,
  locale: RuntimeLocale,
  slug: string,
): Promise<RuntimeContentEntry | null> {
  const row = await database()
    .prepare(
      `SELECT kind, locale, slug, title, excerpt, metadata_json, markdown, source_hash, revision,
              source_published_at, source_updated_at, is_active, route_state, canonical_path, redirect_target_path,
              robots_policy, googlebot_policy, editorial_reviewed, illustration_path,
              asset_key, asset_hash, source_commit, deleted_at, category, price_model, popularity
       FROM content_entries WHERE kind = ? AND locale = ? AND slug = ?`,
    )
    .bind(kind, locale, slug)
    .first<RuntimeContentRow>();

  if (!row) return null;
  const metadata = await inheritMissingEnglishToolMetadata(row.kind, row.locale, row.slug, parseMetadata(row.metadata_json));
  return {
    kind: row.kind,
    locale: row.locale,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    metadata,
    markdown: row.markdown,
    sourceHash: row.source_hash,
    revision: Number(row.revision ?? 1),
    sourcePublishedAt: row.source_published_at,
    sourceUpdatedAt: row.source_updated_at,
    isActive: Number(row.is_active) === 1,
    routeState: row.route_state,
    canonicalPath: row.canonical_path,
    redirectTargetPath: row.redirect_target_path,
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
              source_published_at, source_updated_at, is_active, route_state, canonical_path, redirect_target_path,
              robots_policy, googlebot_policy, editorial_reviewed, illustration_path,
              asset_key, asset_hash, source_commit, deleted_at, category, price_model, popularity
       FROM content_entries
       WHERE kind = ? AND locale = ? AND is_active = 1 AND route_state = 'active'`,
    )
    .bind(kind, locale)
    .all<RuntimeContentRow>();

  const entries = result.results.map((row) => ({
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
    redirectTargetPath: row.redirect_target_path,
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
  return entries.sort((left, right) => {
    const leftTime = left.sourcePublishedAt ? Date.parse(left.sourcePublishedAt) : 0;
    const rightTime = right.sourcePublishedAt ? Date.parse(right.sourcePublishedAt) : 0;
    const safeLeftTime = Number.isFinite(leftTime) ? leftTime : 0;
    const safeRightTime = Number.isFinite(rightTime) ? rightTime : 0;
    if (safeRightTime !== safeLeftTime) return safeRightTime - safeLeftTime;
    return left.title.localeCompare(right.title, locale);
  });
}

const shellEntryCache = new Map<string, { revision: number; entries: Promise<RuntimeContentEntry[]> }>();

export async function listRuntimeShellEntries(
  kind: RuntimeContentKind,
  locale: RuntimeLocale,
): Promise<RuntimeContentEntry[]> {
  const collection = await getRuntimeCollectionRevision(kind, locale);
  const cacheKey = `${kind}:${locale}`;
  const cached = shellEntryCache.get(cacheKey);
  if (cached?.revision === collection.revision) return cached.entries;

  const entries = database()
    .prepare(
      `SELECT kind, locale, slug, title, excerpt, metadata_json, source_hash, revision,
              source_published_at, source_updated_at, illustration_path, asset_key, asset_hash,
              category, price_model, popularity
       FROM content_entries
       WHERE kind = ? AND locale = ? AND is_active = 1 AND route_state = 'active'`,
    )
    .bind(kind, locale)
    .all<RuntimeContentRow>()
    .then((result) => result.results.map((row) => ({
      kind: row.kind,
      locale: row.locale,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      metadata: parseMetadata(row.metadata_json),
      markdown: "",
      sourceHash: row.source_hash,
      revision: Number(row.revision ?? 1),
      sourcePublishedAt: row.source_published_at,
      sourceUpdatedAt: row.source_updated_at,
      isActive: true,
      routeState: "active" as const,
      canonicalPath: "",
      redirectTargetPath: null,
      robotsPolicy: "",
      googlebotPolicy: null,
      editorialReviewed: false,
      illustrationPath: row.illustration_path,
      assetKey: row.asset_key,
      assetHash: row.asset_hash,
      sourceCommit: null,
      deletedAt: null,
      category: row.category,
      priceModel: row.price_model,
      popularity: Number(row.popularity ?? 0),
    })).sort((left, right) => {
      const leftTime = left.sourcePublishedAt ? Date.parse(left.sourcePublishedAt) : 0;
      const rightTime = right.sourcePublishedAt ? Date.parse(right.sourcePublishedAt) : 0;
      const safeLeftTime = Number.isFinite(leftTime) ? leftTime : 0;
      const safeRightTime = Number.isFinite(rightTime) ? rightTime : 0;
      if (safeRightTime !== safeLeftTime) return safeRightTime - safeLeftTime;
      return left.title.localeCompare(right.title, locale);
    }));
  shellEntryCache.set(cacheKey, { revision: collection.revision, entries });
  entries.catch(() => {
    if (shellEntryCache.get(cacheKey)?.entries === entries) shellEntryCache.delete(cacheKey);
  });
  return entries;
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
    const exactTitleKeys = [...new Set(titles.flatMap((title) => {
      const stem = title.replace(/\s*\([^)]*\)\s*$/g, "").trim();
      return stem && stem !== title ? [title, stem] : [title];
    }))];
    const fuzzyTitleKeys = [...new Set(exactTitleKeys.map((title) => title
      .toLowerCase()
      .replace(/\([^)]*\)/g, " ")
      .replace(/\b(ai|tool|app|platform)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim()))].filter(Boolean);
    conditions.push(`(
      lower(title) IN (SELECT lower(value) FROM json_each(?))
      OR title_match_key IN (SELECT value FROM json_each(?))
    )`);
    values.push(JSON.stringify(exactTitleKeys), JSON.stringify(fuzzyTitleKeys));
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

type CacheVersionRow = { source_hash?: string; revision?: number; updated_at?: string };

export type RuntimeCollectionRevision = {
  kind: RuntimeContentKind;
  locale: RuntimeLocale;
  revision: number;
  updatedAt: string;
};

export async function getRuntimeCollectionRevision(
  kind: RuntimeContentKind,
  locale: RuntimeLocale,
): Promise<RuntimeCollectionRevision> {
  const row = await database()
    .prepare("SELECT revision, updated_at FROM runtime_collection_revisions WHERE kind = ? AND locale = ?")
    .bind(kind, locale)
    .first<CacheVersionRow>();
  if (!row) throw new Error(`Runtime collection revision missing for ${kind}:${locale}`);
  return { kind, locale, revision: Number(row.revision ?? 1), updatedAt: row.updated_at ?? new Date(0).toISOString() };
}

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
  const toolMachineDetail = pathname.match(/^\/(en\/)?(?:api|markdown)\/tools\/([^/]+)\.(?:json|md)$/);
  if (toolMachineDetail) return {
    kind: "tool" as const,
    locale: toolMachineDetail[1] ? "en" as const : "de" as const,
    slug: toolMachineDetail[2],
  };
  const toolMachineIndex = pathname.match(/^\/(en\/)?api\/tools\.json$/);
  if (toolMachineIndex) return {
    kind: "tool" as const,
    locale: toolMachineIndex[1] ? "en" as const : "de" as const,
    slug: null,
  };
  return null;
};

export async function getRuntimeCacheIdentity(pathname: string): Promise<RuntimeCacheIdentity | null> {
  const shell = pathname.match(/^\/(en\/)?(?:|tools\/?)$/);
  if (shell) {
    const locale: RuntimeLocale = shell[1] ? "en" : "de";
    const [tools, ratgeber] = await Promise.all([
      getRuntimeCollectionRevision("tool", locale),
      getRuntimeCollectionRevision("ratgeber", locale),
    ]);
    return {
      cluster: "tool",
      version: `shell-${tools.revision}-${ratgeber.revision}`,
      revision: tools.revision,
      sourceHash: null,
    };
  }
  const toolArchive = pathname.match(/^\/(en\/)?(?:category(?:\/[^/]+)?|tools\/tag\/[^/]+)\/?$/);
  if (toolArchive) {
    const locale: RuntimeLocale = toolArchive[1] ? "en" : "de";
    const collection = await getRuntimeCollectionRevision("tool", locale);
    return {
      cluster: "tool",
      version: `archive-${collection.revision}`,
      revision: collection.revision,
      sourceHash: null,
    };
  }
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
  const collection = await getRuntimeCollectionRevision(route.kind, route.locale);
  return {
    cluster: route.kind,
    version: `collection-${collection.revision}`,
    revision: collection.revision,
    sourceHash: null,
  };
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

  const collection = await getRuntimeCollectionRevision("ratgeber", locale);
  return `collection-${collection.revision}`;
}

export async function getRuntimeToolAsset(assetHash: string): Promise<{ key: string; fallbackPath: string } | null> {
  const row = await database()
    .prepare("SELECT asset_key, illustration_path FROM content_entries WHERE kind = 'tool' AND is_active = 1 AND route_state = 'active' AND asset_hash = ? AND asset_key IS NOT NULL AND illustration_path IS NOT NULL LIMIT 1")
    .bind(assetHash)
    .first<{ asset_key: string; illustration_path: string }>();
  return row ? { key: row.asset_key, fallbackPath: row.illustration_path } : null;
}
