// Dumps the cut's hit points so the sound design can line up with them.
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import { loadPlates } from "./plates-lib.mjs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const browser = await chromium.launch({
  executablePath: process.env.FF_CHROME || undefined,
});
const ctx = await browser.newContext({ viewport: { width: 400, height: 300 } });
await ctx.addInitScript((p) => { window.PLATES = p; }, loadPlates());
const page = await ctx.newPage();
await page.goto(`file://${process.cwd()}/scene.html`, { waitUntil: "load" });
const timing = await page.evaluate(() => window.__timing);
writeFileSync("timing.json", JSON.stringify(timing, null, 2));
await browser.close();
console.log(
  `total ${timing.TOTAL.toFixed(2)}s, ${timing.shots.length} shots, ` +
  `${timing.punch.length} punch cards, ${timing.text.length} text beats`,
);
