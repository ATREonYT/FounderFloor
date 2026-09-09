/**
 * One task from the plan, opened up. A plan line ("Post in 3 dev
 * communities describing what you're building") is a heading; the task
 * guide is the page under it: what kind of work it is, why it matters
 * this week, how long it takes, three to five steps with a tip each, how
 * you know it is done, and three things worth asking the desk. The model
 * writes it from the profile and the plan when there is a key; these
 * rules write it when there is not, so the page is never empty.
 */
import { HOUSE_RULES } from "./prompts/index.ts";
import { toneLine, type FounderPlan, type PlanWeek, type Profile } from "./profile.ts";

/** The kind of work decides the room the page is drawn in and the glyph on the door. */
export type TaskKind = "talk" | "build" | "write" | "research" | "numbers" | "sell" | "plan";

export interface TaskStep {
  do: string;
  tip: string;
}

export interface TaskGuide {
  /** The task, as a short imperative: "Post in three developer communities". */
  title: string;
  /** One sentence: why this, this week. */
  why: string;
  /** "About 45 minutes", "An evening", "Spread over the week". */
  time: string;
  kind: TaskKind;
  steps: TaskStep[];
  /** How you know it is finished, in one sentence with something countable. */
  done: string;
  /** Three questions worth asking the desk about this task. */
  starters: string[];
  source: "live" | "rehearsal";
}

export const TASK_KINDS: Record<TaskKind, { label: string; line: string }> = {
  talk: { label: "Conversations", line: "Real people, real words, written down." },
  build: { label: "Building", line: "Make the smallest thing that works." },
  write: { label: "Writing", line: "Plain words, one reader in mind." },
  research: { label: "Research", line: "Find out, do not guess." },
  numbers: { label: "Numbers", line: "Count it, then decide." },
  sell: { label: "Selling", line: "Ask for the yes." },
  plan: { label: "Deciding", line: "Choose, write it down, move." },
};

const KIND_WORDS: Record<Exclude<TaskKind, "plan">, RegExp> = {
  numbers: /\b(log|number|numbers|track|measure|cash|burn|runway|kpi|metric|count|record the)\b/,
  sell: /\b(pay|paid|price|pricing|sell|offer|charge|payment|checkout|invoice|money|revenue|mrr)\b/,
  talk: /\b(talk|ask|call|calls|interview|conversation|conversations|people|users|customers|feedback|watch|meet)\b/,
  build: /\b(build|code|coding|ship|prototype|feature|set ?up|site|page|landing|integrate|deploy|alpha|beta|mvp)\b/,
  write: /\b(write|post|draft|message|messages|email|emails|outreach|describe|publish|tweet|sign|one-liner|copy|spec)\b/,
  research: /\b(research|read|find|list|look|search|compare|study|learn|check)\b/,
};

/** What kind of work a plan line is, from its verbs. Money words decide; otherwise the first verb does. */
export function taskKind(text: string): TaskKind {
  const t = text.toLowerCase();
  if (KIND_WORDS.numbers.test(t)) return "numbers";
  if (KIND_WORDS.sell.test(t)) return "sell";
  let best: TaskKind = "plan", at = Infinity;
  for (const k of ["talk", "build", "write", "research"] as const) {
    const m = KIND_WORDS[k].exec(t);
    if (m && m.index < at) {
      at = m.index;
      best = k;
    }
  }
  return best;
}

/** Pull the first number out of a plan line, for the done line. */
const firstNumber = (s: string): number | null => {
  const m = s.match(/\b(\d{1,3})\b/);
  return m ? Number(m[1]) : null;
};

