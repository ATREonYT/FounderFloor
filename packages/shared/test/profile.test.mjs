import test from "node:test";
import assert from "node:assert/strict";
import { localPlan, asPlan, doorFor, toneLine, PLAN_PROMPT } from "../src/profile.ts";

const P = { name: "Alex", standing: "itch", likes: ["talking", "selling"], audiences: "café owners", goal: "first-customer", horizon: "3m", pace: "evenings", tone: "direct", budget: 500, at: "2026-09-08" };

test("the local plan has four weeks, a first room, and numbers in its goals", () => {
  const p = localPlan(P);
  assert.equal(p.weeks.length, 4);
  assert.equal(p.firstRoom, "idea");
  assert.match(p.weeklyGoal, /\d/);
  assert.match(p.target90, /\d/);
  assert.match(p.headline, /^Alex,/);
  assert.equal(localPlan({ ...P, standing: "running" }).firstRoom, "money");
});

test("doors and tones", () => {
  assert.equal(doorFor("itch"), "find");
  assert.equal(doorFor("idea"), "have");
  assert.equal(doorFor("building"), "running");
  assert.match(toneLine("blunt"), /bluntly/);
  assert.match(PLAN_PROMPT, /exactly 4 objects/);
});

test("a model plan is validated, not trusted", () => {
  assert.equal(asPlan("nope"), null);
  assert.equal(asPlan({ headline: "x", why: "y", weeklyGoal: "3 calls", target90: "10 users", weeks: [] }), null);
  const ok = asPlan({ headline: "Alex, four weeks.", why: "Because.", firstRoom: "validate", weeklyGoal: "5 conversations", target90: "3 paying customers", weeks: [{ focus: "a", do: ["1", "2", "3"] }, { focus: "b", do: ["1"] }, { focus: "c", do: ["1", "2"] }, { focus: "d", do: ["1"] }, { focus: "extra", do: ["x"] }] });
  assert.ok(ok);
  assert.equal(ok.weeks.length, 4);
  assert.equal(ok.firstRoom, "validate");
  assert.equal(asPlan({ headline: "h", why: "w", weeklyGoal: "g", target90: "t", firstRoom: "mars", weeks: [{ do: ["a"] }, { do: ["b"] }, { do: ["c"] }] }).firstRoom, "idea");
});
