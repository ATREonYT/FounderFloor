"use client";

/**
 * What to do when the hall is empty.
 *
 * A visitor who walks into a silent room with nothing but OPEN SPOT signs
 * concludes the place is dead and leaves — that single moment costs more
 * users than any other screen. So when someone is genuinely alone, say so
 * plainly and hand them the three things that are still worth doing:
 * put a stand up (it stays up while they're away), come back for the
 * weekly hour when the floor is busy, or read who else is here.
 *
 * Dismissible, and it never appears during the tutorial or on a floor that
 * already has stands on it — it exists for the dead-room case only.
 */

import { useState } from "react";
import Link from "next/link";
import { nextEvent, fmtCountdown } from "@/lib/data/events";

export default function QuietFloorCard({
  floorName,
  hasStand,
  onClose,
}: {
  floorName: string;
  /** Whether this visitor already has a stand up somewhere. */
  hasStand: boolean;
  onClose: () => void;
}) {
  const [ev] = useState(() => {
    const now = Date.now();
    const e = nextEvent(now);
    return { live: e.live, label: e.live ? "live now" : fmtCountdown(e.startMs - now) };
  });

  return (
    <aside
      aria-label="Nobody else is here"
      className="glass anim-in pointer-events-auto w-[330px] max-w-[calc(100vw-24px)] border-l-2 border-l-accent p-4 shadow-float"
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="micro text-accent">QUIET RIGHT NOW</span>
        <button
          type="button"
          onClick={onClose}
          className="micro min-h-[24px] text-muted hover:text-ink"
        >
          dismiss
        </button>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">
        You&rsquo;re the only one in {floorName} at the moment — it&rsquo;s a
        young floor. Three things still worth doing:
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {!hasStand && (
          <Link
            href="/profile#booth"
            className="btn-press min-h-[44px] rounded-md bg-accent-strong px-3 py-2.5 text-center text-sm font-medium text-white hover:bg-accent-strong/90"
          >
            Put your stand up
          </Link>
        )}
        <Link
          href="/lobby"
          className="btn-press min-h-[44px] rounded-md border border-line px-3 py-2.5 text-center text-sm text-muted hover:border-ink hover:text-ink"
        >
          {ev.live ? "Open Doors is live — join it" : `Open Doors in ${ev.label} — get a reminder`}
        </Link>
        <Link
          href="/directory"
          className="btn-press min-h-[44px] rounded-md border border-line px-3 py-2.5 text-center text-sm text-muted hover:border-ink hover:text-ink"
        >
          See who else is on the floors
        </Link>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted">
        A stand stays up while you&rsquo;re away, so people can find you when
        you&rsquo;re not here.
      </p>
    </aside>
  );
}
