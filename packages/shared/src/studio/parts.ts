/**
 * The studio's parts: the components every generated app is built from.
 * Each is a function that returns HTML for one thing (a status bar, a
 * header, a row, a stat, a tab bar), styled through the CSS variables
 * the plan sets, so the same part looks like a different studio's work
 * under a different plan. Icons are drawn inline, one stroke width, in
 * currentColor. Pictures are drawn with gradients and shapes, never a
 * grey box with the word "image" in it.
 */

export const esc = (s: string): string => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Feather-style icon paths, 24 box, stroke 1.8. */
const ICONS: Record<string, string> = {
  home: '<path d="M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  card: '<rect x="2" y="6" width="20" height="13" rx="3"/><path d="M2 11h20M7 15.5h3"/>',
  chart: '<path d="M4 19h16M7 15V9M12 15V5M17 15v-4"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 21h4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0M16 4.5a3.5 3.5 0 0 1 0 7M22 20a7 7 0 0 0-5-6.7"/>',
  heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
  message: '<path d="M4 5h16v11H9l-5 4z"/>',
  pin: '<path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  star: '<path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.3l1.1-6.2L3 9.7l6.2-.9z"/>',
  shield: '<path d="M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6z"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  book: '<path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z"/>',
  cart: '<path d="M3 4h2l2.5 11h11L21 7H6.5"/><circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="8" cy="9" r="1.5"/>',
  filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
  send: '<path d="M21 3L10 14M21 3l-7 18-4-7-7-4z"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  more: '<circle cx="6" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="18" cy="12" r="1.2"/>',
  wallet: '<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M16 12.5h5"/><circle cx="16" cy="12.5" r="1"/>',
  receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6"/>',
  truck: '<path d="M2 7h11v9H2zM13 10h5l3 3v3h-8z"/><circle cx="6" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>',
  leaf: '<path d="M5 19C5 9 11 5 20 4c0 9-4 15-14 15zM5 19l7-7"/>',
  activity: '<path d="M3 12h4l3-7 4 14 3-7h4"/>',
  coffee: '<path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 10h2a2 2 0 0 1 0 4h-2M7 3v2M11 3v2"/>',
  wrench: '<path d="M14.5 4.5a5 5 0 0 0 5.8 6.6l-8.6 8.6a2.2 2.2 0 0 1-3.1-3.1l8.6-8.6a5 5 0 0 0-2.7-3.5z"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V4h6v3M3 12h18"/>',
  code: '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M14 4l-4 16"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 15A8 8 0 0 1 9 4a8 8 0 1 0 11 11z"/>',
  play: '<path d="M7 4l13 8-13 8z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h1M3 12h1M3 18h1"/>',
  dumbbell: '<path d="M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12"/>',
  flame: '<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-9z"/>',
  trend: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  key: '<circle cx="8" cy="14" r="4"/><path d="M11 11l9-9M15 7l3 3M12 10l3 3"/>',
  inbox: '<path d="M3 13l2-8h14l2 8v6H3zM3 13h5l1.5 3h5L16 13h5"/>',
  phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
  sparkle: '<path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>',
  minus: '<path d="M5 12h14"/>',
  upload: '<path d="M12 16V4M6 10l6-6 6 6M4 20h16"/>',
  download: '<path d="M12 4v12M6 10l6 6 6-6M4 20h16"/>',
  scan: '<path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4M4 12h16"/>',
  bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
  share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.6M8.2 13.2l7.6 4.6"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  dot: '<circle cx="12" cy="12" r="4"/>',
  refresh: '<path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5"/>',
  edit: '<path d="M4 20h4l11-11-4-4L4 16zM13 7l4 4"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6"/>',
  paw: '<circle cx="8" cy="7" r="2"/><circle cx="16" cy="7" r="2"/><circle cx="4.5" cy="12" r="2"/><circle cx="19.5" cy="12" r="2"/><path d="M12 12c-3 0-6 3-6 6a2 2 0 0 0 3 2c1-.5 2-1 3-1s2 .5 3 1a2 2 0 0 0 3-2c0-3-3-6-6-6z"/>',
  bed: '<path d="M3 18V8M3 12h18v6M3 15h18M7 12V9h6v3"/>',
  music: '<path d="M9 18V6l11-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  droplet: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  pill: '<rect x="3" y="8" width="18" height="8" rx="4" transform="rotate(-45 12 12)"/><path d="M8.5 15.5l7-7"/>',
  car: '<path d="M5 13l1.5-5h11L19 13M4 13h16v5H4zM7 18v2M17 18v2"/><circle cx="8" cy="15.5" r="1"/><circle cx="16" cy="15.5" r="1"/>',
  box: '<path d="M3 8l9-4 9 4v9l-9 4-9-4zM3 8l9 4 9-4M12 12v9"/>',
  file: '<path d="M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6M12 2v3"/>',
  shirt: '<path d="M8 4l4 2 4-2 4 3-2 3-2-1v11H8V9L6 10 4 7z"/>',
  scissors: '<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="M8 7.5L20 18M8 16.5L20 6"/>',
  tooth: '<path d="M8 3c2 0 3 1 4 1s2-1 4-1c3 0 4 3 4 6 0 4-2 6-2 10 0 1-1 2-2 2s-1-4-2-4h-4c-1 0-1 4-2 4s-2-1-2-2c0-4-2-6-2-10 0-3 1-6 4-6z"/>',
  cross: '<path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z"/>',
  ticket: '<path d="M3 8a2 2 0 0 0 0 4v0a2 2 0 0 1 0 4v2h18v-2a2 2 0 0 1 0-4v0a2 2 0 0 0 0-4V6H3zM12 6v12"/>',
  plane: '<path d="M2 14l8-2 4-8 2 1-2 7 7 3v2l-7-1-2 5-2 1 0-6z"/>',
  hammer: '<path d="M14 4l6 6-2 2-6-6zM12 6l-9 9a2 2 0 0 0 3 3l9-9"/>',
  bag: '<path d="M6 8h12l1 13H5zM9 8V6a3 3 0 0 1 6 0v2"/>',
  spark: '<path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/>',
};

