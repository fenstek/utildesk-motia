/**
 * url_policy.mjs — Shared URL validation policy (v2.4)
 *
 * Used by:
 *   - sheet_ai_autogen_9_strict_v2.mjs (Gate 1)
 *   - audit_publish_preflight.mjs
 *   - audit_done_missing_official_url.mjs
 *
 * Key change v2.4 vs v2.3:
 *   - Hostname mismatch is a FLAG, NOT a block.
 *   - Wrong-entity detection (e.g. transformers.hasbro.com) IS a block.
 *
 * validateOfficialUrl(url, {slug, title}) returns:
 *   { ok: boolean, flags: string[], reason?: string }
 *
 * ok=false  → blocking condition (row → NEEDS_REVIEW)
 * ok=true   → URL is acceptable; flags may be non-empty (advisory only)
 */

import { classifyEntity, isWrongEntityDomain } from './entity_disambiguation.mjs';

// ─── Hard deny: hosts that are never official product URLs ──────────────────

export const DENY_HOSTS = new Set([
  // Encyclopedias / knowledge bases
  'wikipedia.org', 'wikidata.org', 'wikimedia.org',
  // Social networks
  'facebook.com', 'instagram.com', 'linkedin.com', 'tiktok.com',
  'youtube.com', 'youtu.be', 'twitter.com', 'x.com',
  // Entertainment databases
  'imdb.com',
  // Travel / booking
  'tripadvisor.com', 'booking.com', 'expedia.com',
  // App stores
  'apps.apple.com', 'play.google.com',
  // Search engines / redirects
  'duckduckgo.com', 'google.com', 'bing.com',
  // Generic blog platforms (not product home pages)
  'medium.com', 'substack.com', 'dev.to',
]);

// ─── Substring patterns that indicate non-product URLs ──────────────────────

const DENY_SUBSTR = [
  'culture',
  'mairie', 'stadt', 'gemeinde', 'municip', 'municipal', 'kommune', 'council',
  'gov', 'gouv', 'regierung',
  'comune', 'townof', 'cityof', 'ville', 'township',
  'visit', 'tourism', 'tourist', 'stadtinfo', 'city',
  '/search?', '/search/', '?q=', '&q=', 'utm_',
  // Non-product path indicators
  '/film', '/movie', '/stadt/', '/city/',
];

// ─── Hosts that are ALLOWED for specific entity classes ─────────────────────
// These bypass the hostname-mismatch advisory flag.

export const ALLOW_HOSTS_BY_CLASS = {
  library_or_model: new Set([
    'huggingface.co',
    'pytorch.org',
    'tensorflow.org',
    'github.com',
    'readthedocs.io',
    'paperswithcode.com',
    'arxiv.org',
  ]),
};

// ─── Docs-URL normalization ──────────────────────────────────────────────────

const DOCS_PATH_PREFIXES = ['/docs', '/documentation', '/developers', '/api'];

/**
 * Normalizes a docs-style URL to its origin (scheme+host only).
 * If the path starts with a docs prefix, strip to origin.
 */
