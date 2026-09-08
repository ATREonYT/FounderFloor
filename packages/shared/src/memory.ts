/**
 * The desk's notebook. What the founder does in the building is written
 * down as they do it: a step ticked, how a task went, a note they typed,
 * a line the desk told them, a week logged. The notebook is theirs: it
 * lives on their device, they can read every line, export it and burn
 * it, and it only reaches the model when they have said yes. With it,
 * every prompt in the building knows what happened last week, so the
 * desk can say "you talked to three café owners on Tuesday; what did
 * the third one say about price?" instead of starting from nothing.
 */

export type MemoryKind = "did" | "outcome" | "note" | "desk" | "decision" | "logged";

export interface MemoryEntry {
  id: string;
  /** ISO time. */
  at: string;
  kind: MemoryKind;
  text: string;
  /** The plan step this belongs to, as "week-index", when it does. */
  task?: string;
}

export const MEMORY_KINDS: Record<MemoryKind, { label: string; line: string }> = {
  did: { label: "Done", line: "A step you ticked." },
  outcome: { label: "How it went", line: "What you said after a task." },
  note: { label: "Your note", line: "What you typed on a task page." },
  desk: { label: "The desk said", line: "A line the desk gave you." },
  decision: { label: "Decision", line: "Something you decided." },
  logged: { label: "Logged", line: "A week's numbers." },
};

/** How much of the notebook a prompt may carry. */
export const LOG_LIMIT = { entries: 40, chars: 2600 } as const;

/** Add an entry, newest last: same text on the same task is not written twice, a note on a task replaces the last note on it. */
export function withEntry(list: MemoryEntry[], e: MemoryEntry, cap = 400): MemoryEntry[] {
  const text = e.text.trim();
  if (!text) return list;
  const entry = { ...e, text: text.slice(0, 600) };
  let out = list;
  if (entry.kind === "note" && entry.task) out = out.filter((x) => !(x.kind === "note" && x.task === entry.task));
  else if (out.some((x) => x.task === entry.task && x.kind === entry.kind && x.text === entry.text)) return list;
  return [...out, entry].slice(-cap);
}

const day = (iso: string) => iso.slice(0, 10);

/** The notebook as the model reads it: dated lines, newest last, trimmed to fit. Empty when there is nothing or no consent. */
export function founderLog(entries: MemoryEntry[], allowed: boolean, now = new Date()): string {
  if (!allowed || !entries.length) return "";
  const recent = entries.slice(-LOG_LIMIT.entries);
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
  return k === "did" ? "did: " : k === "outcome" ? "how it went: " : k === "note" ? "note: " : k === "desk" ? "the desk said: " : k === "decision" ? "decided: " : "logged: ";
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
