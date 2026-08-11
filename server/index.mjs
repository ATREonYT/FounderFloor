/**
 * FounderFloor — standalone floor server: one port, HTTP + WebSocket.
 *
 * WebSocket rooms are keyed by floor id taken from the connection URL:
 *   ws://host:3001/ws?floor=<id>
 *
 * HTTP routes (JSON, CORS "Access-Control-Allow-Origin: *", 200/404 only):
 *   GET /presence                     -> { floors: { [floorId]: liveCount } }
 *   GET /guestbook?floor=ID&key=KEY   -> { entries: GuestbookEntry[] } (newest first, <= 50)
 *   anything else                     -> 404 text (plain HTTP GET on /ws included)
 *
 * WS protocol (JSON text frames) mirrors NetEvent in lib/types.ts:
 *   client -> server:
 *     { t: "join", player: { id, name, look, status? }, s: MoveState, claim? }  (first frame)
 *     { t: "move", s: MoveState }
 *     { t: "chat", text, scope: "floor" | "dm", peerId? }
 *     { t: "booth_set", claim: { spotIndex, startup } }
 *     { t: "booth_clear" }
 *     { t: "emote", kind }             (one of the five EmoteKinds; 3/s per client)
 *     { t: "sign", key, text, boothName? } (guestbook entry; key <= 64, text <= 200,
 *                                      boothName <= 40 — display name for the ticker line)
 *     { t: "report", targetId, reason } (stored in floor-data.json for the operator; 1/10s)
 *   server -> client:
 *     { t: "welcome", selfId, players, booths, activity }   (activity oldest first;
 *                                      booths = persistent stands with ownerName + online)
 *     { t: "player_join", player: RemotePlayer }
 *     { t: "player_move", id, s: MoveState }
 *     { t: "player_leave", id }        (their stand comes down: booth_clear)
 *     { t: "booth_set", ownerId, ownerName, online, claim }  (ownerId = stable profile id)
 *     { t: "booth_clear", ownerId }
 *
 * Stands persist across owner absence (floor-data.json) and expire after 7
 * days without a visit. A join without a claim from a profile that has a
 * stored stand removes it — the client's saved state is the source of truth.
 *     { t: "booth_denied", spotIndex }  (only to a claimant whose spot was taken)
 *     { t: "emote", id, kind }          (echoed to the sender too)
 *     { t: "guestbook", key, entry }    (a new entry landed at a booth)
 *     { t: "activity", item }           (one new ticker line)
 *     { t: "chat", msg: ChatMsg }
 *     { t: "status", online: true, count }
 *
 * Guestbooks and the activity ticker persist to server/floor-data.json
 * (debounced 2s, atomic tmp+rename; a corrupt file yields one warning and an
 * empty start). Everything else is in-memory only.
 *
 * Run with: node server/index.mjs   (PORT_WS overrides the port, default 3001)
 */

import { createHash, createHmac, randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { windowInWords } from "../lib/data/event-window.mjs";
import { availableParallelism } from "node:os";
import { closeSync, copyFileSync, fsyncSync, openSync, readFileSync, renameSync, writeSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";

const PORT = Number(process.env.PORT_WS || 3001);

// CORS: defaults to "*" so the API works out of the box, but set
// ALLOWED_ORIGIN (e.g. https://founderfloor.net) in production to stop other
// sites using this API as free backend. Auth is bearer-token (not cookies),
// so "*" is not a CSRF hole either way — this is blast-radius reduction.
const ACAO = process.env.ALLOWED_ORIGIN || "*";

const MAX_NAME_LEN = 24;
const MAX_TEXT_LEN = 500;
const MAX_ID_LEN = 64;
const MAX_KEY_LEN = 64; // guestbook key: startup id or "spot:<n>"
const MAX_SIGN_LEN = 200; // guestbook entry text
const MAX_STATUS_LEN = 40; // profile status line
const MOVES_PER_SEC = 20; // moves beyond this per client per second are dropped
const EMOTES_PER_SEC = 3; // emotes beyond this per client per second are dropped
const SIGNS_PER_SEC = 2; // guestbook signs beyond this per client per second are dropped
const CHATS_PER_SEC = 5; // chat frames beyond this per client per second are dropped
const FRAMES_PER_SEC = 40; // total ws frames per client per second, all types
const BOOTH_SETS_PER_10S = 4; // claim + denial rollback fit; scripted spam doesn't
const GUESTBOOK_KEEP = 50; // entries per guestbook, newest first
const ACTIVITY_KEEP = 20; // ticker items per floor, oldest first
const MAX_KEYS_PER_FLOOR = 128; // distinct guestbook keys per floor
const MAX_FLOORS_TRACKED = 64; // floors with stored guestbooks / activity
const MAX_BOOTH_NAME_LEN = 40; // booth name embedded in a sign ticker line
const WALK_IN_SUPPRESS_MS = 10 * 60_000; // one "walked in" per name per window
const SAVE_DEBOUNCE_MS = 2000;
const HEARTBEAT_MS = 30_000;
const OPEN = 1; // WebSocket.OPEN

const DIRS = new Set(["up", "down", "left", "right"]);
const EMOTE_KINDS = new Set([
  "wave", "laugh", "clap", "heart", "question",
  // quest-reward emotes (unlocks are client-side; the wire accepts all eight)
  "rocket", "fire", "handshake",
]);

/**
 * Where the world is persisted. FF_DATA_FILE exists so the tests in
 * server/test can boot a real server against a scratch file instead of the
 * live one; leave it unset in production and the path is fixed next to this
 * module, which is what DEPLOY.md and the backup rotation assume.
 */
const DATA_FILE =
  process.env.FF_DATA_FILE || join(dirname(fileURLToPath(import.meta.url)), "floor-data.json");

/**
 * rooms: floorId -> Map<playerId, client>
 * client: { ws, id, name, look, s, status, claim }
 * (id/name/look/s/status form the RemotePlayer)
 */
const rooms = new Map();

/** guestbooks: floorId -> Map<key, GuestbookEntry[]> — entries newest first, <= 50. */
const guestbooks = new Map();

/**
 * stands: floorId -> Map<profileId, { claim, ownerName, lastSeen }> — the
 * RECORD persists while its owner is away (it is what the directory, the
 * stand's own page and the owner's spot reservation all read) even though
 * the booth itself is no longer drawn on the floor; it expires after
 * STAND_TTL_MS without a visit. Keyed by the STABLE profile id (rawId),
 * not the per-connection wire id, so reconnects and second tabs re-own them.
 */
const stands = new Map();
const STAND_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_STANDS_PER_FLOOR = 64;
/**
 * A startup has ONE stand: claiming a spot on a floor packs up any stand
 * the same founder holds elsewhere — the stand moves with them. The
 * tutorial hall sits outside that rule (a practice claim must not drag
 * anyone's real stand off its floor) and its stands never reach the
 * directory. "__inbox" is the Connections pseudo-room, not a floor.
 */
const PRACTICE_FLOOR = "tutorial-hall";
const isRealFloor = (floorId) => floorId !== "__inbox" && floorId !== PRACTICE_FLOOR;

/**
 * profileStates: profileId -> { state, savedAt } — the client's app state
 * (booth, badges, quests, streaks, membership...) so progress follows an
 * identity across devices. The server treats the blob as semi-opaque: it
 * enforces identity, size, and a top-level key allowlist; the CLIENT runs
 * its own defensive sanitize() when applying (the same one that guards
 * localStorage), so a hostile blob can't do more here than there.
 */
const profileStates = new Map();
const MAX_PROFILE_STATES = 5000;
// 64 KB: sized so a maxed-out legitimate state (200 connections with
// 200-char notes, full quest ledgers, an 8 KB booth logo) still fits —
// at 24 KB heavy users silently stopped syncing. Worst-case memory is
// bounded by MAX_ACCOUNTS anyway.
const MAX_STATE_BYTES = 64 * 1024;
const PROFILE_STATE_TTL_MS = 180 * 24 * 60 * 60 * 1000;
const STATE_KEYS = new Set([
  "profile", "sub", "connections", "myStartup", "claims", "onboarding",
  "tutorialDone", "badges", "quest", "claimedQuests", "lastVisitDay",
  "visitStreak", "bestStreak", "wallet",
]);

/**
 * registry: profileId -> { startup, ts } — startups registered the moment
 * they're created in the profile editor, before (or without) a floor stand.
 * The directory lists them as "no stand yet" and their categories join the
 * filter chips; a claimed stand supersedes its owner's registry entry.
 */
const registry = new Map();
const MAX_REGISTRY = 2000;
const REGISTRY_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** reports: flat list for the operator to review by hand, cap 500. */
let reports = [];
const MAX_REPORTS = 500;

/** feedback: beta notes from users ("this broke", "build this"), cap 500. */
let feedback = [];
const MAX_FEEDBACK = 500;

/**
 * events: the dated things the operator puts on the calendar — a demo
 * night, an AMA, a themed floor — soonest first, cap 50.
 *
 * Separate from Open Doors, which is a recurring weekly window computed in
 * lib/data/event-window.mjs and shared with the web app. That one has to
 * work with this server unreachable, so it stays hardcoded; these are
 * additive on top and only exist while the server is up.
 */
let events = [];
const MAX_EVENTS = 50;

/**
 * Do floors show the stands of founders who are not currently connected?
 *
 * The halls now read as "who is actually here": when you close the tab your
 * stand comes down off the floor, and your permanent home becomes the
 * directory and your /stand/<id> permalink, where people can still read
 * your pitch, sign your guestbook and ask to connect.
 *
 * Your SPOT is still reserved either way — the stand record survives, it is
 * simply not drawn — so coming back puts you where you were.
 *
 * Set FLOOR_STANDS_WHILE_AWAY=1 to go back to the old behaviour, where an
 * absent founder's stand stays on the floor marked "away". That is one env
 * var and a restart, because "does an empty hall look worse than an honest
 * one" is a question about people, not code, and the answer may change.
 */
const STANDS_WHILE_AWAY = process.env.FLOOR_STANDS_WHILE_AWAY === "1";

/**
 * subscribers: emailLower -> { email, source, ts, demoNight }
 *
 * `demoNight` is the stored name for "RSVP'd to the weekly event". The event
 * is called Open Doors now; the FIELD keeps its old name deliberately, so
 * that everyone who already RSVP'd stays on the list instead of being
 * orphaned by a rename.
 *
 * The people who liked the place but weren't ready to set up a stand — the
 * only way to reach them again. `source` records where they signed up
 * ("landing", "demo-night", "floor") and `demoNight` marks an RSVP, so the
 * operator can mail just the people who asked to be reminded.
 */
const subscribers = new Map();
const MAX_SUBSCRIBERS = 20000;

/**
 * accounts: nameLower -> { id: "acct_<uuid>", name, email, salt, hash, kdf,
 * devices, created } (scrypt). Email is the login identifier for new accounts
 * (legacy accounts may have email "" and still sign in by name — the profile
 * page nags them to add one). devices holds sha256(guest-secret) prefixes of
 * browsers that have signed in, so a sign-in from an unseen browser can
 * trigger an alert email.
 * tokens: token -> account id (bearer sessions, persisted; logout deletes).
 * Account ids are server-issued and enforced: a ws join or social POST that
 * claims an "acct_" id must present a matching token, or it's treated as a
 * guest. Guest ids (plain browser uuids) keep working with no auth at all —
 * accounts are opt-in security, not a wall.
 */
const accounts = new Map();
const accountsByEmail = new Map(); // email -> account record (same object)
const accountsById = new Map(); // acct id -> account record (same object)
const tokens = new Map();

/**
 * Operator accounts, by email. Admin endpoints (/admin/*) require a valid
 * session token whose account email is on this list — so admin rights ride
 * on ordinary sign-in, no second credential to leak. Comma-separated env.
 */
// Both the new address and the old one during the founder-floor.com ->
// founderfloor.net move: admin rights ride on the ACCOUNT's email, so
// dropping the old one before the account is renamed would lock the
// operator out of /admin. Remove the old address once the account has
// been switched over (Profile -> Account -> change email).
const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS || "ak@founderfloor.net,ak@founder-floor.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
);

/**
 * banned: key -> { reason, ts, by }. Keys are profile ids (acct_… or guest
 * uuids) and/or emails — a ban usually sets both. Enforced at ws join and
 * at login; persisted with the rest of the data file.
 */
const banned = new Map();
const MAX_BANNED = 2000;

function isBannedId(id) {
  return typeof id === "string" && banned.has(id.toLowerCase());
}
function isBannedAcct(acct) {
  return !!acct && (banned.has(acct.id.toLowerCase()) || (acct.email && banned.has(acct.email)));
}

/**
 * Same question asked about a bare profile id — the form the public
 * listings have. A guest id is not an account and cannot be banned by
 * email, so the id ban list is the only lever there, which is exactly what
 * /admin/ban writes.
 */
function isBannedOwner(id) {
  if (typeof id !== "string" || !id) return false;
  if (banned.has(id.toLowerCase())) return true;
  return isBannedAcct(accountsById.get(id));
}

/** Resolve an /admin/* caller: valid token AND admin-listed email, or null. */
function adminFor(body) {
  const token = typeof body?.token === "string" ? body.token : "";
  const entry = tokens.get(token);
  if (!entry) return null;
  const acct = accountsById.get(entry.id);
  return acct?.email && ADMIN_EMAILS.has(acct.email) ? acct : null;
}
const MAX_ACCOUNTS = 5000;
const ACCT_PREFIX = "acct_";
const MAX_EMAIL_LEN = 254;
const MAX_DEVICES_PER_ACCOUNT = 10;
// Deliberately loose: RFC-shaped enough to catch typos, no more. The real
// proof of an address is that its owner clicks the links we mail to it.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function normalizeEmail(v) {
  if (typeof v !== "string") return "";
  const e = v.trim().toLowerCase();
  return e.length <= MAX_EMAIL_LEN && EMAIL_RE.test(e) ? e : "";
}

function indexAccount(acct) {
  accountsById.set(acct.id, acct);
  if (acct.email) {
    // Guard against a data file that carries the same email on two accounts
    // (hand-edit, bad merge): the first indexed keeps it, later collisions
    // lose their email rather than silently hijacking the lookup. Clearing the
    // field keeps the record self-consistent (login-by-name + set-email still
    // work for that user).
    if (accountsByEmail.has(acct.email)) {
      acct.email = "";
    } else {
      accountsByEmail.set(acct.email, acct);
    }
  }
}

/** Stable per-browser device fingerprint from the guest secret (never stored raw). */
function deviceIdFor(gs) {
  if (typeof gs !== "string" || gs.length < 16 || gs.length > 64) return "";
  return createHash("sha256").update(gs).digest("hex").slice(0, 16);
}

/** resetTokens: token -> { id, ts } — single-use password-reset links, 30 min. */
const resetTokens = new Map();
const RESET_TTL_MS = 30 * 60 * 1000;
const MAX_RESET_TOKENS = 500;

/*
 * Outbound email (Resend HTTP API — one fetch, no SMTP). Without
 * RESEND_API_KEY every send is a silent no-op, so the server runs fine in
 * dev and on floors that never configure email; the account UI still works,
 * only the letters don't go out. EMAIL_ECHO=1 is a test seam: sends are
 * captured in memory and served at GET /debug/emails instead of leaving the
 * machine. Never set it in production.
 */
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "FounderFloor <noreply@founderfloor.net>";
// The From can be a no-reply address (no mailbox needed on the domain); set
// EMAIL_REPLY_TO to a real inbox you read so a user who hits "reply" reaches
// a human instead of the void.
const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || "";
const SITE_URL = (process.env.SITE_URL || "https://founderfloor.net").replace(/\/+$/, "");
const EMAIL_ECHO = process.env.EMAIL_ECHO === "1";

/*
 * Stripe billing fulfillment. Stripe Payment Links do the checkout; this
 * server only has to learn about completed payments, which arrive at
 * POST /stripe/webhook signed with STRIPE_WEBHOOK_SECRET (Stripe dashboard →
 * Developers → Webhooks → the endpoint's signing secret, "whsec_..."). With
 * the secret unset, the endpoint doesn't exist and nothing here runs.
 *
 * What was bought is derived from the session's price (amount + one-time vs
 * subscription), never from anything a shopper can type into a URL — so
 * paying the $9 link can't be dressed up as the $19 plan. The entitlement
 * lands on the account whose email paid; /state serves it back to that
 * account's clients, which is how the perks turn on across devices.
 */
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
const STRIPE_SIG_TOLERANCE_MS = 5 * 60 * 1000;
// checkout mode + amount_total (minor units, currency-agnostic) -> plan.
// Must mirror lib/pricing.ts: Pro $9/$79, Founder+ $19/$159, Founding $79.
const PRICE_TO_PLAN = new Map([
  ["subscription:900", { tier: "pro" }],
  ["subscription:7900", { tier: "pro" }],
  ["subscription:1900", { tier: "founder" }],
  ["subscription:15900", { tier: "founder" }],
  ["payment:7900", { tier: "founder", badge: "founding" }],
  // Ticket packs (lib/pricing.ts TICKET_PACKS): consumable currency, so
  // fulfillment credits a cumulative per-account counter instead of
  // setting an entitlement — and MUST dedupe on the checkout session id,
  // because Stripe retries webhooks and a retried pack must not pay twice.
  ["payment:299", { tickets: 300 }],
  ["payment:699", { tickets: 800 }],
  ["payment:1499", { tickets: 2000 }],
]);

/**
 * Checkout session ids already fulfilled (Stripe retries deliveries).
 * Bounded FIFO, persisted — 2000 ids is months of sales at beta scale.
 */
const processedSessions = new Set();
const MAX_PROCESSED_SESSIONS = 2000;

function markSessionProcessed(id) {
  if (typeof id !== "string" || !id) return;
  processedSessions.add(id.slice(0, 80));
  if (processedSessions.size > MAX_PROCESSED_SESSIONS) {
    // Sets iterate in insertion order — drop the oldest.
    for (const old of processedSessions) {
      processedSessions.delete(old);
      if (processedSessions.size <= MAX_PROCESSED_SESSIONS) break;
    }
  }
}

/**
 * Trials and referrals.
 *
 * A trial here is a FOUNDER+ ENTITLEMENT WITH AN EXPIRY AND NO CARD. It is
 * not the front half of a subscription: nothing is stored, nothing renews,
 * nothing is charged, and there is nothing to cancel. When it runs out the
 * account is simply free again. That is not a smaller version of the usual
 * trial — it is the only version that can honestly ship before billing is
 * live, and it is also the version with no withdrawal-rights machinery
 * attached, which matters for an operator in the EU.
 *
 * Referral credit is more of the same currency: days. Both sides of an
 * invite get REFERRAL_DAYS, and a credit extends a running trial or starts
 * a fresh window if the last one lapsed.
 *
 * ON FRAUD, PLAINLY. Nothing here can stop somebody making ten accounts
 * with ten addresses and referring themselves nine times. Email is the only
 * proof of a person this product has, and it is weak proof. The defence is
 * therefore the CAP, not the check: MAX_REFERRAL_DAYS bounds the whole
 * exploit to a couple of months of a cosmetic tier, which is worth less
 * than the effort. If that ever stops being true, the fix is to withhold
 * the credit until the referred account has actually walked a floor, not
 * to start collecting IP addresses.
 */
const DAY_MS_TRIAL = 86_400_000;

/**
 * Tunable without a code change, and guarded the same way FOUNDING_SEATS
 * is: an unparseable value falls back to the default rather than to NaN,
 * because NaN makes `earned >= cap` false forever and turns the cap — the
 * only thing standing between this and a sock-puppet farm — into an
 * unlimited grant.
 */
function envDays(name, fallback, max) {
  const n = Number(process.env[name] ?? fallback);
  return Number.isInteger(n) && n >= 0 && n <= max ? n : fallback;
}
const TRIAL_DAYS = envDays("TRIAL_DAYS", 7, 365);
const REFERRAL_DAYS = envDays("REFERRAL_DAYS", 7, 365);
/** The ceiling on referral credit per account. See the note above. */
const MAX_REFERRAL_DAYS = envDays("MAX_REFERRAL_DAYS", 63, 3650);
const REF_CODE_LEN = 7;
/** No vowels and no 0/1/l/o: a code gets read down a phone and retyped. */
const REF_ALPHABET = "bcdfghjkmnpqrstvwxyz23456789";

/** code -> account id. Rebuilt from the accounts at load. */
const referralCodes = new Map();

function mintReferralCode() {
  for (let attempt = 0; attempt < 40; attempt++) {
    const bytes = randomBytes(REF_CODE_LEN);
    let code = "";
    for (let i = 0; i < REF_CODE_LEN; i++) code += REF_ALPHABET[bytes[i] % REF_ALPHABET.length];
    if (!referralCodes.has(code)) return code;
  }
  // 28^7 is 13 billion; forty collisions in a row means something is very
  // wrong, and a longer code is a better outcome than an infinite loop.
  return `${Date.now().toString(36)}${randomBytes(3).toString("hex")}`;
}

/**
 * Give `acct` a code if it has none, and index whatever it ends up with.
 *
 * The save matters. This is reachable from GET /state, a read path that
 * schedules no write of its own, and a code that exists only in memory is
 * worse than no code at all: the member copies their link, the process
 * restarts, the account is issued a different code, and the link already
 * sitting in somebody's DMs now points at nobody — silently, because an
 * unknown code is ignored rather than refused.
 */
function ensureReferralCode(acct) {
  if (typeof acct.ref !== "string" || !acct.ref) {
    acct.ref = mintReferralCode();
    scheduleSave();
  }
  referralCodes.set(acct.ref, acct.id);
  return acct.ref;
}

/**
 * The entitlement an account ACTUALLY has right now, or null.
 *
 * Every read that decides what someone is allowed to see must go through
 * this rather than touching acct.paid, or an expired trial keeps working
 * forever. Bookkeeping reads (does this account already hold a founding
 * badge, which Stripe customer is this) still use the raw field on purpose:
 * a lapsed trial must not make the server forget a permanent badge.
 */
function entitlementOf(acct) {
  const p = acct?.paid;
  if (!p) return null;
  if (typeof p.until === "number" && p.until <= Date.now()) return null;
  return p;
}

/**
 * A permanent entitlement — a founding seat, a paid subscription, an
 * operator grant. No `until` means no end, which is the whole difference
 * between a membership and a window.
 */
const isPermanent = (p) => Boolean(p) && typeof p.until !== "number";

/**
 * Add `days` of Founder+ to an account and return how many were actually
 * given. Extends a running window, reopens a lapsed one, and leaves a
 * PERMANENT entitlement alone — a founding member or a paying customer has
 * nothing to extend, and writing an expiry over them would be a downgrade
 * dressed as a reward.
 *
 * It deliberately does NOT mark the trial as used. Days arrive from two
 * places, and only one of them is the trial: crediting an invite through
 * here used to set `trialStarted`, which meant anybody who so much as
 * touched a referral link lost the 7 days they had never been given.
 * `trialStarted` is written at /trial/start and nowhere else.
 */
function grantTrialDays(acct, days, why) {
  if (days <= 0) return 0;
  const cur = acct.paid;
  if (isPermanent(cur)) return 0; // nothing to extend
  // Extending a live window versus reopening a dead one: the first inherits
  // the original grant, the second is a new grant and has to be stamped as
  // one. The client fires its ceremony once per (account, tier, badge, ts)
  // and only for a recent ts, so an inherited timestamp would upgrade
  // somebody back to Founder+ in total silence.
  const running = typeof cur?.until === "number" && cur.until > Date.now();
  acct.paid = {
    tier: "founder",
    customer: (running && cur.customer) || why,
    ts: (running && cur.ts) || Date.now(),
    until: (running ? cur.until : Date.now()) + days * DAY_MS_TRIAL,
  };
  if (cur?.badge === "founding") acct.paid.badge = "founding";
  return days;
}

/** Referral credit, bounded by the per-account cap. */
function creditReferral(acct, why) {
  const used = Number(acct.refDays) || 0;
  const give = Math.min(REFERRAL_DAYS, Math.max(0, MAX_REFERRAL_DAYS - used));
  const gave = grantTrialDays(acct, give, why);
  if (gave > 0) acct.refDays = used + gave;
  return gave;
}

