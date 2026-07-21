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
}

export async function pullState(
  me: string,
): Promise<{
  state: unknown;
  savedAt: number;
  paid: PaidEntitlement | null;
  /** Cumulative purchased tickets for this account (null for guests). */
  coins: number | null;
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
    };
    const paid =
      data.paid && typeof data.paid === "object" ? (data.paid as PaidEntitlement) : null;
    return {
      state: data.state ?? null,
      savedAt: typeof data.savedAt === "number" ? data.savedAt : 0,
      paid,
      coins: typeof data.coins === "number" && Number.isFinite(data.coins) ? data.coins : null,
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
