/**
 * The mock-up as a real page. From the founder's words the desk builds a
 * self-contained HTML app in the shape the big products use: a landing
 * page the way Linear, Stripe and Notion lay theirs out (nav, hero, proof,
 * three features, how it works, a testimonial, a final call), an app
 * screen whose layout follows the kind of product (a dashboard for
 * software, a feed for a consumer app, listings for a marketplace,
 * bookings for a service, a product page for hardware, the way Revolut,
 * Instagram, Airbnb, Calendly and Apple do theirs), and a pricing screen
 * the way Stripe and Notion price. Three styles: clean, bold, soft. A
 * status bar, a bottom tab bar, real inputs, icons, a chart. Tappable:
 * every button goes somewhere. Rendered in a web view on the phone and an
 * iframe on the web; captured as the picture. Nothing here needs a model.
 */
import type { Mockup, MockScreen, ProductKind } from "./workshop.ts";

export interface MockTheme {
  /** 0..360 */
  hue: number;
  style: "clean" | "bold" | "soft";
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** A steady colour per company name, so the same start-up always looks the same. */
export function mockupTheme(m: Mockup): MockTheme {
  if (m.theme) return m.theme;
  let h = 0;
  for (const ch of m.name) h = (h * 31 + ch.charCodeAt(0)) % 360;
  // keep away from the muddy yellows
  const hue = h > 40 && h < 75 ? h + 140 : h;
  return { hue, style: "clean" };
}

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
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 12-9 12S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v9"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h8l-1 8 10-12h-8z"/></svg>',
  grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
};