/**
 * The founding seats: the first FOUNDING_SEATS accounts to register get
 * Founder+ and the founding badge, kept for life, for nothing.
 *
 * KEYED ON THE ACCOUNT, NOT AN IP. An IP is the wrong unit twice over. It
 * is not one person — an office, a university, a school and most mobile
 * carriers put thousands of people behind one address, so an IP cap hands
 * the seat to whoever in the building clicks first and locks out everyone
 * else; meanwhile a phone switching from wifi to mobile data is a different
 * IP a second later, so the same person can take several. And an IP is
 * personal data under the GDPR, so keeping a list of them would need a
 * lawful basis and an entry in /privacy for no gain. An account is already
 * the thing that owns an entitlement, and "the first twenty people to join"
 * means the first twenty accounts. Registration needs a working email
 * address, which is a far better proof of a distinct person than an IP.
 *
 * The seat number lives on the account (`foundingSeat`, 1..FOUNDING_SEATS)
 * rather than in a separate counter, so restoring yesterday's backup cannot
 * hand out seat 7 twice: whatever the file says is the truth, and the
 * in-memory tally below is rebuilt from it at load.
 */
const FOUNDING_SEATS = (() => {
  // A garbled env var must close the offer, not open it forever: NaN makes
  // every `used >= cap` comparison false, which would hand a free lifetime
  // membership to everyone who ever registers.
  const n = Number(process.env.FOUNDING_SEATS ?? 20);
  return Number.isInteger(n) && n >= 0 && n <= 10_000 ? n : 20;
})();
/** Cache of how many seats are gone. Rebuilt from the accounts at load. */
let foundingSeatsUsed = 0;

/** How many seats the accounts on disk have actually taken. */
function countFoundingSeats() {
  let n = 0;
  for (const a of accountsById.values()) if (a.foundingSeat) n++;
  return n;
}

/**
 * Give `acct` a founding seat if any are left. Returns the seat number, or
 * 0 if the offer is gone or this account already holds one.
 *
 * Upgrades rather than replaces: somebody who already paid for Pro and is
 * also the third person through the door keeps their Stripe customer
 * reference and gets moved up, instead of being punished for having paid.
 * There is deliberately no expiry field — an entitlement here has none, so
 * "for life" is what the absence of one already means, and rebuilding the
 * object rather than spreading it is what drops a trial's `until` on the
 * way in.
 *
 * A TRIAL'S customer and ts are NOT inherited, though a purchase's are. A
 * seat granted over a running trial would otherwise be filed forever as
 * customer "trial", granted at the moment the trial began — which reads in
 * the console and in /admin/subscribers as though the seat were a trial,
 * and dates the membership to the wrong day.
 *
 * MUST NOT AWAIT between the check and the write. Node is single-threaded,
 * so with no await in between two simultaneous registrations cannot both
 * read the same tally and both take seat 20.
 */
function grantFoundingSeat(acct) {
  if (acct.foundingSeat || acct.paid?.badge === "founding") return 0;
  if (foundingSeatsUsed >= FOUNDING_SEATS) return 0;
  const seat = foundingSeatsUsed + 1;
  acct.foundingSeat = seat;
  const wasTrial = typeof acct.paid?.until === "number";
  acct.paid = {
    tier: "founder",
    customer: (!wasTrial && acct.paid?.customer) || `founding-seat-${seat}`,
    ts: (!wasTrial && acct.paid?.ts) || Date.now(),
    badge: "founding",
  };
  foundingSeatsUsed = seat;
  return seat;
}

/**
 * Hand seats to accounts that existed before the offer did, oldest first.
 *
 * Without this the offer says "the first twenty people to join" and then
 * gives nothing to the people who actually joined first, because their
 * accounts were created before the code that grants a seat. Runs once at
 * load; after the seats are gone it is a no-op forever.
 *
 * Ordered by `created`, with the id as a tiebreak so two accounts made in
 * the same millisecond get a stable order across restarts rather than
 * whatever order the JSON happened to be written in.
 */
function backfillFoundingSeats() {
  if (foundingSeatsUsed >= FOUNDING_SEATS) return;
  const waiting = [...accountsById.values()]
    .filter((a) => !a.foundingSeat && a.paid?.badge !== "founding")
    .sort((a, b) => a.created - b.created || (a.id < b.id ? -1 : 1));
  let given = 0;
  for (const acct of waiting) {
    if (!grantFoundingSeat(acct)) break;
    given++;
  }
  if (given) {
    console.log(`[founding] backfilled ${given} seat(s) to the earliest accounts`);
    scheduleSave();
  }
}

/**
 * pendingPaid: email -> entitlement for payments whose email has no account
 * yet (paid first, registered after; or paid with a different address and
 * added it to the account later). Applied the moment an account gains that
 * email, in /auth/register and /auth/set-email.
 */
const pendingPaid = new Map();
const MAX_PENDING_PAID = 500;

/** An account entitlement (acct.paid) rebuilt from untrusted disk data. */
function sanitizePaid(p) {
  if (!p || typeof p !== "object") return undefined;
  if (p.tier !== "pro" && p.tier !== "founder") return undefined;
  const out = {
    tier: p.tier,
    customer: typeof p.customer === "string" ? p.customer.slice(0, 64) : "",
    ts: typeof p.ts === "number" ? p.ts : 0,
  };
  if (p.badge === "founding") out.badge = "founding";
  // A trial carries its own end. Anything unparseable drops the expiry
  // rather than the entitlement, which fails toward "permanent" — the
  // opposite would silently revoke a real membership on a bad read.
  const until = Number(p.until);
  if (Number.isFinite(until) && until > 0) out.until = until;
  return out;
}

/**
 * A held payment (pendingPaid value) rebuilt from untrusted disk data. May
 * carry a plan tier, purchased tickets, or both — a shopper can buy a
 * ticket pack AND subscribe before ever registering.
 */
function sanitizePending(p) {
  if (!p || typeof p !== "object") return undefined;
  const out = {
    customer: typeof p.customer === "string" ? p.customer.slice(0, 64) : "",
    ts: typeof p.ts === "number" ? p.ts : 0,
  };
  if (p.tier === "pro" || p.tier === "founder") out.tier = p.tier;
  if (p.badge === "founding") out.badge = "founding";
  const t = Number(p.tickets);
  if (Number.isFinite(t) && t > 0) out.tickets = Math.min(1_000_000, Math.trunc(t));
  return out.tier || out.tickets ? out : undefined;
}

/** Fold payments that arrived before their account existed into the account. */
function applyPendingPaid(acct) {
  if (!acct.email) return;
  const p = pendingPaid.get(acct.email);
  if (!p) return;
  pendingPaid.delete(acct.email);
  if (p.tier) {
    const paid = { tier: p.tier, customer: p.customer, ts: p.ts };
    if (p.badge) paid.badge = p.badge;
    else if (acct.paid?.badge) paid.badge = acct.paid.badge;
    acct.paid = paid;
  }
  if (p.tickets) {
    acct.ticketsPurchased = (acct.ticketsPurchased ?? 0) + p.tickets;
  }
  console.log(
    `[stripe] held payment applied to ${acct.id} (${p.tier ?? "no plan"}${p.tickets ? ` +${p.tickets} tickets` : ""})`,
  );
  scheduleSave();
}

/**
 * Stripe-Signature: "t=<unix>,v1=<hmac>[,v1=...]" — HMAC-SHA256 of
 * "<t>.<raw body>" with the signing secret, fresh within tolerance.
 */
function verifyStripeSignature(header, rawBody) {
  if (typeof header !== "string" || !header) return false;
  let t = "";
  const sigs = [];
  for (const part of header.split(",")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    if (k === "t") t = v;
    else if (k === "v1") sigs.push(v);
  }
  const ts = Number(t);
  if (!Number.isFinite(ts) || Math.abs(Date.now() - ts * 1000) > STRIPE_SIG_TOLERANCE_MS) return false;
  const expected = createHmac("sha256", STRIPE_WEBHOOK_SECRET).update(`${t}.`).update(rawBody).digest();
  for (const s of sigs) {
    if (!/^[0-9a-f]{64}$/i.test(s)) continue;
    const got = Buffer.from(s, "hex");
    if (got.length === expected.length && timingSafeEqual(got, expected)) return true;
  }
  return false;
}
const echoedEmails = [];

/*
 * Abuse caps. A stranger can trigger mail to any address (register a throwaway
 * account -> welcome mail; POST /auth/forgot -> reset mail), so two things must
 * hold: no single inbox gets bombed, and junk mail can never starve the
 * security mail that locks an intruder out. We therefore split the daily quota
 * into two independent buckets:
 *   - "courtesy" (welcome mail): its own daily ceiling. Flooding registrations
 *     drains only this bucket.
 *   - "critical" (reset links, sign-in alerts, password-changed, email-changed):
 *     a separate, reserved daily ceiling that courtesy mail can never touch.
 * Per-recipient hourly caps still apply per bucket so one inbox can't be bombed,
 * but critical mail gets a roomier per-recipient allowance so an attacker
 * spamming /auth/forgot at a victim can't use up the victim's own reset budget.
 */
const emailRecipientLog = new Map(); // `${bucket}|${email}` -> ts[] within the last hour
// Separate buckets so no category can starve another. Crucially, security
// NOTICES (sign-in alert, password-changed, email-changed) live in their own
// bucket, apart from RESET links — an attacker flooding /auth/forgot at a
// victim burns only the "reset" bucket and can never silence the tripwire
// notices that would warn the victim an attack is underway.
const RECIPIENT_HOURLY = { courtesy: 4, reset: 6, notice: 12, operator: 20 };
const DAILY_CEILING = { courtesy: 300, reset: 200, notice: 300, operator: 100 };

/**
 * Where beta feedback and abuse reports get mailed (they're stored in
 * floor-data.json regardless — the email is the notification, the file is
 * the record). Unset = no operator mail. Uses its own "operator" quota
 * bucket so a feedback flood can't starve users' reset/alert mail.
 */
const OPERATOR_EMAIL = normalizeEmail(process.env.OPERATOR_EMAIL || "");

function sendOperatorEmail(subject, title, rows, footer) {
  if (!OPERATOR_EMAIL) return;
  const bodyHtml =
    rows
      .map(
        ([k, v]) =>
          `<p style="margin:0 0 8px;font-size:14px;line-height:1.6"><strong>${esc(k)}:</strong> ${esc(v)}</p>`,
      )
      .join("") +
    `<p style="margin:12px 0 0;font-size:13px;color:#6F6A5E;line-height:1.6">${esc(footer)}</p>`;
  const text =
    rows.map(([k, v]) => `${k}: ${v}`).join("\n") + `\n\n${footer}`;
  sendEmail(OPERATOR_EMAIL, subject, emailShell(title, bodyHtml), text, "operator");
}
const emailDay = { day: "", courtesy: 0, reset: 0, notice: 0, operator: 0 };

function rollEmailDay() {
  const day = new Date().toISOString().slice(0, 10);
  if (emailDay.day !== day) {
    emailDay.day = day;
    for (const k of Object.keys(DAILY_CEILING)) emailDay[k] = 0;
  }
}

/** Would a send be allowed right now, without consuming quota? */
function emailQuotaAvailable(to, bucket) {
  rollEmailDay();
  if (emailDay[bucket] >= DAILY_CEILING[bucket]) return false;
  const now = Date.now();
  const recent = (emailRecipientLog.get(`${bucket}|${to}`) ?? []).filter((ts) => now - ts < 3600_000);
  return recent.length < RECIPIENT_HOURLY[bucket];
}

function emailAllowed(to, bucket) {
  if (!emailQuotaAvailable(to, bucket)) return false;
  const now = Date.now();
  const key = `${bucket}|${to}`;
  const log = (emailRecipientLog.get(key) ?? []).filter((ts) => now - ts < 3600_000);
  log.push(now);
  emailRecipientLog.set(key, log);
  if (emailRecipientLog.size > 4000) {
    for (const [k, v] of emailRecipientLog) {
      if (!v.some((ts) => now - ts < 3600_000)) emailRecipientLog.delete(k);
    }
  }
  emailDay[bucket]++;
  return true;
}

/**
 * Fire-and-forget: callers never await delivery, a mail failure never fails a
 * request. `bucket` is "courtesy" (welcome) or "critical" (everything an
 * account owner must not miss); it decides which quota the send draws from.
 */
function sendEmail(to, subject, html, text, bucket = "critical") {
  if (!emailAllowed(to, bucket)) return;
  if (EMAIL_ECHO) {
    echoedEmails.push({ to, subject, html, text, ts: Date.now() });
    if (echoedEmails.length > 50) echoedEmails.shift();
    return;
  }
  if (!RESEND_API_KEY || typeof fetch !== "function") return;
  fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [to],
      subject,
      html,
      text,
      ...(EMAIL_REPLY_TO ? { reply_to: EMAIL_REPLY_TO } : {}),
    }),
  })
    .then(async (res) => {
      if (!res.ok) {
        // The body says WHY (unverified domain, bad from address, test-mode
        // recipient restriction…) — without it, delivery failures are invisible.
        const detail = await res.text().catch(() => "");
        console.warn(`[email] resend ${res.status} sending "${subject}" to ${maskEmail(to)}: ${detail.slice(0, 300)}`);
      } else {
        console.log(`[email] sent "${subject}" to ${maskEmail(to)}`);
      }
    })
    .catch((err) => console.warn(`[email] send failed: ${err.message}`));
}

/** Shared shell: same paper/ink palette as the site, table-free, inline styles only. */
function emailShell(heading, bodyHtml) {
  return (
    `<div style="background:#F2EFE7;padding:32px 16px;font-family:Georgia,'Times New Roman',serif;color:#23201A">` +
    `<div style="max-width:520px;margin:0 auto;background:#FFFFFF;border:1px solid #E4DFD3;border-radius:8px;padding:28px">` +
    `<p style="margin:0 0 4px;font-family:Courier,monospace;font-size:11px;letter-spacing:2px;color:#6F6A5E">FOUNDERFLOOR</p>` +
    `<h1 style="margin:0 0 16px;font-size:22px">${heading}</h1>` +
    bodyHtml +
    `</div>` +
    `<p style="max-width:520px;margin:12px auto 0;font-size:12px;color:#6F6A5E">` +
    `We only email you about your account — no newsletters. ` +
    `<a href="${SITE_URL}/about" style="color:#6F6A5E">Privacy</a></p>` +
    `</div>`
  );
}

const emailBtn = (href, label) =>
  `<p style="margin:20px 0"><a href="${href}" style="background:#23201A;color:#F2EFE7;` +
  `padding:10px 18px;border-radius:6px;text-decoration:none;font-size:14px">${label}</a></p>`;

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function sendWelcomeEmail(acct) {
  if (!acct.email) return;
  const name = esc(acct.name);
  sendEmail(
    acct.email,
    "Welcome to FounderFloor",
    emailShell(
      `Welcome to the floor, ${name}`,
      `<p style="margin:0 0 12px;font-size:14px;line-height:1.6">Your account is live. ` +
        `Your booth, connections, streaks and badges now follow you — sign in with this ` +
        `email on any device and everything comes with you.</p>` +
        `<p style="margin:0 0 12px;font-size:14px;line-height:1.6">If a sign-in ever happens ` +
        `from a browser we haven&#39;t seen before, we&#39;ll drop you a note here.</p>` +
        emailBtn(SITE_URL + "/lobby", "Walk the floor"),
      ),
    `Welcome to FounderFloor, ${acct.name}!\n\nYour account is live: sign in with this email on any device and your booth, connections and progress come with you.\n\nWalk the floor: ${SITE_URL}/lobby`,
    "courtesy",
  );
}

function sendSigninAlertEmail(acct) {
  if (!acct.email) return;
  const when = new Date().toUTCString();
  sendEmail(
    acct.email,
    "New sign-in to your FounderFloor account",
    emailShell(
      "New sign-in to your account",
      `<p style="margin:0 0 12px;font-size:14px;line-height:1.6">Your account ` +
        `<strong>${esc(acct.name)}</strong> was just signed in from a browser we ` +
        `haven&#39;t seen before, on ${when}.</p>` +
        `<p style="margin:0 0 12px;font-size:14px;line-height:1.6">If this was you (new ` +
        `phone, new laptop, cleared cookies), there&#39;s nothing to do.</p>` +
        `<p style="margin:0;font-size:14px;line-height:1.6">If it wasn&#39;t you, reset ` +
        `your password now — that signs every browser out:</p>` +
        emailBtn(SITE_URL + "/profile", "Secure my account"),
    ),
    `Your FounderFloor account "${acct.name}" was signed in from a new browser on ${when}.\n\nIf this was you, ignore this. If not, reset your password at ${SITE_URL}/profile — that signs every browser out.`,
    "notice",
  );
}

function sendResetEmail(acct, link) {
  sendEmail(
    acct.email,
    "Reset your FounderFloor password",
    emailShell(
      "Reset your password",
      `<p style="margin:0 0 12px;font-size:14px;line-height:1.6">Someone (hopefully you) ` +
        `asked to reset the password for <strong>${esc(acct.name)}</strong>. The link below ` +
        `works once and expires in 30 minutes.</p>` +
        emailBtn(link, "Choose a new password") +
        `<p style="margin:0;font-size:13px;color:#6F6A5E;line-height:1.6">Didn&#39;t ask? ` +
        `Ignore this email — your password is unchanged and the link dies on its own.</p>`,
    ),
    `Reset your FounderFloor password (account "${acct.name}"):\n\n${link}\n\nThe link works once and expires in 30 minutes. If you didn't ask for this, ignore it — your password is unchanged.`,
    "reset",
  );
}

function sendEmailChangedNotice(oldEmail, acct, newEmail) {
  sendEmail(
    oldEmail,
    "The email on your FounderFloor account was changed",
    emailShell(
      "Your account's email was changed",
      `<p style="margin:0 0 12px;font-size:14px;line-height:1.6">The recovery email for ` +
        `<strong>${esc(acct.name)}</strong> was just changed away from this address to ` +
        `<strong>${esc(newEmail)}</strong>.</p>` +
        `<p style="margin:0;font-size:14px;line-height:1.6">If that was you, no action is ` +
        `needed. If it wasn&#39;t, reply to this email right away — your account may have been ` +
        `taken over, and a human needs to hear from you.</p>`,
    ),
    `The recovery email for your FounderFloor account "${acct.name}" was just changed from this address to ${newEmail}.\n\nIf this wasn't you, reply to this email immediately — your account may have been taken over.`,
    "notice",
  );
}

function sendPasswordChangedEmail(acct) {
  if (!acct.email) return;
  sendEmail(
    acct.email,
    "Your FounderFloor password was changed",
    emailShell(
      "Password changed",
      `<p style="margin:0 0 12px;font-size:14px;line-height:1.6">The password for ` +
        `<strong>${esc(acct.name)}</strong> was just changed, and every signed-in browser ` +
        `was signed out.</p>` +
        `<p style="margin:0;font-size:14px;line-height:1.6">If this wasn&#39;t you, use ` +
        `&ldquo;Forgot password&rdquo; on the profile page to take the account back, and ` +
        `reply to this email so a human hears about it.</p>`,
    ),
    `The password for your FounderFloor account "${acct.name}" was just changed, and all sessions were signed out.\n\nIf this wasn't you, use "Forgot password" at ${SITE_URL}/profile to take the account back.`,
    "notice",
  );
}

/**
 * Purchase confirmation on a durable medium (EU consumer-rights directive
 * Art. 8(7)) — sent to the checkout email whether or not an account exists
 * yet, and carries the withdrawal/refund terms that apply to what was
 * bought. Ticket packs restate the immediate-delivery waiver; memberships
 * restate the 14-day withdrawal right and how to cancel.
 */
function sendPurchaseEmail(email, plan, held) {
  if (!email) return;
  const what = plan.tickets
    ? `a pack of ${plan.tickets} tickets`
    : plan.badge
      ? "the Founding membership — a year of Founder+ and the founding badge"
      : plan.tier === "founder"
        ? "the Founder+ membership"
        : "the Pro membership";
  const heldHtml = held
    ? `<p style="margin:0 0 12px;font-size:14px;line-height:1.6">There&#39;s no ` +
      `FounderFloor account under this email yet, so your purchase is parked and ` +
      `waiting: create an account (or sign in) with <strong>this exact email</strong> ` +
      `and it lands automatically.</p>`
    : `<p style="margin:0 0 12px;font-size:14px;line-height:1.6">It&#39;s live on ` +
      `your account now — no code to redeem, nothing to activate.</p>`;
  const rightsHtml = plan.tickets
    ? `<p style="margin:0 0 12px;font-size:13px;color:#6F6A5E;line-height:1.6">Tickets ` +
      `are digital content delivered immediately. As agreed at checkout, delivery ` +
      `began right away, which ends the 14-day withdrawal right — ticket purchases ` +
      `are final and non-refundable. Details in the <a href="${SITE_URL}/terms" ` +
      `style="color:#6F6A5E">Terms of Service</a>.</p>`
    : `<p style="margin:0 0 12px;font-size:13px;color:#6F6A5E;line-height:1.6">As a ` +
      `consumer you can withdraw from this purchase within 14 days without giving a ` +
      `reason — just reply to this email saying so, and anything already paid is ` +
      `refunded pro-rata for the unused time. You can also stop a subscription from ` +
      `renewing any time at <a href="${SITE_URL}/cancel" style="color:#6F6A5E">` +
      `${SITE_URL.replace(/^https?:\/\//, "")}/cancel</a> or through Stripe&#39;s ` +
      `billing portal linked from your receipt. Details in the <a href="${SITE_URL}/terms" ` +
      `style="color:#6F6A5E">Terms of Service</a>.</p>`;
  const rightsText = plan.tickets
    ? `Tickets are digital content delivered immediately; as agreed at checkout, delivery began right away, which ends the 14-day withdrawal right — ticket purchases are final and non-refundable. Details: ${SITE_URL}/terms`
    : `You can withdraw from this purchase within 14 days without giving a reason — reply to this email saying so. You can also cancel future renewals any time at ${SITE_URL}/cancel. Details: ${SITE_URL}/terms`;
  sendEmail(
    email,
    "Your FounderFloor purchase",
    emailShell(
      "Thanks — your purchase is confirmed",
      `<p style="margin:0 0 12px;font-size:14px;line-height:1.6">You bought ` +
        `<strong>${esc(what)}</strong>. Stripe sends your payment receipt separately.</p>` +
        heldHtml +
        rightsHtml +
        emailBtn(SITE_URL + "/profile", held ? "Claim it" : "See it on your profile"),
    ),
    `You bought ${what} on FounderFloor. Stripe sends your payment receipt separately.\n\n` +
      (held
        ? `There's no account under this email yet — create one (or sign in) with this exact email at ${SITE_URL}/profile and the purchase lands automatically.\n\n`
        : `It's live on your account now: ${SITE_URL}/profile\n\n`) +
      rightsText,
    "notice",
  );
}

/**
 * The next Open Doors window, in words, for the RSVP confirmation.
 *
 * Delegates to lib/data/event-window.mjs, the same module the web app uses,
 * so the server and the site can no longer disagree about when the doors
 * open. This function used to carry its own copy of the arithmetic under a
 * "KEEP IN SYNC" comment, which is a promise nobody keeps.
 */
function nextEventInfo(nowMs = Date.now()) {
  return windowInWords(nowMs);
}

/**
 * Confirmation for someone who left their email — either to hear when the
 * floor gets busy, or to be reminded before the next Open Doors. Every one
 * carries a one-line way out, because a list you can't leave is a list
 * nobody should be on.
 */
function sendSubscribeEmail(email, demoNight, eventWhen) {
  if (!email) return;
  const when = eventWhen ? esc(eventWhen) : "";
  sendEmail(
    email,
    demoNight ? "You're on the list for Open Doors" : "You're on the FounderFloor list",
    emailShell(
      demoNight ? "See you at Open Doors" : "You're on the list",
      (demoNight
        ? `<p style="margin:0 0 12px;font-size:14px;line-height:1.6">We'll send you one short ` +
          `reminder before the next Open Doors${when ? ` (${when})` : ""} — the three hours a week the ` +
          `floors are busy on purpose. Bring a stand or just walk around and listen.</p>`
        : `<p style="margin:0 0 12px;font-size:14px;line-height:1.6">Thanks for leaving your ` +
          `address. You'll hear from us when there's something worth walking in for — a busy ` +
          `Open Doors, a new floor — and not otherwise.</p>`) +
        `<p style="margin:0 0 12px;font-size:14px;line-height:1.6">You don't need an account to ` +
        `look around. The doors are open right now:</p>` +
        emailBtn(SITE_URL + "/lobby", "Walk the floor") +
        `<p style="margin:0;font-size:13px;color:#6F6A5E;line-height:1.6">Want off the list? ` +
        `Reply with "unsubscribe" and you're off — no forms.</p>`,
    ),
    (demoNight
      ? `You're on the list for the next FounderFloor Open Doors${eventWhen ? ` (${eventWhen})` : ""}. We'll send one short reminder before it starts.`
      : `You're on the FounderFloor list. You'll hear from us when there's something worth walking in for, and not otherwise.`) +
      `\n\nWalk the floor any time: ${SITE_URL}/lobby\n\nWant off the list? Reply with "unsubscribe".`,
    "courtesy",
  );
}

