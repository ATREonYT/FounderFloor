import test from "node:test";
import assert from "node:assert/strict";
import { STAGES } from "../src/build-path.ts";
import { workItem, workOpener, scriptedWork, workContext, workLines, workBlock, WORK_DESK_PROMPT } from "../src/work.ts";
import { PLAIN, HOUSE_RULES } from "../src/prompts/index.ts";
import { localTaskGuide, stepOpener, TASK_PROMPT } from "../src/tasks.ts";
import { localPlan, PLAN_PROMPT } from "../src/profile.ts";

test("every line on every list says how, in plain words, and asks its question", () => {
  for (const s of STAGES) {
    for (const it of s.items) {
      assert.ok(it.how.length > 40, it.id);
      assert.ok(it.ask.endsWith("?") || it.ask.endsWith("."), it.id);
      const item = workItem(it.id);
      assert.equal(item.text, it.text);
      assert.equal(item.room.id, s.id);
      assert.match(workOpener(item), /I keep it/);
    }
  }
  // the lines that need the building name their door
  assert.equal(workItem("validate.page").door.route, "/workshop");
  assert.equal(workItem("money.runway").door.route, "/stand");
});

test("a free line gets a how by its verbs, and building goes to the Workshop", () => {
  const b = workItem("review-2-0", "Build the sign-up page this week.");
  assert.match(b.how, /Workshop/);
  assert.equal(b.door.route, "/workshop");
  const t = workItem("review-2-1", "Talk to three more café owners");
  assert.match(t.ask, /Who did you talk to/);
  assert.equal(workItem("x"), null);
});

test("the practice-mode desk explains, unsticks, and says when to tick", () => {
  const item = workItem("idea.problem");
  assert.match(scriptedWork(item, "how do i do this?"), /Finish this sentence/);
  assert.match(scriptedWork(item, "I am stuck"), /Twenty minutes/);
  assert.match(scriptedWork(item, "Done, I said it to Maria and she repeated it"), /tick it/);
  assert.match(scriptedWork(item, "Maria said: waiters lose an hour a day on paper orders"), /Written down/);
});

test("what is written on the lists becomes a block every prompt carries", () => {
  const work = { "idea.problem": [{ id: "a", role: "you", text: "Waiters lose an hour a day on paper orders" }, { id: "b", role: "desk", text: "Written down." }], "idea.who": [{ id: "c", role: "desk", text: "..." }], "review-1-0": [{ id: "d", role: "you", text: "Sent it to five people" }] };
  const lines = workLines(work, { "review-1-0": "Send the link to five people" });
  assert.equal(lines.length, 2);
  assert.match(lines[0], /^Write the problem in one sentence with no product in it: Waiters lose/);
  assert.match(lines[1], /^Send the link to five people: Sent it/);
  assert.match(workBlock(work), /What the founder wrote on the lists/);
  assert.equal(workBlock({}), "");
  const ctx = workContext(workItem("idea.problem"), work["idea.problem"], { ticked: true });
  assert.match(ctx, /ticked as done/);
  assert.match(ctx, /Waiters lose/);
  assert.match(WORK_DESK_PROMPT, /never built/);
});

test("every prompt assumes a beginner, and building never asks for code", () => {
  assert.match(HOUSE_RULES, /twelve-year-old/);
  assert.match(TASK_PROMPT, /never built/);
  assert.match(PLAN_PROMPT, /no code/);
  assert.ok(PLAIN.includes("Lovable"));
  const g = localTaskGuide("Build the first version of the app", { profile: null });
  assert.equal(g.kind, "build");
  assert.match(g.steps.map((s) => s.do).join(" "), /Workshop/);
  assert.doesNotMatch(g.steps.map((s) => s.do + s.tip).join(" "), /\bcode\b|spec|wireframe/);
  assert.doesNotMatch(stepOpener("build", g.steps[0]), /What broke/);
  const plan = localPlan({ name: "A", standing: "idea", goal: "first-customer", horizon: "3m", pace: "evenings", audiences: "", likes: [], tone: "gentle", at: new Date().toISOString() });
  assert.doesNotMatch(JSON.stringify(plan.weeks), /one-page site/i);
  assert.match(JSON.stringify(plan.weeks), /Workshop/);
});
