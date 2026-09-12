/**
 * The screens: what each archetype's main screen and detail screen show,
 * the eight front doors, the sign-in step and the price, assembled from
 * the parts with the founder's own content (the sign, the audience, the
 * customers' names and words, the price said out loud) and fixtures
 * that read as a product in use rather than a wireframe.
 */
import type { StudioPlan } from "./plan.ts";
import { detailTitle } from "./nouns.ts";
import { agenda, avatar, balanceCard, bars, button, cartBar, categoryRow, chips, dayHeader, dots, esc, feature, field, header, homeBar, ic, iconButton, included, lessonPath, lineChart, map, option, pic, pill, productTile, progress, promo, quickActions, quote, rating, ring, ringTrio, row, search, section, segmented, sheet, stat, statSpark, statTrio, statusBar, statusDot, stepper, stories, tabBar, ticks, timeline, unitBanner, unread } from "./parts.ts";

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
  /** What goes in front of the noun on tiles and rows, by archetype. */
  adjectives?: string[];
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
/** What goes in front of the noun, by what the product sells: a room is quiet, a loaf is seeded, a lesson is short. */
export const ADJECTIVES: Record<string, string[]> = {
  store: ["Classic", "Seeded", "Small", "Large", "Fresh", "Daily", "Popular", "New", "Whole", "Half"],
  listings: ADJ,
  learn: ["First", "Short", "Daily", "Quick", "Full", "Bonus", "Weekend", "Ten-minute"],
  map: ["Airport", "Old town", "Harbour", "Station", "Late", "Early", "Shared", "Direct"],
};

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
  const adj = c.adjectives ?? ADJ;
  return `${adj[(i + c.seed) % adj.length]} ${noun}`;
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
  return `${statusBar()}${o.head ?? ""}${top}<div class="body${o.flush ? " flush" : ""}">${o.body}<div class="end${o.fab ? " after-fab" : ""}"></div></div>${o.fab ?? ""}${bottom}`;
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
      below = `${pic(p.treatment.pic, c.seed, "hero", c.unit)}<div class="steps">${[c.bullets[0] ?? `Say what you need: ${c.thing}`, c.activity[0] ?? `${person(c, 0)} answers the same day`, c.bullets[1] ?? `Pay ${money(c.price)} ${c.price?.per ?? ""}`.trim()].map((s, i) => `<div class="step"><i>${i + 1}</i><div><b>${esc(cap(s.replace(/^"|"$/g, "")))}</b></div></div>`).join("")}</div><div class="mt24">${button(c.cta, { go, icon: "arrow" })}</div>${proof}${priceLine}`;
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
  return { title: "The front door", html: `${statusBar()}${top}<div class="body" style="padding-top:18px">${below}<div class="end"></div></div>${homeBar()}` };
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
  return `<div class="tile"${go !== undefined ? ` data-go="${go}"` : ""}>${pic(p.treatment.pic, c.seed + i * 7, "tile", c.unit)}<b>${esc(item(c, i))}</b><span>${esc(place(c, i))}</span><span class="price">${money(c.price, [1, 1.5, 0.75, 2, 1.25, 0.5][i % 6])}${p.archetype === "listings" && c.price?.per ? ` <span class="small muted" style="display:inline">${esc(c.price.per)}</span>` : ""}</span></div>`;
}