/** "alex@example.com" -> "a•••@example.com" — logs identify without leaking. */
function maskEmail(e) {
  const s = String(e ?? "");
  const at = s.indexOf("@");
  if (at <= 0) return s ? `${s[0]}•••` : "(none)";
  return `${s[0]}•••${s.slice(at)}`;
}

// Cost params are stored per account so they can be raised later without
// breaking existing logins (older accounts keep the params they were hashed with).
// N=32768 ≈ 33MB and ~100ms per hash — free for a person, ruinous at
// billions-of-guesses scale.
const SCRYPT = { N: 32768, r: 8, p: 1 };

/**
 * Per-identifier login backoff, on top of the per-IP limiter (which a
 * distributed guesser sidesteps). Keyed by the *typed* identifier — not by
 * whether an account exists — so the lockout itself can't be used to probe
 * which emails are registered. 5 straight failures locks the identifier for
 * 60s, doubling to a 15-minute ceiling; any success clears it.
 */
const loginFails = new Map(); // identifier -> { count, until }
const LOGIN_LOCK_AFTER = 5;
const LOGIN_LOCK_BASE_MS = 60_000;
const LOGIN_LOCK_MAX_MS = 15 * 60_000;
const MAX_LOGIN_FAILS = 5000;

function loginLocked(key) {
  const e = loginFails.get(key);
  return !!e && e.until > Date.now();
}

function noteLoginFailure(key) {
  if (!key) return;
  const e = loginFails.get(key) ?? { count: 0, until: 0 };
  e.count++;
  if (e.count >= LOGIN_LOCK_AFTER) {
    const excess = e.count - LOGIN_LOCK_AFTER;
    e.until = Date.now() + Math.min(LOGIN_LOCK_MAX_MS, LOGIN_LOCK_BASE_MS * 2 ** excess);
  }
  if (loginFails.size >= MAX_LOGIN_FAILS && !loginFails.has(key)) return;
  loginFails.set(key, e);
}

/**
 * Password hashing is deliberately expensive (scrypt N=32768 ≈ 100ms + ~33MB).
 * The SYNC variant would block the single Node thread that also serves every
 * game frame and chat message — ~10 logins/sec would freeze the whole floor.
 * So: async scrypt (runs on libuv's threadpool, off the event loop) behind a
 * small semaphore, so a login flood queues a few hashes and rejects the rest
 * instead of stalling everyone. `overloaded()` lets callers fail fast.
 */
const HASH_MAX_CONCURRENT = Math.max(2, (availableParallelism?.() ?? 4) - 1);
const HASH_MAX_QUEUE = 32;
let hashInFlight = 0;
let hashQueued = 0;
const hashWaiters = [];

function overloaded() {
  return hashQueued >= HASH_MAX_QUEUE;
}

function hashPassword(password, salt, kdf = SCRYPT) {
  return new Promise((resolve, reject) => {
    const run = () => {
      hashInFlight++;
      scrypt(password, salt, 32, { N: kdf.N, r: kdf.r, p: kdf.p, maxmem: 64 * 1024 * 1024 }, (err, buf) => {
        hashInFlight--;
        const next = hashWaiters.shift();
        if (next) {
          hashQueued--;
          next();
        }
        if (err) reject(err);
        else resolve(buf);
      });
    };
    if (hashInFlight < HASH_MAX_CONCURRENT) run();
    else {
      hashQueued++;
      hashWaiters.push(run);
    }
  });
}

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days, refreshed on use

function verifyToken(token, profileId) {
  if (typeof token !== "string" || !token) return false;
  const entry = tokens.get(token);
  if (!entry || entry.id !== profileId) return false;
  if (Date.now() - entry.ts > TOKEN_TTL_MS) {
    tokens.delete(token);
    scheduleSave();
    return false;
  }
  entry.ts = Date.now();
  return true;
}

/**
 * guestSecrets: profileId -> { secret, ts } — a browser-held secret that binds
 * a guest id to whoever used it first. Guest ids travel to peers (booth_set
 * ownerId, calling cards, DM envelopes), so without this anyone who saw your
 * id could read your inbox or repossess your stand. First use binds; every
 * later join / social call must present the same secret. Accounts (acct_*)
 * use bearer tokens instead and never touch this map.
 */
const guestSecrets = new Map();
const MAX_GUEST_SECRETS = 20000;
const GUEST_SECRET_TTL_MS = 90 * 24 * 60 * 60 * 1000; // idle guests age out

/**
 * One identity gate for every claimed profile id.
 * acct_ ids: token must back them. Guest ids: first caller with a secret
 * binds it; a bound id then requires the matching secret. A bound id with a
 * missing/wrong secret is an impersonation attempt.
 */
function verifyIdentity(profileId, token, gs) {
  if (typeof profileId !== "string" || !profileId) return false;
  if (profileId.startsWith(ACCT_PREFIX)) return verifyToken(token, profileId);
  const supplied = typeof gs === "string" && gs.length >= 16 && gs.length <= 64 ? gs : null;
  const bound = guestSecrets.get(profileId);
  if (!bound) {
    // First use binds the secret to this id. An unbound id presented with NO
    // secret is NOT authenticated — real clients always send their browser
    // secret, so this is either a stale/legacy client (fine, it just becomes
    // an anonymous guest) or someone using a victim's semi-public guest id to
    // read their synced state, connections and DMs. Deny it.
    if (!supplied) return false;
    if (guestSecrets.size < MAX_GUEST_SECRETS) {
      guestSecrets.set(profileId, { secret: supplied, ts: Date.now() });
      scheduleSave();
    }
    return true;
  }
  if (!supplied) return false;
  const a = Buffer.from(bound.secret);
  const b = Buffer.from(supplied);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  bound.ts = Date.now();
  return true;
}

/**
 * social: profileId -> { name, requests: ConnectRequest[], outgoing: string[],
 * connections: SocialConnection[] } — the mutual-connection graph.
 * dms: pairKey ("idA|idB", sorted) -> DmMessage[] (oldest first, capped).
 * Both persist to floor-data.json. No auth in this demo: profile ids are
 * client-claimed, so this is a courtesy layer, not a security boundary.
 */
const social = new Map();
const dms = new Map();
const MAX_REQUESTS_PER_USER = 20;
const MAX_CONNECTIONS_PER_USER = 200;
const MAX_DM_PER_THREAD = 100;
const MAX_SOCIAL_USERS = 2000;

/** All live sockets per profile id (across every floor) — for social pushes. */
const socketsByProfile = new Map();

function pairKey(a, b) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function socialFor(profileId) {
  let s = social.get(profileId);
  if (!s) {
    if (social.size >= MAX_SOCIAL_USERS) return null;
    s = { name: "", requests: [], outgoing: [], connections: [] };
    social.set(profileId, s);
  }
  return s;
}

function pushToProfile(profileId, ev) {
  const socks = socketsByProfile.get(profileId);
  if (!socks) return;
  const frame = JSON.stringify(ev);
  for (const sock of socks) {
    if (sock.readyState === OPEN) sock.send(frame);
  }
}

/** activity: floorId -> ActivityItem[] — oldest first, <= 20. */
const activity = new Map();

/**
 * Server-assigned, incrementing ChatMsg id, namespaced per boot: clients keep
 * their transcripts across the reconnect window, so a restarted server must
 * never reissue ids that collide with pre-restart messages.
 */
const BOOT = Date.now().toString(36);
let nextMsgId = 1;

/**
 * lastWalkIn: floorId -> Map<name, ts> — suppresses repeat "walked in" ticker
 * lines from flaky connections. Entries older than the window are pruned on
 * every join, so the maps stay small.
 */
const lastWalkIn = new Map();

/** Monotonic ActivityItem id counter; resumed from disk at boot. */
let nextActivityId = 1;

// ---------- persistence (guestbooks + activity) ----------

function loadData() {
  let raw;
  try {
    raw = readFileSync(DATA_FILE, "utf8");
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.warn(`[data] could not read floor-data.json (${err.message}) — starting empty`);
    }
    return; // no file yet — first boot
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") throw new Error("not an object");
  } catch {
    // Move the bad file aside instead of leaving it to be overwritten by the
    // next save — a truncated write must stay recoverable by hand.
    const aside = `${DATA_FILE}.corrupt-${Date.now()}`;
    try {
      renameSync(DATA_FILE, aside);
      console.warn(`[data] floor-data.json is corrupt — moved aside to ${aside}, starting empty`);
    } catch {
      console.warn("[data] floor-data.json is corrupt and could not be moved aside — starting empty");
    }
    return;
  }

  const isEntry = (e) =>
    e && typeof e === "object" && typeof e.from === "string" && typeof e.text === "string" && typeof e.ts === "number";
  const isItem = (it) =>
    it && typeof it === "object" && typeof it.id === "string" && typeof it.text === "string" && typeof it.ts === "number";

  if (parsed.guestbooks && typeof parsed.guestbooks === "object") {
    for (const [floorId, books] of Object.entries(parsed.guestbooks)) {
      if (!books || typeof books !== "object") continue;
      const map = new Map();
      for (const [key, entries] of Object.entries(books)) {
        if (!Array.isArray(entries)) continue;
        const clean = entries
          .filter(isEntry)
          .slice(0, GUESTBOOK_KEEP)
          .map((e) => ({ from: e.from.slice(0, MAX_NAME_LEN), text: e.text.slice(0, MAX_SIGN_LEN), ts: e.ts }));
        if (clean.length) map.set(key.slice(0, MAX_KEY_LEN), clean);
      }
      if (map.size) guestbooks.set(floorId.slice(0, MAX_ID_LEN), map);
    }
  }

  if (parsed.stands && typeof parsed.stands === "object") {
    const cutoff = Date.now() - STAND_TTL_MS;
    for (const [floorId, byOwner] of Object.entries(parsed.stands)) {
      if (!byOwner || typeof byOwner !== "object") continue;
      const map = new Map();
      for (const [ownerId, st] of Object.entries(byOwner)) {
        if (!st || typeof st !== "object" || typeof st.lastSeen !== "number") continue;
        if (st.lastSeen < cutoff) continue; // expired while the server was down
        const claim = sanitizeClaim(st.claim);
        if (!claim) continue;
        map.set(ownerId.slice(0, MAX_ID_LEN), {
          claim,
          ownerName: typeof st.ownerName === "string" ? st.ownerName.slice(0, MAX_NAME_LEN) : "founder",
          lastSeen: st.lastSeen,
        });
      }
      if (map.size) stands.set(floorId.slice(0, MAX_ID_LEN), map);
    }
    // One-stand rule sweep: data saved before the rule (or written by an
    // older server) can hold several floors' stands for one founder. Keep
    // the most recently visited real-floor stand, drop the rest.
    const bestFloor = new Map(); // ownerId -> { floorId, lastSeen }
    for (const [floorId, byOwner] of stands) {
      if (!isRealFloor(floorId)) continue;
      for (const [ownerId, st] of byOwner) {
        const best = bestFloor.get(ownerId);
        if (!best || st.lastSeen > best.lastSeen) {
          bestFloor.set(ownerId, { floorId, lastSeen: st.lastSeen });
        }
      }
    }
    let dupes = 0;
    for (const [floorId, byOwner] of stands) {
      if (!isRealFloor(floorId)) continue;
      for (const ownerId of [...byOwner.keys()]) {
        if (bestFloor.get(ownerId).floorId !== floorId) {
          byOwner.delete(ownerId);
          dupes++;
        }
      }
      if (byOwner.size === 0) stands.delete(floorId);
    }
    if (dupes) console.log(`[stands] dropped ${dupes} duplicate stand(s) at load — one stand per founder`);
  }

  if (parsed.accounts && typeof parsed.accounts === "object") {
    for (const [nameLower, a] of Object.entries(parsed.accounts)) {
      if (!a || typeof a !== "object" || accounts.size >= MAX_ACCOUNTS) continue;
      if (typeof a.id !== "string" || typeof a.name !== "string" || typeof a.salt !== "string" || typeof a.hash !== "string") continue;
      const kdf =
        a.kdf && Number.isInteger(a.kdf.N) && Number.isInteger(a.kdf.r) && Number.isInteger(a.kdf.p)
          ? { N: a.kdf.N, r: a.kdf.r, p: a.kdf.p }
          : { ...SCRYPT };
      const acct = {
        id: a.id,
        name: a.name,
        email: normalizeEmail(a.email),
        salt: a.salt,
        hash: a.hash,
        kdf,
        devices: Array.isArray(a.devices)
          ? a.devices.filter((d) => typeof d === "string" && d.length === 16).slice(-MAX_DEVICES_PER_ACCOUNT)
          : [],
        created: typeof a.created === "number" ? a.created : 0,
      };
      const paid = sanitizePaid(a.paid);
      if (paid) acct.paid = paid;
      const tp = Number(a.ticketsPurchased);
      if (Number.isFinite(tp) && tp > 0) acct.ticketsPurchased = Math.min(100_000_000, Math.trunc(tp));
      const seat = Number(a.foundingSeat);
      if (Number.isInteger(seat) && seat >= 1 && seat <= FOUNDING_SEATS) acct.foundingSeat = seat;
      if (typeof a.ref === "string" && /^[a-z0-9]{4,32}$/.test(a.ref)) acct.ref = a.ref;
      if (typeof a.referredBy === "string" && a.referredBy.startsWith(ACCT_PREFIX)) {
        acct.referredBy = a.referredBy.slice(0, MAX_ID_LEN);
      }
      const rd = Number(a.refDays);
      if (Number.isFinite(rd) && rd > 0) acct.refDays = Math.min(MAX_REFERRAL_DAYS, Math.trunc(rd));
      const rc = Number(a.refCount);
      if (Number.isFinite(rc) && rc > 0) acct.refCount = Math.min(100_000, Math.trunc(rc));
      const tstart = Number(a.trialStarted);
      if (Number.isFinite(tstart) && tstart > 0) acct.trialStarted = tstart;
      accounts.set(nameLower.slice(0, MAX_NAME_LEN), acct);
      indexAccount(acct);
    }
    // The file is the truth about who holds a seat, so the tally is rebuilt
    // from it rather than persisted separately and trusted.
    // Codes are indexed after every account is in, so a duplicate in a
    // hand-edited file loses to the first one loaded instead of silently
    // pointing a stranger's invites at somebody else's account.
    for (const acct of accountsById.values()) {
      if (typeof acct.ref === "string" && acct.ref && !referralCodes.has(acct.ref)) {
        referralCodes.set(acct.ref, acct.id);
      } else if (acct.ref) {
        delete acct.ref;
      }
    }
    // Everybody who predates invites gets a code here, not lazily on their
    // next read: minting one is a write, and the read path that would
    // otherwise do it can go a whole uptime without any other write to ride
    // along with. This way a code is on disk before it can be copied.
    let minted = 0;
    for (const acct of accountsById.values()) {
      if (!acct.ref) {
        ensureReferralCode(acct);
        minted++;
      }
    }
    if (minted) console.log(`[referral] minted ${minted} code(s) for existing accounts`);
    foundingSeatsUsed = countFoundingSeats();
    backfillFoundingSeats();
    if (foundingSeatsUsed) console.log(`[founding] ${foundingSeatsUsed}/${FOUNDING_SEATS} seats taken`);
  }
  if (parsed.pendingPaid && typeof parsed.pendingPaid === "object") {
    for (const [email, p] of Object.entries(parsed.pendingPaid)) {
      if (pendingPaid.size >= MAX_PENDING_PAID) break;
      const norm = normalizeEmail(email);
      const pending = sanitizePending(p);
      if (norm && pending) pendingPaid.set(norm, pending);
    }
  }
  if (Array.isArray(parsed.processedSessions)) {
    for (const id of parsed.processedSessions.slice(-MAX_PROCESSED_SESSIONS)) {
      if (typeof id === "string" && id) processedSessions.add(id.slice(0, 80));
    }
  }
  if (parsed.resetTokens && typeof parsed.resetTokens === "object") {
    const cutoff = Date.now() - RESET_TTL_MS;
    for (const [tok, v] of Object.entries(parsed.resetTokens)) {
      if (tok.length !== 64 || resetTokens.size >= MAX_RESET_TOKENS) continue;
      if (v && typeof v === "object" && typeof v.id === "string" && typeof v.ts === "number" && v.ts > cutoff) {
        resetTokens.set(tok, { id: v.id, ts: v.ts });
      }
    }
  }
  if (parsed.tokens && typeof parsed.tokens === "object") {
    const cutoff = Date.now() - TOKEN_TTL_MS;
    for (const [tok, v] of Object.entries(parsed.tokens)) {
      if (tok.length !== 64) continue;
      // current format { id, ts }; pre-TTL files stored a bare id string
      if (v && typeof v === "object" && typeof v.id === "string" && typeof v.ts === "number") {
        if (v.ts > cutoff) tokens.set(tok, { id: v.id, ts: v.ts });
      } else if (typeof v === "string") {
        tokens.set(tok, { id: v, ts: Date.now() });
      }
    }
  }

  if (parsed.banned && typeof parsed.banned === "object") {
    for (const [key, v] of Object.entries(parsed.banned)) {
      if (banned.size >= MAX_BANNED) break;
      if (!key || typeof v !== "object" || v === null) continue;
      banned.set(key.toLowerCase().slice(0, MAX_EMAIL_LEN), {
        reason: typeof v.reason === "string" ? v.reason.slice(0, 200) : "",
        ts: typeof v.ts === "number" ? v.ts : Date.now(),
        by: typeof v.by === "string" ? v.by.slice(0, MAX_EMAIL_LEN) : "",
      });
    }
  }

  if (parsed.registry && typeof parsed.registry === "object") {
    const cutoff = Date.now() - REGISTRY_TTL_MS;
    for (const [pid, v] of Object.entries(parsed.registry)) {
      if (registry.size >= MAX_REGISTRY) break;
      if (!v || typeof v !== "object" || typeof v.ts !== "number" || v.ts <= cutoff) continue;
      const startup = sanitizeStartup(v.startup);
      if (startup) registry.set(pid.slice(0, MAX_ID_LEN), { startup, ts: v.ts });
    }
  }

  if (parsed.profileStates && typeof parsed.profileStates === "object") {
    const cutoff = Date.now() - PROFILE_STATE_TTL_MS;
    for (const [pid, v] of Object.entries(parsed.profileStates)) {
      if (profileStates.size >= MAX_PROFILE_STATES) break;
      if (!v || typeof v !== "object" || typeof v.savedAt !== "number" || v.savedAt <= cutoff) continue;
      const state = sanitizeStateBlob(v.state);
      if (state) profileStates.set(pid.slice(0, MAX_ID_LEN), { state, savedAt: v.savedAt });
    }
  }

  if (parsed.guestSecrets && typeof parsed.guestSecrets === "object") {
    const cutoff = Date.now() - GUEST_SECRET_TTL_MS;
    for (const [pid, v] of Object.entries(parsed.guestSecrets)) {
      if (guestSecrets.size >= MAX_GUEST_SECRETS) break;
      if (v && typeof v === "object" && typeof v.secret === "string" && typeof v.ts === "number" && v.ts > cutoff) {
        guestSecrets.set(pid.slice(0, MAX_ID_LEN), { secret: v.secret.slice(0, 64), ts: v.ts });
      }
    }
  }

  if (parsed.social && typeof parsed.social === "object") {
    for (const [pid, s] of Object.entries(parsed.social)) {
      if (!s || typeof s !== "object" || social.size >= MAX_SOCIAL_USERS) continue;
      social.set(pid.slice(0, MAX_ID_LEN), {
        name: typeof s.name === "string" ? s.name.slice(0, MAX_NAME_LEN) : "",
        requests: Array.isArray(s.requests) ? s.requests.slice(0, MAX_REQUESTS_PER_USER) : [],
        outgoing: Array.isArray(s.outgoing) ? s.outgoing.filter((x) => typeof x === "string").slice(0, 50) : [],
        connections: Array.isArray(s.connections) ? s.connections.slice(0, MAX_CONNECTIONS_PER_USER) : [],
      });
    }
  }

  if (parsed.dms && typeof parsed.dms === "object") {
    for (const [key, msgs] of Object.entries(parsed.dms)) {
      if (!Array.isArray(msgs)) continue;
      const clean = msgs
        .filter((m) => m && typeof m === "object" && typeof m.fromId === "string" && typeof m.text === "string" && typeof m.ts === "number")
        .slice(-MAX_DM_PER_THREAD);
      if (clean.length) dms.set(key.slice(0, 2 * MAX_ID_LEN + 1), clean);
    }
  }

  if (Array.isArray(parsed.reports)) {
    reports = parsed.reports
      .filter((r) => r && typeof r === "object" && typeof r.ts === "number")
      .slice(-MAX_REPORTS);
  }

  // The moderation queue survives a restart. An operator inbox that empties
  // itself whenever the process cycles is an inbox nobody can trust.
  if (Array.isArray(parsed.flagged)) {
    for (const f of parsed.flagged.slice(0, MAX_FLAGGED)) {
      if (f && typeof f === "object" && typeof f.ts === "number" && f.ownerId) {
        flagged.push({
          ownerId: String(f.ownerId).slice(0, MAX_ID_LEN),
          name: String(f.name ?? "").slice(0, 40),
          oneLiner: String(f.oneLiner ?? "").slice(0, 80),
          link: typeof f.link === "string" ? f.link.slice(0, 220) : "",
          terms: Array.isArray(f.terms) ? f.terms.slice(0, 8).map((t) => String(t).slice(0, 40)) : [],
          where: String(f.where ?? "").slice(0, 32),
          ts: f.ts,
        });
      }
    }
  }

  if (Array.isArray(parsed.events)) {
    for (const e of parsed.events.slice(0, MAX_EVENTS)) {
      if (e && typeof e === "object" && typeof e.startMs === "number" && e.title) {
        events.push({
          id: String(e.id ?? "").slice(0, 24) || `e${events.length}`,
          title: String(e.title).slice(0, 80),
          startMs: e.startMs,
          endMs: typeof e.endMs === "number" ? e.endMs : undefined,
          where: String(e.where ?? "").slice(0, 60),
          blurb: String(e.blurb ?? "").slice(0, 200),
          href: typeof e.href === "string" ? e.href.slice(0, 220) : "",
        });
      }
    }
    events.sort((a, b) => a.startMs - b.startMs);
  }

  if (Array.isArray(parsed.feedback)) {
    feedback = parsed.feedback
      .filter((f) => f && typeof f === "object" && typeof f.ts === "number" && typeof f.text === "string")
      .slice(-MAX_FEEDBACK);
  }

  if (parsed.subscribers && typeof parsed.subscribers === "object") {
    for (const [key, s] of Object.entries(parsed.subscribers)) {
      if (subscribers.size >= MAX_SUBSCRIBERS) break;
      if (!s || typeof s !== "object" || typeof s.ts !== "number") continue;
      const email = normalizeEmail(s.email ?? key);
      if (!email) continue;
      subscribers.set(email, {
        email,
        source: typeof s.source === "string" ? s.source.slice(0, 24) : "landing",
        ts: s.ts,
        demoNight: s.demoNight === true,
      });
    }
  }

  if (parsed.activity && typeof parsed.activity === "object") {
    for (const [floorId, items] of Object.entries(parsed.activity)) {
      if (!Array.isArray(items)) continue;
      const clean = items
        .filter(isItem)
        .slice(-ACTIVITY_KEEP)
        .map((it) => ({ id: it.id, text: it.text, ts: it.ts }));
      if (clean.length) activity.set(floorId.slice(0, MAX_ID_LEN), clean);
      // Resume the id counter past everything already on disk so ids stay
      // monotonic across restarts.
      for (const it of clean) {
        const m = /^a(\d+)$/.exec(it.id);
        if (m) nextActivityId = Math.max(nextActivityId, Number(m[1]) + 1);
      }
    }
  }
}

