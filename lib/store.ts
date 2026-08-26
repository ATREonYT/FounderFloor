"use client";

/**
 * FounderFloor — SSR-safe client persistence.
 *
 * All app state lives under one localStorage key ("founderfloor:v1") and is
 * shared across every component that calls useAppState() via a module-level
 * store + emitter. Cross-tab consistency comes from the `storage` event.
 *
 * On the server (and during hydration) the hook returns a stable default
 * snapshot; the real persisted state is loaded after mount, so server and
 * client markup always agree.
 */

import { useSyncExternalStore } from "react";
import type {
  AppState,
  AvatarLook,
  BoothProp,
  BoothStyle,
  Connection,
  OnboardingStep,
  PodiumAward,
  SpotTier,
  Startup,
  SubTier,
  Wallet,
} from "@/lib/types";
import { ONBOARDING_STEPS, TIER_ORDER } from "@/lib/types";
import { FLOORS, PRACTICE_FLOOR_ID } from "@/lib/data/floors";
import { QUESTS } from "@/lib/data/quests";
import {
  EARN,
  MAX_EQUIPPED_PROPS,
  SPOT_PRICE,
  activeSpotHold,
  dailyTickets,
  holdCovers,
  newHoldUntil,
  priceFor,
  shopItem,
  spotHoldId,
  walletBalance,
} from "@/lib/data/shop";
import { ARCADE_DAILY_CAP } from "@/components/Arcade";
import { MAX_OWN_QUIZZES, QUIZ_COST, sanitizeQuiz } from "@/lib/data/quiz";
import type { Quiz } from "@/lib/data/quiz";
import { getLastSyncTs, pullState, pushState, setLastSyncTs, syncableState } from "@/lib/sync";
import type { Award, PaidEntitlement, Perks } from "@/lib/sync";
import { billingLive, spotTicketPrice } from "@/lib/pricing";

const STORAGE_KEY = "founderfloor:v1";

export interface StoreActions {
  setName(name: string): void;
  setLook(look: AvatarLook): void;
  setSub(tier: SubTier): void;
  addConnection(c: Omit<Connection, "ts">): void;
  removeConnection(ts: number): void;
  saveMyStartup(s: Startup): void;
  clearMyStartup(): void;
  verifyMyRevenue(monthly: number, goalProgress: number): void;
  /** Claim (or move) your stand on a floor: floorId -> boothSpots index. */
  claimSpot(floorId: string, spotIndex: number): void;
  /** Pack up your stand on a floor. */
  unclaimSpot(floorId: string): void;
  /** Set the status line under your name (trimmed, <= 40 chars; empty clears it). */
  setStatus(s: string): void;
  /** Attach a personal note to a connection by its ts key (trimmed, <= 200; empty clears). */
  setConnectionNote(ts: number, note: string): void;
  /** Mark a tutorial step done. Appends once; unknown steps are ignored. */
  completeOnboarding(step: OnboardingStep): void;
  /** Award a badge id (<= 32 chars). Appends once; duplicates are ignored. */
  grantBadge(id: string): void;
  /** Finish (or skip) the guided tour. */
  setTutorialDone(done: boolean): void;
  /** Rearm the guided tour: clears tutorialDone and the onboarding steps. */
  resetTutorial(): void;
  /** Quest deeds — each appends once / increments and is otherwise a no-op. */
  recordTalkedTo(id: string): void;
  recordSigned(key: string): void;
  recordFloorVisit(floorId: string): void;
  recordEmote(): void;
  /** Mark a quest's reward as granted so it never re-fires. */
  markQuestClaimed(id: string): void;
  /**
   * Count a visit: called on lobby/floor mount. Within 30 minutes of the
   * last call it only refreshes lastSeenAt (same session); after a longer
   * gap it rolls prevSeenAt forward (the "since you were away" mark) and
   * updates the day streak — consecutive calendar days extend it, a gap
   * resets it to 1.
   */
  recordVisit(): void;
  /** Pick an earned title (<= 24 chars; empty clears). Shown on your hover card. */
  setTitle(t: string): void;
  /**
   * Buy a shop item ("style:bigtop", "prop:plant") with tickets. Returns
   * true when the purchase went through; false when unknown, already
   * owned, or unaffordable — callers show the honest reason.
   */
  buyItem(itemId: string): boolean;
  /**
   * Buy a spot-tier hold on a floor ("gold" | "silver") with tickets, at
   * this member's plan-discounted price (SPOT_TIER_DISCOUNT). A no-op
   * that returns true when an active hold already covers the tier —
   * moving between same-tier spots inside a hold is free. Returns false
   * when unaffordable.
   */
  buySpotHold(floorId: string, tier: SpotTier): boolean;
  /**
   * Bank an arcade run. `tickets` is what the panel thinks was earned and
   * `runTotal` the score; both are clamped here, and the daily ceiling is
   * applied against what has actually been paid out today.
   */
  earnArcade(tickets: number, runTotal: number): void;
  /** Bank a parkour clear: keeps the better time, pays out under the cap. */
  finishParkour(mapId: string, seconds: number, tickets: number): void;
  /** Publish a quiz, spending QUIZ_COST. False if it could not be afforded. */
  publishQuiz(quiz: unknown): boolean;
  deleteQuiz(id: string): void;
  /**
   * Switch to a server-issued identity (sign-in) or back to a fresh guest id
   * (sign-out). Sign-in keeps local progress and merges it into the account;
   * sign-out BLANKS this device (the account's copy lives on the server and
   * returns on the next sign-in). The social graph is keyed by id server-side.
   */
  setIdentity(id: string, name: string): void;
}

// ---------- defaults ----------

function defaultState(): AppState {
  return {
    profile: { id: "", name: "", look: { skin: 0, outfit: 0, hair: 0 } },
    sub: "free",
    wallet: { earned: 0, redeemed: 0, owned: [], connHigh: 0, earnedBase: 0 },
    connections: [],
    claims: {},
    onboarding: [],
    tutorialDone: false,
    badges: [],
    quest: { talkedTo: [], signed: [], floors: [], emotes: 0 },
    claimedQuests: [],
    visitStreak: 0,
    bestStreak: 0,
    lastSeenAt: 0,
    prevSeenAt: 0,
  };
}

/** Stable reference for getServerSnapshot — must never change identity. */
const SERVER_SNAPSHOT: AppState = defaultState();

// ---------- module-level store ----------

let state: AppState = defaultState();
let hydrated = false;
let storageListenerAttached = false;
const listeners = new Set<() => void>();

function emit(): void {
  for (const cb of Array.from(listeners)) cb();
}

function persist(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage may be full or blocked (private mode) — state still works in-memory.
  }
}

