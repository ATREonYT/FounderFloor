import test from "node:test";
import assert from "node:assert/strict";
import { localMockup, asMockup, buildBrief, builderPrompt, priceIn, MOCKUP_PROMPT } from "../src/workshop.ts";

test("with nothing on the sign the mock-up is a labelled sample; with a sign it is theirs", () => {
  const s = localMockup({});
  assert.equal(s.source, "sample");
  assert.equal(s.name, "Lantern");
  assert.equal(s.screens.length, 3);
  assert.deepEqual(s.screens.map((x) => x.kind), ["landing", "app", "pricing"]);
  const m = localMockup({ name: "Tally", oneLiner: "Weekly numbers for one-person shops.", audience: "shop owners", price: "€12 a month" });
  assert.equal(m.source, "rehearsal");
  assert.equal(m.screens[0].headline, "Weekly numbers for one-person shops");
  assert.match(m.screens[2].headline, /€12 a month/);
  assert.match(m.path, /shop owners/);
});

test("a model mock-up is validated, not trusted", () => {
  assert.equal(asMockup({ name: "x" }), null);
  const ok = asMockup({ name: "Tally", oneLiner: "Numbers", audience: "shops", path: "Land, pay.", keeps: ["a", "b", "c", "d", "e"], screens: [{ kind: "landing", headline: "H", cta: "Go", fields: ["Email"], bullets: ["1", "2", "3", "4"] }, { kind: "weird", headline: "H2", cta: "Do" }, { headline: "" }] });
  assert.ok(ok);
  assert.equal(ok.screens.length, 2);
  assert.equal(ok.screens[1].kind, "app");
  assert.equal(ok.screens[0].bullets.length, 3);
  assert.equal(ok.keeps.length, 4);
  assert.match(MOCKUP_PROMPT, /exactly 3 objects/);
});

test("the brief and the prompts carry the exact words", () => {
  const m = localMockup({ name: "Tally", oneLiner: "Weekly numbers for one-person shops.", audience: "shop owners", price: "€12 a month" });
  const b = buildBrief(m, { notes: ["Maria: I do the till by hand"] });
  assert.match(b, /^# Tally/);
  assert.match(b, /### 1\. The front door \(landing\)/);
  assert.match(b, /Maria: I do the till by hand/);
  assert.match(b, /Stripe Checkout/);
  const lov = builderPrompt("lovable", m, b);
  assert.match(lov, /Make exactly these screens and nothing else/);
  assert.match(lov, /"Weekly numbers for one-person shops"/);
  const cc = builderPrompt("claude", m, b);
  assert.match(cc, /Read BRIEF\.md first/);
  assert.match(cc, /# Tally/);
});

test("the price and the quotes come out of what customers said", () => {
  assert.equal(priceIn(["Maria said she would pay €40 a month if it did the till"]), "€40 a month");
  assert.equal(priceIn(["Kostas: maybe 25 euros per month"]), "25 euros per month");
  assert.equal(priceIn(["nothing here"]), null);
  const m = localMockup({ name: "Tally", oneLiner: "Weekly numbers for one-person shops.", audience: "shop owners", said: ["Maria: I do the till by hand and it takes my Sunday", "Kostas said he would pay €12 a month"] });
  assert.equal(m.screens[2].price, "€12 a month");
  assert.match(m.screens[0].bullets[0], /^"I do the till by hand/);
  assert.ok(m.screens[1].stat);
  assert.ok(m.seed?.includes("Tally"));
  const brief = buildBrief(m);
  assert.match(brief, /The one number, big/);
});