let saveTimer = null;

/** Coalesce writes: the first change schedules one save 2s out; later changes ride along. */
function scheduleSave() {
  if (saveTimer !== null) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    saveNow();
  }, SAVE_DEBOUNCE_MS);
}

function saveNow() {
  const data = {
    guestbooks: Object.fromEntries(
      [...guestbooks].map(([floorId, books]) => [floorId, Object.fromEntries(books)]),
    ),
    activity: Object.fromEntries(activity),
    stands: Object.fromEntries(
      [...stands].map(([floorId, byOwner]) => [floorId, Object.fromEntries(byOwner)]),
    ),
    reports,
    flagged,
    feedback,
    events,
    subscribers: Object.fromEntries(subscribers),
    social: Object.fromEntries(social),
    dms: Object.fromEntries(dms),
    accounts: Object.fromEntries(accounts),
    tokens: Object.fromEntries(tokens),
    resetTokens: Object.fromEntries(resetTokens),
    guestSecrets: Object.fromEntries(guestSecrets),
    registry: Object.fromEntries(registry),
    profileStates: Object.fromEntries(profileStates),
    pendingPaid: Object.fromEntries(pendingPaid),
    processedSessions: [...processedSessions],
    banned: Object.fromEntries(banned),
  };
  const tmp = `${DATA_FILE}.tmp`;
  try {
    // Atomic on POSIX: readers only ever see the old or the new full file.
    // fsync before rename, or a power loss can leave the rename pointing at
    // an unflushed (empty) file on some filesystems.
    const fd = openSync(tmp, "w");
    try {
      writeSync(fd, JSON.stringify(data));
      fsyncSync(fd);
    } finally {
      closeSync(fd);
    }
    rotateBackup();
    renameSync(tmp, DATA_FILE);
  } catch (err) {
    console.warn(`[data] persist failed: ${err.message}`);
  }
}

/**
 * Once per calendar day, keep a copy of the current data file before the
 * first overwrite (floor-data.backup-N.json, newest first, keep 3). Cheap
 * insurance: a bad deploy or bug can't silently eat everyone's stands,
 * accounts, and chats — yesterday is always on disk.
 */
let lastBackupDay = "";
function rotateBackup() {
  const day = new Date().toISOString().slice(0, 10);
  if (day === lastBackupDay) return;
  try {
    readFileSync(DATA_FILE);
  } catch {
    return; // no current file yet — try again on the next save, same day
  }
  try {
    const bak = (n) => `${DATA_FILE.replace(/\.json$/, "")}.backup-${n}.json`;
    for (let n = 2; n >= 1; n--) {
      try {
        renameSync(bak(n), bak(n + 1));
      } catch {
        // that slot didn't exist yet — fine
      }
    }
    copyFileSync(DATA_FILE, bak(1));
    lastBackupDay = day;
  } catch (err) {
    console.warn(`[data] backup rotation failed: ${err.message}`);
  }
}

function flushAndExit() {
  if (saveTimer !== null) {
    clearTimeout(saveTimer);
    saveTimer = null;
    saveNow(); // a pending debounce means unsaved changes — flush them
  }
  process.exit(0);
}

process.on("SIGINT", flushAndExit);
process.on("SIGTERM", flushAndExit);

// NOTE: loadData() is called below the sanitizer section — sanitizeClaim()
// reads consts (MAX_SPOT_INDEX, GLYPHS, ...) that must be initialized first.

// ---------- sanitizers ----------

function clampIndex(v, max) {
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 && n <= max ? n : 0;
}

function sanitizeLook(look) {
  return {
    skin: clampIndex(look?.skin, 5),
    outfit: clampIndex(look?.outfit, 7),
    hair: clampIndex(look?.hair, 7),
  };
}

function sanitizeMove(s) {
  const x = Number(s?.x);
  const y = Number(s?.y);
  return {
    x: Number.isFinite(x) ? x : 0,
    y: Number.isFinite(y) ? y : 0,
    dir: DIRS.has(s?.dir) ? s.dir : "down",
    moving: s?.moving === true,
  };
}

// Control chars, zero-widths, and bidi overrides (U+202E and friends) enable
// display spoofing in names, chat, and the ticker — strip them everywhere.
// Newlines are preserved only where multi-line input is legit (sanitizeStr).
const CONTROL_RE = /[\u0000-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;

function stripControl(s) {
  return s.replace(CONTROL_RE, "");
}

function sanitizeName(name) {
  const trimmed =
    typeof name === "string" ? stripControl(name).replace(/\s+/g, " ").trim().slice(0, MAX_NAME_LEN) : "";
  return trimmed || "guest";
}

function sanitizeText(text) {
  return typeof text === "string"
    ? stripControl(text).replace(/\s+/g, " ").trim().slice(0, MAX_TEXT_LEN)
    : "";
}

// ---------- content moderation ----------
// Two severity tiers. SLURS/hate: the whole message is rejected — there is
// no "masked" version of a slur worth broadcasting. PROFANITY: the word is
// masked in place and the rest of the message goes through. Matching is
// token-based on a normalized form (lowercase, look-alike characters
// folded, repeated letters collapsed) so "F0ck"/"fuuuck" are caught while
// "Scunthorpe"/"assist"/"class" are not.

const LEET_MAP = { 0: "o", 1: "i", 3: "e", 4: "a", 5: "s", 7: "t", "@": "a", "$": "s", "!": "i", "+": "t" };
function normalizeToken(word) {
  return word
    .toLowerCase()
    .replace(/[013457@$!+]/g, (c) => LEET_MAP[c] ?? c)
    .replace(/[^a-z]/g, "");
}
const collapseRuns = (w) => w.replace(/(.)\1+/g, "$1");

// Hateful slurs and direct-harm phrases — message dropped entirely.
const SLUR_WORDS = new Set([
  "nigger", "niger", "nigga", "niga", "negro", "coon", "faggot", "fagot", "fag",
  "dyke", "tranny", "trannie", "shemale", "kike", "spic", "chink", "gook",
  "wetback", "beaner", "raghead", "towelhead", "retard", "retarded", "tard",
  "kys",
]);
// Direct-harm phrases matched on the flattened text (spaces removed).
const SLUR_PHRASES = ["killyourself", "gokillyourself", "killurself"];

// Common profanity — masked in place, message otherwise delivered.
const PROFANITY_WORDS = new Set([
  "fuck", "fucker", "fucking", "fucked", "fuk", "fuks", "motherfucker",
  "shit", "shitty", "bullshit", "shite", "bitch", "bitches", "bitchy",
  "asshole", "arsehole", "ass", "arse", "cunt", "cunts", "dick", "dickhead",
  "cock", "pussy", "bastard", "whore", "slut", "sluts", "twat", "wanker",
  "prick", "douche", "douchebag", "jackass", "piss", "pissed", "cum",
  "jizz", "dildo", "bollocks", "damn", "goddamn",
]);

const inSet = (set, tok) => set.has(tok) || set.has(collapseRuns(tok));

/**
 * Moderate a free-text message. Returns null when the text contains hate
 * speech (drop it), otherwise the text with profanity masked.
 */
function moderateText(text) {
  if (!text) return text;
  const flat = normalizeToken(text);
  for (const p of SLUR_PHRASES) {
    if (flat.includes(p)) return null;
  }
  const parts = text.split(/(\s+)/);
  for (const part of parts) {
    const tok = normalizeToken(part);
    if (tok && inSet(SLUR_WORDS, tok)) return null;
  }
  return parts
    .map((part) => {
      if (/^\s*$/.test(part)) return part;
      const tok = normalizeToken(part);
      return tok && inSet(PROFANITY_WORDS, tok)
        ? "✱".repeat(Math.min(part.length, 6))
        : part;
    })
    .join("");
}

/**
 * Moderate a display field (name, status, sign, pitch…): these render all
 * over the site, so BOTH tiers are masked in place — a slur in a name
 * becomes ✱✱✱ rather than kicking the join.
 */
function moderateField(text) {
  if (!text) return text;
  const flat = normalizeToken(text);
  if (SLUR_PHRASES.some((p) => flat.includes(p))) return "✱✱✱";
  return text
    .split(/(\s+)/)
    .map((part) => {
      if (/^\s*$/.test(part)) return part;
      const tok = normalizeToken(part);
      return tok && (inSet(SLUR_WORDS, tok) || inSet(PROFANITY_WORDS, tok))
        ? "✱".repeat(Math.min(part.length, 6))
        : part;
    })
    .join("");
}

/* ------------------------------------------------ prohibited content ----
 *
 * A THIRD tier, above slurs and profanity, for what a stand may not
 * advertise at all. The other two mask and move on; this one REFUSES THE
 * SAVE, because a drug market with stars in its name is still a drug
 * market, and the operator is the one hosting it.
 *
 * WHAT A WORD LIST CAN AND CANNOT DO. It cannot decide legality — that
 * depends on jurisdiction, framing and intent, none of which are in the
 * string. What it can do is stop the lazy and the obvious, which is most
 * of what actually turns up, and put everything ambiguous in front of a
 * human. So there are two lists and they are drawn on different rules:
 *
 *   BLOCKED — refused outright. Kept to phrases with NO innocent reading:
 *     an explicit offer to sell an unambiguously illegal good, plus the
 *     one category that is blocked on the topic alone.
 *   WATCHED — saved, and queued for the operator to look at. Everything
 *     a real company might legitimately write: a fraud team writes about
 *     carding, a security team writes about ransomware, an NGO writes
 *     about trafficking. Blocking those would be the filter doing more
 *     damage than the spam.
 *
 * Matching mirrors the profanity filter: PHRASES are matched against the
 * letters-only flattening of the whole field, so spacing and leetspeak
 * evasions collapse into the same string; single WORDS are matched on
 * token boundaries only, never as substrings, or "something" contains
 * "meth" and every third pitch on the floor gets flagged.
 */

/** Refused outright. Every entry here has to be indefensible on its face. */
const BLOCKED_PHRASES = [
  // Sexual content involving minors. Blocked on the SUBJECT, not on an
  // offer — the only category where that is the right trade. A genuine
  // child-safety company will hit this and have to email the operator;
  // that is a cost worth paying in this direction and not the other.
  "childporn", "childpornography", "childsexabuse", "childsexual", "underagenudes",
  "underagesex", "jailbait", "preteensex", "lolicon", "cpforsale",
  // Violence for hire.
  "hitmanforhire", "hireahitman", "hireahitmen", "killforhire", "murderforhire",
  "contractkilling",
  // An OFFER plus an unambiguously illegal good. The offer is what makes
  // these safe to block: the goods on their own are watched instead,
  // because writing about them is most of what security companies do.
  "cvvforsale", "dumpsforsale", "fullzforsale", "clonedcardsforsale",
  "stolencardsforsale", "stolenaccountsforsale", "hackedaccountsforsale",
  "stolendataforsale", "buystolencards", "buystolenaccounts",
  "fakepassportsforsale", "fakeidsforsale", "buyfakepassport", "buyfakeid",
  "counterfeitcashforsale", "counterfeitnotesforsale",
  "untraceablefirearms", "ghostgunsforsale", "gunsnobackgroundcheck",
  "buymethonline", "buycocaineonline", "buyheroinonline", "buyfentanylonline",
  "drugsforsaleonline",
];

/** Saved, then put in front of a human. Ambiguity belongs here, not above. */
const WATCHED_PHRASES = [
  "humantrafficking", "moneylaundering", "launderyourmoney", "darkwebmarket",
  "darknetmarket", "bulletproofhosting", "creditcarddumps", "carderforum",
  "stolencredentials", "cashoutservice", "bankdrops", "escrowmixer",
  "coinmixer", "bypasskyc", "fakereviews", "buyfollowers", "cheatengine",
  "essaywriting", "examanswers",
];

/** Single words, matched on token boundaries. Watch-tier only. */
const WATCHED_WORDS = new Set([
  "cocaine", "heroin", "fentanyl", "meth", "methamphetamine", "mdma", "lsd",
  "ketamine", "oxycodone", "steroids", "carding", "botnet", "ddos", "ransomware",
  "keylogger", "rootkit", "spyware", "stalkerware", "counterfeit", "poaching",
  "ivory", "unlicensed", "prostitution", "escort", "escorts",
]);

/**
 * Screen one field. Returns the first blocked phrase found, or the watched
 * terms, or nothing at all.
 */
function screenText(text) {
  const out = { blocked: null, watched: [] };
  if (!text) return out;
  const flat = normalizeToken(String(text));
  for (const p of BLOCKED_PHRASES) {
    if (flat.includes(p)) {
      out.blocked = p;
      return out; // one is enough — the save is refused either way
    }
  }
  for (const p of WATCHED_PHRASES) {
    if (flat.includes(p)) out.watched.push(p);
  }
  for (const part of String(text).split(/\s+/)) {
    const tok = normalizeToken(part);
    if (tok && (WATCHED_WORDS.has(tok) || WATCHED_WORDS.has(collapseRuns(tok)))) {
      out.watched.push(tok);
    }
  }
  return out;
}

/**
 * Screen a whole stand — every field a visitor reads, plus the link, since
 * "buyfakeid.example.com" says as much as the pitch does.
 */
function screenStartup(s) {
  const fields = [s?.name, s?.oneLiner, s?.pitch, s?.goal, s?.category, s?.booth?.sign, s?.link];
  const watched = new Set();
  for (const f of fields) {
    const r = screenText(f);
    if (r.blocked) return { blocked: r.blocked, watched: [] };
    for (const w of r.watched) watched.add(w);
  }
  return { blocked: null, watched: [...watched] };
}

/**
 * The review queue: stands that tripped the watch list, newest first.
 *
 * This is the half that actually works. The block list stops what is
 * obvious; everything else is a judgement call, and a judgement call needs
 * the operator, not a regex. Capped, and persisted so a restart does not
 * quietly empty the inbox.
 */
const flagged = [];
const MAX_FLAGGED = 300;
function flagListing(ownerId, startup, terms, where) {
  if (!terms.length) return;
  flagged.unshift({
    ownerId: String(ownerId).slice(0, MAX_ID_LEN),
    name: String(startup?.name ?? "").slice(0, 40),
    oneLiner: String(startup?.oneLiner ?? "").slice(0, 80),
    link: startup?.link ?? "",
    terms: terms.slice(0, 8),
    where: String(where).slice(0, 32),
    ts: Date.now(),
  });
  if (flagged.length > MAX_FLAGGED) flagged.length = MAX_FLAGGED;
  console.log(`[moderation] flagged ${ownerId} (${where}): ${terms.join(", ")}`);
  scheduleSave();
}

/** What the founder is told. Deliberately not a list of what to avoid. */
const BLOCKED_MESSAGE =
  "that stand can't go up — it reads as something this site doesn't host. " +
  "If you think that's wrong, email the address on the About page and a person will look.";

const GLYPHS = new Set(["bolt", "leaf", "coin", "chip", "flask", "rocket", "heart", "cube", "wave", "star"]);
const PATTERNS = new Set(["solid", "border", "stripes"]);
const TRIMS = new Set(["stripes", "checker", "dots"]); // "plain" = absent
const BOOTH_STYLES = new Set(["bigtop", "garden", "arcade", "neon"]); // "classic" = absent
const BOOTH_PROPS = new Set(["plant", "balloons", "trophy", "spotlight"]);
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const MAX_SPOT_INDEX = 63;

function sanitizeStr(v, max, fallback = "") {
  return typeof v === "string" ? stripControl(v).trim().slice(0, max) : fallback;
}

/**
 * A founder's link to their own thing, or undefined.
 *
 * This is the one field on the site that puts an ATTACKER-CHOSEN URL in
 * front of a visitor, so it is an allowlist, not a blocklist. Only http
 * and https survive — `javascript:` and `data:` are the classic ways a
 * "website" field becomes stored XSS, and while React will not render a
 * javascript: href as script, this value also travels into the directory,
 * the wall and (eventually) anywhere else that trusts server-cleaned data.
 * Refusing the scheme outright is the version that stays safe when the
 * next consumer forgets to check.
 *
 * Credentials are stripped rather than rejected, since `user:pass@host` in
 * a submitted link is nearly always a paste accident, and keeping them
 * would leak somebody's password onto a public page.
 *
 * A bare "example.com" is accepted and https:// is assumed — people type
 * their domain without a scheme, and refusing that is a form that looks
 * broken rather than strict.
 */
function sanitizeLink(v) {
  if (typeof v !== "string") return undefined;
  const raw = stripControl(v).trim();
  // Length is checked BEFORE any clamping. sanitizeStr would truncate,
  // and a truncated URL is worse than no URL: it still looks like a link
  // and it points somewhere the founder never wrote.
  if (!raw || raw.length > 200) return undefined;
  let url;
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return undefined;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
  // A hostname with no dot is a machine on the READER'S network rather
  // than a public site — "localhost", "router", an intranet name — and a
  // link field is not a port scanner.
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(url.hostname)) return undefined;
  // ...which the dot rule alone does not cover: 127.0.0.1 is all dots and
  // digits and sails through it. No real TLD is numeric, so a numeric last
  // label is an IP literal (or a typo), and both are refused. Bracketed
  // IPv6 hosts fail the rule above on the brackets.
  if (/^\d+$/.test(url.hostname.slice(url.hostname.lastIndexOf(".") + 1))) return undefined;
  url.username = "";
  url.password = "";
  return url.toString();
}

/**
 * Rebuild a startup object from untrusted input: only known fields survive,
 * all of them clamped. Returns null when structurally unusable. Shared by
 * stand claims (ws) and profile registrations (HTTP).
 */
function sanitizeStartup(s) {
  if (!s || typeof s !== "object") return null;
  const name = moderateField(sanitizeStr(s.name, 40));
  if (!name) return null;
  const booth = s.booth && typeof s.booth === "object" ? s.booth : {};
  const goalProgress = Number(s.goalProgress);
  const verifiedRevenue = Number(s.verifiedRevenue);
  return {
      id: sanitizeStr(s.id, MAX_ID_LEN, "mine"),
      name,
      oneLiner: moderateField(sanitizeStr(s.oneLiner, 80)),
      pitch: moderateField(sanitizeStr(s.pitch, 600)),
      founder: moderateField(sanitizeStr(s.founder, MAX_NAME_LEN, "founder")) || "founder",
      founderLook: sanitizeLook(s.founderLook),
      category: moderateField(sanitizeStr(s.category, 32)),
      goal: moderateField(sanitizeStr(s.goal, 80)),
      goalProgress: Number.isFinite(goalProgress) ? Math.min(1, Math.max(0, goalProgress)) : 0,
      verifiedRevenue: Number.isFinite(verifiedRevenue) ? Math.max(0, verifiedRevenue) : 0,
      seekingCofounder: s.seekingCofounder === true,
      link: sanitizeLink(s.link),
      tier: s.tier === "pro" || s.tier === "founder" ? s.tier : undefined,
      booth: {
        carpet: HEX_COLOR.test(booth.carpet) ? booth.carpet : "#C2B8A3",
        banner: HEX_COLOR.test(booth.banner) ? booth.banner : "#5C5548",
        sign: moderateField(sanitizeStr(booth.sign, 12)) || name.slice(0, 12).toUpperCase(),
        glyph: GLYPHS.has(booth.glyph) ? booth.glyph : "star",
        pattern: PATTERNS.has(booth.pattern) ? booth.pattern : "solid",
        trim: TRIMS.has(booth.trim) ? booth.trim : undefined,
        style: BOOTH_STYLES.has(booth.style) ? booth.style : undefined,
        props: (() => {
          if (!Array.isArray(booth.props)) return undefined;
          const clean = [...new Set(booth.props.filter((p) => BOOTH_PROPS.has(p)))].slice(0, 3);
          return clean.length ? clean : undefined;
        })(),
        // custom banner icon: tiny data-URL PNG, downscaled client-side
        logo:
          typeof booth.logo === "string" &&
          booth.logo.startsWith("data:image/png;base64,") &&
          booth.logo.length <= 8000
            ? booth.logo
            : undefined,
    },
  };
}

/**
 * Keep only the allowlisted top-level keys of a synced app state and enforce
 * the size cap. Deep validation happens client-side on apply (sanitize() in
 * lib/store.ts guards this exactly like it guards localStorage).
 */
function sanitizeStateBlob(v) {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const out = {};
  for (const key of Object.keys(v)) {
    if (STATE_KEYS.has(key)) out[key] = v[key];
  }
  try {
    if (JSON.stringify(out).length > MAX_STATE_BYTES) return null;
  } catch {
    return null;
  }
  return out;
}

/**
 * Rebuild a claim from an untrusted frame. Returns null if the claim is
 * structurally unusable.
 */
function sanitizeClaim(claim) {
  if (!claim || typeof claim !== "object") return null;
  const spotIndex = Number(claim.spotIndex);
  if (!Number.isInteger(spotIndex) || spotIndex < 0 || spotIndex > MAX_SPOT_INDEX) return null;
  const startup = sanitizeStartup(claim.startup);
  if (!startup) return null;
  return { spotIndex, startup };
}

/**
 * A guestbook key is either a seed-startup id (slug-ish) or "spot:<n>" for a
 * claimed stand. Anything else is a fabricated frame and is dropped.
 */
const SPOT_KEY = /^spot:(\d{1,3})$/;
const ID_KEY = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
function isValidGuestbookKey(key) {
  const m = SPOT_KEY.exec(key);
  if (m) return Number(m[1]) <= MAX_SPOT_INDEX;
  return ID_KEY.test(key);
}

/** Is any live client in the room connected under this profile id? */
function ownerOnline(room, profileId) {
  if (!room) return false;
  for (const c of room.values()) {
    if (c.rawId === profileId) return true;
  }
  return false;
}

/** All persistent stands on a floor, excluding one profile — with liveness. */
function floorBooths(floorId, room, exceptProfileId) {
  const byOwner = stands.get(floorId);
  if (!byOwner) return [];
  const out = [];
  for (const [ownerId, st] of byOwner) {
    if (ownerId === exceptProfileId) continue;
    // A floor shows who is HERE. The record stays either way — it is what
    // the directory and /stand/<id> read, and it is what keeps this spot
    // reserved for its owner — but by default it is not drawn to visitors
    // while its founder is elsewhere.
    if (!STANDS_WHILE_AWAY && !ownerOnline(room, ownerId)) continue;
    out.push({ ownerId, ownerName: st.ownerName, online: ownerOnline(room, ownerId), claim: st.claim });
  }
  return out;
}

/**
 * The real floor (not this one) where this profile still has a stand, if
 * any — with the spot, so a denial can tell the client where its stand
 * actually lives (the client re-records it locally; without that, its next
 * visit to that floor would join claim-less and pack the stand up).
 */
function standElsewhere(ownerId, exceptFloorId) {
  for (const [fid, byOwner] of stands) {
    if (fid === exceptFloorId || !isRealFloor(fid)) continue;
    const st = byOwner.get(ownerId);
    if (st) return { floorId: fid, spotIndex: st.claim.spotIndex };
  }
  return null;
}

/**
 * One stand per founder: enforce it by packing up this profile's stands on
 * every real floor except the one just claimed, telling each floor's room.
 */
function releaseOtherStands(ownerId, keptFloorId) {
  let released = 0;
  for (const [fid, byOwner] of stands) {
    if (fid === keptFloorId || !isRealFloor(fid)) continue;
    if (!byOwner.delete(ownerId)) continue;
    released++;
    if (byOwner.size === 0) stands.delete(fid);
    const r = rooms.get(fid);
    if (r) broadcast(r, { t: "booth_clear", ownerId });
  }
  return released;
}

/** Which profile holds this spot (live or away), excluding one profile. */
function spotTakenBy(floorId, spotIndex, exceptProfileId) {
  const byOwner = stands.get(floorId);
  if (!byOwner) return null;
  for (const [ownerId, st] of byOwner) {
    if (ownerId !== exceptProfileId && st.claim.spotIndex === spotIndex) return ownerId;
  }
  return null;
}

/** Drop stands whose owner hasn't visited in STAND_TTL_MS. Runs hourly. */
/**
 * A guestbook belongs to the stand, not to the square of carpet.
 *
 * Books are keyed floor + "spot:<n>", so without this the notes left for
 * one founder outlived their stand and were then served to whoever claimed
 * that spot next — a stranger reading messages written to somebody else.
 * The privacy policy has always said the guestbook goes when the stand
 * goes; this is the code that makes that true.
 */
