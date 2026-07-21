/**
 * FounderFloor — pricing, in one place.
 *
 * Numbers chosen from market research (July 2026):
 * - Gather charges $7 / $15 / $22 per user/month for virtual spaces
 *   (gather.town/pricing) — our $9 / $19 sits inside that band.
 * - Co-founder matching runs from free (YC) to $29.99/mo premium
 *   (CoFoundersLab), so the free tier stays generous and paid buys
 *   reach and visibility, never basic access.
 * - Freemium products convert 2–5% of actives; the financial model in
 *   docs/financial-model.xlsx plans at 3%.
 *
 * Checkout: when a NEXT_PUBLIC_STRIPE_LINK_* env var is set, the buttons
 * open that Stripe Payment Link. Without them (this demo build), the UI
 * says so honestly and simulates the switch locally.
 */

import type { SubTier } from "@/lib/types";

export type BillingCycle = "monthly" | "annual";

export const TIER_PRICING: Record<Exclude<SubTier, "free">, { monthly: number; annual: number }> = {
  pro: { monthly: 9, annual: 79 },
  founder: { monthly: 19, annual: 159 },
};

/** Months of the year the annual plan effectively gives free. */
export function annualFreeMonths(tier: Exclude<SubTier, "free">): number {
  const p = TIER_PRICING[tier];
  return Math.round((12 - p.annual / p.monthly) * 10) / 10;
}

/**
 * What each plan actually buys, beyond floor access. Every line here is
 * implemented — priority sorting in the directory and lobby co-founder
 * board, tier tags on stands/cards/listings, the Founder+ gold stand trim,
 * and membership titles. Perks carry with the plan: they follow your booth
 * everywhere it appears.
 */
export const TIER_PERKS: Record<SubTier, string[]> = {
  free: ["Every social feature: chat, connect, quests, reactions"],
  pro: [
    "Priority listing in the directory and co-founder board",
    "PRO tag on your stand, card, and listings",
    "“Pro member” title on your hover card",
  ],
  founder: [
    "Top placement everywhere — above Pro and free",
    "Gold-trimmed stand on the floor",
    "FOUNDER+ tag and “Founder+ member” title",
  ],
};

/**
 * Beta launch offer: one year of Founder+, the price locked for life, a
 * permanent founding badge, numbered. Capped — scarcity is the point.
 */
export const FOUNDING_OFFER = {
  price: 79,
  cap: 100,
  badgeId: "founding",
} as const;

/** Stripe Payment Link for a tier/cycle, or null when billing isn't live. */
export function checkoutLink(tier: Exclude<SubTier, "free">, cycle: BillingCycle): string | null {
  const links: Record<string, string | undefined> = {
    "pro-monthly": process.env.NEXT_PUBLIC_STRIPE_LINK_PRO_MONTHLY,
    "pro-annual": process.env.NEXT_PUBLIC_STRIPE_LINK_PRO_ANNUAL,
    "founder-monthly": process.env.NEXT_PUBLIC_STRIPE_LINK_FOUNDER_MONTHLY,
    "founder-annual": process.env.NEXT_PUBLIC_STRIPE_LINK_FOUNDER_ANNUAL,
  };
  return links[`${tier}-${cycle}`] || null;
}

export function foundingCheckoutLink(): string | null {
  return process.env.NEXT_PUBLIC_STRIPE_LINK_FOUNDING || null;
}

/**
 * Ticket packs — the real-money side of the ticket economy. Everything a
 * pack buys is also earnable by playing (lib/data/shop.ts documents the
 * rates); money only compresses time. The server recognizes each pack by
 * its exact price, so these amounts must match the Stripe products.
 */
export interface TicketPack {
  id: "s" | "m" | "l";
  name: string;
  tickets: number;
  usd: number;
  blurb: string;
}

export const TICKET_PACKS: TicketPack[] = [
  { id: "s", name: "Ticket Strip", tickets: 300, usd: 2.99, blurb: "A prop or two, right now" },
  { id: "m", name: "Ticket Roll", tickets: 800, usd: 6.99, blurb: "A new booth style, today" },
  { id: "l", name: "Ticket Crate", tickets: 2000, usd: 14.99, blurb: "The whole shop, basically" },
];

export function ticketPackLink(id: TicketPack["id"]): string | null {
  const links: Record<TicketPack["id"], string | undefined> = {
    s: process.env.NEXT_PUBLIC_STRIPE_LINK_TICKETS_S,
    m: process.env.NEXT_PUBLIC_STRIPE_LINK_TICKETS_M,
    l: process.env.NEXT_PUBLIC_STRIPE_LINK_TICKETS_L,
  };
  return links[id] || null;
}

/** True once any ticket-pack payment link is configured. */
export function ticketPacksLive(): boolean {
  return Boolean(ticketPackLink("s") || ticketPackLink("m") || ticketPackLink("l"));
}

/** True once any payment link is configured — flips the UI from simulation. */
export function billingLive(): boolean {
  return Boolean(
    checkoutLink("pro", "monthly") ||
      checkoutLink("pro", "annual") ||
      checkoutLink("founder", "monthly") ||
      checkoutLink("founder", "annual"),
  );
}
