import { test } from "node:test";
import assert from "node:assert/strict";
import { rankFor, nextRank, toNextRank } from "../src/ranks.ts";
import { runwayMonths, runwayLine, salaryScenario, runwayEnds } from "../src/runway.ts";
import { STAGES, stageProgress, currentStage, pathProgress } from "../src/build-path.ts";
import { generateDeadlines, RULES } from "../src/deadlines.ts";
import { standBlock, COACH_PROMPTS } from "../src/prompts/index.ts";
import { FloorApi, isErr } from "../src/floor-api.ts";

test("ranks match the site's thresholds", () => {
  assert.equal(rankFor(0).name, "Garage");
  assert.equal(rankFor(1).name, "First Dollar");
  assert.equal(rankFor(999).name, "First Dollar");
  assert.equal(rankFor(1000).name, "Ramen Profitable");
  assert.equal(rankFor(1200).name, "Ramen Profitable");
  assert.equal(rankFor(10_000).name, "Default Alive");
  assert.equal(rankFor(250_000).name, "Escape Velocity");
  assert.equal(rankFor(NaN).name, "Garage");
  assert.equal(nextRank(1200)?.name, "Default Alive");
  assert.equal(toNextRank(1200), 8800);
  assert.equal(toNextRank(1_000_000), 0);
});

