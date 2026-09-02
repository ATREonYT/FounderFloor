"use client";

/**
 * Tutorial graduation, in two acts — the membership ceremony's sibling in
 * the opposite register: bright paper instead of night, a certificate seal
 * instead of the star.
 *
 * ACT 1 — the seal (~3.4s, click to skip): the screen goes to paper, gold
 * rays turn faintly, an ink ring inscribes itself, a gold ring follows
 * inside it, the rosette stamps into the middle with ticks flaring around
 * it, and "Tutorial graduate" letter-tracks in over a drawn rule.
 *
 * ACT 2 — the card: the graduate medal drops in, the four learned moves
 * stamp in as checks, and the next step depends on who's standing there:
 * a guest is asked to create a free account (keeps the badge and booth)
 * or continue as a guest; a signed-in player is pointed at their booth
 * and the real floors.
 *
 * All motion is CSS (globals.css "GRADUATION" block reusing the ceremony
 * keyframes). Under prefers-reduced-motion act 1 is skipped entirely.
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { getAuth } from "@/lib/auth";

/* Same four-pointed rosette as the membership star, sized for the seal. */
const STAR_PATH =
  "M 0 -110 Q 24 -24 110 0 Q 24 24 0 110 Q -24 24 -110 0 Q -24 -24 0 -110 Z";

/* Stamp ticks radiating between the two rings. */
const TICKS = Array.from({ length: 16 }, (_, i) => (i * 360) / 16);

const SPARKS: { top: string; left: string; size: string; delay: string }[] = [
  { top: "8%", left: "12%", size: "text-lg", delay: "0ms" },
  { top: "16%", left: "84%", size: "text-sm", delay: "500ms" },
  { top: "38%", left: "5%", size: "text-xs", delay: "900ms" },
  { top: "34%", left: "92%", size: "text-base", delay: "250ms" },
  { top: "72%", left: "8%", size: "text-sm", delay: "1200ms" },
  { top: "80%", left: "88%", size: "text-lg", delay: "700ms" },
];

const SKILLS = ["Walk", "Talk", "React", "Connect"];

const INTRO_MS = 3400; // when the intro starts handing off
const EXIT_MS = 480; // matches .cine-exit

