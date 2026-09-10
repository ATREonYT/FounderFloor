/**
 * The notes on any line. Wherever the building tells the founder to do
 * something (a line on a room's list, a step of a task, a thing the week's
 * reading said to do), the line opens a room: how to do it in words a
 * child follows, the desk's question, and a place to write what happened.
 * What is written there is kept against the line, goes into the notebook,
 * and from then on the desk, the coaches and the Workshop read it: the
 * plan bends to it, the brief is written from it. This module is the
 * shape of that: the item behind an id, the opener, the desk's prompt,
 * the practice-mode reply, and the block every prompt carries.
 */
import { STAGES, type BuildStage } from "./build-path.ts";
import { BUILDING, DOOR_RULE, HOUSE_RULES } from "./prompts/index.ts";
import { taskKind, type TaskKind } from "./tasks.ts";

export interface WorkItem {
  id: string;
  text: string;
  /** How to do it, for someone who never has. */
  how: string;
  /** The desk's question that gets the founder writing. */
  ask: string;
  proof?: string;
  door?: { route: string; label: string };
  /** The room on the map this line belongs to, when it is on a room's list. */
  room?: { id: BuildStage["id"]; name: string; n: number };
}

export interface WorkTurn {
  id: string;
  role: "you" | "desk";
  text: string;
}

/** How to do a free line (one the week's reading wrote, say), by the kind of work its verbs name. */
const PLAIN_HOW: Record<TaskKind, { how: string; ask: string }> = {
  talk: { how: "Pick the people, message them today, and ask about their week, never about your idea. Write their words down the same day, in the Office.", ask: "Who did you talk to, and what did they say? Names and their exact words." },
  build: { how: "You do not build this yourself. Open the Workshop: it draws your app from your words and writes the brief. Paste the brief into Lovable and a working version comes back as a link.", ask: "Which screen did you look at, what would you change, or what link came back?" },
  write: { how: "Say who the one reader is. Write it fast in the words they use, cut a third, and ask the desk to draft it if you are stuck. Then send it and note what came back.", ask: "Paste what you wrote, or say where it went and what came back." },
  research: { how: "Write the one question you want answered. Look at five real examples or ask five people. Write ten lines with the surprise first.", ask: "What did you find out? The surprise first, then where it came from." },
  numbers: { how: "Find the numbers where they live: your bank, your payment page, a tally you keep. Write them down even when they are zero, and log them in the Office on Friday.", ask: "Give me the numbers, even zeros, and where each one came from." },
  sell: { how: "Pick the one person most likely to say yes. Say what they get and what it costs, with a real number. Then stop talking and wait.", ask: "Who did you ask, what price did you say, and what did they answer?" },
  plan: { how: "Write the choices you have, three at most, and what you would know by Friday if you tried each. Pick one, write it down, and tell one person.", ask: "What did you decide, and what did you decide against?" },
};

/** The item behind an id: a line on a room's list, or a free line with its text given. */
export function workItem(id: string, text?: string): WorkItem | null {
  for (const s of STAGES) {
    const it = s.items.find((i) => i.id === id);
    if (it) return { id, text: it.text, how: it.how, ask: it.ask, proof: it.proof, door: it.door, room: { id: s.id, name: s.name, n: s.n } };
  }
  const t = text?.trim();
  if (!t) return null;
  const k = taskKind(t);
  return { id, text: t.replace(/[.。]$/, ""), how: PLAIN_HOW[k].how, ask: PLAIN_HOW[k].ask, door: k === "build" ? { route: "/workshop", label: "Open the Workshop" } : k === "numbers" || k === "talk" ? { route: "/office", label: "Open the Office" } : undefined };
}

/** What the desk opens the room with. */
export function workOpener(item: WorkItem): string {
  return `${item.ask} Write it here, in your own words. I keep it, and from now on the desk and the Workshop read it.`;
}

