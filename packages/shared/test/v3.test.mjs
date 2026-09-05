import { test } from "node:test";
import assert from "node:assert/strict";
import { findIdeas, readIdea } from "../src/ideas.ts";
import { deltas, draftUpdate, pct } from "../src/kpi.ts";
import { draftDocument, DOC_KINDS } from "../src/documents.ts";
import { canUse, FREE_LIMITS } from "../src/plans.ts";

const REC = { name: "Soup Ticket", oneLiner: "Prepaid meal passes for small shops.", pitch: "", currency: "EUR", mrr: 1200, burn: 6000, cash: 40000, founderSalary: 2000, entity: "de-llc", residence: "CY", target90: "€2,000 MRR by December" };

test("the finder returns five ideas, matched to who the founder knows, deterministic", () => {
  const brief = { skills: ["code", "design"], audiences: ["cafés", "my barber"], hoursPerWeek: 8, budget: 200 };
  const a = findIdeas(brief);
  const b = findIdeas(brief);
  assert.equal(a.length, 5);
  assert.deepEqual(a.map((i) => i.oneLiner), b.map((i) => i.oneLiner));
  assert.equal(a[0].who, "small independent shops");
  assert.equal(a[0].effort, "evenings");
  assert.match(a[0].mustBeTrue, /software/);
  for (const i of a) {
    assert.ok(i.oneLiner.endsWith("."));
    assert.ok(i.firstTen.length > 20);
    assert.ok(i.whyNow.length > 10);
  }
  const c = findIdeas({ skills: ["sales"], audiences: [], hoursPerWeek: 40, budget: 0 });
  assert.equal(c.length, 5);
  assert.equal(c[0].effort, "full-time");
});

test("the second opinion never scores and always leaves the founder with a next hour", () => {
  const sketch = readIdea("An app for everyone that uses AI");
  assert.equal(sketch.readiness, "sketch");
  assert.ok(sketch.strong.length >= 1);
  assert.equal(sketch.questions.length, 3);
  assert.equal(sketch.ask.length, 5);
  assert.ok(!/\d\/10|score/i.test(JSON.stringify(sketch)));
  const ready = readIdea("Small cafés lose hours every week chasing regulars who pay late. Soup Ticket is a prepaid pass they pay €29 a month for. Since 2025 card fees doubled so shops want prepayment. I talked to 14 shop owners, 9 said they would pay.");
  assert.equal(ready.readiness, "ready");
  assert.equal(ready.strong.length, 3);
  assert.match(ready.sharpen, /price/);
  const forming = readIdea("Freelancers waste hours on scope creep; a change-request log they get paid for.");
  assert.equal(forming.readiness, "forming");
  assert.match(forming.questions.join(" "), /Why now/);
});

test("the weekly log computes deltas and drafts an update that never invents", () => {
  assert.equal(pct(120, 100), "+20%");
  assert.equal(pct(80, 100), "-20%");
  assert.equal(pct(5, 0), "new");
  const e = [
    { week: "2026-W35", revenue: 1000, customers: 10, cash: 42000, hoursOnCustomers: 4 },
    { week: "2026-W36", revenue: 1200, customers: 12, cash: 40000, hoursOnCustomers: 6, shipped: "the pass QR" },
  ];
  const d = deltas(e);
  assert.equal(d.revenue, "+20%");
  assert.equal(d.customers, "+2");
  const u = draftUpdate(e, REC);
  assert.match(u, /Soup Ticket — update for 2026-W36/);
  assert.match(u, /Revenue: €1,200 \(\+20% on 2026-W35\)/);
  assert.match(u, /€40,000 ÷ \(€6,000 − €1,200\) = 8.3 months/);
  assert.match(u, /Shipped: the pass QR/);
  assert.match(u, /Ask: we are aiming at "€2,000 MRR by December"/);
  assert.match(draftUpdate([], REC), /No weekly entries yet/);
  const me = draftUpdate([{ ...e[1], shipped: "" }], { ...REC, weeklyGoal: "ten messages" }, "myself");
  assert.match(me, /nothing written down/);
  assert.match(me, /Next week: ten messages/);
});

test("every document kind drafts from the record and marks what is missing", () => {
  for (const k of DOC_KINDS) {
    const d = draftDocument(k.kind, REC);
    assert.equal(d.kind, k.kind);
    assert.ok(d.body.length > 40, k.kind);
  }
  const empty = draftDocument("one-pager", { ...REC, name: "", oneLiner: "" });
  assert.match(empty.body, /\[company name — not on the stand yet\]/);
  assert.match(draftDocument("outreach", REC).body, /No link\. One question/);
  assert.match(draftDocument("entity", { ...REC, residence: "CY" }).body, /owned from CY/);
  assert.match(draftDocument("pricing", REC).body, /Start high/);
});

test("free limits gate exactly as the copy promises", () => {
  const u = { ideaRuns: 0, ideaChecks: 0, coachTurnsToday: 0, draftsThisMonth: 0, handoffsThisMonth: 0 };
  assert.equal(canUse("ideaRun", u, "free").left, 3);
  assert.equal(canUse("ideaRun", { ...u, ideaRuns: 3 }, "free").ok, false);
  assert.equal(canUse("ideaRun", { ...u, ideaRuns: 30 }, "pro").ok, true);
  assert.equal(canUse("coachTurn", u, "free", { coach: "sales", weekday: 1 }).ok, false);
  assert.equal(canUse("coachTurn", u, "free", { coach: "strategy", weekday: 3 }).ok, false);
  assert.equal(canUse("coachTurn", u, "free", { coach: "strategy", weekday: 1 }).left, FREE_LIMITS.coachTurnsPerDay);
  assert.equal(canUse("coachTurn", { ...u, coachTurnsToday: 10 }, "free", { coach: "strategy", weekday: 5 }).ok, false);
  assert.equal(canUse("draft", { ...u, draftsThisMonth: 3 }, "free").ok, false);
  assert.match(canUse("draft", { ...u, draftsThisMonth: 3 }, "free").reason, /Pro drafts everything/);
});