function setState(next: AppState): void {
  state = next;
  persist();
  emit();
  scheduleSyncPush();
}

// ---------- membership celebration events ----------

/**
 * Fired when a pull upgrades the signed-in account's entitlement (a fresh
 * Stripe purchase or operator grant landing). The RECIPIENT's screens play
 * the ceremony — wherever they are — via components/MembershipWatcher.
 */
export interface CelebrationEvent {
  tier: "pro" | "founder";
  founding: boolean;
}
let celebrationCb: ((e: CelebrationEvent) => void) | null = null;
let pendingCelebration: CelebrationEvent | null = null;
function fireCelebration(e: CelebrationEvent): void {
  if (celebrationCb) celebrationCb(e);
  else pendingCelebration = e; // watcher not mounted yet — hold the moment
}
export function onCelebration(cb: (e: CelebrationEvent) => void): () => void {
  celebrationCb = cb;
  if (pendingCelebration) {
    cb(pendingCelebration);
    pendingCelebration = null;
  }
  return () => {
    if (celebrationCb === cb) celebrationCb = null;
  };
}

/**
 * Fired when a weekly podium award lands on this profile. Same hold-the-
 * moment trick as the celebration above: an award that arrives before the
 * watcher mounts waits rather than being lost.
 */
let awardCb: ((a: PodiumAward) => void) | null = null;
let pendingAward: PodiumAward | null = null;
export function onAward(cb: (a: PodiumAward) => void): () => void {
  awardCb = cb;
  if (pendingAward) {
    cb(pendingAward);
    pendingAward = null;
  }
  return () => {
    if (awardCb === cb) awardCb = null;
  };
}

/** Local calendar day, YYYY-MM-DD. Local on purpose: a daily reset should
 * happen at the visitor's midnight, not at UTC's. */
function dayKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** One ceremony per grant per device: remembers the last entitlement shown. */
const CELEBRATED_KEY = "founderfloor:celebrated";
/** Grants older than this play no catch-up ceremony on a new device. */
const CELEBRATION_FRESH_MS = 14 * 24 * 60 * 60 * 1000;

// ---------- cross-device sync ----------

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let lastPushedJson = "";

/** Debounced push of syncable state to the floor server (no-op offline). */
/** Push the current state. Resolves TRUE when the server holds it (or there
 * was nothing to push), FALSE when a push was attempted and did not land —
 * callers about to do something destructive (sign-out) must check. */
function pushNow(): Promise<boolean> {
  const me = state.profile.id;
  if (!me || state.profile.name === "") return Promise.resolve(true); // nothing worth syncing yet
  const blob = syncableState(state);
  const json = JSON.stringify(blob);
  if (json === lastPushedJson) return Promise.resolve(true);
  const pushedEarned = state.wallet.earned;
  return pushState(me, blob).then((savedAt) => {
    if (savedAt === null) return false;
    // identity guard on ALL bookkeeping: a push that lands after a
    // sign-out reset must not resurrect the old sync marks
    if (state.profile.id === me) {
      lastPushedJson = json;
      setLastSyncTs(savedAt);
      // the server now holds this earned total — advance the device's
      // acknowledged mark so only future earnings count as unsynced.
      // (earnedBase is stripped from the blob, so this can't re-push.)
      if (state.wallet.earnedBase < pushedEarned) {
        state = {
          ...state,
          wallet: { ...state.wallet, earnedBase: Math.min(pushedEarned, state.wallet.earned) },
        };
        persist();
        emit();
      }
    }
    return true;
  });
}

function scheduleSyncPush(): void {
  if (typeof window === "undefined" || !hydrated) return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncTimer = null;
    void pushNow();
  }, 2500);
}

/**
 * Run any pending (debounced) push right now and wait for it. Called before
 * sign-out: the session token dies with logout, so the last edits must reach
 * the account first or the blank-slate reset would drop them.
 */
export function flushSyncPush(): Promise<boolean> {
  if (typeof window === "undefined" || !hydrated) return Promise.resolve(true);
  if (syncTimer) {
    clearTimeout(syncTimer);
    syncTimer = null;
  }
  return pushNow();
}

/**
 * Apply a pulled blob when it's newer than this device's last sync point.
 * The blob goes through sanitize() — the same defensive gate as localStorage
 * — and never touches the local identity or seen-marks.
 *
 * This is NOT a wholesale replace: a guest who built a booth, made
 * connections and earned badges, then signs into an existing account, must
 * not have that work silently deleted. So the additive things people work
 * for are UNIONED with whatever the account already had, the booth is kept
 * if the account has none, and streak counters take the higher value. Remote
 * wins for single-value identity fields (name, look, membership tier).
 */
