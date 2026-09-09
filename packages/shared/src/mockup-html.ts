/**
 * The mock-up as a real page. From the founder's words the desk builds a
 * self-contained HTML app with the design system every builder tool
 * ships today: system type, an 8-point grid, cards with soft shadows, a
 * brand colour, a status bar, a bottom tab bar, real inputs, icons. Three
 * screens (the front door, the one screen, the price), tappable: every
 * button goes somewhere and the tab bar switches. Rendered in a web view
 * on the phone and an iframe on the web; captured as the picture. Nothing
 * here needs a model: the words come from the mock-up, the look is fixed.
 */
import type { Mockup, MockScreen } from "./workshop.ts";

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

const ICON = {
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
};

const CSS = (t: MockTheme) => `
:root{--h:${t.hue};--p:hsl(var(--h) 72% 46%);--p2:hsl(var(--h) 72% 40%);--pl:hsl(var(--h) 80% 96%);--pm:hsl(var(--h) 60% 88%);--ink:#0f172a;--mute:#64748b;--line:#e2e8f0;--bg:#f8fafc;--card:#fff;--r:${t.style === "soft" ? "22px" : "16px"};--sh:0 1px 2px rgba(15,23,42,.06),0 8px 24px -12px rgba(15,23,42,.18)}
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;background:var(--bg);color:var(--ink);font:15px/1.45 -apple-system,BlinkMacSystemFont,"SF Pro Text",Inter,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden}
.app{position:relative;height:100%;display:flex;flex-direction:column}
.status{display:flex;justify-content:space-between;align-items:center;padding:14px 22px 6px;font-size:13px;font-weight:600}
.status .dots{display:flex;gap:4px;align-items:center}
.status .dots i{display:block;width:4px;background:var(--ink);border-radius:1px}
.status .bat{width:24px;height:11px;border:1.5px solid var(--ink);border-radius:3.5px;padding:1.5px}.status .bat b{display:block;height:100%;width:70%;background:var(--ink);border-radius:1.5px}
.screen{display:none;flex:1;min-height:0;flex-direction:column}.screen.on{display:flex}
.scroll{flex:1;overflow:auto;padding:0 20px 24px;-webkit-overflow-scrolling:touch}
.topbar{display:flex;align-items:center;justify-content:space-between;padding:8px 20px 12px}
.brand{display:flex;align-items:center;gap:8px;font-weight:700;letter-spacing:-.2px}
.brand .mark{width:28px;height:28px;border-radius:9px;background:linear-gradient(135deg,var(--p),hsl(calc(var(--h) + 30) 72% 52%));color:#fff;display:grid;place-items:center;font-size:12px;font-weight:800}
.link{color:var(--mute);font-size:14px;font-weight:500}
h1{font-size:30px;line-height:1.12;letter-spacing:-.6px;font-weight:800;margin:14px 0 10px}
h2{font-size:22px;line-height:1.2;letter-spacing:-.4px;font-weight:700}
.sub{color:var(--mute);font-size:15.5px;line-height:1.5}
.hero{position:relative;padding:8px 0 0}
.blob{position:absolute;right:-110px;top:-90px;width:260px;height:260px;border-radius:50%;background:radial-gradient(circle at 30% 30%,hsl(var(--h) 90% 82%),transparent 70%);opacity:.5;pointer-events:none;z-index:-1}
.hero{isolation:isolate}
.field{display:flex;flex-direction:column;gap:6px;margin-top:16px}
.field label{font-size:12.5px;font-weight:600;color:var(--mute)}
.input{display:flex;align-items:center;height:48px;padding:0 14px;border:1.5px solid var(--line);border-radius:12px;background:#fff;color:#94a3b8;font-size:15px}
.btn{display:flex;align-items:center;justify-content:center;gap:8px;height:50px;padding:0 18px;border-radius:14px;background:var(--p);color:#fff;font-weight:700;font-size:15.5px;box-shadow:0 6px 16px -6px hsl(var(--h) 72% 46% / .55);cursor:pointer;user-select:none;margin-top:12px}
.btn:active{transform:scale(.985);background:var(--p2)}
.btn.ghost{background:#fff;color:var(--ink);border:1.5px solid var(--line);box-shadow:none}
.btn svg{width:18px;height:18px}
.proof{display:flex;align-items:center;gap:10px;margin-top:18px;color:var(--mute);font-size:13px}
.avs{display:flex}.avs span{width:28px;height:28px;border-radius:50%;border:2px solid #fff;margin-left:-8px;display:grid;place-items:center;font-size:10px;font-weight:700;color:#fff;background:hsl(calc(var(--h) + var(--o)) 55% 55%)}.avs span:first-child{margin-left:0}
.feats{display:grid;gap:10px;margin-top:22px}
.feat{display:flex;gap:12px;align-items:flex-start;padding:14px;background:var(--card);border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--sh)}
.feat .ic{flex:none;width:36px;height:36px;border-radius:10px;background:var(--pl);color:var(--p);display:grid;place-items:center}.feat .ic svg{width:18px;height:18px}
.feat b{display:block;font-size:14.5px;font-weight:700;letter-spacing:-.1px}.feat small{display:block;color:var(--mute);font-size:13px;margin-top:2px}
.foot{margin-top:26px;color:#94a3b8;font-size:12px;text-align:center}
.greet{padding:4px 0 14px}.greet small{color:var(--mute);font-size:13px;font-weight:500}.greet h2{margin-top:2px}
.stat{background:linear-gradient(135deg,var(--p),hsl(calc(var(--h) + 28) 70% 48%));color:#fff;border-radius:20px;padding:18px 18px 14px;box-shadow:0 14px 30px -14px hsl(var(--h) 72% 40% / .7)}
.stat small{font-size:12.5px;opacity:.85;font-weight:600;letter-spacing:.2px;text-transform:uppercase}
.stat .n{font-size:40px;font-weight:800;letter-spacing:-1.2px;line-height:1.05;margin-top:6px}
.stat .d{display:inline-flex;align-items:center;gap:6px;margin-top:8px;font-size:12.5px;font-weight:600;background:rgba(255,255,255,.18);padding:4px 9px;border-radius:999px}
.chart{margin-top:10px;height:56px;width:100%}
.row{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--line)}
.row:last-child{border:0}.row .av{flex:none;width:40px;height:40px;border-radius:12px;background:var(--pl);color:var(--p);display:grid;place-items:center;font-weight:700;font-size:13px}
.row b{display:block;font-size:14.5px;font-weight:600}.row small{display:block;color:var(--mute);font-size:12.5px;margin-top:1px}
.row .amt{margin-left:auto;font-weight:700;font-size:14px;color:var(--ink);flex:none}
.card.recent{margin-right:0;padding-bottom:6px}.row .amt.up{color:#16a34a}
.sect{display:flex;align-items:baseline;justify-content:space-between;margin:20px 0 4px}.sect h3{font-size:15px;font-weight:700}.sect a{font-size:13px;color:var(--p);font-weight:600}
.card{background:var(--card);border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--sh);padding:4px 14px}
.fab{position:absolute;right:20px;bottom:86px;width:54px;height:54px;border-radius:18px;background:var(--p);color:#fff;display:grid;place-items:center;box-shadow:0 12px 24px -8px hsl(var(--h) 72% 46% / .7)}.fab svg{width:22px;height:22px}
.tabs{display:flex;justify-content:space-around;padding:8px 10px 22px;border-top:1px solid var(--line);background:rgba(255,255,255,.92);backdrop-filter:blur(12px)}
.tab{display:flex;flex-direction:column;align-items:center;gap:3px;font-size:10.5px;font-weight:600;color:#94a3b8;width:64px;cursor:pointer}
.tab svg{width:22px;height:22px}.tab.on{color:var(--p)}
.plan{background:var(--card);border:2px solid var(--p);border-radius:20px;padding:18px;margin-top:18px;position:relative;box-shadow:var(--sh)}
.chip{position:absolute;top:-12px;left:18px;background:var(--p);color:#fff;font-size:11px;font-weight:700;padding:4px 10px;border-radius:999px;letter-spacing:.2px}
.price{display:flex;align-items:baseline;gap:6px;margin-top:6px}.price b{font-size:36px;font-weight:800;letter-spacing:-1px}.price span{color:var(--mute);font-size:14px}
.list{display:grid;gap:9px;margin-top:14px}.list div{display:flex;gap:10px;align-items:center;font-size:14px}
.list .ck{flex:none;width:20px;height:20px;border-radius:50%;background:var(--pl);color:var(--p);display:grid;place-items:center}.list .ck svg{width:12px;height:12px}
.note{color:var(--mute);font-size:13px;text-align:center;margin-top:12px}
.faq{margin-top:22px}.faq .row{padding:13px 0}.faq svg{width:18px;height:18px;color:#94a3b8;margin-left:auto}
.home-ind{position:absolute;left:50%;bottom:7px;width:120px;height:5px;border-radius:3px;background:var(--ink);transform:translateX(-50%);opacity:.9}
`;

