"use client";

/**
 * The opening offer: the first twenty accounts get Founder+ and the
 * founding badge, kept for life, for nothing.
 *
 * It is a real scarcity, not a marketing one — the server counts the seats
 * and stops at twenty (see grantFoundingSeat in server/index.mjs) — so the
 * number here is read from the server on every visit rather than written
 * into the copy. If the floor server is unreachable the card does not
 * render at all: better to say nothing than to advertise a count nobody
 * has checked.
 *
 * Hidden once the seats are gone, and hidden from anyone signed in. If
 * seats remain and you have an account, you are already holding one: the
 * server backfills the oldest accounts first, so a signed-in visitor
 * without a seat means the seats are gone, and there is nothing here to
 * offer them. A dead offer left on a page is how a site starts looking
 * abandoned.
 *
 * There is no ceremony to fire here either. The seat lands as a normal
 * entitlement, so MembershipWatcher picks it up on the next sync and plays
 * the same celebration a purchase would.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppState } from "@/lib/store";
import { getAuth } from "@/lib/auth";
import { useFoundingSeats } from "@/components/usePresence";
import Spec from "@/components/Spec";

export default function FoundingSeatsCard() {
  const [state] = useAppState();
  const seats = useFoundingSeats();
  const [signedIn, setSignedIn] = useState(false);

  // profile.id flips between a guest id and an account id, so it is the
  // cue to re-read auth on sign-in and sign-out.
  useEffect(() => {
    setSignedIn(getAuth() !== null);
  }, [state.profile.id]);

  if (!seats || seats.left <= 0 || signedIn) return null;

  const taken = seats.total - seats.left;

  return (
    <section
      aria-label="Founding membership"
      className="panel mt-6 flex flex-col gap-4 border-gold/60 bg-gold/5 p-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="sm:max-w-lg">
        <Spec className="text-gold-deep">
          {seats.left} of {seats.total} founding memberships left
        </Spec>
        <h2 className="mt-1.5 font-display text-lg">
          The first {seats.total} people to make an account keep Founder+ for
          life.
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Every floor, the gold trim on your stand, and the founding badge
          next to your name. No card, no trial, no expiry. It is the thanks
          for turning up while the hall is still half empty.
        </p>
        {/* An honest progress bar, not a fake-urgency one: it is empty on
            day one and that is fine, because the offer is the seat, not the
            crowd. */}
        <div
          className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-line"
          role="img"
          aria-label={`${taken} of ${seats.total} taken`}
        >
          <div
            className="h-full rounded-full bg-gold transition-[width] duration-500"
            style={{ width: `${Math.round((taken / seats.total) * 100)}%` }}
          />
        </div>
      </div>
      <Link
        href="/profile#account"
        className="btn-press min-h-[44px] shrink-0 self-start rounded-md bg-ink px-5 py-2.5 text-center text-sm font-medium text-paper hover:bg-ink/90 sm:self-auto"
      >
        Claim a seat
      </Link>
    </section>
  );
}