/** The three looks. Clean is what most builder tools ship; bold is the dark-hero, black-button look; soft is pastel and round. */
function css(t: MockTheme): string {
  const bold = t.style === "bold", soft = t.style === "soft";
  const r = soft ? "24px" : bold ? "12px" : "16px";
  const btnR = soft ? "999px" : bold ? "10px" : "14px";
  const btnBg = bold ? "var(--ink)" : "var(--p)";
  const btnSh = bold ? "none" : "0 6px 16px -6px hsl(var(--h) 72% 46% / .55)";
  const sh = soft ? "0 2px 4px rgba(15,23,42,.04),0 16px 40px -20px hsl(var(--h) 40% 40% / .25)" : bold ? "0 1px 2px rgba(15,23,42,.08)" : "0 1px 2px rgba(15,23,42,.06),0 8px 24px -12px rgba(15,23,42,.18)";
  const bg = soft ? "hsl(var(--h) 45% 97%)" : bold ? "#fafafa" : "#f8fafc";
  const heroBg = bold ? "background:var(--ink);color:#fff;margin:0 -20px;padding:22px 20px 26px;" : "";
  const heroSub = bold ? "color:rgba(255,255,255,.72)" : "";
  const heroInput = bold ? "background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.18);color:rgba(255,255,255,.6)" : "";
  const heroLabel = bold ? "color:rgba(255,255,255,.7)" : "";
  const heroBtn = bold ? "background:var(--p);" : "";
  const heroProof = bold ? "color:rgba(255,255,255,.7)" : "";
  return `
:root{--h:${t.hue};--p:hsl(var(--h) 72% 46%);--p2:hsl(var(--h) 72% 40%);--pl:hsl(var(--h) 80% 96%);--pm:hsl(var(--h) 60% 88%);--ink:#0f172a;--mute:#64748b;--line:${soft ? "hsl(var(--h) 30% 90%)" : "#e2e8f0"};--bg:${bg};--card:#fff;--r:${r};--sh:${sh};--btnr:${btnR}}
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;background:var(--bg);color:var(--ink);font:15px/1.45 -apple-system,BlinkMacSystemFont,"SF Pro Text",Inter,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden}
.app{position:relative;height:100%;display:flex;flex-direction:column}
.status{display:flex;justify-content:space-between;align-items:center;padding:14px 22px 6px;font-size:13px;font-weight:600;flex:none}
.status .dots{display:flex;gap:4px;align-items:center}.status .dots i{display:block;width:4px;background:currentColor;border-radius:1px}
.status .bat{width:24px;height:11px;border:1.5px solid currentColor;border-radius:3.5px;padding:1.5px}.status .bat b{display:block;height:100%;width:70%;background:currentColor;border-radius:1.5px}
.screen{display:none;flex:1;min-height:0;flex-direction:column}.screen.on{display:flex}
.scroll{flex:1;overflow:auto;padding:0 20px 28px;-webkit-overflow-scrolling:touch}
.topbar{display:flex;align-items:center;justify-content:space-between;padding:8px 20px 12px;flex:none}
.brand{display:flex;align-items:center;gap:8px;font-weight:700;letter-spacing:-.2px}
.brand .mark{width:28px;height:28px;border-radius:${soft ? "50%" : "9px"};background:linear-gradient(135deg,var(--p),hsl(calc(var(--h) + 30) 72% 52%));color:#fff;display:grid;place-items:center;font-size:12px;font-weight:800}
.link{color:var(--mute);font-size:14px;font-weight:500}.ib{width:36px;height:36px;border-radius:12px;background:#fff;border:1px solid var(--line);display:grid;place-items:center;color:var(--ink)}.ib svg{width:18px;height:18px}
h1{font-size:${bold ? "34px" : "31px"};line-height:1.1;letter-spacing:-.7px;font-weight:800;margin:14px 0 10px}
h2{font-size:22px;line-height:1.2;letter-spacing:-.4px;font-weight:700}h3{font-size:15px;font-weight:700}
.sub{color:var(--mute);font-size:15.5px;line-height:1.5}
.hero{position:relative;isolation:isolate;padding:8px 0 0;${heroBg}}.hero .sub{${heroSub}}.hero .field label{${heroLabel}}.hero .input{${heroInput}}.hero .btn{${heroBtn}}.hero .proof{${heroProof}}
.blob{position:absolute;right:-110px;top:-90px;width:260px;height:260px;border-radius:50%;background:radial-gradient(circle at 30% 30%,hsl(var(--h) 90% ${bold ? "40%" : "82%"}),transparent 70%);opacity:${bold ? ".5" : ".5"};pointer-events:none;z-index:-1}
.eyebrow{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;letter-spacing:.3px;color:var(--p);background:var(--pl);padding:5px 10px;border-radius:999px}${bold ? ".hero .eyebrow{background:rgba(255,255,255,.1);color:#fff}" : ""}
.field{display:flex;flex-direction:column;gap:6px;margin-top:16px}.field label{font-size:12.5px;font-weight:600;color:var(--mute)}
.input{display:flex;align-items:center;gap:8px;height:48px;padding:0 14px;border:1.5px solid var(--line);border-radius:${soft ? "999px" : "12px"};background:#fff;color:#94a3b8;font-size:15px}.input svg{width:18px;height:18px;color:#94a3b8}
.btn{display:flex;align-items:center;justify-content:center;gap:8px;height:50px;padding:0 18px;border-radius:var(--btnr);background:${btnBg};color:#fff;font-weight:700;font-size:15.5px;box-shadow:${btnSh};cursor:pointer;user-select:none;margin-top:12px}
.btn:active{transform:scale(.985)}.btn.ghost{background:#fff;color:var(--ink);border:1.5px solid var(--line);box-shadow:none}.btn.sm{height:38px;font-size:13.5px;padding:0 14px;margin:0}.btn svg{width:18px;height:18px}
.proof{display:flex;align-items:center;gap:10px;margin-top:18px;color:var(--mute);font-size:13px}
.avs{display:flex}.avs span{width:28px;height:28px;border-radius:50%;border:2px solid #fff;margin-left:-8px;display:grid;place-items:center;font-size:10px;font-weight:700;color:#fff;background:hsl(calc(var(--h) + var(--o)) 55% 55%)}.avs span:first-child{margin-left:0}
.sect{display:flex;align-items:baseline;justify-content:space-between;margin:22px 0 8px}.sect a{font-size:13px;color:var(--p);font-weight:600}
.k{font-size:11.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--mute)}
.feats{display:grid;gap:10px;margin-top:10px}
.feat{display:flex;gap:12px;align-items:flex-start;padding:14px;background:var(--card);border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--sh)}
.feat .ic{flex:none;width:36px;height:36px;border-radius:${soft ? "50%" : "10px"};background:var(--pl);color:var(--p);display:grid;place-items:center}.feat .ic svg{width:18px;height:18px}
.feat b{display:block;font-size:14.5px;font-weight:700;letter-spacing:-.1px}.feat small{display:block;color:var(--mute);font-size:13px;margin-top:2px}
.steps{display:grid;gap:0;margin-top:10px;background:var(--card);border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--sh);padding:6px 14px}
.step{display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-bottom:1px solid var(--line)}.step:last-child{border:0}
.step .n{flex:none;width:26px;height:26px;border-radius:50%;background:var(--ink);color:#fff;font-size:12px;font-weight:700;display:grid;place-items:center}${bold ? ".step .n{background:var(--p)}" : ""}
.step b{display:block;font-size:14px}.step small{display:block;color:var(--mute);font-size:12.5px;margin-top:2px}
.quote{margin-top:10px;background:var(--card);border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--sh);padding:16px}
.quote .stars{display:flex;gap:2px;color:#f59e0b;margin-bottom:8px}.quote .stars svg{width:14px;height:14px}
.quote p{font-size:15px;line-height:1.5;font-weight:500}.quote .by{display:flex;align-items:center;gap:10px;margin-top:12px;font-size:13px;color:var(--mute)}
.quote .by span{width:32px;height:32px;border-radius:50%;background:var(--pl);color:var(--p);display:grid;place-items:center;font-weight:700;font-size:12px}
.cta2{margin-top:22px;background:linear-gradient(135deg,var(--p),hsl(calc(var(--h) + 28) 70% 48%));color:#fff;border-radius:var(--r);padding:20px;text-align:center}.cta2 h3{font-size:19px;letter-spacing:-.3px}.cta2 p{font-size:13.5px;opacity:.85;margin-top:4px}.cta2 .btn{background:#fff;color:var(--p);box-shadow:none;margin-top:14px}
.foot{margin-top:26px;color:#94a3b8;font-size:12px;text-align:center}
.greet{padding:4px 0 14px}.greet small{color:var(--mute);font-size:13px;font-weight:500}.greet h2{margin-top:2px}
.stat{background:${bold ? "var(--ink)" : "linear-gradient(135deg,var(--p),hsl(calc(var(--h) + 28) 70% 48%))"};color:#fff;border-radius:${soft ? "24px" : "20px"};padding:18px 18px 14px;box-shadow:0 14px 30px -14px hsl(var(--h) 72% 40% / .7)}
.stat small{font-size:12.5px;opacity:.85;font-weight:600;letter-spacing:.2px;text-transform:uppercase}.stat .n{font-size:40px;font-weight:800;letter-spacing:-1.2px;line-height:1.05;margin-top:6px}
.stat .d{display:inline-flex;align-items:center;gap:6px;margin-top:8px;font-size:12.5px;font-weight:600;background:rgba(255,255,255,.18);padding:4px 9px;border-radius:999px}.stat .d svg{width:12px;height:12px}
.chart{margin-top:10px;height:56px;width:100%}
.quick{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:14px}
.quick div{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:12px 6px 10px;display:flex;flex-direction:column;align-items:center;gap:6px;font-size:11px;font-weight:600;color:var(--ink);box-shadow:var(--sh)}
.quick i{width:34px;height:34px;border-radius:${soft ? "50%" : "10px"};background:var(--pl);color:var(--p);display:grid;place-items:center}.quick svg{width:17px;height:17px}
.card{background:var(--card);border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--sh);padding:4px 14px}
.row{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--line)}.row:last-child{border:0}
.row .av{flex:none;width:40px;height:40px;border-radius:${soft ? "50%" : "12px"};background:var(--pl);color:var(--p);display:grid;place-items:center;font-weight:700;font-size:13px}
.row b{display:block;font-size:14.5px;font-weight:600}.row small{display:block;color:var(--mute);font-size:12.5px;margin-top:1px}.row .amt{margin-left:auto;font-weight:700;font-size:14px;flex:none}.row .amt.up{color:#16a34a}
.fab{position:absolute;right:20px;bottom:86px;width:54px;height:54px;border-radius:${soft ? "50%" : "18px"};background:${btnBg};color:#fff;display:grid;place-items:center;box-shadow:0 12px 24px -8px rgba(15,23,42,.45)}.fab svg{width:22px;height:22px}
.tabs{display:flex;justify-content:space-around;padding:8px 10px 22px;border-top:1px solid var(--line);background:rgba(255,255,255,.92);backdrop-filter:blur(12px);flex:none}
.tab{display:flex;flex-direction:column;align-items:center;gap:3px;font-size:10.5px;font-weight:600;color:#94a3b8;width:64px;cursor:pointer}.tab svg{width:22px;height:22px}.tab.on{color:${bold ? "var(--ink)" : "var(--p)"}}
.plan{background:var(--card);border:2px solid ${bold ? "var(--ink)" : "var(--p)"};border-radius:${soft ? "24px" : "20px"};padding:18px;margin-top:22px;position:relative;box-shadow:var(--sh)}
.chip{position:absolute;top:-12px;left:18px;background:${bold ? "var(--ink)" : "var(--p)"};color:#fff;font-size:11px;font-weight:700;padding:4px 10px;border-radius:999px;letter-spacing:.2px}
.price{display:flex;align-items:baseline;gap:6px;margin-top:6px}.price b{font-size:38px;font-weight:800;letter-spacing:-1.2px}.price span{color:var(--mute);font-size:14px}
.toggle{display:inline-flex;background:#fff;border:1px solid var(--line);border-radius:999px;padding:3px;margin-top:14px}.toggle span{padding:6px 12px;border-radius:999px;font-size:12.5px;font-weight:600;color:var(--mute)}.toggle span.on{background:var(--ink);color:#fff}
.list{display:grid;gap:9px;margin-top:14px}.list div{display:flex;gap:10px;align-items:center;font-size:14px}.list .ck{flex:none;width:20px;height:20px;border-radius:50%;background:var(--pl);color:var(--p);display:grid;place-items:center}.list .ck svg{width:12px;height:12px}
.note{color:var(--mute);font-size:13px;text-align:center;margin-top:12px}.trust{display:flex;justify-content:center;gap:14px;margin-top:14px;color:#94a3b8;font-size:12px}.trust span{display:flex;align-items:center;gap:5px}.trust svg{width:13px;height:13px}
.faq{margin-top:22px}.faq .row{padding:13px 0}.faq svg{width:18px;height:18px;color:#94a3b8;margin-left:auto;flex:none}
.home-ind{position:absolute;left:50%;bottom:7px;width:120px;height:5px;border-radius:3px;background:var(--ink);transform:translateX(-50%);opacity:.9}
/* feed */
.stories{display:flex;gap:12px;overflow:hidden;margin-top:4px}.stories div{display:flex;flex-direction:column;align-items:center;gap:5px;font-size:11px;color:var(--mute);flex:none}.stories i{width:58px;height:58px;border-radius:50%;padding:3px;background:linear-gradient(135deg,var(--p),hsl(calc(var(--h) + 40) 80% 60%))}.stories i b{display:block;width:100%;height:100%;border-radius:50%;background:#fff;border:2px solid #fff;color:var(--p);font-style:normal;font-size:14px;font-weight:700;display:grid;place-items:center}
.post{margin-top:14px;background:var(--card);border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--sh);overflow:hidden}
.post .head{display:flex;align-items:center;gap:10px;padding:12px 14px}.post .head b{font-size:14px}.post .head small{display:block;color:var(--mute);font-size:12px}
.pic{height:180px;background:linear-gradient(135deg,hsl(var(--h) 70% 85%),hsl(calc(var(--h) + 50) 70% 70%));position:relative}.pic:after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 70% 30%,rgba(255,255,255,.55),transparent 45%)}
.post .acts{display:flex;gap:16px;padding:10px 14px 4px;color:var(--ink)}.post .acts svg{width:22px;height:22px}.post .cap{padding:0 14px 14px;font-size:14px}.post .cap b{font-weight:700}
/* listings */
.searchbar{display:flex;align-items:center;gap:10px;height:52px;padding:0 16px;border-radius:999px;background:#fff;box-shadow:0 4px 16px -6px rgba(15,23,42,.25);border:1px solid var(--line);margin-top:4px}.searchbar svg{width:20px;height:20px;color:var(--ink)}.searchbar b{font-size:14px}.searchbar small{display:block;color:var(--mute);font-size:12px}
.cats{display:flex;gap:8px;overflow:hidden;margin-top:14px}.cats span{flex:none;padding:8px 14px;border-radius:999px;border:1px solid var(--line);background:#fff;font-size:13px;font-weight:600;color:var(--mute)}.cats span.on{background:var(--ink);color:#fff;border-color:var(--ink)}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}
.item{background:var(--card);border-radius:var(--r);overflow:hidden;border:1px solid var(--line);box-shadow:var(--sh)}.item .pic{height:120px}.item .pic i{position:absolute;top:8px;right:8px;width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.9);display:grid;place-items:center;color:var(--ink)}.item .pic svg{width:15px;height:15px}
.item .body{padding:10px 12px 12px}.item b{display:block;font-size:13.5px;line-height:1.25}.item small{display:flex;align-items:center;gap:4px;color:var(--mute);font-size:12px;margin-top:3px}.item small svg{width:11px;height:11px;color:#f59e0b}.item .pr{margin-top:6px;font-size:13.5px;font-weight:700}
/* bookings */
.next{background:${bold ? "var(--ink)" : "linear-gradient(135deg,var(--p),hsl(calc(var(--h) + 28) 70% 48%))"};color:#fff;border-radius:${soft ? "24px" : "20px"};padding:16px 18px;box-shadow:0 14px 30px -14px hsl(var(--h) 72% 40% / .7);display:flex;align-items:center;gap:14px}
.next .big{font-size:30px;font-weight:800;letter-spacing:-1px;line-height:1;width:64px;text-align:center}.next .big small{display:block;font-size:11px;font-weight:600;opacity:.8;letter-spacing:.6px;margin-top:4px}.next b{display:block;font-size:15px}.next p{font-size:13px;opacity:.85;margin-top:2px}
.days{display:flex;justify-content:space-between;margin-top:14px}.days div{display:flex;flex-direction:column;align-items:center;gap:6px;font-size:11px;color:var(--mute);width:40px;padding:8px 0;border-radius:14px}.days div b{font-size:15px;color:var(--ink)}.days div.on{background:var(--ink);color:rgba(255,255,255,.7)}.days div.on b{color:#fff}
.slots{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}.slots span{text-align:center;padding:11px 0;border-radius:${soft ? "999px" : "12px"};background:#fff;border:1px solid var(--line);font-size:13.5px;font-weight:600}.slots span.on{background:var(--pl);border-color:var(--p);color:var(--p)}
/* product */
.shot{height:250px;border-radius:var(--r);background:linear-gradient(160deg,hsl(var(--h) 40% 94%),hsl(calc(var(--h) + 30) 45% 86%));position:relative;overflow:hidden;margin-top:4px;display:grid;place-items:center}
.shot .obj{width:150px;height:150px;border-radius:32px;background:linear-gradient(135deg,var(--ink),#334155);box-shadow:0 30px 50px -20px rgba(15,23,42,.6);position:relative}.shot .obj:after{content:"";position:absolute;left:14px;top:14px;right:14px;height:36%;border-radius:20px;background:linear-gradient(180deg,rgba(255,255,255,.25),transparent)}
.shot .dots{position:absolute;bottom:12px;left:0;right:0;display:flex;justify-content:center;gap:5px}.shot .dots i{width:6px;height:6px;border-radius:50%;background:rgba(15,23,42,.25)}.shot .dots i:first-child{background:var(--ink)}
.specs{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}.specs div{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:12px;box-shadow:var(--sh)}.specs small{display:block;color:var(--mute);font-size:11.5px;font-weight:600;letter-spacing:.3px;text-transform:uppercase}.specs b{display:block;font-size:14px;margin-top:3px}
.buy{display:flex;align-items:center;justify-content:space-between;margin-top:16px;padding:14px 16px;background:var(--card);border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--sh)}.buy b{font-size:22px;letter-spacing:-.5px}.buy small{display:block;color:var(--mute);font-size:12px}
`;
}

