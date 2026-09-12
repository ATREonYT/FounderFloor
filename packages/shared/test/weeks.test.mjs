import { test } from "node:test";
import assert from "node:assert/strict";
import { isoWeekKey, weeksVisited, weeksWorked, planWeekNow, isPaused, daysAway, AWAY_DAYS } from "../src/weeks.ts";

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

test("weeksWorked: a paused week does not advance the plan", () => {
  const visits = ["2026-09-07", "2026-09-14", "2026-09-21"];
  assert.equal(weeksWorked(visits), 3);
  assert.equal(weeksWorked(visits, ["2026-W38"]), 2);
});

test("weeksWorked: pausing never takes a week away", () => {
  const visits = ["2026-09-07", "2026-09-14"];
  const all = weeksWorked(visits, ["2026-W37", "2026-W38"]);
  assert.equal(all, 0, "every week paused is zero worked, not a negative");
  assert.ok(all >= 0);
});

test("planWeekNow: never before one, never past the plan's last week", () => {
  assert.equal(planWeekNow([], [], 4), 1, "no record of visits is week one, not week zero");
  assert.equal(planWeekNow(["2026-09-07"], [], 4), 1);
  assert.equal(planWeekNow(["2026-09-07", "2026-09-14", "2026-09-21", "2026-09-28", "2026-10-05", "2026-10-12"], [], 4), 4);
  assert.equal(planWeekNow(["2026-09-07"], [], 0), 1, "a plan with no weeks still reads as week one");
});

test("planWeekNow: the week the founder left is the week they come back to", () => {
  const left = ["2026-09-07", "2026-09-08"];
  assert.equal(planWeekNow(left, [], 4), 1);
  const backAMonthLater = [...left, "2026-10-12"];
  assert.equal(planWeekNow(backAMonthLater, [], 4), 2, "one week of work, then one more: week two, not week six");
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