function dropGuestbook(floorId, spotIndex) {
  const books = guestbooks.get(floorId);
  if (!books) return;
  books.delete(`spot:${spotIndex}`);
  if (books.size === 0) guestbooks.delete(floorId);
}

function pruneStands() {
  const cutoff = Date.now() - STAND_TTL_MS;
  for (const [floorId, byOwner] of stands) {
    const room = rooms.get(floorId);
    for (const [ownerId, st] of byOwner) {
      if (st.lastSeen < cutoff && !ownerOnline(room, ownerId)) {
        byOwner.delete(ownerId);
        dropGuestbook(floorId, st.claim.spotIndex);
        if (room) broadcast(room, { t: "booth_clear", ownerId });
        scheduleSave();
      }
    }
    if (byOwner.size === 0) stands.delete(floorId);
  }
}
/** Hourly sweep: expired bearer tokens and long-idle guest secrets. */
function pruneCredentials() {
  const now = Date.now();
  let changed = false;
  for (const [tok, v] of tokens) {
    if (now - v.ts > TOKEN_TTL_MS) {
      tokens.delete(tok);
      changed = true;
    }
  }
  for (const [pid, v] of guestSecrets) {
    if (now - v.ts > GUEST_SECRET_TTL_MS) {
      guestSecrets.delete(pid);
      changed = true;
    }
  }
  for (const [pid, v] of registry) {
    if (now - v.ts > REGISTRY_TTL_MS) {
      registry.delete(pid);
      changed = true;
    }
  }
  for (const [pid, v] of profileStates) {
    if (now - v.savedAt > PROFILE_STATE_TTL_MS) {
      profileStates.delete(pid);
      changed = true;
    }
  }
  // Expired reset tokens: without this sweep they linger until redeemed or
  // reissued, and 500 abandoned links would wedge the MAX_RESET_TOKENS gate,
  // silently disabling password reset for everyone.
  for (const [tok, v] of resetTokens) {
    if (now - v.ts > RESET_TTL_MS) {
      resetTokens.delete(tok);
      changed = true;
    }
  }
  // Hourly email logs age out entirely; drop empties so the map can't grow.
  for (const [k, v] of emailRecipientLog) {
    if (!v.some((ts) => now - ts < 3600_000)) emailRecipientLog.delete(k);
  }
  // Login backoff entries whose lock has lapsed (or that never locked)
  // start fresh — the hourly sweep is the map's size bound.
  for (const [k, v] of loginFails) {
    if (v.until <= now) loginFails.delete(k);
  }
  if (changed) scheduleSave();
}

setInterval(pruneStands, 60 * 60 * 1000).unref();
setInterval(pruneCredentials, 60 * 60 * 1000).unref();

loadData();

// ---------- wire helpers ----------

function send(ws, ev) {
  if (ws.readyState === OPEN) ws.send(JSON.stringify(ev));
}

function broadcast(room, ev, exceptId) {
  const frame = JSON.stringify(ev);
  for (const client of room.values()) {
    if (client.id === exceptId) continue;
    if (client.ws.readyState === OPEN) client.ws.send(frame);
  }
}

function asRemotePlayer(client) {
  return {
    id: client.id,
    name: client.name,
    look: client.look,
    s: client.s,
    // JSON.stringify drops the key when undefined — absent status stays absent.
    status: client.status || undefined,
    title: client.title || undefined,
  };
}

// ---------- activity ticker ----------

/** Append one pre-rendered ticker line for a floor, cap 20, broadcast it. */
function pushActivity(room, floorId, text) {
  const item = { id: `a${nextActivityId++}`, text, ts: Date.now() };
  let items = activity.get(floorId);
  if (!items) {
    // Cap the number of floors that persist activity — random ?floor= ids
    // must not grow memory/disk without bound. The line still broadcasts.
    if (activity.size >= MAX_FLOORS_TRACKED) {
      broadcast(room, { t: "activity", item });
      return item;
    }
    items = [];
    activity.set(floorId, items);
  }
  items.push(item);
  if (items.length > ACTIVITY_KEEP) items.splice(0, items.length - ACTIVITY_KEEP);
  broadcast(room, { t: "activity", item });
  scheduleSave();
  return item;
}

// ---------- http ----------

function sendJson(res, body) {
  res.writeHead(200, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": ACAO,
  });
  res.end(JSON.stringify(body));
}

/** Read a JSON POST body, capped at 32KB; resolves null on any problem. */
function readJson(req) {
  return new Promise((resolve) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > 32 * 1024) {
        resolve(null);
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        resolve(null);
      }
    });
    req.on("error", () => resolve(null));
  });
}

/**
 * Raw request bytes (no JSON parse) — Stripe signatures are HMACs of the
 * exact payload, so the body must be verified before it's parsed.
 */
function readRawBody(req, maxBytes) {
  return new Promise((resolve) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > maxBytes) {
        resolve(null);
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", () => resolve(null));
  });
}

/** Requester calling card, rebuilt from an untrusted body. */
function sanitizeCard(card) {
  if (!card || typeof card !== "object") return null;
  const id = sanitizeStr(card.id, MAX_ID_LEN);
  const name = sanitizeStr(card.name, MAX_NAME_LEN);
  if (!id || !name) return null;
  const badges = Array.isArray(card.badges)
    ? card.badges.filter((b) => typeof b === "string").map((b) => b.slice(0, 32)).slice(0, 48)
    : [];
  const rev = Number(card.startupRevenue);
  return {
    id,
    name,
    title: sanitizeStr(card.title, 24) || undefined,
    status: sanitizeStr(card.status, MAX_STATUS_LEN) || undefined,
    badges,
    connections: Math.min(9999, Math.max(0, Math.trunc(Number(card.connections) || 0))),
    startupName: sanitizeStr(card.startupName, 40) || undefined,
    startupRevenue: Number.isFinite(rev) ? Math.max(0, rev) : undefined,
    floorsVisited: Math.min(99, Math.max(0, Math.trunc(Number(card.floorsVisited) || 0))),
  };
}

/** Resolve a target that may be a live wire id (from a DM thread) to a profile id. */
function resolveProfileId(target) {
  for (const room of rooms.values()) {
    const c = room.get(target);
    if (c) return c.rawId;
  }
  return target;
}

/**
 * The rate-limit key for a request. Behind a reverse proxy (Caddy/Cloudflare),
 * req.socket.remoteAddress is the PROXY's IP — so every visitor would share
 * one bucket, and 10 logins/min would lock out the whole site while an
 * attacker rotating identifiers slips through. Set TRUST_PROXY=1 when (and
 * only when) a trusted proxy sits in front, and we read the client from the
 * leftmost X-Forwarded-For hop. For IPv6 we key on the /64 prefix, since a
 * single attacker owns trillions of addresses inside one /64.
 */
const TRUST_PROXY = process.env.TRUST_PROXY === "1";

function clientIp(req) {
  let ip = req.socket.remoteAddress ?? "?";
  if (TRUST_PROXY) {
    const xff = req.headers["x-forwarded-for"];
    if (typeof xff === "string" && xff.length) {
      ip = xff.split(",")[0].trim() || ip;
    }
  }
  ip = ip.replace(/^::ffff:/, ""); // unwrap IPv4-mapped IPv6
  if (ip.includes(":")) {
    // collapse IPv6 to its /64 network prefix (first four hextets)
    const parts = ip.split(":");
    return parts.slice(0, 4).join(":") + "::/64";
  }
  return ip;
}

/**
 * POST /auth/*: register, login, logout. Fixed-window rate limit per IP.
 *
 * /startups/register and /trial/start ride on this too, which is
 * deliberate — they are the other two ways to make something appear on a
 * public page — but it means one founders-wall submission spends TWO of
 * the window's slots (the account, then the listing). Ten per minute per
 * IP therefore allows five wall submissions a minute from one address:
 * far more than a person needs, far less than a script wants.
 *
 * Tunable for the same reason the trial lengths are, and guarded the same
 * way: a garbled value falls back to the default rather than to NaN, since
 * `count > NaN` is false forever and would remove the limit entirely.
 */
const AUTH_RATE_LIMIT = (() => {
  const n = Number(process.env.AUTH_RATE_LIMIT ?? 10);
  return Number.isInteger(n) && n >= 1 && n <= 100_000 ? n : 10;
})();
const authAttempts = new Map(); // ip -> { windowStart, count }
function authRateLimited(req) {
  const ip = clientIp(req);
  const now = Date.now();
  let a = authAttempts.get(ip);
  if (!a || now - a.windowStart >= 60_000) {
    a = { windowStart: now, count: 0 };
    authAttempts.set(ip, a);
    if (authAttempts.size > 1000) {
      // evict expired windows only — a blanket clear() would let an attacker
      // reset everyone's counters by cycling 1000 IPs
      for (const [k, v] of authAttempts) {
        if (now - v.windowStart >= 60_000) authAttempts.delete(k);
      }
    }
  }
  return ++a.count > AUTH_RATE_LIMIT;
}

/**
 * A separate bucket for the public social writes.
 *
 * Deliberately NOT the auth bucket: that one defaults to 10/minute/IP and
 * is shared with sign-in, so folding a Connect button into it would mean
 * one office behind a single NAT browsing the directory locks everybody in
 * the building out of logging in.
 */
const SOCIAL_RATE_LIMIT = (() => {
  const n = Number(process.env.SOCIAL_RATE_LIMIT ?? 30);
  return Number.isInteger(n) && n >= 1 && n <= 100_000 ? n : 30;
})();
const socialAttempts = new Map(); // ip -> { windowStart, count }
function socialRateLimited(req) {
  const ip = clientIp(req);
  const now = Date.now();
  let a = socialAttempts.get(ip);
  if (!a || now - a.windowStart >= 60_000) {
    a = { windowStart: now, count: 0 };
    socialAttempts.set(ip, a);
    if (socialAttempts.size > 1000) {
      for (const [k, v] of socialAttempts) {
        if (now - v.windowStart >= 60_000) socialAttempts.delete(k);
      }
    }
  }
  return ++a.count > SOCIAL_RATE_LIMIT;
}

async function handleAuthPost(req, res, pathname) {
  if (authRateLimited(req)) {
    sendJson(res, { error: "slow down — try again in a minute" });
    return;
  }
  const body = await readJson(req);
  if (!body) {
    notFound(res);
    return;
  }

  if (pathname === "/auth/register") {
    const name = sanitizeStr(body.name, MAX_NAME_LEN);
    const email = normalizeEmail(body.email);
    const password = typeof body.password === "string" ? body.password : "";
    if (!email) {
      sendJson(res, { error: "that email doesn't look right — check for typos" });
      return;
    }
    if (name.length < 2) {
      sendJson(res, { error: "display name needs at least 2 characters" });
      return;
    }
    if (password.length < 6) {
      sendJson(res, { error: "password needs at least 6 characters" });
      return;
    }
    const key = name.toLowerCase();
    // One generic message for both collisions. A distinct "that email is
    // taken" would let a stranger probe which addresses have accounts (the
    // leak /auth/forgot deliberately avoids); the same wording for a name or
    // email clash closes that oracle. (Names are public on the floor, so a
    // legit name clash costs the user only a second guess.) A fully
    // enumeration-proof signup — verify the address before creating anything —
    // is a post-beta item.
    if (accounts.has(key) || accountsByEmail.has(email)) {
      sendJson(res, { error: "that email or display name is already in use — try signing in instead" });
      return;
    }
    if (accounts.size >= MAX_ACCOUNTS) {
      sendJson(res, { error: "the hall is full — no new accounts right now" });
      return;
    }
    const salt = randomBytes(16).toString("hex");
    const device = deviceIdFor(body.gs);
    const acct = {
      id: `${ACCT_PREFIX}${randomUUID()}`,
      name,
      email,
      salt,
      hash: (await hashPassword(password, salt)).toString("hex"),
      kdf: { ...SCRYPT },
      devices: device ? [device] : [],
      created: Date.now(),
    };
    accounts.set(key, acct);
    indexAccount(acct);
    ensureReferralCode(acct);
    applyPendingPaid(acct); // a checkout that paid with this email first

    /* An invite, if they arrived with one. Both sides get days. Checked
       before the founding seat so that a founding member who happened to
       use a link still credits their referrer, even though the seat itself
       leaves them nothing to extend. */
    let invitedBy = null;
    const refCode = typeof body.ref === "string" ? body.ref.trim().toLowerCase().slice(0, 32) : "";
    if (refCode) {
      const referrer = accountsById.get(referralCodes.get(refCode) ?? "");
      // Not yourself, and not an account that is somehow already yours: the
      // id comparison is the only self-referral check that actually holds,
      // since a determined person controls both addresses anyway.
      if (referrer && referrer.id !== acct.id && !isBannedAcct(referrer)) {
        invitedBy = referrer;
        acct.referredBy = referrer.id;
        referrer.refCount = (Number(referrer.refCount) || 0) + 1;
        creditReferral(referrer, "referral");
        // The joiner's welcome is a gift, not something they earned by
        // inviting anyone, so it goes through grantTrialDays rather than
        // creditReferral: it must not eat into their own invite cap, and it
        // must not appear on their card as "days earned" underneath a count
        // of nobody joined. Their own trial is still untouched and waiting.
        grantTrialDays(acct, REFERRAL_DAYS, "referral-welcome");
      }
    }

    // ...and only then the founding seat, so it upgrades whatever they
    // already had rather than being overwritten by it.
    const seat = grantFoundingSeat(acct);
    const token = randomBytes(32).toString("hex");
    tokens.set(token, { id: acct.id, ts: Date.now() });
    scheduleSave();
    console.log(
      `[auth] register name="${name}" id=${acct.id}` +
        (seat ? ` founding-seat=${seat}/${FOUNDING_SEATS}` : "") +
        (invitedBy ? ` referred-by=${invitedBy.id}` : ""),
    );
    sendWelcomeEmail(acct);
    sendJson(res, {
      id: acct.id,
      name: acct.name,
      email: acct.email,
      token,
      foundingSeat: seat || undefined,
      referredBy: invitedBy ? invitedBy.name : undefined,
    });
    return;
  }

  if (pathname === "/auth/login") {
    const email = normalizeEmail(body.email);
    const name = sanitizeStr(body.name, MAX_NAME_LEN);
    const failKey = email || name.toLowerCase();
    if (failKey && loginLocked(failKey)) {
      sendJson(res, { error: "too many tries for this account — wait a minute, then try again" });
      return;
    }
    // Shed load rather than pin the event loop: under a hashing flood, reject
    // fast instead of queueing another 100ms scrypt behind the game frames.
    if (overloaded()) {
      sendJson(res, { error: "busy right now — try again in a moment" });
      return;
    }
    // Try email first, then fall back to a display-name match. The client
    // sends both fields, so a legacy account whose *name* happens to contain
    // "@" (names only strip control chars) still resolves by name instead of
    // being misrouted to a doomed email lookup and locked out.
    const acct =
      (email ? accountsByEmail.get(email) : undefined) ??
      (name ? accounts.get(name.toLowerCase()) : undefined);
    const password = typeof body.password === "string" ? body.password : "";
    // Constant-shape compare either way, so login can't probe for accounts.
    const salt = acct?.salt ?? "0".repeat(32);
    const expected = Buffer.from(acct?.hash ?? "0".repeat(64), "hex");
    const got = await hashPassword(password, salt, acct?.kdf ?? SCRYPT);
    if (!acct || expected.length !== got.length || !timingSafeEqual(expected, got)) {
      noteLoginFailure(failKey);
      sendJson(res, { error: "wrong email or password" });
      return;
    }
    loginFails.delete(failKey);
    if (isBannedAcct(acct)) {
      sendJson(res, { error: "this account is suspended — contact the operator via the About page" });
      return;
    }
    const token = randomBytes(32).toString("hex");
    tokens.set(token, { id: acct.id, ts: Date.now() });
    // Unrecognized browser? Tell the owner. The very first sign-in of a
    // legacy account (no devices recorded yet) also lands here — that's a
    // feature, it announces the alerts are on.
    const device = deviceIdFor(body.gs);
    if (!Array.isArray(acct.devices)) acct.devices = [];
    if (!device || !acct.devices.includes(device)) {
      sendSigninAlertEmail(acct);
      if (device) {
        acct.devices.push(device);
        if (acct.devices.length > MAX_DEVICES_PER_ACCOUNT) acct.devices.shift();
      }
    }
    scheduleSave();
    sendJson(res, { id: acct.id, name: acct.name, email: acct.email ?? "", token });
    return;
  }

  /**
   * Start the free trial. Once per account, ever.
   *
   * Refused for a PERMANENT entitlement rather than overwriting it: a
   * founding member or a paying customer starting a "trial" would be
   * handing themselves an expiry date they did not have.
   *
   * Not refused for a running window, though. Somebody who arrived on an
   * invite is holding referral days, and those are a separate gift — the
   * card offered them 7 days for joining and 7 days for trying Founder+,
   * and both promises have to be kept. The days stack onto the end of
   * whatever is already running.
   *
   * This is also the only place `trialStarted` is written, which is what
   * makes "once per account, ever" true: it has to be impossible for an
   * invite to consume a trial that was never handed over.
   */
  if (pathname === "/trial/start") {
    const token = typeof body.token === "string" ? body.token : "";
    const entry = tokens.get(token);
    const acct = entry ? accountsById.get(entry.id) : undefined;
    if (!acct) {
      sendJson(res, { error: "sign in first" });
      return;
    }
    if (isBannedAcct(acct)) {
      sendJson(res, { error: "this account is suspended" });
      return;
    }
    if (acct.trialStarted) {
      sendJson(res, { error: "you have already had the free trial" });
      return;
    }
    if (isPermanent(entitlementOf(acct))) {
      sendJson(res, { error: "you already have Founder+ — there is nothing to try" });
      return;
    }
    // Read what the grant ACTUALLY gave rather than assuming acct.paid now
    // exists. TRIAL_DAYS=0 is a legitimate way for an operator to switch
    // the offer off — envDays accepts it, and so does an env line typed as
    // `TRIAL_DAYS=` with nothing after it — and grantTrialDays returns
    // early on zero without ever assigning acct.paid. Reaching into it
    // blind threw a TypeError inside a `void`-dispatched handler, which on
    // this server is not a failed request: it is the process exiting and
    // every open floor going down with it, repeatable by anyone with an
    // account. The trial is only stamped as used if days were handed over.
    const gave = grantTrialDays(acct, TRIAL_DAYS, "trial");
    if (gave <= 0) {
      sendJson(res, { error: "the free trial is not running right now" });
      return;
    }
    acct.trialStarted = Date.now();
    scheduleSave();
    console.log(`[trial] start id=${acct.id} days=${gave}`);
    sendJson(res, { ok: true, until: acct.paid.until, days: gave });
    return;
  }

  if (pathname === "/auth/logout") {
    const token = typeof body.token === "string" ? body.token : "";
    if (tokens.delete(token)) scheduleSave();
    sendJson(res, { ok: true });
    return;
  }

  if (pathname === "/auth/forgot") {
    const email = normalizeEmail(body.email);
    // Always the same answer — this route must not reveal which emails exist.
    sendJson(res, { ok: true });
    const acct = email ? accountsByEmail.get(email) : undefined;
    if (!acct || !acct.email) return;
    // If we can't actually deliver a reset email this moment (an attacker has
    // spammed /auth/forgot at this address and used up its hourly critical
    // budget, or the daily ceiling is hit), leave the existing token untouched
    // and send nothing. Rotating it here would mint a fresh token, invalidate
    // the last one the owner actually received, and then drop the new email —
    // stranding the victim with only dead links.
    if (!emailQuotaAvailable(acct.email, "reset")) return;
    // One outstanding link per account: a new request invalidates the old.
    for (const [tok, v] of resetTokens) {
      if (v.id === acct.id) resetTokens.delete(tok);
    }
    if (resetTokens.size >= MAX_RESET_TOKENS) return;
    const token = randomBytes(32).toString("hex");
    resetTokens.set(token, { id: acct.id, ts: Date.now() });
    scheduleSave();
    sendResetEmail(acct, `${SITE_URL}/reset?token=${token}`);
    return;
  }

  if (pathname === "/auth/reset") {
    const token = typeof body.token === "string" ? body.token : "";
    const password = typeof body.password === "string" ? body.password : "";
    const entry = resetTokens.get(token);
    if (entry) resetTokens.delete(token); // single-use, even on a weak password
    if (!entry || Date.now() - entry.ts > RESET_TTL_MS) {
      sendJson(res, { error: "that reset link has expired or was already used — request a fresh one" });
      return;
    }
    if (password.length < 6) {
      sendJson(res, { error: "password needs at least 6 characters" });
      return;
    }
    const acct = accountsById.get(entry.id);
    if (!acct) {
      sendJson(res, { error: "that account no longer exists" });
      return;
    }
    const salt = randomBytes(16).toString("hex");
    acct.salt = salt;
    acct.hash = (await hashPassword(password, salt)).toString("hex");
    acct.kdf = { ...SCRYPT };
    // The point of a reset is locking intruders out: kill every session.
    for (const [tok, v] of tokens) {
      if (v.id === acct.id) tokens.delete(tok);
    }
    const fresh = randomBytes(32).toString("hex");
    tokens.set(fresh, { id: acct.id, ts: Date.now() });
    const device = deviceIdFor(body.gs);
    if (!Array.isArray(acct.devices)) acct.devices = [];
    if (device && !acct.devices.includes(device)) acct.devices.push(device);
    // Flush now, not on the 2s debounce: a crash in that window would resurrect
    // the just-used reset token and the sessions we just killed, undoing both
    // the single-use and the lock-out-intruders guarantees.
    saveNow();
    sendPasswordChangedEmail(acct);
    sendJson(res, { id: acct.id, name: acct.name, email: acct.email ?? "", token: fresh });
    return;
  }

  // Pre-email accounts attach an address here (also allows correcting one).
  if (pathname === "/auth/set-email") {
    const id = typeof body.id === "string" ? body.id : "";
    const token = typeof body.token === "string" ? body.token : "";
    if (!verifyToken(token, id)) {
      sendJson(res, { error: "sign in again to change your email" });
      return;
    }
    const email = normalizeEmail(body.email);
    if (!email) {
      sendJson(res, { error: "that email doesn't look right — check for typos" });
      return;
    }
    const existing = accountsByEmail.get(email);
    const acct = accountsById.get(id);
    if (!acct) {
      sendJson(res, { error: "that account no longer exists" });
      return;
    }
    if (existing && existing.id !== id) {
      sendJson(res, { error: "that email is already on another account" });
      return;
    }
    if (acct.email === email) {
      sendJson(res, { ok: true, email }); // no-op: already this address
      return;
    }
    // Changing (not just adding) the recovery address is a takeover lever if a
    // session token leaks, so re-prove the password before rebinding it. Adding
    // a first email needs no password — there's nothing to protect yet.
    const oldEmail = acct.email;
    if (oldEmail) {
      const password = typeof body.password === "string" ? body.password : "";
      const got = await hashPassword(password, acct.salt, acct.kdf);
      const expected = Buffer.from(acct.hash, "hex");
      if (expected.length !== got.length || !timingSafeEqual(expected, got)) {
        sendJson(res, { error: "enter your current password to change your email", needPassword: true });
        return;
      }
      accountsByEmail.delete(oldEmail);
    }
    acct.email = email;
    accountsByEmail.set(email, acct);
    applyPendingPaid(acct); // a checkout that paid with this email first
    scheduleSave();
    // Tell the OLD address it lost the account (its owner's tripwire), and the
    // new one that it's now linked.
    if (oldEmail) sendEmailChangedNotice(oldEmail, acct, email);
    sendWelcomeEmail(acct);
    sendJson(res, { ok: true, email });
    return;
  }

  notFound(res);
}