export function normalizeDocsUrl(url) {
  if (!url) return url;
  try {
    const u = new URL(String(url).trim());
    const p = u.pathname.toLowerCase();
    if (DOCS_PATH_PREFIXES.some(prefix => p.startsWith(prefix))) {
      return u.origin + '/';
    }
    return url;
  } catch {
    return url;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Extracts normalized hostname (no www prefix, lowercase).
 */
export function normalizeHost(url) {
  try {
    return new URL(String(url || '').trim()).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

/**
 * Returns true if the URL is completely absent/empty.
 */
export function isMissingUrl(v) {
  const s = String(v || '').trim().toLowerCase();
  return !s || ['nan', 'null', 'undefined', 'none', '""', "''"].includes(s);
}

/**
 * Returns true if the host is in the DENY_HOSTS set.
 */
function isDeniedHost(host) {
  for (const d of DENY_HOSTS) {
    if (host === d || host.endsWith('.' + d)) return true;
  }
  return false;
}

/**
 * Returns true if the URL contains deny substrings in host+path.
 */
function hasDenySubstr(host, path, search) {
  const hp = host + path + search.toLowerCase();
  for (const sub of DENY_SUBSTR) {
    if (hp.includes(sub)) return true;
  }
  if (path.includes('/wiki/')) return true;
  return false;
}

/**
 * Returns true if host contains the slug token.
 * Handles short tokens (≤4 chars) strictly, longer tokens loosely.
 */
function hostContainsToken(host, token) {
  const h = String(host || '').toLowerCase();
  const t = String(token || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!h || !t) return false;
  const firstLabel = h.split('.')[0] || '';
  if (t.length <= 4) {
    return firstLabel === t || firstLabel.startsWith(`${t}-`) || firstLabel.endsWith(`-${t}`);
  }
  return h.replace(/[^a-z0-9]/g, '').includes(t);
}

// ─── Core validation ─────────────────────────────────────────────────────────

/**
 * Validates an official_url against the v2.4 policy.
 *
 * @param {string} url - The URL to validate
 * @param {object} opts
 * @param {string} [opts.slug] - Tool slug (used for token matching)
 * @param {string} [opts.title] - Tool title (used for entity disambiguation)
 * @returns {{ ok: boolean, flags: string[], reason?: string }}
 *
 * ok=false  → blocking: row must go to NEEDS_REVIEW
 * ok=true   → acceptable; flags are advisory only
 *
 * Blocking conditions:
 *   - URL is missing/empty
 *   - URL is not https
 *   - Host is in DENY_HOSTS
 *   - URL contains DENY_SUBSTR patterns
 *   - URL contains /wiki/ path
 *   - Wrong-entity domain detected (e.g. transformers.hasbro.com)
 *
 * Non-blocking flags (advisory only):
 *   - hostname_mismatch: host doesn't contain slug token
 */
export function validateOfficialUrl(url, { slug = '', title = '' } = {}) {
  const flags = [];

  // 1) Missing
  if (isMissingUrl(url)) {
    return { ok: false, flags, reason: 'missing_url' };
  }

  const raw = String(url).trim();

  // 2) Must be https
  if (!/^https:\/\//i.test(raw)) {
    return { ok: false, flags, reason: 'not_https' };
  }

  let host, path, search;
  try {
    const u = new URL(raw);
    host = u.hostname.replace(/^www\./, '').toLowerCase();
    path = u.pathname.toLowerCase();
    search = u.search.toLowerCase();
  } catch {
    return { ok: false, flags, reason: 'invalid_url' };
  }

  // 3) Denied host
  if (isDeniedHost(host)) {
    return { ok: false, flags, reason: `denied_host:${host}` };
  }

  // 4) Deny substring patterns
  if (hasDenySubstr(host, path, search)) {
    return { ok: false, flags, reason: 'suspicious_url_pattern' };
  }

  // 5) Wrong-entity detection (v2.4: hard block for clear wrong-entity domains)
  const entityClass = classifyEntity(slug, title);
  if (isWrongEntityDomain(host, slug, entityClass)) {
    return { ok: false, flags: ['wrong_entity'], reason: `wrong_entity_domain:${host}` };
  }

  // 6) Hostname token mismatch — NON-BLOCKING FLAG (v2.4 change from v2.3)
  // For library_or_model class, check ALLOW_HOSTS_BY_CLASS first.
  const token = (slug.split('-')[0] || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (token && host) {
    const allowedClass = entityClass && ALLOW_HOSTS_BY_CLASS[entityClass];
    const isAllowedByClass = allowedClass && allowedClass.has(host);

    if (!isAllowedByClass && !hostContainsToken(host, token)) {
      // Only add flag — does NOT set ok=false
      flags.push('hostname_mismatch');
    }
  }

  return { ok: true, flags };
}
