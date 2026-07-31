// Fast look at chosen moments of the cut, without paying for a full render.
//   node stills.mjs 0.6 3.9 7.2 ...
import { createRequire } from "node:module";
import { mkdirSync, readFileSync } from "node:fs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const times = process.argv.slice(2).map(Number).filter((n) => !Number.isNaN(n));
mkdirSync("qc", { recursive: true });
const PLATES = Object.fromEntries(
  JSON.parse(readFileSync("../plates.json", "utf8")).map((p) => [p.name, p]),
);

const browser = await chromium.launch({
  executablePath: process.env.FF_CHROME || undefined,
  args: ["--hide-scrollbars", "--autoplay-policy=no-user-gesture-required"],
});
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 0.5 });
await ctx.addInitScript((p) => { window.PLATES = p; }, PLATES);
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR", String(e).slice(0, 200)));
await page.goto(`file://${process.cwd()}/scene.html`, { waitUntil: "load" });
console.log("plates:", (await page.evaluate(() => window.__ready())).join("  "));
console.log("total:", await page.evaluate(() => window.__total));

for (const t of times) {
  await page.evaluate((tt) => window.__seek(tt), t);
  await page.screenshot({ path: `qc/s${t.toFixed(2)}.png` });
}
await browser.close();
console.log("stills:", times.length);
