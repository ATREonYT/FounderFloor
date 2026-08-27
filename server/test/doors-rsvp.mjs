/**
 * The Open Doors RSVP loop, end to end: `node server/test/doors-rsvp.mjs`.
 *
 * The things only a real server can prove:
 *
 *   one welcome   subscribing three times is one record and one letter.
 *   the plan      stored, capped, sanitised, echoed back in the reminder,
 *                 visible to the operator.
 *   one reminder  goes out once per window, with the plan line for those
 *                 who gave one — and a RESTART inside the send window
 *                 sends nothing again, because the marker is on disk.
 *
 * EMAIL_ECHO=1 captures every send in /debug/emails instead of mailing;
 * FF_REMIND_LEAD_MS/-SWEEP_MS shrink the schedule to seconds.
 */
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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

const dir = mkdtempSync(join(tmpdir(), "ff-doorsrsvp-"));
const dataFile = join(dir, "floor-data.json");
const port = 3541;

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
  EMAIL_ECHO: "1",
  FF_REMIND_LEAD_MS: String(30 * 24 * 3600_000), // any real window is "close"
  FF_REMIND_SWEEP_MS: "1000",
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
const emails = () => fetch(`${base}/debug/emails`).then((r) => r.json()).then((d) => d.emails);
const REMIND_SUBJECT = "One reminder, as promised";
const WELCOME_SUBJECT = "You're on the list for Open Doors";

/* ------------------------------------------------ subscribe: one welcome */
{
  group("subscribe twice: one record, one welcome");
  const a1 = await postJson("/subscribe", { email: "ada@example.com", demoNight: true, source: "demo-night" });
  check(a1.ok === true && a1.already !== true, "first RSVP accepted");
  // The UI's plan follow-up is a second POST to the same endpoint.
  const a2 = await postJson("/subscribe", {
    email: "ada@example.com",
    demoNight: true,
    source: "demo-night",
    plan: "shipping the billing page",
  });
  check(a2.ok === true && a2.already === true, "the plan follow-up reports already-subscribed");
  const a3 = await postJson("/subscribe", { email: "ADA@example.com ", demoNight: true });
  check(a3.already === true, "a third submit (case/space-mangled) is still one record");

  await postJson("/subscribe", { email: "bea@example.com", demoNight: true, source: "demo-night" });
  // Someone on the plain list (no RSVP) must NOT get the doors reminder.
  await postJson("/subscribe", { email: "lena@example.com", demoNight: false, source: "landing" });

  await sleep(400);
  const sent = await emails();
  const adaWelcomes = sent.filter((e) => e.to === "ada@example.com" && e.subject === WELCOME_SUBJECT);
  check(adaWelcomes.length === 1, "exactly one welcome for the triple-subscriber", String(adaWelcomes.length));
}

/* ------------------------------------------------------- the one reminder */
{
  group("the one reminder, with and without a plan");
  await sleep(2600); // the 1s sweep fires with the list populated
  const sent = await emails();
  const reminders = sent.filter((e) => e.subject.startsWith(REMIND_SUBJECT));
  const to = reminders.map((e) => e.to).sort();
  check(reminders.length === 2, "one reminder each to the two RSVPs", String(reminders.length));
  check(
    to.join(",") === "ada@example.com,bea@example.com",
    "and only to people who asked for it (the plain-list address got none)",
    to.join(","),
  );
  const ada = reminders.find((e) => e.to === "ada@example.com");
  const bea = reminders.find((e) => e.to === "bea@example.com");
  check(
    !!ada && ada.text.includes('You said you\'d bring: "shipping the billing page"'),
    "the plan is echoed back in the text body",
  );
  check(!!ada && ada.html.includes("shipping the billing page"), "and in the html body");
  check(!!bea && !bea.text.includes("You said you'd bring"), "no plan line for the plan-less");
  check(!!ada && ada.text.includes("unsubscribe"), "the unsubscribe line is present");
  check(
    // The ordinary week quotes the fixed phrase; a week with a special
    // window (launch day) announces itself by that window's own label.
    !!ada && (ada.subject.includes("Sunday 18:00 CET") || ada.subject.includes("doors open all day")),
    "the subject names the window",
    ada?.subject ?? "",
  );

  const disk = JSON.parse(readFileSync(dataFile, "utf8"));
  check(
    typeof disk.lastRemindedWindow === "number" && disk.lastRemindedWindow > Date.now(),
    "the sent-marker is on disk, keyed to the coming window",
    String(disk.lastRemindedWindow),
  );

  // Show the letters for the report.
  writeFileSync(join(dir, "reminder-with-plan.txt"), `SUBJECT: ${ada.subject}\n\n${ada.text}\n\n---- HTML ----\n${ada.html}`);
  writeFileSync(join(dir, "reminder-no-plan.txt"), `SUBJECT: ${bea.subject}\n\n${bea.text}\n\n---- HTML ----\n${bea.html}`);
  console.log(`  (rendered letters written to ${dir})`);
}

