/**
 * Bluesky, via the public AppView.
 *
 * public.api.bsky.app serves the read-only XRPC endpoints without a session,
 * which is what we want: this tool has no business holding anyone's account
 * credentials just to read public posts.
 *
 * If searchPosts starts requiring auth on the public AppView, the self-test
 * will say so plainly rather than the source quietly returning nothing —
 * silent zeroes are the worst failure mode a listener can have.
 */

import { getJson } from "../http.mjs";

const BASE = "https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts";

export async function fetchBluesky({ query, sinceHours = 48, limit = 25 }) {
  const url = `${BASE}?q=${encodeURIComponent(query)}&limit=${Math.min(limit, 100)}&sort=latest`;
  const data = await getJson(url, { minGapMs: 1500 });

  const cutoff = Date.now() - sinceHours * 3.6e6;
  const out = [];
  for (const p of data?.posts || []) {
    const createdAt = p?.record?.createdAt || p?.indexedAt;
    if (createdAt && new Date(createdAt).getTime() < cutoff) continue;

    const handle = p?.author?.handle || "";
    // at://did:plc:xxx/app.bsky.feed.post/<rkey> -> the web permalink
    const rkey = String(p?.uri || "").split("/").pop();
    out.push({
      source: "bluesky",
      id: p?.uri || rkey,
      channel: "post",
      title: "",
      body: p?.record?.text || "",
      author: handle,
      url: handle && rkey ? `https://bsky.app/profile/${handle}/post/${rkey}` : "",
      createdAt: createdAt || new Date().toISOString(),
    });
  }
  return out;
}
