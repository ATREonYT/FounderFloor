import test from "node:test";
import assert from "node:assert/strict";
import { asHeadline } from "../src/headline.ts";

test("the explaining frame comes off the front", () => {
  assert.equal(asHeadline("Allows founders to meet and help eachother bring ideas to life"), "Meet and help eachother bring ideas to life");
  assert.equal(asHeadline("An app that books a plumber in ten minutes"), "Books a plumber in ten minutes");
  assert.equal(asHeadline("A platform for renting quiet rooms by the hour"), "Renting quiet rooms by the hour");
  assert.equal(asHeadline("We help you send invoices from any app"), "Send invoices from any app");
  assert.equal(asHeadline("This is a tool that tracks your weekly numbers"), "Tracks your weekly numbers");
  // frames nest, and all of them come off: "an app" wrapping "lets you"
  assert.equal(asHeadline("An app that lets you order tomorrow's bread tonight"), "Order tomorrow's bread tonight");
});

test("a sign that is already a promise is left alone", () => {
  assert.equal(asHeadline("Order tomorrow's bread tonight"), "Order tomorrow's bread tonight");
  assert.equal(asHeadline("Prepaid passes for the cafés people come back to."), "Prepaid passes for the cafés people come back to");
  assert.equal(asHeadline("Book a trusted plumber in ten minutes"), "Book a trusted plumber in ten minutes");
});

test("their spelling is theirs: nothing is corrected or invented", () => {
  const out = asHeadline("Allows founders to meet and help eachother bring ideas to life");
  assert.ok(out.includes("eachother"), "a typo of theirs must survive; the app does not rewrite them");
  for (const word of out.toLowerCase().split(/[^a-z']+/).filter(Boolean)) {
    assert.ok("allows founders to meet and help eachother bring ideas to life".includes(word), `invented the word "${word}"`);
  }
});

test("it never leaves a fragment", () => {
  // cutting would leave almost nothing, so the sign stands whole
  assert.equal(asHeadline("An app for founders"), "An app for founders");
  assert.equal(asHeadline("Helps you"), "Helps you");
  assert.equal(asHeadline(""), "");
  assert.equal(asHeadline("   "), "");
});
