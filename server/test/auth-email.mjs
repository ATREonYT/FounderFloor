/**
 * The app's account flows, end to end against a real server with the
 * mailer echoing: register mails a six-digit code, /auth/verify accepts it
 * (and only it), forgot mails an eight-character code the app can use in
 * place of the link, prefs switch the Friday review on, the sweep sends it
 * once, and /auth/me tells the app who it is talking to (and whether they
 * are the operator).
 */
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SERVER = join(dirname(fileURLToPath(import.meta.url)), "..", "index.mjs");
let bad = 0;
const check = (ok, msg, extra = "") => {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${msg}${extra !== "" ? "  — " + extra : ""}`);
  if (!ok) bad++;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dir = mkdtempSync(join(tmpdir(), "ff-mail-"));
const port = 3568;
const base = `http://127.0.0.1:${port}`;
const ENV = { ...process.env, FF_DATA_FILE: join(dir, "floor-data.json"), PORT_WS: String(port), FOUNDING_SEATS: "0", AUTH_RATE_LIMIT: "100000", EMAIL_ECHO: "1", ADMIN_EMAILS: "ak@founder-floor.com", NO_PROXY: "127.0.0.1,localhost", no_proxy: "127.0.0.1,localhost" };
const proc = spawn(process.execPath, [SERVER], { env: ENV, stdio: ["ignore", "ignore", "inherit"] });
process.once("exit", () => proc.kill("SIGKILL"));
for (let i = 0; i < 100; i++) {
  try {
    if ((await fetch(`${base}/health`)).ok) break;
  } catch {}
  await sleep(100);
}
const post = (p, b) => fetch(base + p, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));
const outbox = async () => (await (await fetch(`${base}/debug/emails`)).json()).emails;

console.log("\nregister → welcome mail with a code");
const ada = (await post("/auth/register", { name: "Ada", email: "ada@example.com", password: "hunter2hunter2" })).body;
check(typeof ada?.token === "string", "registered");
await sleep(100);
let mail = (await outbox()).find((e) => e.to === "ada@example.com" && /Welcome/.test(e.subject));
const code = mail?.text.match(/confirmation code: (\d{6})/)?.[1];
check(!!code, "welcome mail carries a six-digit code", mail?.text.slice(0, 80));
let me = (await post("/auth/me", { token: ada.token })).body;
check(me?.verified === false && me?.admin === false && me?.email === "ada@example.com", "/auth/me before verifying", JSON.stringify(me));
let r = await post("/auth/verify", { token: ada.token, code: "000000" });
check(!!r.body?.error, "wrong code refused");
r = await post("/auth/verify", { token: ada.token, code });
check(r.body?.ok === true && r.body?.verified === true, "right code verifies");
r = await post("/auth/verify/start", { token: ada.token });
check(r.body?.already === true, "resend after verifying is a no-op");
r = await post("/auth/verify", { token: "nope", code });
check(r.status === 404, "dead token → 404");

console.log("\nforgot → code in the mail → reset by code");
r = await post("/auth/forgot", { email: "ada@example.com" });
await sleep(100);
mail = (await outbox()).find((e) => e.to === "ada@example.com" && /Reset/.test(e.subject));
const rcode = mail?.text.match(/enter this code: ([A-Z0-9]{8})/)?.[1];
check(!!rcode, "reset mail carries an eight-character code");
r = await post("/auth/reset", { email: "ada@example.com", code: "ZZZZZZZZ", password: "newpassword1" });
check(!!r.body?.error, "wrong reset code refused");
r = await post("/auth/reset", { email: "ada@example.com", code: rcode.toLowerCase(), password: "newpassword1" });
check(typeof r.body?.token === "string", "reset by code (case-insensitive) signs in", JSON.stringify(r.body));
r = await post("/auth/login", { email: "ada@example.com", name: "", password: "newpassword1" });
check(typeof r.body?.token === "string", "new password works");
const ada2 = r.body;
r = await post("/auth/reset", { email: "ada@example.com", code: rcode, password: "again12345" });
check(!!r.body?.error, "a reset code is single-use");

console.log("\nprefs → the Friday review");
r = await post("/auth/prefs", { token: ada2.token, weeklyMail: true });
check(r.body?.weeklyMail === true, "weekly mail switched on");
const op = (await post("/auth/register", { name: "Alex", email: "ak@founder-floor.com", password: "hunter2hunter2" })).body;
me = (await post("/auth/me", { token: op.token })).body;
check(me?.admin === true, "the operator's address is admin");
r = await post("/admin/friday-review", { token: op.token, force: true });
check(r.body?.sent === 1, "forced sweep sends to the one verified opt-in", JSON.stringify(r.body));
r = await post("/admin/friday-review", { token: op.token, force: true });
check(r.body?.sent === 0, "sweep never sends twice in a week", r.body?.reason);
await sleep(200);
mail = (await outbox()).find((e) => e.to === "ada@example.com" && /Friday review/.test(e.subject));
check(!!mail, "Friday review landed in the outbox");
r = await post("/admin/outbox", { token: op.token });
check(r.body?.echo === true && Array.isArray(r.body?.emails) && r.body.emails.length >= 3, "/admin/outbox lists the mail");
r = await post("/admin/overview", { token: op.token });
check(r.body?.verified === 1 && r.body?.weeklyMail === 1, "overview counts verified and opt-ins", JSON.stringify({ v: r.body?.verified, w: r.body?.weeklyMail }));
r = await post("/admin/outbox", { token: ada2.token });
check(r.status === 404, "a non-admin gets 404 from /admin/outbox");

proc.kill("SIGKILL");
console.log(bad ? `\n${bad} FAILED` : "\nall passed");
process.exit(bad ? 1 : 0);
