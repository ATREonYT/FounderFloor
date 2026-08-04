#!/usr/bin/env node
/**
 * leadwatch — find people publicly asking for something FounderFloor does,
 * and put them in a queue for you to answer yourself.
 *
 * WHAT IT DOES NOT DO, DELIBERATELY: it does not message anybody. There is
 * no send function in this directory. It reads public posts, scores them,
 * drafts a reply you have to finish, and hands you a list. Every message
 * that reaches a human is one you chose to send, as you, in the thread
 * where they asked. The reasoning is in README.md and it is not squeamishness:
 * automated unsolicited outreach loses the account, then the domain, and in
 * the EU it invites a bill.
 *
 * Usage:
 *   node leadwatch.mjs --selftest        check every source can be reached
 *   node leadwatch.mjs                   one run: fetch, score, digest, email
 *   node leadwatch.mjs --dry             run without writing or sending
 *   node leadwatch.mjs --queue           print the leads still waiting
 *   node leadwatch.mjs --replied <key>   mark one done
 *   node leadwatch.mjs --skip <key>      mark one not worth it
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { Store } from "./lib/store.mjs";
import { score, explain } from "./lib/score.mjs";
import { draftReply } from "./lib/draft.mjs";
import { markdownDigest, htmlDigest } from "./lib/digest.mjs";
import { emailDigest } from "./lib/notify.mjs";
import { fetchHn } from "./lib/sources/hn.mjs";
import { fetchBluesky } from "./lib/sources/bluesky.mjs";
import { fetchReddit } from "./lib/sources/reddit.mjs";
import { fetchRss } from "./lib/sources/rss.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const val = (n) => {
  const i = argv.indexOf(n);
  return i >= 0 ? argv[i + 1] : undefined;
};

const DATA_DIR = process.env.LEADWATCH_DATA || join(HERE, "data");
const OUT_DIR = process.env.LEADWATCH_OUT || join(HERE, "out");

function loadConfig() {
  const path = process.env.LEADWATCH_CONFIG || join(HERE, "config.json");
  if (!existsSync(path)) {
    console.error(
      `No config at ${path}\n` +
        `Copy config.example.json to config.json and edit it, or set LEADWATCH_CONFIG.`,
    );
    process.exit(2);
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

/* ------------------------------------------------------------------ run */

async function collect(cfg) {
  const results = {};
  const items = [];
  const S = cfg.sources || {};
  const sinceHours = cfg.sinceHours ?? 48;

  const run = async (name, fn) => {
    const t0 = Date.now();
    try {
      const got = await fn();
      items.push(...got);
      results[name] = { ok: true, items: got.length, ms: Date.now() - t0 };
    } catch (err) {
      // One dead source must never take down the run. A digest built from
      // three sources with the fourth marked FAILED is useful; a crash is not.
      results[name] = { ok: false, items: 0, error: String(err.message || err).slice(0, 160) };
    }
  };

  if (S.hn?.enabled) {
    await run("hn", async () => {
      const out = [];
      for (const q of S.hn.queries || []) out.push(...(await fetchHn({ query: q, sinceHours })));
      return out;
    });
  }
  if (S.bluesky?.enabled) {
    await run("bluesky", async () => {
      const out = [];
      for (const q of S.bluesky.queries || []) out.push(...(await fetchBluesky({ query: q, sinceHours })));
      return out;
    });
  }
  if (S.reddit?.enabled) {
    await run("reddit", async () => {
      const out = [];
      for (const q of S.reddit.queries || []) {
        out.push(...(await fetchReddit({ query: q, subreddits: S.reddit.subreddits || [], sinceHours })));
      }
      return out;
    });
  }
  if (S.rss?.enabled) {
    for (const feed of S.rss.feeds || []) {
      await run(`rss:${feed.name}`, () => fetchRss({ url: feed.url, name: feed.name, sinceHours }));
    }
  }

  return { items, results };
}

