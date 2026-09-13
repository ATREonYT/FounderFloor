/**
 * WHAT THE FOUNDER HAS DONE, AS ONE PLAIN OBJECT.
 *
 * Everything the journey remembers about a person is in a JourneyState,
 * and the only way it changes is `apply(state, event)`, a pure function
 * that returns a new object and never touches the old one. That is what
 * lets the whole thing be tested without a browser, saved as one JSON
 * blob, exported, imported and sanitised on the way back in.
 *
 * Three things are kept separate on purpose, because the product's
 * honesty depends on it:
 *
 *   lessonDoneAt   the founder finished reading and answering in the app
 *   actionDoneAt   something happened in the world and they recorded it
 *   outputs        the lines they wrote, each labelled by what it is
 *
 * A lesson can be done with the action still pending for a month. That is
 * the normal case for the two missions that need a conversation or a test,
 * and nothing here nags about it.
 *
 * Points are for learning only, they are modest, and every mission earns
 * the same whether the founder's assumption survived or died. Nothing
 * resets, nothing is lost for being away, and there is no number here
 * that could be mistaken for how likely the business is to work.
 */
import { MISSIONS, STAGES, fieldFor, missionById, type EvidenceLabel, type Mission, type OutputKey, type StageId } from "./content.ts";
import { isoWeekKey } from "../weeks.ts";

export type FounderStage = "exploring" | "building" | "testing" | "unsure";

export interface Profile {
  /** What they are thinking of building. May be empty: "I'm not sure yet". */
  building: string;
  /** Who they think it would help. May be empty. */
  helps: string;
  stage: FounderStage;
  startedAt: string;
  /** The mission the app suggested they start on. They may ignore it. */
  suggested: string;
}

export interface MissionProgress {
  lessonDoneAt?: string;
  actionDoneAt?: string;
  reflection?: string;
  /** The one interaction: whether the first answer was the good one. */
  interactionRight?: boolean;
  interactionTries?: number;
}

export interface SavedLine {
  value: string | string[];
  label: EvidenceLabel;
  at: string;
  /** Which mission wrote it last. */
  by: string;
}

export interface Change {
  at: string;
  what: string;
  key?: OutputKey;
  /** The first line of the previous value, so a change is legible without storing everything twice. */
  from?: string;
}

export interface JourneyState {
  v: 1;
  profile: Profile | null;
  missions: Record<string, MissionProgress>;
  outputs: Partial<Record<OutputKey, SavedLine>>;
  history: Change[];
  points: number;
  /** Missions a week the founder chose to aim for. Null is "no goal", and is fine. */
  weeklyGoal: number | null;
  /** Days seen, as yyyy-mm-dd, newest last. For the greeting and the weekly goal, never for punishment. */
  visits: string[];
  /** Milestones already celebrated, so each is shown once. */
  celebrated: string[];
}

export const EMPTY: JourneyState = {
  v: 1,
  profile: null,
  missions: {},
  outputs: {},
  history: [],
  points: 0,
  weeklyGoal: null,
  visits: [],
  celebrated: [],
};

export const POINTS = { lesson: 10, interaction: 5 } as const;
/** History is a log of changes, not the changes themselves; the values live in outputs. */
const HISTORY_CAP = 300;

export type JourneyEvent =
  | { type: "onboard"; building: string; helps: string; stage: FounderStage; at: string }
  | { type: "visit"; at: string }
  | { type: "interaction"; mission: string; right: boolean; at: string }
  | { type: "save"; mission: string; key: OutputKey; value: string | string[]; at: string }
  | { type: "lesson-done"; mission: string; at: string }
  | { type: "action-done"; mission: string; at: string }
  | { type: "reflect"; mission: string; text: string; at: string }
  | { type: "edit-line"; key: OutputKey; value: string | string[]; at: string }
  | { type: "weekly-goal"; goal: number | null }
  | { type: "celebrated"; id: string }
  | { type: "reset" };

