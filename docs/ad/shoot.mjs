/**
 * Films the FounderFloor ad against the local floor (seed-floor.mjs must be
 * running). Every beat is a real browser session recorded at 1920x1080;
 * captions are injected into the page itself, in the site's own type and
 * palette, so they are captured in-camera rather than composited later.
 *
 * Writes raw/<beat>.webm plus beats.json: { file, start, dur } in seconds,
 * where `start` is measured from the first recorded frame.
 */
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from "node:fs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = process.env.FF_BASE || "http://127.0.0.1:3200";
/** FF_RAW picks the output folder; FF_NOCAPS=1 films clean plates with no
 * captions, for a cut that adds its own typography in post. */
const RAW = process.env.FF_RAW || "raw";
const BEATS = process.env.FF_BEATS || "beats.json";
const CAPTIONS = process.env.FF_NOCAPS !== "1";
const VIEW = { width: 1920, height: 1080 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Beat order in the cut. Pass names on argv to re-shoot only those. */
const ORDER = ["walk", "stand", "chat", "directory", "designer", "claim", "demonight", "endcard"];
const ONLY = process.argv.slice(2);
const want = (n) => ONLY.length === 0 || ONLY.includes(n);

mkdirSync(RAW, { recursive: true });

const MY_STARTUP = {
  id: "mine",
  name: "Fernweh",
  oneLiner: "Trip planning for people who hate planning",
  pitch: "",
  founder: "Alex",
  category: "Consumer",
  goal: "First 10 customers",
  goalProgress: 0.2,
  verifiedRevenue: 0,
  seekingCofounder: false,
  booth: { carpet: "#D9480F", banner: "#23201A", sign: "FERNWEH", glyph: "wave", pattern: "border" },
};

const browser = await chromium.launch({
  // FF_CHROME overrides the browser; unset, Playwright uses its own build.
  executablePath: process.env.FF_CHROME || undefined,
  args: ["--hide-scrollbars"],
});

// ---------------------------------------------------------------- identity
// Boot once in a throwaway context so the store mints a real profile, then
// replay that exact blob into every filmed context — no setup on camera.
const seedCtx = await browser.newContext({ viewport: VIEW });
const seedPage = await seedCtx.newPage();
await seedPage.goto(BASE + "/lobby", { waitUntil: "domcontentloaded" });
await seedPage.waitForFunction(
  () => {
    try {
      return Boolean(JSON.parse(localStorage.getItem("founderfloor:v1") ?? "{}").profile?.id);
    } catch {
      return false;
    }
  },
  { timeout: 25000 },
);
const SEED = await seedPage.evaluate((startup) => {
  const cur = JSON.parse(localStorage.getItem("founderfloor:v1") ?? "{}");
  const next = {
    ...cur,
    profile: { ...(cur.profile ?? {}), name: "Alex", look: { skin: 1, outfit: 3, hair: 2 } },
    myStartup: startup,
    tutorialDone: true,
    onboarding: ["move", "interact", "talk", "emote", "connect"],
    // already banked, so the "First steps" toast doesn't pop in every take
    claimedQuests: ["first-steps"],
    claims: {},
  };
  let gs = localStorage.getItem("founderfloor:gs");
  if (!gs) {
    gs = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  return { state: JSON.stringify(next), gs };
}, MY_STARTUP);
await seedCtx.close();
console.log("[shoot] identity seeded");

// ---------------------------------------------------------------- captions
const CAPTION_CSS = `
.ffad{position:fixed;left:50%;bottom:150px;z-index:2147483600;
  display:flex;gap:22px;align-items:center;max-width:1120px;
  background:#F2EFE7;border:1px solid #E4DFD3;border-radius:18px;
  padding:22px 34px 22px 28px;
  box-shadow:0 1px 2px rgba(35,32,26,.06),0 20px 50px -18px rgba(35,32,26,.42);
  opacity:0;transform:translate(-50%,16px);
  transition:opacity .36s ease, transform .36s cubic-bezier(.2,.7,.2,1);
  pointer-events:none;}
.ffad.on{opacity:1;transform:translate(-50%,0);}
.ffad .bar{width:4px;align-self:stretch;border-radius:2px;background:#D9480F;flex:none;}
.ffad .eb{font:600 13px/1 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  letter-spacing:.16em;text-transform:uppercase;color:#6F6A5E;margin-bottom:11px;}
.ffad .hd{font-family:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;
  font-size:40px;line-height:1.14;letter-spacing:-.012em;color:#23201A;white-space:nowrap;}
`;

async function captionIn(page, eyebrow, head) {
  if (!CAPTIONS) return;
  await page.evaluate(
    ([css, eb, hd]) => {
      if (!document.getElementById("ffad-style")) {
        const s = document.createElement("style");
        s.id = "ffad-style";
        s.textContent = css;
        document.head.appendChild(s);
      }
      let el = document.getElementById("ffad-cap");
      if (!el) {
        el = document.createElement("div");
        el.id = "ffad-cap";
        el.className = "ffad";
        el.innerHTML = '<div class="bar"></div><div><div class="eb"></div><div class="hd"></div></div>';
        document.body.appendChild(el);
      }
      el.querySelector(".eb").textContent = eb;
      el.querySelector(".hd").textContent = hd;
      el.classList.remove("on");
      // force a reflow so the transition runs from the reset state
      void el.offsetWidth;
      requestAnimationFrame(() => el.classList.add("on"));
    },
    [CAPTION_CSS, eyebrow, head],
  );
}

async function captionOut(page) {
  if (!CAPTIONS) return;
  await page.evaluate(() => {
    const el = document.getElementById("ffad-cap");
    if (el) el.classList.remove("on");
  });
}

/** Ease a page scroll over `ms` — Chromium's smooth scroll is uncontrollable. */
async function glide(page, to, ms) {
  await page.evaluate(
    ([target, dur]) => {
      const from = window.scrollY;
      const t0 = performance.now();
      return new Promise((done) => {
        const step = (t) => {
          const p = Math.min(1, (t - t0) / dur);
          const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
          window.scrollTo(0, from + (target - from) * e);
          if (p < 1) requestAnimationFrame(step);
          else done();
        };
        requestAnimationFrame(step);
      });
    },
    [to, ms],
  );
}

// ------------------------------------------------------------------- beats
const beats = [];

async function film(name, fn) {
  if (!want(name)) return;
  const ctx = await browser.newContext({
    viewport: VIEW,
    deviceScaleFactor: 1,
    recordVideo: { dir: RAW, size: VIEW },
  });
  await ctx.addInitScript(
    ([state, gs]) => {
      try {
        localStorage.setItem("founderfloor:v1", state);
        localStorage.setItem("founderfloor:gs", gs);
      } catch {}
    },
    [SEED.state, SEED.gs],
  );
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log(`  [${name}] PAGEERROR`, String(e).slice(0, 140)));
  const t0 = Date.now();
  let mark = null;
  const start = () => {
    mark = Date.now();
  };
  await fn(page, start);
  const end = Date.now();
  const video = page.video();
  await ctx.close();
  const src = await video.path();
  const dest = `${RAW}/${name}.webm`;
  renameSync(src, dest);
  const startS = ((mark ?? t0) - t0) / 1000;
  const durS = (end - (mark ?? t0)) / 1000;
  beats.push({ name, file: dest, start: Number(startS.toFixed(2)), dur: Number(durS.toFixed(2)) });
  console.log(`  [${name}] start ${startS.toFixed(2)}s  dur ${durS.toFixed(2)}s`);
}

const floorReady = async (page, url) => {
  await page.goto(BASE + url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("canvas", { timeout: 25000 });
};

// 1 — the hall: an establishing walk with people in it
await film("walk", async (page, start) => {
  await floorReady(page, "/floor/main-hall?spot=6");
  await sleep(2600); // world settles, auto-walk under way
  start();
  await captionIn(page, "FounderFloor", "A trade-show floor that never tears down.");
  await sleep(3400);
  await captionOut(page);
  await sleep(350);
  await page.keyboard.down("KeyA");
  await sleep(1300);
  await page.keyboard.up("KeyA");
  await captionIn(page, "Main Hall · open now", "Twelve stands. One room. No calendar invite.");
  await sleep(1000);
  await page.keyboard.down("KeyS");
  await sleep(800);
  await page.keyboard.up("KeyS");
  await sleep(900);
  await captionOut(page);
  await sleep(420);
});

// 2 — walk up to a stand and read it
await film("stand", async (page, start) => {
  await floorReady(page, "/floor/main-hall?spot=5");
  await sleep(3200); // most of the auto-walk happens off camera
  start();
  await sleep(1100); // the last few steps are on camera
  await page.keyboard.press("KeyE");
  await captionIn(page, "Step 01", "Walk up to a stand and read the pitch.");
  await sleep(4000);
  await captionOut(page);
  await sleep(420);
});

// 3 — say something
await film("chat", async (page, start) => {
  await floorReady(page, "/floor/main-hall?spot=8"); // a different stand, so the cut isn't a jump
  await sleep(4200);
  await page.locator('section[aria-label="Chat (collapsed)"] button').first().click();
  await sleep(900);
  const box = page.locator("#chat-input");
  await box.click();
  start();
  await captionIn(page, "Step 02", "Say something. That's the whole introduction.");
  await box.type("morning — who here has paying users already?", { delay: 45 });
  await sleep(400);
  await page.keyboard.press("Enter");
  await sleep(2800);
  await captionOut(page);
  await sleep(420);
});

// 4 — the directory
await film("directory", async (page, start) => {
  await page.goto(BASE + "/directory", { waitUntil: "domcontentloaded" });
  await sleep(2600);
  start();
  await captionIn(page, "Step 03", "Every startup on the floor, in one directory.");
  await sleep(1000);
  await glide(page, 430, 2200);
  await sleep(1200);
  await captionOut(page);
  await sleep(420);
});

// 5 — design the stand
await film("designer", async (page, start) => {
  await page.goto(BASE + "/profile", { waitUntil: "domcontentloaded" });
  await sleep(2600);
  const carpet = page.locator('button[aria-label^="Carpet color"]');
  const banner = page.locator('button[aria-label^="Banner color"]');
  // Frame on the swatches Playwright is about to click: click() auto-scrolls
  // its target into view, and a scroll one second into the shot reads as a
  // mistake. Park the camera where the clicks will leave it.
  await page.locator("h2", { hasText: "My stand" }).first().scrollIntoViewIfNeeded();
  await sleep(900);
  await page.evaluate(() => {
    const h = [...document.querySelectorAll("h2")].find((n) => n.textContent.trim() === "My stand");
    if (h) window.scrollTo(0, window.scrollY + h.getBoundingClientRect().top - 70);
  });
  await sleep(1400);
  start();
  await captionIn(page, "Step 04", "Design your own stand — sign, colors, props.");
  await sleep(900);
  console.log(`  [designer] swatches carpet=${await carpet.count()} banner=${await banner.count()}`);
  for (const [loc, i] of [[carpet, 5], [banner, 2], [carpet, 8]]) {
    if (await loc.count()) {
      await loc.nth(i).click();
      await sleep(900);
    }
  }
  await sleep(800);
  await captionOut(page);
  await sleep(420);
});

// 6 — claim the open spot
await film("claim", async (page, start) => {
  await floorReady(page, "/floor/main-hall?spot=11");
  await sleep(4600);
  start();
  await sleep(900);
  await page.keyboard.press("KeyE");
  await captionIn(page, "Step 05", "Claim a spot. It gets its own address.");
  await sleep(1700);
  const claim = page
    .locator("button", { hasText: /claim this stand|move your stand here/i })
    .first();
  if (await claim.count()) await claim.click();
  else console.log("  [claim] claim button not found:", await page.locator("button").allInnerTexts());
  await sleep(2100);
  await page.keyboard.press("Escape");
  await sleep(250);
  await page.keyboard.down("KeyS");
  await sleep(650);
  await page.keyboard.up("KeyS");
  await sleep(1400);
  await captionOut(page);
  await sleep(420);
});

// 7 — demo night
await film("demonight", async (page, start) => {
  await page.goto(BASE + "/lobby", { waitUntil: "domcontentloaded" });
  await sleep(2600);
  start();
  await captionIn(page, "Every Thursday", "Demo Night — the whole floor turns up.");
  await sleep(900);
  await glide(page, 140, 2000); // the lobby is short — more than this lands on the footer
  await sleep(1100);
  await captionOut(page);
  await sleep(420);
});

// 8 — end card
await film("endcard", async (page, start) => {
  await page.goto(`file://${process.cwd()}/endcard.html`, { waitUntil: "load" });
  start();
  await sleep(4900);
});

// merge with any earlier take so single beats can be re-shot
const prev = existsSync(BEATS) ? JSON.parse(readFileSync(BEATS, "utf8")) : [];
const byName = new Map(prev.map((b) => [b.name, b]));
for (const b of beats) byName.set(b.name, b);
const merged = ORDER.map((n) => byName.get(n)).filter(Boolean);
writeFileSync(BEATS, JSON.stringify(merged, null, 2));
await browser.close();
console.log("\n[shoot] done —", beats.length, "beat(s) filmed,", merged.length, "in the cut");
