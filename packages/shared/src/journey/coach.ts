/**
 * THE COACH INSIDE A MISSION.
 *
 * Not a chat window. Five small, named actions a founder can press on the
 * thing they are writing — make this more specific, give me an example,
 * is this question leading, separate what I saw from what I assume, help
 * me read these results — each returning a structured reply that slots
 * into the current field rather than a paragraph to scroll.
 *
 * Everything the model is told and everything it is allowed to say back
 * is defined here, on purpose, in the same package as the lessons. The
 * server route only carries it. The rules that matter most:
 *
 *   It never invents a person, a quote, a number or a completed action.
 *   It never calls an idea validated, because it cannot know that.
 *   It says when it is unsure, in a labelled line, not in a hedge.
 *   The founder accepts, edits or rejects; nothing is written for them.
 *
 * And the reply is parsed by `parseCoachReply` before it is trusted. A
 * reply that is not the shape asked for, or that breaks a rule the text
 * can catch, is thrown away and the founder is told the coach could not
 * help this time. The lesson works without it.
 */
import { missionById, type OutputKey } from "./content.ts";

export type CoachAction = "specific" | "example" | "leading" | "separate" | "interpret";

export const COACH_ACTIONS: Record<CoachAction, { label: string; line: string }> = {
  specific: { label: "Help me make this more specific", line: "Turns a vague line into one with a person, a place or a number in it." },
  example: { label: "Explain this with an example", line: "One concrete example of what this part of the lesson is asking for." },
  leading: { label: "Check whether this question is leading", line: "Says whether a question contains its own answer, and offers a plainer one." },
  separate: { label: "Separate observations from assumptions", line: "Sorts your lines into what happened and what you believe." },
  interpret: { label: "Help me interpret these results", line: "Reads what happened, says what it can and cannot tell you." },
};

/** Which actions make sense on which kind of field. The UI offers only these. */
export function actionsFor(key: OutputKey): CoachAction[] {
  switch (key) {
    case "idea":
    case "customerGroup":
    case "problem":
    case "offer":
    case "testHypothesis":
    case "testAsk":
    case "testObserve":
      return ["specific", "example"];
    case "questions":
      return ["leading", "example"];
    case "known":
    case "assumed":
    case "workaround":
    case "conversationNotes":
    case "surprises":
    case "contradictions":
      return ["separate", "example"];
    case "decision":
    case "outcomeWhat":
    case "outcomeUnknown":
      return ["interpret", "example"];
    default:
      return ["example"];
  }
}

export interface CoachContext {
  missionId: string;
  action: CoachAction;
  /** The field being worked on. */
  key: OutputKey;
  /** What the founder has typed there so far. May be empty for "example". */
  text: string;
  /** Lines the founder has chosen to share for context. Only what is here is known. */
  shared: Partial<Record<"idea" | "customerGroup" | "problem", string>>;
}

export interface CoachReply {
  /** One short paragraph, plain second person. */
  note: string;
  /** A rewrite the founder may accept into the field, when the action produces one. */
  suggestion?: string;
  /** Sorted or listed lines, when the action produces them. */
  items?: { text: string; tag?: string }[];
  /** What the coach is not sure about, said plainly. */
  uncertain?: string;
  /** A single question, only when something essential is missing. */
  ask?: string;
}

export const COACH_SYSTEM = `You are a coach inside one lesson of FounderFloor, a journey that takes a first-time founder from an idea to a small customer test. You are given the lesson's objective, the field they are writing, what they have typed, and any lines they chose to share. You know nothing else about them.

Speak plainly, in second person, in short sentences. No headings, no bullet symbols, no emojis, no exclamation marks. Explain any term the first time you use it.

Hard rules. Never invent a person, a quote, a customer, a statistic, a market size or a thing the founder did; if you do not have it, say you do not. Never call an idea validated, proven, or ready, and never say a business will succeed; an idea is not validated because it sounds good. Never tell them to message, publish or pay for anything. Preserve anything in their text that goes against their idea; do not smooth it away. When you are unsure, say so in the "uncertain" field rather than hedging in the note. If a piece of context you genuinely need is missing, ask one focused question in the "ask" field and keep the rest short.

Reply with one JSON object and nothing else, of this shape:
{"note": string, "suggestion"?: string, "items"?: [{"text": string, "tag"?: string}], "uncertain"?: string, "ask"?: string}

note: under 90 words. suggestion: only when the action asks for a rewrite, in the founder's own words made better, under 80 words, never adding facts they did not give. items: only for sorting or listing, at most 8, each under 40 words, tag is one of "observation", "assumption", "leading", "fine", "happened", "interpretation" or omitted. uncertain and ask: one sentence each, only when needed.`;

