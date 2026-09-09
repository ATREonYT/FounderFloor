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

/** The week's seven days, from when the profile was made. */
export function weekWindow(profile: { at: string } | null, week: number): { from: number; to: number } {
  const start = profile ? new Date(profile.at).getTime() : Date.now();
  const from = start + (week - 1) * 7 * 86_400_000;
  return { from, to: from + 7 * 86_400_000 };
}

export function weekFacts(
  week: PlanWeek,
  s: { profile: Profile | null; planDone: string[]; tasks: Record<string, { guide?: { steps: unknown[] } | null; ticks: number[]; outcome?: { how: "did" | "partly" | "stuck" } } | undefined>; memory: MemoryEntry[] },
  now = Date.now(),
): WeekFacts {
  const keys = week.do.map((_, i) => `${week.n}-${i}`);
  const { from, to } = weekWindow(s.profile, week.n);
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
  return { week: week.n, focus: week.focus, tasks: keys.length, tasksDone: keys.filter((k) => s.planDone.includes(k)).length, steps, stepsTicked, written: lines.length, tasksWritten, daysActive: days.size, did, partly, stuck, over: now >= to };
}

/** The score: what was done, what was written down, and showing up. Weights are the app's opinion, and they are written here so they can be argued with. */
export function weekScore(f: WeekFacts): number {
  const done = f.steps ? f.stepsTicked / f.steps : 0;
  const written = f.tasks ? f.tasksWritten / f.tasks : 0;
  const showed = Math.min(1, f.daysActive / 4);
  const raw = 0.55 * done + 0.25 * written + 0.2 * showed;
  return Math.round(raw * 100);
}

export function verdictFor(score: number): string {
  return score >= 85 ? "Strong week" : score >= 65 ? "Good week" : score >= 40 ? "Half a week" : score >= 15 ? "Thin week" : "Not started";
}

/** The reading without a model. Same score, plainer words, still specific to the numbers. */
export function localReview(f: WeekFacts, profile: Profile | null): WeekReview {
  const score = weekScore(f);
  const name = profile?.name || "You";
  const well: string[] = [];
  const fix: string[] = [];
  const how: string[] = [];
  if (f.stepsTicked) well.push(`${f.stepsTicked} of ${f.steps} steps ticked${f.tasksDone ? `, ${f.tasksDone} ${f.tasksDone === 1 ? "task" : "tasks"} finished` : ""}.`);
  if (f.tasksWritten) well.push(`You wrote down what happened on ${f.tasksWritten} of ${f.tasks} tasks. That is what the desk builds on.`);
  if (f.daysActive >= 4) well.push(`${f.daysActive} days in the building this week. Showing up is most of it.`);
  if (f.did) well.push(`${f.did} ${f.did === 1 ? "task" : "tasks"} you said you did outright.`);
  if (!well.length) well.push("Nothing on the record yet, so nothing to praise. That changes with one step.");
  if (f.stepsTicked < f.steps) fix.push(`${f.steps - f.stepsTicked} ${f.steps - f.stepsTicked === 1 ? "step is" : "steps are"} still open on "${f.focus.replace(/\.$/, "")}".`);
  if (f.tasksWritten < f.tasks) fix.push(`${f.tasks - f.tasksWritten} ${f.tasks - f.tasksWritten === 1 ? "task has" : "tasks have"} nothing written on them. Ticks without words do not help next week.`);
  if (f.daysActive < 3) fix.push(`Only ${f.daysActive} ${f.daysActive === 1 ? "day" : "days"} in the building. Once a week is a hobby.`);
  if (f.stuck) fix.push(`You said you were stuck on ${f.stuck} ${f.stuck === 1 ? "task" : "tasks"} and it is still marked stuck.`);
  if (!fix.length) fix.push("Nothing to fix on the numbers. Read the notes and ask whether the yeses were real.");
  how.push(f.stepsTicked < f.steps ? "Open the first task with an open step and do only that step today. Twenty minutes." : "Open next week's first task and read its steps before you start anything.");
  how.push(f.tasksWritten < f.tasks ? "On each task you ticked, tap a step and write one line: who, what they said, a number." : "Reread your notes and turn the best quote into the line on your sign.");
  how.push(f.daysActive < 4 ? `Pick ${Math.max(2, 4 - f.daysActive)} evenings this week and put them in your calendar now, as "FounderFloor".` : "Say a price out loud to one person before Friday and write down their face.");
  const line = score >= 85 ? `${name}, this is what a working week looks like. Keep the shape.` : score >= 65 ? `${name}, a real week. The open steps are the whole gap.` : score >= 40 ? `${name}, half a week. The plan was three tasks; you touched ${Math.max(1, f.tasksDone + f.tasksWritten)}.` : score >= 15 ? `${name}, a thin week. Nothing is lost, but nothing moved either.` : `${name}, the week has not started. One step today is a different week.`;
  return { week: f.week, score, verdict: verdictFor(score), line, well: well.slice(0, 3), fix: fix.slice(0, 3), how: how.slice(0, 3), source: "rehearsal", at: new Date().toISOString(), seen: 0 };
}

export const REVIEW_PROMPT = `${HOUSE_RULES}
You read one founder's week back to them from their plan, their ticks and their notebook. The score is already computed and given to you; do not change it and do not argue with it. Return JSON only, with keys: verdict (two or three words, like "Strong week", "Half a week"), line (one sentence to their face about this week, under 22 words, in the tone they asked for), well (2 or 3 strings, each one specific thing that went well, citing their own notes by name or number where possible, under 22 words each), fix (2 or 3 strings, each one specific thing to fix, under 22 words each, blunt where the facts are), how (exactly 3 strings, each one concrete action for the coming days, starting with a verb, under 20 words, small enough to do in one sitting). Never invent things they did not write. No prose outside the JSON.`;

/** What the model is told: the numbers, then the notebook. */
export function reviewContext(f: WeekFacts, opts: { profile: Profile | null; plan: FounderPlan | null; week: PlanWeek; log: string }): string {
  const p = opts.profile;
  return [
    p ? `Founder: ${p.name || "unnamed"}. Goal: ${p.goal}. Pace: ${p.pace}. Tone asked for: ${p.tone}. Audience: ${p.audiences || "not given"}.` : "Founder: no profile.",
    opts.plan ? `Plan: ${opts.plan.headline} This week's goal: ${opts.plan.weeklyGoal}.` : "",
    `Week ${f.week}: ${f.focus}. Tasks: ${opts.week.do.map((d, i) => `${i + 1}. ${d}`).join(" ")}`,
    `The numbers: score ${weekScore(f)} of 100. Steps ticked ${f.stepsTicked} of ${f.steps}. Tasks finished ${f.tasksDone} of ${f.tasks}. Tasks with something written ${f.tasksWritten} of ${f.tasks} (${f.written} lines). Days active ${f.daysActive} of 7. Said did it ${f.did}, partly ${f.partly}, stuck ${f.stuck}. The week is ${f.over ? "over" : "still running"}.`,
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
