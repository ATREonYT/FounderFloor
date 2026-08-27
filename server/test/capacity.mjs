/**
 * The occupancy cap, end to end: `node server/test/capacity.mjs`.
 *
 * The things only a real server can prove:
 *
 *   the door       at the cap, a join gets a structured floor_full frame
 *                  (count + cap) and close 4008 — and NOBODY already
 *                  inside is dropped, degraded or disconnected by the
 *                  crowd being refused outside.
 *   the line       GET /full hands out honest FIFO positions; one out,
 *                  one in — the head of the line is admitted, the next
 *                  moves up.
 *   the exemption  an identity already inside reconnecting (second tab)
 *                  passes the full door — a swap, not an addition.
 *   the dial       the cap changes live from /admin/launch-controls and
 *                  the next join obeys the new number.
 *   under load     with the cap at 60 and 80 arrivals, exactly 60 walk,
 *                  20 wait politely, and the insiders' move relay stays
 *                  at millisecond latency throughout.
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

const dir = mkdtempSync(join(tmpdir(), "ff-capacity-"));
const port = 3559;

const proc = spawn(process.execPath, [SERVER], {
  env: {
    ...process.env,
    FF_DATA_FILE: join(dir, "floor-data.json"),
    PORT_WS: String(port),
    FF_MAX_WS_PER_IP: "100000",
    FOUNDING_SEATS: "0",
    ADMIN_EMAILS: "boss@example.com",
    AUTH_RATE_LIMIT: "100000",
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

const postJson = (p, b) =>
  fetch(base + p, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(b),
  }).then((r) => r.json());
const boss = await postJson("/auth/register", {
  name: "Boss",
  email: "boss@example.com",
  password: "hunter2hunter2",
});
const insider = await postJson("/auth/register", {
  name: "Ada",
  email: "ada@example.com",
  password: "hunter2hunter2",
});
const walt = await postJson("/auth/register", {
  name: "Walt",
  email: "walt@example.com",
  password: "hunter2hunter2",
});
const launch = (b = {}) => postJson("/admin/launch-controls", { token: boss.token, ...b });
const fullPoll = (me) =>
  fetch(`${base}/full?floor=main-hall&me=${encodeURIComponent(me)}`).then((r) => r.json());

/** Join main-hall; resolves {ws, events, closed} — events gets every frame type. */
const joiner = (id, { token } = {}) =>
  new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws?floor=main-hall`);
    const state = { ws, events: [], closed: null, selfId: "" };
    const t = setTimeout(() => reject(new Error(`${id} connect timeout`)), 8000);
    ws.on("open", () => {
      ws.send(
        JSON.stringify({
          t: "join",
          player: { id, name: id.slice(0, 12), look: { skin: 0, outfit: 0, hair: 0 } },
          ...(token ? { token } : {}),
          s: { x: 928, y: 1200, dir: "up", moving: false },
        }),
      );
      clearTimeout(t);
      // give the welcome-or-refusal a moment to arrive
      setTimeout(() => resolve(state), 500);
    });
    ws.on("message", (buf) => {
      try {
        const ev = JSON.parse(buf.toString());
        state.events.push(ev.t);
        if (ev.t === "welcome") state.selfId = ev.selfId;
        if (ev.t === "floor_full") state.full = ev;
      } catch {
        /* ignore */
      }
    });
    ws.on("close", (code) => (state.closed = code));
    ws.on("error", reject);
  });

/* --------------------------------------------------------------- the door */
{
  group("the door at the cap");
  // 10 is the cap's own minimum (an operator can't accidentally lock the
  // hall below that), so the test fills to exactly 10.
  const set = await launch({ maxFloorOccupancy: 10 });
  check(set.maxFloorOccupancy === 10, "the cap is set live from admin", set.occupancyState);

  const inside = [];
  inside.push(await joiner(insider.id, { token: insider.token }));
  for (let i = 1; i < 10; i++) inside.push(await joiner(`cap-${i}`));
  check(
    inside.every((c) => c.events.includes("welcome")),
    "ten joins fill the floor to its cap of ten",
  );

  const sixth = await joiner("cap-late");
  await sleep(400);
  check(
    sixth.full?.t === "floor_full" && sixth.full.count === 10 && sixth.full.cap === 10,
    "the eleventh gets the structured refusal with count and cap",
    JSON.stringify(sixth.full ?? null),
  );
  check(sixth.closed === 4008, "and close code 4008", String(sixth.closed));
  check(
    inside.every((c) => c.closed === null && c.ws.readyState === WebSocket.OPEN),
    "nobody inside was dropped to make room",
  );

  // Insiders still hear each other while the door refuses people.
  const before = inside[1].events.filter((t) => t === "player_move").length;
  inside[0].ws.send(JSON.stringify({ t: "move", s: { x: 950, y: 1200, dir: "up", moving: true } }));
  await sleep(300);
  const after = inside[1].events.filter((t) => t === "player_move").length;
  check(after > before, "moves still relay between insiders");

  /* ----------------------------------------------------------- the line */
  group("the line outside");
  const w0 = await fullPoll(walt.id);
  const w1 = await fullPoll("waiter-1");
  check(w0.position === 0 && w0.admit === false, "first in line: position 0, not yet admitted", JSON.stringify(w0));
  check(w1.position === 1 && w1.admit === false, "second in line: position 1", JSON.stringify(w1));

  inside[9].ws.close(); // one out...
  await sleep(400);
  const w0b = await fullPoll(walt.id);
  const w1b = await fullPoll("waiter-1");
  check(w0b.admit === true, "...and the head of the line is admitted", JSON.stringify(w0b));
  check(w1b.admit === false, "the second keeps waiting", JSON.stringify(w1b));

  const admitted = await joiner(walt.id, { token: walt.token });
  check(admitted.events.includes("welcome"), "the admitted waiter walks in");
  await sleep(300);
  const w1c = await fullPoll("waiter-1");
  check(w1c.position === 0, "and the line moves up", JSON.stringify(w1c));

  /* ------------------------------------------------------ the exemption */
  group("the session-replace exemption");
  const rejoin = await joiner(insider.id, { token: insider.token });
  await sleep(300);
  check(
    rejoin.events.includes("welcome") && rejoin.full === undefined,
    "an insider's second tab passes the full door (a swap, not an addition)",
  );

  /* ------------------------------------------------------------ the dial */
  group("the dial moves live");
  await launch({ maxFloorOccupancy: 12 });
  const extra = await joiner("cap-extra");
  check(extra.events.includes("welcome"), "raising the cap admits the next join immediately");

  for (const c of [...inside, admitted, rejoin, extra]) {
    try {
      c.ws.close();
    } catch {
      /* gone */
    }
  }
  await sleep(500);
}

/* ------------------------------------------------------------ under load */
{
  group("under load: 80 arrive, cap 60");
  // Drain the room from the previous group before counting anything.
  for (let i = 0; i < 40; i++) {
    const pr = await fetch(`${base}/presence`).then((r) => r.json());
    if ((pr.floors?.["main-hall"] ?? 0) === 0) break;
    await sleep(250);
  }
  await launch({ maxFloorOccupancy: 60 });
  const clients = [];
  for (let i = 0; i < 80; i++) {
    clients.push(await joiner(`load-${i}`));
    if (i % 20 === 19) await sleep(50);
  }
  const inside = clients.filter((c) => c.events.includes("welcome"));
  const refused = clients.filter((c) => c.full?.t === "floor_full");
  check(inside.length === 60, "exactly the cap walks in", String(inside.length));
  check(refused.length === 20, "the rest are refused politely", String(refused.length));

  // Everyone inside walks; measure relay latency between two insiders.
  const sender = inside[0];
  const listener = inside[1];
  const sent = [];
  const latencies = [];
  listener.ws.on("message", (buf) => {
    const s = buf.toString();
    if (!s.includes('"player_move"') || !s.includes(`"id":"${sender.selfId}"`)) return;
    const at = sent.shift();
    if (at !== undefined) latencies.push(Date.now() - at);
  });
  const movers = inside.map((c, i) =>
    setInterval(() => {
      if (c.ws.readyState !== WebSocket.OPEN) return;
      if (c === sender) sent.push(Date.now());
      c.ws.send(
        JSON.stringify({
          t: "move",
          s: { x: 928 + (i % 40), y: 1200, dir: "up", moving: true },
        }),
      );
    }, 100),
  );
  await sleep(6000);
  for (const m of movers) clearInterval(m);
  const sorted = [...latencies].sort((a, b) => a - b);
  const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? NaN;
  check(latencies.length > 20 && p95 < 100, "insider move relay stays fast at the cap", `p95 ${p95}ms over ${latencies.length} samples`);
  check(
    inside.every((c) => c.closed === null),
    "no insider was disconnected while the queue was refused",
  );
  for (const c of clients) {
    try {
      c.ws.close();
    } catch {
      /* gone */
    }
  }
}

proc.kill("SIGKILL");
rmSync(dir, { recursive: true, force: true });
console.log(bad ? `\n${bad} CHECK(S) FAILED` : "\nALL CAPACITY CHECKS PASSED");
if (bad) {
  console.log("\n--- server log ---\n" + log.slice(-4000));
  process.exit(1);
}
