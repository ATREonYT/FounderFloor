"use client";

/**
 * The hall at capacity — which at a real show is GOOD news, and this card
 * says so in the venue's voice instead of apologising.
 *
 * One out, one in: it polls GET /full every few seconds, which both holds
 * the visitor's place in an honest FIFO and tells them where they stand
 * ("you're next", "3 ahead of you" — real positions, no progress bar to
 * fake). When the server says admit, onAdmit() re-runs the join; losing
 * that race just brings the card back with the truth. Meanwhile it offers
 * everything that doesn't need the hall — the annex floor first when the
 * operator has opened one, then the directory and the Open Doors RSVP.
 *
 * WHY NO SPECTATOR MODE: the server half would be cheap (one more
 * broadcast recipient), but the client half is not — the engine assumes
 * a local player everywhere (spawn, camera-follow, input, the interaction
 * ring, the HUD, the tutorial). A read-only hall is real engine surgery,
 * and a half-built one two weeks before a launch is worse than this
 * honest card. If it ever gets built, it replaces the queue as the
 * overflow default.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { httpBase } from "@/lib/net";
import { listedFloors } from "@/lib/data/floors";
import { useAnnex } from "@/components/usePresence";
import EmailCapture from "@/components/EmailCapture";

const POLL_MS = 4000;

export default function FullHallCard({
  floorId,
  floorName,
  visitorId,
  initialCount,
  onAdmit,
}: {
  floorId: string;
  floorName: string;
  visitorId: string;
  /** Occupancy the refusal frame carried, shown until the first poll. */
  initialCount: number;
  onAdmit: () => void;
}) {
  const [inside, setInside] = useState(initialCount);
  const [position, setPosition] = useState<number | null>(null);
  const admitRef = useRef(onAdmit);
  admitRef.current = onAdmit;

  // The annex: if the operator opened another hall, that is the first
  // thing to offer — a walkable floor beats any queue.
  const annex = useAnnex();
  const annexFloor = listedFloors(annex).find((f) => f.hidden && f.id !== floorId);

  useEffect(() => {
    let dead = false;
    const poll = async (): Promise<void> => {
      const base = httpBase();
      if (!base) return;
      try {
        const res = await fetch(
          `${base}/full?floor=${encodeURIComponent(floorId)}&me=${encodeURIComponent(visitorId)}`,
        );
        if (!res.ok) return;
        const d = (await res.json()) as {
          inside?: number;
          position?: number;
          admit?: boolean;
        };
        if (dead) return;
        if (typeof d.inside === "number") setInside(d.inside);
        if (typeof d.position === "number") setPosition(d.position);
        if (d.admit) admitRef.current();
      } catch {
        // Server unreachable — keep the card, keep trying.
      }
    };
    void poll();
    const t = setInterval(() => void poll(), POLL_MS);
    return () => {
      dead = true;
      clearInterval(t);
    };
  }, [floorId, visitorId]);

  const place =
    position === null
      ? "Holding your place in line…"
      : position === 0
        ? "You're next — this card walks you in the moment a spot frees up."
        : position === 1
          ? "One person ahead of you. One out, one in — no refreshing needed."
          : `${position} people ahead of you. One out, one in — no refreshing needed.`;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-paper p-4">
      <div className="panel w-full max-w-md p-6">
        <p className="micro text-muted">{floorName.toUpperCase()} · AT CAPACITY</p>
        <h1 className="mt-2 font-display text-3xl leading-tight">
          The hall is at capacity — {inside} people inside.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          That is the building working: everyone shows up at once on purpose.
          {" "}{place}
        </p>

        <div className="mt-5 flex flex-col gap-2">
          {annexFloor && (
            <Link
              href={`/floor/${annexFloor.id}`}
              className="btn-press flex min-h-[44px] items-center justify-center rounded-md bg-accent-strong px-4 text-sm font-medium text-white hover:bg-accent-strong/90"
            >
              {annexFloor.name} is open — walk in there instead →
            </Link>
          )}
          <Link
            href="/directory"
            className="btn-press flex min-h-[44px] items-center justify-center rounded-md border border-ink px-4 text-sm hover:bg-panel"
          >
            Browse every stand in the directory
          </Link>
          <Link
            href="/lobby"
            className="btn-press flex min-h-[44px] items-center justify-center rounded-md border border-line px-4 text-sm text-muted hover:border-ink hover:text-ink"
          >
            Back to the lobby
          </Link>
        </div>

        <div className="mt-5 border-t border-line pt-4">
          <p className="text-xs leading-relaxed text-muted">
            Or come back when it&rsquo;s guaranteed busy:
          </p>
          <EmailCapture variant="rsvp" source="full-hall" className="mt-2" />
        </div>
      </div>
    </div>
  );
}
