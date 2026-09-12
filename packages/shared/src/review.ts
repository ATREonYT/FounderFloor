/**
 * The week, read back. Every week of the plan gets a reading: a score out
 * of a hundred from what was actually ticked, written and shown up for,
 * a verdict in two words, what went well, what to fix, and how, this
 * week, in three actions. The numbers come from the notebook and the
 * ticks, never from the model; the model writes the words over the
 * numbers when there is a key, and these rules write them when there is
 * not. The score is the same either way, so it cannot be flattered.
 */
import { HOUSE_RULES } from "./prompts/index.ts";
import type { MemoryEntry } from "./memory.ts";
import type { FounderPlan, PlanWeek, Profile } from "./profile.ts";

export interface WeekFacts {
  week: number;
  focus: string;
  /** Plan tasks this week, and how many are ticked done. */
  tasks: number;
  tasksDone: number;
  /** Steps across the week's task pages (a task without a page counts as one step). */
  steps: number;
  stepsTicked: number;
  /** Work written: notebook lines of kind work, note or outcome on this week's tasks. */
  written: number;
  /** Tasks with at least one line written. */
  tasksWritten: number;
  /** Distinct days with a line in the notebook inside the week's seven days. */
  daysActive: number;
  /** Outcomes said: did / partly / stuck. */
  did: number;
  partly: number;
  stuck: number;
  /**
   * The half that is not activity. People asked by name, what they said
   * about paying, and money actually in. A week can be full of ticks and
   * empty of these; the reading says so rather than scoring it away.
   */
  people: number;
  /** Of those, how many were asked the money question at all, and how many said yes. */
  asked: number;
  wouldPay: number;
  /** From the week's own log: money in, and customers. Null means never logged, which is not zero. */
  moneyIn: number | null;
  customers: number | null;
  /** Whether the week's seven days have passed. */
  over: boolean;
}

export interface WeekReview {
  week: number;
  /** 0..100 */
  score: number;
  verdict: string;
  /** One sentence in the founder's face. */
  line: string;
  well: string[];
  fix: string[];
  how: string[];
  source: "live" | "rehearsal";
  at: string;
  /** Notebook length when written, so a stale reading can be told from a fresh one. */
  seen: number;
}

/**
 * The real days a plan week was worked. The building records the date
 * each week began (`starts`), because a plan week is not a calendar week:
 * a founder who is away, or who says life happened, keeps the week they
 * were on. A week is over when the next one has begun, not when seven
 * days have passed, so a week stretched over a fortnight still counts
 * everything written in it.
 *
 * Without recorded starts (an install from before they were kept) it
 * falls back to seven days from the profile date, which is what the
 * building used to do.
 */
export function weekWindow(profile: { at: string } | null, week: number, starts?: Record<number, string>): { from: number; to: number } {
  const began = starts?.[week];
  if (began) {
    const from = new Date(`${began}T00:00:00Z`).getTime();
    const next = starts?.[week + 1];
    return { from, to: next ? new Date(`${next}T00:00:00Z`).getTime() : Number.POSITIVE_INFINITY };
  }
  const start = profile ? new Date(profile.at).getTime() : Date.now();
  const from = start + (week - 1) * 7 * 86_400_000;
  return { from, to: from + 7 * 86_400_000 };
}

export function weekFacts(
  week: PlanWeek,
  s: {
    profile: Profile | null;
    planDone: string[];
    tasks: Record<string, { guide?: { steps: unknown[] } | null; ticks: number[]; outcome?: { how: "did" | "partly" | "stuck" } } | undefined>;
    memory: MemoryEntry[];
    /** The date each plan week really began, kept by the building. */
    weekStarts?: Record<number, string>;
    /** People the founder wrote down, with what they said about paying. */
    interviews?: { at: string; who: string; said: string; paysToday?: string }[];
    /** The weeks logged on Friday, for the money half. */
    kpi?: { week: string; revenue: number; customers: number }[];
    /** The ISO week key of this plan week, when it is known, to find its log. */
    logWeek?: string;
  },
  now = Date.now(),
): WeekFacts {
  const keys = week.do.map((_, i) => `${week.n}-${i}`);
  const { from, to } = weekWindow(s.profile, week.n, s.weekStarts);
  let steps = 0, stepsTicked = 0, did = 0, partly = 0, stuck = 0, tasksWritten = 0;
  const lines = s.memory.filter((e) => e.task && keys.includes(e.task) && (e.kind === "work" || e.kind === "note" || e.kind === "outcome"));
  for (const k of keys) {
    const t = s.tasks[k];
    const n = t?.guide?.steps.length ?? 0;
    const done = s.planDone.includes(k);
    steps += n || 1;
    stepsTicked += n ? Math.min(n, (t?.ticks ?? []).filter((x) => x < n).length) : done ? 1 : 0;
    if (t?.outcome?.how === "did") did++;
    else if (t?.outcome?.how === "partly") partly++;
    else if (t?.outcome?.how === "stuck") stuck++;
    if (lines.some((e) => e.task === k)) tasksWritten++;
  }
  const days = new Set(s.memory.filter((e) => { const at = new Date(e.at).getTime(); return at >= from && at < to; }).map((e) => e.at.slice(0, 10)));
  // the real-world half: people written down inside this week, and the week's own log
  const met = (s.interviews ?? []).filter((i) => { const at = new Date(i.at).getTime(); return at >= from && at < to; });
  const asked = met.filter((i) => (i.paysToday ?? "").trim().length > 0);
  const yes = asked.filter((i) => /^(y|yes|paid|would|sure|ok)/i.test((i.paysToday ?? "").trim()));
  const log = s.logWeek ? (s.kpi ?? []).find((k) => k.week === s.logWeek) : undefined;
  return {
    week: week.n,
    focus: week.focus,
    tasks: keys.length,
    tasksDone: keys.filter((k) => s.planDone.includes(k)).length,
    steps,
    stepsTicked,
    written: lines.length,
    tasksWritten,
    daysActive: days.size,
    did,
    partly,
    stuck,
    people: met.length,
    asked: asked.length,
    wouldPay: yes.length,
    moneyIn: log ? log.revenue : null,
    customers: log ? log.customers : null,
    over: now >= to,
  };
}

