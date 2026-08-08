"use client";

/**
 * Your invite link, and what it has earned.
 *
 * Both sides get days, which is the only version of this that is worth
 * sending: a link that rewards only the sender is a link people can tell
 * you are being paid to send, and it gets ignored.
 *
 * The cap is shown rather than hidden. It is the honest limit and it is
 * also the anti-abuse mechanism (see the note above the trial constants in
 * server/index.mjs), so a member who hits it should find out from the
 * card rather than from an invite that silently stops working.
 *
 * Two people get a different card, for the same reason: the server pays
 * them nothing, so the card must not promise them anything. A founding
 * member or a paying subscriber has no window to extend — grantTrialDays
 * refuses to write an expiry over a permanent entitlement, which is
 * correct — and a member at the cap has run out of credit. Both can still
 * hand the link around, and the joiner still gets their days, so the card
 * stays; only the half about what THEY earn goes away.
 */

import { useState } from "react";
import { useAppState } from "@/lib/store";
import { usePerks, permanentMember, referralLink } from "@/lib/perks";
import Spec from "@/components/Spec";

export default function ReferralCard({ className = "" }: { className?: string }) {
  const [state] = useAppState();
  const perks = usePerks();
  const [copied, setCopied] = useState(false);

  if (!perks) return null;

  const link = referralLink(perks.referral.code);
  const { joined, daysEarned, daysPer, daysCap } = perks.referral;
  const permanent = permanentMember(state.sub, perks);
  const capped = !permanent && daysEarned >= daysCap;
  const earns = !permanent && !capped;

  return (
    <div className={`panel p-5 ${className}`}>
      <Spec className="text-gold-deep">Invite a founder</Spec>
      <p className="mt-1.5 font-display text-lg">
        {earns
          ? `You both get ${daysPer} days of Founder+.`
          : `They get ${daysPer} days of Founder+.`}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {permanent
          ? `Anyone who makes an account on your link starts with ${daysPer} days of Founder+. Your own membership does not run out, so there is nothing on your side to extend — the days all go to them.`
          : earns
            ? `Anyone who makes an account on your link starts with ${daysPer} days, and you get ${daysPer} more on top of whatever you have left.`
            : `Anyone who makes an account on your link still starts with ${daysPer} days. You have earned the maximum, so no more are added on your side.`}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          readOnly
          value={link}
          aria-label="Your invite link"
          onFocus={(e) => e.currentTarget.select()}
          className="min-w-0 flex-1 rounded-md border border-line px-3 py-2.5 font-mono text-sm"
        />
        <button
          type="button"
          onClick={() => {
            // clipboard can be blocked (http, permissions, older Safari) —
            // the field is selectable and readable either way, so a failure
            // here is a missing convenience, not a dead end
            void navigator.clipboard
              ?.writeText(link)
              .then(() => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 2000);
              })
              .catch(() => setCopied(false));
          }}
          className="btn-press min-h-[44px] shrink-0 rounded-md border border-ink px-4 py-2.5 text-sm font-medium hover:bg-paper"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-3 border-t border-line pt-4">
        <div>
          <dt className="micro text-muted">Joined on your link</dt>
          <dd className="mt-0.5 font-display text-2xl tabular-nums">{joined}</dd>
        </div>
        {/* A permanent member is never credited, so a counter frozen at
            0 / 63 under their name would read as a broken feature rather
            than as a rule. The invite count still means something. */}
        {!permanent && (
          <div>
            <dt className="micro text-muted">Days earned</dt>
            <dd className="mt-0.5 font-display text-2xl tabular-nums">
              {daysEarned}
              <span className="ml-1 text-base text-muted">/ {daysCap}</span>
            </dd>
          </div>
        )}
      </dl>

      {capped && (
        <p className="mt-3 text-sm leading-relaxed text-muted">
          You have earned the maximum {daysCap} days. Invites still count,
          they just stop adding time.
        </p>
      )}
    </div>
  );
}