/* -------------------------------------- restart inside the send window */
{
  group("restart inside the send window: nothing re-sent");
  proc.kill("SIGKILL");
  await sleep(300);
  await boot();
  await sleep(7000); // past the 5s boot kick AND several 1s sweeps
  const sent = await emails();
  const reminders = sent.filter((e) => e.subject.startsWith(REMIND_SUBJECT));
  check(reminders.length === 0, "zero reminders after the restart", String(reminders.length));

  // A brand-new RSVP after the send gets a welcome (which names the when)
  // but not a second-run reminder — the marker covers the whole window.
  await postJson("/subscribe", { email: "cara@example.com", demoNight: true });
  await sleep(2500);
  const later = await emails();
  check(
    later.some((e) => e.to === "cara@example.com" && e.subject === WELCOME_SUBJECT),
    "a post-send RSVP still gets its welcome",
  );
  check(
    !later.some((e) => e.subject.startsWith(REMIND_SUBJECT)),
    "and triggers no re-send for the already-reminded window",
  );
}

/* -------------------------------------------------- the operator's view */
{
  group("the operator's view and manual trigger");
  const boss = await postJson("/auth/register", {
    name: "Boss",
    email: "boss@example.com",
    password: "hunter2hunter2",
  });
  const subs = await postJson("/admin/subscribers", { token: boss.token });
  const ada = subs.subscribers.find((s) => s.email === "ada@example.com");
  check(ada?.plan === "shipping the billing page", "the plan shows in /admin/subscribers", ada?.plan ?? "(none)");
  check(typeof subs.lastRemindedWindow === "number" && subs.lastRemindedWindow > 0, "with the sent-marker");

  const manual = await postJson("/admin/remind-doors", { token: boss.token });
  check(
    manual.ok === true && manual.sent === 0 && /already reminded/.test(manual.reason),
    "the manual trigger refuses to double-send",
    manual.reason ?? "",
  );

  // Sanitisation contract (sanitizeStr, same as every user-text field):
  // control characters stripped, trimmed, capped at 140. Markup stays as
  // INERT TEXT — safety is escape-at-render, and the reminder html runs
  // the plan through the same esc() as every other letter.
  await postJson("/subscribe", {
    email: "dave@example.com",
    demoNight: true,
    plan: "   <b>big</b> plans\n" + "x".repeat(500),
  });
  const subs2 = await postJson("/admin/subscribers", { token: boss.token });
  const dave = subs2.subscribers.find((s) => s.email === "dave@example.com");
  check(
    typeof dave?.plan === "string" &&
      dave.plan.length <= 140 &&
      !/[\u0000-\u001f]/.test(dave.plan) &&
      dave.plan.startsWith("<b>big</b>"),
    "a hostile plan is control-stripped, trimmed and capped (markup stays inert text)",
    `${dave?.plan?.length ?? 0} chars`,
  );
}

proc.kill("SIGKILL");
console.log(bad ? `\n${bad} CHECK(S) FAILED` : "\nALL DOORS-RSVP CHECKS PASSED");
if (bad) {
  console.log("\n--- server log ---\n" + log.slice(-4000));
  rmSync(dir, { recursive: true, force: true });
  process.exit(1);
}
console.log(`(letters kept in ${dir} for inspection)`);
