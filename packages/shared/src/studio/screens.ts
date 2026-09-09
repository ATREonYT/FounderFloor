/**
 * The screens: what each archetype's main screen and detail screen show,
 * the eight front doors, the sign-in step and the price, assembled from
 * the parts with the founder's own content (the sign, the audience, the
 * customers' names and words, the price said out loud) and fixtures
 * that read as a product in use rather than a wireframe.
 */
import type { StudioPlan } from "./plan.ts";
import { detailTitle } from "./nouns.ts";
import { avatar, bars, button, chips, dots, esc, feature, field, header, homeBar, ic, iconButton, included, lineChart, map, pic, pill, progress, quote, ring, row, search, section, segmented, stat, statusBar, tabBar } from "./parts.ts";

export interface Money {
  text: string;
  sym: string;
  n: number;
  per: string;
}

export interface Content {
  name: string;
  sign: string;
  audience: string;
  cta: string;
  sub: string;
  bullets: string[];
  activity: string[];
  stat?: { label: string; value: string };
  price: Money | null;
  pricing: { headline: string; sub: string; cta: string; bullets: string[] };
  quotes: { who: string; said: string }[];
  people: string[];
  thing: string;
  unit: string;
  places: string[];
  seed: number;
}

/** Where each screen sits, so every tap goes to the right one. */
export interface Nav {
  landing: number;
  signin?: number;
  main: number;
  detail: number;
  price: number;
}