function post(c: Content, i: number, p?: StudioPlan): string {
  const who = person(c, i);
  const picture = p && i % 3 === 1 ? pic(p.treatment.pic, c.seed + i * 11, "hero", c.unit).replace('class="pic', 'style="height:160px;margin:10px 0 4px" class="pic') : "";
  return `<div class="post"><div class="ph">${avatar(who, 36, i)}<div><b>${esc(who)}</b><span>${esc(DATES[i % DATES.length])}</span></div></div><p>${esc(cap(postLine(c, i).replace(/^"|"$/g, "")))}</p>${picture}<div class="acts"><span>${ic("heart", 16)}${12 + ((i * 7 + c.seed) % 40)}</span><span>${ic("message", 16)}${1 + ((i * 3) % 9)}</span><span>${ic("share", 16)}</span></div></div>`;
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
  const manner = p.treatment.pic;
  const g = (i: number, extra?: Partial<Parameters<typeof row>[0]>) => row({ go: n.detail, ...extra, title: extra?.title ?? person(c, i) });
  switch (p.archetype) {
    case "ledger": {
      // Revolut, Stripe: the balance, four actions, the days
      const tx = (i: number, k: number, due = false) => g(i, { lead: avatar(person(c, i), 40, i), meta: `${cap(c.unit)} #${1040 + i}`, trail: `<span class="mono">${due ? "" : "+"}${money(c.price, k)}</span>${due ? pill("Due", "warn") : pill("Paid", "ok")}` });
      const body = `${balanceCard("Paid this week", money(c.price, 7), `${7} ${plural(c.unit)} · ${c.people.length} clients`)}${quickActions([{ icon: "plus", label: `New ${c.unit}`, go: n.detail }, { icon: "send", label: "Send" }, { icon: "bell", label: "Remind" }, { icon: "more", label: "More" }])}${segmented(["All", "Paid", "Due"])}${dayHeader("Today", `+${money(c.price, 3.5)}`)}${tx(0, 1)}${tx(1, 2.5, true)}${tx(2, 1)}${dayHeader("Yesterday", `+${money(c.price, 2)}`)}${tx(3, 1.5)}${tx(4, 0.5, true)}${dayHeader("Monday", `+${money(c.price, 3)}`)}${tx(5, 2)}${tx(6, 1)}`;
      return { title: "Today", html: frame(p, { head: header({ title: "Today", eyebrow: "Tuesday 9 September", right: you, big: true }), body, tabs }) };
    }
    case "feed": {
      // Instagram, Threads: people first, then the composer, then the posts
      const composer = `<div class="card tight" style="display:flex;gap:10px;align-items:center;margin-bottom:6px">${you}<span class="muted" style="flex:1">What are you working on?</span>${ic("camera", 20)}</div>`;
      const body = `${stories(c.people)}${composer}${[0, 1, 2, 3, 4].map((i) => `<div data-go="${n.detail}">${post(c, i, p)}</div>`).join("")}`;
      return { title: "Home", html: frame(p, { head: header({ title: c.name, right: `${iconButton("bell")}`, big: true }), body, tabs, fab: `<div class="fab" data-go="${n.detail}">${ic("plus", 20)}Post</div>` }) };
    }
    case "listings": {
      // Airbnb: one search pill, categories, picture-led cards, a map pill
      const searchPill = `<div class="srch" style="height:54px;border-radius:999px;box-shadow:var(--sh);background:var(--cardbg);border:var(--bd)">${ic("search", 20)}<span style="display:flex;flex-direction:column;line-height:1.2"><b style="color:var(--fg);font-size:14px">Find a ${esc(c.unit)}</b><span style="font-size:12px">${esc(place(c, 0))} · Any day · For you</span></span></div>`;
      const cats = categoryRow([{ icon: "grid", label: "All" }, { icon: "star", label: "Top rated" }, { icon: "pin", label: "Near me" }, { icon: "clock", label: "Today" }, { icon: "heart", label: "Saved" }]);
      const card = (i: number) => `<div class="tile" data-go="${n.detail}">${pic(manner, c.seed + i * 7, "tile", c.unit).replace("tile", "tile").replace('class="pic', 'style="height:170px" class="pic')}<span class="heart">${ic("heart", 16)}</span><div class="spread"><b>${esc(item(c, i))}</b>${rating(["4.9", "4.8", "4.7", "5.0", "4.6", "4.9"][i])}</div><span>${esc(place(c, i))}</span><span class="price">${money(c.price, [1, 1.5, 0.75, 2, 1.25, 0.5][i])} <span class="small muted" style="display:inline;font-weight:500">${esc(c.price?.per || "per " + c.unit)}</span></span></div>`;
      const body = `${searchPill}<div class="mt12">${cats}</div><div class="gap12">${[0, 1, 2, 3, 4, 5].map(card).join("")}</div>`;
      return { title: "Explore", html: frame(p, { body, tabs, fab: `<div class="mappill" data-go="${n.detail}">${ic("pin", 18)}Map</div>` }) };
    }
    case "bookings": {
      // Fresha, Calendly: the day strip, two numbers, the day as an agenda
      const days = `<div class="day">${DAYS.map((d, i) => `<span${i === 1 ? ' class="on"' : ""}>${d}<b>${8 + i}</b></span>`).join("")}</div>`;
      const ag = agenda([
        { time: "09:00", title: person(c, 0), meta: `${cap(c.unit)} · ${place(c, 0)}`, tone: 0, go: n.detail },
        { time: "10:30", title: person(c, 1), meta: `${cap(c.unit)} · ${place(c, 1)}`, tone: 1, span: 2, go: n.detail },
        { time: "12:00", title: "Free", meta: "Tap to book", tone: 3, go: n.detail },
        { time: "14:00", title: person(c, 2), meta: `${cap(c.unit)} · ${place(c, 2)}`, tone: 2, go: n.detail },
        { time: "15:30", title: person(c, 3), meta: `${cap(c.unit)} · ${place(c, 3)}`, tone: 0, span: 2, go: n.detail },
        { time: "17:30", title: "Free", meta: "Tap to book", tone: 3, go: n.detail },
      ]);
      const body = `${days}<div class="stats">${stat("Booked today", "4", "2 free slots")}${stat("This week", money(c.price, 14), "+3 vs last week")}</div>${section("Today")}${ag}`;
      return { title: "Today", html: frame(p, { head: header({ title: "Tuesday", eyebrow: "9 September", right: you, big: true }), body, tabs, fab: `<div class="fab" data-go="${n.detail}">${ic("plus", 20)}New booking</div>` }) };
    }
    case "tracker": {
      // Apple Fitness, Strava: the rings, the streak, today's items, the week
      const items = [`Morning ${c.unit}`, `Ten-minute ${c.unit}`, `Log today's ${c.unit}`, "Evening check-in"].map((t, i) => row({ lead: `<span class="av ${i < 2 ? "t0" : "t3"}" style="width:32px;height:32px">${i < 2 ? ic("check", 16) : ""}</span>`, title: cap(t), meta: i < 2 ? "Done" : "Not yet", trail: ic("chevron", 18), go: n.detail })).join("");
      const body = `<div class="card">${ringTrio([{ pct: 72, label: "today" }, { pct: 55, label: "week" }, { pct: 90, label: "goal" }])}${statTrio([{ value: "12", label: "day streak" }, { value: "3 of 4", label: "today" }, { value: "22 min", label: "so far" }])}<div class="spread"><span class="pl soft">${ic("flame", 14)} Best streak: 19</span><span class="small muted">Keep it going</span></div></div>${section("Today")}${items}${section("This week")}<div class="card">${bars([3, 5, 4, 6, 5, 7, 6], DAYS)}</div>`;
      return { title: "Today", html: frame(p, { head: header({ title: "Today", eyebrow: "Tuesday 9 September", right: iconButton("bell"), big: true }), body, tabs }) };
    }
    case "learn": {
      // Duolingo: the unit, the streak, the path
      const names = [`What a ${c.unit} is`, `Your first ${c.unit}`, `${cap(c.thing)}: the basics`, `Practice: ${c.unit} two`, `Check what you learned`, `${cap(c.unit)} three`];
      const path = lessonPath(names.map((t, i) => ({ title: t, state: i < 2 ? "done" : i === 2 ? "now" : i === 3 ? "next" : "locked" })), n.detail);
      const body = `${unitBanner("Unit 1", `${cap(c.thing)}: the basics`, 12, "340 XP")}<div class="card tight spread" data-go="${n.detail}"><div><div class="eyebrow">Continue</div><b>${esc(names[2])}</b><div class="mt8" style="width:180px">${progress(58)}</div></div><span class="btn p sm" style="width:auto">Start</span></div>${path}`;
      return { title: "Learn", html: frame(p, { head: header({ title: "Learn", eyebrow: c.name, right: you, big: true }), body, tabs }) };
    }
    case "inbox": {
      // WhatsApp, Telegram: the search, the chats, the unread counts
      const rows = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => g(i, { lead: avatar(person(c, i), 48, i), meta: cap(line(c, i).replace(/^"|"$/g, "")), trail: `<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px"><span class="small ${i < 2 ? "strong" : "muted"}" style="${i < 2 ? "color:var(--p)" : ""}">${esc(DATES[i % DATES.length].replace("Today, ", ""))}</span>${i < 2 ? unread(i + 1) : ticks(i % 3 === 0)}</div>` })).join("");
      const body = `${search("Search")}${dayHeader("Pinned")}${g(0, { lead: avatar(person(c, 0), 48, 0), meta: cap(line(c, 0).replace(/^"|"$/g, "")), trail: `<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px"><span class="small strong" style="color:var(--p)">08:12</span>${unread(2)}</div>` })}${dayHeader("Chats")}${rows}`;
      return { title: "Chats", html: frame(p, { head: header({ title: "Chats", right: `${iconButton("camera")}${iconButton("edit")}`, big: true }), body, tabs, fab: `<div class="fab" data-go="${n.detail}">${ic("plus", 20)}New</div>` }) };
    }
    case "map": {
      // Uber, Bolt: the map, the sheet, where to, saved places, recents
      const saved = `<div style="display:flex;gap:10px;margin:12px 0 6px">${[["home", "Home"], ["briefcase", "Work"], ["star", "Saved"]].map(([i, l]) => `<span class="chip">${ic(i, 16)} ${l}</span>`).join("")}</div>`;
      const recent = [0, 1, 2].map((i) => g(i, { lead: `<span class="av t3" style="width:40px;height:40px">${ic("clock", 18)}</span>`, title: `${place(c, i)} ${c.unit}`, meta: `${(0.3 + i * 0.6).toFixed(1)} km · ${4 + i * 3} min`, trail: `<span class="mono">${money(c.price, [1, 1.2, 0.8][i])}</span>` })).join("");
      const body = `${map(c.seed, 330, "border-radius:0;margin:0 -20px")}${sheet(`${search("Where to?").replace('class="srch"', 'class="srch" style="height:52px;font-size:17px;font-weight:600;color:var(--fg)"')}${saved}${section("Recent")}${recent}`)}`;
      return { title: "Map", html: frame(p, { body, tabs }) };
    }
    case "store": {
      // Amazon, Shop, Glovo: the search, the promo, the categories, the tiles, the cart
      const tiles = [1, 2, 3, 4].map((i) => productTile(manner, c.seed + i * 5, item(c, i), place(c, i), money(c.price, [1.5, 0.75, 2, 1.25][i - 1]), ["4.8", "4.6", "4.9", "4.7"][i - 1], n.detail, c.unit)).join("");
      const body = `${search(`Search ${plural(c.unit)}`)}${promo(manner, c.seed, "This week", `${cap(item(c, 0))}, fresh today`, "Order now", n.detail, c.unit)}${chips(["All", "Popular", "New", ...c.places.slice(0, 2)])}${section("Popular", "See all")}<div class="tiles">${tiles}</div>`;
      return { title: "Shop", html: frame(p, { head: header({ title: c.name, eyebrow: `Delivering to ${place(c, 1)}`, right: `<span style="position:relative">${iconButton("cart")}<span class="unread" style="position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;font-size:11px">2</span></span>` }), body, tabs, fab: cartBar("2", money(c.price, 2.5), "View cart", n.detail) }) };
    }
    default: {
      // Linear, Vercel, Stripe: two tiles with a spark each, a range, one chart, activity with a status word
      const acts = [0, 1, 2, 3, 4].map((i) => row({ lead: avatar(person(c, i), 36, i), title: cap(line(c, i).replace(/^"|"$/g, "")), meta: DATES[i], trail: statusDot(i % 3 === 1 ? "warn" : "ok", i % 3 === 1 ? "Waiting" : "Done"), go: n.detail })).join("");
      const body = `<div class="stats">${statSpark(cap(c.stat?.label ?? "This week"), c.stat?.value ?? "12", "+3", [4, 6, 5, 8, 7, 10, 12])}${statSpark("Active", String(c.people.length + 4), "+2", [6, 7, 7, 9, 10, 12, 16])}</div><div class="mt12">${segmented(["7 days", "30 days", "This year"])}</div><div class="card" data-go="${n.detail}"><div class="spread"><b>Last 7 days</b><span class="small muted">Sun to Sat</span></div>${lineChart([4, 6, 5, 8, 7, 10, 12], 310, 100, money(c.price, 7))}</div>${section("Activity", "All")}${acts}`;
      return { title: "Overview", html: frame(p, { head: header({ title: "Overview", eyebrow: c.name, right: you, big: true }), body, tabs }) };
    }
  }
}

