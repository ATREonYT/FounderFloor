/**
 * MEASURING THE MOCK-UPS INSTEAD OF LOOKING AT THEM.
 *
 * Screens are judged by eye, and the eye is bad at the things that make
 * a screen feel almost-right: a column two pixels wider than its
 * neighbour, a number sitting above the centre of its ring, a tap target
 * eight pixels short. Those are the defects that read as "cheap" without
 * anyone being able to say why, and they are all arithmetic.
 *
 * So this opens every screen of every sample app in a real browser and
 * measures. It knows three rules:
 *
 *   Columns that are meant to be equal are equal. `flex:1` looks like it
 *   promises that and does not — `min-width:auto` lets a column with a
 *   longer label take more room — so the dividers in a stat trio drift
 *   apart and nobody spots it.
 *
 *   A number in a ring sits on the ring's centre. Centring the number
 *   and its caption as a group is geometrically right and optically
 *   wrong by half the caption's height.
 *
 *   Nothing runs off the phone, and nothing you press is under 44 px.
 *   A strip that clips on purpose is allowed its peek — that is how a
 *   row says it scrolls — and a control may keep a small disc and grow
 *   its target past it with ::after, which is what the platform does.
 *
 *   node scripts/measure-mockups.mjs
 *
 * Needs a Chromium and playwright-core. Set CHROME to the binary if it
 * is not where Playwright usually puts it.
 */
import { createRequire } from "node:module";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const require = createRequire(import.meta.url);
let pw;
try {
  pw = require("playwright-core");
} catch {
  console.error("This needs playwright-core: npm i -D playwright-core");
  process.exit(1);
}

const { localMockup } = await import("../packages/shared/src/workshop.ts");
const { studioDesign } = await import("../packages/shared/src/studio/index.ts");

/** Nine products that between them reach every archetype the studio can draw. */
const FOUNDERS = [
  { name: "Lantern", oneLiner: "Prepaid passes for the cafés people come back to.", audience: "independent café owners", price: "€40 a month", said: ["Maria: I do the loyalty cards by hand"], segment: "b2b-saas" },
  { name: "Fixly", oneLiner: "Book a trusted plumber in ten minutes.", audience: "homeowners", price: "€35 a visit", said: [], segment: "services" },
  { name: "Roomly", oneLiner: "Rent a quiet room by the hour.", audience: "freelancers", price: "€8 an hour", said: ["Petros said he would pay €8 an hour"], segment: "marketplace" },
  { name: "Dadfit", oneLiner: "A personal trainer in your pocket for busy dads.", audience: "busy dads", price: "€29 a month", said: [], segment: "consumer" },
  { name: "Numbo", oneLiner: "Ten-minute maths games for kids aged 6 to 9.", audience: "parents", price: "", said: [], segment: "consumer" },
  { name: "Ping", oneLiner: "Group chats for five-a-side teams.", audience: "amateur footballers", price: "", said: [], segment: "consumer" },
  { name: "Hop", oneLiner: "Share a taxi from the airport.", audience: "travellers", price: "€12 a ride", said: [], segment: "marketplace" },
  { name: "Crumb", oneLiner: "Order tomorrow's bread tonight.", audience: "neighbours", price: "€4 a loaf", said: ["Despina: the good bread is gone by nine"], segment: "consumer" },
  { name: "Tally", oneLiner: "Weekly numbers for one-person shops.", audience: "shop owners", price: "€12 a month", said: [], segment: "b2b-saas" },
];

const dir = mkdtempSync(join(tmpdir(), "ff-measure-"));
const browser = await pw.chromium.launch({
  executablePath: process.env.CHROME || undefined,
  proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: "127.0.0.1,localhost" } : undefined,
});
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();

const problems = [];
for (const f of FOUNDERS) {
  const { html } = studioDesign(localMockup(f), { said: f.said, segment: f.segment });
  const file = join(dir, `${f.name}.html`);
  writeFileSync(file, html);
  await page.goto(`file://${file}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(400);
  const found = await page.evaluate(measure);
  for (const line of [...new Set(found)]) problems.push(`${f.name}: ${line}`);
}
await browser.close();

if (problems.length) {
  console.error(`${problems.length} measurement${problems.length === 1 ? "" : "s"} off:\n${problems.map((p) => `  ${p}`).join("\n")}`);
  process.exit(1);
}
console.log(`every measurement clean across ${FOUNDERS.length} apps`);

function measure() {
  const out = [];
  const near = (a, b, t = 1.2) => Math.abs(a - b) <= t;
  document.querySelectorAll(".screen").forEach((screen, si) => {
    const was = screen.classList.contains("on");
    screen.classList.add("on");
    const at = (what) => `screen ${si}: ${what}`;

    for (const sel of [".trio", ".rings", ".tab", ".stats"]) {
      screen.querySelectorAll(sel).forEach((group) => {
        const widths = [...group.children].map((c) => Math.round(c.getBoundingClientRect().width * 10) / 10);
        if (widths.length > 1 && !widths.every((w) => near(w, widths[0]))) out.push(at(`${sel} columns are not equal: ${widths.join(" / ")}`));
      });
    }

    screen.querySelectorAll(".ring").forEach((ring) => {
      const r = ring.getBoundingClientRect();
      const n = ring.querySelector(".rc b")?.getBoundingClientRect();
      if (!n) return;
      const dy = n.top + n.height / 2 - (r.top + r.height / 2);
      const dx = n.left + n.width / 2 - (r.left + r.width / 2);
      if (!near(dy, 0, 1.5)) out.push(at(`the number sits ${dy.toFixed(1)}px off the ring's centre`));
      if (!near(dx, 0, 1.5)) out.push(at(`the number sits ${dx.toFixed(1)}px off across the ring`));
    });

    /** A strip that clips on purpose is allowed to run past the edge: that peek is how a row says it scrolls. */
    const clipped = (el) => {
      for (let p = el.parentElement; p && p !== screen; p = p.parentElement) {
        const o = getComputedStyle(p);
        if (o.overflowX !== "visible" || o.overflowY !== "visible") return true;
      }
      return false;
    };
    screen.querySelectorAll("*").forEach((el) => {
      const b = el.getBoundingClientRect();
      if (b.width <= 0 || clipped(el)) return;
      const name = el.className || el.tagName;
      if (b.left < -0.6 || b.right > 390.6) out.push(at(`.${name} runs off the phone (${b.left.toFixed(0)}…${b.right.toFixed(0)})`));
      if (!el.children.length && el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).textOverflow !== "ellipsis") {
        out.push(at(`.${name} text is cut with nothing saying it could be: "${(el.textContent || "").trim().slice(0, 30)}"`));
      }
    });

    screen.querySelectorAll("[data-go]").forEach((el) => {
      const b = el.getBoundingClientRect();
      if (b.height <= 0) return;
      const grown = parseFloat(getComputedStyle(el, "::after").top || "0");
      const height = b.height + (grown < 0 ? -2 * grown : 0);
      if (height < 43.5) out.push(at(`.${el.className || el.tagName} is only ${height.toFixed(0)}px to press`));
    });

    if (!was) screen.classList.remove("on");
  });
  return out;
}
