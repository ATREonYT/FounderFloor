/**
 * The mock-up as a real page. From the founder's words the desk builds a
 * self-contained HTML app, and no two look alike: the look is a set of
 * parts chosen per company (a typeface, a hero, a palette, a navigation,
 * a way of listing features, a way of pricing, a corner radius), fixed
 * into five named presets a founder can pick, or shuffled from a seed.
 * The layouts follow the kind of product (a dashboard for software, a
 * feed for a consumer app, listings for a marketplace, bookings for a
 * service, a product page for hardware). Three screens, tappable. A
 * status bar, real inputs, icons, a chart. Rendered in a web view on the
 * phone and an iframe on the web; captured as the picture. No model.
 */
import type { LookPreset, Mockup, MockScreen, ProductKind } from "./workshop.ts";

export interface MockTheme {
  /** 0..360 */
  hue: number;
  style: "clean" | "bold" | "soft";
  preset?: LookPreset;
  seed?: number;
}

/** The parts a look is made of. */
export interface Look {
  hue: number;
  preset: LookPreset | "shuffle";
  font: "sans" | "serif" | "rounded" | "grotesk";
  hero: "left" | "centered" | "card" | "dark";
  palette: "brand" | "tinted" | "ink" | "duo";
  radius: number;
  pill: boolean;
  nav: "tabs" | "pillbar" | "top";
  features: "cards" | "list" | "grid" | "numbered";
  pricing: "card" | "rows" | "dark";
}

const PRESETS: Record<LookPreset, Omit<Look, "hue" | "preset">> = {
  startup: { font: "sans", hero: "left", palette: "brand", radius: 14, pill: false, nav: "tabs", features: "cards", pricing: "card" },
  editorial: { font: "serif", hero: "centered", palette: "tinted", radius: 6, pill: false, nav: "top", features: "numbered", pricing: "rows" },
  studio: { font: "grotesk", hero: "dark", palette: "ink", radius: 4, pill: false, nav: "tabs", features: "list", pricing: "dark" },
  playful: { font: "rounded", hero: "card", palette: "duo", radius: 28, pill: true, nav: "pillbar", features: "grid", pricing: "card" },
  minimal: { font: "sans", hero: "centered", palette: "ink", radius: 10, pill: false, nav: "top", features: "list", pricing: "rows" },
};
const PRESET_NAMES: LookPreset[] = ["startup", "editorial", "studio", "playful", "minimal"];

const hash = (s: string) => {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
};
const pick = <T,>(arr: readonly T[], n: number): T => arr[n % arr.length];

/** A steady colour per company name, so the same start-up always looks the same. */
export function mockupTheme(m: Mockup): MockTheme {
  const h = hash(m.name) % 360;
  const hue = h > 40 && h < 75 ? h + 140 : h;
  if (m.theme) return m.theme;
  // the preset is the company's own too: five names, one per company
  return { hue, style: "clean", preset: pick(PRESET_NAMES, hash(m.name + "|look")) };
}

/** The parts, from the theme: a preset, or a shuffle from the seed. The old clean/bold/soft names map onto presets. */
export function lookOf(m: Mockup): Look {
  const t = mockupTheme(m);
  if (t.seed !== undefined) {
    const n = hash(`${m.name}|${t.seed}`);
    return {
      hue: t.hue,
      preset: "shuffle",
      font: pick(["sans", "serif", "rounded", "grotesk"] as const, n),
      hero: pick(["left", "centered", "card", "dark"] as const, n >>> 3),
      palette: pick(["brand", "tinted", "ink", "duo"] as const, n >>> 6),
      radius: pick([4, 8, 14, 20, 28] as const, n >>> 9),
      pill: (n >>> 12) % 2 === 0,
      nav: pick(["tabs", "pillbar", "top"] as const, n >>> 14),
      features: pick(["cards", "list", "grid", "numbered"] as const, n >>> 17),
      pricing: pick(["card", "rows", "dark"] as const, n >>> 20),
    };
  }
  const preset: LookPreset = t.preset ?? (t.style === "bold" ? "studio" : t.style === "soft" ? "playful" : "startup");
  return { hue: t.hue, preset, ...PRESETS[preset] };
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const initials = (s: string) => s.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "A";
const firstName = (line: string) => line.replace(/\s+(signed up|paid.*|came back|renewed.*|booked.*|ordered.*|joined.*)$/i, "").trim();

const I = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-6H9v6H5a2 2 0 0 1-2-2z"/></svg>',
  activity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3 6.6 7 .8-5.2 4.8L18.2 21 12 17.4 5.8 21l1.4-6.8L2 9.4l7-.8z"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v9"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h8l-1 8 10-12h-8z"/></svg>',
  grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
};

const FONTS: Record<Look["font"], { body: string; display: string; track: string; weight: number }> = {
  sans: { body: '-apple-system,BlinkMacSystemFont,"SF Pro Text",Inter,"Segoe UI",Roboto,sans-serif', display: "inherit", track: "-.02em", weight: 800 },
  serif: { body: 'ui-serif,"New York","Iowan Old Style",Georgia,"Times New Roman",serif', display: "inherit", track: "-.01em", weight: 700 },
  rounded: { body: 'ui-rounded,"SF Pro Rounded","Nunito","Varela Round","Segoe UI",system-ui,sans-serif', display: "inherit", track: "-.01em", weight: 800 },
  grotesk: { body: '"Helvetica Neue",Helvetica,Arial,"Liberation Sans",system-ui,sans-serif', display: "inherit", track: "-.04em", weight: 700 },
};

