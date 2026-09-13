import test from "node:test";
import assert from "node:assert/strict";
import { SECTIONS, exerciseId } from "../src/course/content.ts";
import { UNITS, LESSONS, unitById, lessonById, unitsIn, unitAfter } from "../src/course/registry.ts";
import {
  EMPTY_COURSE, applyCourse, EXERCISES, exerciseById, exercisesOf, nextLesson, standing, unitDone,
  courseProgress, runOfDays, practiceSet, checkpointFor, sanitizeCourse, exportCourse, importCourse,
  GAPS, COURSE_POINTS, CHECKPOINT_SIZE,
} from "../src/course/state.ts";
import { fieldFor, missionById } from "../src/journey/content.ts";

const T = "2026-09-14T18:00:00.000Z";
const later = (days) => new Date(Date.parse(T) + days * 86400000).toISOString();
/** A deterministic rand so the shuffles are pinned. */
const seeded = (seed = 7) => () => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
};

// ─── the course holds together ──────────────────────────────────────

test("six sections, eighteen units, three per section, numbered in order", () => {
  assert.equal(SECTIONS.length, 6);
  assert.equal(UNITS.length, 18);
  assert.deepEqual(UNITS.map((u) => u.n), Array.from({ length: 18 }, (_, i) => i + 1));
  for (const s of SECTIONS) assert.equal(unitsIn(s.id).length, 3, `${s.id} has three units`);
  assert.equal(new Set(UNITS.map((u) => u.id)).size, 18);
  for (const u of UNITS) assert.match(u.id, /^[a-z-]+$/, u.id);
});

test("every unit: a guide, three basics and one depth, and a mission that exists if named", () => {
  for (const u of UNITS) {
    assert.ok(u.guide.length >= 3 && u.guide.every((p) => p.length > 60), `${u.id} guide`);
    assert.equal(u.lessons.length, 4, `${u.id} has four lessons`);
    assert.equal(u.lessons.filter((l) => l.depth).length, 1, `${u.id} has one depth lesson`);
    assert.ok(u.lessons.at(-1).depth, `${u.id} depth comes last`);
    assert.deepEqual(u.lessons.map((l) => l.n), [1, 2, 3, 4], `${u.id} lesson numbers`);
    for (const m of u.missions ?? []) assert.ok(missionById(m), `${u.id} mission ${m} exists`);
  }
});

test("every journey mission belongs to exactly one unit, in mission order", () => {
  const all = UNITS.flatMap((u) => u.missions ?? []);
  assert.equal(new Set(all).size, all.length, "no mission in two units");
  assert.equal(all.length, 10, "all ten missions are placed");
  const ns = all.map((id) => missionById(id).n);
  assert.deepEqual(ns, [...ns].sort((a, b) => a - b), "missions appear in their own order along the course");
});

test("lesson ids are unique across the whole course", () => {
  assert.equal(new Set(LESSONS.map((p) => p.lesson.id)).size, LESSONS.length);
  assert.equal(LESSONS.length, 72);
  for (const p of LESSONS) assert.match(p.lesson.id, /^[a-z0-9-]+$/, p.lesson.id);
});

test("every lesson: short to read, long to do, and a line to keep", () => {
  for (const { lesson: l, unit: u } of LESSONS) {
    const id = `${u.id}/${l.id}`;
    assert.ok(l.objective.length > 30, `${id} objective`);
    assert.ok(l.teach.length >= 2 && l.teach.length <= 4, `${id} teaches in 2–4 paragraphs`);
    assert.ok(l.teach.every((p) => p.length > 80), `${id} paragraphs have substance`);
    assert.ok(l.exercises.length >= 3 && l.exercises.length <= 6, `${id} has 3–6 exercises`);
    assert.ok(l.remember.length > 20 && l.remember.length < 200, `${id} remember line`);
    assert.ok(l.minutes >= 3 && l.minutes <= 8, `${id} minutes`);
    if (l.apply) {
      assert.ok(fieldFor(l.apply.key), `${id} apply key ${l.apply.key} is a real line on the idea page`);
      assert.ok(l.apply.prompt.length > 20 && l.apply.hint.length > 5, `${id} apply prompt and hint`);
    }
  }
});