/** The desk's answer without a model: written down, the smallest next move, and the tick. */
export function scriptedWork(item: WorkItem, said: string): string {
  const s = said.toLowerCase();
  if (/how do i|how to|what does|what is|don't understand|dont understand|mean\?/.test(s)) return `${item.how}${item.door ? ` The door for it is on this page.` : ""} Do the first sentence of that today and write what happened.`;
  if (/stuck|can't|cannot|don't know|dont know|no idea|not sure/.test(s)) return `Written down. Stuck is a place, not a verdict. ${item.how.split(/(?<=\.)\s/)[0]} Twenty minutes on that, then write what happened.`;
  if (/done|finished|did it|sent|posted|paid|signed|opened|talked|called|got /.test(s)) return `Written down. That reads like the line is done${item.proof ? ` (done means: ${item.proof.toLowerCase()})` : ""}; tick it above. The desk and the Workshop read this from now on.`;
  return `Written down, word for word. ${item.proof ? `Done means: ${item.proof.toLowerCase()}. ` : ""}When it is true, tick the line above; until then, write what happens next.`;
}

export const WORK_DESK_PROMPT = `${HOUSE_RULES}
${BUILDING}
${DOOR_RULE}
You are the desk at one line of the founder's list. The line, how to do it, what counts as done, and everything the founder wrote on it are given to you. They write what they did, found, or are stuck on, so it is kept here. Reply in under 90 words: reflect the facts back in one line (names, numbers, decisions, in their words), then the one thing that matters, then the single smallest next action, and which door in the building does it for them if one does. If what they wrote means the line is done, say so and tell them to tick it. If they ask how, explain as to someone who has never done it. Never ask more than one question.`;

/** What the model is told about the line and the founder's notes on it. */
export function workContext(item: WorkItem, turns: WorkTurn[], opts?: { ticked?: boolean; stand?: string; lists?: string; log?: string }): string {
  const mine = turns.filter((t) => t.role === "you").map((t) => `- ${t.text}`).join("\n");
  return [
    item.room ? `The room: ${item.room.name} (room ${item.room.n} of 6 on the map).` : "",
    `The line: ${item.text}${opts?.ticked ? " (ticked as done)" : ""}`,
    `How to do it, as the page says: ${item.how}`,
    item.proof ? `Done means: ${item.proof}` : "",
    mine ? `What the founder wrote on this line so far:\n${mine}` : "The founder has not written on this line yet.",
    opts?.stand ?? "",
    opts?.lists ?? "",
    opts?.log ?? "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** How much of the lists a prompt may carry. */
export const WORK_LIMIT = { items: 24, chars: 2400 } as const;

/** Everything the founder wrote on the lists, one line per item, newest writing last: the block the desk, the coaches and the Workshop carry. */
export function workLines(work: Record<string, WorkTurn[]>, titles?: Record<string, string>): string[] {
  const out: string[] = [];
  for (const [id, turns] of Object.entries(work)) {
    const mine = turns.filter((t) => t.role === "you").map((t) => t.text.trim()).filter(Boolean);
    if (!mine.length) continue;
    const item = workItem(id, titles?.[id]);
    const title = (item?.text ?? titles?.[id] ?? id).replace(/[.。]$/, "");
    out.push(`${title}: ${mine.slice(-3).join(" / ").slice(0, 320)}`);
  }
  return out.slice(-WORK_LIMIT.items);
}

export function workBlock(work: Record<string, WorkTurn[]>, titles?: Record<string, string>): string {
  const lines = workLines(work, titles);
  if (!lines.length) return "";
  let text = lines.map((l) => `- ${l}`).join("\n");
  while (text.length > WORK_LIMIT.chars && lines.length > 3) {
    lines.shift();
    text = lines.map((l) => `- ${l}`).join("\n");
  }
  return `\nWhat the founder wrote on the lists (their own words on each line of the map; build on it, never ask for what is already here):\n${text}`;
}