const status = (dark: boolean) => `<div class="status" style="${dark ? "color:#fff" : ""}"><span>9:41</span><div class="dots"><i style="height:4px"></i><i style="height:6px"></i><i style="height:8px"></i><i style="height:10px"></i><span style="width:6px"></span><div class="bat"><b></b></div></div></div>`;

function tabs(active: number, kind: ProductKind) {
  const sets: Record<ProductKind, [keyof typeof I, string][]> = {
    saas: [["home", "Home"], ["activity", "Activity"], ["user", "Account"]],
    consumer: [["home", "Home"], ["search", "Explore"], ["user", "Profile"]],
    marketplace: [["search", "Explore"], ["heart", "Saved"], ["user", "Account"]],
    services: [["cal", "Bookings"], ["clock", "Availability"], ["user", "Account"]],
    hardware: [["box", "Shop"], ["activity", "Orders"], ["user", "Account"]],
  };
  return `<nav class="tabs">${sets[kind].map(([k, l], i) => `<div class="tab ${i === active ? "on" : ""}" data-go="${i === 2 ? 2 : 1}">${I[k]}<span>${l}</span></div>`).join("")}</nav>`;
}

function landing(m: Mockup, sc: MockScreen, kind: ProductKind): string {
  const icons = [I.spark, I.shield, I.clock];
  const feats = sc.bullets.slice(0, 3).map((b, i) => {
    const q = b.startsWith('"');
    return `<div class="feat"><div class="ic">${icons[i % icons.length]}</div><div><b>${esc(q ? b.replace(/^"|"$/g, "") : b)}</b><small>${esc(q ? `What ${m.audience} told us` : "Included from day one")}</small></div></div>`;
  }).join("");
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
  return `<section class="screen on" id="s0"><div class="topbar"><div class="brand"><div class="mark">${esc(initials(m.name))}</div>${esc(m.name)}</div><span class="link">Log in</span></div>
<div class="scroll"><div class="hero"><div class="blob"></div><span class="eyebrow">${I.bolt.replace("<svg", '<svg style="width:12px;height:12px"')} New for ${esc(m.audience)}</span><h1>${esc(sc.headline)}</h1><p class="sub">${esc(sc.sub || `For ${m.audience}.`)}</p>
${sc.fields.map((f) => `<div class="field"><label>${esc(f)}</label><div class="input">${esc(f.toLowerCase().includes("mail") ? "you@example.com" : f)}</div></div>`).join("")}
<div class="btn" data-go="1">${esc(sc.cta)} ${I.arrow}</div>
<div class="proof"><div class="avs">${av}</div><span>Used by ${esc(m.audience)}</span></div></div>
<div class="sect"><h3>Why ${esc(m.name)}</h3></div><div class="feats">${feats}</div>
<div class="sect"><h3>How it works</h3></div><div class="steps">${how[kind].map(([a, b], i) => `<div class="step"><div class="n">${i + 1}</div><div><b>${a}</b><small>${b}</small></div></div>`).join("")}</div>
${quote}
<div class="cta2"><h3>${esc(sc.cta)} today</h3><p>No card. Cancel any time.</p><div class="btn" data-go="2">See the price</div></div>
<p class="foot">© ${esc(m.name)} · Privacy · Terms</p><div style="height:22px"></div></div></section>`;
}

