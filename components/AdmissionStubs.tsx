"use client";

/**
 * The admission stubs, with the viewer's own membership marked.
 *
 * A pricing table that doesn't know you're already a customer is one of the
 * cheaper ways a site tells you nobody is home: you buy the thing, come
 * back, and it's still selling it to you. So the stub for the tier you hold
 * says so, its button switches from "Choose" to "Manage", and the others
 * read "Upgrade to" or "Switch to" depending on which way they'd move you.
 * A founding member gets told they're a founding member instead of being
 * invited to become one again.
 *
 * Tier is only trusted for a SIGNED-IN account, the same rule MemberBadge
 * follows: entitlement belongs to the account, and a stale device-local
 * tier (the pre-billing "simulate" button, or whoever used this browser
 * last) must not dress a logged-out visitor as a paying member. Signed out,
 * this renders exactly what it always did.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAuth } from "@/lib/auth";
import { useAppState } from "@/lib/store";
import { FLOORS } from "@/lib/data/floors";
import { TIER_ORDER, type SubTier } from "@/lib/types";
import { TIER_LABEL, TIER_PRICE, TIER_PRICE_ANNUAL } from "@/components/TierTag";
import { FOUNDING_OFFER, TIER_PERKS, TRIAL_DAYS, annualFreeMonths } from "@/lib/pricing";
import Spec from "@/components/Spec";

const PUBLIC_FLOORS = FLOORS.filter((f) => !f.hidden);
const MANY_FLOORS = PUBLIC_FLOORS.length > 1;

export default function AdmissionStubs({
  pricing,
}: {
  pricing: { tier: SubTier; blurb: string }[];
}) {
  const [state] = useAppState();
  const [signedIn, setSignedIn] = useState(false);

  // profile.id flips between a guest id and an account id, so it is the
  // cue to re-read auth on sign-in and sign-out.
  useEffect(() => {
    setSignedIn(getAuth() !== null);
  }, [state.profile.id]);

  const current: SubTier | null = signedIn ? state.sub : null;
  // A founding badge without a paid tier is a stale local leftover, not a
  // membership — the server grants both together.
  const founding = signedIn && state.badges.includes("founding") && state.sub !== "free";

  return (
    <>
      {/* the season pass, or the acknowledgement that you already hold it */}
      <div className="mb-10 border-y-2 border-gold bg-ink px-5 py-4 text-paper sm:px-7 sm:py-5">
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
          <div className="min-w-0">
            <Spec className="text-gold">
              {founding ? "Season pass · yours" : "Season pass · one payment"}
            </Spec>
            <p className="mt-1.5 font-display text-xl">
              {founding ? "You are a founding member" : "Founding Member"}
            </p>
            <p className="mt-1 max-w-md text-sm leading-relaxed text-paper/60">
              {founding
                ? "Founder+ is on your account and the founding badge is on your card for good."
                : `$${FOUNDING_OFFER.price} once: a year of Founder+ and a founding badge on your card that never goes away.`}
            </p>
          </div>
          <Link
            href="/profile#membership"
            className="btn-press shrink-0 rounded-md border border-gold px-4 py-2.5 text-sm text-gold hover:bg-gold hover:text-ink"
          >
            {founding ? "See your membership" : "Become a founding member"}
          </Link>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        {pricing.map(({ tier, blurb }) => {
          const unlocked = PUBLIC_FLOORS.filter((f) => TIER_ORDER[f.tier] <= TIER_ORDER[tier]);
          const [amount, per] = TIER_PRICE[tier].split("/");
          const featured = tier === "pro";
          const held = current === tier;
          // Which way this stub would move someone who already has a tier.
          const step = current ? TIER_ORDER[tier] - TIER_ORDER[current] : 0;

          const cta = held
            ? tier === "free"
              ? "Your account"
              : "Manage membership"
            : current
              ? `${step > 0 ? "Upgrade to" : "Switch to"} ${TIER_LABEL[tier]}`
              : `Choose ${TIER_LABEL[tier]}`;

          const mark = held
            ? founding && tier === "founder"
              ? "Founding member"
              : "Your membership"
            : featured
              ? "Most taken"
              : tier === "founder"
                ? "The gold one"
                : "Always free";

          return (
            // Admission stub: the notches at the tear line are cut out of
            // the card by a mask (see .stub), not drawn on top of it.
            <article
              key={tier}
              // No card-lift here: that adds a box-shadow, and the stub's
              // mask would clip it into a hard-edged smear. A plain rise is
              // the only lift a masked element can wear.
              className={`stub relative flex flex-col border bg-panel transition-transform duration-200 ease-out hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
                held ? "border-verify/60" : featured ? "border-accent/50" : "border-line"
              }`}
            >
              {/* the top edge is drawn on every stub, transparent when the
                  tier is neither held nor featured — otherwise a marked
                  card's header row sits 3px lower than its neighbours */}
              <span
                aria-hidden="true"
                className={`h-[3px] w-full ${
                  held ? "bg-verify" : featured ? "bg-accent-strong" : "bg-transparent"
                }`}
              />
              <div className="flex items-center justify-between border-b border-line px-5 py-2.5">
                <Spec
                  className={
                    held ? "text-verify" : featured ? "text-accent" : "text-muted"
                  }
                >
                  {mark}
                </Spec>
                <Spec className="text-muted">{TIER_LABEL[tier]}</Spec>
              </div>

              <div className="flex flex-1 flex-col px-5 pb-6 pt-5">
                <p className="font-display text-[2.6rem] leading-none tabular-nums">
                  {amount}
                  {per ? <span className="ml-1 font-body text-sm text-muted">/ {per}</span> : null}
                </p>
                {tier !== "free" ? (
                  <Spec className="mt-2 block text-muted">
                    or {TIER_PRICE_ANNUAL[tier]} · {annualFreeMonths(tier)} mo free
                  </Spec>
                ) : (
                  <Spec className="mt-2 block text-muted">No card, no expiry</Spec>
                )}
                {/* The trial is Founder+ only, which is why this line lives
                    on one stub and not on all three. Hidden once the tier is
                    held: telling a member they can try what they already
                    have is the pricing-table-that-forgot-you problem this
                    file exists to avoid. */}
                {tier === "founder" && !held && (
                  <Spec className="mt-1 block text-accent">
                    {TRIAL_DAYS} days free first · no card
                  </Spec>
                )}
                <p className="mt-4 text-sm leading-relaxed text-muted">{blurb}</p>
                <ul className="mt-4 flex-1 space-y-2 border-t border-line pt-4">
                  {/* With one floor open every tier would list the same hall,
                      which is noise. The lines return on their own once a
                      second floor is un-hidden. */}
                  {MANY_FLOORS &&
                    unlocked.map((f) => (
                      <li key={f.id} className="flex items-start gap-2.5 text-sm">
                        <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rotate-45 bg-verify" />
                        {f.name}
                      </li>
                    ))}
                  {TIER_PERKS[tier].map((perk) => (
                    <li key={perk} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted">
                      <span
                        aria-hidden="true"
                        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rotate-45 ${
                          tier === "founder" ? "bg-gold" : "bg-accent/70"
                        }`}
                      />
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>

              {/* the tear-off */}
              <span aria-hidden="true" className="stub-perf dash-x" />
              <div className="flex h-[104px] flex-col justify-center gap-3 px-5">
                <Spec className={held ? "text-verify" : "text-muted"}>
                  {held ? "Admitted" : "Admit one"} · {TIER_LABEL[tier]}
                </Spec>
                <Link
                  href="/profile#membership"
                  className={`btn-press rounded-md px-4 py-2.5 text-center text-sm font-medium ${
                    held
                      ? "border border-verify text-verify hover:bg-verify hover:text-white"
                      : featured
                        ? "bg-accent-strong text-white hover:bg-accent-strong/90"
                        : "border border-ink hover:bg-paper"
                  }`}
                >
                  {cta}
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
