/**
 * Polite HTTP for a listening tool.
 *
 * Everything this thing does is read someone else's public server, on a
 * schedule, unattended. That earns a few obligations: identify yourself in
 * the User-Agent with a way to be contacted, never hold more than one
 * connection per host, keep a minimum gap between requests to the same
 * host, obey Retry-After, and back off rather than hammer when a host is
 * unhappy. A listener that gets the operator's IP blocked has cost more
 * than it found.
 *
 * No dependencies: Node 18+ has fetch, and this has to run on a small VPS
 * without an npm install.
 */

const DEFAULT_UA =
  "founderfloor-leadwatch/1.0 (+https://founderfloor.net; ak@founderfloor.net)";

/** Last request time per host, so we can space them out. */
const lastHit = new Map();
/** In-flight promise per host, so requests to one host queue rather than race. */
const hostQueue = new Map();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class HttpError extends Error {
  constructor(status, url, body) {
    super(`HTTP ${status} for ${url}`);
    this.status = status;
    this.url = url;
    this.body = body;
  }
}

/**
 * Fetch with per-host serialisation, spacing, retries and a hard timeout.
 *
 * @param {string} url
 * @param {object} opts
 * @param {number} opts.minGapMs   minimum ms between requests to this host
 * @param {number} opts.timeoutMs
 * @param {number} opts.retries    on 429/5xx/network only — never on 4xx
 * @param {Record<string,string>} opts.headers
 * @param {string} opts.method
 * @param {string} opts.body
 */
export async function politeFetch(url, opts = {}) {
  const {
    minGapMs = 1200,
    timeoutMs = 20000,
    retries = 3,
    headers = {},
    method = "GET",
    body,
    userAgent = process.env.LEADWATCH_UA || DEFAULT_UA,
  } = opts;

  const host = new URL(url).host;
  // Chain onto whatever is already queued for this host.
  const prior = hostQueue.get(host) || Promise.resolve();
  let release;
  hostQueue.set(
    host,
    new Promise((r) => {
      release = r;
    }),
  );
  await prior;

  try {
    const since = Date.now() - (lastHit.get(host) || 0);
    if (since < minGapMs) await sleep(minGapMs - since);

    let attempt = 0;
    for (;;) {
      attempt++;
      lastHit.set(host, Date.now());

      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), timeoutMs);
      let res;
      try {
        res = await fetch(url, {
          method,
          body,
          signal: ac.signal,
          redirect: "follow",
          headers: { "user-agent": userAgent, accept: "*/*", ...headers },
        });
      } catch (err) {
        clearTimeout(timer);
        if (attempt > retries) throw err;
        await sleep(backoff(attempt));
        continue;
      }
      clearTimeout(timer);

      if (res.status === 429 || res.status >= 500) {
        if (attempt > retries) throw new HttpError(res.status, url, await safeText(res));
        // Retry-After wins over our own guess: the server knows better.
        const ra = Number(res.headers.get("retry-after"));
        await sleep(Number.isFinite(ra) && ra > 0 ? Math.min(ra * 1000, 60000) : backoff(attempt));
        continue;
      }
      if (!res.ok) throw new HttpError(res.status, url, await safeText(res));
      return res;
    }
  } finally {
    release();
    // Don't let the map grow forever across a long run.
    if (hostQueue.get(host) && hostQueue.size > 64) hostQueue.delete(host);
  }
}

export async function getJson(url, opts) {
  const res = await politeFetch(url, { ...opts, headers: { accept: "application/json", ...(opts?.headers || {}) } });
  return res.json();
}

export async function getText(url, opts) {
  const res = await politeFetch(url, opts);
  return res.text();
}

/** 1.5s, 3s, 6s, 12s … with a little jitter so retries don't sync up. */
function backoff(attempt) {
  const base = 1500 * Math.pow(2, attempt - 1);
  return Math.min(base, 30000) + Math.floor(Math.random() * 400);
}

async function safeText(res) {
  try {
    return (await res.text()).slice(0, 500);
  } catch {
    return "";
  }
}
