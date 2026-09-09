import test from "node:test";
import assert from "node:assert/strict";
import { weekFacts, weekScore, verdictFor, localReview, asReview, reviewContext, REVIEW_PROMPT, weekWindow } from "../src/review.ts";
import { stepOpener, STEP_DESK_PROMPT } from "../src/tasks.ts";

const P = { name: "Alex", standing: "itch", likes: [], audiences: "café owners", goal: "first-customer", horizon: "3m", pace: "evenings", tone: "direct", budget: 0, at: "2026-09-01T08:00:00.000Z" };
const W = { n: 1, focus: "Find the problem", do: ["Pick the people you know best", "Ask five of them what wastes their week", "Write down the exact words they use"] };
const e = (kind, text, task, at) => ({ id: Math.random().toString(36), at, kind, text, task });

test("the facts count ticks, words and days for one week only", () => {
  const tasks = { "1-0": { guide: { steps: [1, 2, 3, 4] }, ticks: [0, 1, 2, 3], outcome: { how: "did" } }, "1-1": { guide: { steps: [1, 2, 3, 4] }, ticks: [0, 1] } };
  const memory = [e("work", "Maria, Kostas", "1-0", "2026-09-02T10:00:00.000Z"), e("did", "Listed", "1-0", "2026-09-02T10:01:00.000Z"), e("work", "Kostas said no", "1-1", "2026-09-04T19:00:00.000Z"), e("work", "next week thing", "2-0", "2026-09-09T10:00:00.000Z")];
  const f = weekFacts(W, { profile: P, planDone: ["1-0"], tasks, memory }, new Date("2026-09-05T00:00:00.000Z").getTime());
  assert.equal(f.tasks, 3);
  assert.equal(f.tasksDone, 1);
  assert.equal(f.steps, 9); // 4 + 4 + one for the task without a page
  assert.equal(f.stepsTicked, 6);
  assert.equal(f.written, 2);
  assert.equal(f.tasksWritten, 2);
  assert.equal(f.daysActive, 2);
  assert.equal(f.did, 1);
  assert.equal(f.over, false);
  assert.equal(weekFacts(W, { profile: P, planDone: [], tasks: {}, memory: [] }, new Date("2026-09-20").getTime()).over, true);
  const w = weekWindow(P, 2);
  assert.equal(new Date(w.from).toISOString(), "2026-09-08T08:00:00.000Z");
});

test("the score is the app's opinion and cannot be flattered", () => {
  const f = { week: 1, focus: "x", tasks: 3, tasksDone: 3, steps: 12, stepsTicked: 12, written: 6, tasksWritten: 3, daysActive: 5, did: 3, partly: 0, stuck: 0, over: true };
  assert.equal(weekScore(f), 100);
  assert.equal(weekScore({ ...f, stepsTicked: 0, tasksDone: 0, tasksWritten: 0, written: 0, daysActive: 0 }), 0);
  assert.equal(weekScore({ ...f, stepsTicked: 6, tasksWritten: 1, daysActive: 2 }), Math.round((0.55 * 0.5 + 0.25 / 3 + 0.2 * 0.5) * 100));
  assert.equal(verdictFor(90), "Strong week");
  assert.equal(verdictFor(50), "Half a week");
  assert.equal(verdictFor(0), "Not started");
  const flattered = asReview({ score: 100, verdict: "Amazing", line: "Wow.", well: ["a"], fix: ["b"], how: ["c", "d", "e"] }, { ...f, stepsTicked: 0, tasksWritten: 0, daysActive: 0 });
  assert.equal(flattered.score, 0);
  assert.equal(asReview({ verdict: "x", line: "y", well: [], fix: ["b"], how: ["c", "d"] }, f), null);
});

test("the local reading is specific to the numbers, and the context carries them", () => {
  const f = { week: 1, focus: "Find the problem.", tasks: 3, tasksDone: 1, steps: 9, stepsTicked: 6, written: 2, tasksWritten: 2, daysActive: 2, did: 1, partly: 0, stuck: 1, over: true };
  const r = localReview(f, P);
  assert.equal(r.score, weekScore(f));
  assert.match(r.well[0], /6 of 9 steps/);
  assert.ok(r.fix.some((x) => /3 steps are still open/.test(x)));
  assert.ok(r.fix.some((x) => /Only 2 days/.test(x)));
  assert.equal(r.how.length, 3);
  assert.match(r.line, /^Alex,/);
  const c = reviewContext(f, { profile: P, plan: null, week: { n: 1, focus: "Find the problem.", do: ["a", "b", "c"] }, log: "" });
  assert.match(c, /score \d+ of 100/);
  assert.match(c, /notebook is empty/);
  assert.match(REVIEW_PROMPT, /do not change it/);
  assert.match(stepOpener("talk", { do: "Ask five people", tip: "" }), /Who did you talk to/);
  assert.match(STEP_DESK_PROMPT, /one step of one task/);
});
