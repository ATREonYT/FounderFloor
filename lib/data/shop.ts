/**
 * FounderFloor — the ticket economy, in one place.
 *
 * TICKETS are the expo's currency: earned by playing (daily check-ins,
 * quests, connections, guestbooks, badges) or bought in packs with real
 * money. They buy COSMETIC stand-out — booth architectures and props —
 * never access or reach. That keeps the "gate depth, not presence" rule
 * intact: free players lose nothing social, paying players get seen.
 *
 * Economy tuning (why these numbers): an engaged free player earns roughly
 * 40-70 tickets/day (check-in + a couple of deeds), so the first booth
 * style lands in about a week of showing up — long enough to feel earned,
 * short enough to feel reachable. Packs price the same style at ~$3-4 for
 * the impatient, which matches the "earn it or speed it up" brief.
 */

import type { AppState, BoothProp, BoothStyle } from "@/lib/types";

// ---------- earn rates ----------

export const EARN = {
  /** First visit each day: 10 + 5 per streak day, capped at 45/day. */
  dailyBase: 10,
  dailyPerStreak: 5,
  dailyCap: 45,
  /** Each NEW connection (dedup'd by the store). */
  connection: 15,
  /** Each NEW guestbook signed. */
  guestbook: 5,
  /** Each NEW badge earned, whatever earned it. */
  badge: 25,
} as const;

/** Daily check-in grant for a given streak length (streak >= 1). */
export function dailyTickets(streak: number): number {
  return Math.min(EARN.dailyCap, EARN.dailyBase + EARN.dailyPerStreak * Math.max(1, streak));
}

// ---------- the catalog ----------

export interface ShopItem {
  /** Wallet ownership key: "style:bigtop", "prop:plant". */
  id: string;
  name: string;
  blurb: string;
  /** Ticket price; 0 = free (everyone owns it). */
  price: number;
}

export const BOOTH_STYLES: (ShopItem & { style: BoothStyle })[] = [
  {
    id: "style:classic",
    style: "classic",
    name: "Classic Stall",
    blurb: "The honest trade-show original. Banner, counter, coffee.",
    price: 0,
  },
  {
    id: "style:bigtop",
    style: "bigtop",
    name: "Big Top Tent",
    blurb: "A striped canvas circus tent with a flag on the peak. Impossible to walk past.",
    price: 400,
  },
  {
    id: "style:garden",
    style: "garden",
    name: "Garden Kiosk",
    blurb: "Lattice, pergola, planters in bloom. The calmest corner of the hall.",
    price: 400,
  },
  {
    id: "style:arcade",
    style: "arcade",
    name: "Arcade Cabinet",
    blurb: "Your stand as a glowing arcade machine — marquee lights, scanlines and all.",
    price: 650,
  },
  {
    id: "style:neon",
    style: "neon",
    name: "Neon Stage",
    blurb: "A dark stage wrapped in a humming neon tube in your banner color. The flagship.",
    price: 900,
  },
];

export const BOOTH_PROPS: (ShopItem & { prop: BoothProp })[] = [
  {
    id: "prop:plant",
    prop: "plant",
    name: "Potted Monstera",
    blurb: "A big leafy plant beside the counter. Every good booth has one.",
    price: 120,
  },
  {
    id: "prop:balloons",
    prop: "balloons",
    name: "Balloon Cluster",
    blurb: "Three balloons in your banner color, tied to the corner post.",
    price: 150,
  },
  {
    id: "prop:trophy",
    prop: "trophy",
    name: "Demo Day Trophy",
    blurb: "A golden cup on the counter. Nobody has to know what it's for.",
    price: 200,
  },
  {
    id: "prop:spotlight",
    prop: "spotlight",
    name: "Stage Spotlights",
    blurb: "Two warm beams from the banner top. Main-character lighting.",
    price: 250,
  },
];

/** Max props equipped at once (owning more is fine — swap anytime). */
export const MAX_EQUIPPED_PROPS = 3;

/** The booth color palette — shared by the profile editor and the on-floor
 * quick editor so a stand can't be painted a color the other can't show. */
export const BOOTH_SWATCHES: string[] = [
  "#8C3B2E",
  "#C4562B",
  "#4E6E4E",
  "#7A8C50",
  "#3B5B92",
  "#57829B",
  "#6B4E71",
  "#2F6F6A",
  "#A98C5B",
  "#8A6B4D",
  "#555049",
  "#B08D2E",
  "#A64D79",
  "#3F4A5A",
];

export function shopItem(id: string): ShopItem | undefined {
  return (
    BOOTH_STYLES.find((s) => s.id === id) ?? BOOTH_PROPS.find((p) => p.id === id)
  );
}

/** Free items count as owned by everyone. */
export function ownsItem(state: AppState, id: string): boolean {
  const item = shopItem(id);
  if (!item) return false;
  if (item.price === 0) return true;
  return state.wallet.owned.includes(id);
}

/**
 * Spendable tickets. Derived, never stored: cumulative earned + cumulative
 * purchased, minus the price of everything owned. Unknown owned ids (a
 * removed catalog item, a hand-edited entry) cost nothing.
 */
export function walletBalance(state: AppState): number {
  const spent = state.wallet.owned.reduce((sum, id) => sum + (shopItem(id)?.price ?? 0), 0);
  return Math.max(0, state.wallet.earned + state.wallet.redeemed - spent);
}

export function ownsStyle(state: AppState, style: BoothStyle): boolean {
  return ownsItem(state, `style:${style}`);
}

export function ownsProp(state: AppState, prop: BoothProp): boolean {
  return ownsItem(state, `prop:${prop}`);
}