/** POST /social/*: the mutual-connection and off-floor DM API. */
async function handleSocialPost(req, res, pathname) {
  // These are reachable from public pages now (a stand permalink carries a
  // Connect button), so they get a limit of their own.
  if (socialRateLimited(req)) {
    sendJson(res, { error: "slow down — try again in a minute" });
    return;
  }
  const body = await readJson(req);
  if (!body) {
    notFound(res);
    return;
  }

  // Account ids must be backed by a token; bound guest ids by their secret.
  const actor =
    pathname === "/social/request" ? body.card?.id : pathname === "/social/dm" ? body.from : body.me;
  if (!verifyIdentity(actor, body.token, body.gs)) {
    notFound(res);
    return;
  }

  if (pathname === "/social/request") {
    const card = sanitizeCard(body.card);
    const to = resolveProfileId(sanitizeStr(body.to, MAX_ID_LEN));
    if (!card || !to || to === card.id) {
      notFound(res);
      return;
    }
    const sender = socialFor(card.id);
    const recipient = socialFor(to);
    if (!sender || !recipient) {
      notFound(res);
      return;
    }
    sender.name = card.name;
    /* `ok: true` used to come back even when the request was silently
       dropped — a full mailbox, a full outbox, a duplicate — and the floor
       cheerfully toasted "they'll see your card" over the top of it. Say
       what actually happened instead. */
    let state = "sent";
    if (sender.connections.some((c) => c.peerId === to)) state = "connected";
    else if (sender.outgoing.includes(to) || recipient.requests.some((r) => r.from.id === card.id))
      state = "already";
    else {
      // A crossing request (they asked you first) auto-accepts — you both want it.
      const crossing = sender.requests.findIndex((r) => r.from.id === to);
      if (crossing >= 0) {
        const theirs = sender.requests.splice(crossing, 1)[0];
        acceptPair(card.id, card.name, to, theirs.from.name, card.startupName, theirs.from.startupName);
        state = "connected";
      } else if (recipient.requests.length >= MAX_REQUESTS_PER_USER || sender.outgoing.length >= 50) {
        state = "full";
      } else {
        recipient.requests.push({ from: card, ts: Date.now() });
        sender.outgoing.push(to);
        pushToProfile(to, { t: "connect_request", req: { from: card, ts: Date.now() } });
      }
      scheduleSave();
    }
    sendJson(res, { ok: true, state });
    return;
  }

  if (pathname === "/social/respond") {
    const me = sanitizeStr(body.me, MAX_ID_LEN);
    const meName = sanitizeStr(body.meName, MAX_NAME_LEN) || "founder";
    const peer = sanitizeStr(body.peer, MAX_ID_LEN);
    const mine = me && social.get(me);
    if (!mine || !peer) {
      notFound(res);
      return;
    }
    const idx = mine.requests.findIndex((r) => r.from.id === peer);
    if (idx < 0) {
      sendJson(res, { ok: true }); // already handled elsewhere
      return;
    }
    const reqEntry = mine.requests.splice(idx, 1)[0];
    const theirs = social.get(peer);
    if (theirs) theirs.outgoing = theirs.outgoing.filter((x) => x !== me);
    if (body.accept === true) {
      acceptPair(me, meName, peer, reqEntry.from.name, body.meStartup, reqEntry.from.startupName);
    }
    scheduleSave();
    sendJson(res, { ok: true });
    return;
  }

  if (pathname === "/social/dm") {
    const from = sanitizeStr(body.from, MAX_ID_LEN);
    const fromName = sanitizeStr(body.fromName, MAX_NAME_LEN) || "founder";
    const to = sanitizeStr(body.to, MAX_ID_LEN);
    const text = moderateText(sanitizeText(body.text));
    const mine = from && social.get(from);
    if (!mine || !to || !text || !mine.connections.some((c) => c.peerId === to)) {
      notFound(res); // DMs only flow between connected profiles
      return;
    }
    mine.name = fromName;
    const key = pairKey(from, to);
    let thread = dms.get(key);
    if (!thread) {
      thread = [];
      dms.set(key, thread);
    }
    const msg = { fromId: from, text, ts: Date.now() };
    thread.push(msg);
    if (thread.length > MAX_DM_PER_THREAD) thread.splice(0, thread.length - MAX_DM_PER_THREAD);
    scheduleSave();
    // Live delivery: both parties' sockets everywhere (floors, inbox tabs) —
    // a message sent from the Connections screen pops up on the recipient's
    // floor immediately, and the sender's other tabs stay in sync.
    const toName = social.get(to)?.name || "connection";
    const ev = { t: "social_dm", from, fromName, to, toName, text, ts: msg.ts };
    pushToProfile(to, ev);
    pushToProfile(from, ev);
    sendJson(res, { ok: true });
    return;
  }

  notFound(res);
}

/**
 * /admin/* — operator console (ADMIN_EMAILS accounts only). Non-admins get
 * the same 404 as an unknown path: the surface stays dark.
 */
async function handleAdminPost(req, res, pathname) {
  const body = await readJson(req);
  if (!body) {
    notFound(res);
    return;
  }
  {
    const admin = adminFor(body);
    if (!admin) {
      notFound(res);
      return;
    }

    if (pathname === "/admin/overview") {
      const floors = new Map();
      for (const [floorId, room] of rooms) {
        if (floorId === "__inbox") continue;
        floors.set(floorId, { floorId, online: room.size, stands: 0 });
      }
      for (const [floorId, byOwner] of stands) {
        const f = floors.get(floorId) ?? { floorId, online: 0, stands: 0 };
        f.stands = byOwner.size;
        floors.set(floorId, f);
      }
      sendJson(res, {
        floors: [...floors.values()],
        accounts: accounts.size,
        banned: [...banned].map(([key, v]) => ({ key, ...v })),
        emailLive: !!RESEND_API_KEY && !EMAIL_ECHO,
        // Behind the admin gate, so this is config for the operator rather
        // than anything public. "email: live" was never the useful half —
        // the question that actually comes up is what address the letters
        // are signed with, and the only way to answer it was to SSH in.
        emailFrom: EMAIL_FROM,
        emailReplyTo: EMAIL_REPLY_TO || null,
        uptimeSec: Math.round(process.uptime()),
        subscribers: subscribers.size,
        demoNightRsvps: [...subscribers.values()].filter((s) => s.demoNight).length,
        // The half of moderation a word list cannot do. Trimmed to what
        // fits on a screen; the rest stays in the data file and the log.
        flagged: flagged.slice(0, 40),
      });
      return;
    }

    // The mailing list, newest first — so the operator can actually send the
    // Open Doors reminder the RSVP promised. `demoNightOnly` narrows it to
    // the people who asked for exactly that.
    if (pathname === "/admin/subscribers") {
      const onlyRsvp = body.demoNightOnly === true;
      const list = [...subscribers.values()]
        .filter((s) => !onlyRsvp || s.demoNight)
        .sort((a, b) => b.ts - a.ts);
      sendJson(res, {
        total: subscribers.size,
        returned: list.length,
        emails: list.map((s) => s.email).join(", "),
        subscribers: list,
      });
      return;
    }

    if (pathname === "/admin/grant") {
      const email = normalizeEmail(body.email);
      const acct = email ? accountsByEmail.get(email) : undefined;
      if (!acct) {
        sendJson(res, { error: "no account with that email" });
        return;
      }
      const tier = body.tier === "pro" || body.tier === "founder" ? body.tier : null;
      const founding = body.badge === "founding";
      if (tier) {
        const paid = { tier, customer: `admin:${admin.email}`, ts: Date.now() };
        if (founding || acct.paid?.badge === "founding") paid.badge = "founding";
        acct.paid = paid;
      } else if (body.tier === "none") {
        acct.paid = undefined;
      } else if (founding) {
        // founding implies the founder tier — a badge can't float alone
        acct.paid = { tier: "founder", customer: `admin:${admin.email}`, ts: Date.now(), badge: "founding" };
      }
      const tickets = Number(body.tickets);
      if (Number.isFinite(tickets) && tickets !== 0) {
        acct.ticketsPurchased = Math.max(
          0,
          Math.min(10_000_000, (acct.ticketsPurchased ?? 0) + Math.trunc(tickets)),
        );
      }
      scheduleSave();
      console.log(`[admin] ${admin.email} granted to ${email}: tier=${body.tier ?? "-"} founding=${founding} tickets=${body.tickets ?? 0}`);
      sendJson(res, {
        ok: true,
        account: { email: acct.email, paid: acct.paid ?? null, ticketsPurchased: acct.ticketsPurchased ?? 0 },
      });
      return;
    }

    if (pathname === "/admin/ban") {
      const email = normalizeEmail(body.email);
      const id = sanitizeStr(body.id, MAX_ID_LEN);
      if (!email && !id) {
        sendJson(res, { error: "give an email or a profile id" });
        return;
      }
      if (banned.size >= MAX_BANNED) {
        sendJson(res, { error: "ban list is full" });
        return;
      }
      const entry = {
        reason: sanitizeStr(body.reason, 200),
        ts: Date.now(),
        by: admin.email,
      };
      const keys = [];
      if (email) keys.push(email);
      if (id) keys.push(id.toLowerCase());
      // an email ban also bans that account's id, and vice versa
      const acct = (email && accountsByEmail.get(email)) || (id && accountsById.get(id)) || null;
      if (acct) {
        keys.push(acct.id.toLowerCase());
        if (acct.email) keys.push(acct.email);
      }
      for (const k of new Set(keys)) banned.set(k, entry);
      // Kick every live session of the banned identity.
      const targetIds = new Set(keys);
      for (const room of rooms.values()) {
        for (const [cid, c] of [...room]) {
          if (targetIds.has((c.rawId ?? "").toLowerCase())) {
            room.delete(cid);
            broadcast(room, { t: "player_leave", id: cid });
            try { c.ws.close(4003, "suspended"); } catch { /* gone */ }
          }
        }
      }
      // Then take their stands down EVERYWHERE. This walks `stands`, not
      // `rooms`: a room only exists while somebody is in it, so the old
      // version left the banned stand standing on every quiet floor —
      // exactly the floors nobody is watching. The registry listing is
      // hidden rather than deleted (see isBannedOwner in GET /startups),
      // so an unban that was a mistake restores the directory entry; the
      // stand itself goes, because the spot has to be free for somebody
      // else while they are suspended.
      let cleared = 0;
      for (const [floorId, byOwner] of stands) {
        for (const ownerId of [...byOwner.keys()]) {
          if (!targetIds.has(ownerId.toLowerCase())) continue;
          byOwner.delete(ownerId);
          cleared++;
          const room = rooms.get(floorId);
          if (room) broadcast(room, { t: "booth_clear", ownerId });
        }
        if (byOwner.size === 0) stands.delete(floorId);
      }
      scheduleSave();
      console.log(
        `[admin] ${admin.email} banned ${[...new Set(keys)].join(", ")} (${cleared} stand(s) cleared)`,
      );
      sendJson(res, { ok: true, banned: [...new Set(keys)], cleared });
      return;
    }

    if (pathname === "/admin/unban") {
      const key = (normalizeEmail(body.email) || sanitizeStr(body.id, MAX_ID_LEN)).toLowerCase();
      if (!key) {
        sendJson(res, { error: "give an email or a profile id" });
        return;
      }
      const removed = [];
      for (const k of [...banned.keys()]) {
        if (k === key) {
          banned.delete(k);
          removed.push(k);
        }
      }
      // lifting an account ban lifts its paired keys too
      const acct = accountsByEmail.get(key) ?? accountsById.get(key);
      if (acct) {
        for (const k of [acct.id.toLowerCase(), acct.email ?? ""]) {
          if (k && banned.delete(k)) removed.push(k);
        }
      }
      scheduleSave();
      console.log(`[admin] ${admin.email} unbanned ${removed.join(", ") || key}`);
      sendJson(res, { ok: true, removed });
      return;
    }

    if (pathname === "/admin/kick") {
      const id = sanitizeStr(body.id, MAX_ID_LEN).toLowerCase();
      if (!id) {
        sendJson(res, { error: "give a profile id" });
        return;
      }
      let kicked = 0;
      for (const [, room] of rooms) {
        for (const [cid, c] of [...room]) {
          if ((c.rawId ?? "").toLowerCase() === id) {
            room.delete(cid);
            broadcast(room, { t: "player_leave", id: cid });
            try { c.ws.close(4008, "removed by operator"); } catch { /* gone */ }
            kicked++;
          }
        }
      }
      console.log(`[admin] ${admin.email} kicked ${id} (${kicked} sessions)`);
      sendJson(res, { ok: true, kicked });
      return;
    }

    if (pathname === "/admin/stand-clear") {
      const floorId = sanitizeStr(body.floorId, MAX_ID_LEN);
      const ownerId = sanitizeStr(body.ownerId, MAX_ID_LEN);
      const byOwner = stands.get(floorId);
      if (!byOwner) {
        sendJson(res, { error: "no stands on that floor" });
        return;
      }
      const room = rooms.get(floorId);
      let cleared = 0;
      if (ownerId) {
        if (byOwner.delete(ownerId)) {
          if (room) broadcast(room, { t: "booth_clear", ownerId });
          cleared = 1;
        }
      } else if (Number.isInteger(body.spotIndex)) {
        for (const [oid, s] of [...byOwner]) {
          if (s.claim?.spotIndex === body.spotIndex) {
            byOwner.delete(oid);
            if (room) broadcast(room, { t: "booth_clear", ownerId: oid });
            cleared++;
          }
        }
      }
      scheduleSave();
      console.log(`[admin] ${admin.email} cleared ${cleared} stand(s) on ${floorId}`);
      sendJson(res, { ok: true, cleared });
      return;
    }

    /**
     * Take a listing off the public wall and directory.
     *
     * /admin/stand-clear only reaches a stand on one floor, which is a
     * different thing: a founder who registered a startup without ever
     * claiming a spot has no stand to clear, and that is exactly the cheap
     * path a spammer takes to get a link onto the front page. This removes
     * the registry entry AND every stand the owner holds, everywhere.
     *
     * It does not ban. A wrong listing and a bad actor are different
     * problems and the second one has /admin/ban, which now also hides
     * everything they have listed.
     */
    if (pathname === "/admin/wall-remove") {
      const ownerId = sanitizeStr(body.ownerId, MAX_ID_LEN);
      if (!ownerId) {
        sendJson(res, { error: "which owner?" });
        return;
      }
      let removed = registry.delete(ownerId) ? 1 : 0;
      for (const [fid, byOwner] of stands) {
        if (fid === "__inbox") continue;
        if (!byOwner.delete(ownerId)) continue;
        removed++;
        const room = rooms.get(fid);
        if (room) broadcast(room, { t: "booth_clear", ownerId });
      }
      if (removed) scheduleSave();
      console.log(`[admin] ${admin.email} removed ${removed} listing(s) for ${ownerId}`);
      sendJson(res, { ok: true, removed });
      return;
    }

    if (pathname === "/admin/announce") {
      const text = moderateText(sanitizeText(body.text));
      if (!text) {
        sendJson(res, { error: "nothing to announce" });
        return;
      }
      let floorsReached = 0;
      for (const [floorId, room] of rooms) {
        if (floorId === "__inbox") continue;
        pushActivity(room, floorId, `📣 ${text}`);
        floorsReached++;
      }
      console.log(`[admin] ${admin.email} announced: ${text}`);
      sendJson(res, { ok: true, floorsReached });
      return;
    }

    /**
     * The calendar. POST with a title + startMs to add one, with
     * `remove: <id>` to take one down, with neither to just read the list
     * back (the admin page renders what it gets either way).
     */
    if (pathname === "/admin/events") {
      if (body.remove) {
        const id = sanitizeStr(body.remove, 24);
        const before = events.length;
        events = events.filter((e) => e.id !== id);
        if (events.length !== before) {
          scheduleSave();
          console.log(`[admin] ${admin.email} removed event ${id}`);
        }
        sendJson(res, { ok: true, events });
        return;
      }
      if (body.title !== undefined || body.startMs !== undefined) {
        // moderateText returns null on a slur — the same "nothing to
        // announce" shape /admin/announce uses, rather than storing null.
        const title = moderateText(sanitizeStr(body.title, 80));
        const startMs = Number(body.startMs);
        if (!title || !Number.isFinite(startMs)) {
          sendJson(res, { error: "an event needs a title and a date" });
          return;
        }
        const endMs = Number(body.endMs);
        // An end before the start is a typo, not an instruction. The
        // operator can see the date they typed; say so rather than dropping
        // the field and reporting success.
        if (body.endMs !== undefined && body.endMs !== "" && !(Number.isFinite(endMs) && endMs > startMs)) {
          sendJson(res, { error: "the end has to come after the start", events });
          return;
        }
        // Finished events are history, and they are what fills a calendar
        // up. Clear them before judging the cap, and refuse OUT LOUD if it
        // is still full: capping with slice(0, MAX) would bin the entry
        // just typed (a new event is usually the furthest out, so it sorts
        // last) and still answer ok.
        const past = Date.now();
        const live = events.filter((e) => (e.endMs ?? e.startMs) > past);
        if (live.length >= MAX_EVENTS) {
          events = live;
          scheduleSave();
          sendJson(res, { error: `the calendar is full (${MAX_EVENTS}) — remove one first`, events });
          return;
        }
        live.push({
          id: `e${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`,
          title,
          startMs,
          endMs: Number.isFinite(endMs) && endMs > startMs ? endMs : undefined,
          where: moderateText(sanitizeStr(body.where, 60)) ?? "",
          blurb: moderateText(sanitizeStr(body.blurb, 200)) ?? "",
          href: sanitizeLink(body.href) ?? "",
        });
        live.sort((a, b) => a.startMs - b.startMs);
        events = live;
        scheduleSave();
        console.log(`[admin] ${admin.email} added event "${title}"`);
      }
      sendJson(res, { ok: true, events });
      return;
    }
  }

  notFound(res);
}

/**
 * Store the mutual connection both ways and tell the requester if online.
 * Startup names ride along (when known) so chat lists can show "name · company".
 */
function acceptPair(aId, aName, bId, bName, aStartup, bStartup) {
  const a = socialFor(aId);
  const b = socialFor(bId);
  if (!a || !b) return;
  const now = Date.now();
  const aCo = sanitizeStr(aStartup, 40) || undefined;
  const bCo = sanitizeStr(bStartup, 40) || undefined;
  if (!a.connections.some((c) => c.peerId === bId) && a.connections.length < MAX_CONNECTIONS_PER_USER) {
    a.connections.push({ peerId: bId, peerName: bName, peerStartup: bCo, ts: now });
  }
  if (!b.connections.some((c) => c.peerId === aId) && b.connections.length < MAX_CONNECTIONS_PER_USER) {
    b.connections.push({ peerId: aId, peerName: aName, peerStartup: aCo, ts: now });
  }
  a.outgoing = a.outgoing.filter((x) => x !== bId);
  b.outgoing = b.outgoing.filter((x) => x !== aId);
  pushToProfile(bId, { t: "connect_accept", peerId: aId, peerName: aName });
  pushToProfile(aId, { t: "connect_accept", peerId: bId, peerName: bName });
}

function notFound(res) {
  res.writeHead(404, {
    "Content-Type": "text/plain",
    "Access-Control-Allow-Origin": ACAO,
  });
  res.end("not found");
}

/**
 * Run an async route handler without letting a throw inside it take the
 * whole hall down.
 *
 * The routes below are fired and forgotten. An exception in one of them is
 * an unhandled rejection, and Node's answer to an unhandled rejection is to
 * exit — which on this process does not mean a failed request, it means
 * every open floor dropped at once, every websocket closed, and a restart
 * loop if whatever threw is reachable a second time. One reachable bug
 * anywhere therefore becomes a total outage; that is too much leverage to
 * leave lying around, so the request gets a 500 and the stack goes to the
 * journal while the hall keeps running.
 *
 * Nothing is swallowed quietly: a line in the log with a stack is how this
 * gets noticed and fixed.
 */
function dispatch(promise, res, where) {
  Promise.resolve(promise).catch((err) => {
    console.error(`[route] ${where} threw — ${err?.stack || err}`);
    try {
      if (!res.headersSent) {
        res.writeHead(500, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": ACAO,
        });
        res.end('{"error":"something went wrong on our end"}');
      } else {
        res.end();
      }
    } catch {
      /* the socket is already gone — nothing left to answer */
    }
  });
}

/* The backstop for the routes still written as `void (async () => …)()`,
   and for anything a future edit adds without going through dispatch().
   Same reasoning: on a server whose failure mode is "everybody is thrown
   out of the building", staying up and loud beats exiting quietly. */
process.on("unhandledRejection", (err) => {
  console.error(`[fatal-guard] unhandled rejection — ${err?.stack || err}`);
});

