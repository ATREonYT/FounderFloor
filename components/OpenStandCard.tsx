"use client";

import Link from "next/link";
import type { SpotTier } from "@/lib/types";
import { SPOT_PRICE } from "@/lib/data/shop";

interface OpenStandCardProps {
  floorName: string;
  /** Whether the local player has a startup to put on the stand. */
  hasStartup: boolean;
  /** Whether they already hold a different stand on this floor (claim moves). */
  claimedElsewhere: boolean;
  /** Whether their one stand currently lives on ANOTHER floor (claim relocates). */
  claimedOtherFloor?: boolean;
  /** This spot's tier — what the position is, and what it costs. */
  tier: SpotTier;
  /** What THIS member pays for the tier (plan discount applied); 0 = free. */
  price: number;
  /** The undiscounted tier price, shown struck when a discount applies. */
  basePrice: number;
  /** Spendable tickets right now. */
  balance: number;
  /** An unexpired hold already covers this tier — claiming charges nothing. */
  holdActive: boolean;
  /** "Sun 6 Sep" — when a hold bought now would run out. */
  holdUntilLabel: string;
  onClaim: () => void;
  /** Given on the floor: open the put-a-stand-up form over the hall, so
   *  claiming this spot does not start by leaving it. */
  onSetUp?: () => void;
  onClose: () => void;
}

/**
 * What each position IS, in plain words — the IPMI model: the tier names
 * the traffic, not an abstract rank. Rendered as a three-row legend so a
 * founder standing at a bronze spot still learns what gold means.
 */
const TIER_MEANING: Record<SpotTier, { label: string; meaning: string }> = {
  gold: {
    label: "Gold",
    meaning: "On the plaza rim or flanking the entrance — in every visitor's path.",
  },
  silver: {
    label: "Silver",
    meaning: "Inline, one step off the main walk.",
  },
  bronze: {
    label: "Bronze",
    meaning: "The outer rows, away from the traffic. Always free.",
  },
};

/** Card shown when interacting with a vacant stand. */
export default function OpenStandCard({
  floorName,
  hasStartup,
  claimedElsewhere,
  claimedOtherFloor = false,
  tier,
  price,
  basePrice,
  balance,
  holdActive,
  holdUntilLabel,
  onClaim,
  onSetUp,
  onClose,
}: OpenStandCardProps) {
  const paid = tier !== "bronze";
  const due = paid && !holdActive ? price : 0;
  const affordable = balance >= due;
  const moveVerb = claimedElsewhere || claimedOtherFloor;

  const claimLabel = !paid
    ? moveVerb
      ? "Move your stand here"
      : "Claim this stand"
    : holdActive
      ? moveVerb
        ? "Move here — your hold covers it"
        : "Claim — your hold covers it"
      : `${moveVerb ? "Move here" : "Claim"} for ${price} tickets`;

  return (
    <aside
      aria-label="Open stand"
      className="glass anim-in pointer-events-auto flex w-[340px] max-w-[calc(100vw-24px)] flex-col shadow-float"
    >
      <div className="flex items-center gap-2 rounded-t-md bg-line/60 px-4 py-2">
        <span className="micro text-muted">
          Open stand · {TIER_MEANING[tier].label.toUpperCase()}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close card"
          className="ml-auto rounded-sm px-1 leading-none text-muted hover:text-ink"
        >
          ×
        </button>
      </div>

      <div className="flex flex-col gap-3 p-4">
        <h2 className="font-display text-xl leading-tight">Nobody here yet.</h2>

        {/* The three positions, stated as what they are. This spot's row
            is marked; nothing counts down and nothing is "running out". */}
        <ul className="flex flex-col divide-y divide-line rounded-md border border-line text-xs">
          {(Object.keys(TIER_MEANING) as SpotTier[]).map((t) => (
            <li
              key={t}
              className={`flex items-start gap-2 px-2.5 py-1.5 ${t === tier ? "bg-panel" : ""}`}
              aria-current={t === tier ? "true" : undefined}
            >
              <span className={`w-12 shrink-0 font-medium ${t === tier ? "" : "text-muted"}`}>
                {TIER_MEANING[t].label}
              </span>
              <span className="min-w-0 leading-snug text-muted">
                {TIER_MEANING[t].meaning}{" "}
                <span className="whitespace-nowrap">
                  {SPOT_PRICE[t] === 0 ? "Free." : `${SPOT_PRICE[t]} tickets.`}
                </span>
              </span>
            </li>
          ))}
        </ul>

        {hasStartup ? (
          <>
            <p className="text-sm leading-relaxed text-muted">
              {claimedElsewhere
                ? `You already have a stand on ${floorName}. Claiming this one moves it — carpet, banner, and all.`
                : claimedOtherFloor
                  ? `Your startup has one stand, and it's on another floor right now. Claiming this spot moves it to ${floorName} — carpet, banner, and all.`
                  : `Claim it and your booth goes up right here on ${floorName}, visible to everyone on the floor.`}
            </p>

            {paid && (
              <p className="text-xs leading-relaxed text-muted">
                {holdActive ? (
                  <>Your current hold covers this spot — moving here costs nothing extra.</>
                ) : (
                  <>
                    {price < basePrice && (
                      <>
                        <s>{basePrice}</s>{" "}
                      </>
                    )}
                    {price} tickets holds it until the end of the next Open Doors plus one
                    week ({holdUntilLabel}). After that your stand moves to the nearest
                    free bronze spot — it never disappears. You have {balance} tickets.
                  </>
                )}
              </p>
            )}

            <button
              type="button"
              onClick={onClaim}
              disabled={!affordable}
              className="rounded-md bg-accent-strong px-3 py-2 text-sm font-medium text-white hover:bg-accent-strong/90 disabled:opacity-50"
            >
              {claimLabel}
            </button>
            {!affordable && (
              <p className="text-xs text-muted">
                That&rsquo;s {due} tickets; you have {balance}. Tickets come from showing
                up, quests, and the arcade — or the ticket booth sells them.
              </p>
            )}
          </>
        ) : (
          <>
            {/* "come back and claim it" was doing a lot of work: the link
                under it left the floor, so coming back meant reloading the
                hall and walking to this spot again. The form opens over the
                hall now — the spot is still here when it closes. */}
            <p className="text-sm leading-relaxed text-muted">
              {onSetUp
                ? "This spot is up for grabs. Name your startup and it is yours to claim — you stay right here."
                : "This spot is up for grabs. Set up your startup first, then come back and claim it."}
            </p>
            {onSetUp ? (
              <button
                type="button"
                onClick={onSetUp}
                className="btn-press rounded-md bg-ink px-3 py-2 text-center text-sm text-paper hover:bg-ink/85"
              >
                Put a stand up
              </button>
            ) : (
              <Link
                href="/profile#booth"
                className="rounded-md bg-ink px-3 py-2 text-center text-sm text-paper hover:bg-ink/85"
              >
                Set up your booth in Profile
              </Link>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
