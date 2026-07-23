"use client";

/**
 * The moment after a membership payment lands, in two acts.
 *
 * ACT 1 — the cinematic (full screen, ~4.5s, click to skip):
 *   the room goes dark, gold threads race in from the edges of the screen
 *   and converge on the center, the four-pointed star draws itself out of
 *   them, ignites with a shockwave and a breathing glow, and the tier name
 *   lands letter-by-letter from wide tracking.
 *
 * ACT 2 — the card: the existing ceremony panel (medal, sheen headline,
 * sparks) with the CTA back to the floor. Confetti fires at the handoff.
 *
 * All motion is CSS (globals.css "CEREMONY INTRO" + "MEMBERSHIP CEREMONY"
 * blocks). Under prefers-reduced-motion the intro is skipped entirely.
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { SubTier } from "@/lib/types";
import { TIER_LABEL } from "@/components/TierTag";

/* The ✦ star: four points with concave sides (quadratic curves pulled
   toward the center). Lives in a -130..130 box. */
const STAR_PATH =
  "M 0 -110 Q 24 -24 110 0 Q 24 24 0 110 Q -24 24 -110 0 Q -24 -24 0 -110 Z";

/* Threads race from the viewport perimeter toward the center, stopping
   where the star will form. Coordinates in a 0-100 box stretched to the
   real viewport (non-scaling strokes keep them hairline-thin). */
const EDGE_POINTS: [number, number][] = [
  [0, 0], [25, 0], [50, 0], [75, 0], [100, 0],
  [100, 30], [100, 70],
  [100, 100], [75, 100], [50, 100], [25, 100], [0, 100],
  [0, 70], [0, 30],
];
const STOP = 0.24; // how far from center the threads stop (star radius)

/** Spark positions around the card — tuned by eye, not math. */
const SPARKS: { top: string; left: string; size: string; delay: string }[] = [
  { top: "8%", left: "12%", size: "text-lg", delay: "0ms" },
  { top: "16%", left: "84%", size: "text-sm", delay: "500ms" },
  { top: "38%", left: "5%", size: "text-xs", delay: "900ms" },
  { top: "34%", left: "92%", size: "text-base", delay: "250ms" },
  { top: "72%", left: "8%", size: "text-sm", delay: "1200ms" },
  { top: "80%", left: "88%", size: "text-lg", delay: "700ms" },
];

/* Twinkles scattered over the dark intro once the star is lit. */
const INTRO_SPARKS: { top: string; left: string; size: string; delay: string }[] = [
  { top: "22%", left: "22%", size: "text-xl", delay: "2600ms" },
  { top: "18%", left: "76%", size: "text-sm", delay: "3100ms" },
  { top: "64%", left: "14%", size: "text-base", delay: "2900ms" },
  { top: "70%", left: "84%", size: "text-lg", delay: "3300ms" },
  { top: "40%", left: "90%", size: "text-xs", delay: "2750ms" },
  { top: "46%", left: "8%", size: "text-sm", delay: "3500ms" },
];

const INTRO_MS = 4600; // when the intro starts handing off
const EXIT_MS = 480; // matches .cine-exit