test("every exercise is well-formed and explains itself", () => {
  for (const { lesson: l, unit: u } of LESSONS) {
    l.exercises.forEach((x, i) => {
      const id = `${u.id}/${l.id}#${i}`;
      assert.ok(x.prompt.length > 10, `${id} prompt`);
      switch (x.kind) {
        case "choose":
          assert.ok(x.options.length >= 2 && x.options.length <= 5, `${id} options`);
          assert.equal(x.options.filter((o) => o.good).length, 1, `${id} has exactly one good option`);
          for (const o of x.options) assert.ok(o.why.length > 3, `${id} every option has a why`);
          break;
        case "sort":
          assert.equal(x.buckets.length, 2, `${id} two buckets`);
          assert.ok(x.items.length >= 3, `${id} at least three items`);
          assert.ok(x.items.some((it) => it.bucket === 0) && x.items.some((it) => it.bucket === 1), `${id} uses both buckets`);
          for (const it of x.items) assert.ok(it.why.length > 3, `${id} every item has a why`);
          break;
        case "order":
          assert.ok(x.steps.length >= 3 && x.steps.length <= 6, `${id} 3–6 steps`);
          assert.ok(x.why.length > 10, `${id} why`);
          break;
        case "match":
          assert.ok(x.pairs.length >= 3 && x.pairs.length <= 5, `${id} 3–5 pairs`);
          assert.equal(new Set(x.pairs.map((p) => p.term)).size, x.pairs.length, `${id} terms distinct`);
          assert.equal(new Set(x.pairs.map((p) => p.meaning)).size, x.pairs.length, `${id} meanings distinct`);
          break;
        case "fill":
          assert.ok(x.options.length >= 3, `${id} options`);
          assert.ok(Number.isInteger(x.answer) && x.answer >= 0 && x.answer < x.options.length, `${id} answer in range`);
          assert.ok(x.why.length > 10, `${id} why`);
          break;
        case "edit":
          assert.ok(x.before.length > 5 && x.better.length >= 2, `${id} before and betters`);
          break;
        default:
          assert.fail(`${id} unknown kind ${x.kind}`);
      }
    });
  }
});

