import test from "node:test";
import assert from "node:assert/strict";
import { scene, sceneDefs, sceneFor } from "../src/studio/scenes.ts";

test("a noun finds the drawing of the thing it names", () => {
  assert.equal(sceneFor("bread"), "bread");
  assert.equal(sceneFor("loaf"), "bread");
  assert.equal(sceneFor("quiet room"), "room");
  assert.equal(sceneFor("prepaid pass"), "abstract"); // nothing to draw; shapes, quietly
  assert.equal(sceneFor("visit"), "tool");
  assert.equal(sceneFor("post"), "person");
  assert.equal(sceneFor("invoice"), "document");
});

test("plurals and phrases still find it", () => {
  assert.equal(sceneFor("breads"), "bread");
  assert.equal(sceneFor("deliveries"), "vehicle");
  assert.equal(sceneFor("Order tomorrow's bread tonight"), "bread");
  assert.equal(sceneFor(""), "abstract");
  assert.equal(sceneFor(null), "abstract");
});

test("a drawing is safe to put in a page and carries no colour of its own", () => {
  const html = scene("bread", 3);
  const defs = sceneDefs(["bread"]);
  assert.match(html, /^<svg class="art"/);
  assert.match(html, /<\/svg>$/);
  for (const part of [html, defs]) {
    assert.doesNotMatch(part, /<script|url\(http/i);
    // every colour comes from the plan's variables, so a picture moves with the
    // palette. #fff and #000 are the light and the shadow, the same in every one.
    const literals = part.match(/#[0-9a-f]{3,6}/gi) ?? [];
    assert.deepEqual(
      [...new Set(literals.map((c) => c.toLowerCase()))].filter((c) => c !== "#fff" && c !== "#000"),
      [],
    );
  }
  // the drawing is defined once and referenced, not copied into every picture
  assert.match(html, /<use href="#sc-bread"\/>/);
  assert.ok(html.length < 400, `a picture costs ${html.length} bytes`);
  assert.match(defs, /<g id="sc-bread">/);
  assert.match(defs, /<g id="sc-abstract">/);
});

test("a document only defines the drawings it uses", () => {
  const one = sceneDefs(["bread"]);
  assert.doesNotMatch(one, /id="sc-vehicle"/);
  assert.ok(sceneDefs(["bread", "room", "vehicle"]).length > one.length);
});

test("two pictures of the same thing are not the same picture", () => {
  const a = scene("bread", 1);
  const b = scene("bread", 2);
  const c = scene("bread", 9);
  assert.notEqual(a, b);
  assert.notEqual(b, c);
  // and the same seed always draws the same thing, so a screen does not
  // reshuffle itself every time it is opened
  assert.equal(scene("bread", 1), a);
});

test("every subject the matcher can return actually draws something", () => {
  for (const word of ["bread", "coffee", "post", "room", "visit", "workout", "lesson", "trip", "invoice", "parcel", "flower", "dress", "dog", "event", "chat", "song", "listing", "whatnot"]) {
    const html = scene(word, 4);
    assert.ok(html.length > 200, `${word} drew almost nothing`);
    assert.match(html, /<(path|rect|circle|ellipse)/, `${word} drew no shapes`);
  }
});