const day = (iso: string): string => iso.slice(0, 10);
const first = (v: string | string[] | undefined): string | undefined => {
  if (v === undefined) return undefined;
  const s = Array.isArray(v) ? v[0] ?? "" : v;
  return s.length > 80 ? `${s.slice(0, 77)}…` : s;
};
const isBlank = (v: string | string[]): boolean => (Array.isArray(v) ? v.every((x) => !x.trim()) : !v.trim());

function log(s: JourneyState, c: Change): Change[] {
  const clean: Change = { at: c.at, what: c.what };
  if (c.key !== undefined) clean.key = c.key;
  if (c.from !== undefined) clean.from = c.from;
  const h = [...s.history, clean];
  return h.length > HISTORY_CAP ? h.slice(h.length - HISTORY_CAP) : h;
}

/** Where to start, from the one question about where they are. They can change it. */
export function suggestStart(stage: FounderStage): string {
  switch (stage) {
    case "building":
      return "the-problem";
    case "testing":
      return "good-questions";
    default:
      return "say-it";
  }
}

export function apply(s: JourneyState, e: JourneyEvent): JourneyState {
  switch (e.type) {
    case "onboard": {
      const profile: Profile = {
        building: e.building.trim(),
        helps: e.helps.trim(),
        stage: e.stage,
        startedAt: e.at,
        suggested: suggestStart(e.stage),
      };
      let next: JourneyState = { ...s, profile, history: log(s, { at: e.at, what: "Started the journey" }) };
      // What they told us at the door is their first line, labelled as the guess it is.
      if (profile.building && !s.outputs.idea) {
        next = apply(next, { type: "save", mission: "say-it", key: "idea", value: profile.building, at: e.at });
      }
      return next;
    }
    case "visit": {
      const d = day(e.at);
      if (s.visits.at(-1) === d) return s;
      return { ...s, visits: [...s.visits, d].slice(-400) };
    }
    case "interaction": {
      if (!missionById(e.mission)) return s;
      const m = s.missions[e.mission] ?? {};
      const tries = (m.interactionTries ?? 0) + 1;
      const firstTry = tries === 1;
      const right = m.interactionRight || (firstTry && e.right);
      return {
        ...s,
        points: s.points + (firstTry && e.right ? POINTS.interaction : 0),
        missions: { ...s.missions, [e.mission]: { ...m, interactionTries: tries, interactionRight: right } },
      };
    }
    case "save": {
      const f = fieldFor(e.key);
      if (!f || !missionById(e.mission)) return s;
      const prev = s.outputs[e.key];
      const value = Array.isArray(e.value) ? e.value.map((x) => x.trim()).filter(Boolean) : e.value.trim();
      // Saving nothing over something is not a save; it would be a quiet deletion.
      if (isBlank(value) && prev && !isBlank(prev.value)) return s;
      const same = prev && JSON.stringify(prev.value) === JSON.stringify(value);
      if (same) return s;
      const line: SavedLine = { value, label: f.evidence, at: e.at, by: e.mission };
      return {
        ...s,
        outputs: { ...s.outputs, [e.key]: line },
        history: log(s, { at: e.at, what: prev ? `Changed ${f.label.toLowerCase()}` : `Wrote ${f.label.toLowerCase()}`, key: e.key, from: first(prev?.value) }),
      };
    }
    case "lesson-done": {
      const mission = missionById(e.mission);
      if (!mission) return s;
      const m = s.missions[e.mission] ?? {};
      if (m.lessonDoneAt) return s;
      return {
        ...s,
        points: s.points + POINTS.lesson,
        missions: { ...s.missions, [e.mission]: { ...m, lessonDoneAt: e.at } },
        history: log(s, { at: e.at, what: `Finished the lesson: ${mission.title}` }),
      };
    }
    case "action-done": {
      const mission = missionById(e.mission);
      if (!mission) return s;
      const m = s.missions[e.mission] ?? {};
      if (m.actionDoneAt) return s;
      return {
        ...s,
        missions: { ...s.missions, [e.mission]: { ...m, actionDoneAt: e.at } },
        history: log(s, { at: e.at, what: `Recorded real-world work: ${mission.title}` }),
      };
    }
    case "reflect": {
      if (!missionById(e.mission)) return s;
      const m = s.missions[e.mission] ?? {};
      const text = e.text.trim();
      if (!text || text === m.reflection) return s;
      return { ...s, missions: { ...s.missions, [e.mission]: { ...m, reflection: text } } };
    }
    case "edit-line": {
      const prev = s.outputs[e.key];
      const f = fieldFor(e.key);
      if (!f) return s;
      const value = Array.isArray(e.value) ? e.value.map((x) => x.trim()).filter(Boolean) : e.value.trim();
      if (prev && JSON.stringify(prev.value) === JSON.stringify(value)) return s;
      const line: SavedLine = { value, label: prev?.label ?? f.evidence, at: e.at, by: prev?.by ?? "idea-page" };
      return {
        ...s,
        outputs: { ...s.outputs, [e.key]: line },
        history: log(s, { at: e.at, what: `Edited ${f.label.toLowerCase()} on the idea page`, key: e.key, from: first(prev?.value) }),
      };
    }
    case "weekly-goal": {
      const goal = e.goal === null ? null : Math.max(1, Math.min(7, Math.round(e.goal)));
      return { ...s, weeklyGoal: goal };
    }
    case "celebrated":
      return s.celebrated.includes(e.id) ? s : { ...s, celebrated: [...s.celebrated, e.id] };
    case "reset":
      return EMPTY;
  }
}

