/**
 * Bluesky, via the AppView.
 *
 * HOST MATTERS. `public.api.bsky.app` is the cached front door and it has
 * been returning 403 for searchPosts since early 2025; `api.bsky.app` is the
 * same AppView without that cache layer and answers unauthenticated. The
 * handler is registered with `standardOptional` auth, so anonymous reads are
 * the design, not a loophole — the 403 is edge behaviour. Using the right
 * host is why this file needs no credentials at all.
 *
 * If that ever changes, the fix is a session against your own PDS
 * (bsky.social) with an App Password, and the self-test will tell you the
 * day it becomes necessary rather than the source quietly going quiet.
 *
 * Two smaller things the docs are firm about and are easy to get wrong:
 *
 *   - `record.createdAt` is written by the client and is spoofable. Order and
 *     age-filter on `indexedAt`, which the server stamps.
 *   - Handles change; DIDs do not. A permalink built from a handle rots, so
 *     these are built from the DID.
 */

import { getJson } from "../http.mjs";

const HOST = process.env.LEADWATCH_BSKY_HOST || "https://api.bsky.app";
const PATH = "/xrpc/app.bsky.feed.searchPosts";

/**
 * Accounts that ask not to be shown to logged-out viewers. Bluesky exposes
 * this as a self-applied label; honouring it is a condition of reading the
 * network without a session, and it costs one filter.
 */
const OPT_OUT = new Set(["!no-unauthenticated"]);

function optedOut(post) {
  const labels = [...(post?.labels || []), ...(post?.author?.labels || [])];
  return labels.some((l) => OPT_OUT.has(l?.val));
}

export async function fetchBluesky({ query, sinceHours = 48, limit = 25 }) {
  const url = `${HOST}${PATH}?q=${encodeURIComponent(query)}&limit=${Math.min(limit, 100)}&sort=latest`;
  const data = await getJson(url, { minGapMs: 1500 });

  const cutoff = Date.now() - sinceHours * 3.6e6;
  const out = [];
  for (const p of data?.posts || []) {
    if (optedOut(p)) continue;

    // indexedAt is the server's stamp; createdAt is whatever the client said.
    const stamped = p?.indexedAt || p?.record?.createdAt;
    if (stamped && new Date(stamped).getTime() < cutoff) continue;

    const did = p?.author?.did || "";
    const handle = p?.author?.handle || "";
    // at://did:plc:xxx/app.bsky.feed.post/<rkey>
    const rkey = String(p?.uri || "").split("/").pop();

    out.push({
      source: "bluesky",
      id: p?.uri || rkey,
      channel: "post",
      title: "",
      body: p?.record?.text || "",
      author: handle || did,
      // DID, not handle: a handle-based permalink breaks when they rename.
      url: did && rkey ? `https://bsky.app/profile/${did}/post/${rkey}` : "",
      createdAt: stamped || new Date().toISOString(),
    });
  }
  return out;
}