const paceTime: Record<Profile["pace"], Record<TaskKind, string>> = {
  evenings: { talk: "Two evenings", build: "Three evenings", write: "One evening", research: "One evening", numbers: "Half an hour", sell: "One evening, then waiting", plan: "Half an hour" },
  "part-time": { talk: "Two afternoons", build: "Two or three afternoons", write: "An afternoon", research: "An afternoon", numbers: "Half an hour", sell: "An afternoon, then waiting", plan: "An hour" },
  "all-in": { talk: "Two days", build: "Most of the week", write: "A morning", research: "A morning", numbers: "Half an hour", sell: "A day, then waiting", plan: "An hour" },
};

/** The guide without a model: the same shape, from the kind of work, the line and the profile. */
export function localTaskGuide(text: string, opts: { profile?: Profile | null; week?: PlanWeek | null; plan?: FounderPlan | null }): TaskGuide {
  const kind = taskKind(text);
  const n = firstNumber(text);
  const who = opts.profile?.audiences?.trim() || "the people you are building for";
  const pace = opts.profile?.pace ?? "part-time";
  const focus = opts.week?.focus ? `Week ${opts.week.n} is "${opts.week.focus.replace(/\.$/, "")}", and this is part of it.` : "";
  const title = text.replace(/[.。]$/, "").replace(/^(\w)/, (c) => c.toUpperCase());
  const steps: Record<TaskKind, TaskStep[]> = {
    talk: [
      { do: `List ${n ?? 5} people among ${who} you could reach this week.`, tip: "Names you already know beat strangers. Warm beats perfect." },
      { do: "Ask each one for fifteen minutes, this week, about their work.", tip: "Ask about their problem, never about your idea. Ideas make people polite." },
      { do: "In each conversation, ask what wastes their week and what they tried.", tip: "Then be quiet. The second answer is the honest one." },
      { do: "Write their exact words down within an hour of hanging up.", tip: "Quotes, not summaries. You will use them on your sign." },
    ],
    build: [
      { do: "Write down the one thing this has to do, in one sentence.", tip: "If the sentence has 'and' in it, cut the second half." },
      { do: "List the three screens or steps a person walks through to get it.", tip: "Sketch them on paper first. Paper is faster to throw away." },
      { do: "Build the narrowest path that works end to end, rough edges and all.", tip: "No settings, no accounts, no polish. One path." },
      { do: "Put it in front of one real person and watch them use it.", tip: "Do not help. Where they get stuck is your next task." },
    ],
    write: [
      { do: "Name the one reader: who exactly is this for?", tip: `Picture one person from ${who}, not a crowd.` },
      { do: "Write the first version fast, in the words they would use.", tip: "Ugly first draft. Nobody sees this one." },
      { do: "Cut it by a third. Remove every adjective you would have to defend.", tip: "Read it out loud. Where you stumble, the reader stops." },
      { do: `Send or post it${n ? ` in ${n} places` : ""}, then note where the replies came from.`, tip: "One clear ask at the end: reply, sign up, or book a call." },
    ],
    research: [
      { do: "Write the question you are actually trying to answer.", tip: "One question. If it is two, do the smaller one first." },
      { do: "Find five real examples, sources or people that speak to it.", tip: "Recent beats famous. What they did beats what they said." },
      { do: "Write what you found in ten lines, with the surprise on top.", tip: "If nothing surprised you, you already knew it. Stop reading." },
      { do: "Decide what changes because of it, and put that in your notes.", tip: "Research that changes nothing was entertainment." },
    ],
    numbers: [
      { do: "Write down which numbers this needs and where each one lives.", tip: "Bank, payment provider, calendar, a tally you keep. Name the place." },
      { do: "Collect them for this week, even the ugly ones, even zero.", tip: "A zero written down is worth more than a guess." },
      { do: "Log them in the Office, and read last week beside this one.", tip: "Direction matters more than size in the early weeks." },
      { do: "Write one sentence: what would you change because of these?", tip: "If the answer is nothing, pick a different number to track." },
    ],
    sell: [
      { do: "Pick the one person most likely to say yes this week.", tip: "The one who already asked twice. Not the most impressive one." },
      { do: "Write the offer in two lines: what they get, what it costs.", tip: "Say a real number. A range is a way of not asking." },
      { do: "Ask, in person or on a call, and then stop talking.", tip: "Silence after the price is where the yes lives." },
      { do: "Write down what they said, word for word, whatever the answer.", tip: "A no with a reason is a gift. Note the reason." },
    ],
    plan: [
      { do: "Write the options you actually have, in one line each.", tip: "Three at most. A fourth option is usually the first one again." },
      { do: "For each, write what you would know by Friday if you tried it.", tip: "Pick the one that teaches you the most for the least." },
      { do: "Decide, write the decision down, and tell one person.", tip: "Telling someone makes it real. Keeping it private keeps it soft." },
      { do: "Put the first action on tomorrow, not on 'this week'.", tip: "This week has no date. Tomorrow does." },
    ],
  };
  const done: Record<TaskKind, string> = {
    talk: `${n ?? 5} conversations written down, in their words, before the week ends.`,
    build: "One real person has used it end to end while you watched.",
    write: n ? `It is live in ${n} places and you know where the replies came from.` : "It is sent or posted, with one clear ask at the end.",
    research: "Ten lines written, with the surprise on top and one thing that changes.",
    numbers: "This week's numbers are logged in the Office next to last week's.",
    sell: "You said a price to a real person and wrote down their answer.",
    plan: "The decision is written down and one person has heard it.",
  };
  const starters: Record<TaskKind, string[]> = {
    talk: ["Write me the message I send to ask for fifteen minutes.", "What are the five questions I should ask?", "What if nobody replies?"],
    build: ["Help me cut this down to the smallest version.", "What should I build first, and what can wait?", "How do I test it without a full product?"],
    write: ["Draft a first version for me to edit.", "Where should I post this for my audience?", "How do I make the ask at the end clearer?"],
    research: ["Where do I look first?", "How much research is enough here?", "What would change my mind?"],
    numbers: ["Which numbers matter most this week?", "What is a good enough way to track this?", "How do I read these next to last week's?"],
    sell: ["Help me write the two-line offer.", "What price should I say out loud?", "What do I say if they hesitate?"],
    plan: ["Help me lay out the options.", "Which one teaches me the most by Friday?", "What am I avoiding here?"],
  };
  const why = `${focus} ${TASK_KINDS[kind].line}`.trim();
  return { title, why, time: paceTime[pace][kind], kind, steps: steps[kind], done: done[kind], starters: starters[kind], source: "rehearsal" };
}

