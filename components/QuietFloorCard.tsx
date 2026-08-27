"use client";

/**
 * The hall between shows.
 *
 * A visitor who walks into a silent room with nothing but OPEN SPOT signs
 * concludes the place is dead and leaves — that single moment costs more
 * users than any other screen. The reframe is the trade-show truth: a hall
 * between shows isn't failing, it's in BUILD-UP — the crew hours before
 * the doors open. Say when the next show is, never imply anyone is here
 * who isn't, and hand over the three things worth doing meanwhile:
 * put a stand up (the floor empties when they leave, but the stand's own
 * page does not), come back for the weekly hour when the floor is busy, or
 * read who else is here.
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
    return {
      live: e.live,
      name: e.special ? e.name : "Open Doors",
      label: e.live ? "live now" : fmtCountdown(e.startMs - now),
    };
  });

  return (
    <aside
      aria-label="The hall between shows"
      className="glass anim-in pointer-events-auto w-[330px] max-w-[calc(100vw-24px)] border-l-2 border-l-accent p-4 shadow-float"
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="micro text-accent">BUILD-UP</span>
        <button
          type="button"
          onClick={onClose}
          className="micro min-h-[24px] text-muted hover:text-ink"
        >
          dismiss
        </button>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">
        {ev.live
          ? `You have ${floorName} to yourself even though the doors are open — early is a good time to arrive.`
          : `You have ${floorName} to yourself. The next show is ${ev.name}, in ${ev.label} — until then the hall is in build-up, which is the right time to get your stand in order.`}
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {!hasStand && (
          <Link
            href="/profile#booth"
            className="btn-press flex min-h-[44px] items-center justify-center rounded-md bg-accent-strong px-3 py-2.5 text-center text-sm font-medium text-white hover:bg-accent-strong/90"
          >
            Put your stand up
          </Link>
        )}
        <Link
          href="/lobby"
          className="btn-press flex min-h-[44px] items-center justify-center rounded-md border border-line px-3 py-2.5 text-center text-sm text-muted hover:border-ink hover:text-ink"
        >
          {ev.live ? `${ev.name} is live — join it` : `${ev.name} in ${ev.label} — get a reminder`}
        </Link>
        <Link
          href="/directory"
          className="btn-press flex min-h-[44px] items-center justify-center rounded-md border border-line px-3 py-2.5 text-center text-sm text-muted hover:border-ink hover:text-ink"
        >
          See who else is on the floors
        </Link>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted">
        A stand comes off the floor when you leave, but it keeps a page of its
        own, so people can find you when you&rsquo;re not here.
      </p>
    </aside>
  );
}
