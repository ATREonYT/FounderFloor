/**
 * THE WEEK OF THE WHOLE STAFF — a reverse trial, started by value, not by
 * install. The first time the app pays something back (a second opinion
 * read, a week logged, a coach's first reply) and the founder is on Free,
 * the server starts seven days of Founder+ on the account (once, ever),
 * and a sheet says so with the timeline and the price after. If nobody is
 * signed in, the same sheet asks for the badge first: the trial is the
 * reason to have an account, and the account is how the emails work.
 *
 * Research in docs/reboot-plan.md ("The mine"): around half of paid
 * conversions happen on day zero, so this sheet is the one paywall shown
 * that day — closable, after value, with a preview of what the week is.
 */
import { create } from "zustand";
import { useSession, useFounder } from "./store";
import { effectivePlan } from "./billing";

export type ValueMoment = "read" | "log" | "coach" | "map";

interface OfferState {
  /** The sheet that is open, or null. */
  open: { moment: ValueMoment; needsSignIn: boolean; started: boolean; until?: number } | null;
  dismiss(): void;
}
export const useOffer = create<OfferState>()((set) => ({ open: null, dismiss: () => set({ open: null }) }));

/** Days of the whole staff left on the server's trial, or null when there is none running. */
export function trialLeft(): { days: number; until: number } | null {
  const paid = useSession.getState().floor?.paid;
  if (!paid || typeof paid.until !== "number") return null;
  const ms = paid.until - Date.now();
  if (ms <= 0) return null;
  return { days: Math.ceil(ms / 86_400_000), until: paid.until };
}

/** Call at a value moment. Starts the week if it can, offers it if it must, does nothing if it has been had. */
export async function valueMoment(moment: ValueMoment): Promise<void> {
  const f = useFounder.getState();
  if (f.offered) return;
  if (effectivePlan() !== "free") return;
  const s = useSession.getState();
  if (!s.auth) {
    f.setOffered(moment);
    useOffer.setState({ open: { moment, needsSignIn: true, started: false } });
    return;
  }
  if (s.account?.trialUsed || s.floor?.perks && (s.floor.perks as { trial?: { used?: boolean } }).trial?.used) {
    f.setOffered(moment);
    return;
  }
  const r = await s.startTrial();
  f.setOffered(moment);
  useOffer.setState({ open: { moment, needsSignIn: false, started: r.ok, until: r.ok ? r.until : undefined } });
}

/** Retry the start after a sign-in that the sheet asked for. */
export async function claimAfterSignIn(): Promise<void> {
  const s = useSession.getState();
  if (!s.auth || s.account?.trialUsed) return;
  const r = await s.startTrial();
  if (r.ok) useOffer.setState({ open: { moment: "read", needsSignIn: false, started: true, until: r.until } });
}

/** The gate on the map: rooms after this many are the whole staff's. */
export const FREE_ROOMS = 3;

/**
 * May this room open? Free rooms always. A room past the gate opens on any
 * paid plan or a running week; otherwise the week is offered here (sign in
 * first if needed), and if the week has already been had, the plans.
 * Returns true when the caller may open the room now.
 */
export async function roomGate(n: number): Promise<boolean> {
  if (n <= FREE_ROOMS) return true;
  if (effectivePlan() !== "free") return true;
  const s = useSession.getState();
  const f = useFounder.getState();
  if (!s.auth) {
    f.setOffered("map");
    useOffer.setState({ open: { moment: "map", needsSignIn: true, started: false } });
    return false;
  }
  if (s.account?.trialUsed) {
    useOffer.setState({ open: { moment: "map", needsSignIn: false, started: false } });
    return false;
  }
  const r = await s.startTrial();
  f.setOffered("map");
  useOffer.setState({ open: { moment: "map", needsSignIn: false, started: r.ok, until: r.ok ? r.until : undefined } });
  return r.ok;
}
