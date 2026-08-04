/**
 * Minimal RSS/Atom reader.
 *
 * There is no XML parser in Node's standard library and this tool takes no
 * dependencies, so this handles the two shapes that matter — Atom <entry> and
 * RSS <item> — and nothing else. Feeds it cannot parse should fail visibly in
 * the self-test rather than be papered over by a parser that guesses.
 *
 * This is also the escape hatch for everything without an API. Google Alerts
 * will emit an RSS feed for any query you like, which covers X, LinkedIn
 * posts that get indexed, forums and the long tail — no scraping, no terms to
 * violate, and Google does the crawling.
 *
 * Two hardening notes. The block splitter scans with indexOf rather than a
 * backreferenced lazy regex: the regex form is quadratic on unclosed tags, so
 * a malformed feed could pin the CPU for hours in a process nobody is
 * watching. And input is bounded before parsing, because "somebody else's
 * server decides how much work we do" is not a property worth having.
 */

import { getText } from "../http.mjs";

const MAX_XML = 4 * 1024 * 1024;
const MAX_BLOCKS = 500;

export async function fetchRss({ url, name = "rss", sinceHours = 48 }) {
  const xml = await getText(url, { minGapMs: 1500 });
  const cutoff = Date.now() - sinceHours * 3.6e6;
  const out = [];
  let undated = 0;

  for (const e of parseFeed(xml)) {
    if (!e.createdAt) {
      // An entry with no parsable date used to be stamped "now", which
      // presented arbitrarily old posts as breaking news and let them past
      // the cutoff. Skipped, and counted so a broken feed is visible.
      undated++;
      continue;
    }
    if (new Date(e.createdAt).getTime() < cutoff) continue;
    out.push({
      source: name,
      id: e.id || e.url || e.title,
      channel: "feed",
      title: e.title,
      body: e.body,
      author: e.author,
      url: e.url,
      createdAt: e.createdAt,
    });
  }

  if (undated) console.warn(`[leadwatch] ${name}: skipped ${undated} entr(ies) with no parsable date`);
  return out;
}

/** @returns {Array<{id,title,body,author,url,createdAt}>} */
export function parseFeed(xml) {
  const src = String(xml || "").slice(0, MAX_XML);
  return splitBlocks(src).map((b) => ({
    id: tag(b, "id") || tag(b, "guid") || "",
    title: clean(tag(b, "title")),
    body: clean(tag(b, "content") || tag(b, "summary") || tag(b, "description")),
    author: clean(tag(b, "name") || tag(b, "dc:creator") || tag(b, "author")),
    url: link(b),
    createdAt: normDate(tag(b, "published") || tag(b, "updated") || tag(b, "pubDate")),
  }));
}

/**
 * Linear scan for <entry>…</entry> / <item>…</item>. An unclosed tag costs one
 * skipped block, not an exponential backtrack.
 */
function splitBlocks(s) {
  const out = [];
  const open = /<(entry|item)\b/gi;
  let m;
  while ((m = open.exec(s)) !== null && out.length < MAX_BLOCKS) {
    const name = m[1].toLowerCase();
    const close = s.toLowerCase().indexOf(`</${name}>`, m.index);
    if (close === -1) break; // truncated feed: take what we have
    out.push(s.slice(m.index, close + name.length + 3));
    open.lastIndex = close;
  }
  return out;
}

function tag(block, name) {
  const rx = new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`, "i");
  const m = block.match(rx);
  return m ? m[1] : "";
}

/** Atom puts the URL in an attribute; RSS puts it in the element body. */
function link(block) {
  const atom = block.match(/<link\b[^>]*\bhref="([^"]+)"/i);
  if (atom) return decode(atom[1]);
  return decode(clean(tag(block, "link")));
}

function clean(s) {
  return decode(
    String(s || "")
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function decode(s) {
  return String(s || "")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

function normDate(s) {
  const t = Date.parse(clean(s));
  return Number.isFinite(t) ? new Date(t).toISOString() : "";
}
