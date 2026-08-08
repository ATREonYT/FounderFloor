/**
 * Trials and referrals, end to end: `node server/test/trial-referral.mjs`.
 *
 * Boots a real server against a scratch data file and drives it over HTTP,
 * because everything that can go wrong here is about state surviving a
 * restart or an entitlement being quietly overwritten, and neither is
 * visible from a unit test of the grant helpers.
 *
 * Time is the awkward part: a 7-day trial cannot be waited out. Expiry is
 * therefore tested by writing a past `until` into the data file and
 * restarting, which is also exactly what the server will meet in
 * production at 3am on the eighth day.
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
const DAY = 86_400_000;

async function boot({ dataFile, port, seats = 0, env = {} }) {
  const proc = spawn(process.execPath, [SERVER], {
    env: {
      ...process.env,
      FF_DATA_FILE: dataFile,
      PORT_WS: String(port),
      // Seats off by default: a founding seat is a permanent entitlement
      // and would mask every trial behaviour under test.
      FOUNDING_SEATS: String(seats),
      ...env,
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
      if ((await fetch(`${base}/health`)).ok) return { proc, base, log: () => log };
    } catch {
      /* not up */
    }
    await sleep(100);
  }
  throw new Error(`server did not start\n${log}`);
}

const stop = async (h) => {
  h.proc.kill("SIGTERM");
  await sleep(400);
};

const post = (base, path, body) =>
  fetch(base + path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => r.json());

const register = (base, name, ref) =>
  post(base, "/auth/register", {
    name,
    email: `${name.toLowerCase()}@example.com`,
    password: "hunter2hunter2",
    ...(ref ? { ref } : {}),
  });

const state = (base, id, token) =>
  fetch(`${base}/state?me=${encodeURIComponent(id)}`, {
    headers: { authorization: `Bearer ${token}` },
  }).then((r) => r.json());

/* ------------------------------------------------------------ the trial */
{
  group("the trial");
  const dir = mkdtempSync(join(tmpdir(), "ff-trial-"));
  const dataFile = join(dir, "floor-data.json");
  let h = await boot({ dataFile, port: 3491 });

  const a = await register(h.base, "Ann");
  let st = await state(h.base, a.id, a.token);
  check(st.paid === null, "a new account has no entitlement", JSON.stringify(st.paid));
  check(st.perks?.trial?.used === false, "and has not used its trial");
  check(typeof st.perks?.referral?.code === "string" && st.perks.referral.code.length >= 4,
    "but does get a referral code", st.perks?.referral?.code);

  const started = await post(h.base, "/trial/start", { token: a.token });
  check(started.ok === true && started.days === 7, "starting gives 7 days", JSON.stringify(started.days));

  st = await state(h.base, a.id, a.token);
  check(st.paid?.tier === "founder", "the trial is a real Founder+ entitlement", JSON.stringify(st.paid?.tier));
  const left = (st.paid.until - Date.now()) / DAY;
  check(left > 6.9 && left < 7.01, "and it ends in seven days", `${left.toFixed(3)} days`);

  const again = await post(h.base, "/trial/start", { token: a.token });
  check(!again.ok && /already/.test(again.error || ""), "it cannot be started twice", again.error);

  await stop(h);

  /* ---- expiry. Rewritten into the file rather than waited out. */
  const saved = JSON.parse(readFileSync(dataFile, "utf8"));
  const rec = Object.values(saved.accounts).find((x) => x.id === a.id);
  rec.paid.until = Date.now() - 1000;
  writeFileSync(dataFile, JSON.stringify(saved));

  h = await boot({ dataFile, port: 3492 });
  st = await state(h.base, a.id, a.token);
  check(st.paid === null, "an expired trial reads as no entitlement", JSON.stringify(st.paid));
  check(st.perks?.trial?.used === true, "and is still marked used, so it cannot be restarted");
  const retry = await post(h.base, "/trial/start", { token: a.token });
  check(!retry.ok, "restarting after expiry is refused", retry.error);

  await stop(h);
  rmSync(dir, { recursive: true, force: true });
}