function tabs(active: number) {
  const t = [
    ["home", "Home"],
    ["activity", "Activity"],
    ["user", "Account"],
  ] as const;
  return `<nav class="tabs">${t.map(([k, l], i) => `<div class="tab ${i === active ? "on" : ""}" data-go="${i === 0 ? 1 : i === 1 ? 1 : 2}">${ICON[k]}<span>${l}</span></div>`).join("")}</nav>`;
}

const status = `<div class="status"><span>9:41</span><div class="dots"><i style="height:4px"></i><i style="height:6px"></i><i style="height:8px"></i><i style="height:10px"></i><span style="width:6px"></span><div class="bat"><b></b></div></div></div>`;

function landing(m: Mockup, sc: MockScreen): string {
  const icons = [ICON.spark, ICON.shield, ICON.clock];
  const feats = sc.bullets.slice(0, 3).map((b, i) => {
    const q = b.startsWith('"');
    return `<div class="feat"><div class="ic">${icons[i % icons.length]}</div><div><b>${esc(q ? b.replace(/^"|"$/g, "") : b)}</b><small>${esc(q ? `What ${m.audience} told us` : "Included from day one")}</small></div></div>`;
  }).join("");
  const av = ["MK", "JD", "AS", "LP"].map((x, i) => `<span style="--o:${i * 40}">${x}</span>`).join("");
  return `<section class="screen on" id="s0"><div class="topbar"><div class="brand"><div class="mark">${esc(initials(m.name))}</div>${esc(m.name)}</div><span class="link">Log in</span></div>
<div class="scroll"><div class="hero"><div class="blob"></div><h1>${esc(sc.headline)}</h1><p class="sub">${esc(sc.sub || `For ${m.audience}.`)}</p>
${sc.fields.map((f) => `<div class="field"><label>${esc(f)}</label><div class="input">${esc(f.toLowerCase().includes("mail") ? "you@example.com" : f)}</div></div>`).join("")}
<div class="btn" data-go="1">${esc(sc.cta)} ${ICON.arrow}</div>
<div class="proof"><div class="avs">${av}</div><span>Used by ${esc(m.audience)}</span></div></div>
<div class="feats">${feats}</div>
<p class="foot">© ${esc(m.name)} · Privacy · Terms</p></div></section>`;
}

