import test from "node:test";
import assert from "node:assert/strict";
import { withEntry, founderLog, exportLog, LOG_LIMIT, MEMORY_NOTICE } from "../src/memory.ts";
import { taskContext } from "../src/tasks.ts";

const e = (kind, text, task, at = "2026-09-08T10:00:00.000Z") => ({ id: `${kind}-${text.length}-${Math.random()}`, at, kind, text, task });

test("the notebook does not write the same line twice, and a task keeps one note", () => {
  let l = withEntry([], e("did", "Listed five people", "1-0"));
  l = withEntry(l, e("did", "Listed five people", "1-0"));
  assert.equal(l.length, 1);
  l = withEntry(l, e("note", "Maria, Kostas", "1-0"));
  l = withEntry(l, e("note", "Maria, Kostas, Andreas", "1-0"));
  assert.equal(l.filter((x) => x.kind === "note").length, 1);
  assert.equal(l.at(-1).text, "Maria, Kostas, Andreas");
  assert.equal(withEntry(l, e("did", "   ", "1-0")).length, l.length);
  // nothing written is lost: five hundred entries are five hundred entries
  const many = Array.from({ length: 500 }, (_, i) => e("did", `step ${i}`, "9-9"));
  assert.equal(many.reduce((acc, x) => withEntry(acc, x), []).length, 500);
});

test("the log is empty without consent and dated with consent", () => {
  const list = [e("did", "Asked Maria", "1-1", "2026-09-06T09:00:00.000Z"), e("outcome", "Did it. Two said yes.", "1-1", "2026-09-06T18:00:00.000Z"), e("desk", "Say a real number.", "1-2", "2026-09-08T09:00:00.000Z")];
  assert.equal(founderLog(list, false), "");
  const log = founderLog(list, true, new Date("2026-09-08T12:00:00.000Z"));
  assert.match(log, /2026-09-06 \(2 days ago\): did: Asked Maria/);
  assert.match(log, /\n  how it went: Did it/);
  assert.match(log, /2026-09-08 \(today\): the desk said: Say a real number/);
  assert.match(log, /never repeat advice/);
});

test("a long notebook is trimmed to the newest lines within the budget", () => {
  const list = Array.from({ length: 80 }, (_, i) => e("did", `Step number ${i} with a fairly long description so the budget bites`, "2-0", `2026-08-${String(1 + (i % 28)).padStart(2, "0")}T10:00:00.000Z`));
  const log = founderLog(list, true);
  assert.ok(log.length <= LOG_LIMIT.chars + 200);
  assert.match(log, /Step number 79/);
  assert.doesNotMatch(log, /Step number 0 /);
});

test("the export is the founder's copy, and the task context carries the log", () => {
  const list = [e("note", "Maria pays €40", "1-0")];
  const out = exportLog(list, "Alex");
  assert.match(out, /notebook for Alex/);
  assert.match(out, /Your note: Maria pays €40/);
  const ctx = taskContext("Ask five people", { log: founderLog(list, true) });
  assert.match(ctx, /notebook/);
  assert.doesNotMatch(taskContext("Ask five people", { log: founderLog(list, false) }), /notebook/);
  assert.equal(MEMORY_NOTICE.lines.length, 3);
});
