/**
 * Floor-server load probe: `node server/test/load-floor.mjs [N ...]`.
 *
 * Simulates N visitors on the Main Hall: each joins as a guest over ws and
 * sends movement at the real client's cadence (10 packets/second while
 * moving, ~60% duty cycle — game/engine.ts SEND_INTERVAL). The server's
 * cost is the broadcast fan-out: every move goes to everyone else, so
 * total sends scale as ~6·N² per second. This script finds where that
 * curve hurts on the machine it runs on.
 *
 * What it measures, per trial:
 *   relay p50/p95   one probe client's moves timed until a second probe
 *                   client receives them (same process, FIFO-matched — a
 *                   direct read of how stale everyone's view of everyone
 *                   else is getting)
 *   health p95      GET /health latency — the event-loop lag proxy, since
 *                   every HTTP answer waits behind the broadcast work
 *   server cpu      %CPU of the server process (single-threaded: 100 = a
 *                   whole core, the practical ceiling)
 *   drops           probe moves that never arrived within 5s
 *
 * The load generator deliberately does NOT parse most traffic (every
 * non-probe client discards frames unread) so the harness measures the
 * server, not itself.
 */
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocket } from "ws";

const SERVER = join(dirname(fileURLToPath(import.meta.url)), "..", "index.mjs");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dir = mkdtempSync(join(tmpdir(), "ff-load-"));
const port = 3553;
const RAMP = process.argv.slice(2).map(Number).filter((n) => n > 0);
const TRIALS = RAMP.length ? RAMP : [25, 50, 75, 100, 150, 200, 300];
const WARMUP_MS = 5000;
const MEASURE_MS = 12000;
const MOVE_INTERVAL = 100; // engine SEND_INTERVAL: 10/s while moving
const DUTY = 0.6; // fraction of time a visitor is actually walking

const proc = spawn(process.execPath, [SERVER], {
  env: {
    ...process.env,
    FF_DATA_FILE: join(dir, "floor-data.json"),
    PORT_WS: String(port),
    FOUNDING_SEATS: "0",
    AUTH_RATE_LIMIT: "100000",
    FF_MAX_WS_PER_IP: "100000",
    NO_PROXY: "127.0.0.1,localhost",
    no_proxy: "127.0.0.1,localhost",
  },
  stdio: ["ignore", "ignore", "pipe"],
});
let errlog = "";
proc.stderr.on("data", (d) => (errlog += d));
process.once("exit", () => {
  try {
    proc.kill("SIGKILL");
  } catch {
    /* gone */
  }
});

const base = `http://127.0.0.1:${port}`;
for (let i = 0; i < 100; i++) {
  try {
    if ((await fetch(`${base}/health`)).ok) break;
  } catch {
    /* not up */
  }
  await sleep(100);
}

// %CPU as a DELTA between samples (ps -o %cpu is a lifetime average and
// hides spikes): jiffies from /proc/<pid>/stat over wall time.
import { readFileSync } from "node:fs";
let lastJiffies = 0;
let lastCpuAt = 0;
const HZ = 100;
const serverCpu = () => {
  try {
    const parts = readFileSync(`/proc/${proc.pid}/stat`, "utf8").split(") ")[1].split(" ");
    const jiffies = Number(parts[11]) + Number(parts[12]); // utime + stime
    const now = Date.now();
    const pct =
      lastCpuAt > 0
        ? Math.round((((jiffies - lastJiffies) / HZ) * 1000) / (now - lastCpuAt) * 100)
        : 0;
    lastJiffies = jiffies;
    lastCpuAt = now;
    return pct;
  } catch {
    return NaN;
  }
};