function appScreen(m: Mockup, sc: MockScreen, price?: string): string {
  const stat = sc.stat ?? { label: "This week", value: "12" };
  const pts = [18, 26, 22, 34, 30, 44, 40, 52];
  const w = 320, h = 56;
  const xy = pts.map((p, i) => [Math.round((i / (pts.length - 1)) * w), h - Math.round((p / 60) * h)] as const);
  const line = xy.map(([x, y]) => `${x},${y}`).join(" ");
  // the amount on a row is short: "€40", never "€40 a month"
  const amt = (price ?? "").split(/\s+/)[0] || "+1";
  const rows = [
    ...sc.bullets.slice(0, 3).map((b, i) => ({ t: b, m: ["Today", "Yesterday", "Monday"][i], a: i === 1 ? amt : i === 0 ? "New" : "" })),
  ];
  while (rows.length < 3) rows.push({ t: ["A new sign-up", "A payment came in", "A note left for you"][rows.length], m: ["Today", "Yesterday", "Monday"][rows.length], a: rows.length === 1 ? amt : "" });
  return `<section class="screen" id="s1"><div class="topbar"><div class="brand"><div class="mark">${esc(initials(m.name))}</div>${esc(m.name)}</div><span class="link" style="width:22px;height:22px;color:var(--ink)">${ICON.bell}</span></div>
<div class="scroll"><div class="greet"><small>Good morning</small><h2>${esc(sc.headline)}</h2></div>
<div class="stat"><small>${esc(stat.label)}</small><div class="n">${esc(stat.value)}</div><div class="d">${ICON.activity.replace("<svg", '<svg style="width:12px;height:12px"')} +18% vs last week</div>
<svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><defs><linearGradient id="g" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><polygon points="0,${h} ${line} ${w},${h}" fill="url(#g)"/><polyline points="${line}" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
<div class="sect"><h3>Recent</h3><a>See all</a></div>
<div class="card">${rows.map((r, i) => `<div class="row"><div class="av">${esc(initials(r.t))}</div><div><b>${esc(r.t)}</b><small>${r.m}</small></div>${r.a ? `<span class="amt ${i < 2 ? "up" : ""}">${esc(r.a)}</span>` : ""}</div>`).join("")}</div>
<p class="note" style="text-align:left;margin-top:16px">${esc(sc.sub)}</p></div>
<div class="fab" data-go="2" title="${esc(sc.cta)}">${ICON.plus}</div>${tabs(0)}</section>`;
}

