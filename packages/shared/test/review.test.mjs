import test from "node:test";
import assert from "node:assert/strict";
import { weekFacts, weekScore, verdictFor, groundLine, localReview, asReview, reviewContext, REVIEW_PROMPT, weekWindow } from "../src/review.ts";
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
  assert.equal(weekScore({ ...f, stepsTicked: 6, tasksWritten: 1, daysActive: 2 }), Math.round((0.65 * 0.5 + 0.35 / 3) * 100));
  // the verdict names what the week produced in the world, never how it scored
  const none = { ...f, people: 0, asked: 0, wouldPay: 0, moneyIn: null, customers: null };
  assert.equal(verdictFor({ ...none, stepsTicked: 12 }), "Work done, nobody asked", "a full week of ticks is not a good week on its own");
  assert.equal(verdictFor({ ...none, stepsTicked: 0 }), "Nothing on the record yet");
  assert.equal(verdictFor({ ...none, people: 2 }), "2 conversations");
  assert.equal(verdictFor({ ...none, people: 2, asked: 2 }), "Price put to people");
  assert.equal(verdictFor({ ...none, people: 2, asked: 2, wouldPay: 1 }), "One yes");
  assert.equal(verdictFor({ ...none, moneyIn: 40 }), "Money in");
  const flattered = asReview({ score: 100, verdict: "Amazing", line: "Wow.", well: ["a"], fix: ["b"], how: ["c", "d", "e"] }, { ...f, stepsTicked: 0, tasksWritten: 0, daysActive: 0 });
  assert.equal(flattered.score, 0);
  // a week away may never cost a point: the same work, seen on one day or on five, scores the same
  for (const days of [0, 1, 2, 5, 7]) assert.equal(weekScore({ ...f, daysActive: days }), 100, "attendance is not in the score");
  assert.equal(weekScore({ ...f, stepsTicked: 6, tasksWritten: 1, daysActive: 0 }), weekScore({ ...f, stepsTicked: 6, tasksWritten: 1, daysActive: 7 }));
  assert.equal(asReview({ verdict: "x", line: "y", well: [], fix: ["b"], how: ["c", "d"] }, f), null);
});

test("the local reading is specific to the numbers, and the context carries them", () => {
  const f = { week: 1, focus: "Find the problem.", tasks: 3, tasksDone: 1, steps: 9, stepsTicked: 6, written: 2, tasksWritten: 2, daysActive: 2, did: 1, partly: 0, stuck: 1, over: true };
  const r = localReview(f, P);
  assert.equal(r.score, weekScore(f));
  assert.match(r.well[0], /6 of 9 steps/);
  assert.ok(r.fix.some((x) => /3 steps are still open/.test(x)));
  assert.ok(!r.fix.some((x) => /day|days|showing up|hobby/i.test(x)), "the reading never scolds an absence");
  assert.ok(!r.how.some((x) => /evening|calendar/i.test(x)));
  assert.equal(r.how.length, 3);
  assert.match(r.line, /^Alex,/);
  const c = reviewContext(f, { profile: P, plan: null, week: { n: 1, focus: "Find the problem.", do: ["a", "b", "c"] }, log: "" });
  assert.match(c, /score \d+ of 100/);
  assert.match(c, /notebook is empty/);
  assert.match(REVIEW_PROMPT, /do not change it/);
  assert.match(REVIEW_PROMPT, /Never mention days missed/);
  assert.ok(!c.includes("Days active"), "the model is not told how often they came in, so it cannot scold for it");
  assert.match(stepOpener("talk", { do: "Ask five people", tip: "" }), /Who did you talk to/);
  assert.match(STEP_DESK_PROMPT, /one step of one task/);
});

test("the reading separates what was done from what it produced", async () => {
  const { weekFacts, groundLine, localReview, weekScore } = await import("../src/review.ts");
  const week = { n: 1, focus: "Talk to five people.", do: ["a", "b", "c"] };
  const starts = { 1: "2026-09-07" };
  const inWeek = "2026-09-09T18:00:00.000Z";
  // a week of pure activity: every step ticked, every task written up, nobody asked
  const busy = weekFacts(week, { profile: null, planDone: ["1-0", "1-1", "1-2"], tasks: {}, memory: [], weekStarts: starts, interviews: [], kpi: [], logWeek: "2026-W37" }, Date.parse("2026-09-20T00:00:00Z"));
  assert.equal(busy.people, 0);
  assert.match(groundLine(busy), /Nobody talked to yet/);
  assert.match(groundLine(busy), /price still untested/);
  assert.match(groundLine(busy), /not logged, so money is unknown/, "an unknown is shown as unknown, never as zero");
  const r = localReview(busy, null);
  assert.ok(r.fix.some((x) => /Nobody was written down/.test(x)));
  assert.ok(r.how.some((x) => /write their name down/.test(x)));

  // the same week with two real conversations and one yes
  const real = weekFacts(week, { profile: null, planDone: ["1-0"], tasks: {}, memory: [], weekStarts: starts, logWeek: "2026-W37",
    interviews: [{ at: inWeek, who: "Petros", said: "I have nobody to show my idea to", paysToday: "yes, 9 a month" }, { at: inWeek, who: "Maria", said: "not for me", paysToday: "no" }],
    kpi: [{ week: "2026-W37", revenue: 0, customers: 0 }] }, Date.parse("2026-09-20T00:00:00Z"));
  assert.equal(real.people, 2);
  assert.equal(real.asked, 2);
  assert.equal(real.wouldPay, 1);
  assert.equal(real.moneyIn, 0, "a logged week of zero is a zero, not an unknown");
  assert.match(groundLine(real), /2 people talked to, 1 of 2 said they would pay, no money in/);
  // and the number that only counts activity did not go up for any of it
  assert.ok(weekScore(real) < weekScore(busy), "the ticks still score; the point is that the ground is said first");
  const rr = localReview(real, { name: "Alex" });
  assert.match(rr.well[0], /2 people written down/);
  assert.match(rr.line, /said they would pay/);
});

test("a person outside the week's days is not counted in it", async () => {
  const { weekFacts } = await import("../src/review.ts");
  const week = { n: 1, focus: "x", do: ["a"] };
  const f = weekFacts(week, { profile: null, planDone: [], tasks: {}, memory: [], weekStarts: { 1: "2026-09-07", 2: "2026-09-14" },
    interviews: [{ at: "2026-09-20T10:00:00.000Z", who: "Later", said: "x", paysToday: "yes" }], kpi: [] }, Date.parse("2026-09-25T00:00:00Z"));
  assert.equal(f.people, 0);
});
