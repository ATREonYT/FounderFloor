"use client";

/**
 * Cross-device progress sync. The store pushes a debounced snapshot of app
 * state (booth, badges, quests, streaks, membership) to the floor server
 * under the current identity; on load — and after signing in — it pulls
 * and applies whatever is newer than this device's last sync point.
 *
 * Merge rule is last-writer-wins by server timestamp: simple, predictable,
 * and right for a single person hopping devices. The pulled blob goes
 * through the store's own defensive sanitize() before it touches anything,
 * exactly like localStorage does.
 */

import { httpBase } from "@/lib/net";
import { guestSecret, tokenFor } from "@/lib/auth";
import type { AppState } from "@/lib/types";

export const SYNC_TS_KEY = "founderfloor:sync-ts";

/** The slice of state that travels: everything except device-local marks. */
export function syncableState(s: AppState): Record<string, unknown> {
  const { lastSeenAt: _seen, prevSeenAt: _prev, ...rest } = s;
  // wallet.earnedBase is per-device sync bookkeeping, meaningless to other
  // devices — strip it so pushing it can't clobber theirs
  const { earnedBase: _base, ...wallet } = rest.wallet;
  return { ...rest, wallet };
}

/** Billing entitlement the server attached to an account (null = none). */
export interface PaidEntitlement {
  tier?: string;
  badge?: string;
  /** When the entitlement was granted (webhook/admin) — ms epoch. */
  ts?: number;
  /**
   * When a TIME-LIMITED entitlement ends — ms epoch. Absent means it does
   * not end. The server has already applied this before answering, so an
   * entitlement that arrives here is live by definition; the field is for
   * showing a countdown, never for deciding access. Deciding access from it
   * on the client would put the deadline on the visitor's own clock.
   */
  until?: number;
}

/** What the account has earned that is not an entitlement: trial and invites. */
export interface Perks {
  trial: { until: number | null; used: boolean; days: number };
  referral: {
    code: string;
    joined: number;
    daysEarned: number;
    daysPer: number;
    daysCap: number;
  };
}

/**
 * A podium finish the server handed out at a weekly rollover.
 *
 * Granted server-side and re-sent on every pull rather than acknowledged
 * once: an ack protocol is just a way to lose somebody's prize to a dropped
 * request. The client folds each one in idempotently, keyed by week+board.
 */
export interface Award {
  /** e.g. "2026-W33" */
  week: string;
  /** which table: "parkour" | "arcade" | "connections" | "time" */
  board: string;
  rank: number;
  /** An unbuyable title, rolled when the week closed. */
  title: string;
  tickets: number;
}

/** Shape-check awards; anything malformed is dropped rather than trusted. */
export function readAwards(v: unknown): Award[] {
  if (!Array.isArray(v)) return [];
  const out: Award[] = [];
  for (const raw of v) {
    if (!raw || typeof raw !== "object") continue;
    const a = raw as Record<string, unknown>;
    if (typeof a.week !== "string" || typeof a.board !== "string") continue;
    if (typeof a.title !== "string" || !a.title) continue;
    const rank = Number(a.rank);
    if (!Number.isInteger(rank) || rank < 1 || rank > 3) continue;
    const tickets = Number(a.tickets);
    out.push({
      week: a.week.slice(0, 12),
      board: a.board.slice(0, 16),
      rank,
      title: a.title.slice(0, 24),
      tickets: Number.isFinite(tickets) && tickets > 0 ? Math.min(tickets, 100) : 0,
    });
    if (out.length >= 24) break;
  }
  return out;
}

/** Shape-check the perks blob; anything malformed becomes null, not a crash. */
function readPerks(v: unknown): Perks | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, Record<string, unknown>>;
  const t = o.trial;
  const r = o.referral;
  if (!t || !r || typeof r.code !== "string") return null;
  const num = (x: unknown, fallback = 0) =>
    typeof x === "number" && Number.isFinite(x) ? x : fallback;
  return {
    trial: {
      until: typeof t.until === "number" && Number.isFinite(t.until) ? t.until : null,
      used: t.used === true,
      days: num(t.days, 7),
    },
    referral: {
      code: r.code,
      joined: num(r.joined),
      daysEarned: num(r.daysEarned),
      daysPer: num(r.daysPer, 7),
      daysCap: num(r.daysCap, 63),
    },
  };
}

export async function pullState(
  me: string,
): Promise<{
  state: unknown;
  savedAt: number;
  paid: PaidEntitlement | null;
  /** Cumulative purchased tickets for this account (null for guests). */
  coins: number | null;
  /** Trial and referral facts (null for guests). */
  perks: Perks | null;
  /** Weekly podium finishes the server has granted this profile. */
  awards: Award[];
} | null> {
  const base = httpBase();
  if (!base || !me) return null;
  try {
    const tok = tokenFor(me);
    const gs = guestSecret();
    const headers: Record<string, string> = {};
    if (tok) headers.Authorization = `Bearer ${tok}`;
    if (gs) headers["X-FF-GS"] = gs;
    const res = await fetch(`${base}/state?me=${encodeURIComponent(me)}`, { headers });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      state?: unknown;
      savedAt?: number;
      paid?: unknown;
      coins?: unknown;
      perks?: unknown;
      awards?: unknown;
    };
    const paid =
      data.paid && typeof data.paid === "object" ? (data.paid as PaidEntitlement) : null;
    return {
      state: data.state ?? null,
      savedAt: typeof data.savedAt === "number" ? data.savedAt : 0,
      paid,
      coins: typeof data.coins === "number" && Number.isFinite(data.coins) ? data.coins : null,
      perks: readPerks(data.perks),
      awards: readAwards(data.awards),
    };
  } catch {
    return null; // offline — local-only until the server is back
  }
}

/** Returns the server's savedAt on success, null on failure/offline. */
export async function pushState(me: string, state: Record<string, unknown>): Promise<number | null> {
  const base = httpBase();
  if (!base || !me) return null;
  try {
    const res = await fetch(`${base}/state/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ me, state, token: tokenFor(me), gs: guestSecret() }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { ok?: boolean; savedAt?: number };
    return data.ok && typeof data.savedAt === "number" ? data.savedAt : null;
  } catch {
    return null;
  }
}

export function getLastSyncTs(): number {
  if (typeof window === "undefined") return 0;
  try {
    return Number(window.localStorage.getItem(SYNC_TS_KEY) || 0);
  } catch {
    return 0;
  }
}

export function setLastSyncTs(ts: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SYNC_TS_KEY, String(ts));
  } catch {
    // storage blocked — we'll just pull again next load
  }
}