function css(L: Look): string {
  const F = FONTS[L.font];
  const ink = L.palette === "ink";
  const duo = L.palette === "duo";
  const r = `${L.radius}px`;
  const btnR = L.pill ? "999px" : `${Math.min(L.radius, 14)}px`;
  const btnBg = ink ? "var(--ink)" : duo ? "linear-gradient(135deg,var(--p),hsl(calc(var(--h) + 60) 75% 50%))" : "var(--p)";
  const btnSh = ink ? "none" : "0 6px 16px -6px hsl(var(--h) 72% 46% / .5)";
  const bg = L.palette === "tinted" ? "hsl(var(--h) 45% 96%)" : ink ? "#fff" : L.palette === "duo" ? "#fff" : "#f8fafc";
  const line = L.palette === "tinted" ? "hsl(var(--h) 30% 88%)" : ink ? "#e5e7eb" : "#e2e8f0";
  const sh = ink ? "none" : L.radius >= 20 ? "0 2px 4px rgba(15,23,42,.04),0 16px 40px -20px hsl(var(--h) 40% 40% / .25)" : "0 1px 2px rgba(15,23,42,.06),0 8px 24px -12px rgba(15,23,42,.18)";
  const cardBorder = ink ? "1px solid #111827" : `1px solid ${line}`;
  const accent = ink ? "var(--ink)" : "var(--p)";
  const accentBg = ink ? "#f3f4f6" : "var(--pl)";
  const darkHero = L.hero === "dark";
  const centered = L.hero === "centered";
  return `
:root{--h:${L.hue};--p:hsl(var(--h) 72% 46%);--p2:hsl(var(--h) 72% 40%);--pl:hsl(var(--h) 80% 95%);--ink:#0f172a;--mute:#64748b;--line:${line};--bg:${bg};--card:#fff;--r:${r};--sh:${sh};--btnr:${btnR};--acc:${accent};--accbg:${accentBg}}
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;background:var(--bg);color:var(--ink);font:15px/1.45 ${F.body};-webkit-font-smoothing:antialiased;overflow:hidden}
.app{position:relative;height:100%;display:flex;flex-direction:column}
.status{display:flex;justify-content:space-between;align-items:center;padding:14px 22px 6px;font-size:13px;font-weight:600;flex:none;font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif}
.status .dots{display:flex;gap:4px;align-items:center}.status .dots i{display:block;width:4px;background:currentColor;border-radius:1px}
.status .bat{width:24px;height:11px;border:1.5px solid currentColor;border-radius:3.5px;padding:1.5px}.status .bat b{display:block;height:100%;width:70%;background:currentColor;border-radius:1.5px}
.screen{display:none;flex:1;min-height:0;flex-direction:column}.screen.on{display:flex}
.scroll{flex:1;overflow:auto;padding:0 20px 28px;-webkit-overflow-scrolling:touch}
.topbar{display:flex;align-items:center;justify-content:space-between;padding:8px 20px 12px;flex:none}
.brand{display:flex;align-items:center;gap:8px;font-weight:700;letter-spacing:${F.track}}
.brand .mark{width:28px;height:28px;border-radius:${L.pill ? "50%" : `${Math.min(L.radius, 9)}px`};background:${ink ? "var(--ink)" : "linear-gradient(135deg,var(--p),hsl(calc(var(--h) + 30) 72% 52%))"};color:#fff;display:grid;place-items:center;font-size:12px;font-weight:800;font-family:-apple-system,system-ui,sans-serif}
.link{color:var(--mute);font-size:14px;font-weight:500}.ib{width:36px;height:36px;border-radius:${L.pill ? "50%" : "10px"};background:#fff;border:1px solid var(--line);display:grid;place-items:center;color:var(--ink)}.ib svg{width:18px;height:18px}
h1{font-size:${L.font === "serif" ? "34px" : L.font === "grotesk" ? "36px" : "31px"};line-height:1.08;letter-spacing:${F.track};font-weight:${F.weight};margin:14px 0 10px}
h2{font-size:${L.font === "serif" ? "24px" : "22px"};line-height:1.2;letter-spacing:${F.track};font-weight:${F.weight}}h3{font-size:15px;font-weight:700}
.sub{color:var(--mute);font-size:15.5px;line-height:1.5}
.hero{position:relative;isolation:isolate;padding:8px 0 0;${darkHero ? "background:var(--ink);color:#fff;margin:0 -20px;padding:22px 20px 26px;" : ""}${centered ? "text-align:center;" : ""}}
.hero .sub{${darkHero ? "color:rgba(255,255,255,.72)" : ""}}.hero .field label{${darkHero ? "color:rgba(255,255,255,.7)" : ""}}.hero .input{${darkHero ? "background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.18);color:rgba(255,255,255,.6)" : ""}}.hero .btn{${darkHero && !ink ? "background:var(--p);" : darkHero ? "background:#fff;color:var(--ink);" : ""}}.hero .proof{${darkHero ? "color:rgba(255,255,255,.7)" : ""}${centered ? "justify-content:center" : ""}}
.blob{position:absolute;right:-110px;top:-90px;width:260px;height:260px;border-radius:50%;background:radial-gradient(circle at 30% 30%,hsl(var(--h) 90% ${darkHero ? "40%" : "82%"}),transparent 70%);opacity:${ink && !darkHero ? "0" : ".5"};pointer-events:none;z-index:-1}
.eyebrow{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;letter-spacing:${L.font === "grotesk" ? ".12em" : ".3px"};${L.font === "grotesk" ? "text-transform:uppercase;" : ""}color:var(--acc);background:var(--accbg);padding:5px 10px;border-radius:999px;font-family:-apple-system,system-ui,sans-serif}${darkHero ? ".hero .eyebrow{background:rgba(255,255,255,.1);color:#fff}" : ""}
.herocard{margin-top:12px;border-radius:var(--r);height:190px;background:linear-gradient(135deg,hsl(var(--h) 80% 88%),hsl(calc(var(--h) + 60) 80% 78%));position:relative;overflow:hidden;box-shadow:var(--sh)}
.herocard .mini{position:absolute;left:18px;right:18px;bottom:18px;background:#fff;border-radius:${Math.min(L.radius, 18)}px;padding:12px 14px;box-shadow:0 12px 30px -12px rgba(15,23,42,.35)}.herocard .mini small{display:block;font-size:11px;color:var(--mute);font-weight:600;letter-spacing:.3px;text-transform:uppercase}.herocard .mini b{display:block;font-size:24px;letter-spacing:-.5px;margin-top:2px}.herocard .mini i{position:absolute;right:14px;top:14px;width:30px;height:30px;border-radius:50%;background:var(--accbg);color:var(--acc);display:grid;place-items:center;font-style:normal}.herocard .mini svg{width:16px;height:16px}
.field{display:flex;flex-direction:column;gap:6px;margin-top:16px;${centered ? "align-items:stretch;text-align:left;" : ""}}.field label{font-size:12.5px;font-weight:600;color:var(--mute)}
.input{display:flex;align-items:center;gap:8px;height:48px;padding:0 14px;border:1.5px solid var(--line);border-radius:${L.pill ? "999px" : `${Math.min(L.radius, 12)}px`};background:#fff;color:#94a3b8;font-size:15px}.input svg{width:18px;height:18px;color:#94a3b8}
.btn{display:flex;align-items:center;justify-content:center;gap:8px;height:50px;padding:0 18px;border-radius:var(--btnr);background:${btnBg};color:#fff;font-weight:700;font-size:15.5px;box-shadow:${btnSh};cursor:pointer;user-select:none;margin-top:12px;font-family:-apple-system,system-ui,sans-serif}
.btn:active{transform:scale(.985)}.btn.ghost{background:#fff;color:var(--ink);border:1.5px solid var(--line);box-shadow:none}.btn.sm{height:38px;font-size:13.5px;padding:0 14px;margin:0}.btn svg{width:18px;height:18px}
.proof{display:flex;align-items:center;gap:10px;margin-top:18px;color:var(--mute);font-size:13px}
.avs{display:flex}.avs span{width:28px;height:28px;border-radius:50%;border:2px solid #fff;margin-left:-8px;display:grid;place-items:center;font-size:10px;font-weight:700;color:#fff;background:hsl(calc(var(--h) + var(--o)) 55% 55%);font-family:-apple-system,system-ui,sans-serif}.avs span:first-child{margin-left:0}
.sect{display:flex;align-items:baseline;justify-content:space-between;margin:22px 0 8px}.sect a{font-size:13px;color:var(--acc);font-weight:600}
.k{font-size:11.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--mute)}
/* features: four ways */
.feats{display:grid;gap:10px;margin-top:10px}
.feat{display:flex;gap:12px;align-items:flex-start;padding:14px;background:var(--card);border:${cardBorder};border-radius:var(--r);box-shadow:var(--sh)}
.feat .ic{flex:none;width:36px;height:36px;border-radius:${L.pill ? "50%" : "10px"};background:var(--accbg);color:var(--acc);display:grid;place-items:center}.feat .ic svg{width:18px;height:18px}
.feat b{display:block;font-size:14.5px;font-weight:700}.feat small{display:block;color:var(--mute);font-size:13px;margin-top:2px}
.flist{margin-top:6px}.flist .feat{background:transparent;border:0;border-bottom:1px solid var(--line);border-radius:0;box-shadow:none;padding:14px 0}.flist .feat:last-child{border:0}
.fgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}.fgrid .feat{flex-direction:column;gap:10px;padding:16px 14px}.fgrid .ic{width:44px;height:44px}.fgrid .ic svg{width:22px;height:22px}
.fnum{margin-top:6px}.fnum .feat{background:transparent;border:0;border-top:1px solid var(--ink);border-radius:0;box-shadow:none;padding:14px 0;gap:16px}.fnum .ic{background:transparent;color:var(--ink);width:auto;height:auto;font-size:26px;font-weight:${F.weight};letter-spacing:-.04em;line-height:1;min-width:38px}
.steps{display:grid;margin-top:10px;background:var(--card);border:${cardBorder};border-radius:var(--r);box-shadow:var(--sh);padding:6px 14px}
.step{display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-bottom:1px solid var(--line)}.step:last-child{border:0}
.step .n{flex:none;width:26px;height:26px;border-radius:50%;background:var(--acc);color:#fff;font-size:12px;font-weight:700;display:grid;place-items:center;font-family:-apple-system,system-ui,sans-serif}
.step b{display:block;font-size:14px}.step small{display:block;color:var(--mute);font-size:12.5px;margin-top:2px}
.quote{margin-top:10px;background:var(--card);border:${cardBorder};border-radius:var(--r);box-shadow:var(--sh);padding:16px;${L.features === "numbered" ? "background:transparent;border:0;border-left:3px solid var(--ink);border-radius:0;box-shadow:none;padding:4px 0 4px 16px;" : ""}}
.quote .stars{display:flex;gap:2px;color:#f59e0b;margin-bottom:8px}.quote .stars svg{width:14px;height:14px}
.quote p{font-size:${L.font === "serif" ? "17px" : "15px"};line-height:1.5;font-weight:500;${L.font === "serif" ? "font-style:italic;" : ""}}.quote .by{display:flex;align-items:center;gap:10px;margin-top:12px;font-size:13px;color:var(--mute)}
.quote .by span{width:32px;height:32px;border-radius:50%;background:var(--accbg);color:var(--acc);display:grid;place-items:center;font-weight:700;font-size:12px;font-family:-apple-system,system-ui,sans-serif}
.cta2{margin-top:22px;background:${ink ? "var(--ink)" : "linear-gradient(135deg,var(--p),hsl(calc(var(--h) + 28) 70% 48%))"};color:#fff;border-radius:var(--r);padding:20px;text-align:center}.cta2 h3{font-size:19px;letter-spacing:-.3px}.cta2 p{font-size:13.5px;opacity:.85;margin-top:4px}.cta2 .btn{background:#fff;color:var(--ink);box-shadow:none;margin-top:14px}
.foot{margin-top:26px;color:#94a3b8;font-size:12px;text-align:center}
.greet{padding:4px 0 14px}.greet small{color:var(--mute);font-size:13px;font-weight:500}.greet h2{margin-top:2px}
.stat{background:${ink ? "var(--ink)" : "linear-gradient(135deg,var(--p),hsl(calc(var(--h) + 28) 70% 48%))"};color:#fff;border-radius:var(--r);padding:18px 18px 14px;box-shadow:0 14px 30px -14px hsl(var(--h) 72% 40% / .7)}
.stat small{font-size:12.5px;opacity:.85;font-weight:600;letter-spacing:.2px;text-transform:uppercase}.stat .n{font-size:40px;font-weight:800;letter-spacing:-1.2px;line-height:1.05;margin-top:6px}
.stat .d{display:inline-flex;align-items:center;gap:6px;margin-top:8px;font-size:12.5px;font-weight:600;background:rgba(255,255,255,.18);padding:4px 9px;border-radius:999px}.stat .d svg{width:12px;height:12px}
.chart{margin-top:10px;height:56px;width:100%}
.quick{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:14px}
.quick div{background:var(--card);border:${cardBorder};border-radius:var(--r);padding:12px 6px 10px;display:flex;flex-direction:column;align-items:center;gap:6px;font-size:11px;font-weight:600;color:var(--ink);box-shadow:var(--sh)}
.quick i{width:34px;height:34px;border-radius:${L.pill ? "50%" : "10px"};background:var(--accbg);color:var(--acc);display:grid;place-items:center}.quick svg{width:17px;height:17px}
.card{background:var(--card);border:${cardBorder};border-radius:var(--r);box-shadow:var(--sh);padding:4px 14px}
.row{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--line)}.row:last-child{border:0}
.row .av{flex:none;width:40px;height:40px;border-radius:${L.pill ? "50%" : "12px"};background:var(--accbg);color:var(--acc);display:grid;place-items:center;font-weight:700;font-size:13px;font-family:-apple-system,system-ui,sans-serif}
.row b{display:block;font-size:14.5px;font-weight:600}.row small{display:block;color:var(--mute);font-size:12.5px;margin-top:1px}.row .amt{margin-left:auto;font-weight:700;font-size:14px;flex:none}.row .amt.up{color:#16a34a}
.fab{position:absolute;right:20px;bottom:${L.nav === "pillbar" ? "96px" : L.nav === "top" ? "34px" : "86px"};width:54px;height:54px;border-radius:${L.pill ? "50%" : "18px"};background:${btnBg};color:#fff;display:grid;place-items:center;box-shadow:0 12px 24px -8px rgba(15,23,42,.45)}.fab svg{width:22px;height:22px}
/* navigation: three ways */
.tabs{display:flex;justify-content:space-around;padding:8px 10px 22px;border-top:1px solid var(--line);background:rgba(255,255,255,.92);backdrop-filter:blur(12px);flex:none}
.tab{display:flex;flex-direction:column;align-items:center;gap:3px;font-size:10.5px;font-weight:600;color:#94a3b8;width:64px;cursor:pointer;font-family:-apple-system,system-ui,sans-serif}.tab svg{width:22px;height:22px}.tab.on{color:var(--acc)}
.pillbar{position:absolute;left:24px;right:24px;bottom:22px;display:flex;justify-content:space-around;align-items:center;height:60px;border-radius:999px;background:var(--ink);box-shadow:0 16px 32px -12px rgba(15,23,42,.6);padding:0 8px}
.pillbar .tab{color:rgba(255,255,255,.55);width:auto;padding:0 10px;flex-direction:row;gap:8px}.pillbar .tab span{display:none}.pillbar .tab.on{color:var(--ink);background:#fff;border-radius:999px;height:42px;padding:0 16px}.pillbar .tab.on span{display:inline;font-size:12.5px}
.seg{display:flex;gap:4px;margin:0 20px 10px;padding:4px;background:${ink ? "#f3f4f6" : "rgba(15,23,42,.06)"};border-radius:${L.pill ? "999px" : "10px"};flex:none;font-family:-apple-system,system-ui,sans-serif}
.seg .tab{flex:1;flex-direction:row;gap:6px;width:auto;height:36px;justify-content:center;border-radius:${L.pill ? "999px" : "8px"};font-size:12.5px}.seg .tab svg{width:16px;height:16px}.seg .tab.on{background:#fff;color:var(--ink);box-shadow:0 1px 3px rgba(15,23,42,.12)}
/* pricing: three ways */
.plan{background:var(--card);border:2px solid var(--acc);border-radius:var(--r);padding:18px;margin-top:22px;position:relative;box-shadow:var(--sh)}
.chip{position:absolute;top:-12px;left:18px;background:var(--acc);color:#fff;font-size:11px;font-weight:700;padding:4px 10px;border-radius:999px;letter-spacing:.2px;font-family:-apple-system,system-ui,sans-serif}
.plan.dark{background:var(--ink);color:#fff;border-color:var(--ink)}.plan.dark .list{color:#fff}.plan.dark .ck{background:rgba(255,255,255,.14);color:#fff}.plan.dark .price span,.plan.dark .note,.plan.dark .k{color:rgba(255,255,255,.65)}.plan.dark .chip{background:${ink ? "#fff" : "var(--p)"};color:${ink ? "var(--ink)" : "#fff"}}.plan.dark .btn{background:${ink ? "#fff" : "var(--p)"};color:${ink ? "var(--ink)" : "#fff"}}
.plan.rows{background:transparent;border:0;border-top:1px solid var(--ink);border-bottom:1px solid var(--ink);border-radius:0;padding:18px 0;box-shadow:none}.plan.rows .chip{position:static;display:inline-block;margin-bottom:8px;background:transparent;color:var(--acc);padding:0;font-size:12px;letter-spacing:.08em;text-transform:uppercase}
.price{display:flex;align-items:baseline;gap:6px;margin-top:6px}.price b{font-size:${L.font === "serif" ? "44px" : "38px"};font-weight:${F.weight};letter-spacing:${F.track}}.price span{color:var(--mute);font-size:14px}
.toggle{display:inline-flex;background:#fff;border:1px solid var(--line);border-radius:999px;padding:3px;margin-top:14px;font-family:-apple-system,system-ui,sans-serif}.toggle span{padding:6px 12px;border-radius:999px;font-size:12.5px;font-weight:600;color:var(--mute)}.toggle span.on{background:var(--ink);color:#fff}
.list{display:grid;gap:9px;margin-top:14px}.list div{display:flex;gap:10px;align-items:center;font-size:14px}.list .ck{flex:none;width:20px;height:20px;border-radius:50%;background:var(--accbg);color:var(--acc);display:grid;place-items:center}.list .ck svg{width:12px;height:12px}
.note{color:var(--mute);font-size:13px;text-align:center;margin-top:12px}.trust{display:flex;justify-content:center;gap:14px;margin-top:14px;color:#94a3b8;font-size:12px}.trust span{display:flex;align-items:center;gap:5px}.trust svg{width:13px;height:13px}
.faq{margin-top:22px}.faq .row{padding:13px 0}.faq svg{width:18px;height:18px;color:#94a3b8;margin-left:auto;flex:none}
.home-ind{position:absolute;left:50%;bottom:7px;width:120px;height:5px;border-radius:3px;background:var(--ink);transform:translateX(-50%);opacity:.9}
/* feed */
.stories{display:flex;gap:12px;overflow:hidden;margin-top:4px}.stories div{display:flex;flex-direction:column;align-items:center;gap:5px;font-size:11px;color:var(--mute);flex:none}.stories i{width:58px;height:58px;border-radius:50%;padding:3px;background:${ink ? "var(--ink)" : "linear-gradient(135deg,var(--p),hsl(calc(var(--h) + 40) 80% 60%))"}}.stories i b{display:block;width:100%;height:100%;border-radius:50%;background:#fff;border:2px solid #fff;color:var(--acc);font-style:normal;font-size:14px;font-weight:700;display:grid;place-items:center;font-family:-apple-system,system-ui,sans-serif}
.post{margin-top:14px;background:var(--card);border:${cardBorder};border-radius:var(--r);box-shadow:var(--sh);overflow:hidden}
.post .head{display:flex;align-items:center;gap:10px;padding:12px 14px}.post .head b{font-size:14px}.post .head small{display:block;color:var(--mute);font-size:12px}
.pic{height:180px;background:linear-gradient(135deg,hsl(var(--h) 70% 85%),hsl(calc(var(--h) + 50) 70% 70%));position:relative}.pic:after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 70% 30%,rgba(255,255,255,.55),transparent 45%)}
.post .acts{display:flex;gap:16px;padding:10px 14px 4px;color:var(--ink)}.post .acts svg{width:22px;height:22px}.post .cap{padding:0 14px 14px;font-size:14px}.post .cap b{font-weight:700}
/* listings */
.searchbar{display:flex;align-items:center;gap:10px;height:52px;padding:0 16px;border-radius:${L.pill || L.radius >= 14 ? "999px" : "var(--r)"};background:#fff;box-shadow:${ink ? "none" : "0 4px 16px -6px rgba(15,23,42,.25)"};border:${cardBorder};margin-top:4px}.searchbar svg{width:20px;height:20px;color:var(--ink)}.searchbar b{font-size:14px}.searchbar small{display:block;color:var(--mute);font-size:12px}
.cats{display:flex;gap:8px;overflow:hidden;margin-top:14px;font-family:-apple-system,system-ui,sans-serif}.cats span{flex:none;padding:8px 14px;border-radius:${L.pill || L.radius >= 14 ? "999px" : "6px"};border:1px solid var(--line);background:#fff;font-size:13px;font-weight:600;color:var(--mute)}.cats span.on{background:var(--ink);color:#fff;border-color:var(--ink)}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}
.item{background:var(--card);border-radius:var(--r);overflow:hidden;border:${cardBorder};box-shadow:var(--sh)}.item .pic{height:120px}.item .pic i{position:absolute;top:8px;right:8px;width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.9);display:grid;place-items:center;color:var(--ink)}.item .pic svg{width:15px;height:15px}
.item .body{padding:10px 12px 12px}.item b{display:block;font-size:13.5px;line-height:1.25}.item small{display:flex;align-items:center;gap:4px;color:var(--mute);font-size:12px;margin-top:3px}.item small svg{width:11px;height:11px;color:#f59e0b}.item .pr{margin-top:6px;font-size:13.5px;font-weight:700}
/* bookings */
.next{background:${ink ? "var(--ink)" : "linear-gradient(135deg,var(--p),hsl(calc(var(--h) + 28) 70% 48%))"};color:#fff;border-radius:var(--r);padding:16px 18px;box-shadow:0 14px 30px -14px hsl(var(--h) 72% 40% / .7);display:flex;align-items:center;gap:14px}
.next .big{font-size:30px;font-weight:800;letter-spacing:-1px;line-height:1;width:64px;text-align:center}.next .big small{display:block;font-size:11px;font-weight:600;opacity:.8;letter-spacing:.6px;margin-top:4px}.next b{display:block;font-size:15px}.next p{font-size:13px;opacity:.85;margin-top:2px}
.days{display:flex;justify-content:space-between;margin-top:14px;font-family:-apple-system,system-ui,sans-serif}.days div{display:flex;flex-direction:column;align-items:center;gap:6px;font-size:11px;color:var(--mute);width:40px;padding:8px 0;border-radius:${L.pill ? "999px" : "12px"}}.days div b{font-size:15px;color:var(--ink)}.days div.on{background:var(--ink);color:rgba(255,255,255,.7)}.days div.on b{color:#fff}
.slots{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px;font-family:-apple-system,system-ui,sans-serif}.slots span{text-align:center;padding:11px 0;border-radius:${L.pill ? "999px" : "10px"};background:#fff;border:${cardBorder};font-size:13.5px;font-weight:600}.slots span.on{background:var(--accbg);border-color:var(--acc);color:var(--acc)}
/* product */
.shot{height:250px;border-radius:var(--r);background:linear-gradient(160deg,hsl(var(--h) 40% 94%),hsl(calc(var(--h) + 30) 45% 86%));position:relative;overflow:hidden;margin-top:4px;display:grid;place-items:center}
.shot .obj{width:150px;height:150px;border-radius:${L.pill ? "50%" : "32px"};background:linear-gradient(135deg,var(--ink),#334155);box-shadow:0 30px 50px -20px rgba(15,23,42,.6);position:relative}.shot .obj:after{content:"";position:absolute;left:14px;top:14px;right:14px;height:36%;border-radius:20px;background:linear-gradient(180deg,rgba(255,255,255,.25),transparent)}
.shot .dots{position:absolute;bottom:12px;left:0;right:0;display:flex;justify-content:center;gap:5px}.shot .dots i{width:6px;height:6px;border-radius:50%;background:rgba(15,23,42,.25)}.shot .dots i:first-child{background:var(--ink)}
.specs{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}.specs div{background:var(--card);border:${cardBorder};border-radius:var(--r);padding:12px;box-shadow:var(--sh)}.specs small{display:block;color:var(--mute);font-size:11.5px;font-weight:600;letter-spacing:.3px;text-transform:uppercase}.specs b{display:block;font-size:14px;margin-top:3px}
.buy{display:flex;align-items:center;justify-content:space-between;margin-top:16px;padding:14px 16px;background:var(--card);border:${cardBorder};border-radius:var(--r);box-shadow:var(--sh)}.buy b{font-size:22px;letter-spacing:-.5px}.buy small{display:block;color:var(--mute);font-size:12px}
`;
}

