"use client";

/**
 * The full-screen moment after a membership payment lands: rotating prize
 * rays, a tier medal that drops in on a spring and keeps breathing, a foil
 * sheen sweeping the headline, sparks twinkling around the card, and the
 * content rising in a stagger. Confetti fires from the page behind it.
 * Every animation is CSS (globals.css "MEMBERSHIP CEREMONY" block) and
 * switches off under prefers-reduced-motion.
 */

import type { SubTier } from "@/lib/types";
import { TIER_LABEL } from "@/components/TierTag";

/** Spark positions around the card — tuned by eye, not math. */
const SPARKS: { top: string; left: string; size: string; delay: string }[] = [
  { top: "8%", left: "12%", size: "text-lg", delay: "0ms" },
  { top: "16%", left: "84%", size: "text-sm", delay: "500ms" },
  { top: "38%", left: "5%", size: "text-xs", delay: "900ms" },
  { top: "34%", left: "92%", size: "text-base", delay: "250ms" },
  { top: "72%", left: "8%", size: "text-sm", delay: "1200ms" },
  { top: "80%", left: "88%", size: "text-lg", delay: "700ms" },
];

export default function MembershipCeremony({
  tier,
  blurb,
  onClose,
}: {
  tier: Exclude<SubTier, "free">;
  blurb: string;
  onClose: () => void;
}) {
  const founder = tier === "founder";
  return (
    <div
      className="anim-fade fixed inset-0 z-[70] flex items-center justify-center bg-ink/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Membership activated"
      onClick={onClose}
    >
      <div
        className={`anim-pop relative w-full max-w-sm overflow-hidden rounded-2xl border-2 bg-panel px-8 pb-8 pt-12 text-center shadow-float ${
          founder ? "border-gold" : "border-accent"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* prize rays, slowly turning behind the medal */}
        <div
          aria-hidden="true"
          className="ceremony-rays pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2"
          style={
            founder
              ? undefined
              : ({ "--ray-color": "rgba(217, 72, 15, 0.28)" } as React.CSSProperties)
          }
        />

        {/* sparks twinkling around the edges */}
        {SPARKS.map((s, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={`twinkle pointer-events-none absolute ${s.size} ${
              founder ? "text-gold" : "text-accent/70"
            }`}
            style={{ top: s.top, left: s.left, animationDelay: s.delay }}
          >
            ✦
          </span>
        ))}

        <div className="stagger-children relative">
          {/* the medal: drops in with a spring, then breathes */}
          <div
            className={`seal-drop mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 text-3xl text-white shadow-float ${
              founder
                ? "border-gold-deep bg-gradient-to-b from-[#E8C766] to-gold-deep"
                : "border-accent-strong bg-gradient-to-b from-[#F0906B] to-accent-strong"
            }`}
          >
            <span aria-hidden="true">✦</span>
          </div>
          <p className="micro mt-4 text-muted">Membership activated</p>
          <h2
            className={`ceremony-title mt-1 font-display text-3xl ${
              founder ? "ceremony-title-founder" : "ceremony-title-pro"
            }`}
          >
            You&rsquo;re {TIER_LABEL[tier]} now
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {blurb} Your tier now shows at the top of every page — and on the
            floor chrome, so the halls know who showed up.
          </p>
          <button
            type="button"
            onClick={onClose}
            className={`btn-press mt-6 w-full rounded-md px-4 py-2.5 text-sm font-medium text-white shadow-card ${
              founder
                ? "bg-gold-deep hover:bg-gold-deep/90"
                : "bg-accent-strong hover:bg-accent-strong/90"
            }`}
          >
            Back to the floor
          </button>
        </div>
      </div>
    </div>
  );
}