/** One icon, in currentColor. */
export function ic(name: string, size = 22, cls = ""): string {
  const d = ICONS[name] ?? ICONS.dot;
  return `<svg class="ic${cls ? ` ${cls}` : ""}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
}

/** The status bar: the time, signal, wifi, battery, in the current colour. */
export function statusBar(): string {
  return `<div class="sb"><span>9:41</span><span class="sbr"><svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor"><rect x="0" y="7" width="3" height="4" rx=".6"/><rect x="4.5" y="5" width="3" height="6" rx=".6"/><rect x="9" y="2.5" width="3" height="8.5" rx=".6"/><rect x="13.5" y="0" width="3" height="11" rx=".6"/></svg><svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor"><path d="M8 9.2a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8zM8 5.6c1.6 0 3 .6 4.1 1.7l-1.4 1.4A3.9 3.9 0 0 0 8 7.6c-1 0-2 .4-2.7 1.1L3.9 7.3A5.8 5.8 0 0 1 8 5.6zM8 2c2.6 0 5 1 6.8 2.8l-1.4 1.4A7.6 7.6 0 0 0 8 4a7.6 7.6 0 0 0-5.4 2.2L1.2 4.8A9.6 9.6 0 0 1 8 2z"/></svg><svg width="25" height="12" viewBox="0 0 25 12" fill="none" stroke="currentColor"><rect x=".5" y=".5" width="21" height="11" rx="3"/><rect x="2" y="2" width="18" height="8" rx="1.8" fill="currentColor" stroke="none"/><path d="M23 4v4" stroke-width="1.5" stroke-linecap="round"/></svg></span></div>`;
}

export const homeBar = (): string => `<div class="hi"><i></i></div>`;

/** Initials from a name: "Maria K." → "MK", "Kafeneio" → "K". */
export function initials(name: string): string {
  const w = name.replace(/[^\p{L}\s]/gu, " ").trim().split(/\s+/).filter(Boolean);
  return (w.length >= 2 ? w[0][0] + w[1][0] : (w[0] ?? "?").slice(0, 1)).toUpperCase();
}

/** An initials avatar; the tint index picks one of the plan's four tints. */
export function avatar(name: string, size = 40, tint = 0): string {
  return `<span class="av t${tint % 4}" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.36)}px">${esc(initials(name))}</span>`;
}

