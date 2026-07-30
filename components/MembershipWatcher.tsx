"use client";

/**
 * Global celebrant: mounted once in the layout, it listens for entitlement
 * upgrades landing on the signed-in account (a Stripe purchase completing,
 * an operator grant) and plays the full membership ceremony wherever the
 * recipient happens to be — lobby, floor, profile. The store decides WHEN
 * to celebrate (once per grant per device, fresh grants only); this
 * component only renders the moment.
 */

import { useEffect, useState } from "react";
import { getAuth } from "@/lib/auth";
import { onCelebration, syncNow, type CelebrationEvent } from "@/lib/store";
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
  const [burst, setBurst] = useState(0);

  useEffect(() => onCelebration(setEvent), []);

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

  if (!event) return <ConfettiBurst burstId={burst} />;
  return (
    <>
      <ConfettiBurst burstId={burst} />
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
