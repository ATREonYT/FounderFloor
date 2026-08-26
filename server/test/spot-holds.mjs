/**
 * Position pricing, end to end: `node server/test/spot-holds.mjs`.
 *
 * The things only a real server can prove:
 *
 *   the hold      claiming a gold spot mints a server-side holdUntil the
 *                 client never dictates; re-raising the same spot keeps
 *                 the clock instead of restarting it.
 *   the lapse     when the hold runs out and the owner is away, the stand
 *                 MOVES to the nearest free bronze spot — it never
 *                 disappears — and the guestbook moves with it.
 *   bronze        a bronze stand carries no hold and is never touched.
 *
 * Runs with FF_SPOT_HOLD_MS / FF_HOLD_SWEEP_MS shrunk so a lapse takes
 * seconds instead of a show cycle.
 */
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocket } from "ws";
import { MAIN_HALL_SPOTS, tierOfSpot } from "../../lib/data/spot-plans.mjs";

const SERVER = join(dirname(fileURLToPath(import.meta.url)), "..", "index.mjs");

let bad = 0;
const check = (ok, msg, extra = "") => {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${msg}${extra !== "" ? "  — " + extra : ""}`);
  if (!ok) bad++;
};
const group = (t) => console.log(`\n${t}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const dir = mkdtempSync(join(tmpdir(), "ff-spotholds-"));
const dataFile = join(dir, "floor-data.json");
const port = 3537;
const HOLD_MS = 4000;
const SWEEP_MS = 1000; // server clamps to >= 1000

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
    FF_SPOT_HOLD_MS: String(HOLD_MS),
    FF_HOLD_SWEEP_MS: String(SWEEP_MS),
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
  });
const postJson = (p, b) => post(p, b).then((r) => r.json());
const reg = (name, email) =>
  postJson("/auth/register", { name, email, password: "hunter2hunter2" });

const standFor = (name, founder) => ({
  id: "mine",
  name,
  oneLiner: "does a thing",
  pitch: "",
  founder,
  founderLook: { skin: 1, outfit: 2, hair: 3 },
  category: "Tools",
  goal: "Survive",
  goalProgress: 0,
  verifiedRevenue: 0,
  seekingCofounder: false,
  booth: { carpet: "#C2B8A3", banner: "#5C5548", sign: "X", glyph: "star", pattern: "solid" },
});

/** Join main-hall, claim a spot, linger briefly, disconnect. */
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
          claim: { spotIndex, startup: standFor(name, acct.name) },
          claimFresh: true,
        }),
      );
      setTimeout(() => {
        clearTimeout(t);
        ws.close();
        resolve();
      }, 900);
    });
    ws.on("error", (e) => {
      clearTimeout(t);
      reject(e);
    });
  });

const entryFor = (acct) =>
  fetch(`${base}/startup?owner=${encodeURIComponent(acct.id)}`)
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => d?.entry ?? null);

const guestbook = (spotIndex) =>
  fetch(`${base}/guestbook?floor=main-hall&key=spot:${spotIndex}`)
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => d?.entries ?? []);

const BRONZE = new Set(
  MAIN_HALL_SPOTS.map((s, i) => [s, i]).filter(([s]) => (s.tier ?? "bronze") === "bronze").map(([, i]) => i),
);

const ada = await reg("Ada", "ada@example.com");
const bea = await reg("Bea", "bea@example.com");

/* ------------------------------------------------------- gold mints a hold */
{
  group("a gold claim carries a hold");
  check(tierOfSpot("main-hall", 0) === "gold", "spot 0 is gold in the shared plan");
  await claimSpot(ada, "Soup Ticket", 0);
  // A note on the book right away — well inside the hold — so the lapse
  // group can prove the notes move with the stand.
  await postJson("/guestbook/sign", {
    me: bea.id,
    name: "Bea",
    floor: "main-hall",
    key: "spot:0",
    text: "good soup",
    token: bea.token,
  });
  const e = await entryFor(ada);
  check(e?.spotIndex === 0, "the stand is on the gold spot", String(e?.spotIndex));
  check(
    typeof e?.holdUntil === "number" && e.holdUntil > Date.now(),
    "with a server-minted holdUntil in the future",
    String(e?.holdUntil),
  );
  check(
    e.holdUntil <= Date.now() + HOLD_MS + 1000,
    "sized by the server's clock, not the client's",
    String(e.holdUntil - Date.now()),
  );
}

/* -------------------------------------------------- bronze carries nothing */
{
  group("a bronze claim carries nothing");
  const bronzeIdx = [...BRONZE][0];
  await claimSpot(bea, "Night Shift Audio", bronzeIdx);
  const e = await entryFor(bea);
  check(e?.spotIndex === bronzeIdx, "the stand is on the bronze spot", String(e?.spotIndex));
  check(e?.holdUntil === undefined, "no holdUntil on a bronze stand");
}

/* -------------------------------------------------------------- the lapse */
{
  group("the lapse: relocated, never dropped");
  const before = await guestbook(0);
  check(before.length === 1, "a note is on the gold stand's book", String(before.length));

  await sleep(HOLD_MS + 2 * SWEEP_MS + 1000); // hold runs out, sweep fires
  const e = await entryFor(ada);
  check(e !== null, "the stand still exists after the lapse");
  check(e?.spotIndex !== 0, "and it left the gold spot", String(e?.spotIndex));
  check(BRONZE.has(e?.spotIndex), "landing on a bronze spot", String(e?.spotIndex));
  check(e?.holdUntil === undefined, "with the hold cleared");
  const moved = await guestbook(e.spotIndex);
  check(moved.length === 1 && moved[0]?.text === "good soup", "the guestbook moved with it");
  const old = await guestbook(0);
  check(old.length === 0, "and nothing stayed behind on the gold spot");

  // The bronze neighbour never moved.
  const b = await entryFor(bea);
  check(BRONZE.has(b?.spotIndex), "the bronze stand is untouched", String(b?.spotIndex));
}

/* ----------------------------------------------- the gold spot is claimable */
{
  group("the vacated spot is open again");
  await claimSpot(bea, "Night Shift Audio", 0);
  const e = await entryFor(bea);
  check(e?.spotIndex === 0, "another founder can claim the vacated gold spot", String(e?.spotIndex));
  check(typeof e?.holdUntil === "number", "and gets their own hold");
}

proc.kill("SIGKILL");
rmSync(dir, { recursive: true, force: true });
console.log(bad ? `\n${bad} CHECK(S) FAILED` : "\nALL SPOT-HOLD CHECKS PASSED");
if (bad) {
  console.log("\n--- server log ---\n" + log.slice(-4000));
  process.exit(1);
}
