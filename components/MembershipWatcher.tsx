"use client";

/**
 * Global celebrant: mounted once in the layout, it listens for entitlement
 * upgrades landing on the signed-in account (a Stripe purchase completing,
 * an operator grant) and plays the full membership ceremony wherever the
 * recipient happens to be — lobby, floor, profile. The store decides WHEN
 * to celebrate (once per grant per device, fresh grants only); this
 * component only renders the moment.
 *
 * It also carries the weekly podium notice, for the same reason: an award
 * is granted by the server at a rollover nobody is watching, and it lands
 * on whatever screen you happen to open next. Deliberately a small card
 * rather than the full ceremony — the membership one is the loudest thing
 * on the site and finishing third in a week is not that.
 */

import { useEffect, useState } from "react";
import { getAuth } from "@/lib/auth";
import { onAward, onCelebration, syncNow, type CelebrationEvent } from "@/lib/store";
import type { PodiumAward } from "@/lib/types";
import ConfettiBurst from "@/components/ConfettiBurst";
import MembershipCeremony from "@/components/MembershipCeremony";

// Describes what the tier does today. While only the Main Hall is open
// (FOCUS MODE in lib/data/floors.ts) these must not promise extra floors.
const BLURB: Record<"pro" | "founder", string> = {
  pro: "Your stand gets found first now — priority placement wherever it's listed.",
  founder: "Top of every list, gold trim on your stand — live from now on.",
};

export default function MembershipWatcher() {
  const [event, setEvent] = useState<CelebrationEvent | null>(null);
  const [award, setAward] = useState<PodiumAward | null>(null);
  const [burst, setBurst] = useState(0);

  useEffect(() => onCelebration(setEvent), []);
  useEffect(() => onAward(setAward), []);

  // Heartbeat for signed-in accounts: pull the account state every 45s and
  // whenever the tab regains focus, so grants, ticket top-ups and purchases
  // appear live — no refresh needed. Cheap: one GET, and the follow-up push
  // is hash-guarded to a no-op when nothing changed.
  useEffect(() => {
    const tick = () => {
      if (getAuth()) syncNow();
    };
    const iv = window.setInterval(tick, 45_000);
    const onFocus = () => tick();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.clearInterval(iv);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, []);

  const podium = award && (
    <div
      role="status"
      className="panel fixed bottom-4 left-1/2 z-[80] w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 px-4 py-3 shadow-float"
    >
      <div className="flex items-start gap-3">
        <span className="font-display text-2xl leading-none text-gold-deep">
          #{award.rank}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug">
            You finished {award.rank === 1 ? "top" : `${award.rank}${award.rank === 2 ? "nd" : "rd"}`} of
            the {award.board} board for {award.week}.
          </p>
          <p className="mt-1 text-xs leading-snug text-muted">
            The title &ldquo;{award.title}&rdquo; is yours — pick it on your
            profile.{award.tickets ? ` ${award.tickets} tickets went in your pocket.` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAward(null)}
          className="shrink-0 rounded-md border border-line px-2 py-1 text-xs text-muted transition-colors hover:bg-paper hover:text-ink"
        >
          Close
        </button>
      </div>
    </div>
  );

  if (!event)
    return (
      <>
        <ConfettiBurst burstId={burst} />
        {podium}
      </>
    );
  return (
    <>
      <ConfettiBurst burstId={burst} />
      {podium}
      <MembershipCeremony
        tier={event.tier}
        bigText={event.founding ? "Founding member" : undefined}
        title={event.founding ? "You’re a Founding member now" : undefined}
        blurb={BLURB[event.tier]}
        onClose={() => setEvent(null)}
        onBurst={() => setBurst(Date.now())}
      />
    </>
  );
}
