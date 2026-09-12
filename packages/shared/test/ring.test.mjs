import test from "node:test";
import assert from "node:assert/strict";
import { ring } from "../src/studio/parts.ts";

const numSize = (html) => Number(/--rn:(\d+)px/.exec(html)?.[1]);
const capSize = (html) => Number(/--rl:(\d+)px/.exec(html)?.[1]);

test("the type in a ring scales with the ring", () => {
  const small = ring(72, "today", 92);
  const large = ring(72, "today", 140);
  assert.ok(numSize(small) < numSize(large), "a small ring must not carry a large ring's number");
  assert.ok(numSize(small) > capSize(small), "the number leads, the caption follows");
  // the number has to clear the stroke: it sits inside the ring, not on it
  assert.ok(numSize(small) * 2.2 < 92, `a ${numSize(small)}px number crowds a 92px ring`);
});

test("a percentage cannot draw an arc longer than the ring", () => {
  const over = ring(140, "goal", 100);
  const under = ring(-20, "goal", 100);
  const full = ring(100, "goal", 100);
  assert.equal(/stroke-dashoffset="([\d.]+)"/.exec(over)[1], /stroke-dashoffset="([\d.]+)"/.exec(full)[1]);
  const whole = /stroke-dasharray="([\d.]+)"/.exec(under)[1];
  assert.equal(/stroke-dashoffset="([\d.]+)"/.exec(under)[1], whole, "nothing done is an empty ring, not a backwards one");
  // the label still reads what it was given, so a wrong number is visible rather than hidden
  assert.match(over, />140%</);
});

test("the number sits on the ring's centre, not the column's", () => {
  const html = ring(55, "week", 92);
  // the caption hangs below, so the group is nudged down by half of it
  assert.match(html, /class="rc" style="--rn:\d+px;--rl:\d+px"/);
  assert.match(html, /<b>55%<\/b><span>week<\/span>/);
});