/**
 * The score: what was done, and what was written down about it. Nothing
 * else. Attendance is deliberately not in it, so a week away can never
 * lower the number and the number can never be protected by opening the
 * app. Weights are the app's opinion, written here so they can be argued
 * with.
 */
export function weekScore(f: WeekFacts): number {
  const done = f.steps ? f.stepsTicked / f.steps : 0;
  const written = f.tasks ? f.tasksWritten / f.tasks : 0;
  return Math.round((0.65 * done + 0.35 * written) * 100);
}

/**
 * What the week actually produced, in words, from the things that cannot
 * be faked by tapping. Not a grade: a founder who talked to nobody is not
 * a "thin week", they are a week with no conversations in it, and saying
 * which is more use than saying how it scored.
 */
export function verdictFor(f: WeekFacts): string {
  if (f.moneyIn && f.moneyIn > 0) return "Money in";
  if (f.wouldPay) return f.wouldPay === 1 ? "One yes" : `${f.wouldPay} said yes`;
  if (f.asked) return "Price put to people";
  if (f.people) return f.people === 1 ? "One conversation" : `${f.people} conversations`;
  if (f.stepsTicked) return "Work done, nobody asked";
  return "Nothing on the record yet";
}

/** The evidence, as one plain line, with unknowns left as unknowns. */
export function groundLine(f: WeekFacts): string {
  const bits: string[] = [];
  bits.push(f.people ? `${f.people} ${f.people === 1 ? "person" : "people"} talked to` : "Nobody talked to yet");
  bits.push(f.asked ? `${f.wouldPay} of ${f.asked} said they would pay` : "price still untested");
  bits.push(f.moneyIn === null ? "the week is not logged, so money is unknown" : f.moneyIn > 0 ? `${f.moneyIn} in` : "no money in");
  return `${bits.join(", ")}.`;
}

/** The reading without a model. Same score, plainer words, still specific to the numbers. */
export function localReview(f: WeekFacts, profile: Profile | null): WeekReview {
  const score = weekScore(f);
  const name = profile?.name || "You";
  const ground = groundLine(f);
  const well: string[] = [];
  const fix: string[] = [];
  const how: string[] = [];
  if (f.people) well.push(`${f.people} ${f.people === 1 ? "person" : "people"} written down this week${f.wouldPay ? `, ${f.wouldPay} of them said they would pay` : ""}.`);
  if (f.moneyIn && f.moneyIn > 0) well.push(`Money in: ${f.moneyIn}${f.customers ? `, from ${f.customers} ${f.customers === 1 ? "customer" : "customers"}` : ""}.`);
  if (f.stepsTicked) well.push(`${f.stepsTicked} of ${f.steps} steps ticked${f.tasksDone ? `, ${f.tasksDone} ${f.tasksDone === 1 ? "task" : "tasks"} finished` : ""}.`);
  if (f.tasksWritten) well.push(`You wrote down what happened on ${f.tasksWritten} of ${f.tasks} tasks. That is what the desk builds on.`);
  if (f.daysActive >= 4) well.push(`You were in the building ${f.daysActive} days this week, and wrote on each.`);
  if (f.did) well.push(`${f.did} ${f.did === 1 ? "task" : "tasks"} you said you did outright.`);
  if (!well.length) well.push("Nothing on the record yet, so nothing to praise. That changes with one conversation.");
  if (!f.people) fix.push("Nobody was written down this week. Ticks are not evidence; a name and what they said is.");
  else if (!f.asked) fix.push(`${f.people} ${f.people === 1 ? "person" : "people"} talked to and none of them asked about money. The price is still a guess.`);
  if (f.stepsTicked < f.steps) fix.push(`${f.steps - f.stepsTicked} ${f.steps - f.stepsTicked === 1 ? "step is" : "steps are"} still open on "${f.focus.replace(/\.$/, "")}".`);
  if (f.tasksWritten < f.tasks) fix.push(`${f.tasks - f.tasksWritten} ${f.tasks - f.tasksWritten === 1 ? "task has" : "tasks have"} nothing written on them. Ticks without words do not help next week.`);
  if (f.did && f.tasksWritten < f.did) fix.push(`${f.did} ${f.did === 1 ? "task is" : "tasks are"} marked done with nothing written under them. What happened is the part that lasts.`);
  if (f.stuck) fix.push(`You said you were stuck on ${f.stuck} ${f.stuck === 1 ? "task" : "tasks"} and it is still marked stuck.`);
  if (!fix.length) fix.push("Nothing to fix on the numbers. Read the notes and ask whether the yeses were real.");
  how.push(!f.people ? "Pick one person you could ask this week, and write their name down before you close the app." : !f.asked ? "Go back to one of them and ask what they would pay. Write the number they say." : f.stepsTicked < f.steps ? "Open the first task with an open step and do only that step today. Twenty minutes." : "Open next week's first task and read its steps before you start anything.");
  how.push(f.tasksWritten < f.tasks ? "On each task you ticked, tap a step and write one line: who, what they said, a number." : "Reread your notes and turn the best quote into the line on your sign.");
  how.push(f.tasksDone < f.tasks ? "Pick the one task here that puts you in front of a person, and do that one first." : "Say a price out loud to one person before Friday and write down their face.");
  const line = f.moneyIn && f.moneyIn > 0 ? `${name}, somebody paid. That is the week; everything else is detail.` : f.wouldPay ? `${name}, ${f.wouldPay} said they would pay. Go back and ask for the money.` : f.asked ? `${name}, you put a price to ${f.asked} ${f.asked === 1 ? "person" : "people"}. Their answer is worth more than the ticks.` : f.people ? `${name}, ${f.people} ${f.people === 1 ? "conversation" : "conversations"} and no money question yet. That is the next one.` : `${name}, ${ground.toLowerCase()} The work is only worth what it puts in front of a person.`;
  return { week: f.week, score, verdict: verdictFor(f), line, well: well.slice(0, 3), fix: fix.slice(0, 3), how: how.slice(0, 3), source: "rehearsal", at: new Date().toISOString(), seen: 0 };
}