/** The header: a title with an optional eyebrow, and left and right controls. */
export function header(opts: { title: string; eyebrow?: string; left?: string; right?: string; big?: boolean }): string {
  return `<div class="hdr${opts.big ? " big" : ""}">${opts.left ? `<div class="hl">${opts.left}</div>` : ""}<div class="ht">${opts.eyebrow ? `<div class="eyebrow">${esc(opts.eyebrow)}</div>` : ""}<div class="title">${esc(opts.title)}</div></div>${opts.right ? `<div class="hr">${opts.right}</div>` : '<div class="hr"></div>'}</div>`;
}

export const iconButton = (name: string, go?: number, cls = ""): string => `<span class="icb${cls ? ` ${cls}` : ""}"${go !== undefined ? ` data-go="${go}"` : ""}>${ic(name, 20)}</span>`;

/** A button: primary, secondary or quiet; optional icon and screen to go to. */
export function button(label: string, opts: { kind?: "p" | "s" | "q"; go?: number; icon?: string; full?: boolean; small?: boolean } = {}): string {
  const k = opts.kind ?? "p";
  return `<span class="btn ${k}${opts.full === false ? "" : " full"}${opts.small ? " sm" : ""}"${opts.go !== undefined ? ` data-go="${opts.go}"` : ""}>${esc(label)}${opts.icon ? ic(opts.icon, 18) : ""}</span>`;
}

/** A text field, drawn: label, placeholder, optional leading icon. */
export function field(label: string, placeholder: string, icon?: string): string {
  return `<label class="fld"><span class="fl">${esc(label)}</span><span class="fi">${icon ? ic(icon, 18) : ""}<span class="ph">${esc(placeholder)}</span></span></label>`;
}

/** A search field. */
export const search = (placeholder: string): string => `<div class="srch">${ic("search", 18)}<span>${esc(placeholder)}</span></div>`;

/** A list row: a leading mark, a title and a second line, and a trailing value, chevron or pill. */
export function row(opts: { lead?: string; title: string; meta?: string; trail?: string; go?: number; cls?: string }): string {
  return `<div class="row${opts.cls ? ` ${opts.cls}` : ""}"${opts.go !== undefined ? ` data-go="${opts.go}"` : ""}>${opts.lead ? `<div class="rl">${opts.lead}</div>` : ""}<div class="rt"><div class="rn">${esc(opts.title)}</div>${opts.meta ? `<div class="rm">${esc(opts.meta)}</div>` : ""}</div>${opts.trail !== undefined ? `<div class="rr">${opts.trail}</div>` : ""}</div>`;
}

export const pill = (label: string, tone: "brand" | "soft" | "ok" | "warn" | "line" = "soft"): string => `<span class="pl ${tone}">${esc(label)}</span>`;

/** A stat tile: a label, the number, and a line under it. */
export function stat(label: string, value: string, delta?: string, tone: "ok" | "warn" | "mute" = "ok"): string {
  return `<div class="stat"><div class="sl">${esc(label)}</div><div class="sv">${esc(value)}</div>${delta ? `<div class="sd ${tone}">${esc(delta)}</div>` : ""}</div>`;
}

/** A segmented control. */
export function segmented(items: string[], on = 0): string {
  return `<div class="seg">${items.map((t, i) => `<span${i === on ? ' class="on"' : ""}>${esc(t)}</span>`).join("")}</div>`;
}

/** Filter chips, the first selected. */
export function chips(items: string[], on = 0): string {
  return `<div class="chips">${items.map((t, i) => `<span class="chip${i === on ? " on" : ""}">${esc(t)}</span>`).join("")}</div>`;
}

/** A section title with an optional trailing link. */
export const section = (title: string, link?: string): string => `<div class="sec"><span>${esc(title)}</span>${link ? `<a>${esc(link)}</a>` : ""}</div>`;

