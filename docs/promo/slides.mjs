/**
 * The TikTok slideshow: nine vertical cards, 1080x1920.
 *
 * A different job from the printed sheets, so a different design rather
 * than the same one squeezed into 9:16. The constraints that drive it:
 *
 *   - Slide one gets about a second, at thumbnail size, usually muted. It
 *     has to be legible as an idea before it is legible as text, so the
 *     type is enormous and there is exactly one sentence on it.
 *   - The whole hall shown on a phone is a smudge. Every slide after the
 *     establishing shot uses a close-up from scene.mjs VIEWS instead, so
 *     the thing being pointed at is actually visible.
 *   - Nobody swipes for a brochure. Each card carries one line and one
 *     picture; the argument is the sequence, not any single card.
 *
 * What it deliberately does NOT do is adopt the look of the feed. Every
 * other founder slideshow is white Helvetica on a stock photo with a drop
 * shadow. This is paper, a serif, and pixel art, which is the only reason
 * a thumb might stop on it.
 */
import { PLATE_SCRIPT } from "./poster.mjs";
import { VIEWS } from "./scene.mjs";

export const SLIDE_SIZE = { w: 1080, h: 1920 };

/**
 * The deck.
 *
 * `line` is the one sentence. `kicker` is the tiny label above it. `view`
 * names a close-up from scene.mjs, `frame` picks the moment in the loop,
 * and `art` is how much of the card the picture gets:
 *
 *   "wide"  a landscape strip — for the establishing shot
 *   "tall"  a portrait plate — for close-ups
 *   "none"  no picture at all — for the hook and the sign-off
 *
 * Sentence case, not TikTok lowercase: the whole point of the look is that
 * it does not sound like everything else in the feed.
 */
export const SLIDES = [
  {
    kicker: "01",
    line: "Every founder community I joined was dead in a month.",
    art: "none",
    note: "Discord, Slack, a forum. Busy for two weeks, then a graveyard.",
  },
  {
    kicker: "02",
    line: "The problem was never the app.",
    art: "none",
    note: "Nobody is ever online at the same time as you. You post, and either three people are awake or none are.",
  },
  {
    kicker: "03",
    line: "So I built a floor you walk into.",
    art: "wide",
    view: "full",
    frame: 340,
    note: "Free, in the browser, nothing to install.",
  },
  {
    kicker: "04",
    line: "Every stand has a real person standing at it.",
    art: "tall",
    view: "gold",
    // a quiet frame: every speech window in the loop is elsewhere, so no
    // bubble drifts into this close-up and gets cropped by its edge
    frame: 690,
  },
  {
    kicker: "05",
    line: "Walk up. Press E.",
    art: "tall",
    view: "talk",
    frame: 205,
  },
  {
    kicker: "06",
    line: "And a real person answers.",
    art: "tall",
    view: "answer",
    // the founder mid-reply, not the visitor: the whole claim of the card
    // is that somebody is on the other end
    frame: 470,
  },
  {
    kicker: "07",
    line: "Twenty-four stands. One of them can be yours.",
    art: "tall",
    view: "vacant",
    frame: 120,
  },
  {
    kicker: "08",
    line: "Everyone shows up at the same hour, once a week.",
    art: "tall",
    view: "pair",
    frame: 400,
    note: "Sunday 18:00 CET / 12:00 ET. A room is only a room when people are in it.",
  },
  {
    kicker: "09",
    line: "founderfloor.net",
    art: "none",
    cta: true,
    note: "Walk in as a guest. No card, no download.",
  },
];

