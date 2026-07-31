// Fast look at chosen moments, without paying for a render.
//   node stills.mjs 0.6 3.9 7.2 ...
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { loadPlates } from "./plates-lib.mjs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const times = process.argv.slice(2).map(Number).filter((n) => !Number.isNaN(n));
mkdirSync("qc", { recursive: true });
const PLATES = loadPlates();

const browser = await chromium.launch({
  executablePath: process.env.FF_CHROME || undefined,
  args: ["--hide-scrollbars"],
});
const ctx = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: Number(process.env.DSF || 0.5),
});
await ctx.addInitScript((p) => { window.PLATES = p; }, PLATES);
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR", String(e).slice(0, 240)));
page.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE", m.text().slice(0, 200)); });
await page.goto(`file://${process.cwd()}/scene.html`, { waitUntil: "load" });
console.log("plates:", (await page.evaluate(() => window.__ready())).join("  "));
console.log("total:", await page.evaluate(() => window.__total));
let i = 0;
for (const t of times) {
  await page.evaluate((tt) => window.__seek(tt), t);
  await page.screenshot({ path: `qc/${String(i++).padStart(2, "0")}-t${t.toFixed(2)}.png` });
}
await browser.close();
console.log("stills:", times.length);
