/**
 * Lightweight URL verifier that follows redirects with strict limits.
 * Does not download large bodies; GET requests use byte range.
 */

const DEFAULT_CONNECT_TIMEOUT_MS = 8000;
const DEFAULT_REQUEST_TIMEOUT_MS = 15000;
const DEFAULT_MAX_REDIRECTS = 6;

function isRedirectStatus(status) {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
}

function toErrorMessage(err) {
  return String(err?.name || err?.message || err || 'request_error').slice(0, 120);
}

function clampTimeout(value, fallback, min = 250) {
  return Math.max(min, Number(value || fallback) || fallback);
}

function createWatchdog(controller, ms, reason) {
  return setTimeout(() => controller.abort(new Error(reason)), ms);
}

async function fetchWithWatchdogs(url, init, { connectTimeoutMs, deadlineAt }) {
  const remainingMs = Math.max(0, deadlineAt - Date.now());
  if (remainingMs <= 0) {
    throw new Error('timeout');
  }

  const controller = new AbortController();
  const connectTimer = createWatchdog(controller, Math.min(connectTimeoutMs, remainingMs), 'connect_timeout');
  const requestTimer = createWatchdog(controller, remainingMs, 'timeout');

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    clearTimeout(connectTimer);
    return response;
  } catch (err) {
    if (err?.name === 'AbortError') {
      const message = String(controller.signal.reason?.message || controller.signal.reason || err?.message || 'timeout');
      throw new Error(message.includes('connect_timeout') ? 'timeout' : 'timeout');
    }
    throw err;
  } finally {
    clearTimeout(connectTimer);
    clearTimeout(requestTimer);
  }
}

/**
 * @typedef {{ response: Response, fallbackTriggerCode: number }} RequestOnceResult
 * fallbackTriggerCode: the HEAD status that triggered a GET fallback (0 if no fallback).
 */

async function requestOnce(url, { connectTimeoutMs, deadlineAt }) {
  /** @type {number} */
  let fallbackTriggerCode = 0;

  try {
    let response = await fetchWithWatchdogs(url, {
      method: 'HEAD',
      redirect: 'manual',
    }, {
      connectTimeoutMs,
      deadlineAt,
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
      response = await fetchWithWatchdogs(url, {
        method: 'GET',
        redirect: 'manual',
        headers: { Range: 'bytes=0-0' },
      }, {
        connectTimeoutMs,
        deadlineAt,
      });
    }

    try {
      response.body?.cancel?.();
    } catch {
      // ignore body cancellation errors
    }

    return { response, fallbackTriggerCode };
  } finally {
    // request-specific watchdogs are cleaned inside fetchWithWatchdogs
  }
}

/**
 * Resolve final URL by following redirects manually.
 * @param {string} inputUrl
 * @param {{connectTimeoutMs?:number,requestTimeoutMs?:number,maxRedirects?:number}} options
 * @returns {Promise<{ok:boolean,finalUrl:string,status:number,error:string}>}
 */
export async function resolveFinalUrl(inputUrl, options = {}) {
  const connectTimeoutMs = clampTimeout(options.connectTimeoutMs, DEFAULT_CONNECT_TIMEOUT_MS);
  const requestTimeoutMs = clampTimeout(options.requestTimeoutMs, DEFAULT_REQUEST_TIMEOUT_MS, 1000);
  const maxRedirects = Math.max(0, Number(options.maxRedirects || DEFAULT_MAX_REDIRECTS));
  const deadlineAt = Date.now() + requestTimeoutMs;

  let current;
  try {
    current = new URL(String(inputUrl || '').trim()).toString();
  } catch {
    return { ok: false, finalUrl: '', status: 0, error: 'invalid_url' };
  }

  for (let i = 0; i <= maxRedirects; i += 1) {
    if (Date.now() >= deadlineAt) {
      return { ok: false, finalUrl: current, status: 0, error: 'timeout' };
    }

    let result;
    try {
      result = await requestOnce(current, { connectTimeoutMs, deadlineAt });
    } catch (err) {
      const error = toErrorMessage(err);
      return { ok: false, finalUrl: current, status: 0, error: error.includes('timeout') ? 'timeout' : error };
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
