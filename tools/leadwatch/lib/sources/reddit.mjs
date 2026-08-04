/**
 * Reddit, the awkward one.
 *
 * Reddit tightened access hard in 2023 and unauthenticated .json from a
 * datacenter IP is now usually 403 or 429 — which is exactly where a VPS
 * lives. So the preferred path is the official OAuth API with a registered
 * app, which is free for this volume and is Reddit asking to be used
 * properly rather than scraped.
 *
 *   1. https://www.reddit.com/prefs/apps -> "create app" -> type: script
 *   2. put the id and secret in REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET
 *   3. set a descriptive REDDIT_USER_AGENT that names you
 *
 * Without credentials it falls back to the public search RSS, which is more
 * tolerated than .json but still rate-limited, and says so rather than
 * pretending it worked.
 */

import { getJson, getText, politeFetch } from "../http.mjs";
import { parseFeed } from "./rss.mjs";

let token = null;
let tokenExpiry = 0;

async function getToken() {
  const id = process.env.REDDIT_CLIENT_ID;
  const secret = process.env.REDDIT_CLIENT_SECRET;
  if (!id || !secret) return null;
  if (token && Date.now() < tokenExpiry - 60_000) return token;

  const res = await politeFetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    // client_credentials is the right grant for a script that reads public
    // listings: no user context is needed, and none should be held.
    body: "grant_type=client_credentials",
    minGapMs: 2000,
    retries: 1,
    headers: {
      authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
      "content-type": "application/x-www-form-urlencoded",
    },
  }).catch((e) => {
    throw new Error(`reddit token request failed: ${e.message}`);
  });

  const body = await res.text().catch(() => "");
  let json;
  try {
    json = JSON.parse(body);
  } catch {
    throw new Error("reddit token response was not JSON (check credentials)");
  }
  if (!json.access_token) throw new Error(`reddit token missing: ${body.slice(0, 200)}`);
  token = json.access_token;
  tokenExpiry = Date.now() + (json.expires_in || 3600) * 1000;
  return token;
}

/**
 * @param {{query: string, subreddits: string[], sinceHours?: number, limit?: number}} opts
 */
export async function fetchReddit({ query, subreddits = [], sinceHours = 48, limit = 25 }) {
  const tok = await getTokenSafely();
  const out = [];
  const cutoff = Date.now() - sinceHours * 3.6e6;

  for (const sub of subreddits) {
    const items = tok
      ? await viaOauth(tok, sub, query, limit)
      : await viaRss(sub, query, limit);
    for (const it of items) {
      if (new Date(it.createdAt).getTime() < cutoff) continue;
      out.push(it);
    }
  }
  return out;
}

async function getTokenSafely() {
  try {
    return await getToken();
  } catch (e) {
    // A credential problem must not take the whole run down; the other
    // sources are still worth reading.
    console.warn(`[leadwatch] reddit oauth unavailable, falling back to rss: ${e.message}`);
    return null;
  }
}

async function viaOauth(tok, sub, query, limit) {
  const url =
    `https://oauth.reddit.com/r/${encodeURIComponent(sub)}/search` +
    `?q=${encodeURIComponent(query)}&restrict_sr=1&sort=new&t=week&limit=${Math.min(limit, 100)}`;
  const data = await getJson(url, {
    minGapMs: 1200,
    headers: { authorization: `Bearer ${tok}` },
  });
  return (data?.data?.children || []).map((c) => {
    const d = c.data || {};
    return {
      source: "reddit",
      id: d.id || d.name,
      channel: `r/${d.subreddit || sub}`,
      title: d.title || "",
      body: d.selftext || "",
      author: d.author || "",
      url: d.permalink ? `https://www.reddit.com${d.permalink}` : d.url || "",
      createdAt: new Date((d.created_utc || 0) * 1000).toISOString(),
    };
  });
}

async function viaRss(sub, query, limit) {
  const url =
    `https://www.reddit.com/r/${encodeURIComponent(sub)}/search.rss` +
    `?q=${encodeURIComponent(query)}&restrict_sr=1&sort=new&limit=${Math.min(limit, 100)}`;
  const xml = await getText(url, { minGapMs: 2500 });
  return parseFeed(xml).map((e) => ({
    source: "reddit",
    id: e.id || e.url,
    channel: `r/${sub}`,
    title: e.title,
    body: e.body,
    author: e.author,
    url: e.url,
    createdAt: e.createdAt,
  }));
}
