/**
 * The hall boards, end to end: `node server/test/leaderboard.mjs`.
 *
 * Worth a real server rather than unit tests, because the parts that can go
 * wrong are the seams: a state blob whose arcade half gets stripped on the
 * way in, a fabricated parkour time that gets clamped instead of dropped,
 * a week that rolls over without minting anybody an award. All three are
 * invisible from inside a single function.
 */
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { MIN_TIME, weekKey } from "../../lib/data/parkour-limits.mjs";

const SERVER = join(dirname(fileURLToPath(import.meta.url)), "..", "index.mjs");

let bad = 0;
const check = (ok, msg, extra = "") => {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${msg}${extra ? "  — " + extra : ""}`);
  if (!ok) bad++;
};
const group = (t) => console.log(`\n${t}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const dir = mkdtempSync(join(tmpdir(), "ff-board-"));
const dataFile = join(dir, "floor-data.json");
const port = 3524;

{
  const squatter = await fetch(`http://127.0.0.1:${port}/health`)
    .then((r) => r.ok)
    .catch(() => false);
  if (squatter) {
    console.error(`something is already listening on :${port} — kill it and re-run`);
    process.exit(1);
  }
}

const env = {
  ...process.env,
  FF_DATA_FILE: dataFile,
  PORT_WS: String(port),
  FOUNDING_SEATS: "0",
  AUTH_RATE_LIMIT: "500",
  NO_PROXY: "127.0.0.1,localhost",
  no_proxy: "127.0.0.1,localhost",
};
let proc = spawn(process.execPath, [SERVER], { env, stdio: ["ignore", "pipe", "pipe"] });
let log = "";
const watch = (p) => {
  p.stdout.on("data", (d) => (log += d));
  p.stderr.on("data", (d) => (log += d));
};
watch(proc);
for (const sig of ["exit", "uncaughtException", "unhandledRejection"]) {
  process.once(sig, (err) => {
    try {
      proc.kill("SIGKILL");
    } catch {
      /* already gone */
    }
    if (sig !== "exit") {
      console.error(err);
      console.error(log);
      process.exit(1);
    }
  });
}

const base = `http://127.0.0.1:${port}`;
const waitUp = async () => {
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
await waitUp();

const post = (p, b) =>
  fetch(base + p, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(b),
  }).then((r) => r.json());
const board = () => fetch(`${base}/leaderboard`).then((r) => r.json());

const reg = (name) =>
  post("/auth/register", {
    name,
    email: `${name.toLowerCase()}@example.com`,
    password: "hunter2hunter2",
  });

const stateOf = (acct) =>
  fetch(`${base}/state?me=${encodeURIComponent(acct.id)}`, {
    headers: { authorization: `Bearer ${acct.token}` },
  }).then((r) => r.json());

const save = (acct, extra) =>
  post("/state/save", {
    me: acct.id,
    token: acct.token,
    state: {
      profile: { id: acct.id, name: acct.name, look: { skin: 0, outfit: 0, hair: 0 } },
      sub: "free",
      badges: [],
      connections: [],
      claims: {},
      onboarding: [],
      tutorialDone: true,
      quest: {},
      claimedQuests: [],
      visitStreak: 1,
      bestStreak: 1,
      wallet: { earned: 0, redeemed: 0, owned: [], connHigh: 0, earnedBase: 0 },
      ...extra,
    },
  });

// ---------------------------------------------------------------------

group("the arcade half of a state blob survives the round trip");
const ada = await reg("Ada");
ada.name = "Ada";
await save(ada, {
  parkourBests: { "load-in": 6.5, "the-scaffold": 9.1 },
  arcadeBest: 210,
  arcadeDay: "2026-08-12",
  arcadeWon: 40,
  quizzes: [{ id: "q1", title: "Mine", questions: [] }],
});
{
  const got = await stateOf(ada);
  check(got.state?.arcadeBest === 210, "arcadeBest comes back", String(got.state?.arcadeBest));
  check(got.state?.parkourBests?.["load-in"] === 6.5, "parkour bests come back");
  check(got.state?.arcadeWon === 40, "the daily arcade counter comes back");
  check(Array.isArray(got.state?.quizzes) && got.state.quizzes.length === 1, "written quizzes come back");
}

group("a time nobody could run is dropped, not clamped");
const mal = await reg("Mallory");
mal.name = "Mallory";
await save(mal, { parkourBests: { "load-in": 0.01, "cable-run": MIN_TIME["cable-run"] - 0.5 } });
{
  const b = await board();
  const row = b.boards.parkour.find((r) => r.id === mal.id);
  check(!row, "a faked run does not reach the board at all", row ? JSON.stringify(row) : "");
  check(
    b.boards.parkour.some((r) => r.id === ada.id),
    "an honest run does",
  );
}

group("more maps cleared beats a faster time on fewer");
const bo = await reg("Bo");
bo.name = "Bo";
await save(bo, { parkourBests: { "load-in": 4.0 } }); // one map, very fast
{
  const b = await board();
  const order = b.boards.parkour.map((r) => r.id);
  check(order[0] === ada.id, "two maps outrank one quick one", order.join(" > "));
}

group("the other three boards");
const cy = await reg("Cy");
cy.name = "Cy";
await save(cy, {
  arcadeBest: 295,
  connections: [
    { name: "A", ts: 1, floorId: "main-hall", peerId: "p1" },
    { name: "B", ts: 2, floorId: "main-hall", peerId: "p2" },
    { name: "sample stand", ts: 3, floorId: "main-hall" },
  ],
});
{
  const b = await board();
  check(b.boards.arcade[0]?.id === cy.id, "the arcade board ranks by score");
  const conn = b.boards.connections.find((r) => r.id === cy.id);
  check(conn?.count === 2, "sample stands do not count as connections", String(conn?.count));
  check(b.boards.time.length === 0, "nobody has floor time yet — it is measured, not reported");
  check(b.week === weekKey(Date.now()), "the board says which week it is", b.week);
  check(typeof b.endsAt === "number" && b.endsAt > Date.now(), "and when that week ends");
}

group("floor time is measured from the socket, not reported");
{
  // Walk in, stand about for a moment, walk out. The server should have
  // clocked roughly that long — and this is the only way to get on the
  // time board at all.
  const ws = new WebSocket(`ws://127.0.0.1:${port}/ws?floor=main-hall`);
  await new Promise((r, j) => {
    ws.addEventListener("open", r, { once: true });
    ws.addEventListener("error", j, { once: true });
  });
  ws.send(
    JSON.stringify({
      t: "join",
      player: { id: ada.id, name: "Ada", look: { skin: 0, outfit: 0, hair: 0 } },
      s: { x: 100, y: 100, dir: "down", moving: false },
      token: ada.token,
    }),
  );
  await sleep(1400);
  ws.close();
  await sleep(500);
  const b = await board();
  const row = b.boards.time.find((r) => r.id === ada.id);
  check(Boolean(row), "a visit shows up on the time board");
  check(row && row.ms >= 1000 && row.ms < 20_000, "with roughly the time spent", `${row?.ms}ms`);
}

group("floor time cannot be reported by a client");
await save(cy, { playMs: 99 * 60 * 60 * 1000, weekPlayMs: 99 * 60 * 60 * 1000 });
{
  const b = await board();
  const faked = b.boards.time.find((r) => r.id === cy.id);
  check(!faked, "a state blob claiming 99 hours does not chart", faked ? `${faked.ms}ms` : "");
  check(b.boards.time[0]?.id === ada.id, "the only name on the board is the one who was here");
}

// ---------------------------------------------------------------------
group("the week rolls over and mints a podium");
proc.kill("SIGTERM");
await sleep(600);
{
  // Rewind the stored week by one so the next boot sees a rollover, exactly
  // as it would on a Monday. Everything else on disk stays as it was.
  const data = JSON.parse(readFileSync(dataFile, "utf8"));
  check(data.boards && Object.keys(data.boards).length >= 3, "boards persisted to disk");
  check(typeof data.currentWeek === "string" && data.currentWeek, "so did the week marker");
  data.currentWeek = "2000-W01";
  writeFileSync(dataFile, JSON.stringify(data));
}
proc = spawn(process.execPath, [SERVER], { env, stdio: ["ignore", "pipe", "pipe"] });
watch(proc);
await waitUp();
{
  const b = await board();
  check(b.lastWeek?.week === "2000-W01", "last week is archived under its own name", b.lastWeek?.week);
  check((b.lastWeek?.boards?.parkour ?? []).length > 0, "with a podium on it");
  check(b.boards.parkour.length === 0, "and this week starts empty");

  const got = await stateOf(ada);
  const award = (got.awards ?? [])[0];
  check(Boolean(award), "a winner is handed their award on the next pull");
  check(award?.rank >= 1 && award?.rank <= 3, "with a rank", String(award?.rank));
  check(typeof award?.title === "string" && award.title.length > 0, "and a title", award?.title);
  check(award?.tickets > 0, "and some tickets", String(award?.tickets));

  const loser = await stateOf(mal);
  check((loser.awards ?? []).length === 0, "somebody who never charted gets nothing");
}

proc.kill("SIGKILL");
rmSync(dir, { recursive: true, force: true });
console.log(bad === 0 ? "\nALL LEADERBOARD CHECKS PASSED" : `\n${bad} CHECK(S) FAILED`);
if (bad) console.log(log);
process.exit(bad ? 1 : 0);
