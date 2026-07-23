"use client";

/**
 * The "you are what you bought" sign: a small pill showing the viewer's own
 * membership tier. Renders nothing on the free tier — the absence IS the
 * upsell. Gold for Founder+, accent for Pro; both link to the membership
 * section. Client-only (tier lives in synced local state).
 */

import Link from "next/link";
import { useAppState } from "@/lib/store";
import { TIER_LABEL } from "@/components/TierTag";

export default function MemberBadge({ glass = false }: { glass?: boolean }) {
  const [state] = useAppState();
  const founding = state.badges.includes("founding");
  if (state.sub === "free" && !founding) return null;
  // Founding subsumes Founder+ — the rarer status is the one worth wearing.
  const label = founding ? "Founding member" : TIER_LABEL[state.sub];
  const goldTone = founding || state.sub === "founder";
  return (
    <Link
      href="/profile#membership"
      title={`Your membership: ${label}`}
      className={`micro flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2.5 ${
        glass ? "bg-panel/85 py-2 shadow-float backdrop-blur-md" : "py-1"
      } ${
        goldTone
          ? "border-gold/70 bg-gold/10 text-gold-deep hover:border-gold"
          : "border-accent/50 bg-accent-soft/60 text-accent hover:border-accent"
      }`}
    >
      <span aria-hidden="true">✦</span>
      {label}
    </Link>
  );
}
