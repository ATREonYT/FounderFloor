import test from "node:test";
import assert from "node:assert/strict";
import { ROAD, roadState, stopOf } from "../src/road.ts";

test("seven stops, in order, each with a line a child follows", () => {
  assert.equal(ROAD.length, 7);
  assert.deepEqual(ROAD.map((s) => s.n), [1, 2, 3, 4, 5, 6, 7]);
  for (const s of ROAD) {
    assert.ok(s.child.split(" ").length <= 20, s.id);
    assert.match(s.route, /^\//);
  }
});

test("where you are follows what you did, one stop at a time", () => {
  const fresh = roadState({ sign: false, interviews: 0, plan: false, tasksDone: 0, sawApp: false, handedOff: false, customers: 0, mrr: 0 });
  assert.equal(fresh.now.id, "idea");
  assert.equal(fresh.done, 0);
  const talking = roadState({ sign: true, interviews: 3, plan: true, tasksDone: 0, sawApp: false, handedOff: false, customers: 0, mrr: 0 });
  assert.equal(talking.now.id, "people");
  assert.equal(talking.now.progress, "3 of 5");
  const working = roadState({ sign: true, interviews: 5, plan: true, tasksDone: 2, sawApp: false, handedOff: false, customers: 0, mrr: 0 });
  assert.equal(working.now.id, "week");
  assert.equal(working.now.progress, "2 of 3");
  assert.equal(working.done, 3);
  // skipping ahead leaves the earlier stop open, and it is the one to do now
  const skipped = roadState({ sign: true, interviews: 0, plan: true, tasksDone: 3, sawApp: true, handedOff: false, customers: 0, mrr: 0 });
  assert.equal(skipped.now.id, "people");
  assert.equal(skipped.stops.find((s) => s.id === "app").state, "done");
  const paid = roadState({ sign: true, interviews: 5, plan: true, tasksDone: 9, sawApp: true, handedOff: true, customers: 0, mrr: 120 });
  assert.equal(paid.done, 7);
  assert.equal(paid.now.id, "customer");
  assert.equal(stopOf("week").n, 4);
  assert.equal(stopOf("plan").n, 2);
  // no plan yet: the plan is the stop to do now, the same as Today's first thing
  const signed = roadState({ sign: true, interviews: 0, plan: false, tasksDone: 0, sawApp: false, handedOff: false, customers: 0, mrr: 0 });
  assert.equal(signed.now.id, "plan");
});
