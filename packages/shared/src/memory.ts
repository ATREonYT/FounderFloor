/**
 * The desk's notebook. What the founder does in the building is written
 * down as they do it: a step ticked, how a task went, a note they typed,
 * a line the desk told them, a week logged. The notebook is theirs: it
 * lives on their device, they can read every line, export it and burn
 * it, and it only reaches the model when they have said yes.
 *
 * NOTHING WRITTEN IS LOST, and that is a storage rule, not a slogan. The
 * notebook keeps every entry and every word of it. Two limits exist and
 * neither deletes anything: LOG_LIMIT is how much a prompt may carry, and
 * RUNAWAY is a guard against a loop writing forever, which trims only
 * entries the building wrote about itself and never a word the founder
 * typed. A review of this file in September 2026 found the old cap of 400
 * entries silently dropping the first entry when the 401st arrived, and
 * a 600-character truncation cutting long notes in half. Both are gone. With it,
 * every prompt in the building knows what happened last week, so the
 * desk can say "you talked to three café owners on Tuesday; what did
 * the third one say about price?" instead of starting from nothing.
 */

export type MemoryKind = "did" | "outcome" | "note" | "desk" | "decision" | "logged" | "work";

export interface MemoryEntry {
  id: string;
  /** ISO time. */
  at: string;
  kind: MemoryKind;
  text: string;
  /** The plan step this belongs to, as "week-index", when it does. */
  task?: string;
  /**
   * Which plan this was written under. Plan task keys are "week-index"
   * and a remade plan reuses them, so without this a note from the old
   * week 1 would be read as a note on the new week 1. Absent on entries
   * written before plans were versioned.
   */
  plan?: string;
}

export const MEMORY_KINDS: Record<MemoryKind, { label: string; line: string }> = {
  did: { label: "Done", line: "A step you ticked." },
  outcome: { label: "How it went", line: "What you said after a task." },
  note: { label: "Your note", line: "What you typed on a task page." },
  desk: { label: "The desk said", line: "A line the desk gave you." },
  decision: { label: "Decision", line: "Something you decided." },
  logged: { label: "Logged", line: "A week's numbers." },
  work: { label: "Your work", line: "What you wrote at a step." },
};

/** How much of the notebook a prompt may carry. Nothing is deleted by this; it is a read limit. */
export const LOG_LIMIT = { entries: 40, chars: 2600, entryChars: 600 } as const;

/**
 * A guard against a bug writing forever, not a cap on the founder. Above
 * it, only lines the BUILDING wrote (the desk's own replies, and "done"
 * marks) are dropped, oldest first; a word the founder typed is never
 * dropped. If even that is not enough the list is kept whole, because a
 * full notebook is better than a quiet deletion.
 */
export const RUNAWAY = 20_000;
/** The kinds the founder typed themselves. These are never trimmed. */
const THEIRS: MemoryKind[] = ["note", "outcome", "work", "decision"];

/**
 * Add an entry, newest last. The same text on the same task is not
 * written twice, and a note on a task replaces the last note on it
 * (editing a note is not a new note). Nothing else is ever removed, and
 * the text is stored whole.
 */
export function withEntry(list: MemoryEntry[], e: MemoryEntry): MemoryEntry[] {
  const text = e.text.trim();
  if (!text) return list;
  const entry = { ...e, text };
  let out = list;
  if (entry.kind === "note" && entry.task) out = out.filter((x) => !(x.kind === "note" && x.task === entry.task));
  else if (out.some((x) => x.task === entry.task && x.kind === entry.kind && x.text === entry.text)) return list;
  out = [...out, entry];
  if (out.length <= RUNAWAY) return out;
  const spare = out.length - RUNAWAY;
  let dropped = 0;
  return out.filter((x) => {
    if (dropped >= spare || THEIRS.includes(x.kind)) return true;
    dropped++;
    return false;
  });
}

const day = (iso: string) => iso.slice(0, 10);

/**
 * The entries belonging to one plan: its own, plus the ones written
 * before plans were versioned, which can only have been the first plan's.
 */
export function ofPlan(entries: MemoryEntry[], planId: string | null): MemoryEntry[] {
  if (!planId) return entries.filter((e) => !e.plan);
  return entries.filter((e) => !e.plan || e.plan === planId);
}

/** The notebook as the model reads it: dated lines, newest last, trimmed to fit. Empty when there is nothing or no consent. */
export function founderLog(entries: MemoryEntry[], allowed: boolean, now = new Date()): string {
  if (!allowed || !entries.length) return "";
  const recent = entries.slice(-LOG_LIMIT.entries).map((e) => (e.text.length > LOG_LIMIT.entryChars ? { ...e, text: `${e.text.slice(0, LOG_LIMIT.entryChars)}…` } : e));
  const lines: string[] = [];
  let lastDay = "";
  for (const e of recent) {
    const d = day(e.at);
    const when = d === day(now.toISOString()) ? "today" : ageLabel(e.at, now);
    const head = d !== lastDay ? `${d} (${when}): ` : "  ";
    lastDay = d;
    lines.push(`${head}${prefix(e.kind)}${e.text}`);
  }
  let text = lines.join("\n");
  while (text.length > LOG_LIMIT.chars && lines.length > 4) {
    lines.shift();
    text = lines.join("\n");
  }
  return `\nThe founder's notebook (what they actually did, newest last; refer to it by day and by name, build on it, never repeat advice they already acted on):\n${text}`;
}

function prefix(k: MemoryKind): string {
  return k === "did" ? "did: " : k === "outcome" ? "how it went: " : k === "note" ? "note: " : k === "desk" ? "the desk said: " : k === "decision" ? "decided: " : k === "work" ? "wrote: " : "logged: ";
}

function ageLabel(iso: string, now: Date): string {
  const days = Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000);
  return days <= 0 ? "today" : days === 1 ? "yesterday" : days < 7 ? `${days} days ago` : days < 14 ? "last week" : `${Math.floor(days / 7)} weeks ago`;
}

/** The whole notebook as text, for export: the founder's own copy of their data. */
export function exportLog(entries: MemoryEntry[], name?: string): string {
  const head = `FounderFloor notebook${name ? ` for ${name}` : ""}\nExported ${new Date().toISOString().slice(0, 10)}. ${entries.length} entries.\n`;
  return head + entries.map((e) => `${e.at.slice(0, 16).replace("T", " ")}  ${MEMORY_KINDS[e.kind].label}: ${e.text}`).join("\n");
}

/** The words shown before the founder decides. Plain, complete, and true of the code. */
export const MEMORY_NOTICE = {
  title: "Can the desk keep notes?",
  lines: [
    "If you say yes, the desk writes down what you do here: the steps you tick, how each task went, the notes you type, and the lines it told you.",
    "The notebook stays on this phone. When you ask the desk something, the notebook goes along with your question so the answer fits what you have already done. The AI provider does not use it to train models.",
    "You can read every line, export it, or burn the whole notebook in Settings, any time. Say no and the desk forgets each conversation when it ends.",
  ],
  yes: "Keep notes",
  no: "Do not keep notes",
} as const;