const CSS = `
  * { margin:0; padding:0; box-sizing:border-box; }
  :root {
    --paper:#F2EFE7; --panel:#FFFFFF; --ink:#23201A; --muted:#6F6A5E;
    --line:#E4DFD3; --accent:#D9480F; --gold:#B08D2E; --gold-deep:#7A611F;
    --display:"Charter","Bitstream Charter","Liberation Serif","DejaVu Serif",serif;
    --sans:"Liberation Sans","DejaVu Sans",sans-serif;
    --mono:"DejaVu Sans Mono","Liberation Mono",monospace;
  }
  html,body { background:#fff; }
  body { font-family:var(--sans); color:var(--ink); -webkit-font-smoothing:antialiased; }

  .sheet {
    position:relative; width:1080px; height:1920px; overflow:hidden;
    background:var(--paper);
    background-image:radial-gradient(110% 45% at 50% -6%, #FFFDF6, rgba(255,253,246,.5) 45%, rgba(242,239,231,0) 78%);
    display:flex; flex-direction:column; padding:70px 68px 64px;
  }
  .grain { position:absolute; inset:0; width:100%; height:100%; opacity:.055; mix-blend-mode:multiply; pointer-events:none; }

  /* ---- masthead: a hairline, not a logo lockup. It is the ninth most
         important thing on the card and should take the ninth most space. */
  .mast { display:flex; align-items:center; justify-content:space-between;
    border-bottom:2px solid var(--ink); padding-bottom:16px; }
  .mast-l { display:flex; align-items:center; gap:14px; }
  .mark { width:16px; height:16px; background:var(--accent); transform:rotate(45deg); }
  .wordmark { font-family:var(--display); font-size:30px; letter-spacing:-.012em; }
  .spec { font-family:var(--mono); font-size:16px; text-transform:uppercase;
    letter-spacing:.18em; color:var(--muted); }

  /* ---- the line. This is the slide; everything else is scenery. */
  .body { position:relative; z-index:1; display:flex; flex-direction:column; flex:1; }
  /* A card with no picture has nothing to push the type down, so it hangs
     from the masthead with 900px of nothing under it. Centre it instead. */
  .art-none .body { justify-content:center; }
  .art-none .kicker { margin-top:0; }
  .kicker { font-family:var(--mono); font-size:19px; letter-spacing:.2em;
    color:var(--accent); margin-top:52px; display:block; }
  .line { font-family:var(--display); letter-spacing:-.02em; line-height:1.02;
    margin-top:22px; text-wrap:balance; }
  .art-none .line { font-size:118px; }
  .art-wide .line { font-size:92px; }
  .art-tall .line { font-size:80px; }
  .cta .line { font-size:104px; color:var(--accent); word-break:break-all; }
  .note { font-size:31px; line-height:1.5; color:var(--muted); margin-top:34px;
    max-width:19em; text-wrap:pretty; }

  /* ---- the picture */
  .plate { position:relative; margin-top:auto; }
  .plate-box { position:relative; overflow:hidden; border:2px solid var(--line);
    background:var(--panel); }
  #plate { display:block; width:100%; height:100%; }
  /* Sized to the wide view's own aspect (680:384). Any taller and the
     difference is white space inside the frame, which reads as a mistake. */
  .art-wide .plate-box { height:536px; }
  .art-tall .plate-box { height:1000px; }
  .pcrop { position:absolute; width:22px; height:22px; border-color:rgba(35,32,26,.3); }
  .pcrop.tl { left:-11px; top:-11px; border-left:2px solid; border-top:2px solid; }
  .pcrop.tr { right:-11px; top:-11px; border-right:2px solid; border-top:2px solid; }
  .pcrop.bl { left:-11px; bottom:-11px; border-left:2px solid; border-bottom:2px solid; }
  .pcrop.br { right:-11px; bottom:-11px; border-right:2px solid; border-bottom:2px solid; }

  /* ---- footer: the URL on every card, because a viewer can leave on any
         one of them and most will never reach the last. */
  .foot { display:flex; align-items:center; justify-content:space-between; gap:24px;
    border-top:2px solid var(--ink); margin-top:40px; padding-top:20px; }
  .url { font-family:var(--display); font-size:34px; letter-spacing:-.01em; }
  .swipe { font-family:var(--mono); font-size:17px; text-transform:uppercase;
    letter-spacing:.16em; color:var(--accent); }
  .cta-chip { display:inline-block; margin-top:44px; border:3px solid var(--accent);
    background:#FBE9E0; color:var(--accent); font-family:var(--mono); font-size:24px;
    text-transform:uppercase; letter-spacing:.16em; padding:20px 30px; }
`;

const GRAIN = `
  <svg class="grain" aria-hidden="true">
    <filter id="fibre"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="7"/>
    <feColorMatrix type="saturate" values="0"/></filter>
    <rect width="100%" height="100%" filter="url(#fibre)"/>
  </svg>`;

/** One card, as a complete page. Rendered one per screenshot. */
export function slideHtml(index) {
  const s = SLIDES[index];
  if (!s) throw new Error(`no slide ${index} (have 0..${SLIDES.length - 1})`);
  const last = index === SLIDES.length - 1;
  const v = s.view ? VIEWS[s.view] : null;
  if (s.view && !v) throw new Error(`slide ${index} names an unknown view "${s.view}"`);

  const art =
    s.art === "none"
      ? ""
      : `<figure class="plate">
           <span class="pcrop tl"></span><span class="pcrop tr"></span>
           <span class="pcrop bl"></span><span class="pcrop br"></span>
           <div class="plate-box"><canvas id="plate" data-notes="off"
             data-frame="${s.frame ?? 0}"
             data-view="${v ? [v.x, v.y, v.w, v.h].map((n) => Math.round(n * 100) / 100).join(",") : ""}"></canvas></div>
         </figure>`;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>FounderFloor slide ${index + 1}</title>
<style>${CSS}</style></head>
<body><div class="sheet art-${s.art} ${s.cta ? "cta" : ""}" id="sheet">${GRAIN}
  <header class="mast">
    <span class="mast-l"><span class="mark"></span><span class="wordmark">FounderFloor</span></span>
    <span class="spec">${index + 1} / ${SLIDES.length}</span>
  </header>
  <div class="body">
    <span class="kicker">${s.kicker}</span>
    <h1 class="line">${s.line}</h1>
    ${s.note ? `<p class="note">${s.note}</p>` : ""}
    ${s.cta ? `<span class="cta-chip">Doors open Sunday 18:00 CET</span>` : ""}
    ${art}
  </div>
  <footer class="foot">
    <span class="url">founderfloor.net</span>
    <span class="swipe">${last ? "See you on the floor" : "Swipe →"}</span>
  </footer>
</div>
${s.art === "none" ? "" : `<script>${PLATE_SCRIPT}</script>`}
</body></html>`;
}
