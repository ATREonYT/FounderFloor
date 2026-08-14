/**
 * The operator's roster, end to end: `node server/test/people.mjs`.
 *
 * /admin/people is the one endpoint that hands back every email address the
 * hall holds, so the things worth a real server rather than a unit test are
 * the gate and the join:
 *
 *   the gate   a stranger, a signed-out caller and an ordinary signed-in
 *              member must all get the same 404 the rest of /admin/* gives.
 *              A roster that leaks is worse than no roster.
 *   the join   the point of the thing is that one row carries the email,
 *              the display name, the company and the stand. Any of those
 *              arriving on a DIFFERENT row than the rest is the bug this
 *              endpoint exists to prevent, so it is asserted per person.
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

const dir = mkdtempSync(join(tmpdir(), "ff-people-"));
const dataFile = join(dir, "floor-data.json");
const port = 3527;

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
  id: `id-${name.toLowerCase().replace(/\W+/g, "-")}`,
  name,
  oneLiner: "does a thing",
  pitch: "",
  founder,
  founderLook: { skin: 0, outfit: 0, hair: 0 },
  category: "Tools",
  goal: "Survive",
  goalProgress: 0,
  verifiedRevenue: 0,
  seekingCofounder: false,
  link: "https://example.com/",
  booth: { carpet: "#C2B8A3", banner: "#5C5548", sign: "X", glyph: "star", pattern: "solid" },
});

/* --------------------------------------------------------------- cast */

const boss = await reg("Boss", "boss@example.com");
const ada = await reg("Ada", "ada@example.com");
const grace = await reg("Grace", "grace@example.com");

// Ada registers a company, so her row has to carry it even with no stand.
await postJson("/startups/register", {
  me: ada.id,
  token: ada.token,
  startup: standFor("Soup Ticket", "Ada"),
});

// Grace syncs a state blob: a different walking name and her own company.
await postJson("/state/save", {
  me: grace.id,
  token: grace.token,
  state: {
    profile: { id: grace.id, name: "Gracie", look: { skin: 1, outfit: 1, hair: 1 } },
    myStartup: standFor("Night Shift", "Gracie"),
    sub: "free",
    connections: [],
    claims: {},
  },
});

const people = (b = {}) => postJson("/admin/people", { token: boss.token, ...b });
const rowFor = (list, email) => list.find((r) => r.email === email);

/* ---------------------------------------------------------------- gate */
{
  group("who can read the roster");

  const nobody = await post("/admin/people", { token: "" });
  check(nobody.status === 404, "no token gets the ordinary 404", String(nobody.status));

  const junk = await post("/admin/people", { token: "not-a-real-token" });
  check(junk.status === 404, "a made-up token gets the ordinary 404", String(junk.status));

  // The important one: a REAL, VALID session that simply is not an operator.
  const member = await post("/admin/people", { token: ada.token });
  check(
    member.status === 404,
    "a signed-in member with a valid token still gets the 404",
    String(member.status),
  );
  const body = await member.text();
  check(!/ada@example\.com/.test(body), "and no address leaks in the refusal body");

  const admin = await post("/admin/people", { token: boss.token });
  check(admin.status === 200, "the operator gets the roster", String(admin.status));
}

/* ---------------------------------------------------------------- join */
{
  group("one row per person, with the ids joined up");

  const res = await people();
  check(res.total >= 3, "everyone with an account is on it", `total ${res.total}`);
  check(res.accounts >= 3, "counted as accounts", `accounts ${res.accounts}`);

  const a = rowFor(res.people, "ada@example.com");
  check(!!a, "Ada is there, by address");
  check(a?.id?.startsWith("acct_") === true, "with her account id beside it", a?.id ?? "");
  check(a?.name === "Ada", "and her name", a?.name ?? "");
  check(a?.company === "Soup Ticket", "and the company she registered", a?.company ?? "");
  check(a?.kind === "account", "filed as an account", a?.kind ?? "");
  check(a?.tier === "free", "on the free tier until somebody grants", a?.tier ?? "");

  const g = rowFor(res.people, "grace@example.com");
  check(g?.company === "Night Shift", "Grace's synced company reaches her row", g?.company ?? "");
  check(
    g?.alias === "Gracie",
    "and the name she actually walks under is flagged as an alias",
    g?.alias ?? "",
  );
  check(g?.name === "Grace", "without overwriting the account name", g?.name ?? "");

  // The whole point: Ada's company must not land on Grace's row.
  check(
    a?.company !== g?.company && a?.id !== g?.id,
    "two founders' details do not cross over",
  );
}