/** A drawn picture: gradients and shapes in the plan's colours, in one of six manners. */
export function pic(manner: string, seed: number, cls = ""): string {
  const a = (seed * 37) % 100;
  const b = (seed * 53) % 100;
  const inner =
    manner === "blocks"
      ? `<i style="left:${10 + (a % 30)}%;top:${10 + (b % 25)}%;width:45%;height:55%;background:var(--p);opacity:.85"></i><i style="right:8%;bottom:10%;width:38%;height:42%;background:var(--a);opacity:.9"></i><i style="left:12%;bottom:8%;width:26%;height:22%;background:var(--s);opacity:.7"></i>`
      : manner === "rings"
        ? `<i style="left:${20 + (a % 30)}%;top:${15 + (b % 20)}%;width:70%;height:70%;border-radius:50%;border:14px solid var(--p);opacity:.35"></i><i style="left:${35 + (b % 20)}%;top:${30 + (a % 15)}%;width:40%;height:40%;border-radius:50%;background:var(--a);opacity:.85"></i>`
        : manner === "stripes"
          ? `<i style="inset:0;background:repeating-linear-gradient(${115 + (a % 50)}deg,var(--p) 0 18px,transparent 18px 36px);opacity:.28"></i><i style="left:55%;top:20%;width:60%;height:60%;border-radius:50%;background:var(--a);opacity:.85"></i>`
          : manner === "grid"
            ? `<i style="inset:0;background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px);background-size:22px 22px;opacity:.9"></i><i style="left:${15 + (a % 20)}%;top:${20 + (b % 20)}%;width:50%;height:36%;background:var(--p);border-radius:var(--rm)"></i><i style="right:12%;bottom:14%;width:30%;height:30%;background:var(--a);border-radius:50%"></i>`
            : manner === "photo"
              ? `<i style="inset:0;background:linear-gradient(${140 + (a % 60)}deg,var(--p) 0%,var(--s) 55%,var(--a) 100%);opacity:.9"></i><i style="left:${50 + (b % 25)}%;top:${10 + (a % 30)}%;width:36%;height:36%;border-radius:50%;background:rgba(255,255,255,.35)"></i><i style="left:-10%;bottom:-25%;width:80%;height:60%;border-radius:50%;background:rgba(0,0,0,.18)"></i>`
              : `<i style="left:${-10 + (a % 30)}%;top:${-20 + (b % 30)}%;width:80%;height:80%;border-radius:50%;background:var(--p);filter:blur(22px);opacity:.75"></i><i style="right:${-15 + (b % 25)}%;bottom:${-20 + (a % 25)}%;width:75%;height:75%;border-radius:50%;background:var(--a);filter:blur(24px);opacity:.75"></i><i style="left:30%;top:30%;width:45%;height:45%;border-radius:50%;background:var(--s);filter:blur(18px);opacity:.6"></i>`;
  return `<div class="pic ${manner}${cls ? ` ${cls}` : ""}">${inner}</div>`;
}

/** A tab bar with 3 to 5 items; the active one marked. */
export function tabBar(items: { icon: string; label: string; go?: number }[], on = 0): string {
  return `<div class="tab">${items.map((t, i) => `<a${i === on ? ' class="on"' : ""}${t.go !== undefined ? ` data-go="${t.go}"` : ""}>${ic(t.icon, 24)}<span>${esc(t.label)}</span></a>`).join("")}</div>`;
}

/** A line chart drawn from values, as an SVG with an area fill and an emphasised last point. */
export function lineChart(values: number[], w = 350, h = 110, label?: string): string {
  const max = Math.max(...values) * 1.15 || 1;
  const min = Math.min(...values) * 0.7;
  const pts = values.map((v, i) => [Math.round((i / (values.length - 1)) * (w - 8)) + 4, Math.round(h - 6 - ((v - min) / (max - min)) * (h - 18))]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0]} ${p[1]}`).join(" ");
  const last = pts[pts.length - 1];
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" width="100%" height="${h}" preserveAspectRatio="none"><defs><linearGradient id="g${w}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--p)" stop-opacity=".28"/><stop offset="1" stop-color="var(--p)" stop-opacity="0"/></linearGradient></defs>${[0.25, 0.5, 0.75].map((f) => `<line x1="0" x2="${w}" y1="${Math.round(h * f)}" y2="${Math.round(h * f)}" stroke="var(--line)" stroke-width="1"/>`).join("")}<path d="${d} L${last[0]} ${h} L4 ${h} Z" fill="url(#g${w})"/><path d="${d}" fill="none" stroke="var(--p)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${last[0]}" cy="${last[1]}" r="5" fill="var(--p)" stroke="var(--card)" stroke-width="2"/>${label ? `<text x="${Math.min(last[0], w - 4)}" y="${Math.max(12, last[1] - 12)}" text-anchor="end" font-size="12" font-weight="700" fill="var(--fg)" font-family="inherit">${esc(label)}</text>` : ""}</svg>`;
}