function applyRemoteState(remote: { state: unknown; savedAt: number }): boolean {
  if (!remote.state || typeof remote.state !== "object") return false;
  if (remote.savedAt <= getLastSyncTs()) return false;
  const local = state;
  const merged = sanitize(remote.state);

  // identity + seen-marks stay local
  merged.profile.id = local.profile.id;
  if (merged.profile.name === "") merged.profile.name = local.profile.name;
  merged.lastSeenAt = local.lastSeenAt;
  merged.prevSeenAt = local.prevSeenAt;

  // union badges (never lose an earned badge)
  merged.badges = Array.from(new Set([...merged.badges, ...local.badges])).slice(0, 48);

  // union connections by their dedupe key (peerId, else timestamp)
  const connKey = (c: (typeof local.connections)[number]) => c.peerId ?? `ts:${c.ts}`;
  const byKey = new Map<string, (typeof local.connections)[number]>();
  for (const c of local.connections) byKey.set(connKey(c), c);
  for (const c of merged.connections) byKey.set(connKey(c), c); // remote wins on conflict
  merged.connections = Array.from(byKey.values()).slice(0, 200);

  // keep a locally-built booth if the account doesn't already have one
  if (!merged.myStartup && local.myStartup) merged.myStartup = local.myStartup;

  // Merge claimed stands — then enforce the one-stand invariant, because a
  // pure union can resurrect a claim another device already moved away
  // from. Prefer the remote side's real-floor claim (the account's latest
  // push); a wrong survivor self-heals on the next floor visit via the
  // server's "elsewhere" denial, which carries the stand's true location.
  const remoteClaims = merged.claims;
  merged.claims = { ...local.claims, ...merged.claims };
  const realClaims = Object.keys(merged.claims).filter((fid) => fid !== PRACTICE_FLOOR_ID);
  if (realClaims.length > 1) {
    const keep = realClaims.find((fid) => fid in remoteClaims) ?? realClaims[0];
    for (const fid of realClaims) {
      if (fid !== keep) delete merged.claims[fid];
    }
  }
  merged.visitStreak = Math.max(merged.visitStreak, local.visitStreak);
  merged.bestStreak = Math.max(merged.bestStreak, local.bestStreak);

  // wallet: redeemed/connHigh are true high-water marks (max is exact) and
  // owned is a set (union is exact; spend derives from it, so purchases
  // travel with their cost). `earned` is different — it's a counter BOTH
  // sides increment — so the merge folds this device's unsynced delta
  // (earned - earnedBase) on top of the remote value; a bare max() would
  // silently discard the smaller side's earnings (guest sign-in, two
  // devices earning concurrently). earnedBase then marks the remote value
  // as acknowledged; the follow-up push carries the folded total up.
  const remoteEarned = merged.wallet.earned;
  const localDelta = Math.max(0, local.wallet.earned - local.wallet.earnedBase);
  merged.wallet = {
    earned: Math.min(1_000_000, remoteEarned + localDelta),
    redeemed: Math.max(merged.wallet.redeemed, local.wallet.redeemed),
    owned: Array.from(new Set([...merged.wallet.owned, ...local.wallet.owned])).slice(0, 160),
    connHigh: Math.max(merged.wallet.connHigh, local.wallet.connHigh),
    earnedBase: remoteEarned,
  };
  // the visit-day marker must move forward with the streak, or a pull from
  // a device that hasn't visited today re-arms today's daily grant
  // parkour times are a low-water mark; quizzes are a union by id
  {
    const times: Record<string, number> = { ...(merged.parkourBests ?? {}) };
    for (const [k, v] of Object.entries(local.parkourBests ?? {})) {
      if (times[k] === undefined || v < times[k]) times[k] = v;
    }
    merged.parkourBests = times;
    const byId = new Map<string, unknown>();
    for (const q of [...(merged.quizzes ?? []), ...(local.quizzes ?? [])]) {
      const c = sanitizeQuiz(q);
      if (c) byId.set(c.id, c);
    }
    merged.quizzes = [...byId.values()].slice(0, MAX_OWN_QUIZZES);
  }
  // the best arcade run is a high-water mark, like the streak
  merged.arcadeBest = Math.max(merged.arcadeBest ?? 0, local.arcadeBest ?? 0);
  if (local.arcadeDay && (!merged.arcadeDay || local.arcadeDay > merged.arcadeDay)) {
    merged.arcadeDay = local.arcadeDay;
    merged.arcadeWon = local.arcadeWon ?? 0;
  } else if (local.arcadeDay && local.arcadeDay === merged.arcadeDay) {
    // same day on two devices: the ceiling is per day, so take the larger
    merged.arcadeWon = Math.max(merged.arcadeWon ?? 0, local.arcadeWon ?? 0);
  }
  if (local.lastVisitDay && (!merged.lastVisitDay || local.lastVisitDay > merged.lastVisitDay)) {
    merged.lastVisitDay = local.lastVisitDay;
  }

  // union quest deeds so tutorial/quest progress can't regress
  merged.badges = merged.badges; // (kept above)
  merged.claimedQuests = Array.from(new Set([...merged.claimedQuests, ...local.claimedQuests]));
  merged.onboarding = merged.onboarding.length >= local.onboarding.length ? merged.onboarding : local.onboarding;
  merged.tutorialDone = merged.tutorialDone || local.tutorialDone;

  state = merged;
  persist();
  emit();
  // Push the merged result back up so the account keeps the folded-in work,
  // rather than marking it "already synced" and dropping it.
  lastPushedJson = "";
  setLastSyncTs(remote.savedAt);
  return true;
}

/**
 * The server's word on what an account is entitled to beats whatever tier
 * the local state carries. Runs only for signed-in accounts — guests can't
 * be matched to an entitlement, so their local state stands.
 *
 * The condition below used to be `if (!billingLive()) return`, which was
 * right when the only source of an entitlement was Stripe: with no
 * checkout configured the server always answered `paid: null`, and applying
 * that would have stamped out the tiers this build lets you simulate.
 *
 * It stopped being right the moment entitlements could be GRANTED —
 * founding seats, trials, an operator grant from /admin/grant. Those are
 * real on a deploy with no Stripe keys at all, and the early return threw
 * every one of them away: granted on the server, discarded on arrival,
 * with the member seeing no badge and no tier and nothing in the console
 * to say why.
 *
 * So the rule is about whether the server HAS something to say, not about
 * whether money is involved — and `perks` is exactly that signal. The
 * server sends it for every account it recognises, so a null `paid`
 * alongside a non-null `perks` is the server stating that this account
 * holds nothing, not a server that was never wired up. For anyone else
 * (a guest, an unreachable server) it stays null and the local tier stands.
 *
 * This is not a nicety. Trials ship on a deploy with no Stripe keys — that
 * is the whole point of them — so without it a trial would expire on the
 * server and never expire on the device: the tier would stay founder, get
 * pushed back up in the state blob, and pull down onto every other browser
 * the member signs into. A seven-day trial that never ends is not a
 * generous bug, it is the paid tier given away to anyone who clicks once.
 * The same goes for an operator revoking a grant from /admin.
 */
function applyEntitlement(paid: PaidEntitlement | null, perks: Perks | null): void {
  if (!paid && !perks && !billingLive()) return;
  if (!state.profile.id.startsWith("acct_")) return;
  const tier: SubTier =
    paid?.tier === "founder" ? "founder" : paid?.tier === "pro" ? "pro" : "free";
  // The founding badge is granted INTO state (and pushed) so it outlives the
  // entitlement lookup — badges once earned are never clawed back.
  const badge = paid?.badge === "founding" ? "founding" : null;
  const needBadge = badge !== null && !state.badges.includes(badge);

  /* The recipient's ceremony: play it once per grant per device. The
     fingerprint pins the exact entitlement (account, tier, badge, grant
     time); the freshness window keeps months-old memberships from
     re-celebrating on every new browser.

     NOT for a time-limited entitlement. The ceremony tells a Founder+ that
     the gold trim is theirs "from now on", which is a straightforwardly
     false thing to say to somebody with seven days — and firing the full
     confetti for a trial cheapens it for the people who actually bought
     one. The trial card says what they have and for how long, which is the
     honest version of the same news. */
  if (tier !== "free" && typeof paid?.until !== "number") {
    const fingerprint = `${state.profile.id}|${tier}|${badge ?? ""}|${paid?.ts ?? 0}`;
    let seen = "";
    try {
      seen = window.localStorage.getItem(CELEBRATED_KEY) ?? "";
    } catch {
      /* storage blocked — celebrate at most this once */
    }
    if (seen !== fingerprint) {
      try {
        window.localStorage.setItem(CELEBRATED_KEY, fingerprint);
      } catch {
        /* fine */
      }
      const isUpgrade = TIER_ORDER[tier] > TIER_ORDER[state.sub] || needBadge;
      const fresh = typeof paid?.ts === "number" && Date.now() - paid.ts < CELEBRATION_FRESH_MS;
      if (isUpgrade && fresh) {
        fireCelebration({ tier, founding: badge === "founding" });
      }
    }
  }

  /* The stand carries its own copy of the tier — that is how the gold trim
     and the priority listing travel with it to the floor and the directory
     — and that copy is a SNAPSHOT taken the last time the form was saved.
     Nothing else recomputes it. Left alone, an expired trial keeps its
     Founder+ tag and its place above every paying member in the directory
     forever, because its owner has no reason to ever reopen the editor.
     So the tier is re-derived here, where it changes. */
  const standTier: "pro" | "founder" | undefined = tier === "free" ? undefined : tier;
  const stand = state.myStartup;
  const standStale = Boolean(stand) && stand?.tier !== standTier;

  if (state.sub === tier && !needBadge && !standStale) return;
  setState({
    ...state,
    sub: tier,
    ...(stand && standStale ? { myStartup: { ...stand, tier: standTier } } : {}),
    // the entitlement badge goes FIRST so a full badge book can't drop it
    badges: needBadge && badge ? [...new Set([badge, ...state.badges])].slice(0, 48) : state.badges,
  });
}

