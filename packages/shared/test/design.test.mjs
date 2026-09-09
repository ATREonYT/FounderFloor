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

test("the model is briefed with the founder's words and forbidden the clichés", async () => {
  const m = localMockup({ name: "Tally", oneLiner: "Weekly numbers for one-person shops.", audience: "shop owners", said: ["Maria: I do the till by hand"] });
  const ctx = designContext(m, buildBrief(m), designDirection("Tally", 3));
  assert.match(ctx, /THE DESIGN SYSTEM/);
  assert.match(ctx, /headline "Weekly numbers for one-person shops"/);
  assert.match(ctx, /Maria: "I do the till by hand"/);
  assert.match(ctx, /THE DESIGN SYSTEM\nFollow the brief's design system/);
  assert.match(designContext(m, buildBrief(m), designDirection("Tally", 3), "direction"), /A DIFFERENT TAKE/);
  assert.match(DESIGN_PROMPT, /no <script> at all/);
  assert.match(DESIGN_PROMPT, /purple-to-blue/);
  assert.match(DESIGN_PROMPT, /data-title/);
  assert.match(DESIGN_PROMPT, /Lovable, Base44/);
  assert.match(DESIGN_PROMPT, /THE CRAFT/);
  assert.match(DESIGN_PROMPT, /remove one accessory/);
  const { BRIEF_PROMPT } = await import("../src/workshop-brief.ts");
  assert.match(BRIEF_PROMPT, /THE CRAFT/);
  assert.match(BRIEF_PROMPT, /calibration list/);
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
  assert.deepEqual(r.screens, [{ id: "s0", title: "Screen 1" }, { id: "s1", title: "Screen 2" }, { id: "s2", title: "Screen 3" }]);
  assert.deepEqual(prepareDesign(good.replace('<section class="screen" id="s2">', '<section class="page" id="s2">')), { error: "expected 3 to 6 screens, found 2" });
  assert.deepEqual(prepareDesign(good.replace('id="s2"', 'id="s4"')), { error: "screens are out of order" });
  assert.deepEqual(prepareDesign(good.replace("<style>", '<link rel="stylesheet" href="https://x.y/z.css"><style>')), { error: "reaches outside the page" });
  assert.deepEqual(prepareDesign(good.replace("body{margin:0}", "body{background:url(https://x.y/a.png)}")), { error: "reaches outside the page" });
  assert.ok("html" in prepareDesign(good.replace('<div data-go="1">go</div>', '<div onclick="steal()" data-go="1">go</div>')));
  assert.doesNotMatch(prepareDesign(good.replace('<div data-go="1">go</div>', '<div onclick="steal()" data-go="1">go</div>')).html, /steal/);
});

test("a designed page with five named screens is kept, and the sample passes the same check", async () => {
  const { designScreens } = await import("../src/design.ts");
  const { SAMPLE_DESIGN_HTML } = await import("../src/sample-design.ts");
  const five = `<!doctype html><html><head><style>body{margin:0}</style></head><body>${[0, 1, 2, 3, 4].map((i) => `<section class="screen${i === 0 ? " on" : ""}" id="s${i}" data-title="Screen &quot;${i}&quot;"><div data-go="${(i + 1) % 5}">go</div></section>`).join("")}</body></html>`;
  const r = prepareDesign(five);
  assert.ok("html" in r);
  assert.equal(r.screens.length, 5);
  assert.equal(r.screens[2].title, 'Screen "2"');
  const s = prepareDesign(SAMPLE_DESIGN_HTML);
  assert.ok("html" in s);
  assert.deepEqual(s.screens.map((x) => x.title), ["The front door", "Today", "A pass", "The price"]);
  assert.ok(SAMPLE_DESIGN_HTML.length < 40000);
  assert.doesNotMatch(SAMPLE_DESIGN_HTML, /<script|https?:\/\//);
  assert.equal(designScreens("<div>none</div>").length, 0);
  const { mockupPoster } = await import("../src/mockup-html.ts");
  const m = localMockup({});
  const poster = mockupPoster(m, s.html);
  assert.equal((poster.match(/__go\((\d)\)/g) ?? []).join(","), "__go(0),__go(1),__go(3)");
  assert.match(poster, /The front door · Today · The price/);
});

test("the fonts service is the one reach allowed, and it is loaded after the page paints", () => {
  const page = (head) => `<!doctype html><html><head>${head}<style>body{margin:0}</style></head><body><section class="screen on" id="s0"><div data-go="1">go</div></section><section class="screen" id="s1"><div data-go="2">go</div></section><section class="screen" id="s2"><div data-go="0">go</div></section></body></html>`;
  const r = prepareDesign(page('<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&amp;display=swap">'));
  assert.ok("html" in r);
  assert.doesNotMatch(r.html, /<link/);
  assert.match(r.html, /fonts\.googleapis\.com\/css2\?family=Inter:wght@400;700&display=swap/);
  assert.match(r.html, /createElement\('link'\)/);
  const i = prepareDesign(page("<style>@import url('https://fonts.googleapis.com/css2?family=Lora');</style>"));
  assert.ok("html" in i);
  assert.doesNotMatch(i.html, /@import/);
  assert.match(i.html, /family=Lora/);
  assert.deepEqual(prepareDesign(page('<link rel="stylesheet" href="https://evil.example/x.css">')), { error: "reaches outside the page" });
});
