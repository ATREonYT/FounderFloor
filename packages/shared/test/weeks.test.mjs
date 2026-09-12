import { test } from "node:test";
import assert from "node:assert/strict";
import { isoWeekKey, weeksVisited, weeksWorked, planWeekNow, weekFromVisits, nextWeek, isPaused, daysAway, AWAY_DAYS } from "../src/weeks.ts";

test("isoWeekKey: Monday and Sunday of the same ISO week share a key", () => {
  assert.equal(isoWeekKey("2026-09-07"), isoWeekKey("2026-09-13"));
  assert.notEqual(isoWeekKey("2026-09-13"), isoWeekKey("2026-09-14"));
});

test("isoWeekKey: the year rolls with the ISO year, not the calendar year", () => {
  // 1 Jan 2027 is a Friday, so it belongs to ISO week 53 of 2026
  assert.equal(isoWeekKey("2027-01-01"), "2026-W53");
  assert.equal(isoWeekKey("2026-01-01"), "2026-W01");
});

test("isoWeekKey: nonsense in, empty out", () => {
  assert.equal(isoWeekKey("not a date"), "");
});

test("weeksVisited: many days in one week count once, and come back sorted", () => {
  const v = ["2026-09-09", "2026-09-07", "2026-09-08", "2026-09-16"];
  assert.deepEqual(weeksVisited(v), ["2026-W37", "2026-W38"]);
});

test("weeksWorked: a fortnight away costs nothing", () => {
  const before = ["2026-09-07", "2026-09-08", "2026-09-09"];
  const after = [...before, "2026-09-28"]; // back after two empty weeks
  assert.equal(weeksWorked(before), 1);
  assert.equal(weeksWorked(after), 2, "the empty weeks are not counted against them");
});

test("weeksWorked: the number the app shows only ever goes up", () => {
  const visits = ["2026-09-07", "2026-09-14", "2026-09-21"];
  assert.equal(weeksWorked(visits), 3);
  // pausing a week is not a claim that you were not there
  assert.equal(weeksWorked([...visits, "2026-09-28"]), 4);
});

test("planWeekNow: the week is what the building stored, and nothing else moves it", () => {
  assert.equal(planWeekNow(2, 4), 2);
  assert.equal(planWeekNow(2, 4, 7), 2, "a presence guess never pushes a stored week on");
  assert.equal(planWeekNow(9, 4), 4, "never past the plan's last week");
  assert.equal(planWeekNow(0, 4), 1, "never before week one");
  assert.equal(planWeekNow(null, 4), 1, "a phone with nothing stored starts at week one");
  assert.equal(planWeekNow(null, 4, 3), 3, "unless it has been here a while, and then only as a floor");
  assert.equal(planWeekNow(1, 0), 1, "a plan with no weeks still reads as week one");
});

test("planWeekNow: a pause cannot move the plan backwards", () => {
  // the bug this replaced: week 2, then "life happened", then week 1
  const before = planWeekNow(2, 4);
  const afterAPause = planWeekNow(2, 4);
  assert.equal(afterAPause, before);
  for (const derived of [0, 1, 2, 5]) assert.ok(planWeekNow(3, 4, derived) >= 3, "nothing derived can pull a stored week down");
});

test("planWeekNow: coming back from a month away lands on the week you left", () => {
  const leftOnWeekTwo = 2;
  assert.equal(planWeekNow(leftOnWeekTwo, 4, 6), 2, "five weeks of calendar, and the plan did not move");
});

test("nextWeek: forward one, and never past the end", () => {
  assert.equal(nextWeek(1, 4), 2);
  assert.equal(nextWeek(4, 4), 4);
  assert.equal(nextWeek(0, 4), 2);
});

test("weekFromVisits: an existing phone is not sent back to week one", () => {
  assert.equal(weekFromVisits(["2026-09-07", "2026-09-14"], 4), 2);
  assert.equal(weekFromVisits([], 4), 1);
  assert.equal(weekFromVisits(["2026-09-07", "2026-09-14", "2026-09-21", "2026-09-28", "2026-10-05"], 4), 4);
});

test("isPaused: reads the week a date falls in", () => {
  assert.equal(isPaused(["2026-W37"], "2026-09-09"), true);
  assert.equal(isPaused(["2026-W37"], "2026-09-16"), false);
  assert.equal(isPaused([], "2026-09-09"), false);
});

test("daysAway: counts from the last visit that is not today", () => {
  assert.equal(daysAway(["2026-09-01", "2026-09-12"], "2026-09-12"), 11);
  assert.equal(daysAway(["2026-09-11", "2026-09-12"], "2026-09-12"), 1);
  assert.equal(daysAway([], "2026-09-12"), 0, "a first visit is not an absence");
  assert.equal(daysAway(["2026-09-12"], "2026-09-12"), 0, "today alone is not an absence");
});