export interface Screen {
  title: string;
  html: string;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DATES = ["Today, 08:12", "Today, 10:40", "Yesterday", "Mon", "Sun", "Fri", "Thu", "Last week"];
const ADJ = ["Quiet", "Bright", "Corner", "Small", "Large", "New", "Popular", "Nearby", "Sunny", "Late-night"];

export const money = (m: Money | null, k = 1, per = false): string => (m ? `${m.sym}${Math.round(m.n * k)}${per && m.per ? ` ${m.per}` : ""}` : `€${Math.round(40 * k)}`);
const cap = (s: string): string => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
/** "pass" → "passes", "entry" → "entries", "room" → "rooms". */
export const plural = (w: string): string => (/(s|x|z|ch|sh)$/.test(w) ? `${w}es` : /[^aeiou]y$/.test(w) ? `${w.slice(0, -1)}ies` : `${w}s`);
const unquoted = (s: string): boolean => !/^["“]/.test(s.trim());
const person = (c: Content, i: number): string => c.people[i % c.people.length];
const place = (c: Content, i: number): string => c.places[i % c.places.length];
/** "Quiet room", "Bright room", "Corner room": the founder's own adjective first, then others, on the unit's noun. */
const item = (c: Content, i: number): string => {
  const w = c.unit.split(" ");
  const noun = w[w.length - 1];
  if (w.length > 1 && i === 0) return cap(c.unit);
  return `${ADJ[(i + c.seed) % ADJ.length]} ${noun}`;
};
const line = (c: Content, i: number): string => {
  const pool = [...c.quotes.map((q) => q.said), ...c.activity, ...c.bullets];
  return pool[i % pool.length] ?? c.sign;
};
/** What a member would write: the customers' words first, then lines about the thing itself. */
const postLine = (c: Content, i: number): string => {
  const pool = [...c.quotes.map((q) => q.said), `Working on ${c.thing.toLowerCase()} this week. Anyone tried it?`, `Looking for feedback on my ${c.unit} before Friday.`, `First ${c.unit} done. It took a week longer than I thought.`, `Who else is in ${c.places[i % c.places.length].toLowerCase()}? Coffee on Thursday?`, `Is ${money(c.price)} ${c.price?.per ?? ""} too much to ask? Honest answers.`];
  return pool[i % pool.length];
};

/** A screen's frame: the status bar, the header, tabs where the treatment puts them, the body, and the bottom. */
function frame(p: StudioPlan, o: { head?: string; body: string; tabs?: { icon: string; label: string; go?: number }[]; on?: number; fab?: string; flush?: boolean; dark?: boolean }): string {
  const nav = p.treatment.nav;
  const top = o.tabs && nav === "top" ? tabBar(o.tabs, o.on ?? 0).replace('class="tab"', 'class="tab top"') : "";
  const bottom = o.tabs ? (nav === "pill" ? tabBar(o.tabs, o.on ?? 0).replace('class="tab"', 'class="tab pillbar"') + homeBar() : nav === "top" ? homeBar() : tabBar(o.tabs, o.on ?? 0)) : homeBar();
  return `${statusBar()}${o.head ?? ""}${top}<div class="body${o.flush ? " flush" : ""}">${o.body}<div class="tail${o.fab ? " fab" : ""}"></div></div>${o.fab ?? ""}${bottom}`;
}

const TABS: Record<StudioPlan["archetype"], { icon: string; label: string }[]> = {
  ledger: [{ icon: "home", label: "Today" }, { icon: "wallet", label: "Money" }, { icon: "users", label: "Clients" }, { icon: "settings", label: "Settings" }],
  feed: [{ icon: "home", label: "Home" }, { icon: "compass", label: "Discover" }, { icon: "message", label: "Inbox" }, { icon: "user", label: "You" }],
  listings: [{ icon: "search", label: "Explore" }, { icon: "heart", label: "Saved" }, { icon: "message", label: "Messages" }, { icon: "user", label: "You" }],
  bookings: [{ icon: "calendar", label: "Today" }, { icon: "users", label: "Clients" }, { icon: "wallet", label: "Money" }, { icon: "settings", label: "Settings" }],
  tracker: [{ icon: "home", label: "Today" }, { icon: "trend", label: "Progress" }, { icon: "bell", label: "Reminders" }, { icon: "user", label: "You" }],
  learn: [{ icon: "book", label: "Learn" }, { icon: "bolt", label: "Practice" }, { icon: "trend", label: "Progress" }, { icon: "user", label: "You" }],
  inbox: [{ icon: "message", label: "Chats" }, { icon: "users", label: "People" }, { icon: "search", label: "Search" }, { icon: "settings", label: "Settings" }],
  map: [{ icon: "pin", label: "Map" }, { icon: "clock", label: "Trips" }, { icon: "wallet", label: "Wallet" }, { icon: "user", label: "You" }],
  dashboard: [{ icon: "grid", label: "Overview" }, { icon: "activity", label: "Activity" }, { icon: "bell", label: "Alerts" }, { icon: "settings", label: "Settings" }],
  store: [{ icon: "bag", label: "Shop" }, { icon: "search", label: "Search" }, { icon: "cart", label: "Cart" }, { icon: "receipt", label: "Orders" }],
};

const mark = (c: Content): string => `<div class="mark"><i>${esc(c.name.charAt(0).toUpperCase())}</i>${esc(c.name)}</div>`;

// ─── the front door ─────────────────────────────────────────────────────
export function landing(c: Content, p: StudioPlan, n: Nav): Screen {
  const h = p.treatment.hero;
  const go = n.signin ?? n.main;
  const trustLine = c.bullets.find((b) => /free|no card|cancel|this week/i.test(b) && !/^what you get/i.test(b)) ?? "The first week is free. No card until you decide.";
  const email = `<div class="gap8 mt16">${field("Your email", "you@example.com", "mail")}${button(c.cta, { go, icon: "arrow" })}</div><p class="small muted mt8">${esc(cap(trustLine.replace(/^"|"$/g, "")))}</p>`;
  const proof = c.quotes.length ? `<div class="gap12 mt16">${c.quotes.slice(0, 2).map((q, i) => quote(q.who, q.said, i)).join("")}</div>` : "";
  const priceLine = `<div class="card spread mt16" data-go="${n.price}"><div><div style="font:700 22px/1 var(--fh)">${esc(c.price ? `${money(c.price)} ${c.price.per}`.trim() : c.pricing.headline)}</div><div class="small muted mt8">${esc(c.pricing.sub)}</div></div><span class="strong" style="color:var(--p);font-size:14px">See the price ${ic("chevron", 16)}</span></div>`;
  const plain = c.bullets.filter(unquoted).map((b) => b.replace(/^what you get:\s*/i, ""));
  const featureLines = [plain[0] ?? c.thing, plain[1] ?? `For ${c.audience}`, plain[2] ?? (c.price ? `${money(c.price)} ${c.price.per}, cancel any time`.replace(/\s+,/, ",") : "One price, said plainly")];
  const features = `<div class="mt8">${featureLines.map((b, i) => feature(["bolt", "users", "shield"][i], cap(b), "")).join("")}</div>`;
  const faces = `<div class="faces">${c.people.slice(0, 4).map((x, i) => avatar(x, 28, i)).join("")}<span>Used by ${esc(c.audience)}</span></div>`;
  let top = "";
  let below = "";
  const heroInner = (extra = "") => `${mark(c)}<h1>${esc(c.sign)}</h1><p class="sub mt12">For ${esc(c.audience)}.</p>${extra}`;
  switch (p.landing) {
    case "minimal":
      top = `<div class="hero type">${heroInner(`${button(c.cta, { go, icon: "arrow" })}`)}</div>`;
      below = `<p class="muted" style="font-size:15px">${esc(c.bullets[0] ?? c.thing)}</p>${c.quotes[0] ? `<div class="mt16">${quote(c.quotes[0].who, c.quotes[0].said, 0)}</div>` : faces}${priceLine}`;
      break;
    case "proof":
      top = `<div class="hero ${h === "card" ? "mesh" : h}">${h === "card" ? heroInner() : heroInner()}</div>`;
      below = `${proof || `<div class="card">${feature("users", `For ${c.audience}`, c.bullets[0] ?? "")}</div>`}${faces}<div class="mt16">${button(c.cta, { go, icon: "arrow" })}</div>${priceLine}`;
      break;
    case "trust":
      top = `<div class="hero ${h}">${h === "card" ? `<div class="in">${heroInner(email)}</div>` : heroInner(email)}</div>`;
      below = `<div class="badges"><span>${ic("shield", 16)}Cancel any time</span><span>${ic("lock", 16)}Your data stays yours</span><span>${ic("user", 16)}A person answers</span></div>${features}${proof}${priceLine}`;
      break;
    case "story":
      top = `<div class="hero ${h === "block" || h === "dark" ? h : "mesh"}">${heroInner()}</div>`;
      below = `${pic(p.treatment.pic, c.seed, "hero")}<div class="steps">${[c.bullets[0] ?? `Say what you need: ${c.thing}`, c.activity[0] ?? `${person(c, 0)} answers the same day`, c.bullets[1] ?? `Pay ${money(c.price)} ${c.price?.per ?? ""}`.trim()].map((s, i) => `<div class="step"><i>${i + 1}</i><div><b>${esc(cap(s.replace(/^"|"$/g, "")))}</b></div></div>`).join("")}</div><div class="mt24">${button(c.cta, { go, icon: "arrow" })}</div>${proof}${priceLine}`;
      break;
    case "demo":
      top = `<div class="hero ${h}">${h === "card" ? `<div class="in">${heroInner()}</div>` : heroInner()}</div>`;
      below = `<div class="demo">${demoCard(c, p)}</div><div class="mt16">${email}</div>${proof}${priceLine}`;
      break;
    case "search":
      top = `<div class="hero ${h === "type" ? "mesh" : h}">${heroInner(`<div class="mt16">${search(`Find a ${c.unit}`)}</div>`)}</div>`;
      below = `${chips(["All", ...c.places.slice(0, 3)])}${section("Near you", "See all")}<div class="tiles">${[0, 1].map((i) => tile(c, p, i, n.detail)).join("")}</div>${faces}<div class="mt16">${button(c.cta, { go, icon: "arrow" })}</div>${priceLine}`;
      break;
    case "features":
      top = `<div class="hero ${h}">${h === "card" ? `<div class="in">${heroInner(email)}</div>` : heroInner(email)}</div>`;
      below = `<div class="demo">${demoCard(c, p)}</div>${section("What you get")}${features}${proof}${priceLine}`;
      break;
    default:
      top = `<div class="hero ${h}">${h === "card" ? `<div class="in">${heroInner(email)}</div>` : heroInner(email)}</div>`;
      below = `${features}${proof || faces}${priceLine}`;
  }
  return { title: "The front door", html: `${statusBar()}${top}<div class="body" style="padding-top:18px">${below}<div class="tail"></div></div>${homeBar()}` };
}

/** A card that shows the product working, for a front door that demonstrates. */
function demoCard(c: Content, p: StudioPlan): string {
  switch (p.archetype) {
    case "ledger":
    case "dashboard":
      return `<div class="card"><div class="eyebrow">${esc(cap(c.stat?.label ?? "This week"))}</div><div style="font:700 34px/1 var(--fh);margin:6px 0 4px">${esc(c.stat?.value ?? "12")}</div>${lineChart([4, 6, 5, 8, 7, 10, 12], 310, 80)}</div>`;
    case "bookings":
      return `<div class="card tight">${row({ lead: avatar(person(c, 0), 40, 0), title: person(c, 0), meta: `${cap(c.unit)} · today, 10:30`, trail: pill("Confirmed", "ok") })}${row({ lead: avatar(person(c, 1), 40, 1), title: person(c, 1), meta: `${cap(c.unit)} · today, 12:00`, trail: pill("New", "brand") })}</div>`;
    case "listings":
    case "store":
      return `<div class="tiles">${[0, 1].map((i) => tile(c, p, i)).join("")}</div>`;
    case "tracker":
      return `<div class="card spread">${ring(64, "today", 96)}<div><b style="font:700 18px var(--fh)">${esc(cap(c.unit))}</b><div class="small muted">Day 12 in a row</div></div></div>`;
    case "inbox":
      return `<div class="card tight">${row({ lead: avatar(person(c, 0), 40, 0), title: person(c, 0), meta: line(c, 0), trail: pill("2", "brand") })}${row({ lead: avatar(person(c, 1), 40, 1), title: person(c, 1), meta: line(c, 1), trail: `<span class="small muted">10:40</span>` })}</div>`;
    case "map":
      return map(c.seed, 150);
    case "learn":
      return `<div class="card"><div class="spread"><b>${esc(cap(c.unit))} · lesson 3</b><span class="small muted">12 min</span></div><div class="mt12">${progress(58)}</div></div>`;
    default:
      return `<div class="card">${post(c, 0)}</div>`;
  }
}

function tile(c: Content, p: StudioPlan, i: number, go?: number): string {
  return `<div class="tile"${go !== undefined ? ` data-go="${go}"` : ""}>${pic(p.treatment.pic, c.seed + i * 7, "tile")}<b>${esc(item(c, i))}</b><span>${esc(place(c, i))}</span><span class="price">${money(c.price, [1, 1.5, 0.75, 2, 1.25, 0.5][i % 6])}${p.archetype === "listings" && c.price?.per ? ` <span class="small muted" style="display:inline">${esc(c.price.per)}</span>` : ""}</span></div>`;
}

function post(c: Content, i: number): string {
  const who = person(c, i);
  return `<div class="post"><div class="ph">${avatar(who, 36, i)}<div><b>${esc(who)}</b><span>${esc(DATES[i % DATES.length])}</span></div></div><p>${esc(cap(postLine(c, i).replace(/^"|"$/g, "")))}</p><div class="acts"><span>${ic("heart", 16)}${12 + ((i * 7 + c.seed) % 40)}</span><span>${ic("message", 16)}${1 + ((i * 3) % 9)}</span><span>${ic("share", 16)}</span></div></div>`;
}

// ─── sign-in ────────────────────────────────────────────────────────────
export function signIn(c: Content, p: StudioPlan, n: Nav): Screen {
  const body = `<div style="padding-top:26px">${mark(c)}<h2>Sign in with your email</h2><p class="sub mt8">A link arrives in your inbox. No passwords.</p><div class="gap12 mt24">${field("Your email", "you@example.com", "mail")}${button("Send me the link", { go: n.main, icon: "send" })}</div><p class="small muted mt16 center">By signing in you agree to the terms. ${esc(c.name)} keeps only what it needs.</p></div>`;
  return { title: "Sign in", html: `${statusBar()}${header({ title: "", left: iconButton("back", n.landing) })}<div class="body">${body}</div>${homeBar()}` };
}

// ─── the main screen ─────────────────────────────────────────────────────
export function main(c: Content, p: StudioPlan, n: Nav): Screen {
  const tabs = TABS[p.archetype].map((t, i) => ({ ...t, go: i === 0 ? n.main : undefined }));
  const you = avatar(c.people[c.people.length - 1], 40, 2);
  const g = (i: number, extra?: Partial<Parameters<typeof row>[0]>) => row({ go: n.detail, ...extra, title: extra?.title ?? person(c, i) });
  switch (p.archetype) {
    case "ledger": {
      const rows = [0, 1, 2, 3, 4, 5, 6].map((i) => g(i, { lead: avatar(person(c, i), 40, i), meta: `${cap(c.unit)} #${1040 + i} · ${DATES[i]}`, trail: `<span>${money(c.price, [1, 2.5, 1, 4, 0.5, 3, 1.5][i])}</span>${i % 3 === 1 ? pill("Due", "warn") : pill("Paid", "ok")}` })).join("");
      const body = `<div class="stats">${stat(cap(c.stat?.label ?? "Paid this week"), c.stat ? c.stat.value : money(c.price, 7), "+18% vs last week")}${stat("Outstanding", money(c.price, 4), `2 ${plural(c.unit)} due`, "warn")}</div><div class="mt16">${segmented(["All", "Paid", "Due"])}</div>${rows}`;
      return { title: "Today", html: frame(p, { head: header({ title: "Today", eyebrow: "Tuesday 9 September", right: you, big: true }), body, tabs, fab: `<div class="fab" data-go="${n.detail}">${ic("plus", 20)}New ${esc(c.unit)}</div>` }) };
    }
    case "feed": {
      const composer = `<div class="card tight" style="display:flex;gap:10px;align-items:center;margin-bottom:6px">${you}<span class="muted" style="flex:1">What are you working on?</span>${ic("camera", 20)}</div>`;
      const body = `${composer}${[0, 1, 2, 3, 4].map((i) => `<div data-go="${n.detail}">${post(c, i)}</div>`).join("")}`;
      return { title: "Home", html: frame(p, { head: header({ title: c.name, right: `${iconButton("bell")}` , big: true }), body, tabs, fab: `<div class="fab" data-go="${n.detail}">${ic("plus", 20)}Post</div>` }) };
    }
    case "listings": {
      const body = `${search(`Find a ${c.unit} near you`)}${chips(["All", ...c.places.slice(0, 4)])}${section("Near you", "Map")}<div class="tiles">${[0, 1, 2, 3, 4, 5].map((i) => tile(c, p, i, n.detail)).join("")}</div>`;
      return { title: "Explore", html: frame(p, { head: header({ title: `${cap(plural(c.unit))} near you`, eyebrow: place(c, 0), right: iconButton("filter"), big: false }), body, tabs }) };
    }
    case "bookings": {
      const days = `<div class="day">${DAYS.map((d, i) => `<span${i === 1 ? ' class="on"' : ""}>${d}<b>${8 + i}</b></span>`).join("")}</div>`;
      const times = ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00"];
      const rows = [0, 1, 2, 3, 4, 5].map((i) => g(i, { lead: `<span class="strong" style="width:48px;font-variant-numeric:tabular-nums">${times[i]}</span>`, meta: `${cap(c.unit)} · ${place(c, i)}`, trail: i === 0 ? pill("Now", "brand") : i === 3 ? pill("New", "soft") : ic("chevron", 18) })).join("");
      const body = `${days}<div class="stats">${stat("Booked today", "6", "2 free slots left")}${stat("This week", money(c.price, 14), "+3 bookings")}</div>${section("Today")}${rows}`;
      return { title: "Today", html: frame(p, { head: header({ title: "Tuesday", eyebrow: "9 September", right: you, big: true }), body, tabs, fab: `<div class="fab" data-go="${n.detail}">${ic("plus", 20)}New booking</div>` }) };
    }
    case "tracker": {
      const items = [`Morning ${c.unit}`, `Ten-minute ${c.unit}`, `Log today's ${c.unit}`, "Evening check-in"].map((t, i) => row({ lead: `<span class="av ${i < 2 ? "t0" : "t3"}" style="width:32px;height:32px">${i < 2 ? ic("check", 16) : ""}</span>`, title: cap(String(t).replace(/^"|"$/g, "")), meta: i < 2 ? "Done" : "Not yet", trail: ic("chevron", 18), go: n.detail })).join("");
      const body = `<div class="card spread">${ring(64, "today", 110)}<div style="flex:1;padding-left:16px"><div style="font:700 22px/1.1 var(--fh)">Day 12</div><div class="small muted mt8">in a row</div><div class="mt12">${pill("Best streak: 19", "soft")}</div></div></div>${section("Today")}${items}${section("This week")}<div class="card">${bars([3, 5, 4, 6, 5, 7, 6], DAYS)}</div>`;
      return { title: "Today", html: frame(p, { head: header({ title: `Hello, ${person(c, c.people.length - 1).split(" ")[0]}`, eyebrow: "Tuesday 9 September", right: iconButton("bell"), big: true }), body, tabs }) };
    }
    case "learn": {
      const names = [`What a ${c.unit} is`, `Your first ${c.unit}`, `${cap(c.thing)}: the basics`, `Practice: ${c.unit} two`, `Check what you learned`];
      const lessons = [0, 1, 2, 3, 4].map((i) => row({ lead: `<span class="av ${i < 2 ? "t0" : "t2"}" style="width:40px;height:40px">${ic(i < 2 ? "check" : "play", 18)}</span>`, title: `${i + 1}. ${names[i]}`, meta: i < 2 ? "Done" : `${8 + i * 3} min`, trail: ic("chevron", 18), go: n.detail })).join("");
      const body = `<div class="card" data-go="${n.detail}"><div class="eyebrow">Continue</div><div class="spread mt8"><b style="font:700 18px var(--fh)">${esc(cap(c.unit))} · lesson 3</b><span class="small muted">12 min</span></div><div class="mt12">${progress(58)}</div></div><div class="stats mt12">${stat("Streak", "12 days", "Keep it")}${stat("This week", "4 lessons", "of 5")}</div>${section("Up next")}${lessons}`;
      return { title: "Learn", html: frame(p, { head: header({ title: "Learn", eyebrow: c.name, right: you, big: true }), body, tabs }) };
    }
    case "inbox": {
      const rows = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => g(i, { lead: avatar(person(c, i), 44, i), meta: cap(line(c, i).replace(/^"|"$/g, "")), trail: i < 2 ? pill(String(i + 1), "brand") : `<span class="small muted">${DATES[i % DATES.length].replace("Today, ", "")}</span>` })).join("");
      const body = `${search("Search")}${rows}`;
      return { title: "Chats", html: frame(p, { head: header({ title: "Chats", right: iconButton("edit"), big: true }), body, tabs, fab: `<div class="fab" data-go="${n.detail}">${ic("plus", 20)}New</div>` }) };
    }
    case "map": {
      const near = [0, 1, 2, 3].map((i) => g(i, { lead: `<span class="av t${i % 4}" style="width:40px;height:40px">${ic("pin", 18)}</span>`, title: `${place(c, i)} ${c.unit}`, meta: `${(0.3 + i * 0.6).toFixed(1)} km · ${4 + i * 3} min`, trail: `<span>${money(c.price, [1, 1.2, 0.8, 1.5][i])}</span>` })).join("");
      const body = `${map(c.seed, 230)}<div class="mt12">${search("Where to?")}</div>${section("Near you", "See all")}${near}`;
      return { title: "Map", html: frame(p, { head: header({ title: c.name, eyebrow: place(c, 0), right: you }), body, tabs }) };
    }
    case "store": {
      const body = `${search(`Search ${plural(c.unit)}`)}${chips(["All", "Popular", "New", ...c.places.slice(0, 2)])}<div class="card" data-go="${n.detail}">${pic(p.treatment.pic, c.seed, "hero").replace('class="pic', 'style="margin:-16px -16px 14px;border-radius:var(--rl) var(--rl) 0 0" class="pic')}<div class="spread"><div><b style="font:700 18px var(--fh)">${esc(item(c, 0))}</b><div class="small muted">${esc(place(c, 0))}</div></div><span class="pl brand">${money(c.price)}</span></div></div>${section("Popular", "See all")}<div class="tiles">${[1, 2, 3, 4].map((i) => tile(c, p, i, n.detail)).join("")}</div>`;
      return { title: "Shop", html: frame(p, { head: header({ title: c.name, eyebrow: `Delivering to ${place(c, 1)}`, right: `${iconButton("cart")}` }), body, tabs }) };
    }
    default: {
      const acts = [0, 1, 2, 3, 4].map((i) => row({ lead: `<span class="av t${i % 4}" style="width:36px;height:36px">${ic(["bolt", "users", "card", "check", "bell"][i], 16)}</span>`, title: cap(line(c, i).replace(/^"|"$/g, "")), meta: DATES[i], trail: ic("chevron", 18), go: n.detail })).join("");
      const body = `<div class="stats">${stat(cap(c.stat?.label ?? "This week"), c.stat?.value ?? "12", "+3 vs last week")}${stat("Active", String(c.people.length + 4), "this week")}</div><div class="card mt12" data-go="${n.detail}"><div class="spread"><b>Last 7 days</b><span class="small muted">${money(c.price, 7)}</span></div>${lineChart([4, 6, 5, 8, 7, 10, 12])}</div>${section("Activity", "All")}${acts}`;
      return { title: "Overview", html: frame(p, { head: header({ title: "Overview", eyebrow: c.name, right: you, big: true }), body, tabs }) };
    }
  }
}

// ─── the detail screen ───────────────────────────────────────────────────
export function detail(c: Content, p: StudioPlan, n: Nav): Screen {
  const back = iconButton("back", n.main);
  const who = person(c, 0);
  switch (p.archetype) {
    case "ledger": {
      const body = `<div style="display:flex;align-items:center;gap:14px">${avatar(who, 56, 0)}<div><h2>${esc(who)}</h2><div class="sub" style="font-size:14px">${esc(cap(c.unit))} #1040 · sent ${DATES[2].toLowerCase()}</div></div></div><div class="card mt16"><div class="eyebrow">Amount</div><div class="price-big"><b>${money(c.price, 2.5)}</b><span class="muted">due Friday</span></div><div class="mt12">${pill("Awaiting payment", "warn")}</div></div><div class="gap8 mt12">${button("Mark as paid", { go: n.main })}${button("Send a reminder", { kind: "s" })}</div>${section("Lines")}${[0, 1, 2].map((i) => row({ title: cap([c.unit, `${c.unit}, renewal`, "Service fee"][i]), meta: `${[1, 1, 1][i]} × ${money(c.price, [1, 1, 0.5][i])}`, trail: `<span>${money(c.price, [1, 1, 0.5][i])}</span>` })).join("")}`;
      return { title: detailTitle("ledger", c.unit), html: `${statusBar()}${header({ title: "", left: back, right: iconButton("more") })}<div class="body">${body}<div class="tail"></div></div>${homeBar()}` };
    }
    case "feed": {
      const replies = [`Same here. Show it to me on Thursday?`, `I would pay for that.`, `Post the ${c.unit} when it is done, I want to see it.`];
      const body = `${post(c, 0)}<div class="mt16 gap8">${[1, 2, 3].map((i) => `<div class="bubble${i === 2 ? " me" : ""}"><b class="small" style="display:block;opacity:.8">${esc(person(c, i))}</b>${esc(replies[i - 1])}</div>`).join("")}</div>`;
      return { title: "A post", html: `${statusBar()}${header({ title: "Thread", left: back, right: iconButton("share") })}<div class="body">${body}<div class="tail"></div></div><div style="padding:8px 20px 6px;flex:none">${field("", `Reply to ${who.split(" ")[0]}…`, "send").replace('<span class="fl"></span>', "")}</div>${homeBar()}` };
    }
    case "listings": {
      const body = `${pic(p.treatment.pic, c.seed + 3, "hero")}<div class="spread"><h2>${esc(item(c, 0))}</h2><span class="pl soft">${ic("star", 14)} 4.9</span></div><p class="sub mt8">${esc(place(c, 0))} · ${esc(c.audience)}</p><p class="mt12" style="font-size:15px;line-height:1.5">${esc(c.sign)}.${c.quotes[0] ? ` ${esc(c.quotes[0].who)} says: “${esc(c.quotes[0].said)}”` : ""}</p>${section("Listed by")}${row({ lead: avatar(who, 44, 0), title: who, meta: "Responds within an hour", trail: iconButton("message") })}<div class="card spread mt16"><div><div style="font:700 24px/1 var(--fh)">${money(c.price)}</div><div class="small muted mt8">${esc(c.price?.per || "per booking")}</div></div><span class="btn p" style="width:auto" data-go="${n.price}">${esc(c.cta)}</span></div>`;
      return { title: detailTitle("listings", c.unit), html: `${statusBar()}${header({ title: "", left: back, right: `${iconButton("heart")}${iconButton("share")}` })}<div class="body">${body}<div class="tail"></div></div>${homeBar()}` };
    }
    case "bookings": {
      const slots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00"].map((t, i) => `<span class="${i === 3 ? "on" : i === 1 || i === 6 ? "off" : ""}">${t}</span>`).join("");
      const body = `${row({ lead: avatar(who, 48, 0), title: who, meta: c.quotes[0] ? `“${c.quotes[0].said}”` : `Regular since ${DATES[5]}`, trail: iconButton("phone") })}${section("What")}${chips([cap(c.unit), `Long ${c.unit}`, "Consultation"])}${section("When")}<div class="day">${DAYS.map((d, i) => `<span${i === 1 ? ' class="on"' : ""}>${d}<b>${8 + i}</b></span>`).join("")}</div><div class="slots">${slots}</div><div class="card spread mt24"><div><div class="eyebrow">Total</div><div style="font:700 24px/1 var(--fh);margin-top:6px">${money(c.price)}</div></div>${button("Confirm booking", { go: n.main, full: false })}</div>`;
      return { title: "A booking", html: `${statusBar()}${header({ title: "New booking", left: back })}<div class="body">${body}<div class="tail"></div></div>${homeBar()}` };
    }
    case "tracker": {
      const body = `<div class="center" style="padding-top:8px">${ring(72, "this week", 150)}</div><div class="stats mt16">${stat("Today", "3 of 4", "one to go")}${stat("Best day", "Friday", "4 of 4")}</div><div class="card mt12">${bars([3, 5, 4, 6, 5, 7, 6], DAYS)}</div><div class="mt16">${button(`Log ${c.unit}`, { go: n.main, icon: "plus" })}</div>${section("History")}${[0, 1, 2, 3].map((i) => row({ title: `${cap(c.unit)} · ${[22, 18, 25, 20][i]} min`, meta: DATES[i], trail: ic("check", 18) })).join("")}`;
      return { title: detailTitle("tracker", c.unit), html: `${statusBar()}${header({ title: cap(c.unit), left: back, right: iconButton("more") })}<div class="body">${body}<div class="tail"></div></div>${homeBar()}` };
    }
    case "learn": {
      const body = `${pic(p.treatment.pic, c.seed + 5, "hero")}<div class="eyebrow">Lesson 3 · 12 min</div><h2 class="mt8">${esc(cap(c.thing))}: the basics</h2><p class="sub mt8">${esc(c.sign)}</p><div class="steps mt16">${[`What a ${c.unit} is`, `Try a ${c.unit} yourself`, "Check what you learned"].map((t, i) => `<div class="step"><i>${i + 1}</i><div><b>${esc(t)}</b><span>${i === 0 ? "Read, 3 min" : i === 1 ? "Try it, 5 min" : "Check, 2 min"}</span></div></div>`).join("")}</div><div class="mt24">${button("Start the lesson", { go: n.main, icon: "play" })}</div>`;
      return { title: "A lesson", html: `${statusBar()}${header({ title: "", left: back, right: iconButton("bookmark") })}<div class="body">${body}<div class="tail"></div></div>${homeBar()}` };
    }
    case "inbox": {
      const msgs = [0, 1, 2, 3].map((i) => `<div class="bubble${i % 2 ? " me" : ""}">${esc(cap(line(c, i).replace(/^"|"$/g, "")))}</div>`).join("");
      const body = `<p class="small muted center mb12">Today</p>${msgs}`;
      return { title: "A chat", html: `${statusBar()}${header({ title: who, eyebrow: "Online", left: back, right: iconButton("phone") })}<div class="body">${body}<div class="tail"></div></div><div style="padding:8px 20px 6px;flex:none;display:flex;gap:8px;align-items:center">${iconButton("plus")}<div class="fi" style="flex:1"><span class="ph">Message</span></div>${iconButton("send").replace("icb", "icb").replace("<span", '<span style="background:var(--p);color:var(--op);border:0"')}</div>${homeBar()}` };
    }
    case "map": {
      const body = `${map(c.seed + 9, 200)}<div class="card mt12">${row({ lead: avatar(who, 44, 0), title: who, meta: `${cap(c.unit)} · 4 min away`, trail: pill("On the way", "brand") })}</div><div class="steps mt16">${["Request sent", "On the way", "Arriving"].map((s, i) => `<div class="step"><i style="${i > 1 ? "opacity:.35" : ""}">${i < 2 ? ic("check", 14) : i + 1}</i><div><b>${s}</b><span>${["08:12", "08:15", "about 08:22"][i]}</span></div></div>`).join("")}</div><div class="card spread mt16"><div><div class="eyebrow">Fare</div><div style="font:700 24px/1 var(--fh);margin-top:6px">${money(c.price)}</div></div>${button("Cancel", { kind: "q", full: false, small: true })}</div>`;
      return { title: "A trip", html: `${statusBar()}${header({ title: "Your trip", left: back })}<div class="body">${body}<div class="tail"></div></div>${homeBar()}` };
    }
    case "store": {
      const body = `${pic(p.treatment.pic, c.seed + 2, "hero")}<div class="spread"><h2>${esc(item(c, 0))}</h2><span style="font:700 22px/1 var(--fh)">${money(c.price)}</span></div><p class="sub mt8">${esc(c.sign)}</p>${section("Options")}${chips(["Regular", "Large", "Bundle of 3"])}${section("What people say")}${c.quotes[0] ? quote(c.quotes[0].who, c.quotes[0].said, 0) : `<p class="muted">Nothing written down yet.</p>`}<div class="mt24">${button(`Add to cart · ${money(c.price)}`, { go: n.main, icon: "cart" })}</div>`;
      return { title: detailTitle("store", c.unit), html: `${statusBar()}${header({ title: "", left: back, right: iconButton("heart") })}<div class="body">${body}<div class="tail"></div></div>${homeBar()}` };
    }
    default: {
      const body = `<div class="eyebrow">${esc(cap(c.stat?.label ?? "This week"))}</div><div class="price-big"><b>${esc(c.stat?.value ?? "12")}</b><span class="muted">${pill("+18%", "ok")}</span></div><div class="card mt16">${bars([5, 7, 6, 9, 8, 11, 12], DAYS)}</div>${section("By customer")}${[0, 1, 2, 3].map((i) => row({ lead: avatar(person(c, i), 36, i), title: person(c, i), meta: `${3 + i * 2} this week`, trail: `<span>${money(c.price, [2, 1.5, 1, 0.5][i])}</span>` })).join("")}`;
      return { title: "The numbers", html: `${statusBar()}${header({ title: "The numbers", left: back, right: iconButton("share") })}<div class="body">${body}<div class="tail"></div></div>${homeBar()}` };
    }
  }
}

// ─── the price ───────────────────────────────────────────────────────────
export function price(c: Content, p: StudioPlan, n: Nav): Screen {
  const perUse = p.archetype === "listings" || p.archetype === "bookings" || p.archetype === "map" || p.archetype === "store";
  const big = c.price ? `<div class="price-big"><b>${money(c.price)}</b><span class="sub">${esc(c.price.per || (perUse ? `per ${c.unit}` : ""))}</span></div>` : `<h2 style="font-size:32px">${esc(c.pricing.headline)}</h2>`;
  const lines = (c.pricing.bullets.length ? c.pricing.bullets : ["Everything, no tiers", "Stop whenever", "A person answers email"]).map(included).join("");
  const body = `${big}<p class="sub mt8">${esc(c.pricing.sub)}</p><div class="card mt16" style="padding:6px 16px">${lines}</div><div class="trust">${ic("shield", 26)}<div><b>Stop whenever, from the app.</b><span>${perUse ? "You pay per " + esc(c.unit) + ". No membership." : "No card until the free week ends. No tiers, no add-ons."}</span></div></div><div class="gap8 mt24">${button(c.pricing.cta, { go: n.main })}${button("Talk to us first", { kind: "q" })}</div><p class="small muted center mt12">Used by ${esc(c.audience)} this week.</p>`;
  return { title: "The price", html: `${statusBar()}${header({ title: "", eyebrow: "The price", left: iconButton("close", n.landing) })}<div class="body">${body}<div class="tail"></div></div>${homeBar()}` };
}

export const dotsPart = dots;
