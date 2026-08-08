"use client";

/**
 * The trial and the referral, on the client.
 *
 * Everything here is DISPLAY AND INTENT. The server decides who is entitled
 * to what and for how long; this module reads its answer, remembers an
 * invite code between the click and the sign-up, and asks for the trial to
 * start. Nothing here grants anything, and nothing here should ever be the
 * reason a feature unlocks — that decision arrives in `paid` from /state,
 * already resolved against the server's clock.
 *
 * The distinction matters because the alternative is tempting and wrong: a
 * countdown computed locally would let anybody with devtools set their own
 * clock back and keep Founder+ forever. The countdown here is cosmetic. The
 * entitlement it counts down is not.
 */

import { useEffect, useState } from "react";
export { rememberRefFromUrl, referralLink } from "@/lib/referral";
import type { Perks } from "@/lib/sync";
import { httpBase } from "@/lib/net";
import { getAuth } from "@/lib/auth";
import { useAppState, syncNow } from "@/lib/store";

/** Whole days left, rounded UP: half a day left is still "1 day left". */
export function daysLeft(until: number | null): number {
  if (!until) return 0;
  return Math.max(0, Math.ceil((until - Date.now()) / 86_400_000));
}

/**
 * The account's trial and referral facts, re-read whenever the store
 * changes. Null for guests and while offline — every caller renders
 * nothing rather than guessing, because a wrong number here is a promise
 * the server will not keep.
 */
/**
 * Something changed that /state knows about but the store does not.
 *
 * Starting a trial on top of a running invite window moves no local value
 * at all — the tier was already founder — so nothing in the store changes
 * and the effect below would never re-run. The cards would go on showing
 * the old numbers until the next sign-in. This is the nudge.
 */
const perksListeners = new Set<() => void>();
export function refreshPerks(): void {
  for (const fn of perksListeners) fn();
}

export function usePerks(): Perks | null {
  const [state] = useAppState();
  const [perks, setPerks] = useState<Perks | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    perksListeners.add(bump);
    return () => {
      perksListeners.delete(bump);
    };
  }, []);

  useEffect(() => {
    let dead = false;
    const load = async () => {
      const base = httpBase();
      const auth = getAuth();
      if (!base || !auth) {
        setPerks(null);
        return;
      }
      try {
        const res = await fetch(`${base}/state?me=${encodeURIComponent(auth.id)}`, {
          headers: { Authorization: `Bearer ${auth.token}` },
        });
        if (!res.ok || dead) return;
        const data = (await res.json()) as { perks?: Perks | null };
        if (!dead) setPerks(data.perks ?? null);
      } catch {
        /* offline — the cards hide themselves */
      }
    };
    void load();
    return () => {
      dead = true;
    };
    // profile.id flips on sign-in and sign-out; sub changes when a trial
    // starts or lapses, which is exactly when these numbers move
  }, [state.profile.id, state.sub, tick]);

  return perks;
}

/**
 * Ask the server to start the trial. Returns an error string, or "" on
 * success. Follows with a sync so the new entitlement lands immediately
 * rather than at the next 45-second heartbeat.
 */
export async function startTrial(): Promise<string> {
  const base = httpBase();
  const auth = getAuth();
  if (!base) return "the floor server is not reachable right now";
  if (!auth) return "sign in first";
  try {
    const res = await fetch(`${base}/trial/start`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: auth.token }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!data.ok) return data.error || "that did not work";
    syncNow();
    refreshPerks();
    return "";
  } catch {
    return "the floor server is not reachable right now";
  }
}