/**
 * Bank purchased ticket packs. The server reports the account's CUMULATIVE
 * purchased tickets; the wallet just remembers the latest total (monotonic
 * max), and the balance derives from it — so a pack counts exactly once no
 * matter how many devices pull it or how often.
 */
function applyCoinCredits(coins: number | null): void {
  if (coins === null || !Number.isFinite(coins)) return;
  if (!state.profile.id.startsWith("acct_")) return;
  const total = Math.min(10_000_000, Math.trunc(coins));
  if (total <= state.wallet.redeemed) return;
  setState({ ...state, wallet: { ...state.wallet, redeemed: total } });
}

/**
 * Fold in weekly podium awards the server has granted.
 *
 * The server re-sends the whole list on every pull rather than expecting an
 * acknowledgement, so this has to be idempotent: an award is identified by
 * its week and board, and one already held is skipped. That also means the
 * ticket bonus is paid exactly once even though the grant arrives on every
 * sync for as long as the award exists.
 */
function applyAwards(incoming: Award[]): void {
  if (incoming.length === 0) return;
  const held = state.awards ?? [];
  const seen = new Set(held.map((a) => `${a.week}|${a.board}`));
  const fresh = incoming.filter((a) => !seen.has(`${a.week}|${a.board}`));
  if (fresh.length === 0) return;
  const bonus = fresh.reduce((sum, a) => sum + a.tickets, 0);
  setState({
    ...state,
    awards: [...fresh, ...held].slice(0, 24),
    wallet: { ...state.wallet, earned: state.wallet.earned + bonus },
  });
  // Announce the best of them — winning two boards in one week is one
  // moment, not two modals stacked on each other.
  const best = fresh.reduce((a, b) => (b.rank < a.rank ? b : a));
  if (awardCb) awardCb(best);
  else pendingAward = best;
}

/**
 * Pull-and-apply for the current identity, then push if the server had
 * nothing newer. Called on load and after sign-in; safe to call anytime.
 */
export function syncNow(): void {
  if (typeof window === "undefined") return;
  ensureClientInit();
  const me = state.profile.id;
  if (!me || state.profile.name === "") return;
  void pullState(me).then((remote) => {
    // Identity guard: a pull that resolves after a sign-out/sign-in must
    // not apply the OLD identity's data to the new one (a late account
    // pull would otherwise resurrect the account's blob under a fresh
    // guest id — and then re-publish it).
    if (state.profile.id !== me) return;
    if (remote && remote.state) applyRemoteState(remote);
    // Entitlement applies even when the blob was stale/absent — a fresh
    // payment changes `paid` without touching savedAt.
    if (remote) applyEntitlement(remote.paid, remote.perks);
    if (remote) applyCoinCredits(remote.coins);
    if (remote) applyAwards(remote.awards);
    // Follow with a push ONLY when the pull answered. It's hash-guarded, so
    // it's a no-op unless a merge folded local work into the pulled state or
    // this device has unsynced changes. After a FAILED pull, pushing blind
    // could overwrite the account's blob with a fresher-but-emptier local
    // state (e.g. right after a sign-out reset).
    if (remote) scheduleSyncPush();
  });
}

// ---------- id + parsing helpers ----------

/** Fresh guest profile id (used by sign-out to leave the account identity). */
export function makeGuestId(): string {
  return makeId();
}