// ─── reading the state ────────────────────────────────────────────────

export const lessonDone = (s: JourneyState, id: string): boolean => Boolean(s.missions[id]?.lessonDoneAt);
export const actionDone = (s: JourneyState, id: string): boolean => Boolean(s.missions[id]?.actionDoneAt);

/** Fully done: the lesson, and the outside action where there is one. */
export const missionDone = (s: JourneyState, m: Mission): boolean => lessonDone(s, m.id) && (!m.outside || actionDone(s, m.id));

/**
 * The next thing to do. Lessons come first in order; when every lesson is
 * read, the outside actions still pending come next; when everything is
 * done, null, and the home screen says so.
 */
export function nextMission(s: JourneyState): Mission | null {
  const unread = MISSIONS.find((m) => !lessonDone(s, m.id));
  if (unread) return unread;
  const pending = MISSIONS.find((m) => m.outside && !actionDone(s, m.id));
  return pending ?? null;
}

export type StageStatus = "done" | "current" | "later";

export interface Progress {
  learning: { done: number; total: number };
  practical: { done: number; total: number };
  stages: Record<StageId, StageStatus>;
  points: number;
}

export function progress(s: JourneyState): Progress {
  const learningDone = MISSIONS.filter((m) => lessonDone(s, m.id)).length;
  const outside = MISSIONS.filter((m) => m.outside);
  const practicalDone = outside.filter((m) => actionDone(s, m.id)).length;
  const next = nextMission(s);
  const stages = {} as Record<StageId, StageStatus>;
  for (const st of STAGES) {
    const ms = MISSIONS.filter((m) => m.stage === st.id);
    if (ms.every((m) => missionDone(s, m))) stages[st.id] = "done";
    else if (next && next.stage === st.id) stages[st.id] = "current";
    else if (ms.some((m) => lessonDone(s, m.id))) stages[st.id] = "current";
    else stages[st.id] = "later";
  }
  return { learning: { done: learningDone, total: MISSIONS.length }, practical: { done: practicalDone, total: outside.length }, stages, points: s.points };
}

/**
 * Milestones worth a brief celebration. Reaching one is computed from the
 * state, so it can never be awarded twice or awarded for nothing. The
 * last one is the point: stopping an idea with evidence is celebrated
 * exactly as much as anything else.
 */
