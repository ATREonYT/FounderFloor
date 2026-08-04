/**
 * Reddit, via the official Data API and nothing else.
 *
 * There used to be an RSS fallback here for when no credentials were set. It
 * is gone on purpose: Reddit's User Agreement permits automated collection
 * *only* through the Data API, which makes .json and search.rss scraping a
 * terms breach rather than a polite degradation — and Reddit enforces at the
 * domain level, silently. Losing founderfloor.net sitewide to save a
 * five-minute app registration is a bad trade.
 *
 * So: no credentials, no Reddit. The source reports that plainly and the run
 * continues with the others.
 *
 *   1. https://www.reddit.com/prefs/apps -> "create app" -> type: script
 *   2. REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET
 *   3. optionally REDDIT_USERNAME, so the User-Agent can name you
 *
 * client_credentials rather than the password grant: reading public listings
 * needs no user context, and this way your account password is never on the
 * VPS.
 */

import { getJson, politeFetch } from "../http.mjs";

let token = null;
let tokenExpiry = 0;

/**
 * Reddit is specific about this and throttles generic agents: it wants
 * platform:app-id:version (by /u/username).
 */
function redditUA() {
  const who = process.env.REDDIT_USERNAME ? ` (by /u/${process.env.REDDIT_USERNAME})` : "";
  return `node:founderfloor-leadwatch:1.0${who}`;
}

export class RedditNotConfigured extends Error {
  constructor() {
    super(
      "Reddit needs a registered app: set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET " +
        "(https://www.reddit.com/prefs/apps, type: script). Scraping the public " +
        "endpoints instead is a terms breach and risks a domain-level block.",
    );
    this.name = "RedditNotConfigured";
  }
}

async function getToken() {
  const id = process.env.REDDIT_CLIENT_ID;
  const secret = process.env.REDDIT_CLIENT_SECRET;
  if (!id || !secret) throw new RedditNotConfigured();
  if (token && Date.now() < tokenExpiry - 60_000) return token;

  const res = await politeFetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    body: "grant_type=client_credentials",
    minGapMs: 2000,
    retries: 1,
    userAgent: redditUA(),
    headers: {
      authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
      "content-type": "application/x-www-form-urlencoded",
    },
  });

  let json;
  try {
    json = JSON.parse(res.text);
  } catch {
    throw new Error("reddit token response was not JSON — check the credentials");
  }
  // Never let the secret or the token itself reach a log line.
  if (!json.access_token) throw new Error("reddit returned no access_token — check the credentials");
  token = json.access_token;
  tokenExpiry = Date.now() + (json.expires_in || 3600) * 1000;
  return token;
}

/**
 * @param {{query: string, subreddits: string[], sinceHours?: number, limit?: number}} opts
 */
export async function fetchReddit({ query, subreddits = [], sinceHours = 48, limit = 25 }) {
  const tok = await getToken();
  const cutoff = Date.now() - sinceHours * 3.6e6;
  const out = [];

  const failures = [];
  for (const sub of subreddits) {
    const url =
      `https://oauth.reddit.com/r/${encodeURIComponent(sub)}/search` +
      `?q=${encodeURIComponent(query)}&restrict_sr=1&sort=new&t=${window(sinceHours)}` +
      `&limit=${Math.min(limit, 100)}`;

    let data;
    try {
      data = await getJson(url, {
        minGapMs: 1200,
        userAgent: redditUA(),
        headers: { authorization: `Bearer ${tok}` },
      });
    } catch (err) {
      // One renamed or gone-private subreddit must not take the other six
      // with it.
      failures.push(`${sub}: ${String(err.message || err).slice(0, 80)}`);
      continue;
    }

    for (const c of data?.data?.children || []) {
      const d = c.data || {};
      const createdAt = new Date((d.created_utc || 0) * 1000).toISOString();
      if (new Date(createdAt).getTime() < cutoff) continue;
      out.push({
        source: "reddit",
        id: d.id || d.name,
        channel: `r/${d.subreddit || sub}`,
        title: d.title || "",
        body: d.selftext || "",
        author: d.author || "",
        url: d.permalink ? `https://www.reddit.com${d.permalink}` : d.url || "",
        createdAt,
      });
    }
  }

  if (failures.length && failures.length === subreddits.length) {
    throw new Error(`every subreddit failed — ${failures.join("; ")}`);
  }
  if (failures.length) console.warn(`[leadwatch] reddit: skipped ${failures.join("; ")}`);
  return out;
}

/** Smallest Reddit search window that still covers sinceHours. */
function window(hours) {
  if (hours <= 24) return "day";
  if (hours <= 168) return "week";
  if (hours <= 744) return "month";
  return "year";
}