function makeId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // fall through to the hex fallback
  }
  let hex = "";
  for (let i = 0; i < 32; i++) {
    hex += Math.floor(Math.random() * 16).toString(16);
  }
  return hex;
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function numOr(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function looksLikeConnection(v: unknown): v is Connection {
  if (!v || typeof v !== "object") return false;
  const c = v as Record<string, unknown>;
  return (
    typeof c.name === "string" &&
    typeof c.ts === "number" &&
    typeof c.floorId === "string"
  );
}

const GLYPHS = ["bolt", "leaf", "coin", "chip", "flask", "rocket", "heart", "cube", "wave", "star"] as const;
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

/** Tiny data-URL PNG for a custom booth logo (uploads downscale to 16x16). */
export function isValidLogo(v: unknown): v is string {
  return typeof v === "string" && v.startsWith("data:image/png;base64,") && v.length <= 8000;
}

/** Clamp an untrusted value to an integer palette index in [0, max]. */
function lookIndex(v: unknown, max: number): number {
  const n = Math.trunc(numOr(v, 0));
  return Math.min(Math.max(n, 0), max);
}

function sanitizeLook(v: unknown): { skin: number; outfit: number; hair: number } {
  const l = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  return { skin: lookIndex(l.skin, 5), outfit: lookIndex(l.outfit, 7), hair: lookIndex(l.hair, 7) };
}

function looksLikeStartup(v: unknown): v is Startup {
  if (!v || typeof v !== "object") return false;
  const s = v as Record<string, unknown>;
  if (
    typeof s.id !== "string" ||
    typeof s.name !== "string" ||
    typeof s.goal !== "string" ||
    typeof s.oneLiner !== "string" ||
    typeof s.founder !== "string" ||
    typeof s.booth !== "object" ||
    s.booth === null
  ) {
    return false;
  }
  const b = s.booth as Record<string, unknown>;
  return (
    typeof b.carpet === "string" &&
    HEX_COLOR.test(b.carpet) &&
    typeof b.banner === "string" &&
    HEX_COLOR.test(b.banner) &&
    typeof b.sign === "string" &&
    typeof b.glyph === "string" &&
    (GLYPHS as readonly string[]).includes(b.glyph)
  );
}

/** Defensive re-shape of whatever was in localStorage into a valid AppState. */
function sanitize(raw: unknown): AppState {
  const base = defaultState();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Record<string, unknown>;

  const p = r.profile;
  if (p && typeof p === "object") {
    const pr = p as Record<string, unknown>;
    if (typeof pr.id === "string") base.profile.id = pr.id;
    if (typeof pr.name === "string") base.profile.name = pr.name;
    if (pr.look && typeof pr.look === "object") {
      base.profile.look = sanitizeLook(pr.look);
    }
    if (typeof pr.status === "string") {
      const status = pr.status.trim().slice(0, 40);
      if (status) base.profile.status = status;
    }
    if (typeof pr.title === "string") {
      const title = pr.title.trim().slice(0, 24);
      if (title) base.profile.title = title;
    }
  }

  if (r.sub === "free" || r.sub === "pro" || r.sub === "founder") {
    base.sub = r.sub;
  }

  if (r.wallet && typeof r.wallet === "object" && !Array.isArray(r.wallet)) {
    const w = r.wallet as Record<string, unknown>;
    const earned = Math.min(1_000_000, Math.max(0, Math.trunc(numOr(w.earned, 0))));
    base.wallet = {
      earned,
      redeemed: Math.min(10_000_000, Math.max(0, Math.trunc(numOr(w.redeemed, 0)))),
      owned: [],
      connHigh: Math.min(10_000, Math.max(0, Math.trunc(numOr(w.connHigh, 0)))),
      // never above earned — an inflated base would hide real earnings
      earnedBase: Math.min(earned, Math.max(0, Math.trunc(numOr(w.earnedBase, 0)))),
    };
    if (Array.isArray(w.owned)) {
      // 40 chars covers the longest legitimate entry (a spot-hold id with
      // its timestamp and paid suffix); 160 entries is years of weekly
      // gold holds plus the whole catalog — holds are never pruned
      // because each one IS the record of its own spend.
      const ids = new Set<string>();
      for (const v of w.owned) {
        if (typeof v === "string" && v && v.length <= 40) ids.add(v);
        if (ids.size >= 160) break;
      }
      base.wallet.owned = Array.from(ids);
    }
  }

  if (Array.isArray(r.connections)) {
    base.connections = r.connections.filter(looksLikeConnection).map((c) => {
      const out: Connection = { name: c.name, ts: c.ts, floorId: c.floorId };
      if (typeof c.startupId === "string") out.startupId = c.startupId;
      if (typeof c.founder === "string") out.founder = c.founder;
      if (typeof c.peerId === "string") {
        const peerId = c.peerId.trim().slice(0, 64);
        if (peerId) out.peerId = peerId;
      }
      const note = typeof c.note === "string" ? c.note.trim().slice(0, 200) : "";
      if (note) out.note = note;
      return out;
    });
  }

  if (looksLikeStartup(r.myStartup)) {
    const s = r.myStartup;
    const rawTrim = (s.booth as { trim?: unknown }).trim;
    const rawStyle = (s.booth as { style?: unknown }).style;
    const rawProps = (s.booth as { props?: unknown }).props;
    const props = Array.isArray(rawProps)
      ? (rawProps.filter((p): p is BoothProp =>
          p === "plant" || p === "balloons" || p === "trophy" || p === "spotlight",
        ).slice(0, 3))
      : [];
    base.myStartup = {
      ...s,
      booth: {
        ...s.booth,
        sign: s.booth.sign.slice(0, 12),
        trim:
          rawTrim === "stripes" || rawTrim === "checker" || rawTrim === "dots"
            ? rawTrim
            : undefined,
        style:
          rawStyle === "bigtop" || rawStyle === "garden" || rawStyle === "arcade" || rawStyle === "neon"
            ? (rawStyle as BoothStyle)
            : undefined,
        props: props.length ? Array.from(new Set(props)) : undefined,
        logo: isValidLogo((s.booth as { logo?: unknown }).logo)
          ? (s.booth as { logo?: string }).logo
          : undefined,
      },
      founderLook: sanitizeLook((s as unknown as Record<string, unknown>).founderLook),
      goalProgress: clamp01(numOr(s.goalProgress, 0)),
      verifiedRevenue: Math.max(0, numOr(s.verifiedRevenue, 0)),
    };
  }

  if (r.claims && typeof r.claims === "object" && !Array.isArray(r.claims)) {
    for (const [k, v] of Object.entries(r.claims as Record<string, unknown>)) {
      const idx = Math.trunc(numOr(v, -1));
      if (idx >= 0 && idx <= 63 && k.length <= 64) base.claims[k] = idx;
    }
  } else if (base.myStartup) {
    // Migration from the reserved-spot era: booths used to auto-appear at
    // Indie Alley's front-row-center spot. Keep that stand standing.
    const alley = FLOORS.find((f) => f.id === "indie-alley");
    if (alley?.reservedSpot !== undefined) base.claims["indie-alley"] = alley.reservedSpot;
  }

  // Older localStorage snapshots predate onboarding/badges — the defaults
  // above already leave them as empty arrays, so hydration stays clean.
  if (Array.isArray(r.onboarding)) {
    const steps = new Set<OnboardingStep>();
    for (const v of r.onboarding) {
      if (typeof v === "string" && (ONBOARDING_STEPS as readonly string[]).includes(v)) {
        steps.add(v as OnboardingStep);
      }
    }
    base.onboarding = Array.from(steps);
  }

  if (Array.isArray(r.badges)) {
    const ids = new Set<string>();
    for (const v of r.badges) {
      if (typeof v !== "string") continue;
      const id = v.trim();
      if (id && id.length <= 32) ids.add(id);
      if (ids.size >= 48) break;
    }
    base.badges = Array.from(ids);
  }

  base.tutorialDone = r.tutorialDone === true;

  // Podium awards. Same defensive read as everything else here: this blob
  // may have come off localStorage, where anyone can edit it. A fabricated
  // award only buys a title on your own screen — the boards themselves are
  // the server's — but it should still have to be well formed.
  if (Array.isArray(r.awards)) {
    const awards: PodiumAward[] = [];
    const seen = new Set<string>();
    for (const v of r.awards) {
      if (!v || typeof v !== "object") continue;
      const a = v as Record<string, unknown>;
      if (typeof a.week !== "string" || typeof a.board !== "string") continue;
      if (typeof a.title !== "string" || !a.title.trim()) continue;
      const rank = Math.trunc(numOr(a.rank, 0));
      if (rank < 1 || rank > 3) continue;
      const key = `${a.week}|${a.board}`;
      if (seen.has(key)) continue;
      seen.add(key);
      awards.push({
        week: a.week.slice(0, 12),
        board: a.board.slice(0, 16),
        rank,
        title: a.title.trim().slice(0, 24),
        tickets: Math.max(0, Math.min(100, Math.trunc(numOr(a.tickets, 0)))),
      });
      if (awards.length >= 24) break;
    }
    if (awards.length) base.awards = awards;
  }

  const strList = (v: unknown, maxLen: number, cap: number): string[] => {
    if (!Array.isArray(v)) return [];
    const out = new Set<string>();
    for (const x of v) {
      if (typeof x === "string" && x && x.length <= maxLen) out.add(x);
      if (out.size >= cap) break;
    }
    return Array.from(out);
  };

  if (r.quest && typeof r.quest === "object") {
    const q = r.quest as Record<string, unknown>;
    base.quest = {
      talkedTo: strList(q.talkedTo, 64, 200),
      signed: strList(q.signed, 64, 200),
      floors: strList(q.floors, 64, 32),
      emotes: Math.min(100_000, Math.max(0, Math.trunc(numOr(q.emotes, 0)))),
    };
  }

  base.claimedQuests = strList(r.claimedQuests, 32, 50);

  if (Array.isArray(r.quizzes)) {
    base.quizzes = r.quizzes.map(sanitizeQuiz).filter(Boolean).slice(0, MAX_OWN_QUIZZES);
  }
  if (r.parkourBests && typeof r.parkourBests === "object" && !Array.isArray(r.parkourBests)) {
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(r.parkourBests as Record<string, unknown>)) {
      if (typeof v === "number" && Number.isFinite(v) && v > 0 && v < 100000) {
        out[k.slice(0, 40)] = Math.round(v * 10) / 10;
      }
    }
    base.parkourBests = out;
  }
  if (typeof r.arcadeDay === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.arcadeDay)) {
    base.arcadeDay = r.arcadeDay;
  }
  if (typeof r.arcadeWon === "number" && Number.isFinite(r.arcadeWon)) {
    base.arcadeWon = Math.max(0, Math.min(ARCADE_DAILY_CAP, Math.floor(r.arcadeWon)));
  }
  if (typeof r.arcadeBest === "number" && Number.isFinite(r.arcadeBest)) {
    base.arcadeBest = Math.max(0, Math.min(300, Math.floor(r.arcadeBest)));
  }
  if (typeof r.lastVisitDay === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.lastVisitDay)) {
    base.lastVisitDay = r.lastVisitDay;
  }
  base.visitStreak = Math.min(10_000, Math.max(0, Math.trunc(numOr(r.visitStreak, 0))));
  base.bestStreak = Math.max(
    base.visitStreak,
    Math.min(10_000, Math.max(0, Math.trunc(numOr(r.bestStreak, 0)))),
  );
  base.lastSeenAt = Math.max(0, numOr(r.lastSeenAt, 0));
  base.prevSeenAt = Math.max(0, numOr(r.prevSeenAt, 0));

  return base;
}