function chart(): string {
  const pts = [18, 26, 22, 34, 30, 44, 40, 52];
  const w = 320, h = 56;
  const xy = pts.map((p, i) => [Math.round((i / (pts.length - 1)) * w), h - Math.round((p / 60) * h)] as const);
  const line = xy.map(([x, y]) => `${x},${y}`).join(" ");
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><defs><linearGradient id="g" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><polygon points="0,${h} ${line} ${w},${h}" fill="url(#g)"/><polyline points="${line}" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function appScreen(m: Mockup, sc: MockScreen, kind: ProductKind, price?: string): string {
  const stat = sc.stat ?? { label: "This week", value: "12" };
  const amt = (price ?? "").split(/\s+/)[0] || "+1";
  const per = (price ?? "").replace(/^\S+\s*/, "").replace(/^(an?|per|\/)\s*/i, "").trim();
  const rows = sc.bullets.slice(0, 3).map((b, i) => ({ t: b, m: ["Today", "Yesterday", "Monday"][i], a: i === 1 ? amt : i === 0 ? "New" : "" }));
  while (rows.length < 3) rows.push({ t: ["A new sign-up", "A payment came in", "A note left for you"][rows.length], m: ["Today", "Yesterday", "Monday"][rows.length], a: rows.length === 1 ? amt : "" });
  const top = `<div class="topbar"><div class="brand"><div class="mark">${esc(initials(m.name))}</div>${esc(m.name)}</div><span class="ib">${I.bell}</span></div>`;
  const list = `<div class="card">${rows.map((r, i) => `<div class="row"><div class="av">${esc(initials(r.t))}</div><div><b>${esc(r.t)}</b><small>${r.m}</small></div>${r.a ? `<span class="amt ${i < 2 ? "up" : ""}">${esc(r.a)}</span>` : ""}</div>`).join("")}</div>`;
  const people = rows.map((r) => firstName(r.t));
  let body = "";
  if (kind === "consumer") {
    body = `<div class="greet"><small>For you</small><h2>${esc(sc.headline)}</h2></div>
<div class="stories">${["You", ...people].slice(0, 5).map((p) => `<div><i><b>${esc(initials(p))}</b></i>${esc(p)}</div>`).join("")}</div>
<div class="post"><div class="head"><div class="av" style="width:34px;height:34px;border-radius:50%;background:var(--pl);color:var(--p);display:grid;place-items:center;font-weight:700;font-size:12px">${esc(initials(people[0]))}</div><div><b>${esc(people[0])}</b><small>Today</small></div></div><div class="pic"></div><div class="acts">${I.heart}${I.send}</div><div class="cap"><b>${esc(people[0])}</b> ${esc(rows[0].t.replace(people[0], "").trim() || sc.sub)}</div></div>
<div class="post"><div class="head"><div class="av" style="width:34px;height:34px;border-radius:50%;background:var(--pl);color:var(--p);display:grid;place-items:center;font-weight:700;font-size:12px">${esc(initials(people[1]))}</div><div><b>${esc(people[1])}</b><small>Yesterday</small></div></div><div class="pic" style="height:140px"></div><div class="acts">${I.heart}${I.send}</div></div>`;
  } else if (kind === "marketplace") {
    const cats = ["All", "Near me", "Top rated", "New"];
    body = `<div class="searchbar">${I.search}<div><b>${esc(sc.headline)}</b><small>Anywhere · Any time</small></div></div>
<div class="cats">${cats.map((c, i) => `<span class="${i === 0 ? "on" : ""}">${c}</span>`).join("")}</div>
<div class="grid">${["near the marina", "in the old town", "with a view", "by the station"].map((where, i) => { const unit = (stat.label.replace(/\s+this week$/i, "") || "place").trim(); const t = `${unit.charAt(0).toUpperCase()}${unit.slice(1)} ${where}`; return `<div class="item"><div class="pic" style="background:linear-gradient(135deg,hsl(calc(var(--h) + ${i * 35}) 70% 85%),hsl(calc(var(--h) + ${i * 35 + 50}) 70% 70%))"><i>${I.heart}</i></div><div class="body"><b>${esc(t)}</b><small>${I.star} 4.${8 - i} · ${1 + i} km · ${esc(people[i % people.length])}</small><div class="pr">${esc(amt === "+1" ? "€ ?" : amt)}${per ? ` · ${esc(per)}` : ""}</div></div></div>`; }).join("")}</div>`;
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
  return `<section class="screen" id="s1">${top}<div class="scroll">${body}</div>${fab}${tabs(kind === "marketplace" ? 0 : 0, kind)}</section>`;
}

function pricing(m: Mockup, sc: MockScreen, kind: ProductKind): string {
  const price = sc.price ?? "";
  const mm = price.match(/^(.+?)(\s*(?:a|per|\/)\s*(?:month|mo|week|year|yr|day|seat|user|night|visit|order))$/i);
  const big = mm ? mm[1] : price;
  const per = mm ? mm[2].trim() : kind === "hardware" ? "once" : "";
  const faq = [
    ["Can I cancel?", "Yes, in one tap, any time."],
    ["Who is it for?", `${m.audience}.`],
    ["Is there a free trial?", "The first week, no card."],
  ];
  return `<section class="screen" id="s2"><div class="topbar"><div class="brand"><div class="mark">${esc(initials(m.name))}</div>${esc(m.name)}</div><span class="link">Restore</span></div>
<div class="scroll"><span class="eyebrow">Pricing</span><h2 style="margin-top:10px">${esc(sc.headline)}</h2><p class="sub" style="margin-top:6px">${esc(sc.sub)}</p>
${per && !/once|night|visit|order/.test(per) ? `<div class="toggle"><span class="on">Monthly</span><span>Yearly · 2 months free</span></div>` : ""}
<div class="plan"><span class="chip">Most popular</span><b style="font-size:14px;color:var(--mute);font-weight:600">One plan</b><div class="price"><b>${esc(big)}</b><span>${esc(per)}</span></div>
<div class="list">${sc.bullets.map((b) => `<div><span class="ck">${I.check}</span><span>${esc(b)}</span></div>`).join("")}</div>
<div class="btn" data-go="0">${esc(sc.cta)}</div><p class="note">Cancel any time · no card for the first week</p></div>
<div class="trust"><span>${I.shield} Secure payment</span><span>${I.check} Cancel any time</span><span>${I.clock} Set up in minutes</span></div>
<div class="faq">${faq.map(([q, a]) => `<div class="row"><div><b>${esc(q)}</b><small>${esc(a)}</small></div>${I.chevron}</div>`).join("")}</div></div>${tabs(2, kind)}</section>`;
}

const JS = `<script>
(function(){var s=document.querySelectorAll('.screen');function go(i){s.forEach(function(el,k){el.classList.toggle('on',k===i)});var sc=document.querySelectorAll('.scroll');sc.forEach(function(el){el.scrollTop=0});try{window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(String(i))}catch(e){}try{window.parent&&window.parent!==window&&window.parent.postMessage({mock:i},'*')}catch(e){}}
document.addEventListener('click',function(e){var t=e.target.closest('[data-go]');if(t){go(Number(t.getAttribute('data-go')))}});
window.addEventListener('message',function(e){var d=e.data;if(d&&typeof d.go==='number')go(d.go)});
window.__go=go;})();
</script>`;

/** The whole app as one HTML document, opened on `screen`. */
export function mockupHtml(m: Mockup, opts?: { screen?: number }): string {
  const t = mockupTheme(m);
  const kind: ProductKind = m.kind ?? "saas";
  const by = (k: MockScreen["kind"], fb: number) => m.screens.find((s) => s.kind === k) ?? m.screens[fb] ?? m.screens[0];
  const l = by("landing", 0), a = by("app", 1), p = by("pricing", 2);
  const start = opts?.screen ?? 0;
  const body = [landing(m, l, kind), appScreen(m, a, kind, p.price), pricing(m, p, kind)].join("");
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(m.name)}</title><style>${css(t)}</style></head><body><div class="app">${status(false)}${body}<div class="home-ind"></div></div>${JS}<script>window.__go(${start})</script></body></html>`;
}

/** The picture's natural size; the page scales itself to the width it is given, so height = width * POSTER_H / POSTER_W. */
export const POSTER_W = 800;
export const POSTER_H = 690;

/** The three screens side by side in device frames on one page, for the picture. */
export function mockupPoster(m: Mockup): string {
  const t = mockupTheme(m);
  const one = (i: number) => `<div class="dev"><iframe srcdoc="${esc(mockupHtml(m, { screen: i }))}" scrolling="no"></iframe></div>`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
:root{--h:${t.hue}}*{box-sizing:border-box;margin:0;padding:0}
html{overflow:hidden}
body{width:${POSTER_W}px;height:${POSTER_H}px;transform-origin:0 0;background:linear-gradient(160deg,hsl(var(--h) 60% 97%),hsl(calc(var(--h) + 30) 50% 94%));font:14px -apple-system,BlinkMacSystemFont,Inter,"Segoe UI",Roboto,sans-serif;color:#0f172a;padding:26px 24px 0}
h1{font-size:24px;letter-spacing:-.5px;line-height:1.15;font-weight:800;margin:6px 0 4px}.k{font-size:12px;letter-spacing:1.4px;text-transform:uppercase;color:#64748b;font-weight:700}
.sub{color:#475569;font-size:14px}
.row{display:flex;gap:18px;justify-content:center;margin-top:20px;align-items:flex-start}
.dev{width:230px;height:472px;border-radius:38px;background:#0b0f19;padding:8px;box-shadow:0 30px 60px -24px rgba(15,23,42,.45),0 0 0 1px rgba(255,255,255,.4) inset;flex:none;overflow:hidden}
.dev iframe{display:block;width:390px;height:844px;border:0;border-radius:30px;background:#fff;transform:scale(0.5487);transform-origin:0 0;pointer-events:none}
.foot{display:flex;justify-content:space-between;margin-top:16px;color:#94a3b8;font-size:11px}
</style></head><body><script>(function(){function fit(){var s=Math.min(1,window.innerWidth/${POSTER_W});document.body.style.transform="scale("+s+")"}fit();window.addEventListener("resize",fit)})()</script><div class="k">${esc(m.name)}</div><h1>${esc(m.oneLiner)}</h1><p class="sub">For ${esc(m.audience)}.</p>
<div class="row">${one(0)}${one(1)}${one(2)}</div>
<div class="foot"><span>${m.screens.map((s) => esc(s.title)).join(" · ")}</span><span>mocked up on FounderFloor</span></div></body></html>`;
}
