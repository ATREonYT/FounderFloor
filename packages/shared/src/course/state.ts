/**
 * WHAT THE LEARNER HAS DONE, AND WHAT TO SHOW THEM NEXT.
 *
 * A CourseState is one plain object, changed only by `apply(state,
 * event)`, which is pure. Same shape as the journey's state, for the same
 * reasons: testable with no browser, saved as one blob, sanitised on the
 * way back in.
 *
 * The engine is the part of this product that is copied from what works
 * rather than from what looks nice. Two findings carry it:
 *
 *   Practice testing beats rereading (Dunlosky et al. 2013, high
 *   utility), so a lesson is not done until its exercises are answered,
 *   and "practice" means being asked again, not shown again.
 *
 *   Spacing beats massing (same review, high utility), so every
 *   exercise a learner has met has a memory: a box from 0 to 5 and a
 *   date it is due. Right moves it up a box and doubles-ish the gap
 *   (1, 3, 7, 14, 30 days); wrong drops it to box 0 and it is due
 *   tomorrow, and it is put at the front of the next practice set.
 *   That is a Leitner system, which is what Duolingo's half-life model
 *   is a smoother version of, and the plain version is enough here.
 *
 * A checkpoint is a mixed test drawn from a unit's exercises. Pass it
 * (four in five right) and the unit is yours, whether or not you sat
 * its lessons — that is how somebody who already knows this part jumps
 * ahead, and it is the only place a score changes what you see.
 *
 * Nothing here punishes. There are no lives, nothing resets for being
 * away, and the streak is a count of days practised that only ever
 * goes up. Points are for finishing lessons and are modest.
 */
import { exerciseId, type Exercise, type Lesson, type Unit } from "./content.ts";
import { LESSONS, UNITS, lessonById, unitById, type Placed } from "./registry.ts";

export interface Memory {
  /** Leitner box, 0 (just missed or new) to 5 (known). */
  box: number;
  /** ISO date it is due for practice. */
  due: string;
  seen: number;
  right: number;
  /** Was the last answer right. Mistakes go to the front of the next practice. */
  lastRight: boolean;
}

export interface LessonResult {
  doneAt: string;
  /** Exercises right on the first go, out of the total. */
  right: number;
  total: number;
}

export interface CheckpointResult {
  at: string;
  right: number;
  total: number;
  passed: boolean;
}

export interface CourseState {
  v: 1;
  lessons: Record<string, LessonResult>;
  memory: Record<string, Memory>;
  checkpoints: Record<string, CheckpointResult>;
  points: number;
  /** Days on which something was practised, yyyy-mm-dd, newest last. */
  days: string[];
}

export const EMPTY_COURSE: CourseState = { v: 1, lessons: {}, memory: {}, checkpoints: {}, points: 0, days: [] };

export const COURSE_POINTS = { lesson: 10, perfect: 5, practice: 2, checkpoint: 20 } as const;

/** Days until the next practice, by box. Box 5 and above: a month. */
export const GAPS = [1, 3, 7, 14, 30, 30] as const;
export const CHECKPOINT_SIZE = 10;
export const CHECKPOINT_PASS = 0.8;
export const PRACTICE_SIZE = 8;

export type CourseEvent =
  | { type: "answer"; exercise: string; right: boolean; at: string }
  | { type: "lesson-done"; lesson: string; right: number; total: number; at: string }
  | { type: "practice-done"; at: string }
  | { type: "checkpoint"; unit: string; right: number; total: number; at: string }
  | { type: "reset" };

const day = (iso: string): string => iso.slice(0, 10);

function plusDays(iso: string, n: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString();
}

function remember(m: Memory | undefined, right: boolean, at: string): Memory {
  const box = right ? Math.min((m?.box ?? 0) + 1, GAPS.length - 1) : 0;
  return {
    box,
    due: plusDays(at, GAPS[box]),
    seen: (m?.seen ?? 0) + 1,
    right: (m?.right ?? 0) + (right ? 1 : 0),
    lastRight: right,
  };
}

function markDay(days: string[], at: string): string[] {
  const d = day(at);
  return days.at(-1) === d ? days : [...days, d].slice(-400);
}

