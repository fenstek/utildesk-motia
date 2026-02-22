import { isDeniedFinalHost, matchDeniedFinalUrlPattern } from './url_policy.mjs';

const PARKING_PROVIDER_HOSTS = new Set([
  'dan.com',
  'sedo.com',
  'afternic.com',
  'hugedomains.com',
  'parkingcrew.net',
  'bodis.com',
  'undeveloped.com',
  'sav.com',
  'buydomains.com',
  'domainmarket.com',
]);

const CONTENT_HUB_HOSTS = new Set([
  'medium.com',
  'substack.com',
  'dev.to',
  'hashnode.com',
  'blogspot.com',
  'wordpress.com',
  'tumblr.com',
]);

const CONTENT_HUB_PATH_RE = /\/(blog|news|article|articles|post|posts)\//i;

function hostFromUrl(url) {
  try {
    return new URL(String(url || '').trim()).hostname.replace(/^www\./, '').replace(/\.+$/, '').toLowerCase();
  } catch {
    return '';
  }
}

function pathFromUrl(url) {
  try {
    return new URL(String(url || '').trim()).pathname.toLowerCase();
  } catch {
    return '';
  }
}

function isParkingProviderHost(host) {
  const h = String(host || '').toLowerCase();
  if (!h) return false;
  for (const p of PARKING_PROVIDER_HOSTS) {
    if (h === p || h.endsWith(`.${p}`)) return true;
  }
  return false;
}

function isSuspiciousContentHub(host, path) {
  if (!host) return false;
  const normalizedPath = String(path || '').toLowerCase();
  for (const p of CONTENT_HUB_HOSTS) {
    if (host === p || host.endsWith(`.${p}`)) {
      if (normalizedPath === '/' || normalizedPath === '') return false;
      return true;
    }
  }
  return CONTENT_HUB_PATH_RE.test(normalizedPath);
}

/**
 * Classifies a resolved final URL into allow / deny / review.
 *
 * @param {object} args
 * @param {string} args.originalUrl
 * @param {string} args.finalUrl
 * @param {string} [args.slug]
 * @param {string} [args.title]
 * @returns {{verdict:'allow'|'deny'|'review', reason:string, reasons:string[], signals:Record<string,string|boolean>}}
 */
export function classifyFinalUrl({ originalUrl = '', finalUrl = '', slug = '', title = '' } = {}) {
  const candidateUrl = String(finalUrl || originalUrl || '').trim();
  const finalHost = hostFromUrl(candidateUrl);
  const finalPath = pathFromUrl(candidateUrl);
  const reasons = [];

  if (!candidateUrl || !finalHost) {
    return {
      verdict: 'review',
      reason: 'final_url_unresolved',
      reasons: ['final_url_unresolved'],
      signals: { finalHost, finalPath, slug: String(slug || ''), title: String(title || '') },
    };
  }

  if (isDeniedFinalHost(finalHost)) {
    reasons.push('redirected_to_denied_final_host');
  }

  if (isParkingProviderHost(finalHost)) {
    reasons.push('redirected_to_parking_or_domain_sale');
    reasons.push('final_host_parking_provider');
  }

  const deniedPatternReason = matchDeniedFinalUrlPattern(candidateUrl);
  if (deniedPatternReason) {
    reasons.push('redirected_to_parking_or_domain_sale');
    reasons.push(deniedPatternReason);
  }

  if (isSuspiciousContentHub(finalHost, finalPath)) {
    reasons.push('final_url_suspicious_content_hub');
  }

  const uniq = Array.from(new Set(reasons));
  if (uniq.some((r) => r === 'redirected_to_denied_final_host' || r === 'redirected_to_parking_or_domain_sale' || r === 'final_host_parking_provider' || r === 'final_url_matches_denied_pattern')) {
    return {
      verdict: 'deny',
      reason: uniq[0],
      reasons: uniq,
      signals: { finalHost, finalPath },
    };
  }

  if (uniq.length) {
    return {
      verdict: 'review',
      reason: uniq[0],
      reasons: uniq,
      signals: { finalHost, finalPath },
    };
  }

  return {
    verdict: 'allow',
    reason: '',
    reasons: [],
    signals: { finalHost, finalPath },
  };
}

