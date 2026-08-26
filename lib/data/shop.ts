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

import type { AppState, BoothProp, BoothStyle, SpotTier } from "@/lib/types";
import { PRACTICE_FLOOR_ID } from "@/lib/data/floors";
import { holdUntilFor, tierOfSpot } from "@/lib/data/spot-plans.mjs";

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

// ---------- position pricing ----------

/**
 * What a spot TIER costs, in tickets — the IPMI model: named tiers priced
 * on position alone, no floorplan arithmetic. (IPMI sold Gold "corner
 * booth or near high traffic" / Silver "inline" / Bronze "not close to
 * traffic patterns"; automatica's row-to-island spread is ~30%.)
 *
 * The numbers, against the economy at the top of this file: an engaged
 * free player earns 40-70 tickets a day, and the 400-ticket booth styles
 * are documented as "about a week of showing up". GOLD costs exactly that
 * — the best address in the hall is a week of commitment, reachable and
 * not trivial — and unlike a style it RECURS: a hold runs to the end of
 * the next Open Doors plus one week (lib/data/spot-plans.mjs), so gold is
 * a habit, not a one-off grind. SILVER at 150 is two-three days, the step
 * between showing up and committing. BRONZE is 0 and must stay 0: tickets
 * buy stand-out, never presence — anyone can always have a stand.
 *
 * Plan members pay less (SPOT_TIER_DISCOUNT in lib/pricing.ts, beside the
 * plan prices where every plan-changed number lives).
 */
export const SPOT_PRICE: Record<SpotTier, number> = {
  bronze: 0, // always free — never gate presence
  silver: 150,
  gold: 400,
};

/** Does this player currently hold a stand on a real floor? The tutorial
 * hall is rehearsal and does not make anyone an exhibitor. */
export function holdsStand(state: AppState): boolean {
  return Object.keys(state.claims).some((fid) => fid !== PRACTICE_FLOOR_ID);
}

/**
 * The exhibitor rate. Real shows charge stand-holders roughly half what
 * they charge everyone else for every other product (RSNA: $2,500 vs
 * $5,000 for the same listing; NCCN: $1,000 vs $1,500). Applied to every
 * ticket-priced catalog item through priceFor() — the ONE place the
 * multiplier lives, so anything a later prompt adds to the catalog gets
 * it for free. Spot tiers are exempt: they are what MAKES you an
 * exhibitor, and their own discount is the plan discount in pricing.ts.
 */
export const EXHIBITOR_RATE = 0.5;

/** What THIS player pays for a catalog item, exhibitor rate applied. */
export function priceFor(state: AppState, item: ShopItem): number {
  if (item.price === 0) return 0;
  return holdsStand(state) ? Math.round(item.price * EXHIBITOR_RATE) : item.price;
}

// ---------- spot holds ----------

/**
 * A paid spot tier is a HOLD, not a possession: it runs to the end of the
 * next Open Doors plus one week, then the stand moves to the nearest free
 * bronze spot (the floor server does the moving, so it happens whether or
 * not the owner is online).
 *
 * Holds live in wallet.owned as "hold:<floor>:<tier>:<untilMs>:<paid>",
 * so the wallet's monotonic rules cover them unchanged: devices union
 * their purchases, spend derives from what the ids record, and nothing
 * can be double-charged or refunded by a sync. Expired holds stay in the
 * list on purpose — they ARE the record of what was spent; dropping one
 * would silently refund it.
 */
export interface SpotHold {
  floorId: string;
  tier: SpotTier;
  until: number;
  paid: number;
}

const HOLD_ID = /^hold:([a-z0-9-]{1,20}):(gold|silver):(\d{10,14}):(\d{1,5})$/;

export function spotHoldId(floorId: string, tier: SpotTier, until: number, paid: number): string {
  return `hold:${floorId}:${tier}:${until}:${paid}`;
}

export function parseSpotHold(id: string): SpotHold | null {
  const m = HOLD_ID.exec(id);
  if (!m) return null;
  return { floorId: m[1], tier: m[2] as SpotTier, until: Number(m[3]), paid: Number(m[4]) };
}

/** The best unexpired hold this player has on a floor, if any. */
export function activeSpotHold(
  state: AppState,
  floorId: string,
  nowMs = Date.now(),
): SpotHold | null {
  let best: SpotHold | null = null;
  for (const id of state.wallet.owned) {
    const h = parseSpotHold(id);
    if (!h || h.floorId !== floorId || h.until <= nowMs) continue;
    if (!best || (h.tier === "gold" && best.tier !== "gold") || h.until > best.until) best = h;
  }
  return best;
}

/** Does an active hold on this floor cover a spot of this tier? Gold
 * covers everything; silver covers silver; bronze needs nothing. */
export function holdCovers(hold: SpotHold | null, tier: SpotTier): boolean {
  if (tier === "bronze") return true;
  if (!hold) return false;
  return hold.tier === "gold" || hold.tier === tier;
}

/** When a hold bought right now would run out — for UI copy and the
 * store's purchase action. Same arithmetic the server applies. */
export function newHoldUntil(nowMs = Date.now()): number {
  return holdUntilFor(nowMs);
}

export { tierOfSpot };

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

/** Free items count as owned by everyone. An entry may carry an "@<paid>"
 * suffix recording an exhibitor-rate purchase — it still owns the item. */
export function ownsItem(state: AppState, id: string): boolean {
  const item = shopItem(id);
  if (!item) return false;
  if (item.price === 0) return true;
  return state.wallet.owned.some((e) => e === id || e.startsWith(`${id}@`));
}

/**
 * Spendable tickets. Derived, never stored: cumulative earned + cumulative
 * purchased, minus the price of everything owned. Unknown owned ids (a
 * removed catalog item, a hand-edited entry) cost nothing.
 *
 * Two id forms carry their own price: "style:bigtop@200" records a
 * purchase at the exhibitor rate, and "hold:<floor>:<tier>:<until>:<paid>"
 * records a spot hold. Both are clamped to the catalog price so a
 * hand-edited suffix can never mint tickets — it can only overpay.
 */
export function walletBalance(state: AppState): number {
  let spent = 0;
  for (const id of state.wallet.owned) {
    const at = id.indexOf("@");
    if (at > 0) {
      const base = shopItem(id.slice(0, at))?.price ?? 0;
      spent += Math.min(base, Math.max(0, Math.trunc(Number(id.slice(at + 1)) || 0)));
      continue;
    }
    const hold = parseSpotHold(id);
    if (hold) {
      spent += Math.min(SPOT_PRICE[hold.tier], Math.max(0, hold.paid));
      continue;
    }
    spent += shopItem(id)?.price ?? 0;
  }
  return Math.max(0, state.wallet.earned + state.wallet.redeemed - spent);
}

export function ownsStyle(state: AppState, style: BoothStyle): boolean {
  return ownsItem(state, `style:${style}`);
}

export function ownsProp(state: AppState, prop: BoothProp): boolean {
  return ownsItem(state, `prop:${prop}`);
}