export const MILESTONES: readonly { id: string; title: string; line: string }[] = [
  { id: "first-lesson", title: "First lesson done", line: "You have a sentence a stranger can repeat. That is more than most ideas ever get." },
  { id: "stage-problem", title: "Stage one complete", line: "You know what you know and what you are guessing. That is the whole trick." },
  { id: "first-conversation", title: "First real conversation recorded", line: "Written down the same day. This is evidence now, not a memory." },
  { id: "stage-people", title: "Stage two complete", line: "You let what people said change your mind. Most founders never get here." },
  { id: "first-test", title: "First test reviewed", line: "You defined it first and looked honestly afterwards. Whatever happened, that is the skill." },
  { id: "honest-stop", title: "Stopped with evidence", line: "You found out before you built it. That is the most valuable outcome this journey has." },
  { id: "stage-test", title: "The whole road, once", line: "Idea, people, test. Most walk it more than once, and it gets faster each time." },
];

export function reached(s: JourneyState): string[] {
  const p = progress(s);
  const out: string[] = [];
  if (p.learning.done >= 1) out.push("first-lesson");
  if (p.stages.problem === "done") out.push("stage-problem");
  if (actionDone(s, "record-one")) out.push("first-conversation");
  if (p.stages.people === "done") out.push("stage-people");
  if (actionDone(s, "review-test")) out.push("first-test");
  if (s.outputs.outcomeNext?.value === "stop") out.push("honest-stop");
  if (p.stages.test === "done") out.push("stage-test");
  return out;
}

/** The milestone to show now, if any: reached and not yet celebrated. */
export function toCelebrate(s: JourneyState): (typeof MILESTONES)[number] | null {
  const id = reached(s).find((r) => !s.celebrated.includes(r));
  return id ? MILESTONES.find((m) => m.id === id) ?? null : null;
}

/** Missions touched this week, for the optional goal. Counts lessons and recorded actions. */
export function weekActivity(s: JourneyState, now: string): { done: number; goal: number | null } {
  const wk = isoWeekKey(now);
  let done = 0;
  for (const m of Object.values(s.missions)) {
    if (m.lessonDoneAt && isoWeekKey(m.lessonDoneAt) === wk) done += 1;
    if (m.actionDoneAt && isoWeekKey(m.actionDoneAt) === wk) done += 1;
  }
  return { done, goal: s.weeklyGoal };
}

/**
 * What to say when they come back. It is warm and it is never a scolding:
 * a month away is "welcome back", not "you lost your streak", because the
 * founder this is for works evenings beside a job and will be away.
 */
export function greeting(s: JourneyState, now: string): string {
  const last = s.visits.at(-1);
  if (!last) return "Welcome. Start wherever you are.";
  const days = Math.round((Date.parse(day(now)) - Date.parse(last)) / 86_400_000);
  if (days <= 0) return "Back again. The next step is ready.";
  if (days === 1) return "Welcome back. Yesterday's work is still here.";
  if (days < 7) return "Welcome back. Everything is where you left it.";
  return "Welcome back. Nothing was lost while you were away. Pick up where you left off.";
}

// ─── loading from storage ─────────────────────────────────────────────

const LABELS: EvidenceLabel[] = ["assumption", "reported", "confirmed"];
const FSTAGES: FounderStage[] = ["exploring", "building", "testing", "unsure"];
const str = (v: unknown, max = 20_000): string => (typeof v === "string" ? v.slice(0, max) : "");
const iso = (v: unknown): string | undefined => (typeof v === "string" && !Number.isNaN(Date.parse(v)) ? v : undefined);

/**
 * Anything read from storage, a file, or another device goes through
 * here before it becomes state. Unknown missions and keys are dropped,
 * bad labels fall back to the field's own, and nothing throws: a corrupt
 * save is treated as a fresh start with a warning, never as a crash.
 */