/** Bars for seven days, the last emphasised. */
export function bars(values: number[], labels: string[]): string {
  const max = Math.max(...values) || 1;
  return `<div class="bars">${values.map((v, i) => `<div class="bar"><i style="height:${Math.max(6, Math.round((v / max) * 100))}%"${i === values.length - 1 ? ' class="on"' : ""}></i><span>${esc(labels[i] ?? "")}</span></div>`).join("")}</div>`;
}

/** A progress ring with a number in it. */
export function ring(pct: number, label: string, size = 120): string {
  const r = (size - 14) / 2;
  const c = 2 * Math.PI * r;
  return `<div class="ring" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="var(--line)" stroke-width="10" fill="none"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="var(--p)" stroke-width="10" fill="none" stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${(c * (1 - pct / 100)).toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg><div class="rc"><b>${Math.round(pct)}%</b><span>${esc(label)}</span></div></div>`;
}

/** A progress bar. */
export const progress = (pct: number): string => `<div class="prog"><i style="width:${Math.max(2, Math.min(100, pct))}%"></i></div>`;

/** A quote from a customer, with their name. */
export function quote(who: string, said: string, tint = 0): string {
  return `<div class="quote">${avatar(who, 36, tint)}<div><p>“${esc(said)}”</p><small>${esc(who)}</small></div></div>`;
}

/** A feature line: an icon in a tile, a title, and a line. */
export function feature(icon: string, title: string, line: string): string {
  return `<div class="feat"><span class="ft">${ic(icon, 20)}</span><div><b>${esc(title)}</b>${line ? `<span>${esc(line)}</span>` : ""}</div></div>`;
}

/** A checked line on a price screen. */
export const included = (text: string): string => `<div class="inc">${ic("check", 20)}<span>${esc(text)}</span></div>`;

/** A drawn map: a grid of streets with a route and pins. */
export function map(seed: number, h = 220, extra = ""): string {
  const a = seed % 40;
  return `<div class="map" style="height:${h}px;${extra}"><i class="st h" style="top:28%"></i><i class="st h" style="top:62%"></i><i class="st v" style="left:${22 + a}%"></i><i class="st v" style="left:${60 + (a % 20)}%"></i><i class="st v thin" style="left:${40 + (a % 10)}%"></i><i class="st h thin" style="top:45%"></i><svg class="route" viewBox="0 0 390 ${h}" preserveAspectRatio="none"><path d="M40 ${h * 0.8} L ${100 + a} ${h * 0.8} L ${100 + a} ${h * 0.3} L ${250 + a} ${h * 0.3} L ${250 + a} ${h * 0.55} L 340 ${h * 0.55}" fill="none" stroke="var(--p)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 0"/></svg><span class="pin a" style="left:32px;top:${h * 0.8 - 30}px">${ic("pin", 30)}</span><span class="pin b" style="left:${325}px;top:${h * 0.55 - 30}px">${ic("pin", 30)}</span></div>`;
}

/** Punches, seats, dots: n of total filled. */
export function dots(n: number, total: number): string {
  return `<div class="dots">${Array.from({ length: total }, (_, i) => `<i${i < n ? ' class="on"' : ""}></i>`).join("")}</div>`;
}

// ─── the parts the category leaders taught ───────────────────────────────

/** A balance card (Revolut, Stripe): the big number on the primary, the account line, a masked number. */
export function balanceCard(label: string, value: string, line: string, tail = "•••• 4321"): string {
  return `<div class="bal"><div class="bl">${esc(label)}</div><div class="bv">${esc(value)}</div><div class="bf"><span>${esc(line)}</span><span class="mono">${esc(tail)}</span></div></div>`;
}

