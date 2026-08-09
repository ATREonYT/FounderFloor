/**
 * The founders wall, end to end: `node server/test/wall.mjs`.
 *
 * Two things are worth a real server rather than a unit test of the
 * helpers: the link field is the one place the site puts an ATTACKER'S URL
 * in front of a visitor, and the public listing is what an ungated page
 * renders — so a ban that does not reach it is not a ban.
 */
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SERVER = join(dirname(fileURLToPath(import.meta.url)), "..", "index.mjs");

let bad = 0;
const check = (ok, msg, extra = "") => {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${msg}${extra ? "  — " + extra : ""}`);
  if (!ok) bad++;
};
const group = (t) => console.log(`\n${t}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const dir = mkdtempSync(join(tmpdir(), "ff-wall-"));
const dataFile = join(dir, "floor-data.json");
const port = 3521;

/* A leftover server from a previous crashed run would answer on this port,
   the health check would go green against it, and every assertion below
   would then be testing yesterday's build with yesterday's accounts. That
   failure looks exactly like a broken sanitizer, so refuse to start. */
{
  const squatter = await fetch(`http://127.0.0.1:${port}/health`)
    .then((r) => r.ok)
    .catch(() => false);
  if (squatter) {
    console.error(`something is already listening on :${port} — kill it and re-run`);
    process.exit(1);
  }
}
const proc = spawn(process.execPath, [SERVER], {
  env: {
    ...process.env,
    FF_DATA_FILE: dataFile,
    PORT_WS: String(port),
    FOUNDING_SEATS: "0",
    ADMIN_EMAILS: "boss@example.com",
    // /startups/register shares the auth window, and this file makes ~20
    // listings in a few seconds. Raised here rather than slept around, so
    // the test proves the sanitizer instead of proving the limiter.
    AUTH_RATE_LIMIT: "500",
    NO_PROXY: "127.0.0.1,localhost",
    no_proxy: "127.0.0.1,localhost",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let log = "";
proc.stdout.on("data", (d) => (log += d));
proc.stderr.on("data", (d) => (log += d));
// A throw anywhere below must not leave the server running: the next run
// would connect to it and quietly test the wrong build.
for (const sig of ["exit", "uncaughtException", "unhandledRejection"]) {
  process.once(sig, (err) => {
    try {
      proc.kill("SIGKILL");
    } catch {
      /* already gone */
    }
    if (sig !== "exit") {
      console.error(err);
      process.exit(1);
    }
  });
}
const base = `http://127.0.0.1:${port}`;
for (let i = 0; i < 100; i++) {
  try {
    if ((await fetch(`${base}/health`)).ok) break;
  } catch {
    /* not up */
  }
  await sleep(100);
}

const post = (p, b) =>
  fetch(base + p, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(b),
  }).then((r) => r.json());

const wall = () => fetch(`${base}/startups`).then((r) => r.json());

const standFor = (name, link) => ({
  id: "mine",
  name,
  oneLiner: "does a thing",
  pitch: "",
  founder: name,
  founderLook: { skin: 0, outfit: 0, hair: 0 },
  category: "Tools",
  goal: "Survive",
  goalProgress: 0,
  verifiedRevenue: 0,
  seekingCofounder: false,
  link,
  booth: { carpet: "#C2B8A3", banner: "#5C5548", sign: "X", glyph: "star", pattern: "solid" },
});

const put = (acct, name, link) =>
  post("/startups/register", { me: acct.id, token: acct.token, startup: standFor(name, link) });

const reg = (name) =>
  post("/auth/register", {
    name,
    email: `${name.toLowerCase()}@example.com`,
    password: "hunter2hunter2",
  });

const linkOf = async (name) => {
  const list = (await wall()).startups;
  return list.find((r) => r.startup.name === name)?.startup.link;
};

/* ------------------------------------------------------------ good links */
{
  group("links people actually type");
  const a = await reg("Ann");
  await put(a, "Ann Co", "example.com");
  check((await linkOf("Ann Co")) === "https://example.com/",
    "a bare domain gets https:// rather than being refused", await linkOf("Ann Co"));

  await put(a, "Ann Co", "http://sub.example.co.uk/path?a=1");
  check((await linkOf("Ann Co")) === "http://sub.example.co.uk/path?a=1",
    "a full URL survives intact", await linkOf("Ann Co"));

  await put(a, "Ann Co", "  https://example.org/x  ");
  check((await linkOf("Ann Co")) === "https://example.org/x",
    "surrounding whitespace is trimmed", await linkOf("Ann Co"));

  await put(a, "Ann Co", "https://user:secret@example.com/");
  const creds = await linkOf("Ann Co");
  check(!/secret/.test(creds || ""),
    "a pasted password is stripped rather than published", creds);
}

/* ------------------------------------------------------------- bad links */
{
  group("links nobody should be able to publish");
  const b = await reg("Bob");
  const refused = async (raw, why) => {
    await put(b, "Bob Co", raw);
    const got = await linkOf("Bob Co");
    check(got === undefined, why, got === undefined ? "" : `got ${got}`);
  };
  // A javascript: href is the classic way a "website" field becomes stored
  // XSS the first time something renders it without thinking.
  await refused("javascript:alert(1)", "javascript: is dropped");
  await refused("data:text/html,<script>alert(1)</script>", "data: is dropped");
  await refused("vbscript:msgbox(1)", "vbscript: is dropped");
  await refused("file:///etc/passwd", "file: is dropped");
  // A hostname with no dot is a machine on the READER'S network, not a
  // public site — a link field is not a port scanner.
  await refused("http://localhost:3001/admin", "localhost is dropped");
  await refused("http://127.0.0.1/", "a bare IP is dropped");
  await refused("http://router/", "a dotless LAN name is dropped");
  await refused("not a url at all", "gibberish is dropped");
  await refused(`https://example.com/${"x".repeat(400)}`, "an over-long URL is dropped");
}

/* ------------------------------------------------- a ban reaches the wall */
{
  group("a ban takes the listing down too");
  const c = await reg("Carl");
  await put(c, "Carl Co", "carl.example.com");
  check(Boolean(await linkOf("Carl Co")), "the listing is up first");

  const boss = await post("/auth/register", {
    name: "Boss",
    email: "boss@example.com",
    password: "hunter2hunter2",
  });
  const banned = await post("/admin/ban", { token: boss.token, id: c.id, reason: "spam" });
  check(banned.ok === true, "the ban lands", JSON.stringify(banned));

  const after = (await wall()).startups.some((r) => r.startup.name === "Carl Co");
  // Without this a ban only stops them walking around, while their advert
  // stays on the front page of an ungated site.
  check(!after, "and their listing is gone from the public list");
}

/* ------------------------------------------------------ operator takedown */
{
  group("an operator can take one listing down without banning anyone");
  const d = await reg("Dee");
  await put(d, "Dee Co", "dee.example.com");
  check(Boolean(await linkOf("Dee Co")), "the listing is up first");

  const boss = await post("/auth/login", { email: "boss@example.com", password: "hunter2hunter2" });
  const gone = await post("/admin/wall-remove", { token: boss.token, ownerId: d.id });
  check(gone.ok === true && gone.removed >= 1, "the takedown reports what it removed",
    JSON.stringify(gone));
  check(!(await wall()).startups.some((r) => r.startup.name === "Dee Co"),
    "and the listing is off the wall");

  const still = await post("/auth/login", { email: "dee@example.com", password: "hunter2hunter2" });
  check(!still.error, "while the account itself still works — this is not a ban", still.error);
}

proc.kill("SIGTERM");
await sleep(300);
if (bad) console.log(`\n--- server log ---\n${log}`);
rmSync(dir, { recursive: true, force: true });
console.log(bad === 0 ? "\nALL CHECKS PASSED" : `\n${bad} CHECK(S) FAILED`);
process.exit(bad ? 1 : 0);
