// Renders squareframe.html to a transparent 1080x1080 PNG for the square cut.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({
  executablePath: process.env.FF_CHROME || undefined,
  args: ["--hide-scrollbars"],
});
const page = await (await browser.newContext({
  viewport: { width: 1080, height: 1080 },
  deviceScaleFactor: 1,
})).newPage();
await page.goto(`file://${process.cwd()}/squareframe.html`, { waitUntil: "load" });
await sleep(700);
await page.screenshot({ path: "squareframe.png", omitBackground: true });
await browser.close();
console.log("squareframe.png");
