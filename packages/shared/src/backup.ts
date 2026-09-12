/**
 * A COPY THE FOUNDER CAN HOLD.
 *
 * Everything the building knows lives on one phone. A phone is lost, wiped
 * or replaced, and "it was only ever on your device" is then a way of
 * saying it is gone. So the founder can take a copy of the whole thing out
 * and put it back, with no account and no server in the way.
 *
 * The copy is plain JSON, readable by a person, and it carries a stamp so
 * a wrong file is refused in words rather than by breaking. It is theirs:
 * it holds their idea, their plan, their notes and their numbers, and it
 * never leaves the phone unless they send it somewhere.
 *
 * Restoring replaces what is on the phone. That is the point of it, and
 * the screen that offers it says so before it happens.
 */

export const BACKUP_KIND = "founderfloor.backup";

export interface Backup {
  kind: typeof BACKUP_KIND;
  /** The store's schema version the copy was taken at. */
  version: number;
  /** ISO time the copy was made. */
  at: string;
  /** What it holds, for a person reading the file or the screen. */
  holds: { notebook: number; tasks: number; weeks: number; plans: number };
  state: Record<string, unknown>;
}

/**
 * What a state holds, counted from the state itself.
 *
 * Both the writing and the reading side go through here, and the reading
 * side ignores whatever the file claims. The screen that offers to put a
 * copy back is the last thing the founder sees before everything on the
 * phone is replaced, so the sentence on it has to describe what will
 * actually land — not a number a hand-edited or older file happens to
 * carry.
 */
export function holdsOf(state: Record<string, unknown>): Backup["holds"] {
  return {
    notebook: Array.isArray(state.memory) ? state.memory.length : 0,
    tasks: state.tasks && typeof state.tasks === "object" ? Object.keys(state.tasks as object).length : 0,
    weeks: Array.isArray(state.kpi) ? state.kpi.length : 0,
    plans: (Array.isArray(state.plans) ? (state.plans as unknown[]).length : 0) + (state.roadmap ? 1 : 0),
  };
}

/** Only data goes in a copy: functions, and anything that cannot survive JSON, are left behind. */
export function plainState(state: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(state)) {
    if (typeof v === "function") continue;
    out[k] = v;
  }
  return JSON.parse(JSON.stringify(out)) as Record<string, unknown>;
}

export function makeBackup(state: Record<string, unknown>, version: number, at = new Date().toISOString()): string {
  const s = plainState(state);
  const backup: Backup = {
    kind: BACKUP_KIND,
    version,
    at,
    holds: holdsOf(s),
    state: s,
  };
  return JSON.stringify(backup, null, 2);
}

export type BackupRead = { ok: true; backup: Backup } | { ok: false; why: string };

/**
 * Read a pasted copy. Every refusal is a sentence a beginner can act on,
 * never a parser error: the reviewer's point about JSON errors in front of
 * people applies here as much as to a key page.
 */
export function readBackup(text: string): BackupRead {
  const raw = (text ?? "").trim();
  if (!raw) return { ok: false, why: "Paste the copy first." };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, why: raw.startsWith("FounderFloor notebook") ? "That is the notebook on its own, which is for reading. A copy to restore from starts with a curly bracket." : "That is not a copy the building can read. Paste the whole file, from the first bracket to the last." };
  }
  if (!parsed || typeof parsed !== "object") return { ok: false, why: "That is not a copy the building can read." };
  const b = parsed as Partial<Backup>;
  if (b.kind !== BACKUP_KIND) return { ok: false, why: "That copy is not from FounderFloor." };
  if (!b.state || typeof b.state !== "object") return { ok: false, why: "That copy is empty." };
  if (typeof b.version !== "number") return { ok: false, why: "That copy does not say which version it came from." };
  const state = b.state as Record<string, unknown>;
  return { ok: true, backup: { kind: BACKUP_KIND, version: b.version, at: typeof b.at === "string" ? b.at : "", holds: holdsOf(state), state } };
}

/** What a copy holds, in one sentence, for the screen that asks before it restores. */
export function backupLine(b: Backup): string {
  const bits = [
    `${b.holds.notebook} ${b.holds.notebook === 1 ? "line" : "lines"} in the notebook`,
    `${b.holds.tasks} task ${b.holds.tasks === 1 ? "page" : "pages"}`,
    `${b.holds.weeks} ${b.holds.weeks === 1 ? "week" : "weeks"} logged`,
    `${b.holds.plans} ${b.holds.plans === 1 ? "plan" : "plans"}`,
  ];
  return `${b.at ? `Taken ${b.at.slice(0, 10)}. ` : ""}${bits.join(", ")}.`;
}