function pricing(m: Mockup, sc: MockScreen): string {
  const price = sc.price ?? "";
  const mm = price.match(/^(.+?)(\s*(?:a|per|\/)\s*(?:month|mo|week|year|yr|day|seat|user))$/i);
  const big = mm ? mm[1] : price;
  const per = mm ? mm[2].trim() : "";
  return `<section class="screen" id="s2"><div class="topbar"><div class="brand"><div class="mark">${esc(initials(m.name))}</div>${esc(m.name)}</div><span class="link">Restore</span></div>
<div class="scroll"><h2 style="margin-top:6px">${esc(sc.headline)}</h2><p class="sub" style="margin-top:6px">${esc(sc.sub)}</p>
<div class="plan"><span class="chip">Most popular</span><b style="font-size:14px;color:var(--mute);font-weight:600">One plan</b><div class="price"><b>${esc(big)}</b><span>${esc(per)}</span></div>
<div class="list">${sc.bullets.map((b) => `<div><span class="ck">${ICON.check}</span><span>${esc(b)}</span></div>`).join("")}</div>
<div class="btn" data-go="0">${esc(sc.cta)}</div><p class="note">Cancel any time · no card for the first week</p></div>
<div class="faq"><div class="row"><div><b>Can I cancel?</b><small>Yes, in one tap, any time.</small></div>${ICON.chevron}</div><div class="row"><div><b>Who is it for?</b><small>${esc(m.audience)}.</small></div>${ICON.chevron}</div></div></div>${tabs(2)}</section>`;
}

const JS = `<script>
(function(){var s=document.querySelectorAll('.screen');function go(i){s.forEach(function(el,k){el.classList.toggle('on',k===i)});try{window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(String(i))}catch(e){}try{window.parent&&window.parent!==window&&window.parent.postMessage({mock:i},'*')}catch(e){}}
document.addEventListener('click',function(e){var t=e.target.closest('[data-go]');if(t){go(Number(t.getAttribute('data-go')))}});
window.addEventListener('message',function(e){var d=e.data;if(d&&typeof d.go==='number')go(d.go)});
window.__go=go;})();
</script>`;

/** The whole app as one HTML document, opened on `screen`. */
export function mockupHtml(m: Mockup, opts?: { screen?: number; frame?: boolean }): string {
  const t = mockupTheme(m);
  const by = (k: MockScreen["kind"], fb: number) => m.screens.find((s) => s.kind === k) ?? m.screens[fb] ?? m.screens[0];
  const l = by("landing", 0), a = by("app", 1), p = by("pricing", 2);
  const start = opts?.screen ?? 0;
  const body = [landing(m, l), appScreen(m, a, p.price), pricing(m, p)].join("");
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(m.name)}</title><style>${CSS(t)}</style></head><body><div class="app">${status}${body}<div class="home-ind"></div></div>${JS}<script>window.__go(${start})</script></body></html>`;
}

/** The three screens side by side in device frames on one page, for the picture. */
export function mockupPoster(m: Mockup): string {
  const t = mockupTheme(m);
  const one = (i: number) => `<div class="dev"><iframe srcdoc="${esc(mockupHtml(m, { screen: i }))}" scrolling="no"></iframe></div>`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
:root{--h:${t.hue}}*{box-sizing:border-box;margin:0;padding:0}
body{background:linear-gradient(160deg,hsl(var(--h) 60% 97%),hsl(calc(var(--h) + 30) 50% 94%));font:14px -apple-system,BlinkMacSystemFont,Inter,"Segoe UI",Roboto,sans-serif;color:#0f172a;padding:28px 24px}
h1{font-size:24px;letter-spacing:-.5px;line-height:1.15;font-weight:800;margin:6px 0 4px}.k{font-size:12px;letter-spacing:1.4px;text-transform:uppercase;color:#64748b;font-weight:700}
.sub{color:#475569;font-size:14px}
.row{display:flex;gap:18px;justify-content:center;margin-top:22px;align-items:flex-start}
.dev{width:230px;height:470px;border-radius:36px;background:#0b0f19;padding:8px;box-shadow:0 30px 60px -24px rgba(15,23,42,.45),0 0 0 1px rgba(255,255,255,.4) inset;flex:none}
.dev iframe{display:block;width:390px;height:844px;border:0;border-radius:30px;background:#fff;transform:scale(0.5487);transform-origin:0 0;pointer-events:none}
.dev{overflow:hidden}
.foot{display:flex;justify-content:space-between;margin-top:18px;color:#94a3b8;font-size:11px}
body{width:800px;transform-origin:0 0}
</style></head><body><script>(function(){var s=Math.min(1,window.innerWidth/800);document.body.style.transform="scale("+s+")";document.documentElement.style.height=(640*s)+"px";document.body.style.height="640px"})()</script><div class="k">${esc(m.name)}</div><h1>${esc(m.oneLiner)}</h1><p class="sub">For ${esc(m.audience)}.</p>
<div class="row">${one(0)}${one(1)}${one(2)}</div>
<div class="foot"><span>${m.screens.map((s) => esc(s.title)).join(" · ")}</span><span>mocked up on FounderFloor</span></div></body></html>`;
}