/* --------------------------------------------------------- the referral */
{
  group("referrals");
  const dir = mkdtempSync(join(tmpdir(), "ff-ref-"));
  const dataFile = join(dir, "floor-data.json");
  const h = await boot({ dataFile, port: 3493 });

  const host = await register(h.base, "Host");
  const code = (await state(h.base, host.id, host.token)).perks.referral.code;

  const guest = await register(h.base, "Guest", code);
  check(guest.referredBy === "Host", "the joiner is told who invited them", guest.referredBy);

  const hs = await state(h.base, host.id, host.token);
  check(hs.perks.referral.joined === 1, "the referrer's count goes up", String(hs.perks.referral.joined));
  check(hs.perks.referral.daysEarned === 7, "and they earn 7 days", String(hs.perks.referral.daysEarned));
  check(hs.paid?.tier === "founder", "which is a live entitlement, not a coupon");

  check(hs.perks.trial.used === false, "and crediting an invite does NOT burn their own trial");

  const gs = await state(h.base, guest.id, guest.token);
  check(gs.paid?.tier === "founder", "the joiner's welcome days are live too");
  const gdays = (gs.paid.until - Date.now()) / DAY;
  check(gdays > 6.9 && gdays < 7.01, "and there are seven of them", `${gdays.toFixed(2)} days`);
  check(gs.perks.referral.daysEarned === 0,
    "the welcome is a gift, not something they earned by inviting anyone",
    String(gs.perks.referral.daysEarned));
  check(gs.perks.trial.used === false, "and their own trial is untouched");

  // Both halves of what the invite promised: days for joining, AND the
  // trial for trying. The second stacks onto the end of the first.
  const gt = await post(h.base, "/trial/start", { token: guest.token });
  check(gt.ok === true && gt.days === 7, "so they can still start it", JSON.stringify(gt));
  const gs2 = await state(h.base, guest.id, guest.token);
  const stacked = (gs2.paid.until - Date.now()) / DAY;
  check(stacked > 13.9 && stacked < 14.01, "and it stacks to fourteen days", `${stacked.toFixed(2)} days`);

  // ...but the referrer, having burned nothing, can still start theirs too
  const ht = await post(h.base, "/trial/start", { token: host.token });
  check(ht.ok === true, "the referrer can still start their trial as well", ht.error);

  const bogus = await register(h.base, "Nobody", "zzzzzzz");
  check(!bogus.referredBy, "an unknown code is ignored rather than erroring");

  await stop(h);
  rmSync(dir, { recursive: true, force: true });
}

/* --------------------------- REGRESSION: never overwrite a permanent grant */
{
  group("REGRESSION: a permanent entitlement is never given an expiry");
  // A founding seat and a paid subscription have nothing to extend. Writing
  // a trial over one would turn a membership into a countdown.
  const dir = mkdtempSync(join(tmpdir(), "ff-perm-"));
  const dataFile = join(dir, "floor-data.json");
  const h = await boot({ dataFile, port: 3494, seats: 1 });

  const founder = await register(h.base, "Founder"); // takes the one seat
  const fs1 = await state(h.base, founder.id, founder.token);
  check(fs1.paid?.badge === "founding" && fs1.paid.until === undefined,
    "the founding seat is permanent", JSON.stringify(fs1.paid));

  const t = await post(h.base, "/trial/start", { token: founder.token });
  check(!t.ok, "they cannot start a trial on top of it", t.error);

  // ...and a referral must not turn their membership into a trial either
  const code = fs1.perks.referral.code;
  await register(h.base, "Friend", code);
  const fs2 = await state(h.base, founder.id, founder.token);
  check(fs2.paid?.until === undefined, "and a referral leaves it permanent",
    JSON.stringify(fs2.paid));
  check(fs2.paid?.badge === "founding", "with the badge intact");
  check(fs2.perks.referral.joined === 1, "while still counting the invite");
  // Nothing was credited, and nothing pretends otherwise — ReferralCard
  // reads exactly these numbers and drops its "you earn days" half when
  // the member is permanent.
  check(fs2.perks.referral.daysEarned === 0,
    "and crediting nothing is reported as nothing", String(fs2.perks.referral.daysEarned));

  await stop(h);
  rmSync(dir, { recursive: true, force: true });
}

/* ------------- REGRESSION: a seat granted over a trial is filed as a seat */
{
  group("REGRESSION: a founding seat does not inherit a trial's provenance");
  // Was: grantFoundingSeat inherited customer and ts from whatever was
  // there, so a seat backfilled onto a trialling account was recorded as
  // customer "trial", dated to the day the trial started. The console and
  // /admin/subscribers then read it as a trial that never ends.
  const dir = mkdtempSync(join(tmpdir(), "ff-prov-"));
  const dataFile = join(dir, "floor-data.json");
  let h = await boot({ dataFile, port: 3497, seats: 0 });

  const a = await register(h.base, "Early");
  await post(h.base, "/trial/start", { token: a.token });
  const before = await state(h.base, a.id, a.token);
  check(before.paid.customer === "trial", "the trial is filed as a trial", before.paid.customer);
  await stop(h);

  // reboot with a seat available: the backfill picks the oldest account up
  h = await boot({ dataFile, port: 3498, seats: 1 });
  const after = await state(h.base, a.id, a.token);
  check(after.paid.badge === "founding", "the backfill gave them the seat");
  check(after.paid.until === undefined, "and it is permanent", JSON.stringify(after.paid.until));
  check(/^founding-seat-/.test(after.paid.customer),
    "and it is filed as a seat, not as a trial", after.paid.customer);
  check(after.paid.ts >= before.paid.ts, "dated to the grant, not to the trial",
    `${after.paid.ts} vs ${before.paid.ts}`);

  await stop(h);
  rmSync(dir, { recursive: true, force: true });
}

