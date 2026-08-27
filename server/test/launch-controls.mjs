/**
 * The launch controls, end to end: `node server/test/launch-controls.mjs`.
 *
 * The things only a real server can prove:
 *
 *   expiry pause   while set, the sweep removes nothing — and the pause
 *                  SURVIVES A RESTART, which is most of its point. Resumed,
 *                  the sweep does its normal job.
 *   the annex      opening a floor puts it on /presence for every client;
 *                  a restart keeps it; closing it takes it away.
 *   the gate       the endpoint 404s exactly like the rest of /admin/*.
 *
 * Runs with FF_STAND_TTL_MS / FF_PRUNE_SWEEP_MS shrunk to seconds.
 */
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocket } from "ws";

const SERVER = join(dirname(fileURLToPath(import.meta.url)), "..", "index.mjs");

let bad = 0;
const check = (ok, msg, extra = "") => {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${msg}${extra !== "" ? "  — " + extra : ""}`);
  if (!ok) bad++;
};
const group = (t) => console.log(`\n${t}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const dir = mkdtempSync(join(tmpdir(), "ff-launchctl-"));
const dataFile = join(dir, "floor-data.json");
const port = 3547;
const TTL = 2000;
const SWEEP = 1000;

{
  const squatter = await fetch(`http://127.0.0.1:${port}/health`)
    .then((r) => r.ok)
    .catch(() => false);
  if (squatter) {
    console.error(`something is already listening on :${port} — kill it and re-run`);
    process.exit(1);
  }
}

const ENV = {
  ...process.env,
  FF_DATA_FILE: dataFile,
  PORT_WS: String(port),
  FF_STAND_TTL_MS: String(TTL),
  FF_PRUNE_SWEEP_MS: String(SWEEP),
  FOUNDING_SEATS: "0",
  ADMIN_EMAILS: "boss@example.com",
  AUTH_RATE_LIMIT: "500",
  NO_PROXY: "127.0.0.1,localhost",
  no_proxy: "127.0.0.1,localhost",
};

let proc;
let log = "";
const boot = async () => {
  proc = spawn(process.execPath, [SERVER], { env: ENV, stdio: ["ignore", "pipe", "pipe"] });
  proc.stdout.on("data", (d) => (log += d));
  proc.stderr.on("data", (d) => (log += d));
  const base = `http://127.0.0.1:${port}`;
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
for (const sig of ["exit", "uncaughtException", "unhandledRejection"]) {
  process.once(sig, (err) => {
    try {
      proc?.kill("SIGKILL");
    } catch {
      /* already gone */
    }
    if (sig !== "exit") {
      console.error(err);
      process.exit(1);
    }
  });
}

await boot();
const base = `http://127.0.0.1:${port}`;
const post = (p, b) =>
  fetch(base + p, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(b),
  });
const postJson = (p, b) => post(p, b).then((r) => r.json());
const reg = (name, email) =>
  postJson("/auth/register", { name, email, password: "hunter2hunter2" });

const claimSpot = (acct, name, spotIndex) =>
  new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws?floor=main-hall`);
    const t = setTimeout(() => {
      ws.close();
      reject(new Error("ws timeout"));
    }, 8000);
    ws.on("open", () => {
      ws.send(
        JSON.stringify({
          t: "join",
          player: { id: acct.id, name: acct.name, look: { skin: 0, outfit: 0, hair: 0 } },
          token: acct.token,
          s: { x: 900, y: 1100, dir: "down", moving: false },
          claim: {
            spotIndex,
            startup: {
              id: "mine", name, oneLiner: "does a thing", pitch: "", founder: acct.name,
              founderLook: { skin: 1, outfit: 2, hair: 3 }, category: "Tools", goal: "Survive",
              goalProgress: 0, verifiedRevenue: 0, seekingCofounder: false,
              booth: { carpet: "#C2B8A3", banner: "#5C5548", sign: "X", glyph: "star", pattern: "solid" },
            },
          },
          claimFresh: true,
        }),
      );
      setTimeout(() => {
        clearTimeout(t);
        ws.close();
        resolve();
      }, 700);
    });
    ws.on("error", (e) => {
      clearTimeout(t);
      reject(e);
    });
  });

const standExists = (acct) =>
  fetch(`${base}/startup?owner=${encodeURIComponent(acct.id)}`).then((r) => r.ok);
const presence = () => fetch(`${base}/presence`).then((r) => r.json());

const boss = await reg("Boss", "boss@example.com");
const ada = await reg("Ada", "ada@example.com");
const launch = (b = {}) => postJson("/admin/launch-controls", { token: boss.token, ...b });

/* ------------------------------------------------------------- the gate */
{
  group("the admin gate");
  const nobody = await post("/admin/launch-controls", {});
  check(nobody.status === 404, "no token gets the ordinary 404", String(nobody.status));
  const member = await post("/admin/launch-controls", { token: ada.token });
  check(member.status === 404, "a plain member gets the 404 too", String(member.status));
}

/* --------------------------------------------------------- expiry pause */
{
  group("expiry pause: on, restart, still on, off");
  const state0 = await launch();
  check(/running normally/.test(state0.expiryState), "reads as running before anything is set", state0.expiryState);

  await claimSpot(ada, "Soup Ticket", 16); // a bronze spot, no hold involved
  check(await standExists(ada), "the stand is up");

  const until = Date.now() + 60 * 60 * 1000;
  const paused = await launch({ standExpiryPausedUntil: until });
  check(/paused until/.test(paused.expiryState), "pause reads back in plain words", paused.expiryState);

  await sleep(TTL + 2 * SWEEP + 500); // well past the 2s TTL and several sweeps
  check(await standExists(ada), "the stand outlives its TTL while paused");

  proc.kill("SIGKILL");
  await sleep(300);
  await boot();
  const afterRestart = await launch();
  check(/paused until/.test(afterRestart.expiryState), "the pause survives a restart", afterRestart.expiryState);
  await sleep(TTL + 2 * SWEEP + 500);
  check(await standExists(ada), "and keeps protecting the stand");

  const resumed = await launch({ standExpiryPausedUntil: null });
  check(/running normally/.test(resumed.expiryState), "resume reads back", resumed.expiryState);
  await sleep(2 * SWEEP + 500);
  check(!(await standExists(ada)), "resumed, the sweep does its normal job");
}

/* ------------------------------------------------------------- the annex */
{
  group("the annex: open, restart, still open, close");
  const opened = await launch({ annex: { floor: "indie-alley", open: true } });
  check(opened.annexOpen.includes("indie-alley"), "opening lists the floor", opened.annexState);
  const p1 = await presence();
  check(
    Array.isArray(p1.annex) && p1.annex.includes("indie-alley"),
    "and every client sees it on /presence",
    JSON.stringify(p1.annex),
  );

  proc.kill("SIGKILL");
  await sleep(300);
  await boot();
  const p2 = await presence();
  check(
    Array.isArray(p2.annex) && p2.annex.includes("indie-alley"),
    "the open annex survives a restart",
    JSON.stringify(p2.annex),
  );

  const closed = await launch({ annex: { floor: "indie-alley", open: false } });
  check(!closed.annexOpen.includes("indie-alley"), "closing removes it", closed.annexState);
  const p3 = await presence();
  check(!(p3.annex ?? []).includes("indie-alley"), "and /presence agrees");
}

/* -------------------------------------------------- the special windows */
{
  group("special windows report as state");
  const st = await launch();
  check(typeof st.specialState === "string" && st.specialState.length > 0, "stated in plain words", st.specialState);
}

proc.kill("SIGKILL");
rmSync(dir, { recursive: true, force: true });
console.log(bad ? `\n${bad} CHECK(S) FAILED` : "\nALL LAUNCH-CONTROL CHECKS PASSED");
if (bad) {
  console.log("\n--- server log ---\n" + log.slice(-4000));
  process.exit(1);
}
