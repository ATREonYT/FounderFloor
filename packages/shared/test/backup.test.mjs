import test from "node:test";
import assert from "node:assert/strict";
import { makeBackup, readBackup, backupLine, plainState, BACKUP_KIND } from "../src/backup.ts";

const state = {
  record: { name: "FounderFloor", oneLiner: "Founders meet" },
  memory: [{ id: "m1", at: "2026-09-01T10:00:00.000Z", kind: "work", text: "Petros said yes", task: "1-0", plan: "p1" }],
  tasks: { "1-0": { guide: null, ticks: [0], notes: "a note", chat: [] } },
  kpi: [{ week: "2026-W37", revenue: 0, customers: 1, cash: 900, hoursOnCustomers: 4, shipped: "the sign" }],
  plans: [{ id: "p0" }],
  roadmap: { headline: "four weeks" },
  setRecord: () => {},
};

test("a copy holds the writing, and leaves the machinery behind", () => {
  const text = makeBackup(state, 12, "2026-09-12T20:00:00.000Z");
  const r = readBackup(text);
  assert.ok(r.ok);
  assert.equal(r.backup.version, 12);
  assert.equal(r.backup.state.memory[0].text, "Petros said yes", "the founder's words come back word for word");
  assert.equal(r.backup.state.tasks["1-0"].notes, "a note");
  assert.equal(r.backup.state.setRecord, undefined, "no functions in the file");
  assert.deepEqual(r.backup.holds, { notebook: 1, tasks: 1, weeks: 1, plans: 2 });
  assert.match(backupLine(r.backup), /Taken 2026-09-12\. 1 line in the notebook, 1 task page, 1 week logged, 2 plans\./);
});

test("a copy is readable by a person and starts with what it is", () => {
  const text = makeBackup(state, 12);
  assert.ok(text.includes(`"kind": "${BACKUP_KIND}"`));
  assert.ok(text.includes("\n"), "pretty printed, so a person can look at it");
});

test("every refusal is a sentence, never a parser error", () => {
  for (const [input, matcher] of [
    ["", /Paste the copy first/],
    ["not json at all", /not a copy the building can read/],
    ['{"kind":"something.else","version":1,"state":{}}', /not from FounderFloor/],
    [`{"kind":"${BACKUP_KIND}","version":1}`, /empty/],
    [`{"kind":"${BACKUP_KIND}","state":{"a":1}}`, /which version/],
    ["FounderFloor notebook for Alex\n2026-09-01  Your work: x", /notebook on its own/],
  ]) {
    const r = readBackup(input);
    assert.equal(r.ok, false, `should refuse: ${input.slice(0, 30)}`);
    assert.match(r.why, matcher);
    assert.ok(!/JSON|token|position|Unexpected/i.test(r.why), "no parser words in front of a beginner");
  }
});

test("whitespace around a pasted copy is forgiven", () => {
  const r = readBackup(`\n\n  ${makeBackup(state, 12)}  \n`);
  assert.ok(r.ok);
});

test("plainState drops functions and survives a round trip", () => {
  const p = plainState({ a: 1, b: () => 2, c: { d: [1, 2] } });
  assert.deepEqual(p, { a: 1, c: { d: [1, 2] } });
});

test("a copy describes what it will actually restore, not what the file claims", () => {
  // A hand-edited or older file can carry a wrong count, or none at all.
  // The sentence in front of the founder must come from the state.
  const lying = JSON.stringify({
    kind: "founderfloor.backup",
    version: 12,
    at: "2026-09-12T00:00:00.000Z",
    holds: { notebook: 0, tasks: 0, weeks: 0, plans: 0 },
    state: { memory: [{ id: "m1", text: "Petros said it back" }], tasks: { "1-0": {} }, kpi: [{}], plans: [{}], roadmap: {} },
  });
  const r = readBackup(lying);
  assert.equal(r.ok, true);
  assert.deepEqual(r.backup.holds, { notebook: 1, tasks: 1, weeks: 1, plans: 2 });
  assert.match(backupLine(r.backup), /1 line in the notebook, 1 task page, 1 week logged, 2 plans/);
});

test("a copy with no holds at all still says what is in it", () => {
  const r = readBackup(JSON.stringify({ kind: "founderfloor.backup", version: 12, at: "", state: { memory: [{}, {}] } }));
  assert.equal(r.ok, true);
  assert.match(backupLine(r.backup), /^2 lines in the notebook, 0 task pages/);
});