// ---------- hydration + cross-tab sync ----------

function ensureClientInit(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;

  let next: AppState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    next = raw ? sanitize(JSON.parse(raw)) : defaultState();
  } catch {
    next = defaultState();
  }

  // First run (or corrupted id): mint and persist a stable profile id.
  if (!next.profile.id) {
    next = { ...next, profile: { ...next.profile, id: makeId() } };
  }

  state = next;
  persist();
  emit();

  // Pull any newer cross-device state once per load (async; the UI renders
  // from localStorage first and updates if the server has something fresher).
  setTimeout(() => syncNow(), 0);

  if (!storageListenerAttached) {
    storageListenerAttached = true;
    window.addEventListener("storage", (ev: StorageEvent) => {
      if (ev.key !== null && ev.key !== STORAGE_KEY) return;
      try {
        let incoming = ev.newValue
          ? sanitize(JSON.parse(ev.newValue))
          : defaultState();
        if (!incoming.profile.id) {
          incoming = {
            ...incoming,
            profile: { ...incoming.profile, id: makeId() },
          };
        }
        state = incoming;
        emit();
      } catch {
        // Ignore malformed writes from other tabs.
      }
    });
  }
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  ensureClientInit();
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): AppState {
  return state;
}

function getServerSnapshot(): AppState {
  return SERVER_SNAPSHOT;
}

// ---------- actions (module-level, stable identity) ----------

/** Wallet with `n` more EARNED tickets, clamped to the sanitize() ceiling. */
function credited(w: Wallet, n: number): Wallet {
  return { ...w, earned: Math.min(1_000_000, w.earned + Math.max(0, Math.trunc(n))) };
}

