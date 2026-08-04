/**
 * leadwatch end-to-end tests: `node test/e2e.mjs`.
 *
 * Serves a fixture feed on 127.0.0.1 and runs the real CLI against it, so
 * the polite HTTP layer, the parser, the scorer, the store, the digest and
 * the exit codes are all exercised together. No network beyond loopback.
 *
 * Note for anyone extending this: the fixture server lives in THIS process,
 * so the child runs must be awaited asynchronously. execFileSync blocks the
 * event loop and the server can never answer — which cost an afternoon once.
 */
import { createServer } from "node:http";
import { mkdtempSync, rmSync, readFileSync, existsSync, writeFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const pexec = promisify(execFile);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

let bad = 0;
const check = (ok, msg, extra = "") => {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${msg}${extra ? "  — " + extra : ""}`);
  if (!ok) bad++;
};
const group = (t) => console.log(`\n${t}`);

const ago = (h) => new Date(Date.now() - h * 3.6e6).toISOString();
const entry = (id, title, body, hours = 1) => `
  <entry><id>${id}</id><title>${title}</title>
    <link href="https://example.com/post/${id}"/>
    <published>${ago(hours)}</published><author><name>u${id}</name></author>
    <content>${body}</content></entry>`;

/** A post that trips two clusters: a genuine lead. */
const genuine = (n) =>
  entry(`real-${n}`, `Where do founders hang out ${n}`, "Every discord is dead and cold DMs don't work.");
/** A post that trips every cluster: what an attacker would craft. */
const maxed = (n) =>
  entry(
    `spam-${n}`,
    `Looking for a co-founder ${n}`,
    "where do founders hang out, cold DMs don't work, how do I get my first users, " +
      "would love feedback, virtual coworking, building solo is lonely",
  );

function serveFeed(bodyFn) {
  const server = createServer((req, res) => {
    res.writeHead(200, { "content-type": "application/atom+xml" });
    res.end(`<?xml version="1.0"?><feed>${bodyFn()}</feed>`);
  });
  return new Promise((r) => server.listen(0, "127.0.0.1", () => r(server)));
}

function makeConfig(dir, port, over = {}) {
  const cfg = {
    siteUrl: "https://founderfloor.net",
    demoNight: "Thursday 19:00 CET",
    minScore: 8,
    sinceHours: 48,
    maxLeadsPerRun: 12,
    sources: {
      hn: { enabled: false },
      bluesky: { enabled: false },
      reddit: { enabled: false },
      rss: { enabled: true, feeds: [{ name: "fixture", url: `http://127.0.0.1:${port}/f.xml` }] },
    },
    ...over,
  };
  const p = join(dir, "config.json");
  writeFileSync(p, JSON.stringify(cfg));
  return p;
}

const envFor = (dir, cfgPath) => ({
  ...process.env,
  LEADWATCH_CONFIG: cfgPath,
  LEADWATCH_DATA: join(dir, "data"),
  LEADWATCH_OUT: join(dir, "out"),
  RESEND_API_KEY: "",
  NO_PROXY: "127.0.0.1,localhost",
  no_proxy: "127.0.0.1,localhost",
});

async function run(env, args = []) {
  try {
    const { stdout, stderr } = await pexec("node", ["leadwatch.mjs", ...args], {
      cwd: ROOT, env, encoding: "utf8",
    });
    return { out: stdout, err: stderr, code: 0 };
  } catch (e) {
    return { out: e.stdout || "", err: e.stderr || "", code: e.code ?? 1 };
  }
}

/* ------------------------------------------------- the main happy path */
{
  group("a normal run");
  const server = await serveFeed(() =>
    [genuine(1), entry("job", "We're hiring a co-founder", "Salary. Full-time role. Send your CV."), genuine(2)].join(""),
  );
  const dir = mkdtempSync(join(tmpdir(), "lw-e2e-"));
  const env = envFor(dir, makeConfig(dir, server.address().port));

  const r1 = await run(env);
  check(r1.out.includes("2 new leads"), "two genuine posts became leads", r1.out.match(/\d+ new leads?/)?.[0]);
  check(!r1.out.includes("We're hiring"), "the hiring post was vetoed");
  check(r1.out.includes("[[ one line about THEIR post"), "drafts arrive unfinished");
  check(r1.out.includes("https://example.com/post/real-1"), "permalink survives the pipeline");
  check(existsSync(join(dir, "out", "latest.html")), "latest.html written");

  const r2 = await run(env);
  check(r2.out.includes("Nothing new"), "already-seen items do not repeat");

  const q = await run(env, ["--queue"]);
  const key = q.out.match(/\[(fixture:[^\]]+)\]/)?.[1];
  check(/2 waiting/.test(q.out), "both leads are waiting");
  const m = await run(env, ["--replied", key]);
  check(m.out.includes("replied"), "a lead can be marked replied");
  check(/1 waiting/.test((await run(env, ["--queue"])).out), "the queue shrinks");

  server.close();
  rmSync(dir, { recursive: true, force: true });
}

