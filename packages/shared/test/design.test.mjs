import test from "node:test";
import assert from "node:assert/strict";
import { designDirection, directionLine, DESIGN_PROMPT, designContext, extractHtml, prepareDesign, designOn } from "../src/design.ts";
import { localMockup, buildBrief } from "../src/workshop.ts";

test("directions differ by company and by seed, and read as one line", () => {
  const a = designDirection("Tally", 1), b = designDirection("Tally", 2), c = designDirection("Roomly", 1);
  assert.notDeepEqual(a, b);
  assert.notDeepEqual(a, c);
  assert.match(directionLine(a), /^As if by /);
  const set = new Set(Array.from({ length: 60 }, (_, i) => directionLine(designDirection("Tally", i))));
  assert.ok(set.size >= 50);
});

test("the model is briefed with the founder's words and forbidden the clichés", () => {
  const m = localMockup({ name: "Tally", oneLiner: "Weekly numbers for one-person shops.", audience: "shop owners", said: ["Maria: I do the till by hand"] });
  const ctx = designContext(m, buildBrief(m), designDirection("Tally", 3));
  assert.match(ctx, /DESIGN DIRECTION/);
  assert.match(ctx, /headline "Weekly numbers for one-person shops"/);
  assert.match(ctx, /Maria: "I do the till by hand"/);
  assert.match(DESIGN_PROMPT, /no <script> tags/);
  assert.match(DESIGN_PROMPT, /purple-to-blue/);
});

test("a reply is checked, stripped and wired before it runs", () => {
  const good = `<!doctype html><html><head><style>body{margin:0}</style></head><body><section class="screen on" id="s0"><div data-go="1">go</div></section><section class="screen" id="s1"><div data-go="2">go</div></section><section class="screen" id="s2"><div data-go="0">go</div></section><script>alert(1)</script></body></html>`;
  assert.equal(extractHtml("Here you go:\n```html\n" + good + "\n```"), good);
  assert.equal(extractHtml("no html here"), null);
  const r = prepareDesign(good);
  assert.ok("html" in r);
  assert.doesNotMatch(r.html, /alert\(1\)/);
  assert.match(r.html, /window\.__go=go/);
  assert.match(r.html, /\.screen\{display:none\}/);
  assert.match(designOn(r.html, 2), /__go\(2\)/);
  assert.deepEqual(prepareDesign(good.replace('<section class="screen" id="s2">', '<section class="page" id="s2">')), { error: "expected 3 screens, found 2" });
  assert.deepEqual(prepareDesign(good.replace("<style>", '<link rel="stylesheet" href="https://x.y/z.css"><style>')), { error: "reaches outside the page" });
  assert.deepEqual(prepareDesign(good.replace("body{margin:0}", "body{background:url(https://x.y/a.png)}")), { error: "reaches outside the page" });
  assert.ok("html" in prepareDesign(good.replace('<div data-go="1">go</div>', '<div onclick="steal()" data-go="1">go</div>')));
  assert.doesNotMatch(prepareDesign(good.replace('<div data-go="1">go</div>', '<div onclick="steal()" data-go="1">go</div>')).html, /steal/);
});