export const TASK_PROMPT = `You turn one line of a founder's four-week plan into a short working page. Return JSON only, with keys: title (the task as a short imperative, under 9 words), why (one sentence on why this matters this week for this founder, under 24 words), time (how long it takes at their pace, under 6 words, like "About 45 minutes" or "Two evenings"), kind (one of talk, build, write, research, numbers, sell, plan), steps (array of 3 to 5 objects with do (one concrete action, under 16 words, starting with a verb) and tip (one line of hard-won advice for that step, under 18 words)), done (one sentence with something countable that says when it is finished, under 18 words), starters (3 questions the founder might ask a coach about this task, each under 12 words, in the founder's own voice). Use the founder's audience and situation; never invent facts about them. Match the tone they asked for. No prose outside the JSON.`;

/** One guide from the model's reply, or null if the shape is wrong. */
export function asTaskGuide(v: unknown): Omit<TaskGuide, "source"> | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const s = (x: unknown, max: number) => (typeof x === "string" && x.trim() ? x.trim().slice(0, max) : null);
  const title = s(o.title, 90), why = s(o.why, 240), time = s(o.time, 40), done = s(o.done, 200);
  const kinds: TaskKind[] = ["talk", "build", "write", "research", "numbers", "sell", "plan"];
  const kind = kinds.includes(o.kind as TaskKind) ? (o.kind as TaskKind) : "plan";
  if (!title || !why || !done || !Array.isArray(o.steps)) return null;
  const steps: TaskStep[] = o.steps
    .slice(0, 5)
    .map((x) => {
      const y = (x ?? {}) as Record<string, unknown>;
      const d = s(y.do, 160);
      return d ? { do: d, tip: s(y.tip, 200) ?? "" } : null;
    })
    .filter((x): x is TaskStep => !!x);
  if (steps.length < 2) return null;
  const starters = Array.isArray(o.starters) ? o.starters.map((x) => s(x, 100)).filter((x): x is string => !!x).slice(0, 3) : [];
  return { title, why, time: time ?? "This week", kind, steps, done, starters };
}