const ASK_FOR: Record<CoachAction, string> = {
  specific: "Make the founder's line more specific without adding anything they did not say: a named kind of person, a place, a moment, or a number they could actually check. Put the rewrite in \"suggestion\". In the note, say in one or two sentences what you changed and why.",
  example: "Give one concrete example of what this field is asking for, for a product like theirs if they shared one, otherwise for a plain everyday product. Make clear it is an example, not their answer. Put the example in \"suggestion\" and the reason it is a good one in the note.",
  leading: "For each question the founder wrote, decide whether it leads the person to an answer or describes the founder's idea. Put each as an item with tag \"leading\" or \"fine\". For leading ones, rewrite them as a question about past behaviour in the item's text after a dash. In the note, say the one habit that would fix most of them.",
  separate: "Sort the founder's lines into what happened, which they could point to, and what they believe. Put each as an item with tag \"observation\" or \"assumption\" and the founder's text unchanged. In the note, say which assumption would change the idea most if it were wrong.",
  interpret: "Read what happened. In items, list what this can tell them tagged \"happened\" and what is interpretation tagged \"interpretation\". In the note, say what it does not tell them yet and the smallest next test that would. Do not judge the idea.",
};

/** The message the model is asked to answer. Only what the founder shared is in it. */
export function coachUser(ctx: CoachContext): string {
  const m = missionById(ctx.missionId);
  const shared = Object.entries(ctx.shared)
    .filter(([, v]) => v && v.trim())
    .map(([k, v]) => `${k}: ${v!.trim()}`)
    .join("\n");
  return [
    `Lesson: ${m?.title ?? ctx.missionId}. Objective: ${m?.objective ?? ""}`,
    `Field: ${ctx.key}.`,
    shared ? `What the founder has shared:\n${shared}` : "The founder has shared no other lines.",
    `What they have typed in this field:\n${ctx.text.trim() || "(nothing yet)"}`,
    ``,
    `Task: ${ASK_FOR[ctx.action]}`,
  ].join("\n");
}

const LIMITS = { note: 700, suggestion: 700, item: 320, items: 8, short: 300 } as const;
/** Words a coach reply may never use as a verdict. */
const BANNED = /\b(validated|proven|guaranteed|will succeed|product[- ]market fit)\b/i;
const TAGS = new Set(["observation", "assumption", "leading", "fine", "happened", "interpretation"]);

/**
 * The only door a model reply comes through. Returns null for anything
 * that is not exactly the shape asked for, is too long, or says one of
 * the things a coach here must never say. Null means "the coach could
 * not help this time", and the founder is told that in those words.
 */
export function parseCoachReply(raw: string): CoachReply | null {
  let obj: unknown;
  try {
    // tolerate a fenced block, nothing else
    const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    obj = JSON.parse(text);
  } catch {
    return null;
  }
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return null;
  const r = obj as Record<string, unknown>;
  if (typeof r.note !== "string" || !r.note.trim() || r.note.length > LIMITS.note) return null;
  const out: CoachReply = { note: r.note.trim() };
  if (r.suggestion !== undefined) {
    if (typeof r.suggestion !== "string" || r.suggestion.length > LIMITS.suggestion) return null;
    if (r.suggestion.trim()) out.suggestion = r.suggestion.trim();
  }
  if (r.items !== undefined) {
    if (!Array.isArray(r.items) || r.items.length > LIMITS.items) return null;
    const items: { text: string; tag?: string }[] = [];
    for (const it of r.items) {
      if (!it || typeof it !== "object") return null;
      const i = it as Record<string, unknown>;
      if (typeof i.text !== "string" || !i.text.trim() || i.text.length > LIMITS.item) return null;
      const item: { text: string; tag?: string } = { text: i.text.trim() };
      if (i.tag !== undefined) {
        if (typeof i.tag !== "string" || !TAGS.has(i.tag)) return null;
        item.tag = i.tag;
      }
      items.push(item);
    }
    if (items.length) out.items = items;
  }
  for (const k of ["uncertain", "ask"] as const) {
    if (r[k] !== undefined) {
      if (typeof r[k] !== "string" || (r[k] as string).length > LIMITS.short) return null;
      if ((r[k] as string).trim()) out[k] = (r[k] as string).trim();
    }
  }
  const everything = [out.note, out.suggestion ?? "", out.uncertain ?? "", out.ask ?? "", ...(out.items ?? []).map((i) => i.text)].join("\n");
  if (BANNED.test(everything)) return null;
  return out;
}