export function applyCourse(s: CourseState, e: CourseEvent): CourseState {
  switch (e.type) {
    case "answer": {
      if (!exerciseById(e.exercise)) return s;
      return { ...s, memory: { ...s.memory, [e.exercise]: remember(s.memory[e.exercise], e.right, e.at) }, days: markDay(s.days, e.at) };
    }
    case "lesson-done": {
      const p = lessonById(e.lesson);
      if (!p) return s;
      const total = Math.max(1, Math.min(e.total, p.lesson.exercises.length));
      const right = Math.max(0, Math.min(e.right, total));
      const already = s.lessons[e.lesson];
      // Sitting a lesson again keeps the better score and earns nothing twice.
      if (already) {
        if (right <= already.right) return s;
        return { ...s, lessons: { ...s.lessons, [e.lesson]: { ...already, right, total } } };
      }
      const perfect = right === total;
      return {
        ...s,
        lessons: { ...s.lessons, [e.lesson]: { doneAt: e.at, right, total } },
        points: s.points + COURSE_POINTS.lesson + (perfect ? COURSE_POINTS.perfect : 0),
        days: markDay(s.days, e.at),
      };
    }
    case "practice-done":
      return { ...s, points: s.points + COURSE_POINTS.practice, days: markDay(s.days, e.at) };
    case "checkpoint": {
      const u = unitById(e.unit);
      if (!u) return s;
      const total = Math.max(1, e.total);
      const right = Math.max(0, Math.min(e.right, total));
      const passed = right / total >= CHECKPOINT_PASS;
      const before = s.checkpoints[e.unit];
      const firstPass = passed && !before?.passed;
      return {
        ...s,
        checkpoints: { ...s.checkpoints, [e.unit]: { at: e.at, right, total, passed: passed || Boolean(before?.passed) } },
        points: s.points + (firstPass ? COURSE_POINTS.checkpoint : 0),
        days: markDay(s.days, e.at),
      };
    }
    case "reset":
      return EMPTY_COURSE;
  }
}

// ─── exercises by id ──────────────────────────────────────────────────

export interface PlacedExercise extends Placed {
  id: string;
  exercise: Exercise;
}

const exerciseIndex = new Map<string, PlacedExercise>();
for (const p of LESSONS) {
  p.lesson.exercises.forEach((exercise, i) => {
    const id = exerciseId(p.lesson.id, i);
    exerciseIndex.set(id, { ...p, id, exercise });
  });
}

export const EXERCISES: readonly PlacedExercise[] = [...exerciseIndex.values()];
export const exerciseById = (id: string): PlacedExercise | undefined => exerciseIndex.get(id);
export const exercisesOf = (lesson: Lesson): PlacedExercise[] => lesson.exercises.map((_, i) => exerciseIndex.get(exerciseId(lesson.id, i))!);

// ─── reading the state ────────────────────────────────────────────────

export const lessonDone = (s: CourseState, id: string): boolean => Boolean(s.lessons[id]);
export const unitPassed = (s: CourseState, id: string): boolean => Boolean(s.checkpoints[id]?.passed);

/** A unit is done when every lesson is, or its checkpoint was passed. */
export const unitDone = (s: CourseState, u: Unit): boolean => unitPassed(s, u.id) || u.lessons.every((l) => lessonDone(s, l.id));

/**
 * What a unit looks like from the path: locked units are the ones after
 * the first unfinished one. Locked is a suggestion, not a wall; the
 * checkpoint on any unit is always open, and passing it opens the unit.
 */
export type UnitStanding = "done" | "current" | "open" | "locked";

export function standing(s: CourseState, u: Unit): UnitStanding {
  if (unitDone(s, u)) return "done";
  const i = UNITS.findIndex((x) => x.id === u.id);
  const firstOpen = UNITS.findIndex((x) => !unitDone(s, x));
  if (i === firstOpen) return "current";
  // Anything with a lesson started is open even if it is ahead.
  if (u.lessons.some((l) => lessonDone(s, l.id))) return "open";
  return i < firstOpen ? "open" : "locked";
}

/** The next lesson to sit: the first unfinished lesson in the first unfinished unit. */
export function nextLesson(s: CourseState): Placed | null {
  for (const u of UNITS) {
    if (unitPassed(s, u.id)) continue;
    const l = u.lessons.find((x) => !lessonDone(s, x.id));
    if (l) return lessonById(l.id) ?? null;
  }
  return null;
}

export interface Progress {
  lessonsDone: number;
  lessonsTotal: number;
  unitsDone: number;
  unitsTotal: number;
  /** Exercises due for practice today. */
  due: number;
  /** Exercises answered wrong last time. */
  weak: number;
  /** Consecutive days practised, ending today or yesterday. Only ever informational. */
  run: number;
  points: number;
  /** 0 to 1. */
  share: number;
}

export function courseProgress(s: CourseState, now: string): Progress {
  const lessonsDone = LESSONS.filter((p) => lessonDone(s, p.lesson.id)).length;
  const unitsDone = UNITS.filter((u) => unitDone(s, u)).length;
  const mem = Object.values(s.memory);
  return {
    lessonsDone,
    lessonsTotal: LESSONS.length,
    unitsDone,
    unitsTotal: UNITS.length,
    due: mem.filter((m) => m.due <= now).length,
    weak: mem.filter((m) => !m.lastRight).length,
    run: runOfDays(s.days, now),
    points: s.points,
    share: LESSONS.length ? lessonsDone / LESSONS.length : 0,
  };
}

/** Days in a row, counting back from today or yesterday. A gap ends it and nothing else happens. */
export function runOfDays(days: string[], now: string): number {
  if (!days.length) return 0;
  const set = new Set(days);
  let cursor = day(now);
  if (!set.has(cursor)) {
    cursor = day(plusDays(`${cursor}T12:00:00.000Z`, -1));
    if (!set.has(cursor)) return 0;
  }
  let n = 0;
  while (set.has(cursor)) {
    n += 1;
    cursor = day(plusDays(`${cursor}T12:00:00.000Z`, -1));
  }
  return n;
}