const status = (dark: boolean) => `<div class="status" style="${dark ? "color:#fff" : ""}"><span>9:41</span><div class="dots"><i style="height:4px"></i><i style="height:6px"></i><i style="height:8px"></i><i style="height:10px"></i><span style="width:6px"></span><div class="bat"><b></b></div></div></div>`;

const TABSETS: Record<ProductKind, [keyof typeof I, string][]> = {
  saas: [["home", "Home"], ["activity", "Activity"], ["user", "Account"]],
  consumer: [["home", "Home"], ["search", "Explore"], ["user", "Profile"]],
  marketplace: [["search", "Explore"], ["heart", "Saved"], ["user", "Account"]],
  services: [["cal", "Bookings"], ["clock", "Availability"], ["user", "Account"]],
  hardware: [["box", "Shop"], ["activity", "Orders"], ["user", "Account"]],
};
function nav(active: number, kind: ProductKind, L: Look, where: "bottom" | "top"): string {
  const items = TABSETS[kind].map(([k, l], i) => `<div class="tab ${i === active ? "on" : ""}" data-go="${i === 2 ? 2 : 1}">${I[k]}<span>${l}</span></div>`).join("");
  if (L.nav === "top") return where === "top" ? `<div class="seg">${items}</div>` : "";
  if (where === "top") return "";
  return L.nav === "pillbar" ? `<nav class="pillbar">${items}</nav>` : `<nav class="tabs">${items}</nav>`;
}
/** Room at the bottom of a scroll for whatever floats over it. */
const tail = (L: Look) => `<div style="height:${L.nav === "pillbar" ? 96 : L.nav === "top" ? 30 : 22}px"></div>`;