/* --------------------------------- REGRESSION: the cap actually caps */
{
  group("REGRESSION: referral days are capped");
  // The cap is the only real defence against somebody registering a dozen
  // addresses and referring themselves, so it has to hold.
  //
  // The cap is lowered by env for this test rather than farming out the
  // default 63 days. At 7 days a head that needs ten referrals, and the
  // auth rate limit is ten POSTs per IP per minute — so the honest version
  // of this test either sleeps for a minute or proves nothing. Three
  // referrals against a two-referral cap proves the same thing in seconds.
  const dir = mkdtempSync(join(tmpdir(), "ff-cap-"));
  const dataFile = join(dir, "floor-data.json");
  const h = await boot({ dataFile, port: 3495, env: { MAX_REFERRAL_DAYS: "14" } });

  const host = await register(h.base, "Farmer");
  const code = (await state(h.base, host.id, host.token)).perks.referral.code;
  for (let i = 0; i < 4; i++) await register(h.base, `Sock${i}`, code);

  const hs = await state(h.base, host.id, host.token);
  check(hs.perks.referral.joined === 4, "every invite is counted", String(hs.perks.referral.joined));
  check(hs.perks.referral.daysEarned === hs.perks.referral.daysCap,
    "but the days stop at the cap", `${hs.perks.referral.daysEarned}/${hs.perks.referral.daysCap}`);
  const days = (hs.paid.until - Date.now()) / DAY;
  check(days < hs.perks.referral.daysCap + 1, "and the entitlement matches the cap",
    `${days.toFixed(1)} days`);
  check(hs.perks.referral.daysCap === 14, "the cap is the configured one", String(hs.perks.referral.daysCap));

  await stop(h);
  rmSync(dir, { recursive: true, force: true });
}

/* ------------------------- REGRESSION: self-referral by your own code */
{
  group("REGRESSION: a code cannot be redeemed onto itself");
  const dir = mkdtempSync(join(tmpdir(), "ff-self-"));
  const dataFile = join(dir, "floor-data.json");
  const h = await boot({ dataFile, port: 3496 });
  const a = await register(h.base, "Solo");
  const code = (await state(h.base, a.id, a.token)).perks.referral.code;
  // registering again with the same name/email is refused anyway; the point
  // is that the code belongs to an account that already exists
  const dup = await register(h.base, "Solo", code);
  check(Boolean(dup.error), "the duplicate account is refused outright", dup.error);
  const st = await state(h.base, a.id, a.token);
  check(st.perks.referral.joined === 0, "and nothing was credited", String(st.perks.referral.joined));
  await stop(h);
  rmSync(dir, { recursive: true, force: true });
}

/* ---------------- REGRESSION: a code minted on a read reaches the disk */
{
  group("REGRESSION: a code minted on a read is written to disk");
  // ensureReferralCode is reachable from GET /state, a path that schedules
  // no write of its own. Without one, a member copies a link that the next
  // restart quietly reassigns — and an unknown code is IGNORED rather than
  // refused, so neither side sees an error, they just never get their days.
  const dir = mkdtempSync(join(tmpdir(), "ff-code-"));
  const dataFile = join(dir, "floor-data.json");
  let h = await boot({ dataFile, port: 3499 });
  const a = await register(h.base, "Older");
  await stop(h);

  // Age the account into one that predates invites entirely.
  const saved = JSON.parse(readFileSync(dataFile, "utf8"));
  delete Object.values(saved.accounts).find((x) => x.id === a.id).ref;
  writeFileSync(dataFile, JSON.stringify(saved));

  h = await boot({ dataFile, port: 3500 });
  const code = (await state(h.base, a.id, a.token)).perks.referral.code;
  check(typeof code === "string" && code.length >= 4, "an older account is issued one", code);
  await stop(h);

  const onDisk = Object.values(JSON.parse(readFileSync(dataFile, "utf8")).accounts).find(
    (x) => x.id === a.id,
  ).ref;
  check(onDisk === code, "and it is saved, not just held in memory", `${onDisk} vs ${code}`);

  h = await boot({ dataFile, port: 3501 });
  const again = (await state(h.base, a.id, a.token)).perks.referral.code;
  check(again === code, "so a restart does not hand out a different one", `${again} vs ${code}`);
  const friend = await register(h.base, "Reader", code);
  check(friend.referredBy === "Older", "and a link already in circulation still works",
    friend.referredBy);

  await stop(h);
  rmSync(dir, { recursive: true, force: true });
}