async function once(cfg, { dry = false } = {}) {
  const ranAt = new Date().toISOString();
  const store = new Store(DATA_DIR);

  // Retention first, so a run that then fails has still done the one thing
  // that must happen on a schedule regardless of whether anything is found.
  if (!dry) {
    const dropped = store.prune({
      leadDays: cfg.retention?.leadDays ?? 60,
      seenDays: cfg.retention?.seenDays ?? 180,
    });
    if (dropped.leads || dropped.seen) {
      console.error(`[leadwatch] retention: dropped ${dropped.leads} lead(s), ${dropped.seen} seen id(s)`);
    }
  }

  const { items, results } = await collect(cfg);

  // Dedupe within the run as well as across runs: the same HN comment can
  // come back from two different queries.
  const seenThisRun = new Set();
  const fresh = [];
  for (const item of items) {
    if (!item.id || !item.url) continue;
    const key = Store.key(item);
    if (seenThisRun.has(key)) continue;
    seenThisRun.add(key);
    if (store.has(item)) continue;
    fresh.push(item);
  }

  const leads = [];
  for (const item of fresh) {
    const scored = score(item);
    if (!dry) store.markSeen(item);
    if (scored.score < (cfg.minScore ?? 8)) continue;
    const lead = {
      ...item,
      score: scored.score,
      clusters: scored.clusters,
      why: explain(scored),
      draft: draftReply(scored, cfg),
    };
    leads.push(lead);
  }

  leads.sort((a, b) => b.score - a.score || new Date(b.createdAt) - new Date(a.createdAt));
  const capped = leads.slice(0, cfg.maxLeadsPerRun ?? 12);
  if (!dry) for (const l of capped) store.addLead(l);

  const meta = { ranAt, sources: results, stats: store.stats() };
  const md = markdownDigest(capped, meta);
  const html = htmlDigest(capped, meta);

  if (!dry) {
    mkdirSync(OUT_DIR, { recursive: true });
    // Date and time to the second: the timer runs twice a day, and a
    // date-only name meant the evening run (usually empty) silently
    // overwrote the morning's leads. Seconds because a manual run can land
    // in the same minute as a scheduled one.
    const stamp = ranAt.slice(0, 19).replace(/[:T]/g, "-");
    writeFileSync(join(OUT_DIR, `digest-${stamp}.md`), md);
    writeFileSync(join(OUT_DIR, "latest.md"), md);
    writeFileSync(join(OUT_DIR, "latest.html"), html);
  }

  console.log(md);

  const failed = Object.entries(results).filter(([, r]) => !r.ok);
  for (const [name, r] of failed) console.error(`[leadwatch] source ${name} failed: ${r.error}`);

  if (!dry && capped.length) {
    const mail = await emailDigest({
      subject: `Leadwatch: ${capped.length} new ${capped.length === 1 ? "lead" : "leads"}`,
      html,
      text: md,
    });
    console.error(`[leadwatch] email: ${mail.sent ? mail.reason : "not sent — " + mail.reason}`);
  }

  // Exit non-zero only if EVERY source failed: that is a real outage worth a
  // failed timer unit, whereas one flaky host is just Tuesday.
  const names = Object.keys(results);
  if (names.length && failed.length === names.length) process.exitCode = 1;
}

/* ------------------------------------------------------------- selftest */

async function selftest(cfg) {
  console.log("leadwatch self-test — one small request per configured source\n");
  const checks = [];
  const S = cfg.sources || {};

  if (S.hn?.enabled) {
    checks.push(["hn", () => fetchHn({ query: S.hn.queries?.[0] || "startup", sinceHours: 168, limit: 5 })]);
  }
  if (S.bluesky?.enabled) {
    checks.push(["bluesky", () => fetchBluesky({ query: S.bluesky.queries?.[0] || "startup", sinceHours: 168, limit: 5 })]);
  }
  if (S.reddit?.enabled) {
    checks.push([
      `reddit (${process.env.REDDIT_CLIENT_ID ? "oauth" : "rss fallback"})`,
      () =>
        fetchReddit({
          query: S.reddit.queries?.[0] || "feedback",
          subreddits: (S.reddit.subreddits || ["SideProject"]).slice(0, 1),
          sinceHours: 168,
          limit: 5,
        }),
    ]);
  }
  for (const feed of S.rss?.enabled ? S.rss.feeds || [] : []) {
    checks.push([`rss:${feed.name}`, () => fetchRss({ url: feed.url, name: feed.name, sinceHours: 168 })]);
  }

  let bad = 0;
  for (const [name, fn] of checks) {
    const t0 = Date.now();
    try {
      const got = await fn();
      const sample = got[0];
      console.log(`  OK    ${name.padEnd(28)} ${String(got.length).padStart(3)} items  ${Date.now() - t0}ms`);
      if (sample) console.log(`        e.g. ${(sample.title || sample.body || "").slice(0, 68).replace(/\s+/g, " ")}`);
      if (!got.length) console.log(`        (reachable but empty — widen sinceHours or check the query)`);
    } catch (err) {
      bad++;
      console.log(`  FAIL  ${name.padEnd(28)} ${String(err.message || err).slice(0, 90)}`);
    }
  }
  console.log(bad ? `\n${bad} source(s) unreachable from this machine.` : "\nAll sources reachable.");
  process.exitCode = bad ? 1 : 0;
}

/* ------------------------------------------------------------------ cli */

const cfg = loadConfig();

if (flag("--selftest")) {
  await selftest(cfg);
} else if (flag("--queue")) {
  const store = new Store(DATA_DIR);
  const pending = store.pending();
  if (!pending.length) console.log("Nothing waiting.");
  for (const l of pending) {
    console.log(`\n[${Store.key(l)}]  score ${l.score}  ${l.source}`);
    console.log(`  ${l.title || l.body?.slice(0, 80) || ""}`);
    console.log(`  ${l.url}`);
  }
  console.log(`\n${pending.length} waiting. Mark one: --replied <key>  /  --skip <key>`);
} else if (val("--replied") || val("--skip")) {
  const store = new Store(DATA_DIR);
  const key = val("--replied") || val("--skip");
  const state = val("--replied") ? "replied" : "skipped";
  console.log(store.setState(key, state) ? `${key} -> ${state}` : `no lead with key ${key}`);
} else {
  await once(cfg, { dry: flag("--dry") });
}