test("the voice: no exclamation marks, no promises, 'validated' only to be corrected", () => {
  const text = JSON.stringify(UNITS);
  assert.ok(!text.includes("!"), "no exclamation marks anywhere in the course");
  assert.ok(!/\b(guaranteed|will succeed|can't fail|cannot fail to)\b/i.test(text), "no promises");
  // 'validated' may appear, but only where the surrounding words push back on it.
  for (const m of text.matchAll(/\bvalidated\b/gi)) {
    const window = text.slice(Math.max(0, m.index - 200), m.index + 200);
    assert.ok(/no such|not a|is not|there is no|nothing is|never|only|correct|wrong|assum|observ|feel good/i.test(window), `'validated' is corrected: ${window}`);
  }
});

test("the registry finds things", () => {
  assert.equal(unitById("what-it-is")?.n, 1);
  assert.equal(unitById("raise-or-not")?.n, 18);
  assert.equal(unitById("nope"), undefined);
  assert.equal(lessonById("growth-is-the-word")?.index, 0);
  assert.equal(lessonById("depth-decision")?.index, 71);
  assert.equal(unitAfter("what-it-is")?.id, "good-idea");
  assert.equal(unitAfter("raise-or-not"), null);
  assert.equal(EXERCISES.length, LESSONS.reduce((n, p) => n + p.lesson.exercises.length, 0));
  assert.equal(exerciseById(exerciseId("growth-is-the-word", 0))?.lesson.id, "growth-is-the-word");
  assert.equal(exercisesOf(lessonById("the-wedge").lesson).length, lessonById("the-wedge").lesson.exercises.length);
});

// ─── the engine ─────────────────────────────────────────────────────

test("a fresh learner starts at the first lesson; the first unit is current and the rest are locked", () => {
  const s = EMPTY_COURSE;
  assert.equal(nextLesson(s)?.lesson.id, "growth-is-the-word");
  assert.equal(standing(s, UNITS[0]), "current");
  assert.equal(standing(s, UNITS[1]), "locked");
  assert.equal(standing(s, UNITS[17]), "locked");
  assert.equal(courseProgress(s, T).share, 0);
});

test("finishing lessons earns points once, keeps the better score, and moves the next lesson on", () => {
  let s = applyCourse(EMPTY_COURSE, { type: "lesson-done", lesson: "growth-is-the-word", right: 3, total: 4, at: T });
  assert.equal(s.points, COURSE_POINTS.lesson);
  assert.equal(nextLesson(s)?.lesson.id, "a-search-not-a-plan");
  const again = applyCourse(s, { type: "lesson-done", lesson: "growth-is-the-word", right: 2, total: 4, at: later(1) });
  assert.equal(again, s, "a worse retake changes nothing");
  const better = applyCourse(s, { type: "lesson-done", lesson: "growth-is-the-word", right: 4, total: 4, at: later(1) });
  assert.equal(better.lessons["growth-is-the-word"].right, 4);
  assert.equal(better.points, COURSE_POINTS.lesson, "no points for a retake");
  assert.equal(better.lessons["growth-is-the-word"].doneAt, T, "first finish date kept");
  const perfect = applyCourse(EMPTY_COURSE, { type: "lesson-done", lesson: "growth-is-the-word", right: 4, total: 4, at: T });
  assert.equal(perfect.points, COURSE_POINTS.lesson + COURSE_POINTS.perfect);
  assert.equal(applyCourse(EMPTY_COURSE, { type: "lesson-done", lesson: "nope", right: 1, total: 1, at: T }), EMPTY_COURSE);
});

test("finishing every lesson of a unit makes it done and the next one current", () => {
  let s = EMPTY_COURSE;
  for (const l of UNITS[0].lessons) s = applyCourse(s, { type: "lesson-done", lesson: l.id, right: 4, total: 4, at: T });
  assert.ok(unitDone(s, UNITS[0]));
  assert.equal(standing(s, UNITS[0]), "done");
  assert.equal(standing(s, UNITS[1]), "current");
  assert.equal(standing(s, UNITS[2]), "locked");
  assert.equal(nextLesson(s)?.unit.id, UNITS[1].id);
  assert.equal(courseProgress(s, T).unitsDone, 1);
});

test("answers build a memory on a widening schedule; a miss drops to box 0 and is due tomorrow", () => {
  const x = exerciseId("growth-is-the-word", 0);
  let s = applyCourse(EMPTY_COURSE, { type: "answer", exercise: x, right: true, at: T });
  assert.equal(s.memory[x].box, 1);
  assert.equal(s.memory[x].due, later(GAPS[1]));
  s = applyCourse(s, { type: "answer", exercise: x, right: true, at: later(3) });
  assert.equal(s.memory[x].box, 2);
  assert.equal(s.memory[x].due, new Date(Date.parse(later(3)) + GAPS[2] * 86400000).toISOString());
  s = applyCourse(s, { type: "answer", exercise: x, right: false, at: later(10) });
  assert.equal(s.memory[x].box, 0);
  assert.equal(s.memory[x].lastRight, false);
  assert.equal(s.memory[x].due, new Date(Date.parse(later(10)) + GAPS[0] * 86400000).toISOString());
  assert.equal(s.memory[x].seen, 3);
  assert.equal(s.memory[x].right, 2);
  // the box never runs off the end of the table
  for (let i = 0; i < 10; i += 1) s = applyCourse(s, { type: "answer", exercise: x, right: true, at: later(20 + i) });
  assert.equal(s.memory[x].box, GAPS.length - 1);
  assert.equal(applyCourse(EMPTY_COURSE, { type: "answer", exercise: "nope.0", right: true, at: T }), EMPTY_COURSE);
});

test("practice only asks about lessons already sat, and puts mistakes first", () => {
  assert.deepEqual(practiceSet(EMPTY_COURSE, T, seeded()), [], "nothing to practise before any lesson");
  let s = EMPTY_COURSE;
  for (const l of UNITS[0].lessons.slice(0, 2)) {
    s = applyCourse(s, { type: "lesson-done", lesson: l.id, right: 4, total: 4, at: T });
    for (const x of exercisesOf(l)) s = applyCourse(s, { type: "answer", exercise: x.id, right: true, at: T });
  }
  const missed = exerciseId("a-search-not-a-plan", 2);
  s = applyCourse(s, { type: "answer", exercise: missed, right: false, at: T });
  const set = practiceSet(s, later(0.5), seeded());
  assert.ok(set.length > 0 && set.length <= 8);
  assert.equal(set[0].id, missed, "the mistake comes first");
  assert.ok(set.every((x) => ["growth-is-the-word", "a-search-not-a-plan"].includes(x.lesson.id)), "only from lessons sat");
  // mixed: no two neighbours from the same lesson where the pool allows it
  for (let i = 1; i < set.length; i += 1) assert.notEqual(set[i].lesson.id, set[i - 1].lesson.id, `interleaved at ${i}`);
  // due items come before not-yet-due ones
  const dueSet = practiceSet(s, later(5), seeded());
  const firstNotDue = dueSet.findIndex((x) => s.memory[x.id]?.due > later(5));
  const lastDue = dueSet.map((x) => s.memory[x.id]?.due <= later(5)).lastIndexOf(true);
  if (firstNotDue >= 0) assert.ok(lastDue < firstNotDue || dueSet.length <= 2, "due before not due");
});

test("a checkpoint draws across every lesson in the unit and is passed at four in five", () => {
  const u = UNITS[3];
  const cp = checkpointFor(u, seeded());
  assert.equal(cp.length, CHECKPOINT_SIZE);
  assert.equal(new Set(cp.map((x) => x.id)).size, cp.length, "no repeats");
  for (const l of u.lessons) assert.ok(cp.some((x) => x.lesson.id === l.id), `${l.id} represented`);
  assert.ok(cp.some((x) => x.lesson.depth), "the depth lesson is in the checkpoint");
  let s = applyCourse(EMPTY_COURSE, { type: "checkpoint", unit: u.id, right: 7, total: 10, at: T });
  assert.equal(s.checkpoints[u.id].passed, false);
  assert.equal(s.points, 0);
  assert.equal(standing(s, u), "locked");
  s = applyCourse(s, { type: "checkpoint", unit: u.id, right: 8, total: 10, at: later(1) });
  assert.equal(s.checkpoints[u.id].passed, true);
  assert.equal(s.points, COURSE_POINTS.checkpoint);
  assert.equal(standing(s, u), "done", "a passed checkpoint is the unit done, lessons unsat");
  assert.equal(nextLesson(s)?.unit.id, UNITS[0].id, "the first unit is still the next thing to do");
  // a later fail does not take it away, and no points twice
  s = applyCourse(s, { type: "checkpoint", unit: u.id, right: 2, total: 10, at: later(2) });
  assert.equal(s.checkpoints[u.id].passed, true);
  assert.equal(s.points, COURSE_POINTS.checkpoint);
  assert.equal(applyCourse(EMPTY_COURSE, { type: "checkpoint", unit: "nope", right: 9, total: 10, at: T }), EMPTY_COURSE);
});

test("passing a unit's checkpoint skips its lessons in the path", () => {
  let s = EMPTY_COURSE;
  for (const l of UNITS[0].lessons) s = applyCourse(s, { type: "lesson-done", lesson: l.id, right: 4, total: 4, at: T });
  s = applyCourse(s, { type: "checkpoint", unit: UNITS[1].id, right: 10, total: 10, at: T });
  assert.equal(nextLesson(s)?.unit.id, UNITS[2].id);
  assert.equal(standing(s, UNITS[2]), "current");
});

test("days practised only ever count up; the run is informational and a gap simply ends it", () => {
  let s = applyCourse(EMPTY_COURSE, { type: "practice-done", at: T });
  s = applyCourse(s, { type: "practice-done", at: later(1) });
  s = applyCourse(s, { type: "practice-done", at: later(2) });
  assert.equal(s.days.length, 3);
  assert.equal(s.points, 3 * COURSE_POINTS.practice);
  assert.equal(runOfDays(s.days, later(2)), 3);
  assert.equal(runOfDays(s.days, later(3)), 3, "yesterday still counts");
  assert.equal(runOfDays(s.days, later(5)), 0, "a gap ends the run and nothing else happens");
  assert.equal(runOfDays([], T), 0);
  const p = courseProgress(s, later(2));
  assert.equal(p.run, 3);
  assert.equal(p.lessonsTotal, 72);
  assert.equal(p.unitsTotal, 18);
});

test("progress counts what is due and what is weak", () => {
  let s = EMPTY_COURSE;
  const l = UNITS[0].lessons[0];
  s = applyCourse(s, { type: "lesson-done", lesson: l.id, right: 4, total: 4, at: T });
  const xs = exercisesOf(l);
  s = applyCourse(s, { type: "answer", exercise: xs[0].id, right: true, at: T });
  s = applyCourse(s, { type: "answer", exercise: xs[1].id, right: false, at: T });
  const now = courseProgress(s, T);
  assert.equal(now.due, 0);
  assert.equal(now.weak, 1);
  assert.equal(courseProgress(s, later(1.1)).due, 1, "the missed one (box 0) is due tomorrow");
  assert.equal(courseProgress(s, later(3.1)).due, 2, "the right one (box 1) is due after three days");
});

test("state survives a round trip and rejects junk piece by piece", () => {
  let s = EMPTY_COURSE;
  s = applyCourse(s, { type: "lesson-done", lesson: "growth-is-the-word", right: 3, total: 4, at: T });
  s = applyCourse(s, { type: "answer", exercise: exerciseId("growth-is-the-word", 1), right: true, at: T });
  s = applyCourse(s, { type: "checkpoint", unit: "what-it-is", right: 9, total: 10, at: T });
  assert.deepEqual(importCourse(exportCourse(s)), s);
  assert.equal(importCourse("{not json"), null);
  assert.deepEqual(sanitizeCourse(null), EMPTY_COURSE);
  assert.deepEqual(sanitizeCourse("x"), EMPTY_COURSE);
  const junk = sanitizeCourse({
    v: 1,
    lessons: { "growth-is-the-word": { doneAt: T, right: 99, total: 99 }, nope: { doneAt: T, right: 1, total: 1 }, "the-wedge": "bad" },
    memory: { [exerciseId("the-wedge", 0)]: { box: 40, due: T, seen: -3, right: 2, lastRight: "yes" }, "nope.0": { box: 1, due: T } },
    checkpoints: { "what-it-is": { at: T, right: 12, total: 10, passed: true }, nope: { at: T, right: 1, total: 1, passed: true } },
    points: -5,
    days: ["2026-09-14", "junk", 3],
  });
  assert.deepEqual(Object.keys(junk.lessons), ["growth-is-the-word"]);
  assert.equal(junk.lessons["growth-is-the-word"].total, 4, "total clamped to the lesson's exercises");
  assert.equal(junk.lessons["growth-is-the-word"].right, 4);
  assert.deepEqual(Object.keys(junk.memory), [exerciseId("the-wedge", 0)]);
  assert.equal(junk.memory[exerciseId("the-wedge", 0)].box, GAPS.length - 1);
  assert.equal(junk.memory[exerciseId("the-wedge", 0)].seen, 0);
  assert.equal(junk.memory[exerciseId("the-wedge", 0)].lastRight, false);
  assert.deepEqual(Object.keys(junk.checkpoints), ["what-it-is"]);
  assert.equal(junk.checkpoints["what-it-is"].right, 10);
  assert.equal(junk.points, 0);
  assert.deepEqual(junk.days, ["2026-09-14"]);
  assert.deepEqual(applyCourse(s, { type: "reset" }), EMPTY_COURSE);
});
