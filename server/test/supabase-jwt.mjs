/**
 * The Supabase bridge: a live floor token becomes a short HS256 JWT signed
 * with SUPABASE_JWT_SECRET; a dead token or a banned account gets 404; an
 * unset secret answers "not configured" and touches nothing else.
 */
import { spawn } from "node:child_process";
import { createHmac } from "node:crypto";
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
const dir = mkdtempSync(join(tmpdir(), "ff-jwt-"));
const port = 3567;
const base = `http://127.0.0.1:${port}`;
const SECRET = "super-secret-jwt-token-with-at-least-32-characters-long";
const ENV = { ...process.env, FF_DATA_FILE: join(dir, "floor-data.json"), PORT_WS: String(port), FOUNDING_SEATS: "0", AUTH_RATE_LIMIT: "100000", NO_PROXY: "127.0.0.1,localhost", no_proxy: "127.0.0.1,localhost" };
let proc;
const boot = async (extra = {}) => {
  proc = spawn(process.execPath, [SERVER], { env: { ...ENV, ...extra }, stdio: ["ignore", "ignore", "inherit"] });
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(`${base}/health`)).ok) return;
    } catch {}
    await sleep(100);
  }
  throw new Error("server never came up");
};
const kill = async () => {
  proc?.kill("SIGKILL");
  await sleep(300);
};
process.once("exit", () => proc?.kill("SIGKILL"));
const postJson = (p, b) => fetch(base + p, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));

console.log("\nwithout a secret");
await boot();
const ada = (await postJson("/auth/register", { name: "Ada", email: "ada@example.com", password: "hunter2hunter2" })).body;
let r = await postJson("/auth/supabase", { token: ada.token });
check(r.body?.error === "not configured", "unset secret → not configured", JSON.stringify(r.body));
const health = await (await fetch(`${base}/health`)).json();
check(health.features?.supabaseJwt === false, "/health advertises supabaseJwt:false");
await kill();

console.log("\nwith a secret");
await boot({ SUPABASE_JWT_SECRET: SECRET });
const bo = (await postJson("/auth/register", { name: "Bo", email: "bo@example.com", password: "hunter2hunter2" })).body;
r = await postJson("/auth/supabase", { token: bo.token });
check(r.status === 200 && typeof r.body?.jwt === "string", "live token → jwt");
const [h, p, sig] = r.body.jwt.split(".");
const dec = (x) => JSON.parse(Buffer.from(x, "base64url").toString());
check(dec(h).alg === "HS256", "HS256 header");
const claims = dec(p);
check(claims.sub === bo.id && claims.sub.startsWith("acct_"), "sub is the floor account id", claims.sub);
check(claims.role === "authenticated" && claims.aud === "authenticated", "role + aud authenticated");
check(claims.exp - claims.iat === 3600 && r.body.expiresIn === 3600, "one-hour expiry");
check(claims.email === "bo@example.com" && claims.user_metadata?.name === "Bo", "email and name ride along");
const expect = createHmac("sha256", SECRET).update(`${h}.${p}`).digest("base64url");
check(sig === expect, "signature verifies with the secret");
const wrong = createHmac("sha256", "another").update(`${h}.${p}`).digest("base64url");
check(sig !== wrong, "and not with another");
r = await postJson("/auth/supabase", { token: "deadbeef" });
check(r.status === 404, "dead token → 404", String(r.status));
r = await postJson("/auth/supabase", {});
check(r.status === 404, "no token → 404", String(r.status));
await postJson("/auth/logout", { token: bo.token });
r = await postJson("/auth/supabase", { token: bo.token });
check(r.status === 404, "after logout → 404", String(r.status));
const h2 = await (await fetch(`${base}/health`)).json();
check(h2.features?.supabaseJwt === true, "/health advertises supabaseJwt:true");
await kill();

console.log(bad ? `\n${bad} FAILED` : "\nall passed");
process.exit(bad ? 1 : 0);
