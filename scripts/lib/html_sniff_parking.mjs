/**
 * html_sniff_parking.mjs  (v1.0)
 *
 * Detect JS-redirect parking / lander pages that return HTTP 200 without
 * HTTP-level redirects.  Such pages bypass resolveFinalUrl() because the
 * parking redirect is done by JavaScript or <meta http-equiv="refresh">,
 * not by a 3xx status code.
 *
 * Design constraints:
 *   - Only fetches for text/html 2xx responses.
 *   - Reads at most MAX_BYTES (64 KiB); cancels the stream after that.
 *   - Hard timeout of TIMEOUT_MS per request.
 *   - Does NOT follow HTTP redirects (redirect:'manual') — we want the raw
 *     page body, not whatever the server eventually lands at.
 *
 * Exports:
 *   detectParkingInHtml(html) → result   ← pattern-match only (for unit tests)
 *   sniffHtmlParking(url)     → result   ← full HTTP + pattern-match
 *   MIN_CONFIDENCE            → 0.70
 *
 * Result shape:
 *   { detected:boolean, confidence:number, reason:string, evidence:string }
 *   evidence is capped at 120 chars and prefixed with [label] for readability.
 */

export const MIN_CONFIDENCE = 0.70;

const MAX_BYTES  = 65_536;   // 64 KiB — enough to capture <head> of any parking page
const TIMEOUT_MS = 6_000;

/**
 * Ordered list of patterns.  First match wins; label becomes part of evidence.
 *
 * Grouped by:
 *   js_lander*    — JS redirect targeting /lander (or /land) paths
 *   js_parking    — JS redirect targeting /parking paths
 *   js_for_sale   — JS redirect targeting /for-sale paths
 *   meta_*        — <meta http-equiv="refresh"> variants
 *   provider_*    — Known parking provider brand names in body
 *   text_*        — Explicit "for sale" copy
 */
const PATTERNS = [
  // ── JS redirects: window.location / location.href ──────────────────────────
  // These catch patterns like:  window.location.href="/lander"
  //                             window.location = '/lander'
  //                             location.href = "/lander"
  { re: /window\.location(?:\.href)?\s*=\s*["'`][^"'`]*\/lander/i,           label: 'js_lander'    },
  { re: /location\.href\s*=\s*["'`][^"'`]*\/lander/i,                         label: 'js_lander'    },
  { re: /top\.location(?:\.href)?\s*=\s*["'`][^"'`]*\/lander/i,               label: 'js_lander'    },
  { re: /document\.location(?:\.href)?\s*=\s*["'`][^"'`]*\/lander/i,          label: 'js_lander'    },

  { re: /window\.location(?:\.href)?\s*=\s*["'`][^"'`]*\/parking/i,           label: 'js_parking'   },
  { re: /location\.href\s*=\s*["'`][^"'`]*\/parking/i,                         label: 'js_parking'   },

  { re: /window\.location(?:\.href)?\s*=\s*["'`][^"'`]*\/for-sale/i,          label: 'js_for_sale'  },
  { re: /location\.href\s*=\s*["'`][^"'`]*\/for-sale/i,                        label: 'js_for_sale'  },

  // ── Meta refresh ───────────────────────────────────────────────────────────
  { re: /<meta[^>]+http-equiv\s*=\s*["']refresh["'][^>]*url\s*=\s*[^"']*\/lander/i,  label: 'meta_lander'  },
  { re: /<meta[^>]+http-equiv\s*=\s*["']refresh["'][^>]*url\s*=\s*[^"']*\/parking/i, label: 'meta_parking' },
  // content="0;url=/lander" (without space before url)
  { re: /<meta[^>]+http-equiv\s*=\s*["']refresh["'][^>]*;url=\/lander/i,             label: 'meta_lander'  },

  // ── Known parking provider names ───────────────────────────────────────────
  { re: /\bparkingcrew\b/i,          label: 'provider_parkingcrew'  },
  { re: /\bhugedomains\b/i,          label: 'provider_hugedomains'  },
  { re: /\bdynadot\b/i,              label: 'provider_dynadot'      },
  { re: /\bbodis\.com\b/i,           label: 'provider_bodis'        },
  { re: /\bsedo\.com\b/i,            label: 'provider_sedo'         },
  { re: /\bafternic\.com\b/i,        label: 'provider_afternic'     },
  { re: /\bnamecheap\s+parking\b/i,  label: 'provider_namecheap'   },

  // ── Explicit for-sale copy ─────────────────────────────────────────────────
  { re: /\bbuy\s+this\s+domain\b/i,                  label: 'text_buy_domain'        },
  { re: /\bdomain\s+(?:is\s+)?for\s+sale\b/i,        label: 'text_domain_for_sale'   },
  { re: /\bpurchase\s+this\s+domain\b/i,             label: 'text_purchase_domain'   },
];

// ─── Pattern-match on a pre-read HTML string ──────────────────────────────────
// Exported separately so unit tests can bypass HTTP entirely.

/**
 * @param {string} html
 * @returns {{ detected:boolean, confidence:number, reason:string, evidence:string }}
 */
export function detectParkingInHtml(html) {
  if (!html || typeof html !== 'string') {
    return { detected: false, confidence: 0, reason: '', evidence: '' };
  }

  for (const { re, label } of PATTERNS) {
    const m = html.match(re);
    if (m) {
      const evidence = `[${label}] ${m[0].trim()}`.slice(0, 120);
      return {
        detected:   true,
        confidence: 0.85,
        reason:     'js_parking_lander_detected',
        evidence,
      };
    }
  }

  return { detected: false, confidence: 0, reason: '', evidence: '' };
}

// ─── Full HTTP + pattern-match ────────────────────────────────────────────────

/**
 * Fetch `url`, read up to MAX_BYTES of the body (text/html only),
 * and run detectParkingInHtml on the result.
 *
 * @param {string} url  — final URL after HTTP redirects have been resolved
 * @returns {Promise<{ detected:boolean, confidence:number, reason:string, evidence:string }>}
 */
export async function sniffHtmlParking(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response;
  try {
    response = await fetch(url, {
      method:   'GET',
      redirect: 'manual',   // do not follow HTTP redirects — we want the raw page
      signal:   controller.signal,
    });
  } catch {
    return { detected: false, confidence: 0, reason: '', evidence: '' };
  } finally {
    clearTimeout(timer);
  }

  // Guard: only process 2xx text/html
  const ct = (response.headers.get('content-type') || '').toLowerCase();
  if (!ct.includes('text/html') || response.status < 200 || response.status >= 300) {
    try { response.body?.cancel?.(); } catch { /* ignore */ }
    return { detected: false, confidence: 0, reason: '', evidence: '' };
  }

  // Read limited body
  const decoder = new TextDecoder('utf-8', { fatal: false });
  let html      = '';
  let bytesRead = 0;

  try {
    const reader = response.body?.getReader?.();
    if (reader) {
      while (bytesRead < MAX_BYTES) {
        const { done, value } = await reader.read();
        if (done) break;
        bytesRead += value.byteLength;
        html += decoder.decode(value, { stream: true });
        if (bytesRead >= MAX_BYTES) {
          try { reader.cancel(); } catch { /* ignore */ }
          break;
        }
      }
      html += decoder.decode(); // flush remaining bytes
    }
  } catch {
    return { detected: false, confidence: 0, reason: '', evidence: '' };
  }

  return detectParkingInHtml(html);
}