// ─── practice and checkpoints ─────────────────────────────────────────

/** A stable shuffle so tests can pin it; callers pass Math.random in the app. */
export type Rand = () => number;

function shuffle<T>(xs: T[], rand: Rand): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** No two exercises from the same lesson next to each other, where possible. */
function interleave(xs: PlacedExercise[]): PlacedExercise[] {
  const out: PlacedExercise[] = [];
  const pool = [...xs];
  while (pool.length) {
    const last = out.at(-1);
    let i = pool.findIndex((x) => x.lesson.id !== last?.lesson.id);
    if (i < 0) i = 0;
    out.push(pool[i]);
    pool.splice(i, 1);
  }
  return out;
}

/**
 * Today's practice: what was missed first, then what is due, then the
 * oldest thing the learner has met, mixed across lessons. Only from
 * lessons already sat, so practice never teaches; it only asks.
 */
export function practiceSet(s: CourseState, now: string, rand: Rand = Math.random, size = PRACTICE_SIZE): PlacedExercise[] {
  const met = EXERCISES.filter((x) => lessonDone(s, x.lesson.id));
  if (!met.length) return [];
  const mem = (x: PlacedExercise) => s.memory[x.id];
  const weak = met.filter((x) => mem(x) && !mem(x).lastRight);
  const due = met.filter((x) => mem(x) && mem(x).lastRight && mem(x).due <= now);
  const rest = met.filter((x) => !weak.includes(x) && !due.includes(x));
  // The rest ordered by how long since they were seen, unseen first.
  const restSorted = rest.sort((a, b) => (mem(a)?.due ?? "").localeCompare(mem(b)?.due ?? ""));
  const picked = [...shuffle(weak, rand), ...shuffle(due, rand), ...restSorted].slice(0, size);
  return interleave(picked);
}

/**
 * A unit's checkpoint: ten exercises drawn across all its lessons, the
 * depth lesson included, so that passing it means knowing the unit and
 * not one lesson of it.
 */
export function checkpointFor(u: Unit, rand: Rand = Math.random, size = CHECKPOINT_SIZE): PlacedExercise[] {
  const perLesson = u.lessons.map((l) => shuffle(exercisesOf(l), rand));
  const out: PlacedExercise[] = [];
  let round = 0;
  while (out.length < size && perLesson.some((xs) => xs.length > round)) {
    for (const xs of perLesson) {
      if (out.length >= size) break;
      if (xs[round]) out.push(xs[round]);
    }
    round += 1;
  }
  return interleave(out);
}

// ─── save and load ────────────────────────────────────────────────────

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isoish = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v);
const int = (v: unknown, lo: number, hi: number): number => (typeof v === "number" && Number.isFinite(v) ? Math.max(lo, Math.min(hi, Math.round(v))) : lo);

/** Anything that came out of storage, made into a CourseState or thrown away piece by piece. */
export function sanitizeCourse(raw: unknown): CourseState {
  if (!isRecord(raw)) return EMPTY_COURSE;
  const out: CourseState = { ...EMPTY_COURSE, lessons: {}, memory: {}, checkpoints: {}, days: [] };
  if (isRecord(raw.lessons)) {
    for (const [id, v] of Object.entries(raw.lessons)) {
      const p = lessonById(id);
      if (!p || !isRecord(v) || !isoish(v.doneAt)) continue;
      const total = int(v.total, 1, p.lesson.exercises.length);
      out.lessons[id] = { doneAt: v.doneAt, right: int(v.right, 0, total), total };
    }
  }
  if (isRecord(raw.memory)) {
    for (const [id, v] of Object.entries(raw.memory)) {
      if (!exerciseById(id) || !isRecord(v) || !isoish(v.due)) continue;
      out.memory[id] = { box: int(v.box, 0, GAPS.length - 1), due: v.due, seen: int(v.seen, 0, 1e6), right: int(v.right, 0, 1e6), lastRight: v.lastRight === true };
    }
  }
  if (isRecord(raw.checkpoints)) {
    for (const [id, v] of Object.entries(raw.checkpoints)) {
      if (!unitById(id) || !isRecord(v) || !isoish(v.at)) continue;
      const total = int(v.total, 1, 1e4);
      out.checkpoints[id] = { at: v.at, right: int(v.right, 0, total), total, passed: v.passed === true };
    }
  }
  out.points = int(raw.points, 0, 1e7);
  if (Array.isArray(raw.days)) out.days = raw.days.filter((d): d is string => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)).slice(-400);
  return out;
}

export const exportCourse = (s: CourseState): string => JSON.stringify(s, null, 2);

export function importCourse(text: string): CourseState | null {
  try {
    return sanitizeCourse(JSON.parse(text));
  } catch {
    return null;
  }
}
