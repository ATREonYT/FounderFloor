"use client";

/**
 * The free trial: start it, or watch it run down.
 *
 * Card-free on purpose, and the copy says so twice, because "free trial"
 * has been trained to mean "we have your card and will charge it on day
 * eight". Nothing is stored, nothing renews, and when it ends the account
 * is simply free again. Saying that plainly is worth more than a bigger
 * button.
 *
 * The countdown is cosmetic. The entitlement it counts is resolved on the
 * server, which is what /state answers with — see the note at the top of
 * lib/perks.ts.
 */

import { useState } from "react";
import { useAppState } from "@/lib/store";
import { usePerks, startTrial, daysLeft } from "@/lib/perks";
import Spec from "@/components/Spec";

export default function TrialCard({ className = "" }: { className?: string }) {
  const [state] = useAppState();
  const perks = usePerks();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // Guests and offline visitors get nothing rather than a broken promise.
  if (!perks) return null;

  const left = daysLeft(perks.trial.until);
  const running = left > 0;
  // A permanent entitlement — a founding seat, a real subscription — has no
  // end date. Offering those people a trial would be offering a downgrade.
  const permanent = state.sub !== "free" && !perks.trial.until;

  if (permanent) return null;

  /* Days running, trial still untouched: somebody who came in on an invite.
     They were promised two things — days for joining, and a trial for
     trying — so the countdown shows what they have AND the button stays,
     because the days stack rather than replace. Hiding the button here
     would quietly cancel half of what the invite offered. */
  if (running && perks.trial.used) {
    return (
      <div className={`panel border-accent/40 bg-accent-soft/30 p-5 ${className}`}>
        <Spec className="text-accent">Founder+ trial</Spec>
        <p className="mt-1.5 font-display text-2xl">
          {left} {left === 1 ? "day" : "days"} left
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Everything Founder+ has: top placement, the gold trim on your
          stand, the tag on your card. When it runs out you go back to free.
          No card was taken and nothing renews, so there is nothing to
          cancel.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Invite someone and you both get {perks.referral.daysPer} more days.
        </p>
      </div>
    );
  }

  if (perks.trial.used) {
    return (
      <div className={`panel p-5 ${className}`}>
        <Spec className="text-muted">Founder+ trial</Spec>
        <p className="mt-1.5 font-display text-lg">Your trial has finished.</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          You are back on the free floor, which is still the whole floor.
          Inviting someone gives you another {perks.referral.daysPer} days of
          Founder+, and gives them the same.
        </p>
      </div>
    );
  }

  return (
    <div className={`panel border-accent/40 p-5 ${className}`}>
      <Spec className="text-accent">Founder+ trial</Spec>
      <p className="mt-1.5 font-display text-lg">
        Try Founder+ free for {perks.trial.days} days.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        No card, nothing to cancel. It ends on its own after{" "}
        {perks.trial.days} days and you are back on the free floor.
      </p>
      {running && (
        <p className="mt-2 text-sm leading-relaxed text-muted">
          You already have {left} {left === 1 ? "day" : "days"} from an
          invite. These {perks.trial.days} go on the end of them.
        </p>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          setErr("");
          void startTrial().then((e) => {
            setBusy(false);
            if (e) setErr(e);
          });
        }}
        className="btn-press mt-4 min-h-[44px] rounded-md bg-accent-strong px-5 py-2.5 text-sm font-medium text-white shadow-card hover:bg-accent-strong/90 disabled:opacity-60"
      >
        {busy ? "Starting…" : `Start my ${perks.trial.days} days`}
      </button>
      {err && <p className="mt-2 text-sm text-accent">{err}</p>}
    </div>
  );
}