/** A row of round quick actions (Revolut, banking apps): four at most. */
export function quickActions(items: { icon: string; label: string; go?: number }[]): string {
  return `<div class="qa">${items.slice(0, 4).map((x) => `<span class="q"${x.go !== undefined ? ` data-go="${x.go}"` : ""}><i>${ic(x.icon, 22)}</i><b>${esc(x.label)}</b></span>`).join("")}</div>`;
}

/** A group header with a day and a total (transactions grouped by day). */
export const dayHeader = (day: string, total?: string): string => `<div class="dayh"><span>${esc(day)}</span>${total ? `<span class="mono">${esc(total)}</span>` : ""}</div>`;

/** A row of people with a ring (stories): the first is "you". */
export function stories(names: string[]): string {
  return `<div class="stories">${names.slice(0, 6).map((n, i) => `<span class="st${i === 0 ? " you" : ""}"><span class="ring-av">${avatar(n, 52, i)}</span><b>${esc(i === 0 ? "You" : n.split(" ")[0])}</b></span>`).join("")}</div>`;
}

/** Category icons with labels under them (Airbnb), the first active. */
export function categoryRow(items: { icon: string; label: string }[], on = 0): string {
  return `<div class="cats">${items.map((x, i) => `<span class="cat${i === on ? " on" : ""}">${ic(x.icon, 24)}<b>${esc(x.label)}</b></span>`).join("")}</div>`;
}

/** Stars with a number (Airbnb, stores). */
export const rating = (value: string, count?: string): string => `<span class="rate">${ic("star", 14)}<b>${esc(value)}</b>${count ? `<span>(${esc(count)})</span>` : ""}</span>`;

/** A learning path (Duolingo): nodes down a winding line; done, current and locked. */
export function lessonPath(items: { title: string; state: "done" | "now" | "next" | "locked" }[], go?: number): string {
  const offs = [0, 48, 72, 48, 0, -48, -72, -48];
  return `<div class="path">${items.map((x, i) => `<div class="node ${x.state}" style="margin-left:${72 + offs[i % offs.length]}px"${go !== undefined && x.state !== "locked" ? ` data-go="${go}"` : ""}><i>${x.state === "done" ? ic("check", 22) : x.state === "locked" ? ic("lock", 20) : x.state === "now" ? ic("star", 22) : ic("book", 20)}</i><b>${esc(x.title)}</b></div>`).join("")}</div>`;
}

/** A unit banner over the path (Duolingo), with a streak and a score. */
export function unitBanner(eyebrow: string, title: string, streak: number, points: string): string {
  return `<div class="unit"><div><div class="eyebrow">${esc(eyebrow)}</div><b>${esc(title)}</b></div><div class="ustats"><span>${ic("flame", 18)}${streak}</span><span>${ic("bolt", 18)}${esc(points)}</span></div></div>`;
}

/** An agenda (calendar apps): a time gutter and blocks with a colour and a duration. */
export function agenda(items: { time: string; title: string; meta: string; tone: number; span?: number; go?: number }[]): string {
  return `<div class="agenda">${items.map((x) => `<div class="slot"><span class="tm">${esc(x.time)}</span><div class="blk t${x.tone % 4}" style="min-height:${(x.span ?? 1) * 56}px"${x.go !== undefined ? ` data-go="${x.go}"` : ""}><b>${esc(x.title)}</b><span>${esc(x.meta)}</span></div></div>`).join("")}</div>`;
}

/** A bottom sheet sitting over a map (Uber): a handle, then whatever is inside. */
export const sheet = (inner: string): string => `<div class="sheet"><i class="handle"></i>${inner}</div>`;

/** A ride or delivery option (Uber): a mark, a name and an ETA, and the price. */
export function option(icon: string, title: string, meta: string, price: string, on = false, go?: number): string {
  return `<div class="opt${on ? " on" : ""}"${go !== undefined ? ` data-go="${go}"` : ""}><span class="av t${on ? 0 : 3}" style="width:44px;height:44px">${ic(icon, 22)}</span><div class="rt"><div class="rn">${esc(title)}</div><div class="rm">${esc(meta)}</div></div><b class="mono">${esc(price)}</b></div>`;
}

