import test from "node:test";
import assert from "node:assert/strict";
import { taskKind, localTaskGuide, asTaskGuide, taskContext, TASK_PROMPT, TASK_DESK_PROMPT } from "../src/tasks.ts";

const P = { name: "Alex", standing: "building", likes: ["building"], audiences: "indie developers", goal: "first-customer", horizon: "3m", pace: "evenings", tone: "direct", budget: 0, at: "2026-09-08" };
const W = { n: 1, focus: "Define MVP, start building, find first users.", do: ["Pick one specific developer pain point you can solve in 4 weeks.", "Write a rough spec; start coding the core feature.", "Post in 3 dev communities describing what you're building, ask for early access."] };

test("a plan line is sorted by the work it asks for", () => {
  assert.equal(taskKind("Post in 3 dev communities describing what you're building"), "write");
  assert.equal(taskKind("Ask five of them what wastes their week"), "talk");
  assert.equal(taskKind("Write a rough spec; start coding the core feature"), "write");
  assert.equal(taskKind("Post in 3 dev communities describing what you're building, ask for early access."), "write");
  assert.equal(taskKind("Put burn and cash on the stand"), "numbers");
  assert.equal(taskKind("Start coding the core feature"), "build");
  assert.equal(taskKind("Ask one person to pay, even a little"), "sell");
  assert.equal(taskKind("Log revenue, customers, cash, hours, shipped"), "numbers");
  assert.equal(taskKind("Decide: keep going or change the idea"), "plan");
});

test("the local guide is a whole page, with the audience and the week in it", () => {
  const g = localTaskGuide(W.do[2], { profile: P, week: W });
  assert.equal(g.kind, "write");
  assert.equal(g.source, "rehearsal");
  assert.ok(g.steps.length >= 3 && g.steps.length <= 5);
  assert.ok(g.steps.every((s) => s.do && s.tip));
  assert.match(g.steps[0].tip, /indie developers/);
  assert.match(g.why, /Week 1 is "Define MVP/);
  assert.match(g.done, /3 places/);
  assert.equal(g.starters.length, 3);
  assert.equal(g.time, "One evening");
  assert.equal(localTaskGuide("Ask five people", { profile: { ...P, pace: "all-in" } }).time, "Two days");
});

test("a model guide is validated, not trusted", () => {
  assert.equal(asTaskGuide(null), null);
  assert.equal(asTaskGuide({ title: "x", why: "y", done: "z", steps: [{ do: "one" }] }), null);
  const ok = asTaskGuide({ title: "Post in three communities", why: "Because.", time: "One evening", kind: "nonsense", done: "Three posts live.", steps: [{ do: "a", tip: "t" }, { do: "b" }, { do: "" }, { do: "c", tip: "u" }, { do: "d" }, { do: "e" }], starters: ["q1", "", "q2", "q3", "q4"] });
  assert.ok(ok);
  assert.equal(ok.kind, "plan");
  assert.equal(ok.steps.length, 4);
  assert.equal(ok.steps[1].tip, "");
  assert.deepEqual(ok.starters, ["q1", "q2", "q3"]);
});

test("the desk is told the founder, the week, the task, the ticks and the notes", () => {
  const g = localTaskGuide(W.do[2], { profile: P, week: W });
  const c = taskContext(W.do[2], { profile: P, week: W, guide: g, notes: "I posted on one forum already", ticked: [0] });
  assert.match(c, /Founder: Alex/);
  assert.match(c, /Week 1: Define MVP/);
  assert.match(c, /1\. .*\(done\)/);
  assert.match(c, /posted on one forum/);
  assert.match(TASK_PROMPT, /3 to 5 objects/);
  assert.match(TASK_DESK_PROMPT, /exactly one task/);
});