const ACTIONS: StoreActions = {
  setName(name: string): void {
    ensureClientInit();
    setState({ ...state, profile: { ...state.profile, name } });
  },

  setLook(look: AvatarLook): void {
    ensureClientInit();
    setState({ ...state, profile: { ...state.profile, look: { ...look } } });
  },

  setSub(tier: SubTier): void {
    ensureClientInit();
    setState({ ...state, sub: tier });
  },

  addConnection(c: Omit<Connection, "ts">): void {
    ensureClientInit();
    // Dedupe by peerId when present (names collide between live people),
    // then by startupId, otherwise by name among connections that also lack
    // both ids. Re-connecting refreshes ts.
    const isSame = (x: Connection): boolean =>
      c.peerId !== undefined
        ? x.peerId === c.peerId
        : c.startupId !== undefined
          ? x.startupId === c.startupId
          : x.startupId === undefined && x.peerId === undefined && x.name === c.name;
    let kept = state.connections.filter((x) => !isSame(x));
    // live cap matches the merge/sanitize cap (200): an uncapped list can
    // outgrow the server's state-blob byte limit and silently stop syncing
    if (kept.length >= 200) kept = kept.slice(-199);
    // ts doubles as the removal key, so keep it unique even when two
    // connections land in the same millisecond.
    const maxExisting = kept.reduce((m, x) => Math.max(m, x.ts), 0);
    const ts = Math.max(Date.now(), maxExisting + 1);
    // Pay only when the connection count reaches a NEW personal high —
    // a re-connect, or removing and re-adding someone, earns nothing.
    const newCount = kept.length + 1;
    const isPaid = kept.length === state.connections.length && newCount > state.wallet.connHigh;
    setState({
      ...state,
      connections: [{ ...c, ts }, ...kept],
      wallet: isPaid
        ? { ...credited(state.wallet, EARN.connection), connHigh: newCount }
        : state.wallet,
    });
  },

  removeConnection(ts: number): void {
    ensureClientInit();
    setState({
      ...state,
      connections: state.connections.filter((x) => x.ts !== ts),
    });
  },

  saveMyStartup(s: Startup): void {
    ensureClientInit();
    setState({
      ...state,
      myStartup: {
        ...s,
        goalProgress: clamp01(s.goalProgress),
        verifiedRevenue: Math.max(0, numOr(s.verifiedRevenue, 0)),
      },
    });
  },

  clearMyStartup(): void {
    ensureClientInit();
    const { myStartup: _dropped, ...rest } = state;
    // A startup that no longer exists can't hold stands anywhere.
    setState({ ...rest, claims: {} });
  },

  verifyMyRevenue(monthly: number, goalProgress: number): void {
    ensureClientInit();
    const current = state.myStartup;
    if (!current) return; // no-op without a startup to verify
    setState({
      ...state,
      myStartup: {
        ...current,
        verifiedRevenue: Math.max(0, numOr(monthly, 0)),
        goalProgress: clamp01(goalProgress),
      },
    });
  },

  claimSpot(floorId: string, spotIndex: number): void {
    // TODO(spot-id): persist the spot's permanent id instead of its index.
    ensureClientInit();
    if (!state.myStartup) return; // nothing to put on the stand
    const idx = Math.trunc(numOr(spotIndex, -1));
    if (idx < 0) return;
    let claims: Record<string, number> = { ...state.claims, [floorId]: idx };
    // One stand per startup: claiming on a real floor releases any claim on
    // another real floor (the server enforces the same rule; practice claims
    // in the tutorial hall are exempt in both places).
    if (floorId !== PRACTICE_FLOOR_ID) {
      claims = Object.fromEntries(
        Object.entries(claims).filter(([fid]) => fid === floorId || fid === PRACTICE_FLOOR_ID),
      );
    }
    setState({ ...state, claims });
  },

  unclaimSpot(floorId: string): void {
    ensureClientInit();
    if (state.claims[floorId] === undefined) return;
    const claims = { ...state.claims };
    delete claims[floorId];
    setState({ ...state, claims });
  },

  setStatus(s: string): void {
    ensureClientInit();
    const status = s.trim().slice(0, 40);
    if (status === (state.profile.status ?? "")) return; // no-op, skip a write
    const profile = { ...state.profile };
    if (status) profile.status = status;
    else delete profile.status;
    setState({ ...state, profile });
  },

  setConnectionNote(ts: number, note: string): void {
    ensureClientInit();
    if (!state.connections.some((c) => c.ts === ts)) return;
    const trimmed = note.trim().slice(0, 200);
    const connections = state.connections.map((c) => {
      if (c.ts !== ts) return c;
      if (!trimmed) {
        const { note: _dropped, ...rest } = c;
        return rest;
      }
      return { ...c, note: trimmed };
    });
    setState({ ...state, connections });
  },

  completeOnboarding(step: OnboardingStep): void {
    ensureClientInit();
    // Validate at runtime too — steps can arrive from loosely-typed callers.
    if (!ONBOARDING_STEPS.includes(step)) return;
    if (state.onboarding.includes(step)) return;
    setState({ ...state, onboarding: [...state.onboarding, step] });
  },

  grantBadge(id: string): void {
    ensureClientInit();
    const badge = id.trim();
    if (!badge || badge.length > 32) return;
    if (state.badges.includes(badge)) return;
    if (state.badges.length >= 48) return; // matches the sanitize() cap
    // every new badge pays a ticket bounty, whatever earned it
    setState({
      ...state,
      badges: [...state.badges, badge],
      wallet: credited(state.wallet, EARN.badge),
    });
  },

  setTutorialDone(done: boolean): void {
    ensureClientInit();
    if (state.tutorialDone === done) return;
    setState({ ...state, tutorialDone: done });
  },

  /** Rearm the guided tour (the lobby's Start/Replay tutorial buttons). */
  resetTutorial(): void {
    ensureClientInit();
    if (!state.tutorialDone && state.onboarding.length === 0) return;
    setState({ ...state, tutorialDone: false, onboarding: [] });
  },

  recordTalkedTo(id: string): void {
    ensureClientInit();
    const key = id.trim().slice(0, 64);
    if (!key || state.quest.talkedTo.includes(key) || state.quest.talkedTo.length >= 200) return;
    setState({ ...state, quest: { ...state.quest, talkedTo: [...state.quest.talkedTo, key] } });
  },

  recordSigned(key: string): void {
    ensureClientInit();
    const k = key.trim().slice(0, 64);
    if (!k || state.quest.signed.includes(k) || state.quest.signed.length >= 200) return;
    setState({
      ...state,
      quest: { ...state.quest, signed: [...state.quest.signed, k] },
      wallet: credited(state.wallet, EARN.guestbook),
    });
  },

  recordFloorVisit(floorId: string): void {
    ensureClientInit();
    const f = floorId.trim().slice(0, 64);
    if (!f || state.quest.floors.includes(f) || state.quest.floors.length >= 32) return;
    setState({ ...state, quest: { ...state.quest, floors: [...state.quest.floors, f] } });
  },

  recordEmote(): void {
    ensureClientInit();
    if (state.quest.emotes >= 100_000) return;
    setState({ ...state, quest: { ...state.quest, emotes: state.quest.emotes + 1 } });
  },

  markQuestClaimed(id: string): void {
    ensureClientInit();
    const q = id.trim().slice(0, 32);
    if (!q || state.claimedQuests.includes(q) || state.claimedQuests.length >= 50) return;
    const bounty = QUESTS.find((def) => def.id === q)?.reward.tickets ?? 0;
    setState({
      ...state,
      claimedQuests: [...state.claimedQuests, q],
      wallet: credited(state.wallet, bounty),
    });
  },

  finishParkour(mapId, seconds, tickets) {
    const today = dayKey(Date.now());
    const already = state.arcadeDay === today ? (state.arcadeWon ?? 0) : 0;
    const pay = Math.min(Math.max(0, ARCADE_DAILY_CAP - already), Math.max(0, Math.floor(tickets)));
    const bests = { ...(state.parkourBests ?? {}) };
    const t = Math.max(0, Math.round(seconds * 10) / 10);
    if (bests[mapId] === undefined || t < bests[mapId]) bests[mapId] = t;
    setState({
      ...state,
      parkourBests: bests,
      arcadeDay: today,
      arcadeWon: already + pay,
      wallet: pay > 0 ? credited(state.wallet, pay) : state.wallet,
    });
  },

  publishQuiz(quiz) {
    const clean = sanitizeQuiz(quiz);
    if (!clean) return false;
    const mine = (state.quizzes ?? []).map(sanitizeQuiz).filter(Boolean) as Quiz[];
    if (mine.length >= MAX_OWN_QUIZZES) return false;
    if (walletBalance(state) < QUIZ_COST) return false;
    setState({
      ...state,
      quizzes: [...mine, { ...clean, builtin: false }],
      wallet: { ...state.wallet, redeemed: state.wallet.redeemed + QUIZ_COST },
    });
    return true;
  },

  deleteQuiz(id) {
    const mine = (state.quizzes ?? []).map(sanitizeQuiz).filter(Boolean) as Quiz[];
    setState({ ...state, quizzes: mine.filter((q) => q.id !== id) });
  },

  earnArcade(tickets, runTotal) {
    const today = dayKey(Date.now());
    const already = state.arcadeDay === today ? (state.arcadeWon ?? 0) : 0;
    const room = Math.max(0, ARCADE_DAILY_CAP - already);
    const pay = Math.min(room, Math.max(0, Math.floor(tickets)));
    const best = Math.max(state.arcadeBest ?? 0, Math.max(0, Math.min(300, Math.floor(runTotal))));
    setState({
      ...state,
      arcadeDay: today,
      arcadeWon: already + pay,
      arcadeBest: best,
      wallet: pay > 0 ? credited(state.wallet, pay) : state.wallet,
    });
  },

  recordVisit(): void {
    ensureClientInit();
    const now = Date.now();
    const sameSession = state.lastSeenAt > 0 && now - state.lastSeenAt < 30 * 60_000;
    // local calendar day, so "come back tomorrow" means the user's tomorrow
    const dayOf = (ms: number): string => {
      const d = new Date(ms);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    const today = dayOf(now);
    let { visitStreak, bestStreak, lastVisitDay } = state;
    let wallet = state.wallet;
    if (lastVisitDay !== today) {
      const yesterday = dayOf(now - 24 * 60 * 60 * 1000);
      visitStreak = lastVisitDay === yesterday ? visitStreak + 1 : 1;
      bestStreak = Math.max(bestStreak, visitStreak);
      lastVisitDay = today;
      // daily check-in pay: first visit of each calendar day, scaling with
      // the streak — showing up is the job, the streak is the raise
      wallet = credited(wallet, dailyTickets(visitStreak));
    }
    setState({
      ...state,
      visitStreak,
      bestStreak,
      lastVisitDay,
      wallet,
      // a real gap rolls the away-mark forward; same-session visits keep it,
      // so the digest still describes "since you last sat down"
      prevSeenAt: sameSession ? state.prevSeenAt : state.lastSeenAt,
      lastSeenAt: now,
    });
  },

  setTitle(t: string): void {
    ensureClientInit();
    const title = t.trim().slice(0, 24);
    if (title === (state.profile.title ?? "")) return;
    const profile = { ...state.profile };
    if (title) profile.title = title;
    else delete profile.title;
    setState({ ...state, profile });
  },

  buyItem(itemId: string): boolean {
    ensureClientInit();
    const item = shopItem(itemId);
    if (!item || item.price === 0) return false;
    if (state.wallet.owned.some((e) => e === itemId || e.startsWith(`${itemId}@`))) return false;
    // Exhibitors (stand-holders) pay the exhibitor rate; the paid price
    // rides along in the entry ("style:bigtop@200") so the balance keeps
    // deriving the true spend after the discount.
    const paid = priceFor(state, item);
    if (walletBalance(state) < paid) return false;
    if (state.wallet.owned.length >= 160) return false; // matches sanitize() cap
    const entry = paid === item.price ? itemId : `${itemId}@${paid}`;
    // owning the item IS the spend — the balance derives from owned prices
    setState({
      ...state,
      wallet: { ...state.wallet, owned: [...state.wallet.owned, entry] },
    });
    return true;
  },

  buySpotHold(floorId: string, tier: SpotTier): boolean {
    ensureClientInit();
    if (tier === "bronze") return true; // bronze is presence, never a purchase
    // An active hold that covers the tier means nothing to buy — moving
    // between same-tier spots inside a hold is free.
    if (holdCovers(activeSpotHold(state, floorId), tier)) return true;
    const paid = spotTicketPrice(SPOT_PRICE[tier], state.sub);
    if (walletBalance(state) < paid) return false;
    if (state.wallet.owned.length >= 160) return false;
    const id = spotHoldId(floorId, tier, newHoldUntil(), paid);
    if (state.wallet.owned.includes(id)) return true;
    setState({
      ...state,
      wallet: { ...state.wallet, owned: [...state.wallet.owned, id] },
    });
    return true;
  },

  setIdentity(id: string, name: string): void {
    ensureClientInit();
    const nextId = id.trim().slice(0, 64) || makeId();
    const nextName = name.trim().slice(0, 24) || state.profile.name;
    if (nextId === state.profile.id && nextName === state.profile.name) return;

    // SIGN-OUT (account -> guest): the workspace goes blank. The account's
    // data lives on the server (every change pushes, and AccountCard
    // flushes the debounce before logout) and comes back on the next
    // sign-in; leaving it on a shared screen would hand the next visitor a
    // stranger's booth, wallet, and badges.
    if (state.profile.id.startsWith("acct_") && !nextId.startsWith("acct_")) {
      const fresh = defaultState();
      fresh.profile = { ...fresh.profile, id: nextId };
      // The invisible anti-refarm ledgers survive the blank: without them a
      // sign-out/sign-in loop re-pays the daily check-in and re-claims quest
      // bounties into every merge — free ticket minting.
      fresh.lastVisitDay = state.lastVisitDay;
      fresh.claimedQuests = state.claimedQuests;
      setState(fresh);
      setLastSyncTs(0);
      lastPushedJson = "";
      return; // a fresh guest has nothing to pull
    }

    // SIGN-IN / identity change: the wallet crosses largely UNCHANGED —
    // including redeemed. Zeroing redeemed here would strand owned items
    // bought with pack funds (cost keeps counting, funding vanishes -> a
    // permanent deficit that silently swallows future earnings). The cost
    // of keeping it is that pack value can leak between identities in the
    // SAME browser — bounded by what that browser's human actually paid,
    // and cosmetics-only. earnedBase DOES reset: relative to the new
    // identity's server state, everything earned here is unsynced, so the
    // first merge folds it in instead of letting a max() discard it.
    setState({
      ...state,
      profile: { ...state.profile, id: nextId, name: nextName },
      wallet: { ...state.wallet, earnedBase: 0 },
    });
    // Signing in on a second device pulls the account's progress down;
    // a fresh account uploads this device's progress instead.
    setLastSyncTs(0);
    lastPushedJson = "";
    syncNow();
  },
};

// ---------- hook ----------

/**
 * [state, actions] for the local player. Safe to call from any number of
 * components at once — all instances share one store and re-render together.
 */
export function useAppState(): [AppState, StoreActions] {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return [snapshot, ACTIONS];
}
