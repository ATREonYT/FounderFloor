/**
 * Polite HTTP for a listening tool.
 *
 * Everything this thing does is read someone else's public server, on a
 * schedule, unattended. That earns a few obligations: identify yourself in
 * the User-Agent with a way to be contacted, never hold more than one
 * connection per host, keep a minimum gap between requests to the same host,
 * obey Retry-After literally rather than negotiating with it, and stop
 * knocking on a host that has repeatedly refused. A listener that gets the
 * operator's IP blocked has cost more than it found.
 *
 * The body is read INSIDE this function, with the abort timer still armed
 * and a byte cap enforced as it streams. Reading it in the caller is the
 * classic version of this bug: the timeout is cleared once headers arrive,
 * so a server that stalls halfway through the body hangs the process with
 * nothing left to interrupt it, and an endless body eats the VPS.
 *
 * No dependencies: Node 18+ has fetch, and this has to run on a small VPS
 * without an npm install.
 */

const DEFAULT_UA =
  "founderfloor-leadwatch/1.0 (+https://founderfloor.net; ak@founderfloor.net)";

/** Nothing we read is legitimately large. An RSS feed or a search page is KBs. */
const MAX_BYTES = 8 * 1024 * 1024;
/** Refuse to sit in a retry loop longer than this for one request. */
const MAX_RETRY_WAIT_MS = 60_000;
/** Consecutive hard refusals before a host is left alone for the rest of the run. */
const STRIKES_BEFORE_BREAK = 3;

const lastHit = new Map();
const hostQueue = new Map();
const strikes = new Map();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class HttpError extends Error {
  constructor(status, url, body) {
    super(`HTTP ${status} for ${url}`);
    this.status = status;
    this.url = url;
    this.body = body;
  }
}

export class TooLarge extends Error {
  constructor(url, cap) {
    super(`response from ${url} exceeded ${cap} bytes`);
    this.url = url;
  }
}

export class HostCircuitOpen extends Error {
  constructor(host) {
    super(`skipping ${host}: it refused ${STRIKES_BEFORE_BREAK} times this run`);
    this.host = host;
  }
}

/** Reset between runs; exported for tests. */
export function resetCircuits() {
  strikes.clear();
}

/**
 * @returns {Promise<{status:number, headers:Headers, text:string, url:string}>}
 */
export async function politeFetch(url, opts = {}) {
  const {
    minGapMs = 1200,
    timeoutMs = 20000,
    retries = 3,
    headers = {},
    method = "GET",
    body,
    maxBytes = MAX_BYTES,
    userAgent = process.env.LEADWATCH_UA || DEFAULT_UA,
  } = opts;

  const host = new URL(url).host;
  if ((strikes.get(host) || 0) >= STRIKES_BEFORE_BREAK) throw new HostCircuitOpen(host);

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
      try {
        const res = await fetch(url, {
          method,
          body,
          signal: ac.signal,
          redirect: "follow",
          headers: { "user-agent": userAgent, accept: "*/*", ...headers },
        });

        if (res.status === 429 || res.status >= 500) {
          const wait = retryAfterMs(res.headers.get("retry-after"));
          // A host that asks for a long wait is asking us to go away for this
          // run. Honour the number instead of clamping it and knocking again.
          if (wait !== null && wait > MAX_RETRY_WAIT_MS) {
            bumpStrike(host);
            throw new HttpError(res.status, url, `Retry-After ${Math.round(wait / 1000)}s exceeds this run's budget`);
          }
          if (attempt > retries) {
            bumpStrike(host);
            throw new HttpError(res.status, url, (await readCapped(res, maxBytes, url)).slice(0, 300));
          }
          await sleep(wait ?? backoff(attempt));
          continue;
        }

        if (res.status === 401 || res.status === 403) bumpStrike(host);
        if (!res.ok) throw new HttpError(res.status, url, (await readCapped(res, maxBytes, url)).slice(0, 300));

        const declared = Number(res.headers.get("content-length"));
        if (Number.isFinite(declared) && declared > maxBytes) throw new TooLarge(url, maxBytes);

        // Body read here, timer still armed: a stalled body aborts.
        const text = await readCapped(res, maxBytes, url);
        strikes.delete(host);
        return { status: res.status, headers: res.headers, text, url };
      } catch (err) {
        if (err instanceof HttpError || err instanceof TooLarge) throw err;
        if (attempt > retries) throw err;
        await sleep(backoff(attempt));
      } finally {
        clearTimeout(timer);
      }
    }
  } finally {
    release();
    if (hostQueue.size > 64) hostQueue.delete(host);
  }
}

export async function getJson(url, opts) {
  const { text } = await politeFetch(url, {
    ...opts,
    headers: { accept: "application/json", ...(opts?.headers || {}) },
  });
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`response from ${url} was not JSON (first 120 chars: ${text.slice(0, 120)})`);
  }
}

export async function getText(url, opts) {
  return (await politeFetch(url, opts)).text;
}

/** Streams the body, aborting the moment it goes past the cap. */
async function readCapped(res, cap, url) {
  if (!res.body) return "";
  const dec = new TextDecoder();
  let out = "";
  let n = 0;
  for await (const chunk of res.body) {
    n += chunk.byteLength ?? chunk.length ?? 0;
    if (n > cap) throw new TooLarge(url, cap);
    out += dec.decode(chunk, { stream: true });
  }
  return out + dec.decode();
}

/** Retry-After is seconds OR an HTTP date. Returns ms, or null if absent/unparseable. */
function retryAfterMs(header) {
  if (!header) return null;
  const secs = Number(header);
  if (Number.isFinite(secs) && secs >= 0) return secs * 1000;
  const at = Date.parse(header);
  return Number.isFinite(at) ? Math.max(0, at - Date.now()) : null;
}

function bumpStrike(host) {
  strikes.set(host, (strikes.get(host) || 0) + 1);
}

/** 1.5s, 3s, 6s, 12s … with jitter so retries don't sync up. */
function backoff(attempt) {
  const base = 1500 * Math.pow(2, attempt - 1);
  return Math.min(base, 30000) + Math.floor(Math.random() * 400);
}
