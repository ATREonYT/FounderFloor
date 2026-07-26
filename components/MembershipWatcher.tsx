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
import { onCelebration, type CelebrationEvent } from "@/lib/store";
import ConfettiBurst from "@/components/ConfettiBurst";
import MembershipCeremony from "@/components/MembershipCeremony";

const BLURB: Record<"pro" | "founder", string> = {
  pro: "Everything in Free, plus the quieter floors — open for you now.",
  founder: "Every floor, velvet rope included — open for you now.",
};

export default function MembershipWatcher() {
  const [event, setEvent] = useState<CelebrationEvent | null>(null);
  const [burst, setBurst] = useState(0);

  useEffect(() => onCelebration(setEvent), []);

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