/** What the model is told about the founder and the plan when it writes or discusses a task. */
export function taskContext(text: string, opts: { profile?: Profile | null; week?: PlanWeek | null; plan?: FounderPlan | null; guide?: TaskGuide | null; notes?: string; ticked?: number[]; /** The founder's notebook, already rendered by founderLog (empty without consent). */ log?: string }): string {
  const p = opts.profile;
  const lines = [
    p ? `Founder: ${p.name || "unnamed"}. Standing: ${p.standing}. Goal: ${p.goal}. Horizon: ${p.horizon}. Pace: ${p.pace}. Audience: ${p.audiences || "not given"}. Likes: ${p.likes.join(", ") || "not given"}. ${toneLine(p.tone)}` : "Founder: no profile yet.",
    opts.plan ? `Plan: ${opts.plan.headline} This week's goal: ${opts.plan.weeklyGoal}. Ninety days: ${opts.plan.target90}.` : "",
    opts.week ? `Week ${opts.week.n}: ${opts.week.focus}. All tasks this week: ${opts.week.do.join(" | ")}.` : "",
    `The task open now: ${text}`,
    opts.guide ? `Steps on the page: ${opts.guide.steps.map((st, i) => `${i + 1}. ${st.do}${opts.ticked?.includes(i) ? " (done)" : ""}`).join(" ")} Finished when: ${opts.guide.done}` : "",
    opts.notes?.trim() ? `The founder's notes on this task: ${opts.notes.trim().slice(0, 1200)}` : "",
    opts.log ?? "",
  ];
  return lines.filter(Boolean).join("\n");
}

export const TASK_DESK_PROMPT = `${HOUSE_RULES}
You are the desk, helping with exactly one task from the founder's plan; the task, its steps and the founder's notes are given to you. Stay on this task: when asked something else, answer in a line and bring it back. When the founder asks you to write or draft something, write it in full, in their voice, ready to send. When they are stuck, name the smallest next action they can do today. Refer to the steps by what they say, not by number.`;

/** What the desk opens a step's room with, by the kind of work: the question that gets the founder writing. */
export function stepOpener(kind: TaskKind, step: TaskStep): string {
  const ask: Record<TaskKind, string> = {
    talk: "Who did you talk to, and what did they say? Names and their exact words, even the awkward ones.",
    build: "What did you make, and what does it do end to end right now? What broke?",
    write: "Paste what you wrote, or tell me where it went and what came back.",
    research: "What did you find? The surprise first, then where it came from.",
    numbers: "Give me the numbers, even zeros. Where did each one come from?",
    sell: "Who did you ask, what price did you say, and what exactly did they answer?",
    plan: "What did you decide, and what did you decide against? One line each.",
  };
  return `This step: ${step.do} ${ask[kind]}`;
}

export const STEP_DESK_PROMPT = `${HOUSE_RULES}
You are the desk at one step of one task. The founder writes what they did, found, or are thinking, so that it is written down here and not somewhere else. Reply in under 90 words: first reflect the facts back in one line (names, numbers, decisions, in their words), then say the one thing that matters about it, then the single next action. If what they wrote finishes the step, say so and tell them to tick it. If they are stuck, name the smallest thing they can do in twenty minutes. Never praise for its own sake; never ask more than one question.`;
