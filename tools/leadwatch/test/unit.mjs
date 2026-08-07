/**
 * leadwatch unit tests. No dependencies, no runner: `node test/unit.mjs`.
 *
 * Several of these exist because an adversarial review found the bug they
 * now guard. Those are marked REGRESSION with what went wrong, because a
 * test whose reason is forgotten is a test someone deletes.
 */
import { mkdtempSync, rmSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const { score, explain, POSITIVE } = await import(`${ROOT}/lib/score.mjs`);
const { draftReply, needsEdit } = await import(`${ROOT}/lib/draft.mjs`);
const { Store } = await import(`${ROOT}/lib/store.mjs`);
const { markdownDigest, htmlDigest } = await import(`${ROOT}/lib/digest.mjs`);
const { parseFeed } = await import(`${ROOT}/lib/sources/rss.mjs`);

let bad = 0;
const check = (ok, msg, extra = "") => {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${msg}${extra ? "  — " + extra : ""}`);
  if (!ok) bad++;
};
const group = (t) => console.log(`\n${t}`);
const CFG = { siteUrl: "https://founderfloor.net", openDoors: "Saturday 17:00-20:00 CEST" };

/* ------------------------------------------------------------- matching */
group("posts that SHOULD become leads");
const GOOD = [
  {
    title: "Where do founders actually hang out these days?",
    body: "Every discord I join is dead and cold DMs don't work. Is there a place where founders actually talk?",
  },
  {
    title: "Solo and looking for a technical co-founder",
    body: "I need someone to build with but I hate networking and every event is a zoom call. Building alone is lonely.",
  },
  {
    title: "Launched last week, zero users",
    body: "How do I get my first users? Looking for beta testers, would love some feedback too.",
  },
  {
    title: "Any Gather.town alternative for startups?",
    body: "We want a virtual office for an online demo day. Community for founders would be ideal.",
  },
];
for (const p of GOOD) check(score(p).score >= 8, `"${p.title.slice(0, 46)}"`, explain(score(p)));

group("posts that must NOT become leads");
const BAD = [
  { title: "We're hiring a co-founder level engineer", body: "Full-time role, salary competitive, send your CV. Looking for a co-founder mindset." },
  { title: "Our agency builds MVPs for founders", body: "We build apps for startups. DM me for a quote. Limited spots available. Community for founders." },
  { title: "How I made $10k a month with dropshipping", body: "Passive income. Where do founders hang out? Right here." },
  { title: "Check out my new tool", body: "Use code LAUNCH for 30% off. Lifetime deal. Looking for beta testers and honest feedback." },
  { title: "The 10 best founder communities in 2026", body: "Ultimate guide. Where do founders hang out, and how to find a co-founder. Looking for beta testers." },
  { title: "Thoughts on co-founder equity splits?", body: "Just curious what people think about vesting." },
];
for (const p of BAD) check(score(p).score === 0, `"${p.title.slice(0, 46)}"`, explain(score(p)));

group("REGRESSION: matching details a review found broken");
{
  // was: /we'?re hiring/ only matched the ASCII apostrophe, so the veto was
  // blind to what every phone keyboard actually types.
  const curly = score({ title: "We’re hiring a co-founder", body: "Salary, full-time role. Where do founders hang out?" });
  check(curly.score === 0 && curly.veto, "a curly apostrophe still trips the hiring veto", curly.veto || "NOT VETOED");

  // was: patterns compiled with "i" only, so `.` never crossed the newline
  // between title and body — which is where the seam always is.
  const seam = score({ title: "Building solo", body: "is lonely, and I am looking for a technical co-founder." });
  check(seam.clusters.includes("isolation"), "a phrase spanning the title/body seam matches", explain(seam));

  // was: a comment quoting the question in order to ANSWER it scored as if
  // it were asking.
  const quoting = score({
    title: "Re: finding people",
    body: "> where do founders hang out\n> looking for a co-founder\n\nHonestly, just go to meetups.",
  });
  check(quoting.score === 0, "quoted lines are not treated as the poster asking", explain(quoting));

  // was: clusters came back in declaration order, so draft.mjs's "strongest
  // cluster" was whichever happened to be listed first.
  const s = score(GOOD[2]);
  const weights = new Map(POSITIVE.map((p) => [p.cluster, p.weight]));
  const ordered = s.clusters.every((c, i) => i === 0 || weights.get(s.clusters[i - 1]) >= weights.get(c));
  check(ordered, "clusters are returned strongest-first", s.clusters.join(" > "));
}

group("the two-cluster rule");
{
  const one = score({ title: "Looking for a co-founder", body: "" });
  check(one.score === 0, "a single signal is not enough", explain(one));
  const two = score({ title: "Looking for a co-founder", body: "Building solo is lonely and I have no one to talk to about my startup." });
  check(two.score > 0, "two signals clear the bar", explain(two));
}

/* --------------------------------------------------------------- drafts */
group("drafts");
{
  const d = draftReply(score(GOOD[1]), CFG);
  check(needsEdit(d), "every draft carries an unfilled slot");
  check(d.includes("founderfloor.net"), "the link is present");
  check(/it'?s mine|I built|I'm building|I run/i.test(d), "authorship is disclosed");
  check(d.includes("Saturday 17:00-20:00 CEST"), "the ask is a time, not just a URL");
  check(draftReply(score(GOOD[3]), CFG) !== d, "different intent, different draft");

  // REGRESSION: Bluesky caps at 300 graphemes; the long drafts are ~500 and
  // could not be posted at all.
  const bsky = draftReply(score(GOOD[0]), CFG, "bluesky");
  check(bsky.length <= 300, `a bluesky draft fits the 300-char limit`, `${bsky.length} chars`);
  check(needsEdit(bsky) && bsky.includes("mine"), "the short form still discloses and still needs editing");
}

/* ---------------------------------------------------------------- store */
group("store, dedupe and retention");
{
  const dir = mkdtempSync(join(tmpdir(), "lw-"));
  try {
    const s1 = new Store(dir);
    const item = { source: "hn", id: "42", title: "x" };
    check(!s1.has(item), "a new item is not seen");
    s1.markSeen(item);
    check(s1.has(item), "after marking, it is seen");
    s1.addLead({ ...item, score: 9, draft: "d", url: "u", why: "w" });

    const s2 = new Store(dir);
    check(s2.has(item) && s2.pending().length === 1, "seen and queue survive a restart");
    check(s2.setState("hn:42", "replied"), "state can be set");
    check(new Store(dir).stats().replied === 1, "state survives a restart");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
{
  const dir = mkdtempSync(join(tmpdir(), "lw-ret-"));
  try {
    const s = new Store(dir);
    s.markSeen({ source: "hn", id: "old" }, new Date(Date.now() - 400 * 864e5).toISOString());
    s.markSeen({ source: "hn", id: "new" }, new Date(Date.now() - 5 * 864e5).toISOString());
    s.addLead({ source: "hn", id: "L1", url: "u", why: "w", draft: "d" });
    s.leads[0].foundAt = new Date(Date.now() - 120 * 864e5).toISOString();
    s.addLead({ source: "hn", id: "L2", url: "u", why: "w", draft: "d" });

    const dropped = s.prune({ leadDays: 60, seenDays: 180 });
    check(dropped.leads === 1 && dropped.seen === 1, "retention drops what is past its date", JSON.stringify(dropped));
    const re = new Store(dir);
    check(re.leads.length === 1 && re.leads[0].id === "L2", "the deletion is on disk");
    check(!re.has({ source: "hn", id: "old" }) && re.has({ source: "hn", id: "new" }), "only the old id went");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/* ----------------------------------------------------------------- feed */
group("feed parsing");
{
  const atom = `<feed><entry><id>one</id><title>Looking for a co-founder</title>
    <link href="https://example.com/a"/><published>2026-08-01T10:00:00Z</published>
    <author><name>alice</name></author>
    <content type="html">&lt;p&gt;Building solo is lonely&lt;/p&gt;</content></entry></feed>`;
  const a = parseFeed(atom);
  check(a.length === 1 && a[0].url === "https://example.com/a" && a[0].author === "alice", "atom parsed");
  check(a[0].body.includes("Building solo is lonely"), "escaped html decoded");

  const rss = `<rss><channel><item><guid>two</guid><title><![CDATA[Need beta testers]]></title>
    <link>https://example.com/b</link><pubDate>Fri, 01 Aug 2026 10:00:00 GMT</pubDate>
    <description>How do I get my first users?</description></item></channel></rss>`;
  const r = parseFeed(rss);
  check(r.length === 1 && r[0].title === "Need beta testers", "rss parsed, cdata unwrapped");
  check(!!Date.parse(r[0].createdAt), "rfc822 date normalised");

  // REGRESSION: an unclosed tag used to drive a quadratic backreferenced
  // regex; this must return promptly rather than pin the CPU.
  const t0 = Date.now();
  parseFeed("<feed>" + "<entry><title>x</title>".repeat(4000) + "</feed>");
  check(Date.now() - t0 < 2000, "a malformed feed does not hang the parser", `${Date.now() - t0}ms`);
}

/* --------------------------------------------------------------- digest */
group("digest");
{
  const leads = GOOD.slice(0, 2).map((p, i) => {
    const s = score(p);
    return { ...p, source: "hn", id: String(i), url: `https://news.ycombinator.com/item?id=${i}`,
      author: "someone", createdAt: new Date(Date.now() - 3.6e6).toISOString(),
      score: s.score, clusters: s.clusters, why: explain(s), draft: draftReply(s, CFG) };
  });
  const meta = { ranAt: new Date().toISOString(), sources: { hn: { ok: true, items: 9 }, reddit: { ok: false, error: "429" } },
    stats: { seen: 9, leads: 2, new: 2, replied: 0, skipped: 0 }, overflow: 3 };
  const md = markdownDigest(leads, meta);
  const html = htmlDigest(leads, meta);
  check(md.includes(leads[0].url), "markdown carries the permalink");
  check(md.includes("reddit FAILED"), "a failed source is reported, not hidden");
  check(md.includes("3 more cleared the bar"), "REGRESSION: silent truncation is now stated");
  check(markdownDigest([], meta).includes("Nothing new"), "an empty run still produces a digest");

  const evil = [{ ...leads[0], title: '<img src=x onerror="alert(1)">', body: "<script>bad()</script>" }];
  const evilHtml = htmlDigest(evil, meta);
  check(!evilHtml.includes("<script>bad()") && evilHtml.includes("&lt;img"), "hostile content is escaped");
  check(!/<img[^>]*onerror/i.test(evilHtml), "no live attribute survives into a tag");
  check(!htmlDigest([{ ...leads[0], url: "javascript:alert(1)" }], meta).includes("javascript:"), "js: href dropped (html)");
  check(markdownDigest([{ ...leads[0], url: "javascript:alert(1)" }], meta).includes("(no usable link)"), "js: link dropped (markdown)");
}

/* ------------------------------------------------- the safety property */
group("the safety property: nothing here can message anyone");
{
  const files = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      // test/ is excluded: it necessarily names the very patterns it forbids
      if (e.isDirectory() && !["node_modules", "data", "out", "test"].includes(e.name)) walk(p);
      else if (p.endsWith(".mjs")) files.push(p);
    }
  };
  walk(ROOT);
  const senders = files.filter((f) => {
    const src = readFileSync(f, "utf8");
    return /fetch\(/.test(src) && /method:\s*"POST"/.test(src) && !/api\.resend\.com|access_token/.test(src);
  });
  check(senders.length === 0, "no module POSTs to a third party", senders.join(","));
  const dm = files.filter((f) => /sendMessage|sendDm|compose_message|\/api\/v1\/comment|api\/submit/i.test(readFileSync(f, "utf8")));
  check(dm.length === 0, "no module references a messaging endpoint", dm.join(","));
}

console.log(bad === 0 ? "\nALL UNIT CHECKS PASSED" : `\n${bad} UNIT CHECK(S) FAILED`);
process.exit(bad ? 1 : 0);
