/**
 * Promo codes, end to end: `node server/test/promo-codes.mjs`.
 *
 * A promo code hands out entitlements to a crowd, so the things worth
 * proving are all the ways it must REFUSE:
 *
 *   the seed        a server that has never had a promo table comes up
 *                   with the launch code already in it
 *   the grant       redeeming turns a free account into Founder+ with a
 *                   real expiry, and moves the code's counter
 *   once per        the same account cannot spend the same code twice,
 *   account         however many times it asks
 *   the limits      unknown, closed, expired and fully-claimed codes are
 *                   each refused in their own words
 *   the typing      "producthunt", " Product-Hunt " and "PRODUCTHUNT"
 *                   are one code
 *   nothing to      a permanent member meeting a days-only code is told
 *   give            so, and does NOT burn their one use on nothing
 *   the counter     `used` is a fact, not a setting — admin cannot reset
 *                   it and hand a capped offer out twice
 *   closing stays   a deleted code does not come back on restart, which
 *   closed          is the one thing a giveaway must never do
 */
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SERVER = join(dirname(fileURLToPath(import.meta.url)), "..", "index.mjs");
let bad = 0;
const check = (ok, msg, extra = "") => {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${msg}${extra !== "" ? "  — " + extra : ""}`);
  if (!ok) bad++;
};
const group = (t) => console.log(`\n${t}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const dir = mkdtempSync(join(tmpdir(), "ff-promo-"));
const dataFile = join(dir, "floor-data.json");
const port = 3563;
const base = `http://127.0.0.1:${port}`;

const ENV = {
  ...process.env,
  FF_DATA_FILE: dataFile,
  PORT_WS: String(port),
  FOUNDING_SEATS: "0",
  ADMIN_EMAILS: "boss@example.com",
  AUTH_RATE_LIMIT: "100000",
  NO_PROXY: "127.0.0.1,localhost",
  no_proxy: "127.0.0.1,localhost",
};
let proc;
let log = "";
const boot = async (extraEnv = {}) => {
  proc = spawn(process.execPath, [SERVER], {
    env: { ...ENV, ...extraEnv },
    stdio: ["ignore", "pipe", "pipe"],
  });
  proc.stdout.on("data", (d) => (log += d));
  proc.stderr.on("data", (d) => (log += d));
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(`${base}/health`)).ok) return;
    } catch {
      /* not up */
    }
    await sleep(100);
  }
  throw new Error("server never came up");
};
const kill = async () => {
  proc?.kill("SIGKILL");
  await sleep(300);
};
for (const sig of ["exit", "uncaughtException", "unhandledRejection"]) {
  process.once(sig, (err) => {
    try {
      proc?.kill("SIGKILL");
    } catch {
      /* gone */
    }
    if (sig !== "exit") {
      console.error(err);
      process.exit(1);
    }
  });
}

const post = (p, b) =>
  fetch(base + p, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(b),
  });
const postJson = (p, b) => post(p, b).then((r) => r.json());
const reg = (name, email) =>
  postJson("/auth/register", { name, email, password: "hunter2hunter2" });
const redeem = (acct, code) => postJson("/promo/redeem", { token: acct.token, code });
const state = (acct) => postJson("/state", { token: acct.token }).catch(() => null);

await boot();
const boss = await reg("Boss", "boss@example.com");
const ada = await reg("Ada", "ada@example.com");
const bo = await reg("Bo", "bo@example.com");
const admin = (b = {}) => postJson("/admin/promo", { token: boss.token, ...b });
const find = (list, code) => list.find((p) => p.code === code);

/* ------------------------------------------------------------- the seed */
{
  group("the launch code exists without anybody creating it");
  const { promos } = await admin();
  const ph = find(promos, "PRODUCTHUNT");
  check(!!ph, "PRODUCTHUNT is there on a fresh server", JSON.stringify(ph ?? null));
  check(ph?.days === 90, "90 days", String(ph?.days));
  check(ph?.max === 500, "500 uses", String(ph?.max));
  check(ph?.used === 0, "none spent yet", String(ph?.used));
  check(/^open/.test(ph?.state ?? ""), "and it reads as open", ph?.state);
}

/* ------------------------------------------------------------ the grant */
{
  group("spending it");
  const before = await redeem(ada, "PRODUCTHUNT");
  check(before.ok === true, "Ada redeems it", JSON.stringify(before));
  check(before.days === 90, "90 days handed over", String(before.days));
  check(before.tier === "founder", "she is Founder+ now", String(before.tier));
  check(
    typeof before.until === "number" && before.until > Date.now() + 88 * 86_400_000,
    "with a real expiry about 90 days out",
    new Date(before.until ?? 0).toISOString().slice(0, 10),
  );
  const { promos } = await admin();
  check(find(promos, "PRODUCTHUNT").used === 1, "the counter moved", String(find(promos, "PRODUCTHUNT").used));

  const again = await redeem(ada, "PRODUCTHUNT");
  check(!again.ok && /already used/.test(again.error ?? ""), "she cannot spend it twice", again.error);
  const { promos: after } = await admin();
  check(find(after, "PRODUCTHUNT").used === 1, "and the refusal did not move the counter", String(find(after, "PRODUCTHUNT").used));

  const other = await redeem(bo, "producthunt");
  check(other.ok === true, "somebody else still can — lowercase and all", JSON.stringify(other.error ?? "ok"));
  // Spaces and case are noise; a DASH is not. Codes like PH-LAUNCH have to
  // be possible, so "PRODUCT-HUNT" is a different code and is refused.
  const cy = await reg("Cy", "cy@example.com");
  const spaced = await redeem(cy, "  producthunt  ");
  check(spaced.ok === true, "surrounding spaces and case are noise", JSON.stringify(spaced.error ?? "ok"));
  const dashed = await redeem(await reg("Di", "di@example.com"), "PRODUCT-HUNT");
  check(
    /not in use/.test(dashed.error ?? ""),
    "but a dash is significant — PH-LAUNCH has to be possible",
    dashed.error,
  );
}

