/**
 * WHAT MAY GO WITH A QUESTION.
 *
 * The promise in PRODUCT.md is exact: everything the founder writes stays
 * on the phone, and it reaches the model only after they have said yes to
 * the desk keeping notes. There are two different things in a request and
 * only one of them is covered by that promise.
 *
 *   The message they just typed is theirs to send. They typed it into a
 *   box that says the desk will answer. It always goes.
 *
 *   Everything they wrote BEFORE (the notebook, the lines on the rooms'
 *   lists, what customers said, the notes on other tasks) is history, and
 *   history only travels with consent.
 *
 * A review in September 2026 found three places assembling history into a
 * live request without checking: the task desk, the small rooms, and the
 * Workshop's brief. Each had gated `founderLog` and then passed the same
 * founder's words through another door beside it. So there is now one
 * module, and every live path builds its context here.
 *
 * The second job of this file is keeping one plan's writing out of
 * another's. Plan task keys are "week-index" and a remade plan reuses
 * them, so history is scoped to the plan it was written under.
 */
import { founderLog, ofPlan, workBlock, workLines, type MemoryEntry, type WorkTurn } from "@founderfloor/shared";

/** Has the founder said the desk may keep and use notes? Undecided is not yes. */
export const mayShare = (memoryOn: boolean | null): boolean => memoryOn === true;

export interface Past {
  memoryOn: boolean | null;
  memory: MemoryEntry[];
  /** The plan the question is being asked under. History from earlier plans never travels. */
  planId: string | null;
}

/** The notebook as the model may read it: this plan's entries, and only with consent. */
export function pastLog(p: Past): string {
  if (!mayShare(p.memoryOn)) return "";
  return founderLog(ofPlan(p.memory, p.planId), true);
}

/** What the founder wrote on the rooms' lists, as a prompt block. Empty without consent. */
export function pastLists(p: Past, lists: Record<string, WorkTurn[]>): string {
  if (!mayShare(p.memoryOn)) return "";
  return workBlock(lists);
}

/** The same, as plain lines, for the Workshop's brief. Empty without consent. */
export function pastWorkLines(p: Past, lists: Record<string, WorkTurn[]>): string[] {
  if (!mayShare(p.memoryOn)) return [];
  return workLines(lists);
}

/** Entries of these kinds from this plan, newest last, as plain text. Empty without consent. */
export function pastNotes(p: Past, kinds: MemoryEntry["kind"][], take: number): string[] {
  if (!mayShare(p.memoryOn)) return [];
  return ofPlan(p.memory, p.planId)
    .filter((e) => kinds.includes(e.kind))
    .slice(-take)
    .map((e) => e.text);
}

/** One line for a screen to show, so the founder can see what the building is working from. */
export function sourceLine(p: Past): string {
  return mayShare(p.memoryOn)
    ? "Working from your sign and everything you have written."
    : "Working from your sign only. The desk keeps no notes, so nothing you wrote earlier goes with this.";
}