/** A promo banner (stores): a picture, a line, a button. */
export function promo(manner: string, seed: number, eyebrow: string, title: string, cta: string, go?: number): string {
  return `<div class="promo"${go !== undefined ? ` data-go="${go}"` : ""}>${pic(manner, seed, "promo-pic")}<div class="promo-t"><div class="eyebrow">${esc(eyebrow)}</div><b>${esc(title)}</b><span class="btn p sm" style="width:auto;display:inline-flex;margin-top:10px">${esc(cta)}</span></div></div>`;
}

/** A product tile with a round add button and a rating (stores). */
export function productTile(manner: string, seed: number, title: string, meta: string, price: string, stars: string, go?: number): string {
  return `<div class="tile prod"${go !== undefined ? ` data-go="${go}"` : ""}>${pic(manner, seed, "tile")}<span class="add">${ic("plus", 18)}</span><b>${esc(title)}</b><span>${esc(meta)}</span><div class="spread mt8"><span class="price">${esc(price)}</span>${rating(stars)}</div></div>`;
}

/** A sticky bar with a count and a total and one action (stores). */
export const cartBar = (count: string, total: string, label: string, go?: number): string => `<div class="cartbar"${go !== undefined ? ` data-go="${go}"` : ""}><span class="cnt">${esc(count)}</span><span class="tot">${esc(total)}</span><b>${esc(label)}${ic("arrow", 18)}</b></div>`;

/** A quantity stepper. */
export const stepper = (n: number): string => `<div class="stepper"><span>${ic("minus", 16)}</span><b>${n}</b><span>${ic("plus", 16)}</span></div>`;

/** Three rings side by side (Apple Fitness) or one big one with two numbers (Strava). */
export function ringTrio(rings: { pct: number; label: string }[]): string {
  return `<div class="rings">${rings.map((r, i) => `<div class="rg r${i}">${ring(r.pct, r.label, 92).replace('class="ring"', `class="ring c${i}"`)}</div>`).join("")}</div>`;
}

/** A stat trio in a row (Strava): three numbers with labels, tabular. */
export const statTrio = (items: { value: string; label: string }[]): string => `<div class="trio">${items.map((x) => `<div><b>${esc(x.value)}</b><span>${esc(x.label)}</span></div>`).join("")}</div>`;

/** A sparkline: a thin line in a stat tile. */
export function sparkline(values: number[], w = 120, h = 32): string {
  const max = Math.max(...values) || 1, min = Math.min(...values);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - 3 - ((v - min) / (max - min || 1)) * (h - 6)}`);
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><polyline points="${pts.join(" ")}" fill="none" stroke="var(--p)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${pts[pts.length - 1].split(",")[0]}" cy="${pts[pts.length - 1].split(",")[1]}" r="4" fill="var(--p)" stroke="var(--card)" stroke-width="2"/></svg>`;
}

/** A stat tile with a sparkline (Linear, Vercel, Stripe). */
export function statSpark(label: string, value: string, delta: string, values: number[], tone: "ok" | "warn" | "mute" = "ok"): string {
  return `<div class="stat"><div class="sl">${esc(label)}</div><div class="sv">${esc(value)}</div><div class="spread"><span class="sd ${tone}">${esc(delta)}</span>${sparkline(values, 88, 26)}</div></div>`;
}

/** An unread count. */
export const unread = (n: number): string => `<span class="unread">${n}</span>`;

/** Read ticks, a status dot: small marks that say a state without colour alone. */
export const ticks = (read: boolean): string => `<span class="ticks${read ? " read" : ""}">${ic("check", 14)}${ic("check", 14)}</span>`;
export const statusDot = (tone: "ok" | "warn" | "mute", label: string): string => `<span class="sdot ${tone}"><i></i>${esc(label)}</span>`;

/** A step timeline (orders, rides): done, current, next. */
export function timeline(steps: { title: string; meta: string; state: "done" | "now" | "next" }[]): string {
  return `<div class="tl">${steps.map((s) => `<div class="tls ${s.state}"><i>${s.state === "done" ? ic("check", 12) : ""}</i><div><b>${esc(s.title)}</b><span>${esc(s.meta)}</span></div></div>`).join("")}</div>`;
}