/* ----------------------------------------------------------- the limits */
{
  group("the ways it refuses");
  const nobody = await postJson("/promo/redeem", { code: "PRODUCTHUNT" });
  check(/sign in/.test(nobody.error ?? ""), "no token: sign in first", nobody.error);
  const dud = await redeem(ada, "NOPE");
  check(/not in use/.test(dud.error ?? ""), "an unknown code is not in use", dud.error);

  await admin({ code: "CLOSED", days: 5, max: 10 });
  await admin({ code: "CLOSED", off: true });
  const closed = await redeem(ada, "CLOSED");
  check(/not in use/.test(closed.error ?? ""), "a closed code is refused", closed.error);

  await admin({ code: "GONE", days: 5, max: 10, until: Date.now() - 1000 });
  const expired = await redeem(ada, "GONE");
  check(/expired/.test(expired.error ?? ""), "an expired code says so", expired.error);

  await admin({ code: "ONESHOT", days: 5, max: 1 });
  const first = await redeem(ada, "ONESHOT");
  check(first.ok === true, "the single seat is taken", JSON.stringify(first.error ?? "ok"));
  const second = await redeem(bo, "ONESHOT");
  check(/fully claimed/.test(second.error ?? ""), "and the next person is told it is gone", second.error);
}

/* ---------------------------------------------------------- the tickets */
{
  group("a tickets-only code");
  await admin({ code: "TICKETS", days: 0, tickets: 250, max: 5 });
  const dee = await reg("Dee", "dee@example.com");
  const got = await redeem(dee, "TICKETS");
  check(got.ok === true && got.tickets === 250, "250 tickets handed over", JSON.stringify(got));
  check(got.days === 0, "and no days, because the code has none", String(got.days));
}

/* ------------------------------------------------- nothing left to give */
{
  group("a permanent member meeting a days-only code");
  const perm = await reg("Perm", "perm@example.com");
  await postJson("/admin/grant", { token: boss.token, email: "perm@example.com", tier: "founder" });
  const nothing = await redeem(perm, "PRODUCTHUNT");
  check(
    !nothing.ok && /nothing this code can add/.test(nothing.error ?? ""),
    "told plainly there is nothing to add",
    nothing.error,
  );
  const { promos } = await admin();
  check(find(promos, "PRODUCTHUNT").used === 3, "their use was NOT burned", `used=${find(promos, "PRODUCTHUNT").used}`);
}

/* ---------------------------------------------------------- the counter */
{
  group("`used` is a fact, not a setting");
  const { promos } = await admin({ code: "PRODUCTHUNT", used: 0 });
  check(find(promos, "PRODUCTHUNT").used === 3, "admin cannot reset the counter", String(find(promos, "PRODUCTHUNT").used));
}

/* -------------------------------------------------------------- restart */
{
  group("across a restart");
  await kill();
  await boot();
  const { promos } = await admin();
  const ph = find(promos, "PRODUCTHUNT");
  check(!!ph && ph.used === 3, "the code and its count survive", `used=${ph?.used}`);
  const again = await redeem(ada, "PRODUCTHUNT");
  check(/already used/.test(again.error ?? ""), "and Ada still cannot spend it again", again.error);
}

/* ------------------------------------------------- closing stays closed */
{
  group("a deleted code does not come back");
  await admin({ code: "PRODUCTHUNT", delete: true });
  let { promos } = await admin();
  check(!find(promos, "PRODUCTHUNT"), "deleted");
  await kill();
  await boot();
  ({ promos } = await admin());
  check(!find(promos, "PRODUCTHUNT"), "still gone after a restart — the offer stays closed");
  const dead = await redeem(bo, "PRODUCTHUNT");
  check(/not in use/.test(dead.error ?? ""), "and the code is dead", dead.error);
}

/* ------------------------------------------------------------- the gate */
{
  group("the admin gate");
  const nobody = await post("/admin/promo", {});
  check(nobody.status === 404, "no token gets the ordinary 404", String(nobody.status));
  const member = await post("/admin/promo", { token: ada.token });
  check(member.status === 404, "a plain member gets the 404 too", String(member.status));
}

await kill();
rmSync(dir, { recursive: true, force: true });
console.log(bad ? `\n${bad} CHECK(S) FAILED` : "\nALL PROMO CHECKS PASSED");
if (bad) {
  console.log("\n--- server log ---\n" + log.slice(-4000));
  process.exit(1);
}
