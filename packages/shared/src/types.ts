/**
 * @founderfloor/shared — the records the app and the Edge Functions agree on.
 *
 * `FloorStartup` and `FloorAuth` are the floor server's own shapes
 * (lib/types.ts Startup, server/index.mjs /auth/*), copied so the app never
 * imports from the website. `StandRecord` is the app's extension of a stand:
 * the founder's numbers that the coaches reason over. Money is in whole
 * units of `currency`; months are decimals; dates are ISO strings.
 */
export type SubTier = "free" | "pro" | "founder";
export type AvatarLook = { skin: number; outfit: number; hair: number };
export type CarpetPattern = "solid" | "border" | "stripes";

/** lib/types.ts Startup — the fields the app reads. */
export interface FloorStartup {
  id: string;
  name: string;
  oneLiner: string;
  pitch: string;
  founder: string;
  founderLook: AvatarLook;
  category: string;
  goal: string;
  goalProgress: number;
  verifiedRevenue: number;
  seekingCofounder: boolean;
  link?: string;
  tier?: "pro" | "founder";
  booth: { carpet: string; banner: string; sign: string; glyph: string; pattern?: CarpetPattern };
}

export interface FloorAuth {
  id: string;
  name: string;
  email?: string;
  token: string;
}

export type EntityType = "none" | "de-llc" | "de-ccorp" | "cy-ltd" | "uk-ltd" | "ee-ou";
export type Residence = "CY" | "US" | "GB" | "EE" | "DE" | "other";
export type Segment = "b2b-saas" | "consumer" | "marketplace" | "services" | "hardware" | "other";

/** What the coaches know about the company. Everything optional until onboarding fills it. */
export interface StandRecord {
  name: string;
  oneLiner: string;
  pitch: string;
  segment?: Segment;
  currency: "EUR" | "USD" | "GBP";
  /** Monthly recurring revenue. */
  mrr: number;
  /** Total monthly spend, salaries included. */
  burn: number;
  /** Cash in the bank today. */
  cash: number;
  founderSalary: number;
  entity: EntityType;
  residence: Residence;
  /** The one thing this week, with a number in it. */
  weeklyGoal?: string;
  weeklyGoalProgress?: number;
  /** Where the company is in 90 days, with a number in it. */
  target90?: string;
  /** ISO date the entity was formed — drives event-based filings. */
  formedOn?: string;
  /** Founder-written answers the receptionist may repeat. */
  faq?: { q: string; a: string }[];
  publicPricing?: string;
}

export type CoachId = "strategy" | "sales" | "investor" | "finance";
export type StageId = "idea" | "validate" | "setup" | "customers" | "money" | "raise";