export const REVIEW_PROMPT = `${HOUSE_RULES}
You read one founder's week back to them from their plan, their ticks and their notebook. The score is already computed and given to you; do not change it and do not argue with it. Return JSON only, with keys: verdict (two or three words, like "Strong week", "Half a week"), line (one sentence to their face about this week, under 22 words, in the tone they asked for), well (2 or 3 strings, each one specific thing that went well, citing their own notes by name or number where possible, under 22 words each), fix (2 or 3 strings, each one specific thing to fix, under 22 words each, blunt where the facts are), how (exactly 3 strings, each one concrete action for the coming days, starting with a verb, under 20 words, small enough to do in one sitting). Never invent things they did not write. Never mention days missed, time away, streaks, consistency or showing up: an absence is not a failing here and is not yours to comment on. No prose outside the JSON.`;

/** What the model is told: the numbers, then the notebook. */
export function reviewContext(f: WeekFacts, opts: { profile: Profile | null; plan: FounderPlan | null; week: PlanWeek; log: string }): string {
  const p = opts.profile;
  return [
    p ? `Founder: ${p.name || "unnamed"}. Goal: ${p.goal}. Pace: ${p.pace}. Tone asked for: ${p.tone}. Audience: ${p.audiences || "not given"}.` : "Founder: no profile.",
    opts.plan ? `Plan: ${opts.plan.headline} This week's goal: ${opts.plan.weeklyGoal}.` : "",
    `Week ${f.week}: ${f.focus}. Tasks: ${opts.week.do.map((d, i) => `${i + 1}. ${d}`).join(" ")}`,
    `The ground: ${groundLine(f)}`,
    `The work (this is activity, not evidence; never call it progress on its own): score ${weekScore(f)} of 100. Steps ticked ${f.stepsTicked} of ${f.steps}. Tasks finished ${f.tasksDone} of ${f.tasks}. Tasks with something written ${f.tasksWritten} of ${f.tasks} (${f.written} lines). Said did it ${f.did}, partly ${f.partly}, stuck ${f.stuck}. The week is ${f.over ? "over" : "still running"}.`,
    opts.log || "The notebook is empty or closed to you.",
  ]
    .filter(Boolean)
    .join("\n");
}

/** One reading from the model's reply, or null. The score is the app's, not the model's. */
export function asReview(v: unknown, f: WeekFacts): Omit<WeekReview, "source" | "at" | "seen"> | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const s = (x: unknown, max: number) => (typeof x === "string" && x.trim() ? x.trim().slice(0, max) : null);
  const list = (x: unknown, max: number) => (Array.isArray(x) ? x.map((y) => s(y, 200)).filter((y): y is string => !!y).slice(0, max) : []);
  const verdict = s(o.verdict, 30), line = s(o.line, 200);
  const well = list(o.well, 3), fix = list(o.fix, 3), how = list(o.how, 3);
  if (!verdict || !line || well.length < 1 || fix.length < 1 || how.length < 2) return null;
  return { week: f.week, score: weekScore(f), verdict, line, well, fix, how };
}