// ─── the detail screen ───────────────────────────────────────────────────
export function detail(c: Content, p: StudioPlan, n: Nav): Screen {
  const back = iconButton("back", n.main);
  const who = person(c, 0);
  const manner = p.treatment.pic;
  switch (p.archetype) {
    case "ledger": {
      const body = `<div style="display:flex;align-items:center;gap:14px">${avatar(who, 56, 0)}<div><h2>${esc(who)}</h2><div class="sub" style="font-size:14px">${esc(cap(c.unit))} #1040 · sent yesterday</div></div></div><div class="card mt16"><div class="eyebrow">Amount</div><div class="price-big"><b>${money(c.price, 2.5)}</b><span class="muted">due Friday</span></div><div class="mt12">${pill("Awaiting payment", "warn")}</div></div>${timeline([{ title: "Sent", meta: "Yesterday, 16:40", state: "done" }, { title: "Opened", meta: "Today, 08:12", state: "done" }, { title: "Paid", meta: "Due Friday", state: "next" }])}<div class="gap8">${button("Mark as paid", { go: n.main })}${button("Send a reminder", { kind: "s" })}</div>${section("Lines")}${[0, 1, 2].map((i) => row({ title: cap([c.unit, `${c.unit}, renewal`, "Service fee"][i]), meta: `1 × ${money(c.price, [1, 1, 0.5][i])}`, trail: `<span class="mono">${money(c.price, [1, 1, 0.5][i])}</span>` })).join("")}`;
      return { title: detailTitle("ledger", c.unit), html: `${statusBar()}${header({ title: "", left: back, right: iconButton("more") })}<div class="body">${body}<div class="end"></div></div>${homeBar()}` };
    }
    case "feed": {
      const replies = [`Same here. Show it to me on Thursday?`, `I would pay for that.`, `Post the ${c.unit} when it is done, I want to see it.`];
      const body = `${post(c, 0)}<div class="mt16 gap8">${[1, 2, 3].map((i) => `<div class="bubble withtail${i === 2 ? " me" : ""}"><b class="small" style="display:block;opacity:.8">${esc(person(c, i))}</b>${esc(replies[i - 1])}</div>`).join("")}</div>`;
      return { title: "A post", html: `${statusBar()}${header({ title: "Thread", left: back, right: iconButton("share") })}<div class="body">${body}<div class="end"></div></div><div class="inbar">${iconButton("camera")}<div class="fi"><span class="ph">Reply to ${esc(who.split(" ")[0])}…</span></div>${iconButton("send")}</div>${homeBar()}` };
    }
    case "listings": {
      const amen = c.bullets.filter(unquoted).slice(0, 3).map((b) => b.replace(/^what you get:\s*/i, ""));
      const body = `${pic(manner, c.seed + 3, "hero", c.unit).replace('class="pic', 'style="height:240px;margin:0 -20px 16px;border-radius:0" class="pic')}<div class="spread"><h2>${esc(item(c, 0))}</h2>${rating("4.9", "38")}</div><p class="sub mt8">${esc(place(c, 0))} · for ${esc(c.audience)}</p><div class="badges">${[...amen, `Cancel any time`].slice(0, 3).map((b) => `<span>${ic("check", 14)}${esc(cap(b))}</span>`).join("")}</div><p style="font-size:15px;line-height:1.5">${esc(c.sign)}.${c.quotes[0] ? ` ${esc(c.quotes[0].who)} says: “${esc(c.quotes[0].said)}”` : ""}</p>${section("Listed by")}${row({ lead: avatar(who, 44, 0), title: who, meta: "Responds within an hour", trail: iconButton("message") })}<div class="card spread mt16"><div><div style="font:700 24px/1 var(--fh)">${money(c.price)}</div><div class="small muted mt8">${esc(c.price?.per || "per booking")}</div></div><span class="btn p" style="width:auto" data-go="${n.price}">${esc(c.cta)}</span></div>`;
      return { title: detailTitle("listings", c.unit), html: `${statusBar()}${header({ title: "", left: back, right: `${iconButton("heart")}${iconButton("share")}` })}<div class="body">${body}<div class="end"></div></div>${homeBar()}` };
    }
    case "bookings": {
      const slots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00"].map((t, i) => `<span class="${i === 3 ? "on" : i === 1 || i === 6 ? "off" : ""}">${t}</span>`).join("");
      const body = `${row({ lead: avatar(who, 48, 0), title: who, meta: c.quotes[0] ? `“${c.quotes[0].said}”` : `Regular since ${DATES[5]}`, trail: iconButton("phone") })}${section("What")}${[0, 1, 2].map((i) => row({ title: [cap(c.unit), `Long ${c.unit}`, "Consultation"][i], meta: ["45 min", "90 min", "20 min"][i], trail: `<span class="mono">${money(c.price, [1, 1.8, 0.5][i])}</span>${i === 0 ? `<span class="av t0" style="width:24px;height:24px;margin-left:8px">${ic("check", 14)}</span>` : ""}` })).join("")}${section("When")}<div class="day">${DAYS.map((d, i) => `<span${i === 1 ? ' class="on"' : ""}>${d}<b>${8 + i}</b></span>`).join("")}</div><div class="slots">${slots}</div><div class="card spread mt24"><div><div class="eyebrow">Total</div><div style="font:700 24px/1 var(--fh);margin-top:6px">${money(c.price)}</div></div>${button("Confirm booking", { go: n.main, full: false })}</div>`;
      return { title: "A booking", html: `${statusBar()}${header({ title: "New booking", left: back })}<div class="body">${body}<div class="end"></div></div>${homeBar()}` };
    }
    case "tracker": {
      const body = `${map(c.seed + 4, 170)}<div class="mt12"><div class="eyebrow">Today, 06:40</div><h2 class="mt8">Morning ${esc(c.unit)}</h2></div>${statTrio([{ value: "22 min", label: "time" }, { value: "3 of 4", label: "sets" }, { value: "Day 12", label: "streak" }])}<div class="card">${bars([3, 5, 4, 6, 5, 7, 6], DAYS)}</div><div class="mt16">${button(`Log ${c.unit}`, { go: n.main, icon: "plus" })}</div>${section("History")}${[0, 1, 2, 3].map((i) => row({ lead: `<span class="av t${i % 4}" style="width:36px;height:36px">${ic("check", 16)}</span>`, title: `${cap(c.unit)} · ${[22, 18, 25, 20][i]} min`, meta: DATES[i + 1], trail: `<span class="small muted">${["+3", "+2", "+4", "+2"][i]}</span>` })).join("")}`;
      return { title: detailTitle("tracker", c.unit), html: `${statusBar()}${header({ title: cap(c.unit), left: back, right: iconButton("share") })}<div class="body">${body}<div class="end"></div></div>${homeBar()}` };
    }
    case "learn": {
      const body = `${pic(manner, c.seed + 5, "hero", c.unit)}<div class="spread"><div class="eyebrow">Lesson 3 · 12 min</div><span class="pl soft">${ic("bolt", 14)} +20 XP</span></div><h2 class="mt8">${esc(cap(c.thing))}: the basics</h2><p class="sub mt8">${esc(c.sign)}</p><div class="steps mt16">${[`What a ${c.unit} is`, `Try a ${c.unit} yourself`, "Check what you learned"].map((t, i) => `<div class="step"><i>${i + 1}</i><div><b>${esc(t)}</b><span>${i === 0 ? "Read, 3 min" : i === 1 ? "Try it, 5 min" : "Check, 2 min"}</span></div></div>`).join("")}</div><div class="mt24">${button("Start the lesson", { go: n.main, icon: "play" })}</div>`;
      return { title: "A lesson", html: `${statusBar()}${header({ title: "", left: back, right: iconButton("bookmark") })}<div class="body">${body}<div class="end"></div></div>${homeBar()}` };
    }
    case "inbox": {
      const msgs = [0, 1, 2, 3].map((i) => `<div class="bubble withtail${i % 2 ? " me" : ""}">${esc(cap(line(c, i).replace(/^"|"$/g, "")))}${i % 2 ? `<span style="display:block;text-align:right;font-size:11px;opacity:.8;margin-top:4px">${["10:41", "10:44"][(i - 1) / 2]} ${ticks(i === 1)}</span>` : ""}</div>`).join("");
      const body = `<span class="datepill">Today</span>${msgs}<div class="small muted" style="margin-top:6px">${esc(who.split(" ")[0])} is typing…</div>`;
      return { title: "A chat", html: `${statusBar()}${header({ title: who, eyebrow: "Online", left: back, right: `${iconButton("phone")}${iconButton("more")}` })}<div class="body">${body}<div class="end"></div></div><div class="inbar">${iconButton("plus")}<div class="fi"><span class="ph">Message</span></div>${iconButton("mic")}${iconButton("send").replace('class="icb"', 'class="icb" style="background:var(--p);color:var(--op);border:0"')}</div>${homeBar()}` };
    }
    case "map": {
      const opts = [option("car", "Standard", "4 min away · 2 seats", money(c.price), true, n.main), option("car", "Comfort", "6 min away · 3 seats", money(c.price, 1.4)), option("truck", "Large", "8 min away · 6 seats", money(c.price, 1.9))];
      const body = `${map(c.seed + 9, 200, "border-radius:0;margin:0 -20px")}${sheet(`${section("Choose a ride")}${opts.join("")}${timeline([{ title: `${place(c, 0)}`, meta: "Pick-up, now", state: "done" }, { title: `${place(c, 2)} ${c.unit}`, meta: "Drop-off, about 08:22", state: "next" }])}<div class="card spread"><div><div class="eyebrow">Fare</div><div style="font:700 24px/1 var(--fh);margin-top:6px">${money(c.price)}</div></div>${button("Confirm ride", { go: n.main, full: false })}</div>`)}`;
      return { title: "A trip", html: `${statusBar()}${header({ title: "Your trip", left: back })}<div class="body">${body}<div class="end"></div></div>${homeBar()}` };
    }
    case "store": {
      const body = `${pic(manner, c.seed + 2, "hero", c.unit).replace('class="pic', 'style="height:250px;margin:0 -20px 12px;border-radius:0" class="pic')}<div class="center mb12">${dots(1, 4).replace('class="dots"', 'class="dots" style="display:inline-grid;grid-template-columns:repeat(4,8px);gap:6px;margin:0"').replace(/<i/g, '<i style="width:8px;height:8px;border-width:1px"')}</div><div class="spread"><h2>${esc(item(c, 0))}</h2><span style="font:700 22px/1 var(--fh)" class="mono">${money(c.price)}</span></div><div class="mt8">${rating("4.8", "126")}</div><p class="sub mt8">${esc(c.sign)}</p>${section("Options")}${chips(["Regular", "Large", "Bundle of 3"])}${section("How many")}<div class="spread">${stepper(1)}${button(`Add to cart · ${money(c.price)}`, { go: n.main, icon: "cart", full: false })}</div>${section("What people say")}${c.quotes[0] ? quote(c.quotes[0].who, c.quotes[0].said, 0) : `<p class="muted">Nothing written down yet.</p>`}`;
      return { title: detailTitle("store", c.unit), html: `${statusBar()}${header({ title: "", left: back, right: `${iconButton("heart")}${iconButton("share")}` })}<div class="body">${body}<div class="end"></div></div>${homeBar()}` };
    }
    default: {
      const body = `<div class="eyebrow">${esc(cap(c.stat?.label ?? "This week"))}</div><div class="price-big"><b>${esc(c.stat?.value ?? "12")}</b><span class="muted">${pill("+18%", "ok")}</span></div><div class="mt12">${segmented(["Week", "Month", "Year"])}</div><div class="card">${bars([5, 7, 6, 9, 8, 11, 12], DAYS)}</div>${section("By customer")}${[0, 1, 2, 3].map((i) => row({ lead: avatar(person(c, i), 36, i), title: person(c, i), meta: `${3 + i * 2} this week`, trail: `<span class="mono">${money(c.price, [2, 1.5, 1, 0.5][i])}</span>` })).join("")}`;
      return { title: "The numbers", html: `${statusBar()}${header({ title: "The numbers", left: back, right: iconButton("share") })}<div class="body">${body}<div class="end"></div></div>${homeBar()}` };
    }
  }
}