/* ---------------------------- REGRESSION: the cap must not lose leads */
{
  group("REGRESSION: leads over maxLeadsPerRun are kept for next time");
  // Was: every fresh item was marked seen before the cap was applied, so
  // qualifying leads past the cap went into seen.jsonl, never into
  // leads.jsonl, and were dropped on every later run — permanently. Sorting
  // by score meant a dozen crafted max-score posts evicted every real one.
  const server = await serveFeed(() =>
    [...Array(6)].map((_, i) => maxed(i)).join("") + [...Array(6)].map((_, i) => genuine(i)).join(""),
  );
  const dir = mkdtempSync(join(tmpdir(), "lw-cap-"));
  const env = envFor(dir, makeConfig(dir, server.address().port, { maxLeadsPerRun: 4 }));

  const r1 = await run(env);
  check(r1.out.includes("4 new leads"), "the digest is capped", r1.out.match(/\d+ new leads?/)?.[0]);
  check(/8 lead\(s\) over maxLeadsPerRun/.test(r1.err), "the overflow is reported, not silent");
  check(r1.out.includes("8 more cleared the bar"), "the digest says how many it withheld");

  const seen = readFileSync(join(dir, "data", "seen.jsonl"), "utf8").trim().split("\n").length;
  check(seen === 4, "ONLY the four kept leads were marked seen", `${seen} seen`);

  const r2 = await run(env);
  check(r2.out.includes("4 new leads"), "the next run offers four of the overflow", r2.out.match(/\d+ new leads?/)?.[0]);
  const r3 = await run(env);
  const r4 = await run(env);
  check(r4.out.includes("Nothing new"), "after four runs everything has been offered");

  const leads = readFileSync(join(dir, "data", "leads.jsonl"), "utf8").trim().split("\n").map(JSON.parse);
  check(leads.length === 12, "all twelve leads eventually reached the queue", `${leads.length}`);
  const realIds = leads.filter((l) => String(l.id).startsWith("real-")).length;
  check(realIds === 6, "none of the genuine posts were evicted by the max-score ones", `${realIds}/6`);

  server.close();
  rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------- REGRESSION: CLI safety */
{
  group("REGRESSION: a mistyped command does not perform a live run");
  // Was: any unrecognised argument fell through to the default branch and
  // did a full fetch-write-send.
  const server = await serveFeed(() => genuine(1));
  const dir = mkdtempSync(join(tmpdir(), "lw-cli-"));
  const env = envFor(dir, makeConfig(dir, server.address().port));

  const typo = await run(env, ["--quene"]);
  check(typo.code === 2, "an unknown flag exits 2", `exit ${typo.code}`);
  check(!existsSync(join(dir, "out")), "and writes nothing");

  const noKey = await run(env, ["--replied"]);
  check(noKey.code === 2, "--replied without a key exits 2", `exit ${noKey.code}`);
  check(!existsSync(join(dir, "out")), "and still writes nothing");

  const help = await run(env, ["--help"]);
  check(help.code === 0 && /never messages anyone/i.test(help.out), "--help explains the tool");

  server.close();
  rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------ REGRESSION: failure reporting */
{
  group("REGRESSION: a broken source is loud");
  const dir = mkdtempSync(join(tmpdir(), "lw-fail-"));
  // port 1 is closed: the fetch will fail
  const env = envFor(dir, makeConfig(dir, 1));
  const r = await run(env);
  check(r.out.includes("FAILED"), "the digest names the failed source");
  check(r.code === 1, "an all-sources-failed run exits non-zero", `exit ${r.code}`);
  rmSync(dir, { recursive: true, force: true });
}
{
  group("REGRESSION: no sources enabled is a config error, not a quiet day");
  const dir = mkdtempSync(join(tmpdir(), "lw-none-"));
  const cfgPath = join(dir, "config.json");
  writeFileSync(cfgPath, JSON.stringify({ siteUrl: "x", sources: {} }));
  const r = await run(envFor(dir, cfgPath));
  check(r.code === 2, "exits 2", `exit ${r.code}`);
  check(/no sources enabled/i.test(r.err), "and says why");
  rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------- dry run */
{
  group("--dry touches nothing");
  const server = await serveFeed(() => genuine(1) + genuine(2));
  const dir = mkdtempSync(join(tmpdir(), "lw-dry-"));
  const env = envFor(dir, makeConfig(dir, server.address().port));
  const r = await run(env, ["--dry"]);
  check(r.out.includes("2 new leads"), "a dry run still reports what it found");
  check(!existsSync(join(dir, "out")), "no digest written");
  check(!existsSync(join(dir, "data", "seen.jsonl")), "nothing marked seen");
  server.close();
  rmSync(dir, { recursive: true, force: true });
}

console.log(bad === 0 ? "\nALL E2E CHECKS PASSED" : `\n${bad} E2E CHECK(S) FAILED`);
process.exit(bad ? 1 : 0);
