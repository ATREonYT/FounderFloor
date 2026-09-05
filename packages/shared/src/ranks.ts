/** lib/ranks.ts, copied. Ranks are earned by monthly revenue; the thresholds are the site's. */
export interface Rank {
  id: 0 | 1 | 2 | 3 | 4;
  name: string;
  minRevenue: number;
  color: string;
  blurb: string;
}
export const RANKS: readonly Rank[] = [
  { id: 0, name: "Garage", minRevenue: 0, color: "#6F6A5E", blurb: "Building in the dark." },
  { id: 1, name: "First Dollar", minRevenue: 1, color: "#9C6B30", blurb: "Someone paid. It counts." },
  { id: 2, name: "Ramen Profitable", minRevenue: 1_000, color: "#2B8A3E", blurb: "Covers rent and noodles." },
  { id: 3, name: "Default Alive", minRevenue: 10_000, color: "#1971C2", blurb: "Grows without asking permission." },
  { id: 4, name: "Escape Velocity", minRevenue: 100_000, color: "#B08D2E", blurb: "The booth is a formality now." },
];
export function rankFor(revenue: number): Rank {
  const rev = Number.isFinite(revenue) ? revenue : 0;
  let best = RANKS[0];
  for (const r of RANKS) if (r.minRevenue <= rev) best = r;
  return best;
}
export function nextRank(revenue: number): Rank | null {
  const cur = rankFor(revenue);
  return RANKS.find((r) => r.id === cur.id + 1) ?? null;
}
/** Revenue still needed for the next rank, 0 at the top. */
export function toNextRank(revenue: number): number {
  const n = nextRank(revenue);
  return n ? Math.max(0, n.minRevenue - Math.max(0, revenue)) : 0;
}
