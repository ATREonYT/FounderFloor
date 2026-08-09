/**
 * Stand moderation and bans: `node server/test/moderation.mjs`.
 *
 * Two things under test, and the second matters as much as the first:
 *
 *   1. Content that must not be hosted is REFUSED, not masked. A drug
 *      market with stars in its name is still a drug market.
 *   2. Content a real company would legitimately write is NOT refused. A
 *      filter that blocks a fraud-prevention startup for writing the word
 *      "carding" does more damage than the spam it stops, so the false
 *      positives get as many assertions as the true ones.
 */
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from "node:fs";
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

const dir = mkdtempSync(join(tmpdir(), "ff-mod-"));
const dataFile = join(dir, "floor-data.json");
const port = 3531;
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
    AUTH_RATE_LIMIT: "500",
    NO_PROXY: "127.0.0.1,localhost",
    no_proxy: "127.0.0.1,localhost",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let log = "";
proc.stdout.on("data", (d) => (log += d));
proc.stderr.on("data", (d) => (log += d));
for (const sig of ["exit", "uncaughtException", "unhandledRejection"]) {
  process.once(sig, (err) => {
    try {
      proc.kill("SIGKILL");
    } catch {
      /* gone */
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

const reg = (name) =>
  post("/auth/register", {
    name,
    email: `${name.toLowerCase()}@example.com`,
    password: "hunter2hunter2",
  });

const stand = (over) => ({
  id: "mine",
  name: "Acme",
  oneLiner: "does a thing",
  pitch: "",
  founder: "Someone",
  founderLook: { skin: 0, outfit: 0, hair: 0 },
  category: "Tools",
  goal: "Survive",
  goalProgress: 0,
  verifiedRevenue: 0,
  seekingCofounder: false,
  booth: { carpet: "#C2B8A3", banner: "#5C5548", sign: "AC", glyph: "star", pattern: "solid" },
  ...over,
});

const put = (acct, over) =>
  post("/startups/register", { me: acct.id, token: acct.token, startup: stand(over) });

const listed = async (name) => {
  const d = await fetch(`${base}/startups`).then((r) => r.json());
  return d.startups.some((r) => r.startup.name === name);
};

/* ------------------------------------------------------------- refused */
{
  group("stands that must not go up");
  const a = await reg("Villain");
  const refused = async (over, why) => {
    const r = await put(a, over);
    check(Boolean(r.error), why, r.error ? "" : JSON.stringify(r).slice(0, 90));
  };
  await refused({ name: "Hitman for hire" }, "murder for hire, in the name");
  await refused({ oneLiner: "buy fake passports for sale, fast shipping" }, "counterfeit documents, in the one-liner");
  await refused({ pitch: "We sell cvv for sale and dumps for sale." }, "stolen card data, in the pitch");
  await refused({ oneLiner: "buy cocaine online, discreet" }, "an offer to sell drugs");
  await refused({ link: "https://buyfakeid.example.com" }, "and in the link, which is read like any other field");
  // Spacing and leetspeak collapse into the same string before matching.
  await refused({ oneLiner: "h i t m a n  f o r  h i r e" }, "spaced out to dodge the filter");
  await refused({ oneLiner: "buy f4ke p4ssports for sale" }, "leetspeak to dodge the filter");

  check(!(await listed("Hitman for hire")), "and none of them reached the public list");
}

/* -------------------------------------------------- NOT refused (the point) */
{
  group("stands that must NOT be refused — the expensive kind of mistake");
  const b = await reg("Legit");
  const allowed = async (over, why) => {
    const r = await put(b, over);
    check(r.ok === true, why, r.error || "");
  };
  await allowed(
    { name: "Cardguard", oneLiner: "We detect carding and stolen credentials for banks" },
    "a fraud-prevention company writing about carding",
  );
  await allowed(
    { name: "Shieldwall", pitch: "Ransomware and botnet defence for small teams. We stop DDoS too." },
    "a security company writing about ransomware and DDoS",
  );
  await allowed(
    { name: "Freehands", oneLiner: "Working to end human trafficking with survivor-led tooling" },
    "an NGO writing about trafficking",
  );
  await allowed(
    { name: "Something", oneLiner: "Something methodical for the classics of assessment" },
    "innocent words that CONTAIN flagged ones (something, classics, assess)",
  );
  await allowed(
    { name: "Sober", oneLiner: "Recovery support for people leaving cocaine and heroin behind" },
    "a recovery startup naming the drugs it helps people leave",
  );
}

/* --------------------------------------------- the watch list is a queue */
{
  group("watched terms are queued for a human, not blocked");
  const boss = await post("/auth/register", {
    name: "Boss",
    email: "boss@example.com",
    password: "hunter2hunter2",
  });
  const o = await post("/admin/overview", { token: boss.token });
  check(Array.isArray(o.flagged), "the console gets a queue", typeof o.flagged);
  const terms = o.flagged.flatMap((f) => f.terms);
  check(terms.includes("carding"), "the fraud company is in it", terms.join(","));
  check(terms.includes("humantrafficking"), "so is the NGO");
  check(terms.includes("ransomware") || terms.includes("ddos"), "so is the security company");
  // ...and it is live. The queue is a queue, not a hold. (One account holds
  // one listing, so this is the last one Legit registered.)
  check(await listed("Sober"), "while the stand itself is up and running");
}

/* ------------------------------ a ban takes stands off EVERY floor */
{
  group("REGRESSION: a ban clears stands on quiet floors too");
  // The old version walked `rooms`, which only exist while somebody is
  // inside — so a banned stand survived on exactly the floors nobody was
  // watching. Reproduced by writing a stand into the data file and
  // restarting: on boot there is no room for that floor at all, which is
  // what a floor looks like between Sundays.
  const c = await reg("Squatter");
  await put(c, { name: "Squat Co" });
  proc.kill("SIGTERM");
  await sleep(700);

  const saved = JSON.parse(readFileSync(dataFile, "utf8"));
  saved.stands = {
    "main-hall": {
      [c.id]: {
        ownerName: "Squatter",
        lastSeen: Date.now(),
        claim: { spotIndex: 3, startup: stand({ name: "Squat Stand" }) },
      },
    },
  };
  writeFileSync(dataFile, JSON.stringify(saved));

  const quiet = spawn(process.execPath, [SERVER], {
    env: {
      ...process.env,
      FF_DATA_FILE: dataFile,
      PORT_WS: String(port + 2),
      FOUNDING_SEATS: "0",
      ADMIN_EMAILS: "boss@example.com",
      AUTH_RATE_LIMIT: "500",
      NO_PROXY: "127.0.0.1,localhost",
      no_proxy: "127.0.0.1,localhost",
    },
    stdio: ["ignore", "ignore", "ignore"],
  });
  const b2 = `http://127.0.0.1:${port + 2}`;
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(`${b2}/health`)).ok) break;
    } catch {
      /* not up */
    }
    await sleep(100);
  }
  const at = (name) =>
    fetch(`${b2}/startups`)
      .then((r) => r.json())
      .then((d) => d.startups.some((r) => r.startup.name === name));

  check(await at("Squat Stand"), "the stand is up on a floor nobody is standing on");

  const boss = await fetch(`${b2}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "boss@example.com", password: "hunter2hunter2" }),
  }).then((r) => r.json());
  const r = await fetch(`${b2}/admin/ban`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token: boss.token, id: c.id, reason: "spam" }),
  }).then((x) => x.json());

  check(r.ok === true, "the ban lands", JSON.stringify(r).slice(0, 120));
  check(r.cleared >= 1, "and it reports taking the stand down", `cleared=${r.cleared}`);
  check(!(await at("Squat Stand")), "the stand is gone from the quiet floor");
  check(!(await at("Squat Co")), "and so is their directory listing");

  quiet.kill("SIGKILL");
  await sleep(300);
}

/* -------------------------------- the queue survives a restart */
{
  group("the moderation queue survives a restart");
  const again = spawn(process.execPath, [SERVER], {
    env: {
      ...process.env,
      FF_DATA_FILE: dataFile,
      PORT_WS: String(port + 1),
      FOUNDING_SEATS: "0",
      ADMIN_EMAILS: "boss@example.com",
      AUTH_RATE_LIMIT: "500",
      NO_PROXY: "127.0.0.1,localhost",
      no_proxy: "127.0.0.1,localhost",
    },
    stdio: ["ignore", "ignore", "ignore"],
  });
  const base2 = `http://127.0.0.1:${port + 1}`;
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(`${base2}/health`)).ok) break;
    } catch {
      /* not up */
    }
    await sleep(100);
  }
  const boss = await fetch(`${base2}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "boss@example.com", password: "hunter2hunter2" }),
  }).then((r) => r.json());
  const o = await fetch(`${base2}/admin/overview`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token: boss.token }),
  }).then((r) => r.json());
  // An operator inbox that empties itself on every restart is an inbox
  // nobody can trust.
  check((o.flagged?.length ?? 0) > 0, "the queue is still there", String(o.flagged?.length));
  again.kill("SIGKILL");
}

proc.kill("SIGTERM");
await sleep(300);
if (bad) console.log(`\n--- server log ---\n${log.slice(-3000)}`);
rmSync(dir, { recursive: true, force: true });
console.log(bad === 0 ? "\nALL CHECKS PASSED" : `\n${bad} CHECK(S) FAILED`);
process.exit(bad ? 1 : 0);