// ─── the price ───────────────────────────────────────────────────────────
export function price(c: Content, p: StudioPlan, n: Nav): Screen {
  const perUse = p.archetype === "listings" || p.archetype === "bookings" || p.archetype === "map" || p.archetype === "store";
  const big = c.price ? `<div class="price-big"><b>${money(c.price)}</b><span class="sub">${esc(c.price.per || (perUse ? `per ${c.unit}` : ""))}</span></div>` : `<h2 style="font-size:32px">${esc(c.pricing.headline)}</h2>`;
  const lines = (c.pricing.bullets.length ? c.pricing.bullets : ["Everything, no tiers", "Stop whenever", "A person answers email"]).map(included).join("");
  const body = `${big}<p class="sub mt8">${esc(c.pricing.sub)}</p><div class="card mt16" style="padding:6px 16px">${lines}</div><div class="trust">${ic("shield", 26)}<div><b>Stop whenever, from the app.</b><span>${perUse ? "You pay per " + esc(c.unit) + ". No membership." : "No card until the free week ends. No tiers, no add-ons."}</span></div></div><div class="gap8 mt24">${button(c.pricing.cta, { go: n.main })}${button("Talk to us first", { kind: "q" })}</div><p class="small muted center mt12">Used by ${esc(c.audience)} this week.</p>`;
  return { title: "The price", html: `${statusBar()}${header({ title: "", eyebrow: "The price", left: iconButton("close", n.landing) })}<div class="body">${body}<div class="end"></div></div>${homeBar()}` };
}

export const dotsPart = dots;
