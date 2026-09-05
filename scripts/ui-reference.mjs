/**
 * Crops of the site's real UI, for the /dev/kit side-by-side.
 *   node scripts/ui-reference.mjs   (needs the Next app on :3111)
 * Each crop is a component the kit reproduces, at 2x device pixels.
 */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const pw = require(process.env.PW_CORE || "/tmp/claude-0/-home-user-TRADING/1449c8d0-9897-58cc-9817-f06389ed6d17/scratchpad/pw/node_modules/playwright-core/index.js");
const OUT = new URL("../apps/mobile/assets/reference/", import.meta.url).pathname;
const b = await pw.chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const ctx = await b.newContext({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 });
const pg = await ctx.newPage();
const shot = async (name, sel, pad = 8) => {
  const el = await pg.$(sel);
  if (!el) { console.log("MISSING", name, sel); return; }
  const box = await el.boundingBox();
  await pg.screenshot({ path: `${OUT}${name}.png`, clip: { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: box.width + pad * 2, height: box.height + pad * 2 } });
  console.log("ok", name, Math.round(box.width), "x", Math.round(box.height));
};
await pg.goto("http://127.0.0.1:3111/", { waitUntil: "domcontentloaded" });
await pg.evaluate(() => (document.documentElement.style.scrollBehavior = "auto"));
await pg.waitForTimeout(2500);
await shot("hero-plate", "figure.relative", 0);
await shot("buttons", 'a[href="/lobby"].btn-press >> xpath=..');
await pg.evaluate(() => document.querySelector("#route")?.scrollIntoView()); await pg.waitForTimeout(1200);
await shot("sign", "#route .clip-badge");
await pg.evaluate(() => document.querySelector("#wall")?.scrollIntoView()); await pg.waitForTimeout(1200);
await shot("input", "#wall input");
await pg.goto("http://127.0.0.1:3111/directory", { waitUntil: "domcontentloaded" }); await pg.waitForTimeout(1500);
await shot("panel", ".panel");
await shot("tags", ".panel .micro.rounded-sm, .panel [class*='border-accent/40'], .panel [class*='border-gold/50']");
// the floor: HUD chips and the dialogue
await pg.evaluate(() => { const c = JSON.parse(localStorage.getItem("founderfloor:v1") || "{}"); localStorage.setItem("founderfloor:v1", JSON.stringify({ ...c, tutorialDone: true, onboarded: true, profile: { ...(c.profile || {}), name: "Ada", look: { skin: 2, outfit: 0, hair: 0 } } })); });
await pg.goto("http://127.0.0.1:3111/floor/main-hall?panel=shop", { waitUntil: "domcontentloaded" });
await pg.waitForSelector("canvas", { timeout: 20000 }); await pg.waitForTimeout(2500);
await shot("dialogue", '[role="dialog"] .panel', 0);
await pg.keyboard.press("Escape"); await pg.waitForTimeout(600);
await shot("hud", ".pointer-events-none.absolute.left-3", 6);
await b.close();