/* ------------------------------------------------------------- entitlement */
{
  group("the roster agrees with the door");

  await postJson("/admin/grant", { token: boss.token, email: "ada@example.com", tier: "pro" });
  const withPro = rowFor((await people()).people, "ada@example.com");
  check(withPro?.tier === "pro", "a grant shows up as the live tier", withPro?.tier ?? "");
  check(
    typeof withPro?.customer === "string" && withPro.customer.startsWith("admin:"),
    "and says the operator granted it rather than Stripe",
    withPro?.customer ?? "",
  );

  await postJson("/admin/grant", {
    token: boss.token,
    email: "ada@example.com",
    tier: "keep",
    tickets: 250,
  });
  const withTickets = rowFor((await people()).people, "ada@example.com");
  check(withTickets?.tickets === 250, "purchased tickets are on the row", String(withTickets?.tickets));

  await postJson("/admin/grant", { token: boss.token, email: "ada@example.com", tier: "none" });
  const cleared = rowFor((await people()).people, "ada@example.com");
  check(cleared?.tier === "free", "and taking it away drops her back to free", cleared?.tier ?? "");
}

/* -------------------------------------------------------------------- bans */
{
  group("somebody already dealt with reads that way");

  await postJson("/admin/ban", {
    token: boss.token,
    email: "grace@example.com",
    reason: "testing",
  });
  const banned = rowFor((await people()).people, "grace@example.com");
  check(!!banned?.banned, "a banned account is marked on the roster");
  check(banned?.banned?.reason === "testing", "with the reason", banned?.banned?.reason ?? "");
  check(banned?.banned?.by === "boss@example.com", "and who did it", banned?.banned?.by ?? "");

  await postJson("/admin/unban", { token: boss.token, email: "grace@example.com" });
  const clear = rowFor((await people()).people, "grace@example.com");
  check(clear?.banned === null, "and unbanning clears the mark");
}

/* ------------------------------------------------------------------ search */
{
  group("finding one person in a full hall");

  const byEmail = await people({ q: "ada@example" });
  check(byEmail.matched === 1, "search by address finds exactly one", String(byEmail.matched));

  const byCompany = await people({ q: "night shift" });
  check(
    byCompany.matched === 1 && byCompany.people[0].email === "grace@example.com",
    "search by company name finds its founder",
    byCompany.people[0]?.email ?? "",
  );

  const byAlias = await people({ q: "gracie" });
  check(
    byAlias.matched === 1,
    "search by the name they walk under works too",
    String(byAlias.matched),
  );

  const none = await people({ q: "nobody-by-this-name" });
  check(none.matched === 0 && none.people.length === 0, "and a miss is empty, not everyone");

  const capped = await people({ limit: 1 });
  check(capped.returned === 1 && capped.people.length === 1, "limit is honoured", String(capped.returned));
  check(capped.total >= 3, "while total still reports the real size", String(capped.total));
}

/* ------------------------------------------------------------------ health */
{
  group("the deploy can tell whether this shipped");
  const h = await fetch(`${base}/health`).then((r) => r.json());
  check(h.features?.people === true, "/health advertises the roster");
}

proc.kill("SIGKILL");
rmSync(dir, { recursive: true, force: true });
console.log(bad === 0 ? "\nALL PEOPLE CHECKS PASSED" : `\n${bad} FAILED`);
if (bad) {
  console.log(log);
  process.exit(1);
}
