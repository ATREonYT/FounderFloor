import test from "node:test";
import assert from "node:assert/strict";
import { readProduct, designPlan, planText, tokens, archetypeOf, treatmentOf, contrast } from "../src/studio/plan.ts";
import { unitOf, singular, detailTitle } from "../src/studio/nouns.ts";
import { studioDesign, parseMoney } from "../src/studio/index.ts";
import { PRODUCTS, FONTS } from "../src/studio/tables.ts";
import { localMockup } from "../src/workshop.ts";
import { prepareDesign } from "../src/design.ts";

test("the tables are whole: 192 products with palettes, 74 pairings", () => {
  assert.equal(PRODUCTS.length, 192);
  assert.equal(FONTS.length, 74);
  for (const p of PRODUCTS) {
    assert.ok(p.k.length > 0, p.t);
    assert.match(p.c.p, /^#[0-9A-Fa-f]{6}$/);
    assert.match(p.c.bg, /^#[0-9A-Fa-f]{6}$/);
  }
});

test("words are read singular, without accents or filler", () => {
  assert.deepEqual(tokens("Prepaid passes for the cafés people come back to."), ["prepaid", "pass", "cafe"]);
  assert.deepEqual(tokens("Meal plans for people with diabetes"), ["meal", "plan", "diabetes"]);
  assert.ok(!tokens("bring ideas to life").includes("idea"));
});

test("the founder's words are read as the right kind of product", () => {
  const top = (sign, audience, segment, said = []) => readProduct({ sign, audience, segment, said })[0].product.t;
  assert.equal(top("Prepaid passes for the cafés people come back to.", "independent café owners", "b2b-saas"), "Bakery/Cafe");
  assert.equal(top("Book a trusted plumber in ten minutes.", "homeowners", "services"), "Home Services (Plumber/Electrician)");
  assert.equal(top("A personal trainer in your pocket for busy dads.", "busy dads", "consumer"), "Fitness/Gym App");
  assert.equal(top("One API for sending invoices from any app.", "indie developers", "b2b-saas"), "Invoice & Billing Tool");
  assert.equal(top("Ten-minute maths games for kids aged 6 to 9.", "parents", "consumer"), "Kids Learning (ABC & Math)");
  assert.equal(top("Allows founders to meet and help eachother bring ideas to life", "developers", "consumer"), "Membership/Community");
  assert.equal(top("Weekly numbers for one-person shops.", "shop owners", "b2b-saas"), "Analytics Dashboard");
  // nothing matched: the kind decides
  assert.equal(readProduct({ sign: "Zxq", kind: "services" })[0].product.t, "Booking & Appointment App");
});

test("the unit is the noun the product deals in", () => {
  assert.equal(unitOf("Prepaid passes for the cafés people come back to.", "ledger"), "prepaid pass");
  assert.equal(unitOf("Rent a quiet room by the hour.", "listings"), "quiet room");
  assert.equal(unitOf("Book a trusted plumber in ten minutes.", "bookings"), "visit");
  assert.equal(unitOf("A personal trainer in your pocket for busy dads.", "tracker"), "workout");
  assert.equal(unitOf("One API for sending invoices from any app.", "ledger"), "invoice");
  assert.equal(unitOf("Sell your handmade jewellery without a shop.", "listings"), "handmade jewellery");
  assert.equal(unitOf("Zxq wibble flarp gronk yonder blorp", "learn"), "lesson");
  assert.equal(singular("weekly numbers"), "weekly number");
  assert.equal(singular("passes"), "pass");
  assert.equal(detailTitle("ledger", "invoice"), "An invoice");
  assert.equal(detailTitle("feed", "idea"), "A post");
});

test("a business's product gets a business's screen; styles map to treatments", () => {
  const cafe = PRODUCTS.find((p) => p.t === "Bakery/Cafe");
  assert.equal(archetypeOf(cafe, "saas", false), "store");
  assert.equal(archetypeOf(cafe, "saas", true), "ledger");
  assert.equal(treatmentOf("Glassmorphism + Flat Design"), "glass");
  assert.equal(treatmentOf("Neubrutalism"), "brutal");
  assert.equal(treatmentOf("Something unknown"), "flat");
  assert.ok(contrast("#000000", "#FFFFFF") > 20);
});

test("the plan is steady for a seed and different for another, and reads as a design system", () => {
  const input = { name: "Fixly", sign: "Book a trusted plumber in ten minutes.", audience: "homeowners", segment: "services" };
  const a = designPlan(input, 0), b = designPlan(input, 0), c = designPlan(input, 1);
  assert.deepEqual([a.colours.p, a.fonts.name, a.treatment.id], [b.colours.p, b.fonts.name, b.treatment.id]);
  assert.ok(a.fonts.name !== c.fonts.name || a.treatment.id !== c.treatment.id || a.colours.p !== c.colours.p);
  assert.match(a.fonts.link, /^https:\/\/fonts\.googleapis\.com\/css2\?family=/);
  assert.match(planText(a), /- Colour: background #/);
  assert.match(planText(a), /- Navigation: /);
  assert.equal(a.archetype, "bookings");
  const chosen = designPlan(input, 0, "Veterinary Clinic");
  assert.equal(chosen.product.t, "Veterinary Clinic");
});

test("money is read with its unit", () => {
  assert.deepEqual(parseMoney("€8 an hour"), { text: "€8 an hour", sym: "€", n: 8, per: "an hour" });
  assert.equal(parseMoney("$19 a month").sym, "$");
  assert.equal(parseMoney("12 euros per week").per, "per week");
  assert.equal(parseMoney("free"), null);
});

test("every founder gets a whole app that passes the page check, with three to five named screens", () => {
  const founders = [
    { name: "Lantern", oneLiner: "Prepaid passes for the cafés people come back to.", audience: "independent café owners", price: "€40 a month", said: ["Maria: I do the loyalty cards by hand"], segment: "b2b-saas" },
    { name: "Fixly", oneLiner: "Book a trusted plumber in ten minutes.", audience: "homeowners", price: "€35 a visit", said: [], segment: "services" },
    { name: "Roomly", oneLiner: "Rent a quiet room by the hour.", audience: "freelancers", price: "€8 an hour", said: ["Petros said he would pay €8 an hour"], segment: "marketplace" },
    { name: "Dadfit", oneLiner: "A personal trainer in your pocket for busy dads.", audience: "busy dads", price: "€29 a month", said: [], segment: "consumer" },
    { name: "Numbo", oneLiner: "Ten-minute maths games for kids aged 6 to 9.", audience: "parents", price: "", said: [], segment: "consumer" },
    { name: "Ping", oneLiner: "Group chats for five-a-side teams.", audience: "amateur footballers", price: "", said: [], segment: "consumer" },
    { name: "Hop", oneLiner: "Share a taxi from the airport.", audience: "travellers", price: "€12 a ride", said: [], segment: "marketplace" },
  ];
  const seen = new Set();
  for (const f of founders) {
    const m = localMockup(f);
    const r = studioDesign(m, { said: f.said, segment: f.segment });
    const out = prepareDesign(r.html);
    assert.ok("html" in out, `${f.name}: ${"error" in out ? out.error : ""}`);
    assert.ok(r.screens.length >= 3 && r.screens.length <= 5, f.name);
    assert.equal(r.screens[0].title, "The front door");
    assert.equal(r.screens[r.screens.length - 1].title, "The price");
    assert.match(r.html, new RegExp(f.name));
    assert.match(r.html, /data-title="/);
    assert.doesNotMatch(r.html, /\$\{|undefined|NaN/);
    assert.ok(r.html.length < 60000, `${f.name} ${r.html.length}`);
    seen.add(`${r.plan.archetype}|${r.plan.treatment.id}|${r.plan.colours.p}`);
  }
  assert.ok(seen.size >= 5, "the founders' apps should differ");
});
