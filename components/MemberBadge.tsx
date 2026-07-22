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
  if (state.sub === "free") return null;
  const founder = state.sub === "founder";
  return (
    <Link
      href="/profile#membership"
      title={`Your membership: ${TIER_LABEL[state.sub]}`}
      className={`micro flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2.5 ${
        glass ? "bg-panel/85 py-2 shadow-float backdrop-blur-md" : "py-1"
      } ${
        founder
          ? "border-gold/70 bg-gold/10 text-gold-deep hover:border-gold"
          : "border-accent/50 bg-accent-soft/60 text-accent hover:border-accent"
      }`}
    >
      <span aria-hidden="true">✦</span>
      {TIER_LABEL[state.sub]}
    </Link>
  );
}
