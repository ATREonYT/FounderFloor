/**
 * Renders the promotional sheets to PNG.
 *
 *   node render.mjs              # all three formats
 *   node render.mjs tall         # just one
 *   node render.mjs --html       # dump the HTML instead, to poke at in a browser
 *
 * Output lands in ../../public/promo/ so the sheets are servable from the
 * site itself (handy when a platform wants a URL rather than an upload).
 *
 * Chromium comes from FF_CHROME, or Playwright's bundled build.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { posterHtml, SIZES } from "./poster.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, "../../public/promo");

const args = process.argv.slice(2);
const htmlOnly = args.includes("--html");
const wanted = args.filter((a) => !a.startsWith("--"));
const formats = wanted.length ? wanted : Object.keys(SIZES);

for (const f of formats) if (!SIZES[f]) throw new Error(`unknown format "${f}" (have: ${Object.keys(SIZES).join(", ")})`);

mkdirSync(OUT, { recursive: true });

if (htmlOnly) {
  for (const f of formats) {
    const p = join(OUT, `founderfloor-${f}.html`);
    writeFileSync(p, posterHtml(f));
    console.log(p);
  }
  process.exit(0);
}

// playwright is a dev-time dependency of the ad pipeline, not of the app
const require = createRequire(process.env.FF_PLAYWRIGHT_FROM || import.meta.url);
const { chromium } = require("playwright");

const browser = await chromium.launch({
  executablePath: process.env.FF_CHROME || undefined,
  args: ["--hide-scrollbars", "--force-color-profile=srgb", "--font-render-hinting=none"],
});

for (const f of formats) {
  const { w, h } = SIZES[f];
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.setContent(posterHtml(f), { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const path = join(OUT, `founderfloor-${f}.png`);
  await page.locator("#sheet").screenshot({ path });
  await ctx.close();
  console.log(`${path}  ${w}x${h} @2x`);
}

await browser.close();
