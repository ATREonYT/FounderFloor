/**
 * Operator rescue tool: set an account's password directly in the data file,
 * no email involved. For when reset mail can't reach the inbox (unverified
 * sending domain, spam filters) — especially the admin account itself.
 *
 * Usage (ON THE SERVER, WITH THE FLOOR SERVER STOPPED):
 *
 *   systemctl stop founderfloor
 *   node server/tools/set-password.mjs <email> <new-password>
 *   systemctl start founderfloor
 *
 * Stopping the server first matters: it holds all state in memory and saves
 * over the file — an edit made while it runs would be silently overwritten.
 * The tool refuses short passwords, backs the file up first, and re-hashes
 * with the same scrypt parameters the server uses.
 */

import { randomBytes, scryptSync } from "node:crypto";
import { copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SCRYPT = { N: 32768, r: 8, p: 1 }; // must match server/index.mjs

const [email, password, fileArg] = process.argv.slice(2);
if (!email || !password) {
  console.error("usage: node set-password.mjs <email> <new-password> [data-file]");
  process.exit(1);
}
if (password.length < 6) {
  console.error("password needs at least 6 characters");
  process.exit(1);
}

const dataFile =
  fileArg ?? join(dirname(fileURLToPath(import.meta.url)), "..", "floor-data.json");

let parsed;
try {
  parsed = JSON.parse(readFileSync(dataFile, "utf8"));
} catch (err) {
  console.error(`cannot read ${dataFile}: ${err.message}`);
  process.exit(1);
}

const accounts = parsed.accounts ?? {};
const target = email.trim().toLowerCase();
const hit = Object.entries(accounts).find(
  ([, a]) => a && typeof a === "object" && (a.email ?? "").toLowerCase() === target,
);
if (!hit) {
  const known = Object.values(accounts)
    .map((a) => a?.email)
    .filter(Boolean);
  console.error(`no account with email ${target}`);
  console.error(`accounts on file: ${known.length ? known.join(", ") : "(none have emails)"}`);
  process.exit(1);
}

const [key, acct] = hit;
const salt = randomBytes(16).toString("hex");
acct.salt = salt;
acct.hash = scryptSync(password, salt, 32, {
  N: SCRYPT.N,
  r: SCRYPT.r,
  p: SCRYPT.p,
  maxmem: 64 * 1024 * 1024,
}).toString("hex");
acct.kdf = { ...SCRYPT };
// a password change signs every existing browser session out
if (parsed.tokens && typeof parsed.tokens === "object") {
  for (const [tok, v] of Object.entries(parsed.tokens)) {
    const id = typeof v === "string" ? v : v?.id;
    if (id === acct.id) delete parsed.tokens[tok];
  }
}

const backup = `${dataFile}.pre-password-${Date.now()}`;
copyFileSync(dataFile, backup);
writeFileSync(dataFile, JSON.stringify(parsed));
console.log(`password updated for ${acct.email} (account "${key}", id ${acct.id})`);
console.log(`previous file backed up at ${backup}`);
console.log("now start the server again: systemctl start founderfloor");
