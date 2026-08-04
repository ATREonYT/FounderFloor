/**
 * Minimal RSS/Atom reader.
 *
 * There is no XML parser in Node's standard library and this tool takes no
 * dependencies, so this handles the two shapes that matter — Atom <entry>
 * and RSS <item> — and nothing else. It is deliberately small: feeds we
 * cannot parse should fail visibly in the self-test rather than be papered
 * over by a parser that guesses.
 *
 * This is also the escape hatch for everything without an API. Google
 * Alerts will emit an RSS feed for any query you like, which covers X,
 * LinkedIn posts that get indexed, forums, and the long tail — no scraping,
 * no terms to violate, and Google does the crawling.
 */

import { getText } from "../http.mjs";

export async function fetchRss({ url, name = "rss", sinceHours = 48 }) {
  const xml = await getText(url, { minGapMs: 1500 });
  const cutoff = Date.now() - sinceHours * 3.6e6;
  return parseFeed(xml)
    .filter((e) => !e.createdAt || new Date(e.createdAt).getTime() >= cutoff)
    .map((e) => ({
      source: name,
      id: e.id || e.url || e.title,
      channel: "feed",
      title: e.title,
      body: e.body,
      author: e.author,
      url: e.url,
      createdAt: e.createdAt || new Date().toISOString(),
    }));
}

/** @returns {Array<{id,title,body,author,url,createdAt}>} */
export function parseFeed(xml) {
  const blocks = [...matchAll(xml, /<(entry|item)\b[\s\S]*?<\/\1>/g)].map((m) => m[0]);
  return blocks.map((b) => ({
    id: tag(b, "id") || tag(b, "guid") || "",
    title: clean(tag(b, "title")),
    body: clean(tag(b, "content") || tag(b, "summary") || tag(b, "description")),
    author: clean(tag(b, "name") || tag(b, "dc:creator") || tag(b, "author")),
    url: link(b),
    createdAt: normDate(tag(b, "published") || tag(b, "updated") || tag(b, "pubDate")),
  }));
}

function matchAll(s, rx) {
  const out = [];
  let m;
  const r = new RegExp(rx.source, rx.flags.includes("g") ? rx.flags : rx.flags + "g");
  while ((m = r.exec(s)) !== null) {
    out.push(m);
    if (m.index === r.lastIndex) r.lastIndex++;
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
  const rss = tag(block, "link");
  return decode(clean(rss));
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
