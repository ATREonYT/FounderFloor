"use client";

/**
 * "Are you sure?" for tickets.
 *
 * Buying used to happen on the first click — one stray tap and 900 tickets
 * were gone with no way back, because the shop has no refunds. This asks
 * first, and when the balance is short it does the useful thing instead of
 * the smug thing: a way to GET tickets, not a scolding.
 *
 * Deliberately one dialog for the whole app. The on-floor editor and the
 * full editor on the profile both spend the same currency, and two
 * confirmations that drift apart is two chances to word a refusal badly.
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import TicketIcon from "@/components/TicketIcon";

export interface BuyConfirmProps {
  name: string;
  blurb?: string;
  /** What THIS buyer pays (exhibitor rate already applied). */
  price: number;
  /**
   * The list price. When it is higher than `price` the dialog shows it
   * struck through beside the exhibitor price — the discount for holding
   * a stand should be visible, not silent.
   */
  basePrice?: number;
  balance: number;
  /** Runs only when the viewer confirms AND can afford it. */
  onConfirm: () => void;
  onCancel: () => void;
}

export default function BuyConfirm({
  name,
  blurb,
  price,
  basePrice,
  balance,
  onConfirm,
  onCancel,
}: BuyConfirmProps) {
  const short = Math.max(0, price - balance);
  const primary = useRef<HTMLButtonElement | HTMLAnchorElement | null>(null);
  /**
   * Portalled to <body> because `position: fixed` does NOT mean "the
   * screen" inside a blurred panel: the editor's `glass` sets a backdrop
   * filter, which makes it the containing block, and the dialog came up
   * boxed inside the panel it was covering.
   */
  const [host, setHost] = useState<Element | null>(null);
  useEffect(() => setHost(document.body), []);

  useEffect(() => {
    primary.current?.focus();
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCancel();
      }
    };
    // capture: the floor listens for keys too, and Escape there closes the
    // whole booth card out from under this dialog.
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onCancel]);

  if (!host) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Buy ${name}`}
      onClick={onCancel}
      className="anim-in pointer-events-auto fixed inset-0 z-[90] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-[2px]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass flex w-[330px] max-w-full flex-col gap-3 p-4 shadow-float"
      >
        <div>
          <span className="micro text-muted">{short ? "Not enough tickets" : "Confirm"}</span>
          <h2 className="mt-1 font-display text-xl leading-tight">
            {short ? `${name} costs more than you have` : `Buy ${name}?`}
          </h2>
        </div>

        {blurb && <p className="text-sm leading-relaxed text-muted">{blurb}</p>}

        <dl className="flex flex-col gap-1 border-y border-line py-2 text-sm">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted">Price</dt>
            <dd className="tabular-nums">
              {basePrice !== undefined && basePrice > price && (
                <>
                  <s className="text-muted">{basePrice.toLocaleString("en-US")}</s>{" "}
                </>
              )}
              <TicketIcon /> {price.toLocaleString("en-US")}
            </dd>
          </div>
          {basePrice !== undefined && basePrice > price && (
            <div className="flex items-baseline justify-between gap-3 text-xs text-muted">
              <dt>Exhibitor rate</dt>
              <dd>you hold a stand on the floor</dd>
            </div>
          )}
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted">You have</dt>
            <dd className="tabular-nums">
              <TicketIcon /> {balance.toLocaleString("en-US")}
            </dd>
          </div>
          {short > 0 && (
            <div className="flex items-baseline justify-between gap-3 text-accent">
              <dt>Short by</dt>
              <dd className="tabular-nums">
                <TicketIcon /> {short.toLocaleString("en-US")}
              </dd>
            </div>
          )}
        </dl>

        <div className="flex flex-col gap-2">
          {short > 0 ? (
            <Link
              ref={primary as React.Ref<HTMLAnchorElement>}
              href="/profile#tickets"
              className="btn-press flex min-h-[44px] items-center justify-center rounded-md bg-accent-strong px-3 text-sm font-medium text-white hover:bg-accent-strong/90"
            >
              Go to the ticket booth
            </Link>
          ) : (
            <button
              ref={primary as React.Ref<HTMLButtonElement>}
              type="button"
              onClick={onConfirm}
              className="btn-press min-h-[44px] rounded-md bg-accent-strong px-3 text-sm font-medium text-white hover:bg-accent-strong/90"
            >
              Buy it — {price.toLocaleString("en-US")} tickets
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] rounded-md border border-line px-3 text-sm text-muted hover:border-ink hover:text-ink"
          >
            {short > 0 ? "Not now" : "Cancel"}
          </button>
        </div>

        {short > 0 && (
          <p className="micro text-muted">
            Tickets come from showing up — check-ins, quests, connections — or from a pack.
          </p>
        )}
      </div>
    </div>,
    host,
  );
}