test("runway is cash over net burn, with the arithmetic in the line", () => {
  assert.equal(runwayMonths({ cash: 40_000, burn: 6_000, mrr: 1_200 }), 40_000 / 4_800);
  assert.equal(runwayLine({ cash: 40_000, burn: 6_000, mrr: 1_200 }), "€40,000 ÷ (€6,000 − €1,200) = 8.3 months");
  assert.equal(runwayMonths({ cash: 10, burn: 100, mrr: 100 }), Infinity);
  assert.match(runwayLine({ cash: 10, burn: 100, mrr: 150 }), /break-even/);
  assert.equal(runwayMonths({ cash: -5, burn: 100, mrr: 0 }), 0);
  const s = salaryScenario({ cash: 40_000, burn: 6_000, mrr: 1_200, founderSalary: 2_000 }, 3_000);
  assert.ok(s.runway < 40_000 / 4_800);
  assert.match(s.line, /^€3,000\/mo salary: €40,000 ÷ \(€7,000 − €1,200\) = 6.9 months \(−/);
  assert.equal(runwayEnds({ cash: 0, burn: 100, mrr: 0 }, new Date("2026-09-05T00:00:00Z")), "2026-09-05");
  assert.equal(runwayEnds({ cash: 100, burn: 100, mrr: 100 }), null);
});

test("the build path has six stages of four or five items with unique ids", () => {
  assert.equal(STAGES.length, 6);
  const ids = new Set();
  for (const s of STAGES) {
    assert.ok(s.items.length >= 4 && s.items.length <= 5, s.id);
    for (const i of s.items) {
      assert.ok(!ids.has(i.id), `duplicate ${i.id}`);
      ids.add(i.id);
      assert.ok(i.id.startsWith(s.id + "."));
    }
  }
  assert.equal(stageProgress(STAGES[0], []), 0);
  assert.equal(stageProgress(STAGES[0], ["idea.problem", "idea.who"]), 0.4);
  assert.equal(currentStage([]).id, "idea");
  const allIdea = STAGES[0].items.map((i) => i.id);
  assert.equal(currentStage(allIdea).id, "validate");
  assert.equal(pathProgress(["idea.problem", "nonsense"]), 1 / STAGES.reduce((n, s) => n + s.items.length, 0));
});

test("every deadline rule carries an official source and a check date", () => {
  for (const r of RULES) {
    assert.match(r.source, /^https:\/\/(www\.)?(irs\.gov|corp\.delaware\.gov|fincen\.gov|mof\.gov\.cy|companies\.gov\.cy|gov\.uk|rik\.ee)\//, r.id);
    assert.match(r.checked, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(r.fixed || r.event, r.id);
  }
});

test("a Delaware LLC owned by a Cyprus resident gets the right calendar", () => {
  const now = new Date("2026-09-05T12:00:00Z");
  const d = generateDeadlines({ entity: "de-llc", residence: "CY", formedOn: "2026-08-20" }, now);
  const ids = d.map((x) => x.ruleId);
  assert.deepEqual(ids, ["de-llc-ein", "us-boi", "de-llc-5472", "de-llc-franchise", "cy-personal-return"]);
  const f = d.find((x) => x.ruleId === "de-llc-5472");
  assert.equal(f.due, "2027-04-15");
  assert.equal(f.daysLeft, 222);
  assert.equal(d.find((x) => x.ruleId === "de-llc-franchise").due, "2027-06-01");
  assert.equal(d.find((x) => x.ruleId === "de-llc-ein").daysLeft, 14);
  for (const x of d) {
    assert.match(x.disclaimer, /not tax advice/);
    assert.match(x.source, /^https:/);
  }
  // no Cyprus company filings for a person who only owns a US LLC
  assert.ok(!ids.includes("cy-ltd-return"));
  assert.ok(!ids.includes("cy-vat"));
});

test("a US resident with a Delaware LLC does not get the 5472 or Cyprus rules", () => {
  const d = generateDeadlines({ entity: "de-llc", residence: "US" }, new Date("2026-09-05T12:00:00Z"));
  assert.deepEqual(d.map((x) => x.ruleId), ["de-llc-franchise"]);
});

test("a Cyprus Ltd gets the quarterly VAT date nearest to now", () => {
  const d = generateDeadlines({ entity: "cy-ltd", residence: "CY", yearEnd: "2025-12-31" }, new Date("2026-09-05T12:00:00Z"));
  assert.equal(d.find((x) => x.ruleId === "cy-vat").due, "2026-11-10");
  assert.equal(d.find((x) => x.ruleId === "cy-provisional-2").due, "2026-12-31");
  assert.equal(d.find((x) => x.ruleId === "cy-he32").due, "2027-01-28");
  assert.equal(d[0].ruleId, "cy-vat");
});

test("the stand block carries the numbers the coaches reason over", () => {
  const b = standBlock({ name: "Soup Ticket", oneLiner: "Prepaid meal passes for small shops.", pitch: "", currency: "EUR", mrr: 1200, burn: 6000, cash: 40000, founderSalary: 2000, entity: "de-llc", residence: "CY" });
  assert.match(b, /rank Ramen Profitable, 8800 to the next/);
  assert.match(b, /Runway: €40,000 ÷ \(€6,000 − €1,200\) = 8.3 months/);
  assert.match(b, /Weekly goal: none set/);
  for (const c of Object.values(COACH_PROMPTS)) {
    assert.match(c.system, /under 130 words/);
    assert.ok(c.starters.length >= 3);
  }
});

test("the floor client speaks the server's protocol and never throws", async () => {
  const calls = [];
  const fake = async (url, init) => {
    calls.push({ url, init });
    if (url.endsWith("/auth/login")) return { ok: true, status: 200, json: async () => ({ id: "acct_1", name: "ATRE", email: "a@b.c", token: "t" }) };
    if (url.includes("/state?me=acct_1")) return { ok: true, status: 200, json: async () => ({ state: { myStartup: { name: "Soup Ticket" } }, savedAt: 1, paid: null, coins: 0, perks: null, awards: [] }) };
    return { ok: false, status: 404, json: async () => ({}) };
  };
  const api = new FloorApi("https://floor.example", fake);
  const a = await api.login("a@b.c", "pw");
  assert.ok(!isErr(a));
  assert.equal(JSON.parse(calls[0].init.body).name, "");
  const s = await api.state("acct_1", "t");
  assert.ok(!isErr(s));
  assert.equal(calls[1].init.headers.Authorization, "Bearer t");
  const missing = await api.startup("nobody");
  assert.ok(isErr(missing) && missing.error === "not found");
  const down = new FloorApi("https://floor.example", async () => { throw new Error("boom"); });
  const r = await down.login("a", "b");
  assert.ok(isErr(r) && /unreachable/.test(r.error));
});
