"use client";

/**
 * What each merchant stall shows, once you have walked up and opened it.
 *
 * All four render inside StallPanel, on the floor, without unmounting the
 * game — so none of them navigate. Where a thing genuinely lives off the
 * floor (a Stripe checkout, say) the control says so before it takes you.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { FLOORS } from "@/lib/data/floors";
import { EARN, dailyTickets, walletBalance } from "@/lib/data/shop";
import { TIER_ORDER } from "@/lib/types";
import type { AppState, BoothInstance, SubTier } from "@/lib/types";
import TicketIcon from "@/components/TicketIcon";

// ---------------------------------------------------------------- tickets

export function TicketStall({ state }: { state: AppState }) {
  const balance = walletBalance(state);
  const streak = Math.max(1, state.visitStreak);
  const rows: { label: string; amount: string; note: string }[] = [
    {
      label: "Turn up",
      amount: `+${dailyTickets(streak)}`,
      note: `once a day — ${EARN.dailyBase} plus ${EARN.dailyPerStreak} a day of streak, capped at ${EARN.dailyCap}`,
    },
    { label: "Make a connection", amount: `+${EARN.connection}`, note: "each new person, once each" },
    { label: "Sign a guestbook", amount: `+${EARN.guestbook}`, note: "each stand, once each" },
    { label: "Earn a badge", amount: `+${EARN.badge}`, note: "whatever earned it" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between rounded-lg border border-line bg-paper px-4 py-3">
        <span className="text-sm text-muted">In your pocket</span>
        <span className="flex items-center gap-2 font-display text-2xl">
          <TicketIcon size={20} />
          {balance}
        </span>
      </div>

      <div>
        <p className="micro mb-2 text-[10px] text-muted">WAYS TO EARN</p>
        <ul className="flex flex-col divide-y divide-line rounded-lg border border-line">
          {rows.map((r) => (
            <li key={r.label} className="flex items-baseline gap-3 px-4 py-2.5">
              <span className="w-12 shrink-0 font-mono text-sm text-verify">{r.amount}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm">{r.label}</span>
                <span className="block text-xs leading-snug text-muted">{r.note}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-sm leading-relaxed text-muted">
        Everything on sale in this hall is bought with tickets you earned by
        turning up and talking to people. Nothing here is pay-to-win, because
        there is nothing to win.
      </p>

      <Link
        href="/profile#tickets"
        className="rounded-md border border-line px-4 py-2.5 text-center text-sm transition-colors hover:bg-paper"
      >
        Ticket packs and the full shop — leaves the floor
      </Link>
    </div>
  );
}

// --------------------------------------------------------------- register

export function RegisterStall({ booths }: { booths: BoothInstance[] }) {
  const [q, setQ] = useState("");
  const taken = useMemo(
    () => booths.filter((b) => b.startup).sort((a, b) => a.spotIndex - b.spotIndex),
    [booths],
  );
  const open = booths.length - taken.length;
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return taken;
    return taken.filter((b) => {
      const s = b.startup;
      if (!s) return false;
      return (
        s.name.toLowerCase().includes(needle) ||
        s.category.toLowerCase().includes(needle) ||
        s.oneLiner.toLowerCase().includes(needle)
      );
    });
  }, [q, taken]);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-muted">
        {taken.length} of {booths.length} stands are up. {open} still open — the
        numbers on the empty boards are the ones you can claim.
      </p>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search the hall"
        className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <ul className="flex flex-col divide-y divide-line rounded-lg border border-line">
        {shown.map((b) => (
          <li key={b.spotIndex} className="flex items-start gap-3 px-3 py-2.5">
            <span className="mt-0.5 w-8 shrink-0 font-mono text-xs text-muted">
              {String(b.spotIndex + 1).padStart(2, "0")}
            </span>
            <span
              aria-hidden="true"
              className="mt-1 h-3 w-3 shrink-0 rounded-sm"
              style={{ background: b.startup?.booth.banner }}
            />
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-sm">{b.startup?.name}</span>
                {b.startup?.demo && (
                  <span className="micro text-[9px] text-muted">SAMPLE</span>
                )}
                {b.ownerId && <span className="micro text-[9px] text-verify">LIVE</span>}
              </span>
              <span className="block text-xs leading-snug text-muted">
                {b.startup?.oneLiner}
              </span>
            </span>
          </li>
        ))}
        {shown.length === 0 && (
          <li className="px-3 py-4 text-sm text-muted">Nothing by that name in here.</li>
        )}
      </ul>
    </div>
  );
}

// ----------------------------------------------------------------- porter

export function PorterStall({
  floorId,
  presence,
  tier,
}: {
  floorId: string;
  presence: Record<string, number>;
  tier: SubTier;
}) {
  const open = FLOORS.filter((f) => !f.hidden);
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-muted">
        Every floor in the building, and who is standing on it right now.
      </p>
      <ul className="flex flex-col gap-2">
        {open.map((f) => {
          const here = presence[f.id] ?? 0;
          const locked = TIER_ORDER[f.tier] > TIER_ORDER[tier];
          const current = f.id === floorId;
          return (
            <li
              key={f.id}
              className={`rounded-lg border px-4 py-3 ${
                current ? "border-accent bg-paper" : "border-line"
              }`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-display text-lg leading-tight">{f.name}</span>
                <span className="micro shrink-0 text-[10px] text-muted">
                  {current ? "YOU ARE HERE" : locked ? f.tier.toUpperCase() : `${here} here`}
                </span>
              </div>
              <p className="mt-1 text-xs leading-snug text-muted">{f.tagline}</p>
              <p className="mt-2 text-xs text-muted">
                {f.boothSpots.length} stands
                {locked && " · needs a paid plan"}
              </p>
            </li>
          );
        })}
      </ul>
      <p className="text-xs leading-relaxed text-muted">
        Only the Main Hall is open while the site is young — ten people spread
        over four rooms is four empty rooms. The others come back as this one
        fills up.
      </p>
    </div>
  );
}

// ------------------------------------------------------------- hall guide

interface GuideRow {
  where: string;
  what: string;
  how: string;
}

const GUIDE: GuideRow[] = [
  {
    where: "The fountain",
    what: "The middle of the hall, and the easiest place to find again.",
    how: "Straight up the avenue from where you came in.",
  },
  {
    where: "The stands",
    what: "Two banks north, two south. Walk up to one and press E to talk to it.",
    how: "Either side of the fountain. Empty ones show a number you can claim.",
  },
  {
    where: "Ticket Booth · Sign Painter",
    what: "Buy with tickets, or repaint your own stand.",
    how: "West avenue — turn left at the fountain and keep going.",
  },
  {
    where: "The Register · Porter's Lodge",
    what: "Every stand listed, and which floors are open.",
    how: "East avenue — turn right at the fountain.",
  },
  {
    where: "The Arcade",
    what: "Three games, one run, tickets for a good score.",
    how: "South-east corner, past the porter.",
  },
];

export function GuideStall() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-muted">
        The hall is a cross: the fountain in the middle, four avenues out of
        it, stands along the top and bottom, traders down the sides.
      </p>
      <ul className="flex flex-col divide-y divide-line rounded-lg border border-line">
        {GUIDE.map((g) => (
          <li key={g.where} className="px-4 py-3">
            <p className="text-sm">{g.where}</p>
            <p className="mt-0.5 text-xs leading-snug text-muted">{g.what}</p>
            <p className="mt-1.5 text-xs leading-snug text-accent">{g.how}</p>
          </li>
        ))}
      </ul>
      <div className="rounded-lg border border-line bg-paper px-4 py-3">
        <p className="micro mb-1.5 text-[10px] text-muted">CONTROLS</p>
        <p className="text-xs leading-relaxed text-muted">
          WASD or the arrow keys to walk, or click where you want to go. E to
          use whatever you are standing at. M for the map. 1–5 to react.
        </p>
      </div>
    </div>
  );
}
