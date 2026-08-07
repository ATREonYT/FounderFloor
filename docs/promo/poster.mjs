/**
 * The promotional sheets: a printed exhibition handbill, not a screenshot.
 *
 * Three formats come off the same plate and the same copy:
 *   tall    1080x1350  the one to post — Reddit, LinkedIn, Instagram feed
 *   wide    1200x630   link previews and the Reddit link card
 *   square  1080x1080  feeds that crop to a square
 *
 * Rules this sheet keeps, because the point is that it does not look
 * machine-made: no gradient meshes, no drop-shadowed glass, no icon row, no
 * stock photograph, no em dashes in the copy, and no claim the product
 * cannot back. Two colours and one accent, as in docs/ad/HOW-THESE-ADS-ARE-MADE.md.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { POSTER_FRAME } from "./scene.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * The plate renderer runs in the page, not here. Both modules are written
 * as real ES modules so `node --check` and an editor can see them, then
 * flattened into one classic script for inlining: the sheet is loaded from
 * a string with `setContent`, and a string has no base URL for a module
 * import to resolve against.
 */
const flatten = (name) =>
  readFileSync(join(HERE, name), "utf8")
    .split("\n")
    // drop imports and re-export statements, unwrap exported declarations.
    // A stray `export { … }` line is a syntax error in a classic script and
    // takes the whole plate down with a bare "__paint is not a function".
    .filter((l) => !/^import[ {]/.test(l) && !/^export\s*\{/.test(l))
    .map((l) => l.replace(/^export (?=(const|function|class|let) )/, ""))
    .join("\n");

const PLATE_SCRIPT = `
${flatten("sprites.mjs")}
${flatten("scene.mjs")}
const __cv = document.getElementById("plate");
function __paint(f) {
  const w = __cv.clientWidth;
  const h = __cv.clientHeight;
  const dpr = window.devicePixelRatio || 1;
  __cv.width = Math.round(w * dpr);
  __cv.height = Math.round(h * dpr);
  drawScene(__cv.getContext("2d"), w, h, dpr, f, { callouts: __cv.dataset.notes !== "off" });
  __cv.dataset.frame = String(f);
}
window.__paint = __paint;
window.__LOOP = LOOP;
__paint(Number(__cv.dataset.frame));
// canvas text is laid out with whatever font is resolved at draw time, so
// the first paint can land before the face is ready. Paint again once it is.
document.fonts.ready.then(() => __paint(Number(__cv.dataset.frame)));
`;

/* ------------------------------------------------------------------ copy */

export const COPY = {
  wordmark: "FounderFloor",
  dateline: "Programme 2026",
  admission: "Admission free",
  headA: "A trade-show floor",
  headB: "that ",
  headSweep: "never tears down",
  headEnd: ".",
  standfirst:
    "A small 2D world where startups keep a stand and real founders stand at it. " +
    "You walk in, read the signs, and talk to whoever is there.",
  standfirstShort:
    "A small 2D world where startups keep a stand and real founders stand at it.",
  /** [number, title, the long line, the one-line version] */
  stops: [
    ["01", "Walk in", "Pick a name, pick a floor. Arrow keys, or tap where you want to go.",
      "pick a name, pick a floor, and start walking"],
    ["02", "Talk to founders", "Every stand has a person behind it. Walk up, press E, ask what they do.",
      "walk up, press E, ask what they actually do"],
    ["03", "Connect", "Worth remembering? Hit Connect. The list lives in your profile, not a CRM.",
      "the list lives in your profile, not a CRM"],
  ],
  plateCaption: "Plate 01. Main Hall, drawn at its own scale",
  plateSpec: "WASD · arrow keys · or tap",
  url: "founderfloor.net",
  terms: "Free · runs in the browser · nothing to install",
  event: "Open Doors · Sunday 18:00 CET / 12:00 ET",
};

/* --------------------------------------------------------------- helpers */

const SIZES = {
  tall: { w: 1080, h: 1350 },
  wide: { w: 1200, h: 630 },
  square: { w: 1080, h: 1080 },
};

/** Printer's crop marks, drawn just inside the sheet edge. */
const cropMarks = (inset = 26, len = 22) => `
  <span class="crop" style="left:${inset}px;top:${inset}px;border-left:1px solid;border-top:1px solid;width:${len}px;height:${len}px"></span>
  <span class="crop" style="right:${inset}px;top:${inset}px;border-right:1px solid;border-top:1px solid;width:${len}px;height:${len}px"></span>
  <span class="crop" style="left:${inset}px;bottom:${inset}px;border-left:1px solid;border-bottom:1px solid;width:${len}px;height:${len}px"></span>
  <span class="crop" style="right:${inset}px;bottom:${inset}px;border-right:1px solid;border-bottom:1px solid;width:${len}px;height:${len}px"></span>`;

/** The registration mark a press sheet carries. Purely a mark of the trade. */
const regMark = `
  <svg class="reg" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" stroke-width="1"/>
    <line x1="12" y1="0" x2="12" y2="24" stroke="currentColor" stroke-width="1"/>
    <line x1="0" y1="12" x2="24" y2="12" stroke="currentColor" stroke-width="1"/>
  </svg>`;

/** Paper grain. Real fibre, not a noise PNG, so it survives any scale. */
const grain = `
  <svg class="grain" aria-hidden="true">
    <filter id="fibre">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="7"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
    <rect width="100%" height="100%" filter="url(#fibre)"/>
  </svg>`;

const headline = (cls = "") => `
  <h1 class="head ${cls}">
    <span class="l">${COPY.headA}</span>
    <span class="l">${COPY.headB}<span class="sweep">${COPY.headSweep}</span>${COPY.headEnd}</span>
  </h1>`;

const masthead = () => `
  <header class="mast">
    <div class="mast-l">
      <span class="mark" aria-hidden="true"></span>
      <span class="wordmark">${COPY.wordmark}</span>
    </div>
    <span class="spec mast-c">${COPY.dateline}</span>
    <span class="spec mast-r">${COPY.admission}${regMark}</span>
  </header>`;

const stopsRow = () => `
  <ol class="route">
    ${COPY.stops
      .map(
        ([n, t, b, s]) => `
      <li>
        <span class="route-n">${n}</span>
        <span class="route-rule" aria-hidden="true"></span>
        <h3>${t}</h3>
        <span class="route-sub">${s}</span>
        <p>${b}</p>
      </li>`,
      )
      .join("")}
  </ol>`;

const footer = () => `
  <footer class="foot">
    <span class="foot-l">
      <span class="url">${COPY.url}</span>
      <span class="spec terms">${COPY.terms}</span>
    </span>
    <span class="leader" aria-hidden="true"></span>
    <span class="event">${COPY.event}</span>
  </footer>`;

const plate = (opts, caption = COPY.plateCaption, spec = COPY.plateSpec) => {
  return `
  <figure class="plate">
    <span class="pcrop tl" aria-hidden="true"></span><span class="pcrop tr" aria-hidden="true"></span>
    <span class="pcrop bl" aria-hidden="true"></span><span class="pcrop br" aria-hidden="true"></span>
    <div class="plate-box"><canvas id="plate" data-frame="${POSTER_FRAME}" data-notes="${
      opts.callouts === false ? "off" : "on"
    }"></canvas></div>
    <figcaption><span class="spec">${caption}</span>${spec ? `<span class="spec">${spec}</span>` : ""}</figcaption>
  </figure>`;
};

/* ----------------------------------------------------------------- sheet */

const CSS = `
  * { margin:0; padding:0; box-sizing:border-box; }
  :root {
    --paper:#F2EFE7; --panel:#FFFFFF; --ink:#23201A; --muted:#6F6A5E;
    --line:#E4DFD3; --accent:#D9480F; --accent-strong:#C0410C; --gold:#B08D2E;
    --display:"Charter","Bitstream Charter","Liberation Serif","DejaVu Serif",serif;
    --sans:"Liberation Sans","DejaVu Sans",sans-serif;
    --mono:"DejaVu Sans Mono","Liberation Mono",monospace;
  }
  html,body { background:#fff; }
  body { font-family:var(--sans); color:var(--ink); -webkit-font-smoothing:antialiased; }

  .sheet {
    position:relative; overflow:hidden; background:var(--paper);
    /* the ambient top light the site's own body carries */
    background-image:radial-gradient(120% 60% at 50% -12%, #FFFDF6, rgba(255,253,246,.5) 45%, rgba(242,239,231,0) 78%);
    display:flex; flex-direction:column;
  }
  .grain { position:absolute; inset:0; width:100%; height:100%; opacity:.055; mix-blend-mode:multiply; pointer-events:none; }
  .crop { position:absolute; border-color:rgba(35,32,26,.34); color:rgba(35,32,26,.34); }
  .reg { width:14px; height:14px; color:rgba(35,32,26,.4); margin-left:10px; vertical-align:-2px; }

  .body { position:relative; z-index:1; display:flex; flex-direction:column; flex:1; }

  /* ------------------------------------------------------------ masthead */
  .mast {
    display:flex; align-items:center; justify-content:space-between; gap:24px;
    border-top:2px solid var(--ink); border-bottom:1px solid var(--ink);
    padding:12px 0 11px;
  }
  .mast::after { content:""; }
  .mast-l { display:flex; align-items:center; gap:12px; }
  .mark { width:13px; height:13px; background:var(--accent); transform:rotate(45deg); display:inline-block; }
  .wordmark { font-family:var(--display); letter-spacing:-.012em; }
  .spec { font-family:var(--mono); text-transform:uppercase; letter-spacing:.16em; color:var(--muted); }
  .mast-r { display:flex; align-items:center; }

  /* ------------------------------------------------------------ headline */
  .head { font-family:var(--display); letter-spacing:-.018em; line-height:1.04; }
  .head .l { display:block; }
  .sweep {
    background-image:linear-gradient(rgba(217,72,15,.5), rgba(217,72,15,.5));
    background-repeat:no-repeat; background-position:0 94%; background-size:100% .075em;
  }
  .standfirst { color:var(--muted); max-width:40em; text-wrap:pretty; }

  /* --------------------------------------------------------------- plate */
  .plate { position:relative; }
  .plate-box { position:relative; overflow:hidden; border:1px solid var(--line); background:var(--panel); }
  #plate { display:block; width:100%; height:100%; }
  .pcrop { position:absolute; width:14px; height:14px; border-color:rgba(35,32,26,.3); }
  .pcrop.tl { left:-7px; top:-7px; border-left:1px solid; border-top:1px solid; }
  .pcrop.tr { right:-7px; top:-7px; border-right:1px solid; border-top:1px solid; }
  .pcrop.bl { left:-7px; bottom:-7px; border-left:1px solid; border-bottom:1px solid; }
  .pcrop.br { right:-7px; bottom:-7px; border-right:1px solid; border-bottom:1px solid; }
  .plate figcaption { display:flex; justify-content:space-between; gap:24px; margin-top:11px; }

  /* --------------------------------------------------------------- route */
  .route { list-style:none; display:grid; grid-template-columns:repeat(3,1fr); }
  .route li { padding-right:30px; }
  .route-n { font-family:var(--display); color:rgba(35,32,26,.22); display:block; line-height:1; }
  .route-rule {
    display:block; height:1px; margin:12px 0 14px;
    background-image:linear-gradient(90deg, rgba(35,32,26,.42) 0 6px, transparent 6px 12px);
    background-size:12px 1px;
  }
  .route h3 { font-family:var(--display); font-weight:400; letter-spacing:-.008em; }
  .route p { color:var(--muted); }
  .route-sub { display:none; color:var(--muted); }

  /* -------------------------------------------------------------- footer */
  .foot { display:flex; align-items:center; gap:20px; border-top:1px solid var(--ink); padding-top:14px; }
  .foot-l { display:flex; flex-direction:column; gap:6px; }
  .url { font-family:var(--display); letter-spacing:-.01em; line-height:1; }
  .terms { white-space:nowrap; }
  .leader { flex:1; height:1px;
    background-image:linear-gradient(90deg, rgba(35,32,26,.34) 0 2px, transparent 2px 7px);
    background-size:7px 1px; }
  .event { font-family:var(--mono); text-transform:uppercase; letter-spacing:.14em; color:var(--accent-strong);
    border:1px solid rgba(217,72,15,.4); background:#FBE9E0; padding:7px 12px 6px; white-space:nowrap; }
`;

/** Per-format type scale and spacing. Kept apart from CSS so it reads as a spec. */
const LAYOUTS = {
  tall: `
    .sheet { width:1080px; height:1350px; }
    .body { padding:58px 60px 54px; }
    .mast { font-size:15px; } .wordmark { font-size:23px; } .spec { font-size:12px; }
    .head { font-size:76px; margin-top:40px; }
    .standfirst { font-size:20.5px; line-height:1.62; margin-top:26px; }
    .plate { margin-top:36px; }
    /* height = content width / the plate's aspect, so the drawing fills the
       box instead of floating in a band of white */
    .plate-box { height:541px; }
    .route { margin-top:auto; padding-top:32px; }
    .route-n { font-size:34px; } .route h3 { font-size:23px; margin-bottom:8px; }
    .route p { font-size:15.5px; line-height:1.6; }
    .foot { margin-top:32px; } .url { font-size:27px; } .terms { font-size:12.5px; } .event { font-size:12.5px; }
  `,
  square: `
    .sheet { width:1080px; height:1080px; }
    .body { padding:52px 56px 48px; }
    .mast { font-size:14px; } .wordmark { font-size:21px; } .spec { font-size:11.5px; }
    .head { font-size:62px; margin-top:30px; }
    .standfirst { font-size:19px; line-height:1.6; margin-top:20px; max-width:34em; }
    .plate { margin-top:24px; }
    .plate-box { height:452px; }
    .route { display:block; margin-top:auto; padding-top:12px; }
    .route li { display:flex; align-items:baseline; gap:13px; padding:9px 0;
      border-bottom:1px dotted rgba(35,32,26,.28); }
    .route li:last-child { border-bottom:0; }
    .route-rule { display:none; }
    .route-n { font-size:13px; font-family:var(--mono); color:var(--accent); letter-spacing:.12em; }
    .route h3 { font-size:20px; margin:0; white-space:nowrap; }
    .route-sub { display:inline; font-size:15px; }
    .route p { display:none; }
    .foot { margin-top:22px; } .url { font-size:24px; } .terms { font-size:11.5px; } .event { font-size:11.5px; }
  `,
  wide: `
    .sheet { width:1200px; height:630px; }
    .body { padding:40px 46px 38px; }
    .split { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1.02fr); gap:44px; flex:1; padding-top:28px; }
    .col-l { display:flex; flex-direction:column; }
    .col-r { display:flex; flex-direction:column; justify-content:center; }
    .mast { font-size:13.5px; } .wordmark { font-size:20px; } .spec { font-size:11px; }
    .head { font-size:53px; }
    .standfirst { font-size:16.5px; line-height:1.58; margin-top:20px; }
    .plate { margin:0; } .plate-box { height:296px; }
    .route { display:block; margin-top:auto; }
    .route li { display:flex; align-items:baseline; gap:11px; padding:10px 0;
      border-bottom:1px dotted rgba(35,32,26,.28); }
    .route li:last-child { border-bottom:0; }
    .route-rule { display:none; }
    .route-n { font-size:12.5px; font-family:var(--mono); color:var(--accent); letter-spacing:.1em; }
    .route h3 { font-size:18px; margin:0; white-space:nowrap; }
    .route-sub { display:inline; font-size:14px; }
    .route p { display:none; }
    .foot { margin-top:24px; } .url { font-size:22px; } .terms { font-size:11px; } .event { font-size:11px; }
  `,
};

/** Builds one complete sheet. */
export function posterHtml(format = "tall") {
  const size = SIZES[format];
  if (!size) throw new Error(`unknown format: ${format}`);

  const inner =
    format === "wide"
      ? `${masthead()}
         <div class="split">
           <div class="col-l">${headline()}<p class="standfirst">${COPY.standfirst}</p>${stopsRow()}</div>
           <div class="col-r">${plate({ callouts: false }, "Plate 01. Main Hall", "")}</div>
         </div>
         ${footer()}`
      : `${masthead()}
         ${headline()}
         <p class="standfirst">${format === "square" ? COPY.standfirstShort : COPY.standfirst}</p>
         ${plate({ callouts: true })}
         ${stopsRow()}
         ${footer()}`;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>FounderFloor ${format}</title>
<style>${CSS}${LAYOUTS[format]}</style></head>
<body><div class="sheet" id="sheet">${grain}${cropMarks()}<div class="body">${inner}</div></div>
<script>${PLATE_SCRIPT}</script></body></html>`;
}

export { SIZES };