test("daysAway: a week is the threshold the desk speaks at", () => {
  assert.equal(AWAY_DAYS, 7);
  assert.ok(daysAway(["2026-09-05", "2026-09-12"], "2026-09-12") >= AWAY_DAYS);
  assert.ok(daysAway(["2026-09-07", "2026-09-12"], "2026-09-12") < AWAY_DAYS);
});

test("the week's window is the days it was really worked, not seven from the profile", async () => {
  const { weekWindow, weekFacts } = await import("../src/review.ts");
  const starts = { 1: "2026-09-07", 2: "2026-09-28" };
  const w1 = weekWindow(null, 1, starts);
  assert.equal(w1.from, Date.parse("2026-09-07T00:00:00Z"));
  assert.equal(w1.to, Date.parse("2026-09-28T00:00:00Z"), "week one ran until week two began, three calendar weeks later");
  const w2 = weekWindow(null, 2, starts);
  assert.equal(w2.to, Number.POSITIVE_INFINITY, "the week you are on has not ended");
  // a line written eleven days into a stretched week still counts as that week's work
  const week = { n: 1, focus: "Find the problem.", do: ["a"] };
  const memory = [{ at: "2026-09-18T20:00:00.000Z", kind: "work", task: "1-0", text: "wrote it" }];
  const f = weekFacts(week, { profile: null, planDone: [], tasks: {}, memory, weekStarts: starts }, Date.parse("2026-09-30T00:00:00Z"));
  assert.equal(f.written, 1);
  assert.equal(f.daysActive, 1);
  assert.equal(f.over, true, "week one is over because week two began");
});

test("without recorded starts the old calendar window still works", async () => {
  const { weekWindow } = await import("../src/review.ts");
  const w = weekWindow({ at: "2026-09-07T00:00:00.000Z" }, 2);
  assert.equal(w.to - w.from, 7 * 86_400_000);
});

test("the notebook keeps every entry and every word", async () => {
  const { withEntry, exportLog, LOG_LIMIT, founderLog } = await import("../src/memory.ts");
  let list = [];
  const long = "x".repeat(4000);
  for (let i = 0; i < 500; i++) list = withEntry(list, { id: `n${i}`, at: "2026-09-12T10:00:00.000Z", kind: "work", text: `line ${i}`, task: `1-${i}` });
  assert.equal(list.length, 500, "the 401st entry does not push the first one out");
  assert.equal(list[0].text, "line 0", "the first thing they ever wrote is still there");
  assert.ok(exportLog(list).includes("line 0"), "and it is in the export");
  const withLong = withEntry(list, { id: "long", at: "2026-09-12T10:00:00.000Z", kind: "note", text: long, task: "2-0" });
  assert.equal(withLong.at(-1).text.length, 4000, "a long note is stored whole");
  // the prompt still gets a trimmed view: a read limit, not a delete
  const log = founderLog(withLong, true, new Date("2026-09-12T12:00:00Z"));
  assert.ok(log.length < 20000);
  assert.ok(!log.includes("x".repeat(LOG_LIMIT.entryChars + 1)), "the model sees a trimmed copy of a long note");
});

test("a note is edited in place, and a duplicate is not written twice", async () => {
  const { withEntry } = await import("../src/memory.ts");
  let l = withEntry([], { id: "a", at: "2026-09-12T10:00:00.000Z", kind: "note", text: "first", task: "1-0" });
  l = withEntry(l, { id: "b", at: "2026-09-12T11:00:00.000Z", kind: "note", text: "second", task: "1-0" });
  assert.equal(l.length, 1);
  assert.equal(l[0].text, "second");
  const twice = withEntry(l, { id: "c", at: "2026-09-12T12:00:00.000Z", kind: "work", text: "same", task: "1-1" });
  assert.equal(withEntry(twice, { id: "d", at: "2026-09-12T13:00:00.000Z", kind: "work", text: "same", task: "1-1" }).length, twice.length);
});

test("a remade plan's notes do not attach to the new plan's tasks", async () => {
  const { ofPlan } = await import("../src/memory.ts");
  const entries = [
    { id: "1", at: "2026-09-01T10:00:00.000Z", kind: "work", text: "old week one", task: "1-0", plan: "p1" },
    { id: "2", at: "2026-09-20T10:00:00.000Z", kind: "work", text: "new week one", task: "1-0", plan: "p2" },
    { id: "3", at: "2026-08-01T10:00:00.000Z", kind: "work", text: "before plans were versioned", task: "1-0" },
  ];
  const now = ofPlan(entries, "p2");
  assert.deepEqual(now.map((e) => e.id), ["2", "3"], "the old plan's note is not read as this plan's");
  assert.equal(entries.length, 3, "and nothing was deleted to achieve it");
});