export function sanitize(raw: unknown): JourneyState {
  if (!raw || typeof raw !== "object") return EMPTY;
  const r = raw as Record<string, unknown>;
  const out: JourneyState = { ...EMPTY, missions: {}, outputs: {}, history: [], visits: [], celebrated: [] };

  const p = r.profile as Record<string, unknown> | null | undefined;
  if (p && typeof p === "object") {
    const stage = FSTAGES.includes(p.stage as FounderStage) ? (p.stage as FounderStage) : "unsure";
    out.profile = {
      building: str(p.building, 600),
      helps: str(p.helps, 600),
      stage,
      startedAt: iso(p.startedAt) ?? new Date(0).toISOString(),
      suggested: missionById(str(p.suggested)) ? str(p.suggested) : suggestStart(stage),
    };
  }

  const ms = r.missions;
  if (ms && typeof ms === "object") {
    for (const [id, v] of Object.entries(ms as Record<string, unknown>)) {
      if (!missionById(id) || !v || typeof v !== "object") continue;
      const m = v as Record<string, unknown>;
      const mp: MissionProgress = {};
      const l = iso(m.lessonDoneAt);
      const a = iso(m.actionDoneAt);
      if (l) mp.lessonDoneAt = l;
      if (a) mp.actionDoneAt = a;
      if (typeof m.reflection === "string" && m.reflection.trim()) mp.reflection = str(m.reflection, 4000);
      if (typeof m.interactionRight === "boolean") mp.interactionRight = m.interactionRight;
      if (typeof m.interactionTries === "number" && m.interactionTries >= 0) mp.interactionTries = Math.floor(m.interactionTries);
      out.missions[id] = mp;
    }
  }

  const os = r.outputs;
  if (os && typeof os === "object") {
    for (const [key, v] of Object.entries(os as Record<string, unknown>)) {
      const f = fieldFor(key as OutputKey);
      if (!f || !v || typeof v !== "object") continue;
      const line = v as Record<string, unknown>;
      const value = Array.isArray(line.value) ? line.value.filter((x): x is string => typeof x === "string").map((x) => x.slice(0, 20_000)).slice(0, 200) : str(line.value);
      out.outputs[key as OutputKey] = {
        value,
        label: LABELS.includes(line.label as EvidenceLabel) ? (line.label as EvidenceLabel) : f.evidence,
        at: iso(line.at) ?? new Date(0).toISOString(),
        by: str(line.by, 60) || "unknown",
      };
    }
  }

  if (Array.isArray(r.history)) {
    out.history = r.history
      .filter((c): c is Record<string, unknown> => Boolean(c) && typeof c === "object")
      .map((c) => {
        const change: Change = { at: iso(c.at) ?? new Date(0).toISOString(), what: str(c.what, 200) };
        if (fieldFor(c.key as OutputKey)) change.key = c.key as OutputKey;
        if (typeof c.from === "string") change.from = c.from.slice(0, 80);
        return change;
      })
      .filter((c) => c.what)
      .slice(-HISTORY_CAP);
  }
  out.points = typeof r.points === "number" && Number.isFinite(r.points) && r.points >= 0 ? Math.floor(r.points) : 0;
  out.weeklyGoal = typeof r.weeklyGoal === "number" && r.weeklyGoal >= 1 && r.weeklyGoal <= 7 ? Math.round(r.weeklyGoal) : null;
  out.visits = Array.isArray(r.visits) ? r.visits.filter((d): d is string => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)).slice(-400) : [];
  out.celebrated = Array.isArray(r.celebrated) ? r.celebrated.filter((c): c is string => typeof c === "string" && MILESTONES.some((m) => m.id === c)) : [];
  return out;
}

/** Everything, as a file the founder can keep. */
export function exportJson(s: JourneyState): string {
  return JSON.stringify({ founderfloor: "journey", exported: new Date().toISOString(), state: s }, null, 2);
}

/** The reverse: a file back into state, or null if it is not one of ours. */
export function importJson(text: string): JourneyState | null {
  try {
    const parsed = JSON.parse(text) as { founderfloor?: unknown; state?: unknown };
    if (parsed && parsed.founderfloor === "journey" && parsed.state) return sanitize(parsed.state);
    return null;
  } catch {
    return null;
  }
}