/* ------------- REGRESSION: an ended window says so, and reopens cleanly */
{
  group("REGRESSION: a lapsed window is announced, and reopening it is a new grant");
  const dir = mkdtempSync(join(tmpdir(), "ff-lapse-"));
  const dataFile = join(dir, "floor-data.json");
  let h = await boot({ dataFile, port: 3502 });

  const a = await register(h.base, "Lapser");
  await post(h.base, "/trial/start", { token: a.token });
  const code = (await state(h.base, a.id, a.token)).perks.referral.code;
  await stop(h);

  // A month-old trial that ended yesterday.
  const saved = JSON.parse(readFileSync(dataFile, "utf8"));
  const rec = Object.values(saved.accounts).find((x) => x.id === a.id);
  rec.paid.until = Date.now() - DAY;
  rec.paid.ts = Date.now() - 30 * DAY;
  writeFileSync(dataFile, JSON.stringify(saved));

  h = await boot({ dataFile, port: 3503 });
  let st = await state(h.base, a.id, a.token);
  check(st.paid === null, "the entitlement is gone", JSON.stringify(st.paid));
  // The client applies a null `paid` because `perks` arrived with it —
  // that pairing is how it tells "your window ended" from "this deploy has
  // no billing configured". Without it the trial expires on the server and
  // never expires in the browser.
  check(st.perks !== null && st.perks !== undefined,
    "but the server still answers with perks, which is what makes the null authoritative");
  check(st.perks.trial.used === true, "and the trial still reads as used");

  await register(h.base, "Latecomer", code);
  st = await state(h.base, a.id, a.token);
  check(st.paid?.tier === "founder", "an invite reopens the window");
  check(Date.now() - st.paid.ts < 60_000,
    "stamped as a NEW grant, so the client announces it instead of upgrading in silence",
    `ts is ${((Date.now() - st.paid.ts) / DAY).toFixed(1)} days old`);
  const days = (st.paid.until - Date.now()) / DAY;
  check(days > 6.9 && days < 7.01, "and it runs from today, not from the old expiry",
    `${days.toFixed(2)} days`);
  check(st.perks.trial.until === st.paid.until, "and the countdown matches the entitlement");

  await stop(h);
  rmSync(dir, { recursive: true, force: true });
}

/* -------------- REGRESSION: switching the offer off must not kill the hall */
{
  group("REGRESSION: TRIAL_DAYS=0 refuses the trial instead of killing the server");
  // grantTrialDays returns without assigning acct.paid when there are no
  // days to give. /trial/start used to reach into acct.paid.until anyway,
  // and a throw in a fire-and-forget route handler is not a failed request
  // on this process — it is Node exiting, every floor emptying, and a
  // restart loop that any account with a token can re-trigger at will.
  // TRIAL_DAYS=0 is the obvious way to close the offer, and `TRIAL_DAYS=`
  // with nothing after it parses to the same thing.
  const dir = mkdtempSync(join(tmpdir(), "ff-zero-"));
  const dataFile = join(dir, "floor-data.json");
  const h = await boot({ dataFile, port: 3504, env: { TRIAL_DAYS: "0" } });

  const a = await register(h.base, "Zero");
  const t = await post(h.base, "/trial/start", { token: a.token });
  check(!t.ok && typeof t.error === "string", "the request is answered, not dropped", JSON.stringify(t));

  const alive = await fetch(`${h.base}/health`).then((r) => r.ok).catch(() => false);
  check(alive, "and the server is still standing");

  const st = await state(h.base, a.id, a.token);
  check(st.paid === null, "nothing was granted", JSON.stringify(st.paid));
  check(st.perks.trial.used === false,
    "and the trial was not burned for zero days either");

  // Same account, second go: without the fix this is the crash loop.
  const again = await post(h.base, "/trial/start", { token: a.token });
  check(!again.ok, "asking twice is refused twice", again.error);
  const stillAlive = await fetch(`${h.base}/health`).then((r) => r.ok).catch(() => false);
  check(stillAlive, "with the hall still open");

  await stop(h);
  rmSync(dir, { recursive: true, force: true });
}

console.log(bad === 0 ? "\nALL CHECKS PASSED" : `\n${bad} CHECK(S) FAILED`);
process.exit(bad ? 1 : 0);
