/**
 * One view of "your stand" for every screen: the floor's record when you
 * are signed in and have one, the founder's local record otherwise, and
 * the rehearsal stand when both are empty so nothing is ever blank.
 */
import { useMemo } from "react";
import { rankFor, type StandRecord } from "@founderfloor/shared";
import { swatches, type CarpetPattern, type Look } from "@founderfloor/ui";
import { useFounder, useSession } from "./store";
import { STAND as REHEARSAL, YOU } from "./mock";

export interface StandView {
  source: "floor" | "local" | "rehearsal";
  name: string;
  oneLiner: string;
  pitch: string;
  slug: string | null;
  hall: string | null;
  spot: string;
  online: boolean;
  swatch: number;
  carpetSwatch: number;
  pattern: CarpetPattern;
  look: Look;
  founder: string;
  record: StandRecord;
  rank: ReturnType<typeof rankFor>;
  streak: number;
  tier: "free" | "pro" | "founder";
  founding: boolean;
}

/** Nearest of the fourteen swatches to a hex colour, by RGB distance. */
export function swatchFor(hex: string | undefined, fallback = 0): number {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return fallback;
  const n = parseInt(hex.slice(1), 16);
  const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  let best = fallback, d = Infinity;
  swatches.forEach((s, i) => {
    const m = parseInt(s.slice(1), 16);
    const dd = (r - (m >> 16)) ** 2 + (g - ((m >> 8) & 255)) ** 2 + (b - (m & 255)) ** 2;
    if (dd < d) {
      d = dd;
      best = i;
    }
  });
  return best;
}

const HALL_NAME: Record<string, string> = { "main-hall": "Main Hall", "indie-alley": "Indie Alley", "ramen-district": "Ramen District", "cofounder-row": "Co-founder Row", "tutorial-hall": "Tutorial Hall" };
export const hallName = (id: string | null | undefined) => (id ? HALL_NAME[id] ?? id : "no floor yet");

export function useStand(): StandView {
  const floor = useSession((s) => s.floor);
  const entry = useSession((s) => s.stand);
  const auth = useSession((s) => s.auth);
  const record = useFounder((s) => s.record);
  const streakLocal = useFounder((s) => s.streak.days);
  return useMemo(() => {
    const st = floor?.state ?? null;
    const su = st?.myStartup ?? entry?.startup ?? null;
    const signedIn = !!auth;
    if (su) {
      const mrr = record.mrr || su.verifiedRevenue || 0;
      return {
        source: "floor",
        name: su.name,
        oneLiner: su.oneLiner,
        pitch: su.pitch,
        slug: entry?.slug ?? null,
        hall: entry?.floorId ?? null,
        spot: entry && entry.spotIndex >= 0 ? `No. ${entry.spotIndex + 1}` : "no spot yet",
        online: entry?.online ?? false,
        swatch: swatchFor(su.booth?.banner, 0),
        carpetSwatch: swatchFor(su.booth?.carpet, 8),
        pattern: su.booth?.pattern ?? "solid",
        look: st?.profile?.look ?? su.founderLook ?? YOU.look,
        founder: st?.profile?.name ?? su.founder ?? auth?.name ?? "",
        record: { ...record, name: su.name, oneLiner: su.oneLiner, pitch: su.pitch, mrr },
        rank: rankFor(mrr),
        streak: st?.visitStreak ?? streakLocal,
        tier: floor?.paid?.tier ?? st?.sub ?? "free",
        founding: (st?.badges ?? []).includes("founding"),
      };
    }
    if (signedIn) {
      return {
        source: "local",
        name: record.name || (auth?.name ? `${auth.name}'s stand` : "Your stand"),
        oneLiner: record.oneLiner || "No sign yet. The Strategy coach will write it with you.",
        pitch: record.pitch,
        slug: null,
        hall: null,
        spot: "no spot yet",
        online: false,
        swatch: 0,
        carpetSwatch: 8,
        pattern: "solid",
        look: st?.profile?.look ?? YOU.look,
        founder: auth?.name ?? "",
        record,
        rank: rankFor(record.mrr),
        streak: streakLocal,
        tier: floor?.paid?.tier ?? "free",
        founding: false,
      };
    }
    const r: StandRecord = { ...record, name: REHEARSAL.name, oneLiner: REHEARSAL.oneLiner, pitch: "", mrr: record.mrr || REHEARSAL.mrr, burn: record.burn || 6000, cash: record.cash || 40000, founderSalary: record.founderSalary || 2000, entity: record.entity === "none" ? "de-llc" : record.entity, residence: record.residence === "other" ? "CY" : record.residence };
    return {
      source: "rehearsal",
      name: REHEARSAL.name,
      oneLiner: REHEARSAL.oneLiner,
      pitch: "",
      slug: REHEARSAL.slug,
      hall: REHEARSAL.hall,
      spot: REHEARSAL.spot,
      online: true,
      swatch: REHEARSAL.swatch,
      carpetSwatch: REHEARSAL.carpetSwatch,
      pattern: REHEARSAL.pattern,
      look: YOU.look,
      founder: YOU.name,
      record: r,
      rank: rankFor(r.mrr),
      streak: streakLocal || 4,
      tier: YOU.tier,
      founding: YOU.founding,
    };
  }, [floor, entry, auth, record, streakLocal]);
}
