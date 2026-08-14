"use client";

/**
 * The hall's four boards, fetched from the floor server.
 *
 * Read-only and unauthenticated: the tables carry display names and profile
 * ids, both of which are already public on the floor and in the directory.
 * Nothing here decides anything — it is a view of numbers the server keeps.
 *
 * What each board is worth knowing about, because the Records stall says so
 * out loud and this is where the claim comes from:
 *
 *   time         measured by the server from socket join to socket close.
 *                Not reportable, so not fakeable from a browser.
 *   parkour      reported on sync, then rejected if the time is under the
 *                physical minimum for that map (lib/data/parkour-limits.mjs).
 *   arcade       reported, capped at the 300 three games can total.
 *   connections  counted from synced connections that have a peer id. The
 *                public floors carry no sample stands, and the one stand
 *                still seeded anywhere — the practice hall's guide — has no
 *                peer id, so it does not move this either.
 */

import { httpBase } from "@/lib/net";

export interface ParkourRow {
  id: string;
  name: string;
  /** How many of the four maps they have finished this week. */
  cleared: number;
  /** Summed best times over those maps, in seconds. */
  total: number;
}
export interface ScoreRow {
  id: string;
  name: string;
  score: number;
}
export interface CountRow {
  id: string;
  name: string;
  count: number;
}
export interface TimeRow {
  id: string;
  name: string;
  ms: number;
}

export interface Boards {
  parkour: ParkourRow[];
  arcade: ScoreRow[];
  connections: CountRow[];
  time: TimeRow[];
}

export interface Podium {
  week: string;
  endedAt: number;
  boards: Partial<Boards>;
}

export interface Leaderboard {
  /** e.g. "2026-W33" */
  week: string;
  /** When this week's tables reset, ms epoch. */
  endsAt: number;
  /** How many people the hall is tracking at all. */
  players: number;
  boards: Boards;
  lastWeek: Podium | null;
}

const rows = <T>(v: unknown, read: (o: Record<string, unknown>) => T | null): T[] => {
  if (!Array.isArray(v)) return [];
  const out: T[] = [];
  for (const raw of v) {
    if (!raw || typeof raw !== "object") continue;
    const row = read(raw as Record<string, unknown>);
    if (row) out.push(row);
    if (out.length >= 10) break;
  }
  return out;
};

const str = (v: unknown, cap: number): string =>
  typeof v === "string" ? v.slice(0, cap) : "";
const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : NaN);

const readBoards = (v: unknown): Boards => {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const named = (r: Record<string, unknown>) => {
    const id = str(r.id, 64);
    const name = str(r.name, 24);
    return id ? { id, name: name || "Someone" } : null;
  };
  return {
    parkour: rows(o.parkour, (r) => {
      const base = named(r);
      const cleared = num(r.cleared);
      const total = num(r.total);
      return base && cleared > 0 && total > 0 ? { ...base, cleared, total } : null;
    }),
    arcade: rows(o.arcade, (r) => {
      const base = named(r);
      const score = num(r.score);
      return base && score > 0 ? { ...base, score } : null;
    }),
    connections: rows(o.connections, (r) => {
      const base = named(r);
      const count = num(r.count);
      return base && count > 0 ? { ...base, count } : null;
    }),
    time: rows(o.time, (r) => {
      const base = named(r);
      const ms = num(r.ms);
      return base && ms > 0 ? { ...base, ms } : null;
    }),
  };
};

/** Null when the server is unreachable — the stall says so rather than pretending. */
export async function fetchLeaderboard(): Promise<Leaderboard | null> {
  const base = httpBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/leaderboard`);
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;
    const week = str(data.week, 12);
    if (!week) return null;
    const last = data.lastWeek;
    return {
      week,
      endsAt: num(data.endsAt) || Date.now(),
      players: Math.max(0, num(data.players) || 0),
      boards: readBoards(data.boards),
      lastWeek:
        last && typeof last === "object"
          ? {
              week: str((last as Record<string, unknown>).week, 12),
              endedAt: num((last as Record<string, unknown>).endedAt) || 0,
              boards: readBoards((last as Record<string, unknown>).boards),
            }
          : null,
    };
  } catch {
    return null;
  }
}

/**
 * "2h 40m", "18m", "45s" — the time board's own units.
 *
 * Seconds up to a minute and a half, because a young hall's whole table is
 * under two minutes and rounding all of it to "1m" makes three different
 * visits look identical.
 */
export function humanMs(ms: number): string {
  if (ms < 90_000) return `${Math.round(ms / 1000)}s`;
  const mins = Math.round(ms / 60_000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins - h * 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** "in 3 days", "in 4 hours", "any minute" — how long this week has left. */
export function untilWords(endsAt: number, now = Date.now()): string {
  const left = endsAt - now;
  if (left <= 60_000) return "any minute";
  const hours = left / 3_600_000;
  if (hours < 1) return `in ${Math.round(left / 60_000)} minutes`;
  if (hours < 24) return `in ${Math.round(hours)} hours`;
  const days = Math.round(hours / 24);
  return days === 1 ? "tomorrow" : `in ${days} days`;
}
