/**
 * Public stand pages, end to end: `node server/test/stand-pages.mjs`.
 *
 * The things only a real server can prove:
 *
 *   the address   a slug is minted from the name, survives a rename, never
 *                 collides, and the old ownerId links keep resolving — a
 *                 link in somebody's bio must not die because the company
 *                 got a new name.
 *   the log       only the owner can write it, it caps and trims, and the
 *                 public payload carries exactly the newest five.
 *   the payload   unauthenticated, and carrying nothing that is not
 *                 already public on the floor.
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

const dir = mkdtempSync(join(tmpdir(), "ff-standpages-"));
const dataFile = join(dir, "floor-data.json");
const port = 3533;

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
  link: "https://example.com/",
  booth: { carpet: "#C2B8A3", banner: "#5C5548", sign: "X", glyph: "star", pattern: "solid" },
});

const register = (acct, name) =>
  postJson("/startups/register", { me: acct.id, token: acct.token, startup: standFor(name, acct.name) });
const pub = (ref) => fetch(`${base}/public/stand/${encodeURIComponent(ref)}`);
const pubJson = (ref) => pub(ref).then((r) => r.json());
const writeLog = (acct, body) =>
  postJson("/stand/log", { me: acct.id, token: acct.token, ...body });

const ada = await reg("Ada", "ada@example.com");
const grace = await reg("Grace", "grace@example.com");
const nolan = await reg("Nolan", "nolan@example.com");

/* ------------------------------------------------------------ the address */
{
  group("the address");

  await register(ada, "Soup Ticket");
  const r = await pubJson("soup-ticket");
  check(r?.entry?.startup?.name === "Soup Ticket", "a listing mints its slug", r?.entry?.slug ?? "");
  check(r?.entry?.slug === "soup-ticket", "derived from the name", r?.entry?.slug ?? "");
  check(Array.isArray(r?.entry?.log) && r.entry.log.length === 0, "with an empty log to start");
  check(!JSON.stringify(r).includes("ada@example.com"), "and no email in the public payload");

  const byId = await pubJson(ada.id);
  check(byId?.entry?.slug === "soup-ticket", "the bare ownerId still resolves", byId?.entry?.slug ?? "");

  await register(grace, "Soup Ticket");
  const g = await pubJson("soup-ticket-2");
  check(
    g?.entry?.ownerId === grace.id,
    "a name collision gets -2; the first founder keeps the clean slug",
    g?.entry?.slug ?? "(miss)",
  );

  await register(ada, "Broth Pass");
  const renamed = await pubJson("soup-ticket");
  check(
    renamed?.entry?.startup?.name === "Broth Pass",
    "a rename updates the display name",
    renamed?.entry?.startup?.name ?? "",
  );
  check(renamed?.entry?.slug === "soup-ticket", "and never the address");
  const notMinted = await pub("broth-pass");
  check(notMinted.status === 404, "the new name mints nothing", String(notMinted.status));
}

/* ---------------------------------------------------------- claims mint too */
{
  group("a floor claim mints an address");
  await new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws?floor=main-hall`);
    const t = setTimeout(() => {
      ws.close();
      reject(new Error("ws timeout"));
    }, 8000);
    ws.on("open", () => {
      ws.send(
        JSON.stringify({
          t: "join",
          player: { id: nolan.id, name: "Nolan", look: { skin: 0, outfit: 0, hair: 0 } },
          token: nolan.token,
          s: { x: 900, y: 1100, dir: "down", moving: false },
          claim: { spotIndex: 3, startup: standFor("Night Shift Audio", "Nolan") },
        }),
      );
      setTimeout(() => {
        clearTimeout(t);
        ws.close();
        resolve();
      }, 1200);
    });
    ws.on("error", (e) => {
      clearTimeout(t);
      reject(e);
    });
  });
  const n = await pubJson("night-shift-audio");
  check(n?.entry?.ownerId === nolan.id, "claiming a spot mints the slug", n?.entry?.slug ?? "(miss)");
  check(n?.entry?.floorId === "main-hall", "and the payload names the floor", n?.entry?.floorId ?? "");
  check(n?.entry?.spotIndex === 3, "and the spot", String(n?.entry?.spotIndex));
}

/* --------------------------------------------------------------- the log */
{
  group("the build log");

  const w1 = await writeLog(ada, { text: "Shipped the first thing." });
  check(w1?.ok === true, "the owner can write an entry");
  await writeLog(ada, { text: "Fixed the second thing." });
  const after = await pubJson("soup-ticket");
  check(after?.entry?.log?.length === 2, "entries reach the public page", String(after?.entry?.log?.length));
  check(
    after?.entry?.log?.[0]?.text === "Fixed the second thing.",
    "newest first",
    after?.entry?.log?.[0]?.text ?? "",
  );

  const long = await writeLog(ada, { text: "x".repeat(600) });
  check(
    typeof long?.log?.[0]?.text === "string" && long.log[0].text.length <= 280,
    "an entry is capped at 280 characters",
    String(long?.log?.[0]?.text?.length),
  );

  for (let i = 0; i < 6; i++) await writeLog(ada, { text: `entry ${i}` });
  const five = await pubJson("soup-ticket");
  check(five?.entry?.log?.length === 5, "the public payload carries exactly five", String(five?.entry?.log?.length));

  const rmTs = five.entry.log[0].ts;
  const removed = await writeLog(ada, { remove: rmTs });
  check(
    removed?.ok === true && !removed.log.some((e) => e.ts === rmTs),
    "the owner can remove an entry by its timestamp",
  );

  // Grace writing as herself into ADA's log: impossible by construction —
  // the log is keyed by the verified identity, so "me: ada" with Grace's
  // token is the only attack shape, and identity verification kills it.
  const forged = await post("/stand/log", {
    me: ada.id,
    token: grace.token,
    text: "I am definitely Ada.",
  });
  check(forged.status === 404, "someone else's token cannot write your log", String(forged.status));

  const homeless = await writeLog(await reg("Drift", "drift@example.com"), { text: "hello" });
  check(
    typeof homeless?.error === "string",
    "no stand, no log — the log hangs on a stand",
    homeless?.error ?? "",
  );
}

/* ------------------------------------------------------------------ gates */
{
  group("what the rest of the world sees");
  const missing = await pub("no-such-stand");
  check(missing.status === 404, "an unknown slug is a plain 404", String(missing.status));

  await postJson("/admin/ban", {
    token: (await postJson("/auth/login", { email: "boss@example.com", password: "hunter2hunter2" }))?.token ??
      (await reg("Boss", "boss@example.com")).token,
    email: "grace@example.com",
    reason: "testing",
  });
  const bannedPage = await pub("soup-ticket-2");
  check(bannedPage.status === 404, "a banned founder's page comes down", String(bannedPage.status));

  const h = await fetch(`${base}/health`).then((r) => r.json());
  check(h.features?.standPages === true, "/health advertises stand pages");
}

proc.kill("SIGKILL");
rmSync(dir, { recursive: true, force: true });
console.log(bad === 0 ? "\nALL STAND-PAGE CHECKS PASSED" : `\n${bad} FAILED`);
if (bad) {
  console.log(log.slice(-1500));
  process.exit(1);
}