function landing(m: Mockup, sc: MockScreen, kind: ProductKind, L: Look): string {
  const icons = [I.spark, I.shield, I.clock];
  const feat = (b: string, i: number) => {
    const q = b.startsWith('"');
    const ic = L.features === "numbered" ? `0${i + 1}` : icons[i % icons.length];
    return `<div class="feat"><div class="ic">${ic}</div><div><b>${esc(q ? b.replace(/^"|"$/g, "") : b)}</b><small>${esc(q ? `What ${m.audience} told us` : "Included from day one")}</small></div></div>`;
  };
  const feats = `<div class="${L.features === "list" ? "flist" : L.features === "grid" ? "fgrid" : L.features === "numbered" ? "fnum" : "feats"}">${sc.bullets.slice(0, L.features === "grid" ? 4 : 3).map(feat).join("")}</div>`;
  const names = (m.quotes ?? []).map((q) => q.who);
  const av = [...names, "MK", "JD", "AS", "LP"].slice(0, 4).map((x, i) => `<span style="--o:${i * 40}">${esc(initials(x))}</span>`).join("");
  const how: Record<ProductKind, [string, string][]> = {
    saas: [["Sign up with your email", "No card, no call, thirty seconds."], ["Do the one thing", `${esc(m.oneLiner)}.`], ["See it add up", "The one number that matters, every week."]],
    consumer: [["Sign up with your email", "Thirty seconds, no card."], ["Follow a few people", "Your feed fills up from the first day."], ["Post your first one", "Everyone starts with one."]],
    marketplace: [["Search what you need", "Near you, with prices up front."], ["Book or buy in one tap", "Pay safely inside the app."], ["Leave a review", "Good ones rise, that is the whole point."]],
    services: [["Pick a time", "See the open slots, book in one tap."], ["We come to you", "Confirmed by message, reminded the day before."], ["Pay after", "Card on file, nothing at the door."]],
    hardware: [["Order it", "Ships in three days, returns for thirty."], ["Plug it in", "Set up in the app in two minutes."], ["Forget about it", "It works; you get the number on your phone."]],
  };
  const q = m.quotes?.[0];
  const quote = q ? `<div class="sect"><h3>What ${esc(m.audience)} say</h3></div><div class="quote"><div class="stars">${I.star}${I.star}${I.star}${I.star}${I.star}</div><p>“${esc(q.said)}”</p><div class="by"><span>${esc(initials(q.who))}</span><div><b style="color:var(--ink)">${esc(q.who)}</b> · ${esc(m.audience)}</div></div></div>` : "";
  const stat = m.screens.find((s) => s.kind === "app")?.stat;
  const herocard = L.hero === "card" ? `<div class="herocard"><div class="mini"><i>${I.activity}</i><small>${esc(stat?.label ?? "this week")}</small><b>${esc(stat?.value ?? "12")}</b></div></div>` : "";
  return `<section class="screen on" id="s0"><div class="topbar"><div class="brand"><div class="mark">${esc(initials(m.name))}</div>${esc(m.name)}</div><span class="link">Log in</span></div>
<div class="scroll"><div class="hero"><div class="blob"></div><span class="eyebrow">${I.bolt.replace("<svg", '<svg style="width:12px;height:12px"')} New for ${esc(m.audience)}</span>${L.hero === "card" ? herocard : ""}<h1>${esc(sc.headline)}</h1><p class="sub">${esc(sc.sub || `For ${m.audience}.`)}</p>
${sc.fields.map((f) => `<div class="field"><label>${esc(f)}</label><div class="input">${esc(f.toLowerCase().includes("mail") ? "you@example.com" : f)}</div></div>`).join("")}
<div class="btn" data-go="1">${esc(sc.cta)} ${I.arrow}</div>
<div class="proof"><div class="avs">${av}</div><span>Used by ${esc(m.audience)}</span></div></div>
<div class="sect"><h3>Why ${esc(m.name)}</h3></div>${feats}
<div class="sect"><h3>How it works</h3></div><div class="steps">${how[kind].map(([a, b], i) => `<div class="step"><div class="n">${i + 1}</div><div><b>${a}</b><small>${b}</small></div></div>`).join("")}</div>
${quote}
<div class="cta2"><h3>${esc(sc.cta)} today</h3><p>No card. Cancel any time.</p><div class="btn" data-go="2">See the price</div></div>
<p class="foot">© ${esc(m.name)} · Privacy · Terms</p>${tail(L)}</div></section>`;
}