function makeClient(i, { probe = false } = {}) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws?floor=main-hall`);
    const t = setTimeout(() => reject(new Error(`client ${i} connect timeout`)), 10000);
    const state = { ws, id: `load-${i}`, moving: Math.random() < DUTY, x: 928, y: 1200, sent: [] };
    ws.on("open", () => {
      clearTimeout(t);
      ws.send(
        JSON.stringify({
          t: "join",
          player: { id: state.id, name: `v${i}`, look: { skin: i % 6, outfit: i % 8, hair: i % 8 } },
          s: { x: state.x, y: state.y, dir: "up", moving: false },
        }),
      );
      resolve(state);
    });
    if (probe === "sender") {
      // The server downgrades unverified ids to fresh guest UUIDs, so the
      // wire id comes from the welcome frame, not from what we sent.
      ws.on("message", (buf) => {
        if (state.selfId) return;
        const str = buf.toString();
        if (str.includes('"welcome"')) {
          try {
            state.selfId = JSON.parse(str).selfId;
          } catch {
            /* not the welcome */
          }
        }
      });
    } else if (!probe) {
      // Discard unread: the harness must not spend its CPU parsing the
      // n² broadcast stream it exists to generate.
      ws.on("message", () => {});
    }
    ws.on("error", reject);
  });
}

async function trial(n) {
  const clients = [];
  for (let i = 0; i < n; i++) {
    clients.push(await makeClient(i, { probe: i === 0 ? "sender" : i === 1 }));
    if (i % 20 === 19) await sleep(50); // don't thundering-herd the joins
  }
  const sender = clients[0]; // probe sender
  const listener = clients[1]; // probe receiver — parses only the sender's moves
  const latencies = [];
  let drops = 0;
  listener.ws.on("message", (buf) => {
    const s = buf.toString();
    if (!sender.selfId || !s.includes('"player_move"') || !s.includes(`"id":"${sender.selfId}"`)) return;
    const sentAt = sender.sent.shift();
    if (sentAt !== undefined) latencies.push(Date.now() - sentAt);
  });

  // everyone walks: 10 packets/s while moving, duty-cycled
  const movers = clients.map((c, i) =>
    setInterval(() => {
      if (Math.random() > DUTY) return;
      c.x = 928 + Math.round(Math.sin(Date.now() / 900 + i) * 300);
      c.y = 1200 + Math.round(Math.cos(Date.now() / 700 + i) * 300);
      const frame = JSON.stringify({
        t: "move",
        s: { x: c.x, y: c.y, dir: "up", moving: true },
      });
      if (c.ws.readyState === WebSocket.OPEN) {
        if (c === sender) c.sent.push(Date.now());
        c.ws.send(frame);
      }
    }, MOVE_INTERVAL),
  );

  await sleep(WARMUP_MS);
  latencies.length = 0;
  sender.sent.length = 0;

  const healths = [];
  const cpus = [];
  const healthTimer = setInterval(() => {
    const t0 = Date.now();
    fetch(`${base}/health`)
      .then(() => healths.push(Date.now() - t0))
      .catch(() => healths.push(9999));
    cpus.push(serverCpu());
  }, 1000);

  await sleep(MEASURE_MS);
  clearInterval(healthTimer);
  for (const m of movers) clearInterval(m);
  // stale probe sends = moves that never came back
  drops = sender.sent.filter((ts) => Date.now() - ts > 5000).length;
  for (const c of clients) {
    try {
      c.ws.close();
    } catch {
      /* gone */
    }
  }
  await sleep(800); // let the server clear the room before the next trial

  const q = (arr, p) => {
    if (!arr.length) return NaN;
    const s = [...arr].sort((a, b) => a - b);
    return s[Math.min(s.length - 1, Math.floor(p * s.length))];
  };
  return {
    n,
    relayP50: q(latencies, 0.5),
    relayP95: q(latencies, 0.95),
    samples: latencies.length,
    healthP95: q(healths, 0.95),
    cpuAvg: Math.round(cpus.reduce((a, b) => a + b, 0) / Math.max(1, cpus.length)),
    drops,
  };
}

console.log(`floor-server load probe · ${TRIALS.join(", ")} clients · ${MEASURE_MS / 1000}s windows`);
console.log("   N   relay p50   relay p95   health p95   server CPU   dropped");
for (const n of TRIALS) {
  const r = await trial(n);
  console.log(
    `${String(r.n).padStart(4)}   ${String(r.relayP50).padStart(6)} ms   ${String(r.relayP95).padStart(6)} ms   ${String(r.healthP95).padStart(7)} ms   ${String(r.cpuAvg).padStart(7)}%   ${String(r.drops).padStart(5)}`,
  );
}

proc.kill("SIGKILL");
rmSync(dir, { recursive: true, force: true });
if (errlog.trim()) console.log("\n--- server stderr ---\n" + errlog.slice(-1500));
