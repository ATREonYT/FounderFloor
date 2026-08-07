/**
 * The founding seats, end to end: `node server/test/founding.mjs`.
 *
 * Boots a real server against a scratch data file (FF_DATA_FILE) on a spare
 * port and registers real accounts over HTTP, because the things that can
 * break here are all about persistence and ordering, and none of them are
 * visible from a unit test of the grant function on its own:
 *
 *   - the twenty-first person must get nothing
 *   - a restart must not hand out seat 1 again
 *   - accounts that existed before the offer must get the seats, oldest
 *     first, or "the first twenty to join" is a lie to the people who
 *     actually joined first
 */
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs";
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

/** Start a server and wait until it answers. Returns a handle to stop it. */
async function boot({ dataFile, port, seats }) {
  const proc = spawn(process.execPath, [SERVER], {
    env: {
      ...process.env,
      FF_DATA_FILE: dataFile,
      PORT_WS: String(port),
      FOUNDING_SEATS: String(seats),
      NO_PROXY: "127.0.0.1,localhost",
      no_proxy: "127.0.0.1,localhost",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let log = "";
  proc.stdout.on("data", (d) => (log += d));
  proc.stderr.on("data", (d) => (log += d));

  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(`${base}/health`);
      if (r.ok) return { proc, base, log: () => log };
    } catch {
      /* not up yet */
    }
    await sleep(100);
  }
  throw new Error(`server did not start\n${log}`);
}

async function stop(h) {
  h.proc.kill("SIGTERM");
  // give the save-on-exit a moment to land before the next boot reads it
  await sleep(400);
}

const register = (base, name, email) =>
  fetch(`${base}/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, email, password: "hunter2hunter2" }),
  }).then((r) => r.json());

const presence = (base) => fetch(`${base}/presence`).then((r) => r.json());

/* ------------------------------------------- the offer runs out and stays out */
{
  group("the seats run out, and stay out across a restart");
  const dir = mkdtempSync(join(tmpdir(), "ff-founding-"));
  const dataFile = join(dir, "floor-data.json");
  let h = await boot({ dataFile, port: 3391, seats: 3 });

  const seats = [];
  for (let i = 1; i <= 5; i++) {
    const r = await register(h.base, `Person ${i}`, `p${i}@example.com`);
    seats.push(r.foundingSeat ?? 0);
  }
  check(
    JSON.stringify(seats) === JSON.stringify([1, 2, 3, 0, 0]),
    "the first three get seats 1-3 and the rest get nothing",
    seats.join(","),
  );

  const p1 = await presence(h.base);
  check(p1.founding?.total === 3 && p1.founding?.left === 0, "the public counter reaches zero",
    JSON.stringify(p1.founding));

  await stop(h);
  h = await boot({ dataFile, port: 3392, seats: 3 });
  const p2 = await presence(h.base);
  check(p2.founding?.left === 0, "a restart does not reopen the offer", JSON.stringify(p2.founding));

  const r6 = await register(h.base, "Person 6", "p6@example.com");
  check(!r6.foundingSeat, "and nobody gets a seat after the restart either", JSON.stringify(r6.foundingSeat));

  // the entitlement itself is what makes it a membership, not just a badge
  const saved = JSON.parse(readFileSync(dataFile, "utf8"));
  const first = Object.values(saved.accounts).find((a) => a.foundingSeat === 1);
  check(first?.paid?.tier === "founder" && first?.paid?.badge === "founding",
    "a seat is a real Founder+ entitlement, not a decoration",
    JSON.stringify(first?.paid));
  check(!("expires" in (first?.paid ?? {})), "and it carries no expiry");

  await stop(h);
  rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------- people who joined before the offer existed */
{
  group("REGRESSION: accounts older than the offer get the seats first");
  // Was: the offer said "the first twenty people to join" and gave nothing
  // to the people who had already joined, because their accounts predated
  // the code that grants a seat.
  const dir = mkdtempSync(join(tmpdir(), "ff-backfill-"));
  const dataFile = join(dir, "floor-data.json");

  const acct = (name, created) => ({
    id: `acct_${name}`,
    name,
    email: `${name}@example.com`,
    salt: "00000000000000000000000000000000",
    hash: "0".repeat(128),
    kdf: { N: 16384, r: 8, p: 1 },
    devices: [],
    created,
  });
  writeFileSync(
    dataFile,
    JSON.stringify({
      accounts: {
        // deliberately out of order in the file: creation time decides, not
        // whatever order the JSON happened to be written in
        carol: acct("carol", 3000),
        alice: acct("alice", 1000),
        bob: acct("bob", 2000),
      },
    }),
  );

  const h = await boot({ dataFile, port: 3393, seats: 2 });
  const p = await presence(h.base);
  check(p.founding?.left === 0, "the two free seats went to the two oldest accounts",
    JSON.stringify(p.founding));

  const r = await register(h.base, "Dave", "dave@example.com");
  check(!r.foundingSeat, "a newcomer gets nothing once the backfill used them up");

  await stop(h);
  const saved = JSON.parse(readFileSync(dataFile, "utf8"));
  check(saved.accounts.alice?.foundingSeat === 1, "alice (oldest) holds seat 1",
    String(saved.accounts.alice?.foundingSeat));
  check(saved.accounts.bob?.foundingSeat === 2, "bob (next) holds seat 2",
    String(saved.accounts.bob?.foundingSeat));
  check(!saved.accounts.carol?.foundingSeat, "carol (newest) holds none",
    String(saved.accounts.carol?.foundingSeat));

  rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------- a broken cap must close, not open */
{
  group("REGRESSION: a garbled seat count closes the offer rather than opening it");
  // Was: Number("twenty") is NaN, every `used >= cap` comparison is false,
  // and everyone who ever registers gets a free lifetime membership.
  const dir = mkdtempSync(join(tmpdir(), "ff-nan-"));
  const dataFile = join(dir, "floor-data.json");
  const h = await boot({ dataFile, port: 3394, seats: "twenty" });
  const p = await presence(h.base);
  check(p.founding?.total === 20, "an unparseable FOUNDING_SEATS falls back to 20",
    JSON.stringify(p.founding));
  await stop(h);
  rmSync(dir, { recursive: true, force: true });
}

console.log(bad === 0 ? "\nALL CHECKS PASSED" : `\n${bad} CHECK(S) FAILED`);
process.exit(bad ? 1 : 0);