function chart(): string {
  const pts = [18, 26, 22, 34, 30, 44, 40, 52];
  const w = 320, h = 56;
  const xy = pts.map((p, i) => [Math.round((i / (pts.length - 1)) * w), h - Math.round((p / 60) * h)] as const);
  const line = xy.map(([x, y]) => `${x},${y}`).join(" ");
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><defs><linearGradient id="g" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><polygon points="0,${h} ${line} ${w},${h}" fill="url(#g)"/><polyline points="${line}" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function appScreen(m: Mockup, sc: MockScreen, kind: ProductKind, L: Look, price?: string): string {
  const stat = sc.stat ?? { label: "This week", value: "12" };
  const amt = (price ?? "").split(/\s+/)[0] || "+1";
  const per = (price ?? "").replace(/^\S+\s*/, "").replace(/^(an?|per|\/)\s*/i, "").trim();
  const rows = sc.bullets.slice(0, 3).map((b, i) => ({ t: b, m: ["Today", "Yesterday", "Monday"][i], a: i === 1 ? amt : i === 0 ? "New" : "" }));
  while (rows.length < 3) rows.push({ t: ["A new sign-up", "A payment came in", "A note left for you"][rows.length], m: ["Today", "Yesterday", "Monday"][rows.length], a: rows.length === 1 ? amt : "" });
  const top = `<div class="topbar"><div class="brand"><div class="mark">${esc(initials(m.name))}</div>${esc(m.name)}</div><span class="ib">${I.bell}</span></div>${nav(0, kind, L, "top")}`;
  const list = `<div class="card">${rows.map((r, i) => `<div class="row"><div class="av">${esc(initials(r.t))}</div><div><b>${esc(r.t)}</b><small>${r.m}</small></div>${r.a ? `<span class="amt ${i < 2 ? "up" : ""}">${esc(r.a)}</span>` : ""}</div>`).join("")}</div>`;
  const people = rows.map((r) => firstName(r.t));
  const avc = 'style="width:34px;height:34px;border-radius:50%;background:var(--accbg);color:var(--acc);display:grid;place-items:center;font-weight:700;font-size:12px"';
  let body = "";
  if (kind === "consumer") {
    body = `<div class="greet"><small>For you</small><h2>${esc(sc.headline)}</h2></div>
<div class="stories">${["You", ...people].slice(0, 5).map((p) => `<div><i><b>${esc(initials(p))}</b></i>${esc(p)}</div>`).join("")}</div>
<div class="post"><div class="head"><div ${avc}>${esc(initials(people[0]))}</div><div><b>${esc(people[0])}</b><small>Today</small></div></div><div class="pic"></div><div class="acts">${I.heart}${I.send}</div><div class="cap"><b>${esc(people[0])}</b> ${esc(rows[0].t.replace(people[0], "").trim() || sc.sub)}</div></div>
<div class="post"><div class="head"><div ${avc}>${esc(initials(people[1]))}</div><div><b>${esc(people[1])}</b><small>Yesterday</small></div></div><div class="pic" style="height:140px"></div><div class="acts">${I.heart}${I.send}</div></div>`;
  } else if (kind === "marketplace") {
    const cats = ["All", "Near me", "Top rated", "New"];
    const unit = (stat.label.replace(/\s+this week$/i, "") || "place").trim();
    body = `<div class="searchbar">${I.search}<div><b>${esc(sc.headline)}</b><small>Anywhere · Any time</small></div></div>
<div class="cats">${cats.map((c, i) => `<span class="${i === 0 ? "on" : ""}">${c}</span>`).join("")}</div>
<div class="grid">${["near the marina", "in the old town", "with a view", "by the station"].map((where, i) => `<div class="item"><div class="pic" style="background:linear-gradient(135deg,hsl(calc(var(--h) + ${i * 35}) 70% 85%),hsl(calc(var(--h) + ${i * 35 + 50}) 70% 70%))"><i>${I.heart}</i></div><div class="body"><b>${esc(`${unit.charAt(0).toUpperCase()}${unit.slice(1)} ${where}`)}</b><small>${I.star} 4.${8 - i} · ${1 + i} km · ${esc(people[i % people.length])}</small><div class="pr">${esc(amt === "+1" ? "€ ?" : amt)}${per ? ` · ${esc(per)}` : ""}</div></div></div>`).join("")}</div>`;
  } else if (kind === "services") {
    const d = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    body = `<div class="greet"><small>Next up</small><h2>${esc(sc.headline)}</h2></div>
<div class="next"><div class="big">14<small>THU</small></div><div><b>${esc(rows[0].t)}</b><p>10:00 · 45 min · ${esc(people[0])}</p></div></div>
<div class="sect"><h3>This week</h3><a>Month</a></div>
<div class="days">${d.map((x, i) => `<div class="${i === 3 ? "on" : ""}"><span>${x}</span><b>${11 + i}</b></div>`).join("")}</div>
<div class="sect"><h3>Open slots</h3></div><div class="slots">${["09:00", "10:00", "11:30", "14:00", "15:30", "17:00"].map((t, i) => `<span class="${i === 1 ? "on" : ""}">${t}</span>`).join("")}</div>
<div class="sect"><h3>Recent</h3><a>See all</a></div>${list}`;
  } else if (kind === "hardware") {
    body = `<div class="shot"><div class="obj"></div><div class="dots"><i></i><i></i><i></i></div></div>
<h2 style="margin-top:14px">${esc(sc.headline)}</h2><p class="sub" style="margin-top:4px">${esc(sc.sub)}</p>
<div class="specs"><div><small>${esc(stat.label)}</small><b>${esc(stat.value)}</b></div><div><small>Setup</small><b>2 minutes</b></div><div><small>Ships</small><b>3 days</b></div><div><small>Returns</small><b>30 days</b></div></div>
<div class="buy"><div><b>${esc(price ?? "€ ?")}</b><small>Free shipping</small></div><div class="btn sm" data-go="2">${esc(sc.cta)}</div></div>
<div class="sect"><h3>Recent orders</h3><a>See all</a></div>${list}`;
  } else {
    body = `<div class="greet"><small>Good morning</small><h2>${esc(sc.headline)}</h2></div>
<div class="stat"><small>${esc(stat.label)}</small><div class="n">${esc(stat.value)}</div><div class="d">${I.activity} +18% vs last week</div>${chart()}</div>
<div class="quick"><div><i>${I.plus}</i>${esc(sc.cta)}</div><div><i>${I.send}</i>Invite</div><div><i>${I.grid}</i>Reports</div><div><i>${I.clock}</i>History</div></div>
<div class="sect"><h3>Recent</h3><a>See all</a></div>${list}
<p class="note" style="text-align:left;margin-top:16px">${esc(sc.sub)}</p>`;
  }
  const fab = kind === "hardware" ? "" : `<div class="fab" data-go="2" title="${esc(sc.cta)}">${I.plus}</div>`;
  return `<section class="screen" id="s1">${top}<div class="scroll">${body}${tail(L)}</div>${fab}${nav(0, kind, L, "bottom")}</section>`;
}

function pricing(m: Mockup, sc: MockScreen, kind: ProductKind, L: Look): string {
  const price = sc.price ?? "";
  const mm = price.match(/^(.+?)(\s*(?:a|per|\/)\s*(?:month|mo|week|year|yr|day|seat|user|night|visit|order|hour))$/i);
  const big = mm ? mm[1] : price;
  const per = mm ? mm[2].trim() : kind === "hardware" ? "once" : "";
  const faq = [["Can I cancel?", "Yes, in one tap, any time."], ["Who is it for?", `${m.audience}.`], ["Is there a free trial?", "The first week, no card."]];
  const planClass = L.pricing === "dark" ? "plan dark" : L.pricing === "rows" ? "plan rows" : "plan";
  return `<section class="screen" id="s2"><div class="topbar"><div class="brand"><div class="mark">${esc(initials(m.name))}</div>${esc(m.name)}</div><span class="link">Restore</span></div>${nav(2, kind, L, "top")}
<div class="scroll"><span class="eyebrow">Pricing</span><h2 style="margin-top:10px">${esc(sc.headline)}</h2><p class="sub" style="margin-top:6px">${esc(sc.sub)}</p>
${per && !/once|night|visit|order|hour/.test(per) ? `<div class="toggle"><span class="on">Monthly</span><span>Yearly · 2 months free</span></div>` : ""}
<div class="${planClass}"><span class="chip">Most popular</span><b class="k" style="display:block;font-weight:600">One plan</b><div class="price"><b>${esc(big)}</b><span>${esc(per)}</span></div>
<div class="list">${sc.bullets.map((b) => `<div><span class="ck">${I.check}</span><span>${esc(b)}</span></div>`).join("")}</div>
<div class="btn" data-go="0">${esc(sc.cta)}</div><p class="note">Cancel any time · no card for the first week</p></div>
<div class="trust"><span>${I.shield} Secure payment</span><span>${I.check} Cancel any time</span><span>${I.clock} Set up in minutes</span></div>
<div class="faq">${faq.map(([q, a]) => `<div class="row"><div><b>${esc(q)}</b><small>${esc(a)}</small></div>${I.chevron}</div>`).join("")}</div>${tail(L)}</div>${nav(2, kind, L, "bottom")}</section>`;
}

const JS = `<script>
(function(){var s=document.querySelectorAll('.screen');function go(i){s.forEach(function(el,k){el.classList.toggle('on',k===i)});document.querySelectorAll('.scroll').forEach(function(el){el.scrollTop=0});try{window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(String(i))}catch(e){}try{window.parent&&window.parent!==window&&window.parent.postMessage({mock:i},'*')}catch(e){}}
document.addEventListener('click',function(e){var t=e.target.closest('[data-go]');if(t){go(Number(t.getAttribute('data-go')))}});
window.addEventListener('message',function(e){var d=e.data;if(d&&typeof d.go==='number')go(d.go)});
window.__go=go;})();
</script>`;

/** The whole app as one HTML document, opened on `screen`. */
export function mockupHtml(m: Mockup, opts?: { screen?: number }): string {
  const L = lookOf(m);
  const kind: ProductKind = m.kind ?? "saas";
  const by = (k: MockScreen["kind"], fb: number) => m.screens.find((s) => s.kind === k) ?? m.screens[fb] ?? m.screens[0];
  const l = by("landing", 0), a = by("app", 1), p = by("pricing", 2);
  const start = opts?.screen ?? 0;
  const body = [landing(m, l, kind, L), appScreen(m, a, kind, L, p.price), pricing(m, p, kind, L)].join("");
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(m.name)}</title><style>${css(L)}</style></head><body><div class="app">${status(false)}${body}<div class="home-ind"></div></div>${JS}<script>window.__go(${start})</script></body></html>`;
}

/** The picture's natural size; the page scales itself to the width it is given, so height = width * POSTER_H / POSTER_W. */
export const POSTER_W = 800;
export const POSTER_H = 690;

/** The three screens side by side in device frames on one page, for the picture. */
export function mockupPoster(m: Mockup): string {
  const L = lookOf(m);
  const F = FONTS[L.font];
  const one = (i: number) => `<div class="dev"><iframe srcdoc="${esc(mockupHtml(m, { screen: i }))}" scrolling="no"></iframe></div>`;
  const bg = L.palette === "ink" ? "linear-gradient(160deg,#f5f5f4,#e7e5e4)" : `linear-gradient(160deg,hsl(var(--h) 60% 97%),hsl(calc(var(--h) + 30) 50% 94%))`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
:root{--h:${L.hue}}*{box-sizing:border-box;margin:0;padding:0}
html{overflow:hidden}
body{width:${POSTER_W}px;height:${POSTER_H}px;transform-origin:0 0;background:${bg};font:14px ${F.body};color:#0f172a;padding:26px 24px 0}
h1{font-size:${L.font === "serif" ? "27px" : "24px"};letter-spacing:${F.track};line-height:1.15;font-weight:${F.weight};margin:6px 0 4px}.k{font-size:12px;letter-spacing:1.4px;text-transform:uppercase;color:#64748b;font-weight:700;font-family:-apple-system,system-ui,sans-serif}
.sub{color:#475569;font-size:14px}
.row{display:flex;gap:18px;justify-content:center;margin-top:20px;align-items:flex-start}
.dev{width:230px;height:472px;border-radius:38px;background:#0b0f19;padding:8px;box-shadow:0 30px 60px -24px rgba(15,23,42,.45),0 0 0 1px rgba(255,255,255,.4) inset;flex:none;overflow:hidden}
.dev iframe{display:block;width:390px;height:844px;border:0;border-radius:30px;background:#fff;transform:scale(0.5487);transform-origin:0 0;pointer-events:none}
.foot{display:flex;justify-content:space-between;margin-top:16px;color:#94a3b8;font-size:11px;font-family:-apple-system,system-ui,sans-serif}
</style></head><body><script>(function(){function fit(){var s=Math.min(1,window.innerWidth/${POSTER_W});document.body.style.transform="scale("+s+")"}fit();window.addEventListener("resize",fit)})()</script><div class="k">${esc(m.name)}</div><h1>${esc(m.oneLiner)}</h1><p class="sub">For ${esc(m.audience)}.</p>
<div class="row">${one(0)}${one(1)}${one(2)}</div>
<div class="foot"><span>${m.screens.map((s) => esc(s.title)).join(" · ")}</span><span>mocked up on FounderFloor</span></div></body></html>`;
}