const server = createServer((req, res) => {
  let url;
  try {
    url = new URL(req.url ?? "/", "http://internal");
  } catch {
    notFound(res);
    return;
  }

  // CORS preflight for the JSON POST routes
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": ACAO,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-FF-GS",
      "Access-Control-Max-Age": "86400",
    });
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/social") {
    const me = (url.searchParams.get("me") || "").slice(0, MAX_ID_LEN);
    // Bearer material belongs in headers (query strings leak via logs and
    // Referer); the query params remain as a fallback for older clients.
    const authHeader = typeof req.headers.authorization === "string" ? req.headers.authorization : "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : (url.searchParams.get("token") ?? "");
    const gsHeader = req.headers["x-ff-gs"];
    const gs = typeof gsHeader === "string" && gsHeader ? gsHeader : (url.searchParams.get("gs") ?? "");
    if (!me || !verifyIdentity(me, token, gs)) {
      notFound(res);
      return;
    }
    const s = social.get(me) ?? { requests: [], outgoing: [], connections: [] };
    const threads = {};
    for (const c of s.connections) {
      threads[c.peerId] = dms.get(pairKey(me, c.peerId)) ?? [];
    }
    sendJson(res, {
      requests: s.requests,
      outgoing: s.outgoing,
      connections: s.connections,
      threads,
    });
    return;
  }

  if (req.method === "POST" && url.pathname.startsWith("/social/")) {
    dispatch(handleSocialPost(req, res, url.pathname), res, url.pathname);
    return;
  }

  // /trial/start rides with the auth routes on purpose: it is an
  // account-token operation and it wants the same per-IP rate limit, since
  // a loop against it is the cheapest way to probe for live tokens.
  if (req.method === "POST" && (url.pathname.startsWith("/auth/") || url.pathname === "/trial/start")) {
    dispatch(handleAuthPost(req, res, url.pathname), res, url.pathname);
    return;
  }

  if (req.method === "POST" && url.pathname.startsWith("/admin/")) {
    dispatch(handleAdminPost(req, res, url.pathname), res, url.pathname);
    return;
  }

  // Stripe's server calls this on payment events; nobody else can — every
  // request must carry a fresh HMAC made with the webhook signing secret.
  // A completed checkout attaches the purchased plan to the account whose
  // email paid (or parks it until that email gets an account); a cancelled
  // subscription takes the plan away again.
  if (STRIPE_WEBHOOK_SECRET && req.method === "POST" && url.pathname === "/stripe/webhook") {
    void (async () => {
      const raw = await readRawBody(req, 256 * 1024);
      if (!raw || !verifyStripeSignature(req.headers["stripe-signature"], raw)) {
        res.writeHead(400, { "Content-Type": "application/json", "Access-Control-Allow-Origin": ACAO });
        res.end('{"error":"bad signature"}');
        return;
      }
      let event = null;
      try {
        event = JSON.parse(raw.toString("utf8"));
      } catch {
        /* signed but unparseable — acknowledge and move on */
      }
      const type = event?.type;
      const obj = event?.data?.object;

      if (type === "checkout.session.completed" && obj && obj.payment_status === "paid") {
        const sessionId = typeof obj.id === "string" ? obj.id.slice(0, 80) : "";
        const email = normalizeEmail(obj.customer_details?.email ?? obj.customer_email);
        const mode = obj.mode === "subscription" || obj.mode === "payment" ? obj.mode : "";
        // Try the pre-tax subtotal first, then the charged total: with
        // tax-INCLUSIVE prices (the intended setup) both equal the listed
        // price, but if a Stripe price is ever set tax-exclusive the total
        // becomes listed+VAT and only the subtotal still matches — either
        // way the customer gets what they paid for.
        const plan =
          PRICE_TO_PLAN.get(`${mode}:${Number(obj.amount_subtotal)}`) ??
          PRICE_TO_PLAN.get(`${mode}:${Number(obj.amount_total)}`);
        if (sessionId && processedSessions.has(sessionId)) {
          // Stripe redelivered an event we already fulfilled — ack and skip,
          // or a retried ticket pack would pay out twice.
        } else if (email && plan) {
          const customer = typeof obj.customer === "string" ? obj.customer.slice(0, 64) : "";
          const acct = accountsByEmail.get(email);
          // Only a fulfilled (credited or held) payment is marked processed;
          // a dropped one stays retryable via Stripe's redelivery.
          let fulfilled = false;
          if (plan.tickets) {
            // consumable: credit the cumulative purchased-tickets counter
            if (acct) {
              acct.ticketsPurchased = (acct.ticketsPurchased ?? 0) + plan.tickets;
              fulfilled = true;
              console.log(`[stripe] +${plan.tickets} tickets for ${acct.id}`);
            } else if (pendingPaid.size < MAX_PENDING_PAID || pendingPaid.has(email)) {
              const prev = pendingPaid.get(email);
              pendingPaid.set(email, {
                ...(prev ?? {}),
                tickets: (prev?.tickets ?? 0) + plan.tickets,
                // a held subscription's customer id is the revocable handle —
                // a pack purchase must not overwrite it
                customer: prev?.tier ? prev.customer : prev?.customer || customer,
                ts: Date.now(),
              });
              fulfilled = true;
              console.log(`[stripe] ticket pack held for ${maskEmail(email)} — no account with that email yet`);
            }
          } else {
            const paid = { tier: plan.tier, customer, ts: Date.now() };
            if (plan.badge) paid.badge = plan.badge;
            if (acct) {
              // A founding badge is bought once and kept for life — a later
              // subscription purchase must not silently drop it.
              if (acct.paid?.badge && !paid.badge) paid.badge = acct.paid.badge;
              acct.paid = paid;
              fulfilled = true;
              console.log(`[stripe] ${paid.tier} activated for ${acct.id}`);
            } else if (pendingPaid.size < MAX_PENDING_PAID || pendingPaid.has(email)) {
              // keep any tickets the same email already has on hold
              const prev = pendingPaid.get(email);
              pendingPaid.set(email, { ...(prev ?? {}), ...paid });
              fulfilled = true;
              console.log(`[stripe] paid checkout held for ${maskEmail(email)} — no account with that email yet`);
            }
          }
          if (fulfilled) {
            markSessionProcessed(sessionId);
            scheduleSave();
            // contract confirmation with the applicable withdrawal terms —
            // Stripe's receipt covers the payment, not the contract
            sendPurchaseEmail(email, plan, !acct);
          } else {
            console.warn(`[stripe] PAID checkout dropped (pending store full) — session left unprocessed for retry`);
          }
        } else {
          console.warn(
            `[stripe] checkout didn't match a plan: mode=${mode} subtotal=${obj.amount_subtotal} total=${obj.amount_total} email=${email ? "present" : "missing"}`,
          );
        }
      } else if (type === "customer.subscription.deleted" && obj) {
        const customer = typeof obj.customer === "string" ? obj.customer : "";
        if (customer) {
          for (const acct of accountsById.values()) {
            // Founding membership is a one-time purchase, not this
            // subscription — cancelling must not revoke the badge or its year.
            if (acct.paid && acct.paid.customer === customer && !acct.paid.badge) {
              delete acct.paid;
              console.log(`[stripe] subscription ended for ${acct.id} — back to free`);
              scheduleSave();
            }
          }
          for (const [email, p] of pendingPaid) {
            if (p.customer === customer && !p.badge && p.tier) {
              // revoke only the held PLAN — one-time ticket purchases on the
              // same hold were paid for separately and must survive
              if (p.tickets) {
                delete p.tier;
                pendingPaid.set(email, p);
              } else {
                pendingPaid.delete(email);
              }
              scheduleSave();
            }
          }
        }
      }
      // 200 for every verified event, handled or not — Stripe retries anything else.
      sendJson(res, { received: true });
    })();
    return;
  }

  // Test seam only: exists solely when EMAIL_ECHO=1 (never in production),
  // so E2E tests can read the mail that would have been sent.
  if (EMAIL_ECHO && req.method === "GET" && url.pathname === "/debug/emails") {
    sendJson(res, { emails: echoedEmails });
    return;
  }

  // Uptime monitoring target: cheap, no auth, no data.
  if (req.method === "GET" && url.pathname === "/health") {
    let online = 0;
    for (const room of rooms.values()) online += room.size;
    // emailLive lets the account UI tell the truth about whether reset/alert
    // mail can actually be sent, instead of promising letters a server with no
    // RESEND_API_KEY will silently drop.
    sendJson(res, {
      ok: true,
      online,
      uptimeSec: Math.floor(process.uptime()),
      emailLive: EMAIL_ECHO || !!RESEND_API_KEY,
    });
    return;
  }

  // Beta feedback: free-text notes from anyone, stored for the operator.
  // Public notice-and-action + contract-cancellation intake. Both work
  // WITHOUT a login (a rights-holder or authority is usually not a user;
  // §312k BGB requires cancellation without hurdles), are rate-limited,
  // stored, and forwarded to the operator immediately.
  // Keep-in-touch list: the only way to reach a visitor who liked the place
  // but wasn't ready to build a stand today. No login, rate-limited,
  // idempotent (signing up twice just refreshes the entry, and an RSVP
  // upgrades an existing plain subscription rather than duplicating it).
  if (req.method === "POST" && url.pathname === "/subscribe") {
    void (async () => {
      if (authRateLimited(req)) {
        sendJson(res, { error: "slow down — try again in a minute" });
        return;
      }
      const body = await readJson(req);
      const email = body ? normalizeEmail(body.email) : "";
      // normalizeEmail lowercases and length-caps; require a plausible address
      if (!email || !email.includes("@") || !/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email)) {
        sendJson(res, { error: "that doesn't look like an email address" });
        return;
      }
      const demoNight = body?.demoNight === true;
      const source = typeof body?.source === "string" ? body.source.slice(0, 24) : "landing";
      const existing = subscribers.get(email);
      if (!existing && subscribers.size >= MAX_SUBSCRIBERS) {
        sendJson(res, { error: "the list is full right now — email the operator instead" });
        return;
      }
      // Only mail on a genuinely new signup or a new RSVP, so a double-tap
      // on the button can't send someone two identical letters.
      const isNew = !existing;
      const newRsvp = demoNight && !existing?.demoNight;
      subscribers.set(email, {
        email,
        source: existing?.source ?? source,
        ts: existing?.ts ?? Date.now(),
        demoNight: demoNight || existing?.demoNight === true,
      });
      scheduleSave();
      if (isNew || newRsvp) {
        const ev = nextEventInfo();
        sendSubscribeEmail(email, demoNight, ev);
        sendOperatorEmail(
          demoNight ? "Open Doors RSVP" : "New subscriber",
          demoNight ? "Someone RSVP'd for Open Doors" : "Someone joined the list",
          [
            ["Email", email],
            ["Source", source],
            ["Total on list", String(subscribers.size)],
          ],
          "They asked to hear from you — the list lives in floor-data.json under \"subscribers\".",
        );
      }
      console.log(
        `[subscribe] ${maskEmail(email)} source=${source} rsvp=${demoNight} total=${subscribers.size}`,
      );
      sendJson(res, { ok: true, already: !isNew && !newRsvp, demoNight });
    })();
    return;
  }

  if (req.method === "POST" && (url.pathname === "/report-content" || url.pathname === "/cancel-contract")) {
    void (async () => {
      if (authRateLimited(req)) {
        sendJson(res, { error: "slow down — try again in a minute" });
        return;
      }
      const body = await readJson(req);
      const isCancel = url.pathname === "/cancel-contract";
      const text = body ? sanitizeStr(body.text, 1500) : "";
      const contact = body ? sanitizeStr(body.contact, MAX_EMAIL_LEN) : "";
      if (!text || (isCancel && !contact)) {
        sendJson(res, { error: isCancel ? "email and details are required" : "details are required" });
        return;
      }
      const entry = {
        ts: Date.now(),
        from: contact || "anonymous",
        page: isCancel ? "[cancellation]" : "[content report]",
        text,
      };
      feedback.push(entry);
      if (feedback.length > MAX_FEEDBACK) feedback = feedback.slice(-MAX_FEEDBACK);
      scheduleSave();
      sendOperatorEmail(
        isCancel ? "CANCELLATION request" : "Content report (notice-and-action)",
        isCancel ? "A user is cancelling a contract" : "Someone reported content",
        [
          ["Contact", entry.from],
          ["Details", entry.text],
          ["Received", new Date(entry.ts).toISOString()],
        ],
        isCancel
          ? "Confirm receipt to the user and process in Stripe within 14 days."
          : "Review within a reasonable time; remove if warranted and tell the reporter the outcome.",
      );
      sendJson(res, { ok: true, receivedAt: entry.ts });
    })();
    return;
  }

  if (req.method === "POST" && url.pathname === "/feedback") {
    void (async () => {
      if (authRateLimited(req)) {
        sendJson(res, { error: "slow down — try again in a minute" });
        return;
      }
      const body = await readJson(req);
      const text = body ? sanitizeStr(body.text, 1000) : "";
      if (!text) {
        notFound(res);
        return;
      }
      const entry = {
        ts: Date.now(),
        from: sanitizeStr(body.from, MAX_NAME_LEN) || "anonymous",
        page: sanitizeStr(body.page, 100),
        text,
      };
      feedback.push(entry);
      if (feedback.length > MAX_FEEDBACK) feedback = feedback.slice(-MAX_FEEDBACK);
      scheduleSave();
      sendOperatorEmail(
        `Floor feedback from ${entry.from}`,
        "New beta feedback",
        [
          ["From", entry.from],
          ["Page", entry.page || "(unknown)"],
          ["Feedback", entry.text],
        ],
        "Also stored in floor-data.json (the `feedback` array).",
      );
      sendJson(res, { ok: true });
    })();
    return;
  }

  if (req.method === "GET" && url.pathname === "/presence") {
    const floors = {};
    for (const [floorId, room] of rooms) floors[floorId] = room.size;
    // The founding-seat counter rides along on a poll the lobby already
    // makes. It is a cached integer, not a scan, so this stays O(1).
    // Upcoming operator events ride along for the same reason the founding
    // counter does: every client already polls this, and a second endpoint
    // for a ten-item list is a second thing to be down.
    const now = Date.now();
    sendJson(res, {
      floors,
      founding: { total: FOUNDING_SEATS, left: Math.max(0, FOUNDING_SEATS - foundingSeatsUsed) },
      events: events.filter((e) => (e.endMs ?? e.startMs) > now).slice(0, 10),
    });
    return;
  }

  // Every community startup on the site: claimed stands across all floors
  // (live or away) plus registry entries for founders who created a startup
  // but haven't claimed a spot yet. Everything was sanitized on the way in,
  // so this is a straight read — the directory renders these rows alone
  // (there is no seed-startup merge) and grows its category chips from
  // whatever founders typed.
  if (req.method === "GET" && url.pathname === "/startups") {
    const out = [];
    const standOwners = new Set();
    for (const [floorId, byOwner] of stands) {
      // practice stands in the tutorial hall aren't real listings
      if (!isRealFloor(floorId)) continue;
      const room = rooms.get(floorId);
      for (const [ownerId, st] of byOwner) {
        // A ban has to reach the public pages too. This list is what the
        // directory and the founders wall render, both of them ungated, so
        // leaving a banned account's listing up means the ban only stopped
        // them walking around while their advert stayed on the front page.
        if (isBannedOwner(ownerId)) continue;
        standOwners.add(ownerId);
        out.push({
          // The owner id, said out loud. It was always recoverable from the
          // startup id's claim:/reg: prefix, but a permalink to someone's
          // stand should not depend on a naming convention holding.
          ownerId,
          floorId,
          spotIndex: st.claim.spotIndex,
          online: ownerOnline(room, ownerId),
          lastSeen: st.lastSeen,
          ownerName: st.ownerName,
          startup: st.claim.startup,
        });
        if (out.length >= 512) break; // plenty for a directory page
      }
      if (out.length >= 512) break;
    }
    for (const [ownerId, entry] of registry) {
      if (out.length >= 512) break;
      if (standOwners.has(ownerId)) continue; // their stand supersedes this
      if (isBannedOwner(ownerId)) continue;
      out.push({
        ownerId,
        floorId: null,
        spotIndex: -1,
        online: false,
        lastSeen: entry.ts,
        ownerName: entry.startup?.founder,
        startup: entry.startup,
      });
    }
    // A directory lists a startup ONCE. The same founder can appear under
    // several ids (a pre-sign-in guest ghost, a registry entry the stand
    // superseded under a different id) — a registry-only row whose identity
    // matches a claimed stand is that stand's shadow and is dropped;
    // duplicate registry-only rows keep the freshest. Identity is the
    // STABLE pair name|founder, deliberately not the pitch text: editing a
    // one-liner must not resurface a ghost as a "new" listing. CLAIMED
    // stands are never collapsed against each other: that would let a
    // copycat stand hide a real one — dupes of that kind stay visible
    // (and reportable) instead.
    const identity = (s) =>
      [s.name, s.founder].map((v) => (v || "").toLowerCase().trim()).join("|");
    const standIdentities = new Set(
      out.filter((r) => r.floorId !== null).map((r) => identity(r.startup)),
    );
    const bestRegistry = new Map();
    for (const row of out) {
      if (row.floorId !== null) continue;
      const key = identity(row.startup);
      if (standIdentities.has(key)) continue; // a stand's shadow
      const prev = bestRegistry.get(key);
      if (!prev || row.lastSeen > prev.lastSeen) bestRegistry.set(key, row);
    }
    sendJson(res, {
      startups: [...out.filter((r) => r.floorId !== null), ...bestRegistry.values()],
    });
    return;
  }

  /**
   * One founder's stand, by owner id — the read behind /stand/<ownerId>.
   *
   * Not "fetch the directory and filter": that listing is capped at 512
   * rows and deliberately drops registry entries shadowed by a stand, so a
   * permalink to either of those founders would 404 on a page that renders
   * perfectly well. It is also a 20-second-stale read of the whole site to
   * show one row.
   *
   * The ban guard is the same one the listing uses, and has to be: without
   * it a ban would pull the listing while the direct link kept the advert
   * up, which is the failure the comment on /startups warns about.
   */
  if (req.method === "GET" && url.pathname === "/startup") {
    const owner = (url.searchParams.get("owner") || "").slice(0, MAX_ID_LEN);
    if (!owner || isBannedOwner(owner)) {
      notFound(res);
      return;
    }
    for (const [floorId, byOwner] of stands) {
      if (!isRealFloor(floorId)) continue;
      const st = byOwner.get(owner);
      if (!st) continue;
      const room = rooms.get(floorId);
      sendJson(res, {
        entry: {
          ownerId: owner,
          floorId,
          spotIndex: st.claim.spotIndex,
          online: ownerOnline(room, owner),
          lastSeen: st.lastSeen,
          ownerName: st.ownerName,
          startup: st.claim.startup,
        },
      });
      return;
    }
    const entry = registry.get(owner);
    if (entry) {
      sendJson(res, {
        entry: {
          ownerId: owner,
          floorId: null,
          spotIndex: -1,
          online: false,
          lastSeen: entry.ts,
          ownerName: entry.startup?.founder,
          startup: entry.startup,
        },
      });
      return;
    }
    notFound(res);
    return;
  }

  // Sign-in continuity: move a guest identity's stands and directory
  // listing onto the account that just signed in from the same browser.
  // Without this, playing as a guest and then registering leaves a ghost
  // "away" stand behind under the abandoned guest id — the same person
  // twice on one floor. Both sides must prove themselves: the guest
  // secret owns the old id, the bearer token owns the new — so nobody can
  // graft a stranger's stand onto their account or strip one off a guest.
  if (req.method === "POST" && url.pathname === "/stands/migrate") {
    void (async () => {
      if (authRateLimited(req)) {
        sendJson(res, { error: "slow down — try again in a minute" });
        return;
      }
      const body = await readJson(req);
      const fromId = body ? sanitizeStr(body.fromId, MAX_ID_LEN) : "";
      const toId = body ? sanitizeStr(body.toId, MAX_ID_LEN) : "";
      if (
        !body ||
        !fromId ||
        !toId ||
        fromId === toId ||
        fromId.startsWith(ACCT_PREFIX) || // accounts never migrate away
        !toId.startsWith(ACCT_PREFIX) // ...and only migrate INTO accounts
      ) {
        notFound(res);
        return;
      }
      if (!verifyIdentity(fromId, undefined, body.gs) || !verifyToken(body.token, toId)) {
        notFound(res);
        return;
      }
      let moved = 0;
      for (const [fid, byOwner] of stands) {
        const st = byOwner.get(fromId);
        if (!st) continue;
        byOwner.delete(fromId);
        const floorRoom = rooms.get(fid);
        if (floorRoom) broadcast(floorRoom, { t: "booth_clear", ownerId: fromId });
        if (byOwner.has(toId)) {
          // the account already has a stand on this floor — it wins
          continue;
        }
        // rekey the relayed startup id to the new owner, or receivers'
        // lookups (and the lobby's own-startup filter) keep pointing at the
        // abandoned guest id
        st.claim.startup.id = `claim:${toId}`;
        byOwner.set(toId, st);
        moved++;
        // Same rule as the register path: only put it on a floor the owner
        // is actually standing on.
        if (floorRoom && (STANDS_WHILE_AWAY || ownerOnline(floorRoom, toId))) {
          broadcast(floorRoom, {
            t: "booth_set",
            ownerId: toId,
            ownerName: st.ownerName,
            online: ownerOnline(floorRoom, toId),
            claim: st.claim,
          });
        }
      }
      // The merge can leave the account with stands on two floors (its own
      // plus the guest's). One stand per founder: keep the freshest.
      let freshest = null;
      for (const [fid, byOwner] of stands) {
        if (!isRealFloor(fid)) continue;
        const st = byOwner.get(toId);
        if (st && (!freshest || st.lastSeen > freshest.lastSeen)) {
          freshest = { floorId: fid, lastSeen: st.lastSeen };
        }
      }
      if (freshest) releaseOtherStands(toId, freshest.floorId);
      // the directory listing follows the same way
      const reg = registry.get(fromId);
      if (reg) {
        registry.delete(fromId);
        if (!registry.has(toId)) registry.set(toId, reg);
      }
      if (moved || reg) scheduleSave();
      console.log(`[stands] migrated ${moved} stand(s) ${fromId} -> ${toId}`);
      sendJson(res, { ok: true, moved });
    })();
    return;
  }

  // Cross-device progress: an identity's app state (booth, badges, quests,
  // streaks, membership) saved by one browser and pulled by another.
  if (req.method === "GET" && url.pathname === "/state") {
    const me = (url.searchParams.get("me") || "").slice(0, MAX_ID_LEN);
    const authHeader = typeof req.headers.authorization === "string" ? req.headers.authorization : "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    const gsHeader = req.headers["x-ff-gs"];
    const gs = typeof gsHeader === "string" ? gsHeader : "";
    if (!me || !verifyIdentity(me, token, gs)) {
      notFound(res);
      return;
    }
    const entry = profileStates.get(me);
    // Accounts also get their billing entitlement (null when none) and the
    // cumulative purchased-ticket counter: the client treats the first as
    // the truth about paid tiers once billing is live, and folds the second
    // into the wallet exactly once (wallet.redeemed high-water mark).
    const isAcct = me.startsWith(ACCT_PREFIX);
    const acctRec = isAcct ? accountsById.get(me) : undefined;
    // entitlementOf, not acctRec.paid: a lapsed trial has to read as no
    // entitlement here, because this response IS what the client believes.
    const paid = entitlementOf(acctRec);
    const coins = isAcct ? (acctRec?.ticketsPurchased ?? 0) : null;
    const perks = acctRec
      ? {
          trial: {
            until: typeof paid?.until === "number" ? paid.until : null,
            used: Boolean(acctRec.trialStarted),
            days: TRIAL_DAYS,
          },
          referral: {
            code: ensureReferralCode(acctRec),
            joined: Number(acctRec.refCount) || 0,
            daysEarned: Number(acctRec.refDays) || 0,
            daysPer: REFERRAL_DAYS,
            daysCap: MAX_REFERRAL_DAYS,
          },
        }
      : null;
    sendJson(
      res,
      entry
        ? { state: entry.state, savedAt: entry.savedAt, paid, coins, perks }
        : { state: null, savedAt: 0, paid, coins, perks },
    );
    return;
  }

  if (req.method === "POST" && url.pathname === "/state/save") {
    void (async () => {
      const body = await readJson(req);
      const me = body ? sanitizeStr(body.me, MAX_ID_LEN) : "";
      if (!body || !me || !verifyIdentity(me, body.token, body.gs)) {
        notFound(res);
        return;
      }
      const state = sanitizeStateBlob(body.state);
      if (!state) {
        notFound(res);
        return;
      }
      if (!profileStates.has(me) && profileStates.size >= MAX_PROFILE_STATES) {
        sendJson(res, { error: "state store full" });
        return;
      }
      const savedAt = Date.now();
      profileStates.set(me, { state, savedAt });
      scheduleSave();
      sendJson(res, { ok: true, savedAt });
    })();
    return;
  }

  // Register/unregister a startup from the profile editor — this is what
  // makes a newly created startup (and its category) appear in the
  // directory before its founder ever claims a floor stand.
  if (req.method === "POST" && url.pathname.startsWith("/startups/")) {
    void (async () => {
      if (authRateLimited(req)) {
        sendJson(res, { error: "slow down — try again in a minute" });
        return;
      }
      const body = await readJson(req);
      const me = body ? sanitizeStr(body.me, MAX_ID_LEN) : "";
      if (!body || !me || !verifyIdentity(me, body.token, body.gs)) {
        notFound(res);
        return;
      }
      if (url.pathname === "/startups/register") {
        const startup = sanitizeStartup(body.startup);
        if (!startup) {
          notFound(res);
          return;
        }
        // Screened AFTER sanitizing, so the screen sees the same text a
        // visitor would — masking runs first and could otherwise hide a
        // term from the check that the reader still ends up seeing.
        const screen = screenStartup(startup);
        if (screen.blocked) {
          console.log(`[moderation] blocked ${me} (register): ${screen.blocked}`);
          sendJson(res, { error: BLOCKED_MESSAGE });
          return;
        }
        flagListing(me, startup, screen.watched, "register");
        if (!registry.has(me) && registry.size >= MAX_REGISTRY) {
          sendJson(res, { error: "registry full" });
          return;
        }
        // Rekeyed by owner like stand claims — every client calls its own
        // startup "mine", which would collide in directory listings.
        startup.id = `reg:${me}`;
        registry.set(me, { startup, ts: Date.now() });
        // The stand IS this card: an edit saved on the profile page updates
        // the founder's stand in place — floor render, hover cards, and the
        // directory all show the new text at once. Without this the stand
        // keeps the old text until the founder next walks a floor, and the
        // directory sees two different-looking cards for one startup.
        for (const [fid, byOwner] of stands) {
          if (fid === "__inbox") continue;
          const st = byOwner.get(me);
          if (!st) continue;
          st.claim.startup = { ...startup, id: `claim:${me}` };
          const r = rooms.get(fid);
          // Only re-announce to a floor the owner is actually standing on.
          // Otherwise editing your stand from the profile page would put it
          // back on a hall you had already walked out of.
          if (r && (STANDS_WHILE_AWAY || ownerOnline(r, me))) {
            broadcast(r, {
              t: "booth_set",
              ownerId: me,
              ownerName: st.ownerName,
              online: ownerOnline(r, me),
              claim: st.claim,
            });
          }
        }
        scheduleSave();
        sendJson(res, { ok: true });
        return;
      }
      if (url.pathname === "/startups/unregister") {
        if (registry.delete(me)) scheduleSave();
        sendJson(res, { ok: true });
        return;
      }
      notFound(res);
    })();
    return;
  }

  /**
   * Sign a guestbook over HTTP.
   *
   * The ws `sign` frame still exists and is what the floor uses. This one
   * exists because a stand is no longer always ON a floor to walk up to:
   * the permalink at /stand/<ownerId> is where an absent founder's stand
   * lives now, and "leave a note while they're away" has to keep working
   * from there. Same key shapes, same moderation, same caps — only the
   * transport differs, and a live room still gets the broadcast so anyone
   * standing there watches the note land.
   */
  if (req.method === "POST" && url.pathname === "/guestbook/sign") {
    void (async () => {
      if (socialRateLimited(req)) {
        sendJson(res, { error: "slow down — try again in a minute" });
        return;
      }
      const body = await readJson(req);
      if (!body || !verifyIdentity(body.me, body.token, body.gs)) {
        notFound(res);
        return;
      }
      const floorId = sanitizeStr(body.floor, MAX_ID_LEN);
      const key = sanitizeStr(body.key, MAX_KEY_LEN);
      const text = moderateText(sanitizeStr(body.text, MAX_SIGN_LEN));
      const from = sanitizeStr(body.name, MAX_NAME_LEN) || "a founder";
      if (!floorId || !isRealFloor(floorId) || !key || !text || !isValidGuestbookKey(key)) {
        notFound(res);
        return;
      }
      let books = guestbooks.get(floorId);
      if (!books) {
        if (guestbooks.size >= MAX_FLOORS_TRACKED) {
          notFound(res);
          return;
        }
        books = new Map();
        guestbooks.set(floorId, books);
      }
      let entries = books.get(key);
      if (!entries) {
        if (books.size >= MAX_KEYS_PER_FLOOR) {
          notFound(res);
          return;
        }
        entries = [];
        books.set(key, entries);
      }
      const entry = { from, text, ts: Date.now() };
      entries.unshift(entry);
      if (entries.length > GUESTBOOK_KEEP) entries.length = GUESTBOOK_KEEP;
      const room = rooms.get(floorId);
      if (room) broadcast(room, { t: "guestbook", key, entry });
      scheduleSave();
      sendJson(res, { ok: true, entry });
    })();
    return;
  }

  if (req.method === "GET" && url.pathname === "/guestbook") {
    const floorId = (url.searchParams.get("floor") || "").slice(0, MAX_ID_LEN);
    const key = (url.searchParams.get("key") || "").slice(0, MAX_KEY_LEN);
    if (!floorId || !key) {
      notFound(res);
      return;
    }
    const entries = guestbooks.get(floorId)?.get(key) ?? [];
    sendJson(res, { entries }); // stored newest first, already capped at 50
    return;
  }

  // Everything else — including a plain HTTP GET on the ws path — is a 404.
  // WebSocket upgrades never reach this handler; ws owns the upgrade event.
  notFound(res);
});

