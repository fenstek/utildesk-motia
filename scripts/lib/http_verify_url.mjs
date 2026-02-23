/**
 * Lightweight URL verifier that follows redirects with strict limits.
 * Does not download large bodies; GET requests use byte range.
 */

function isRedirectStatus(status) {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
}

function toErrorMessage(err) {
  return String(err?.name || err?.message || err || 'request_error').slice(0, 120);
}

/**
 * @typedef {{ response: Response, fallbackTriggerCode: number }} RequestOnceResult
 * fallbackTriggerCode: the HEAD status that triggered a GET fallback (0 if no fallback).
 */

async function requestOnce(url, { timeoutMs }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  /** @type {number} */
  let fallbackTriggerCode = 0;

  try {
    let response = await fetch(url, {
      method: 'HEAD',
      redirect: 'manual',
      signal: controller.signal,
    });

    // GET fallback for method-not-allowed AND bot-protection rejections.
    //  - 405/501: server explicitly rejects HEAD method.
    //  - 403: Cloudflare Bot Fight Mode — blocks HEAD from datacenter IPs but may allow GET.
    //  - 429: rate-limiting — same reasoning.
    // We remember the HEAD code so the caller can distinguish "both HEAD+GET = 403"
    // (Cloudflare IP block) from a genuine unreachable URL.
    if (response.status === 405 || response.status === 501 ||
        response.status === 403 || response.status === 429) {
      fallbackTriggerCode = response.status;
      response = await fetch(url, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: { Range: 'bytes=0-0' },
      });
    }

    try {
      response.body?.cancel?.();
    } catch {
      // ignore body cancellation errors
    }

    return { response, fallbackTriggerCode };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Resolve final URL by following redirects manually.
 * @param {string} inputUrl
 * @param {{timeoutMs?:number,maxRedirects?:number}} options
 * @returns {Promise<{ok:boolean,finalUrl:string,status:number,error:string}>}
 */
export async function resolveFinalUrl(inputUrl, options = {}) {
  const timeoutMs = Math.max(1000, Number(options.timeoutMs || 3500));
  const maxRedirects = Math.max(0, Number(options.maxRedirects || 5));

  let current;
  try {
    current = new URL(String(inputUrl || '').trim()).toString();
  } catch {
    return { ok: false, finalUrl: '', status: 0, error: 'invalid_url' };
  }

  for (let i = 0; i <= maxRedirects; i += 1) {
    let result;
    try {
      result = await requestOnce(current, { timeoutMs });
    } catch (err) {
      return { ok: false, finalUrl: current, status: 0, error: toErrorMessage(err) };
    }

    const { response, fallbackTriggerCode } = result;
    const status = Number(response.status || 0);

    if (isRedirectStatus(status)) {
      const location = response.headers.get('location');
      if (!location) {
        return { ok: false, finalUrl: current, status, error: 'redirect_without_location' };
      }

      let next;
      try {
        next = new URL(location, current).toString();
      } catch {
        return { ok: false, finalUrl: current, status, error: 'invalid_redirect_url' };
      }

      if (i >= maxRedirects) {
        return { ok: false, finalUrl: next, status, error: 'max_redirects_exceeded' };
      }

      current = next;
      continue;
    }

    if (status >= 200 && status < 400) {
      return { ok: true, finalUrl: current, status, error: '' };
    }

    // Both HEAD and GET returned 403: Cloudflare Bot Fight Mode (datacenter IP block).
    // This is distinct from a genuinely unreachable/invalid URL.  The QC gate can
    // treat this specially — the URL still passed all static policy checks.
    if (fallbackTriggerCode === 403 && status === 403) {
      return { ok: false, finalUrl: current, status, error: 'cf_bot_protection' };
    }

    return { ok: false, finalUrl: current, status, error: `http_${status || 0}` };
  }

  return { ok: false, finalUrl: current, status: 0, error: 'verification_failed' };
}