export default function MembershipCeremony({
  tier,
  blurb,
  onClose,
  onBurst,
}: {
  tier: Exclude<SubTier, "free">;
  blurb: string;
  onClose: () => void;
  onBurst?: () => void;
}) {
  const founder = tier === "founder";
  const [stage, setStage] = useState<"intro" | "exit" | "card">("intro");
  const handed = useRef(false);

  const handOff = () => {
    if (handed.current) return;
    handed.current = true;
    setStage("card");
    onBurst?.();
    window.setTimeout(() => onBurst?.(), 1100); // encore volley
  };

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      handOff();
      return;
    }
    const t1 = window.setTimeout(() => {
      if (!handed.current) setStage("exit");
    }, INTRO_MS);
    const t2 = window.setTimeout(handOff, INTRO_MS + EXIT_MS);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bright = founder ? "#E8C766" : "#F0906B";
  const deep = founder ? "#B08D2E" : "#D9480F";

  // Threads are drawn in real pixel space so dash-based line drawing stays
  // exact on every viewport (a stretched 0-100 viewBox distorts dash math).
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    setDims({ w: window.innerWidth, h: window.innerHeight });
  }, []);

  if (stage !== "card") {
    const intro = (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Membership activated"
        onClick={handOff}
        className={`fixed inset-0 z-[70] cursor-pointer overflow-hidden bg-[#1B1915] ${
          stage === "exit" ? "cine-exit" : "anim-fade"
        }`}
        style={
          {
            "--cine": bright,
            "--cine-deep": deep,
            "--cine-glow": founder
              ? "rgba(232, 199, 102, 0.45)"
              : "rgba(240, 144, 107, 0.45)",
          } as React.CSSProperties
        }
      >
        {/* faint rays turning behind everything */}
        <div
          aria-hidden="true"
          className="ceremony-rays absolute left-1/2 top-[42%] h-[95vmin] w-[95vmin] -translate-x-1/2 -translate-y-1/2"
          style={{ "--ray-color": founder ? "rgba(232,199,102,0.10)" : "rgba(240,144,107,0.10)" } as React.CSSProperties}
        />

        {/* ACT 1a: threads race in from the screen edges */}
        {dims && (
          <svg
            aria-hidden="true"
            className="absolute inset-0 h-full w-full"
            viewBox={`0 0 ${dims.w} ${dims.h}`}
          >
            {EDGE_POINTS.map(([px, py], i) => {
              const sx = (px / 100) * dims.w;
              const sy = (py / 100) * dims.h;
              const cx = dims.w / 2;
              const cy = dims.h * 0.42;
              const ex = cx + (sx - cx) * STOP;
              const ey = cy + (sy - cy) * STOP;
              return (
                <line
                  key={i}
                  x1={sx}
                  y1={sy}
                  x2={ex}
                  y2={ey}
                  pathLength={1}
                  className="cine-line"
                  style={{
                    stroke: "var(--cine)",
                    strokeWidth: 1.5,
                    strokeLinecap: "round",
                    opacity: 0.75,
                    animationDelay: `${140 + i * 55}ms, ${1450 + i * 20}ms`,
                  }}
                />
              );
            })}
          </svg>
        )}

        {/* ACT 1b: the star draws itself, fills, and ignites */}
        <svg
          aria-hidden="true"
          className="cine-glow absolute left-1/2 top-[42%] h-[58vmin] w-[58vmin] -translate-x-1/2 -translate-y-1/2"
          viewBox="-130 -130 260 260"
        >
          <defs>
            <linearGradient id="cine-star-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={bright} />
              <stop offset="100%" stopColor={deep} />
            </linearGradient>
          </defs>
          <g className="cine-star-group">
            <path
              d={STAR_PATH}
              pathLength={1}
              className="cine-star-outline"
              style={{ stroke: "var(--cine)", strokeWidth: 2.5, fill: "none" }}
            />
            <path d={STAR_PATH} className="cine-star-fill" fill="url(#cine-star-grad)" />
          </g>
        </svg>

        {/* ignition shockwave */}
        <div
          aria-hidden="true"
          className="cine-ring absolute left-1/2 top-[42%] h-[74vmin] w-[74vmin] rounded-full border-2"
          style={{ borderColor: "var(--cine)" }}
        />

        {/* twinkles across the dark once the star is lit */}
        {INTRO_SPARKS.map((s, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={`twinkle pointer-events-none absolute ${s.size}`}
            style={{ top: s.top, left: s.left, color: "var(--cine)", opacity: 0.8, animationDelay: s.delay }}
          >
            ✦
          </span>
        ))}

        {/* ACT 1c: the announcement */}
        <div className="absolute inset-x-0 top-[72%] text-center">
          <p
            className="cine-fade-up micro text-[#F2EFE7]/60"
            style={{ animationDelay: "2500ms" }}
          >
            Membership activated
          </p>
          <p
            className="cine-track-in mt-2 font-display text-[11vmin] leading-none sm:text-7xl"
            style={{ color: "var(--cine)" }}
          >
            {TIER_LABEL[tier]}
          </p>
          <p
            className="cine-fade-up micro mt-6 text-[#F2EFE7]/35"
            style={{ animationDelay: "3600ms" }}
          >
            click anywhere to continue
          </p>
        </div>
      </div>
    );
    return createPortal(intro, document.body);
  }

  const card = (
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
  return createPortal(card, document.body);
}
