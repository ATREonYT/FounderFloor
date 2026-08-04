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

import { readFileSync, writeFileSync, renameSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
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

  // Per QUERY, not per source: one flaky request used to discard every
  // sibling query's already-fetched items. Partial data is the whole design.
  const eachQuery = async (queries, fn) => {
    const out = [];
    const errs = [];
    for (const q of queries) {
      try {
        out.push(...(await fn(q)));
      } catch (err) {
        errs.push(`"${q}": ${String(err.message || err).slice(0, 100)}`);
      }
    }
    if (errs.length === queries.length && queries.length) throw new Error(errs.join(" | "));
    if (errs.length) console.warn(`[leadwatch] some queries failed — ${errs.join(" | ")}`);
    return out;
  };

  if (S.hn?.enabled) {
    await run("hn", () => eachQuery(S.hn.queries || [], (q) => fetchHn({ query: q, sinceHours })));
  }
  if (S.bluesky?.enabled) {
    await run("bluesky", () =>
      eachQuery(S.bluesky.queries || [], (q) => fetchBluesky({ query: q, sinceHours })),
    );
  }
  if (S.reddit?.enabled) {
    await run("reddit", () =>
      eachQuery(S.reddit.queries || [], (q) =>
        fetchReddit({ query: q, subreddits: S.reddit.subreddits || [], sinceHours }),
      ),
    );
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

  // Scoring first, marking second. Marking inside this loop was a real bug:
  // every fresh item went into seen.jsonl, but only the first
  // maxLeadsPerRun were written to leads.jsonl — so anything that qualified
  // and lost the cap was silently discarded FOREVER, since store.has()
  // skipped it on every later run and the sources only look back
  // sinceHours. Worse, leads sort by score, so a dozen crafted max-score
  // posts would evict every genuine lead found in the same run.
  //
  // Now: items that did not qualify are marked seen immediately (we are done
  // with them), and items that did qualify are marked ONLY if they make the
  // cut. The overflow stays unseen and is offered again next run.
  const leads = [];
  const rejected = [];
  for (const item of fresh) {
    const scored = score(item);
    if (scored.score < (cfg.minScore ?? 8)) {
      rejected.push(item);
      continue;
    }
    leads.push({
      ...item,
      score: scored.score,
      clusters: scored.clusters,
      why: explain(scored),
      draft: draftReply(scored, cfg, item.source),
    });
  }

  leads.sort((a, b) => b.score - a.score || new Date(b.createdAt) - new Date(a.createdAt));
  const capped = leads.slice(0, cfg.maxLeadsPerRun ?? 12);
  const overflow = leads.length - capped.length;

  if (!dry) {
    for (const item of rejected) store.markSeen(item);
    for (const l of capped) {
      store.markSeen(l);
      store.addLead(l);
    }
  }
  if (overflow) {
    console.error(
      `[leadwatch] ${overflow} lead(s) over maxLeadsPerRun — left unseen, they will be offered again next run`,
    );
  }

  const meta = { ranAt, sources: results, stats: store.stats(), overflow };
  const md = markdownDigest(capped, meta);
  const html = htmlDigest(capped, meta);

  if (!dry) {
    mkdirSync(OUT_DIR, { recursive: true });
    // Date and time to the second: the timer runs twice a day, and a
    // date-only name meant the evening run (usually empty) silently
    // overwrote the morning's leads. Seconds because a manual run can land
    // in the same minute as a scheduled one.
    const stamp = ranAt.slice(0, 19).replace(/[:T]/g, "-");
    const put = (name, contents) => {
      // tmp + rename: a half-written latest.html is worse than a stale one
      const target = join(OUT_DIR, name);
      writeFileSync(`${target}.tmp`, contents);
      renameSync(`${target}.tmp`, target);
    };
    put(`digest-${stamp}.md`, md);
    put("latest.md", md);
    put("latest.html", html);
  }

  console.log(md);

  const failed = Object.entries(results).filter(([, r]) => !r.ok);
  for (const [name, r] of failed) console.error(`[leadwatch] source ${name} failed: ${r.error}`);

  // Mail on failures as well as finds: a run where every source is broken
  // used to send nothing at all, so an outage was invisible until the
  // operator wondered why it had gone quiet.
  if (!dry && (capped.length || failed.length)) {
    const bits = [`${capped.length} new ${capped.length === 1 ? "lead" : "leads"}`];
    if (failed.length) bits.push(`${failed.length} source${failed.length === 1 ? "" : "s"} FAILED`);
    let mail = { sent: false, reason: "not attempted" };
    try {
      mail = await emailDigest({ subject: `Leadwatch: ${bits.join(", ")}`, html, text: md });
    } catch (err) {
      mail = { sent: false, reason: String(err.message || err) };
    }
    console.error(`[leadwatch] email: ${mail.sent ? mail.reason : "not sent — " + mail.reason}`);
    // A missing key is the documented no-op. Anything else means leads were
    // found and nobody was told, which should fail the unit.
    if (!mail.sent && !/not set$/.test(mail.reason)) process.exitCode = 1;
  }

  // Exit non-zero only if EVERY source failed: that is a real outage worth a
  // failed timer unit, whereas one flaky host is just Tuesday.
  const names = Object.keys(results);
  if (!names.length) {
    console.error("[leadwatch] no sources enabled in config — nothing was checked");
    process.exitCode = 2;
  } else if (failed.length === names.length) {
    process.exitCode = 1;
  }
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

const KNOWN = new Set(["--selftest", "--dry", "--queue", "--replied", "--skip", "--help", "-h"]);

function usage(code = 0) {
  console.log(
    [
      "leadwatch — find people publicly asking for something FounderFloor does.",
      "",
      "  node leadwatch.mjs                 one run: fetch, score, digest, email",
      "  node leadwatch.mjs --dry           run without writing or sending",
      "  node leadwatch.mjs --selftest      check every source can be reached",
      "  node leadwatch.mjs --queue         print the leads still waiting",
      "  node leadwatch.mjs --replied <key> mark one done",
      "  node leadwatch.mjs --skip <key>    mark one not worth it",
      "",
      "It never messages anyone. See README.md.",
    ].join("\n"),
  );
  process.exit(code);
}

/**
 * Parse explicitly. The previous version fell through an if/else chain into
 * a full live run for ANY unrecognised argument — so a typo, or --replied
 * with the key left off, silently fetched, wrote to the store and sent mail
 * instead of telling the operator they had mistyped.
 */
function parseArgs() {
  if (flag("--help") || flag("-h")) usage(0);

  for (const a of argv) {
    if (a.startsWith("-") && !KNOWN.has(a)) {
      console.error(`Unknown option: ${a}`);
      usage(2);
    }
  }

  for (const marker of ["--replied", "--skip"]) {
    if (!flag(marker)) continue;
    const v = val(marker);
    if (!v || v.startsWith("-")) {
      console.error(`${marker} needs a lead key, e.g. ${marker} hn:12345`);
      console.error(`Run --queue to see the keys.`);
      process.exit(2);
    }
    return { mode: marker === "--replied" ? "replied" : "skipped", key: v };
  }

  if (flag("--selftest")) return { mode: "selftest" };
  if (flag("--queue")) return { mode: "queue" };
  return { mode: "run", dry: flag("--dry") };
}

const args = parseArgs();
const cfg = args.mode === "queue" || args.mode === "replied" || args.mode === "skipped"
  ? null
  : loadConfig();

if (args.mode === "selftest") {
  await selftest(cfg);
} else if (args.mode === "queue") {
  const store = new Store(DATA_DIR);
  const pending = store.pending();
  if (!pending.length) console.log("Nothing waiting.");
  for (const l of pending) {
    console.log(`\n[${Store.key(l)}]  score ${l.score}  ${l.source}`);
    console.log(`  ${l.title || l.body?.slice(0, 80) || ""}`);
    console.log(`  ${l.url}`);
  }
  console.log(`\n${pending.length} waiting. Mark one: --replied <key>  /  --skip <key>`);
} else if (args.mode === "replied" || args.mode === "skipped") {
  const store = new Store(DATA_DIR);
  const ok = store.setState(args.key, args.mode);
  console.log(ok ? `${args.key} -> ${args.mode}` : `no lead with key ${args.key}`);
  if (!ok) process.exitCode = 1;
} else {
  await once(cfg, { dry: args.dry });
}