export default function GraduationCeremony({
  onClose,
  onBurst,
}: {
  onClose: () => void;
  onBurst?: () => void;
}) {
  const [stage, setStage] = useState<"intro" | "exit" | "card">("intro");
  // Sampled once at mount: whether an account is already signed in decides
  // which "what now" the card asks.
  const [signedIn] = useState(() => !!getAuth());
  const handed = useRef(false);

  const handOff = () => {
    if (handed.current) return;
    handed.current = true;
    setStage("card");
    onBurst?.();
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

  if (stage !== "card") {
    const intro = (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Tutorial complete"
        onClick={handOff}
        className={`fixed inset-0 z-[70] cursor-pointer overflow-hidden bg-paper ${
          stage === "exit" ? "cine-exit" : "anim-fade"
        }`}
      >
        {/* faint gold rays turning behind the seal — parent centers, child
            only rotates (mixing both transforms makes the spin drift) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[40%] h-[95vmin] w-[95vmin] -translate-x-1/2 -translate-y-1/2"
        >
          <div
            className="ceremony-rays absolute inset-0"
            style={{ "--ray-color": "rgba(176, 141, 46, 0.12)" } as React.CSSProperties}
          />
        </div>

        {/* the seal: ink ring inscribes, gold ring follows, rosette stamps.
            The parent owns the centering translate; the breathing child only
            animates translateY — keyframes replace the whole transform, so
            mixing them on one element throws the seal off-center. */}
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-[40%] h-[52vmin] w-[52vmin] -translate-x-1/2 -translate-y-1/2"
        >
          <div className="grad-breathe absolute inset-0">
            <svg className="absolute inset-0 h-full w-full" viewBox="-130 -130 260 260">
            <defs>
              <linearGradient id="grad-seal-gold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E8C766" />
                <stop offset="100%" stopColor="var(--gold)" />
              </linearGradient>
            </defs>
            <circle
              r={118}
              pathLength={1}
              className="grad-ring"
              style={{ stroke: "var(--ink)", strokeWidth: 2.5, fill: "none" }}
            />
            <circle
              r={100}
              pathLength={1}
              className="grad-ring-inner"
              style={{ stroke: "var(--gold)", strokeWidth: 1.5, fill: "none", opacity: 0.85 }}
            />
            <g className="grad-seal-fill">
              {TICKS.map((deg) => (
                <line
                  key={deg}
                  x1={0}
                  y1={-104}
                  x2={0}
                  y2={-112}
                  transform={`rotate(${deg})`}
                  stroke="var(--gold)"
                  strokeWidth={2}
                  strokeLinecap="round"
                  opacity={0.8}
                />
              ))}
              <path
                d={STAR_PATH}
                transform="scale(0.62)"
                fill="url(#grad-seal-gold)"
                stroke="#7A611F"
                strokeWidth={2}
              />
            </g>
          </svg>
          </div>
        </div>

        {/* the announcement */}
        <div className="absolute inset-x-0 top-[70%] text-center">
          <p className="cine-fade-up micro text-muted" style={{ animationDelay: "1250ms" }}>
            The floor certifies
          </p>
          <p className="grad-title mt-2 font-display text-[9vmin] leading-none text-ink sm:text-6xl">
            Tutorial graduate
          </p>
          <div
            className="grad-rule mx-auto mt-4 h-px w-40 sm:w-56"
            style={{ background: "var(--gold)" }}
          />
          <p className="cine-fade-up micro mt-5 text-muted/70" style={{ animationDelay: "2700ms" }}>
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
      aria-label="Tutorial complete"
      onClick={onClose}
    >
      <div
        className="anim-pop relative w-full max-w-sm overflow-hidden rounded-2xl border-2 border-gold bg-panel px-8 pb-8 pt-12 text-center shadow-float"
        onClick={(e) => e.stopPropagation()}
      >
        {/* prize rays behind the medal — same parent/child split */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2"
        >
          <div className="ceremony-rays absolute inset-0" />
        </div>

        {SPARKS.map((s, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={`twinkle pointer-events-none absolute text-gold ${s.size}`}
            style={{ top: s.top, left: s.left, animationDelay: s.delay }}
          >
            ✦
          </span>
        ))}

        <div className="relative">
          <div className="seal-drop mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-gold-deep bg-gradient-to-b from-[#E8C766] to-gold-deep text-3xl text-white shadow-float">
            <span aria-hidden="true">✦</span>
          </div>
          <p className="micro mt-4 text-muted">Badge earned</p>
          <h2 className="ceremony-title ceremony-title-founder mt-1 font-display text-3xl">
            Tutorial graduate
          </h2>

          {/* the four moves, receipted */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {SKILLS.map((s) => (
              <span
                key={s}
                className="flex items-center justify-center gap-1.5 rounded-md border border-line bg-paper px-2 py-1.5 text-sm"
              >
                <span aria-hidden="true" className="text-verify">
                  ✓
                </span>
                {s}
              </span>
            ))}
          </div>

          {signedIn ? (
            <>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                The real floors work exactly the same — except everyone out
                there is a real founder.
              </p>
              <div className="mt-5 flex flex-col gap-2">
                <Link
                  href="/profile#booth"
                  className="btn-press rounded-md bg-accent-strong px-4 py-2.5 text-sm font-medium text-white shadow-card hover:bg-accent-strong/90"
                >
                  Set up your own booth
                </Link>
                <Link
                  href="/lobby"
                  className="btn-press rounded-md border border-line px-4 py-2.5 text-sm text-muted hover:border-ink hover:text-ink"
                >
                  Walk the real floors
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                You did all that as a guest. A free account keeps your badge,
                booth and progress on every device — or keep exploring and
                decide later.
              </p>
              <div className="mt-5 flex flex-col gap-2">
                <Link
                  href="/profile#account"
                  className="btn-press rounded-md bg-accent-strong px-4 py-2.5 text-sm font-medium text-white shadow-card hover:bg-accent-strong/90"
                >
                  Create a free account
                </Link>
                {/* "keep exploring and decide later" used to be a link to
                    /lobby, which threw you off the floor — the opposite of
                    continuing. It closes the ceremony and leaves you
                    standing exactly where you were. */}
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-press rounded-md border border-line px-4 py-2.5 text-sm text-muted hover:border-ink hover:text-ink"
                >
                  Continue as guest
                </button>
              </div>
            </>
          )}

          <button
            type="button"
            onClick={onClose}
            className="micro mt-4 text-muted underline hover:text-ink"
          >
            Stay and practice a bit more
          </button>
        </div>
      </div>
    </div>
  );
  return createPortal(card, document.body);
}
