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
  // Internal catalog domain (never an official tool URL)
  'tools.utildesk.de',
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
  // URL parking / redirect-proxy services (v2.5)
  'introvert.com',
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

// ─── Redirector / proxy query keys (v2.5 hard block) ────────────────────────
// If a URL contains these query parameter keys it is a redirect/tracking proxy,
// not the tool's own landing page (e.g. introvert.com/?domain=ghostwriter.io).

export const REDIRECTOR_QUERY_KEYS = new Set([
  'domain', 'redirect', 'target', 'url', 'dest', 'destination', 'r', 'u',
]);

// Hosts that are legitimately allowed to use these query params (e.g. OAuth).
const REDIRECTOR_HOST_ALLOWLIST = new Set([
  'accounts.google.com',
  'login.microsoftonline.com',
  'auth0.com',
  'oauth2.googleapis.com',
]);

/**
 * Returns true if the URL uses redirector/proxy query patterns.
 * These indicate the URL is not the tool's own homepage.
 *
 * @param {string} search - URL search string (e.g. "?domain=foo.com")
 * @param {string} host   - Normalized hostname (no www, lowercase)
 * @returns {boolean}
 */
export function hasRedirectorQuery(search, host) {
  if (!search || search === '?') return false;
  if (REDIRECTOR_HOST_ALLOWLIST.has(String(host || '').toLowerCase())) return false;
  try {
    const params = new URLSearchParams(search);
    for (const key of params.keys()) {
      if (REDIRECTOR_QUERY_KEYS.has(key.toLowerCase())) return true;
    }
  } catch {
    return false;
  }
  return false;
}

// ─── Too-generic root hosts (v2.5 hard block) ────────────────────────────────
// Some hosting platforms are valid for deep links but not for root/shallow URLs.
// e.g. huggingface.co/SingleOrg (1 segment) is just an org profile — too generic.
// A proper model/project page needs at least 2 segments: /<org>/<model>.

export const TOO_GENERIC_ROOT_HOSTS = new Map([
  // [hostname, minRequiredPathSegments]
  ['huggingface.co', 2], // need /<org>/<model>
  ['github.com',     2], // need /<org>/<repo>
  ['gitlab.com',     2], // need /<org>/<repo>
]);

/**
 * Returns true if the URL is too shallow for the known hosting platform.
 * e.g. huggingface.co/SomeOrg has only 1 path segment → not a product page.
 *
 * @param {string} host - Normalized hostname
 * @param {string} path - URL pathname (lowercase)
 * @returns {boolean}
 */
export function isTooGenericRoot(host, path) {
  const minSegs = TOO_GENERIC_ROOT_HOSTS.get(String(host || '').toLowerCase());
  if (minSegs === undefined) return false;
  const segments = String(path || '/').split('/').filter(Boolean).length;
  return segments < minSegs;
}

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
 * Returns true if the URL value counts as "missing":
 * null/undefined, empty string, placeholder tokens, dash, n/a.
 */
export function isMissingUrl(v) {
  if (v === null || v === undefined) return true;
  const s = String(v).trim().toLowerCase();
  return !s || ['nan', 'null', 'undefined', 'none', '""', "''", '-', 'n/a', 'n\\a', '#n/a'].includes(s);
}

// ─── DENY_HOSTS exact-only exceptions (v2.5) ─────────────────────────────────
// For these root domains subdomain matching is disabled so that legitimate
// product subdomains (gemini.google.com, cloud.google.com, etc.) are not
// blocked. play.google.com / apps.apple.com remain as explicit DENY_HOSTS.

const DENY_HOSTS_NO_SUBDOMAIN = new Set([
  'google.com', // root = search engine; subdomains can be real products
  'bing.com',   // same policy for consistency
]);

/**
 * Returns true if the host is in the DENY_HOSTS set.
 * For DENY_HOSTS_NO_SUBDOMAIN entries only exact match applies (no *.domain).
 */
function isDeniedHost(host) {
  for (const d of DENY_HOSTS) {
    if (host === d) return true;
    if (!DENY_HOSTS_NO_SUBDOMAIN.has(d) && host.endsWith('.' + d)) return true;
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
 *   - URL uses redirector/proxy query keys (domain=, url=, redirect=, ...)  [v2.5]
 *   - Host is in DENY_HOSTS (includes introvert.com)                        [v2.5]
 *   - URL is too-generic root on known hosting platform (HF/GitHub < 2 seg) [v2.5]
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

  // 3) Redirector / proxy query pattern (v2.5)
  if (hasRedirectorQuery(search, host)) {
    return { ok: false, flags, reason: 'redirector_query' };
  }

  // 4) Denied host
  if (isDeniedHost(host)) {
    return { ok: false, flags, reason: `denied_host:${host}` };
  }

  // 4b) Too-generic root on known hosting platforms (v2.5)
  if (isTooGenericRoot(host, path)) {
    return { ok: false, flags, reason: 'too_generic_root' };
  }

  // 5) Deny substring patterns
  if (hasDenySubstr(host, path, search)) {
    return { ok: false, flags, reason: 'suspicious_url_pattern' };
  }

  // 6) Wrong-entity detection (v2.4: hard block for clear wrong-entity domains)
  const entityClass = classifyEntity(slug, title);
  if (isWrongEntityDomain(host, slug, entityClass)) {
    return { ok: false, flags: ['wrong_entity'], reason: `wrong_entity_domain:${host}` };
  }

  // 7) Hostname token mismatch — NON-BLOCKING FLAG (v2.4 change from v2.3)
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