// ---------- websocket ----------

const wss = new WebSocketServer({ server, maxPayload: 16 * 1024 });

// Connection-flood defenses: cap total sockets and per-IP sockets so one host
// can't open thousands and exhaust memory, and drop any socket that connects
// but never sends a valid `join` within a few seconds (idle-hold / slowloris).
const MAX_WS_TOTAL = 3000;
const MAX_WS_PER_IP = 24;
const JOIN_GRACE_MS = 12_000;
const wsPerIp = new Map(); // ip key -> count

// Slowloris/idle-body guards on the HTTP side (Node defaults are generous).
server.requestTimeout = 20_000; // whole request must arrive within 20s
server.headersTimeout = 10_000; // headers within 10s
server.keepAliveTimeout = 30_000;

server.on("error", (err) => {
  console.error(`[server] error: ${err.message}`);
  process.exit(1);
});

wss.on("error", (err) => {
  console.error(`[ws] server error: ${err.message}`);
  process.exit(1);
});

wss.on("connection", (ws, req) => {
  // Shed connection floods before allocating anything for this socket.
  if (wss.clients.size > MAX_WS_TOTAL) {
    ws.close(1013, "server busy");
    return;
  }
  const ipKey = clientIp(req);
  const perIp = wsPerIp.get(ipKey) ?? 0;
  if (perIp >= MAX_WS_PER_IP) {
    ws.close(1013, "too many connections");
    return;
  }
  wsPerIp.set(ipKey, perIp + 1);
  let ipCounted = true;
  const releaseIp = () => {
    if (!ipCounted) return;
    ipCounted = false;
    const n = (wsPerIp.get(ipKey) ?? 1) - 1;
    if (n <= 0) wsPerIp.delete(ipKey);
    else wsPerIp.set(ipKey, n);
  };

  let floorId = "lobby";
  try {
    const url = new URL(req.url ?? "/", "ws://internal");
    floorId = (url.searchParams.get("floor") || "lobby").slice(0, MAX_ID_LEN);
  } catch {
    releaseIp();
    ws.close(1008, "bad request url");
    return;
  }

  ws.isAlive = true;
  ws.on("pong", () => {
    ws.isAlive = true;
  });

  /** Set once a valid join arrives; also stored in the room map. */
  let client = null;
  let room = null;

  // A socket that connects but never joins is either a probe or an attack —
  // close it after the grace window so it can't sit and hold resources.
  let joinTimer = setTimeout(() => {
    if (!client) ws.close(1008, "no join");
  }, JOIN_GRACE_MS);

  // move rate limiting: fixed 1s window per client
  let moveWindowStart = 0;
  let movesInWindow = 0;

  // emote rate limiting: same fixed-window scheme, 3/s
  let emoteWindowStart = 0;
  let emotesInWindow = 0;

  // guestbook sign rate limiting: same fixed-window scheme, 2/s
  let signWindowStart = 0;
  let signsInWindow = 0;

  // chat rate limiting: same fixed-window scheme, 5/s
  let chatWindowStart = 0;
  let chatsInWindow = 0;

  // global frame limiting: every message type counts, so unknown-type floods
  // and verbs without their own limiter can't burn CPU / broadcast bandwidth
  let frameWindowStart = 0;
  let framesInWindow = 0;

  // booth_set limiting: a claim plus its denial-rollback re-claim is 2 frames
  // in quick succession, so allow a small burst over a longer window
  let boothWindowStart = 0;
  let boothSetsInWindow = 0;

  function handleJoin(msg) {
    // A real join arrived within the grace window — cancel the idle-kill timer.
    if (joinTimer) {
      clearTimeout(joinTimer);
      joinTimer = null;
    }
    const p = msg.player;
    let rawId =
      typeof p?.id === "string" && p.id.trim()
        ? p.id.trim().slice(0, MAX_ID_LEN)
        : randomUUID();
    // An id that fails the identity gate (account without its token, or a
    // bound guest id without its secret) is an impersonation attempt — the
    // connection still works, but as an anonymous guest.
    if (!verifyIdentity(rawId, msg.token, msg.gs)) {
      console.log(`[auth] rejected impersonation of ${rawId} — downgraded to guest`);
      rawId = randomUUID();
    }
    // banned identities don't get on the floor (id ban catches guests too;
    // account bans also match by email so a fresh token doesn't help)
    if (isBannedId(rawId) || isBannedAcct(accountsById.get(rawId))) {
      ws.close(4003, "suspended");
      return;
    }
    const name = moderateField(sanitizeName(p?.name)) || "guest";
    const look = sanitizeLook(p?.look);
    const status = moderateField(sanitizeStr(p?.status, MAX_STATUS_LEN));
    const title = moderateField(sanitizeStr(p?.title, 24));
    const s = sanitizeMove(msg.s);

    room = rooms.get(floorId);
    if (!room) {
      room = new Map();
      rooms.set(floorId, room);
    }

    // One live presence per identity per floor: a verified join replaces any
    // older connection with the same identity (a second tab, another device)
    // — otherwise the hall shows the same person twice. Impersonators can't
    // weaponize this kick: they were downgraded to a fresh random guest id
    // above, so they never match anyone else's rawId. The inbox room is
    // exempt — background messenger sockets may legitimately coexist.
    if (floorId !== "__inbox") {
      for (const [oldId, oldC] of [...room]) {
        if (oldC.rawId !== rawId || oldC.ws === ws) continue;
        // Remove it from the room NOW so this join's welcome doesn't carry
        // the ghost (and the id below doesn't get a pointless -2 suffix);
        // the old socket's own close handler then finds nothing left to do.
        room.delete(oldId);
        broadcast(room, { t: "player_leave", id: oldId });
        try {
          oldC.ws.close(4001, "replaced by a newer session");
        } catch {
          try {
            oldC.ws.terminate();
          } catch {
            /* already gone */
          }
        }
        console.log(`[ws] replaced older session of ${rawId} on floor=${floorId}`);
      }
    }

    // Keep player ids unique within the room; the joiner learns the final id
    // via welcome.selfId.
    let id = rawId;
    for (let n = 2; room.has(id); n++) id = `${rawId}-${n}`;

    client = { ws, id, rawId, name, look, s, status, title, claim: null };
    room.set(id, client);

    // social push registry + keep the display name fresh for inboxes
    let socks = socketsByProfile.get(rawId);
    if (!socks) {
      socks = new Set();
      socketsByProfile.set(rawId, socks);
    }
    socks.add(ws);
    // Keep the display name fresh for inboxes — but not from "__inbox" joins,
    // whose placeholder name ("inbox") would overwrite the real one that DM
    // recipients see.
    if (floorId !== "__inbox") {
      const soc = socialFor(rawId);
      if (soc) soc.name = name;
    }

    const others = [...room.values()].filter((c) => c.id !== id).map(asRemotePlayer);
    send(ws, {
      t: "welcome",
      selfId: id,
      players: others,
      booths: floorBooths(floorId, room, rawId),
      activity: activity.get(floorId) ?? [], // oldest first, <= 20
    });
    broadcast(room, { t: "player_join", player: asRemotePlayer(client) }, id);
    broadcast(room, { t: "status", online: true, count: room.size });
    // After welcome, so the joiner sees their own arrival arrive live like
    // everyone else does (welcome carries only the items before it). A repeat
    // arrival within the window (flaky connection, floor-hopping) is silent.
    let seen = lastWalkIn.get(floorId);
    if (!seen) {
      // Evict the oldest floor's suppression, not all of them — a blanket
      // clear() let an attacker cycling floors repeatedly wipe everyone's
      // "walked in" cooldown and re-trigger ticker spam.
      if (lastWalkIn.size >= MAX_FLOORS_TRACKED) {
        const oldest = lastWalkIn.keys().next().value;
        if (oldest !== undefined) lastWalkIn.delete(oldest);
      }
      seen = new Map();
      lastWalkIn.set(floorId, seen);
    }
    const now = Date.now();
    for (const [n2, ts] of seen) {
      if (now - ts >= WALK_IN_SUPPRESS_MS) seen.delete(n2);
    }
    const suppressed = seen.has(name);
    seen.set(name, now);
    // "__inbox" is the invisible room the Connections screen joins for live
    // pushes — no ticker lines for it, nobody "walks into" their own inbox.
    if (!suppressed && floorId !== "__inbox") pushActivity(room, floorId, `${name} walked in`);
    console.log(`[ws] join  floor=${floorId} id=${id} name="${name}" (${room.size} online)`);

    // A stand carried in with the join frame goes through the same arbitration.
    // A join WITHOUT a claim from a profile that has a stored stand means the
    // owner packed up while away (or wiped their browser) — the client's saved
    // state is the source of truth, so the stand comes down.
    if (msg.claim !== undefined) {
      // claimFresh marks a claim the player made deliberately during this
      // page-session (e.g. while the socket was reconnecting) — it gets the
      // full interactive treatment (relocation), not the stale-re-raise
      // guard. A client lying about it can only relocate its OWN stand,
      // which the interactive path lets it do anyway.
      handleBoothSet(
        { claim: msg.claim },
        { silentActivity: standFor(rawId) !== null, fromJoin: msg.claimFresh !== true },
      );
    } else if (standFor(rawId)) {
      removeStand(rawId);
    }
  }

  /** The joining profile's stored stand on this floor, if any. */
  function standFor(profileId) {
    return stands.get(floorId)?.get(profileId) ?? null;
  }

  function removeStand(profileId) {
    const byOwner = stands.get(floorId);
    const st = byOwner?.get(profileId);
    if (!byOwner?.delete(profileId)) return;
    // Packing up takes the notes with it — they were written to this
    // founder, not to this square of floor.
    if (st) dropGuestbook(floorId, st.claim.spotIndex);
    if (byOwner.size === 0) stands.delete(floorId);
    broadcast(room, { t: "booth_clear", ownerId: profileId }, client.id);
    scheduleSave();
  }

  function handleBoothSet(msg, opts = {}) {
    const claim = sanitizeClaim(msg.claim);
    if (!claim) return;
    // The other way a stand reaches the floor. Refusing here matters more
    // than at /startups/register: this is the path that paints the text
    // onto a booth in front of whoever is standing in the room.
    const screen = screenStartup(claim.startup);
    if (screen.blocked) {
      console.log(`[moderation] blocked ${client.rawId} (claim): ${screen.blocked}`);
      send(ws, { t: "booth_denied", spotIndex: claim.spotIndex, reason: "prohibited" });
      return;
    }
    flagListing(client.rawId, claim.startup, screen.watched, "claim");
    // A claim carried in by a JOIN is a saved state re-raising itself, not a
    // decision. If the founder's one stand meanwhile lives on another real
    // floor (moved from a different device, or this browser's claim is
    // stale), walking in here must not silently drag it back — deny with a
    // reason AND the stand's true location, so the client can correct its
    // saved claim instead of forgetting it has a stand at all. (A join whose
    // claim was made deliberately this page-session arrives with claimFresh
    // and skips this — an offline claim replayed on reconnect is a decision,
    // not stale state.)
    if (opts.fromJoin && isRealFloor(floorId)) {
      const elsewhere = standElsewhere(client.rawId, floorId);
      if (elsewhere) {
        send(ws, {
          t: "booth_denied",
          spotIndex: claim.spotIndex,
          reason: "elsewhere",
          standFloorId: elsewhere.floorId,
          standSpotIndex: elsewhere.spotIndex,
        });
        return;
      }
    }
    const holder = spotTakenBy(floorId, claim.spotIndex, client.rawId);
    if (holder) {
      // First claim wins — including stands whose owner is merely away.
      // Say WHICH, because with away stands no longer drawn on the floor
      // the spot looked empty to whoever just tried to take it.
      const parked = !ownerOnline(room, holder);
      send(ws, {
        t: "booth_denied",
        spotIndex: claim.spotIndex,
        reason: parked ? "reserved" : "taken",
      });
      return;
    }
    // Every client saves its own startup under the same local id ("mine"), so
    // relayed claims must be re-keyed by owner or they collide in receivers'
    // startup lookups and connection records. Keyed by the stable profile id.
    claim.startup.id = `claim:${client.rawId}`;
    client.claim = claim;
    let byOwner = stands.get(floorId);
    if (!byOwner) {
      // Cap the number of distinct floors we persist stands for: floorId comes
      // straight off the ws URL, so without this an attacker could loop
      // join→claim→disconnect on ?floor=<random> forever, ballooning
      // floor-data.json (and every full-file save) without bound.
      if (stands.size >= MAX_FLOORS_TRACKED) {
        send(ws, { t: "booth_denied", spotIndex: claim.spotIndex });
        return;
      }
      byOwner = new Map();
      stands.set(floorId, byOwner);
    }
    if (!byOwner.has(client.rawId) && byOwner.size >= MAX_STANDS_PER_FLOOR) {
      // Tell the claimant, or their client keeps a ghost stand nobody else sees.
      send(ws, { t: "booth_denied", spotIndex: claim.spotIndex });
      return;
    }
    byOwner.set(client.rawId, { claim, ownerName: client.name, lastSeen: Date.now() });
    // The stand MOVES here: a deliberate claim on a real floor packs up the
    // founder's stand anywhere else (practice claims in the tutorial don't).
    if (isRealFloor(floorId)) releaseOtherStands(client.rawId, floorId);
    // ...and the founder's directory registration follows the stand's card,
    // so an on-floor edit can't fork the two into separate listings.
    if (isRealFloor(floorId) && registry.has(client.rawId)) {
      registry.set(client.rawId, {
        startup: { ...claim.startup, id: `reg:${client.rawId}` },
        ts: Date.now(),
      });
    }
    scheduleSave();
    broadcast(
      room,
      { t: "booth_set", ownerId: client.rawId, ownerName: client.name, online: true, claim },
      client.id,
    );
    // Re-raising your existing stand on rejoin is routine, not news.
    if (!opts.silentActivity) pushActivity(room, floorId, `${client.name} set up a stand`);
  }

  function handleBoothClear() {
    client.claim = null;
    removeStand(client.rawId);
    // deliberately no activity item — pack-ups are noise
  }

  function handleMove(msg) {
    const now = Date.now();
    if (now - moveWindowStart >= 1000) {
      moveWindowStart = now;
      movesInWindow = 0;
    }
    if (++movesInWindow > MOVES_PER_SEC) return; // drop excess moves silently

    const s = sanitizeMove(msg.s);
    client.s = s;
    broadcast(room, { t: "player_move", id: client.id, s }, client.id);
  }

  function handleEmote(msg) {
    if (!EMOTE_KINDS.has(msg.kind)) return; // unknown kinds are dropped
    const now = Date.now();
    if (now - emoteWindowStart >= 1000) {
      emoteWindowStart = now;
      emotesInWindow = 0;
    }
    if (++emotesInWindow > EMOTES_PER_SEC) return; // drop excess emotes silently

    // Echo to the sender too — one render path for local and remote bubbles.
    broadcast(room, { t: "emote", id: client.id, kind: msg.kind });
  }

  function handleSign(msg) {
    const now = Date.now();
    if (now - signWindowStart >= 1000) {
      signWindowStart = now;
      signsInWindow = 0;
    }
    if (++signsInWindow > SIGNS_PER_SEC) return; // drop excess signs silently

    const key = sanitizeStr(msg.key, MAX_KEY_LEN);
    const text = moderateText(sanitizeStr(msg.text, MAX_SIGN_LEN));
    if (!key || !text) return; // drop empty keys / empty, whitespace-only, or hateful text
    if (!isValidGuestbookKey(key)) return; // fabricated key shapes are dropped

    const entry = { from: client.name, text, ts: now };
    let books = guestbooks.get(floorId);
    if (!books) {
      if (guestbooks.size >= MAX_FLOORS_TRACKED) return; // floor cap
      books = new Map();
      guestbooks.set(floorId, books);
    }
    let entries = books.get(key);
    if (!entries) {
      if (books.size >= MAX_KEYS_PER_FLOOR) return; // per-floor key cap
      entries = [];
      books.set(key, entries);
    }
    entries.unshift(entry); // newest first
    if (entries.length > GUESTBOOK_KEEP) entries.length = GUESTBOOK_KEEP;

    broadcast(room, { t: "guestbook", key, entry }); // sender included
    // The client names the booth (the server only knows the opaque key);
    // sanitized and length-capped like every other client string.
    const boothName = sanitizeStr(msg.boothName, MAX_BOOTH_NAME_LEN);
    pushActivity(
      room,
      floorId,
      boothName
        ? `${client.name} signed ${boothName}'s guestbook`
        : `${client.name} signed a guestbook`,
    );
    scheduleSave();
  }

  function handleChat(msg) {
    const now = Date.now();
    if (now - chatWindowStart >= 1000) {
      chatWindowStart = now;
      chatsInWindow = 0;
    }
    if (++chatsInWindow > CHATS_PER_SEC) return; // drop excess chat silently

    const text = moderateText(sanitizeText(msg.text));
    if (!text) return; // drop empty, whitespace-only, or hateful messages
    const scope = msg.scope === "dm" ? "dm" : "floor";
    const base = {
      id: `m${BOOT}-${nextMsgId++}`,
      fromId: client.id,
      from: client.name,
      text,
      ts: Date.now(),
    };

    if (scope === "floor") {
      // Broadcast to the whole room INCLUDING the sender — the echo gives
      // every client the same message ordering.
      broadcast(room, { t: "chat", msg: { ...base, scope: "floor" } });
      return;
    }

    // dm: msg.peerId is always the OTHER party from the recipient's view.
    const peerId = typeof msg.peerId === "string" ? msg.peerId.slice(0, MAX_ID_LEN) : "";
    if (!peerId) return;
    const peer = room.get(peerId);
    // Echo to the sender even if the peer has already left, so the sender's
    // transcript stays consistent with what they typed.
    send(ws, { t: "chat", msg: { ...base, scope: "dm", peerId } });
    if (peer && peer.id !== client.id) {
      send(peer.ws, { t: "chat", msg: { ...base, scope: "dm", peerId: client.id } });
    }
  }

  ws.on("message", (data, isBinary) => {
    if (isBinary) return;
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return; // malformed JSON is ignored, never fatal
    }
    if (!msg || typeof msg !== "object" || typeof msg.t !== "string") return;

    const now = Date.now();
    if (now - frameWindowStart >= 1000) {
      frameWindowStart = now;
      framesInWindow = 0;
    }
    if (++framesInWindow > FRAMES_PER_SEC) {
      if (framesInWindow > FRAMES_PER_SEC * 5) ws.close(1008, "flood"); // gross abuse
      return; // drop excess frames of every type silently
    }

    if (!client) {
      if (msg.t === "join") handleJoin(msg);
      return; // anything before a valid join is ignored
    }

    switch (msg.t) {
      case "move":
        handleMove(msg);
        break;
      case "chat":
        handleChat(msg);
        break;
      case "booth_set":
        if (now - boothWindowStart >= 10_000) {
          boothWindowStart = now;
          boothSetsInWindow = 0;
        }
        if (++boothSetsInWindow > BOOTH_SETS_PER_10S) break;
        handleBoothSet(msg);
        break;
      case "booth_clear":
        handleBoothClear();
        break;
      case "emote":
        handleEmote(msg);
        break;
      case "sign":
        handleSign(msg);
        break;
      case "report":
        handleReport(msg);
        break;
      default:
        break; // unknown frame types are ignored
    }
  });

  // report rate limiting: one per 10s per client
  let lastReportAt = 0;
  function handleReport(msg) {
    const now = Date.now();
    if (now - lastReportAt < 10_000) return;
    lastReportAt = now;
    const targetId = sanitizeStr(msg.targetId, MAX_ID_LEN);
    if (!targetId) return;
    const report = {
      ts: now,
      floor: floorId,
      fromId: client.rawId,
      fromName: client.name,
      targetId,
      reason: sanitizeStr(msg.reason, 200) || "unspecified",
    };
    reports.push(report);
    if (reports.length > MAX_REPORTS) reports = reports.slice(-MAX_REPORTS);
    scheduleSave();
    console.log(`[report] floor=${floorId} from="${client.name}" target=${targetId}`);
    sendOperatorEmail(
      `Abuse report on floor ${floorId}`,
      "New abuse report",
      [
        ["Floor", floorId],
        ["Reported by", `${report.fromName} (${report.fromId})`],
        ["Reported player", targetId],
        ["Reason", report.reason],
      ],
      "Also stored in floor-data.json (the `reports` array). Review by hand.",
    );
  }

  ws.on("close", () => {
    releaseIp();
    if (joinTimer) {
      clearTimeout(joinTimer);
      joinTimer = null;
    }
    if (!client || !room) return;
    const socks = socketsByProfile.get(client.rawId);
    if (socks) {
      socks.delete(ws);
      if (socks.size === 0) socketsByProfile.delete(client.rawId);
    }
    // A connection replaced at join time was already removed from the room —
    // and its id may now belong to the REPLACEMENT connection (same rawId,
    // same id). Only run leave-cleanup if this entry is still ours, or this
    // late close would evict the newer session as a ghost.
    if (room.get(client.id) === client) {
      room.delete(client.id);
      broadcast(room, { t: "player_leave", id: client.id });
      broadcast(room, { t: "status", online: true, count: room.size });
      // The RECORD stays — the directory, /stand/<id> and this founder's
      // claim on the spot all read it. If that was their last connection to
      // this floor, the booth itself comes down (and lastSeen is stamped so
      // the expiry clock starts).
      const st = stands.get(floorId)?.get(client.rawId);
      if (st && !ownerOnline(room, client.rawId)) {
        st.lastSeen = Date.now();
        scheduleSave();
        // Take the stand down for everyone still in the room. NOT
        // removeStand() — the record has to survive, or the directory
        // loses the listing and the owner loses the spot.
        broadcast(
          room,
          STANDS_WHILE_AWAY
            ? { t: "booth_set", ownerId: client.rawId, ownerName: st.ownerName, online: false, claim: st.claim }
            : { t: "booth_clear", ownerId: client.rawId },
        );
      }
      console.log(`[ws] leave floor=${floorId} id=${client.id} (${room.size} online)`);
      if (room.size === 0) rooms.delete(floorId);
    }
    client = null;
    room = null;
  });

  ws.on("error", () => {
    // Socket-level errors (reset, protocol violation) — drop the connection;
    // the close handler performs room cleanup.
    ws.terminate();
  });
});

// Heartbeat: ping every 30s; terminate sockets that missed the previous ping.
const heartbeat = setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.isAlive === false) {
      ws.terminate();
      continue;
    }
    ws.isAlive = false;
    ws.ping();
  }
}, HEARTBEAT_MS);

wss.on("close", () => clearInterval(heartbeat));

server.listen(PORT, () => {
  console.log(`[server] FounderFloor floor server (http+ws) listening on :${PORT}`);
});
