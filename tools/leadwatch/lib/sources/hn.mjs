/**
 * Hacker News, via the Algolia search API that HN publishes for the purpose.
 *
 * No key, no auth, documented at hn.algolia.com/api, and it indexes comments
 * as well as stories — which matters here, because "does anyone know where
 * founders actually hang out" is nearly always a comment three levels down a
 * thread about something else, not a submission.
 */

import { getJson } from "../http.mjs";

const BASE = "https://hn.algolia.com/api/v1/search_by_date";

/**
 * @param {{query: string, sinceHours?: number, limit?: number}} opts
 * @returns {Promise<Array>} normalised items
 */
export async function fetchHn({ query, sinceHours = 48, limit = 50 }) {
  const since = Math.floor((Date.now() - sinceHours * 3.6e6) / 1000);
  const out = [];

  // Stories and comments are separate tag queries: Algolia's `tags` is an
  // OR only inside parentheses, and mixing them costs us the ability to
  // tell which is which when building the permalink.
  for (const tag of ["story", "comment"]) {
    const url =
      `${BASE}?query=${encodeURIComponent(query)}` +
      `&tags=${tag}` +
      `&numericFilters=created_at_i>${since}` +
      `&hitsPerPage=${Math.min(limit, 100)}`;

    const data = await getJson(url, { minGapMs: 1000 });
    for (const h of data?.hits || []) {
      const id = String(h.objectID);
      const isComment = tag === "comment";
      out.push({
        source: "hn",
        id,
        channel: isComment ? "comment" : "story",
        title: h.title || h.story_title || "",
        body: stripHtml(isComment ? h.comment_text : h.story_text || ""),
        author: h.author || "",
        url: `https://news.ycombinator.com/item?id=${id}`,
        createdAt: h.created_at || new Date((h.created_at_i || 0) * 1000).toISOString(),
      });
    }
  }
  return out;
}

/** HN comment bodies are HTML fragments. */
function stripHtml(s) {
  return String(s || "")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&")
    .trim();
}
