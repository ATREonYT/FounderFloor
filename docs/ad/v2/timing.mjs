// Dumps the cut's hit points so the sound design can line up with them.
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const PLATES = Object.fromEntries(
  JSON.parse(readFileSync("../plates.json", "utf8")).map((p) => [p.name, p]),
);
const browser = await chromium.launch({
  executablePath: process.env.FF_CHROME || undefined,
});
const ctx = await browser.newContext({ viewport: { width: 400, height: 300 } });
await ctx.addInitScript((p) => { window.PLATES = p; }, PLATES);
const page = await ctx.newPage();
await page.goto(`file://${process.cwd()}/scene.html`, { waitUntil: "load" });
const timing = await page.evaluate(() => window.__timing);
writeFileSync("timing.json", JSON.stringify(timing, null, 2));
await browser.close();
console.log(`total ${timing.TOTAL}s, ${timing.shots.length} shots, ${timing.text.length} text beats`);
