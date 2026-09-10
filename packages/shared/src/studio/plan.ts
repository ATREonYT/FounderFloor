/**
 * The plan: what the studio decides before it draws. From the founder's
 * words it reads what kind of product this is (the tables know 192),
 * takes the palette that kind has earned, picks a type pairing that
 * suits its mood, a treatment (the shapes, surfaces, shadows and
 * navigation of a style), the archetype of its main screen and the
 * pattern of its front door. A seed turns the second, third and fourth
 * choices into a different take that still fits. The plan is also
 * written out as a design system, for the brief and the model.
 */
import { FONTS, PRODUCTS, type FontRow, type Palette, type ProductRow } from "./tables.ts";
import { referenceLine } from "./references.ts";

export type Archetype = "ledger" | "feed" | "listings" | "bookings" | "tracker" | "learn" | "inbox" | "map" | "dashboard" | "store";
export type Landing = "hero" | "features" | "minimal" | "proof" | "story" | "demo" | "search" | "trust";
export type TreatmentId = "swiss" | "flat" | "glass" | "soft" | "clay" | "organic" | "block" | "dark" | "hud" | "brutal" | "aurora" | "editorial" | "paper";

export interface Treatment {
  id: TreatmentId;
  name: string;
  /** Corner radii: small, medium, large; and the button's. */
  r: [number, number, number, number];
  border: "hair" | "thick" | "none";
  shadow: "none" | "soft" | "hard" | "glow";
  surface: "flat" | "glass" | "raised" | "inset";
  hero: "block" | "mesh" | "type" | "dark" | "card" | "paper";
  nav: "tabs" | "pill" | "top";
  pic: "mesh" | "blocks" | "rings" | "stripes" | "grid" | "photo";
  heading: "normal" | "upper" | "tight";
  forceDark?: boolean;
}

const T: Record<TreatmentId, Treatment> = {
  swiss: { id: "swiss", name: "Swiss", r: [2, 4, 6, 4], border: "hair", shadow: "none", surface: "flat", hero: "type", nav: "top", pic: "grid", heading: "tight" },
  flat: { id: "flat", name: "Flat", r: [8, 12, 16, 12], border: "none", shadow: "none", surface: "flat", hero: "block", nav: "tabs", pic: "blocks", heading: "normal" },
  glass: { id: "glass", name: "Glass", r: [12, 18, 24, 999], border: "hair", shadow: "soft", surface: "glass", hero: "mesh", nav: "pill", pic: "mesh", heading: "normal" },
  soft: { id: "soft", name: "Soft", r: [14, 20, 28, 999], border: "none", shadow: "soft", surface: "raised", hero: "card", nav: "tabs", pic: "rings", heading: "normal" },
  clay: { id: "clay", name: "Clay", r: [18, 24, 32, 999], border: "none", shadow: "soft", surface: "raised", hero: "card", nav: "pill", pic: "rings", heading: "normal" },
  organic: { id: "organic", name: "Organic", r: [16, 24, 36, 999], border: "none", shadow: "soft", surface: "flat", hero: "mesh", nav: "tabs", pic: "mesh", heading: "normal" },
  block: { id: "block", name: "Block", r: [6, 10, 14, 10], border: "none", shadow: "none", surface: "flat", hero: "block", nav: "tabs", pic: "blocks", heading: "tight" },
  dark: { id: "dark", name: "Dark", r: [10, 14, 20, 12], border: "hair", shadow: "glow", surface: "raised", hero: "dark", nav: "tabs", pic: "photo", heading: "normal", forceDark: true },
  hud: { id: "hud", name: "HUD", r: [4, 6, 8, 6], border: "hair", shadow: "glow", surface: "flat", hero: "dark", nav: "top", pic: "grid", heading: "upper", forceDark: true },
  brutal: { id: "brutal", name: "Brutal", r: [0, 0, 0, 0], border: "thick", shadow: "hard", surface: "flat", hero: "block", nav: "tabs", pic: "stripes", heading: "upper" },
  aurora: { id: "aurora", name: "Aurora", r: [12, 18, 24, 999], border: "none", shadow: "soft", surface: "glass", hero: "mesh", nav: "pill", pic: "mesh", heading: "normal" },
  editorial: { id: "editorial", name: "Editorial", r: [2, 4, 6, 4], border: "hair", shadow: "none", surface: "flat", hero: "type", nav: "top", pic: "photo", heading: "normal" },
  paper: { id: "paper", name: "Paper", r: [4, 8, 10, 8], border: "hair", shadow: "none", surface: "flat", hero: "paper", nav: "tabs", pic: "stripes", heading: "normal" },
};

/** A style name from the tables to a treatment the studio can draw. */
export function treatmentOf(style: string): TreatmentId {
  const s = style.toLowerCase();
  if (/swiss|minimalism|exaggerated|zero interface|accessible|inclusive/.test(s)) return "swiss";
  if (/liquid glass|glassmorphism|spatial|ai-native/.test(s)) return "glass";
  if (/claymorphism/.test(s)) return "clay";
  if (/organic|biophilic|biomimetic|nature/.test(s)) return "organic";
  if (/neumorphism|soft ui/.test(s)) return "soft";
  if (/vibrant|block|gen z|3d|hyperreal|memphis|maximal/.test(s)) return "block";
  if (/cyberpunk|hud|sci-fi|retro-futur/.test(s)) return "hud";
  if (/dark mode|oled|cinema/.test(s)) return "dark";
  if (/brutal|anti-polish|raw/.test(s)) return "brutal";
  if (/aurora|parallax|gradient mesh/.test(s)) return "aurora";
  if (/editorial|magazine/.test(s)) return "editorial";
  if (/e-ink|paper|sketch|hand-drawn|vintage|analog|pixel/.test(s)) return "paper";
  return "flat";
}

const STOP = new Set("the a an and or for to of in on with by at from is are that this it its their who we you your my our people app apps platform tool service services business businesses help helps make makes get new one way best easy every all can so not no yes more less them they us me i be will would could should have has had do does did into over under out up down about than then there here where when what which how why let lets allow allows each other others life bring come back without any aged ten minute hour day month year quick fast easy simple better best personal trusted busy own real free first last next like just also very really thing things idea ideas dream dreams side tomorrow tonight today".split(" "));

/** Words the tables do not list but founders write, by product type. */
const EXTRA: Record<string, string> = {
  "Membership/Community": "founder founders meet meetup network peers together connect circle group club members belong",
  "Forum / Discussion Board": "forum discuss discussion thread threads questions answers",
  "Fitness/Gym App": "trainer coach workout workouts exercise gym fit fitness training dads mums body muscle strength",
  "Running & Cycling GPS": "run running cycling ride rides route routes pace",
  "Yoga & Stretching Guide": "yoga stretch stretching mobility",
  "Personal Finance Tracker": "numbers takings till cash bookkeeping money spend spending budget week weekly",
  "Analytics Dashboard": "numbers metrics report reports weekly stats dashboard figures",
  "Coworking Space": "room rooms desk desks space quiet hour hourly office",
  "Marketplace (P2P)": "rent renting sell buy handmade secondhand lend borrow swap marketplace",
  "Classifieds / Buy-Sell": "sell selling buy secondhand used handmade",
  "E-commerce": "shop store sell products checkout basket",
  "Recipe & Cooking App": "recipe recipes cook cooking meal meals dinner",
  "Calorie & Nutrition Counter": "meal meals diet diabetes nutrition eating calories food plan",
  "Booking & Appointment App": "book booking bookings appointment appointments slot slots schedule",
  "Home Services (Plumber/Electrician)": "plumber electrician cleaner handyman repair fix fixing trusted home",
  "Beauty/Spa/Wellness Service": "salon barber haircut nails massage beauty",
  "Invoice & Billing Tool": "invoice invoices billing bill bills paid unpaid",
  "API Developer Portal": "api sdk endpoint endpoints webhook webhooks integration developers developer",
  "Developer Tool / IDE": "developers developer code coding deploy repo git",
  "Kids Learning (ABC & Math)": "kids children maths math abc learning games school",
  "Language Learning App": "language languages english greek spanish vocabulary words speak",
  "Online Course/E-learning": "course courses learn learning lessons teach tutorials",
  "Bakery/Cafe": "cafe cafes coffee bakery barista regulars espresso bread loaf loaves pastry pastries croissant croissants cake cakes baker",
  "Restaurant/Food Service": "restaurant restaurants menu table tables diners kitchen",
  "SaaS (General)": "subscription saas software dashboard teams",
  "CRM & Client Management": "clients customers leads pipeline follow followups crm",
  "Inventory & Stock Management": "stock inventory warehouse items",
  "Real Estate/Property": "property properties flat flats apartment apartments landlords tenants rent",
  "Job Board/Recruitment": "jobs job hiring hire candidates recruit",
  "Freelancer Platform": "freelancers freelancer gigs clients projects",
  "Dating App": "dating date dates match matches singles",
  "Habit Tracker": "habit habits streak daily routine",
  "Mental Health App": "anxiety stress therapy therapist calm",
  "Meditation & Mindfulness": "meditation mindfulness breathe breathing calm sleep",
  "Medical Clinic": "clinic doctor doctors patients appointment",
  "Dental Practice": "dentist dental teeth",
  "Veterinary Clinic": "vet vets pets pet dog dogs cat cats",
  "Pet Tech App": "pet pets dog dogs cat cats walks walker",
  "Childcare/Daycare": "nursery childcare babysitter babysitting kids",
  "Senior Care/Elderly": "elderly seniors carers care parents",
  "Logistics/Delivery": "delivery deliveries courier couriers parcels shipping",
  "Food Delivery / On-Demand": "order orders dinner takeaway delivered",
  "Ride Hailing / Transportation": "taxi taxis cab cabs airport ride rides driver drivers lift lifts pool carpool share sharing seat seats",
  "Parking Finder": "parking park spot spots",
  "Travel/Tourism Agency": "travel trips tours tourists holiday",
  "Hotel/Hospitality": "hotel hotels rooms stays guests",
  "Event Management": "events event tickets venue guests",
  "Local Events & Discovery": "events tonight weekend nearby local",
  "Newsletter Platform": "newsletter newsletters subscribers issues",
  "Podcast Platform": "podcast podcasts episodes listeners",
  "Photography Studio": "photographer photos shoot shoots wedding",
  "Wedding/Event Planning": "wedding weddings planner",
  "Legal Services": "lawyer lawyers legal contracts contract",
  "Insurance Platform": "insurance claims claim policy",
  "Sustainable Energy / Climate Tech": "solar energy panels climate carbon",
  "Smart Home/IoT Dashboard": "sensor sensors device devices smart home",
  "Agriculture/Farm Tech": "farm farmers crops harvest field fields",
  "Music Instrument Learning": "guitar piano music instrument practice",
  "Tutoring": "tutor tutors tutoring lessons",
  "Notes & Writing App": "notes writing write notebook",
  "Survey / Form Builder": "survey surveys forms form feedback",
  "Review Platform": "reviews review ratings",
  "Directory / Listing Site": "directory listings find nearby local",
  "Chat & Messaging App": "chat chats messaging messages group groups team teams whatsapp",
  "Email Client": "email emails inbox",
  "Timer & Pomodoro": "focus timer pomodoro",
  "Study Together / Virtual Coworking": "study studying students focus together",
  "Flashcard & Study Tool": "flashcards revision exam exams study",
  "Grocery & Shopping List": "groceries grocery shopping list",
  "Family Calendar & Chores": "family chores household",
  "Parenting & Baby Tracker": "baby babies newborn parents feeding",
  "Plant Care Tracker": "plants plant watering garden",
  "Book & Reading Tracker": "books book reading read",
  "Expense Splitter / Bill Split": "split splitting bills flatmates friends",
  "Subscription Box Service": "box boxes monthly subscription",
  "Crowdfunding Platform": "fund funding backers pledge",
  "Ticketing / Box Office": "tickets ticket seats box office",
  "Auction Platform": "auction auctions bids bid",
  "Cybersecurity Platform": "security passwords breach phishing",
  "Status Page / Incident Management": "uptime incidents status monitoring",
};

/** The words that carry meaning, singular, lower case, unique. */
export function tokens(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().split(/[^a-z0-9]+/)) {
    if (raw.length < 3 || STOP.has(raw)) continue;
    const w = /^(diabetes|series|news|glasses|lens|analysis|basis|crisis|bus|plus)$/.test(raw) ? raw : raw.endsWith("ies") ? `${raw.slice(0, -3)}y` : /(sses|shes|ches|xes)$/.test(raw) ? raw.slice(0, -2) : /(ss|us|is)$/.test(raw) ? raw : raw.endsWith("s") ? raw.slice(0, -1) : raw;
    if (!out.includes(w)) out.push(w);
  }
  return out;
}

export interface Reading {
  product: ProductRow;
  score: number;
}

const SEGMENT_BOOST: Record<string, RegExp> = {
  "b2b-saas": /^(SaaS|Micro SaaS|B2B Service|Productivity Tool|CRM|Analytics Dashboard|Invoice|Inventory|Remote Work|Knowledge Base|Survey)/,
  consumer: /^(Social Media|Habit|Fitness|Recipe|Dating|Personal Finance|Meditation|Mood|Sleep|Diary|Book & Reading|Running|Music Streaming|Podcast|Family Calendar|Couple|Gift|Plant Care|Wardrobe)/,
  marketplace: /^(Marketplace|Classifieds|Directory|Freelancer Platform|Job Board|Auction|Local Events|Review Platform)/,
  services: /^(Booking|Home Services|Beauty|Hyperlocal|Coworking|Medical Clinic|Dental|Veterinary|Photography|Wedding|Event Management|Legal|Childcare|Senior Care|Telemedicine)/,
  hardware: /^(Smart Home|EV|Subscription Box|Autonomous|Sustainable Energy|Space Tech)/,
};

/** The product types the founder's words point to, best first. */
export function readProduct(input: { sign: string; pitch?: string; audience?: string; said?: string[]; segment?: string; kind?: string }): Reading[] {
  const weights: [string[], number][] = [
    [tokens(input.sign), 3],
    [tokens(input.pitch ?? ""), 2],
    [tokens(input.audience ?? ""), 2],
    [tokens((input.said ?? []).join(" ")), 1],
  ];
  const boost = input.segment ? SEGMENT_BOOST[input.segment] : undefined;
  const scored = PRODUCTS.map((p) => {
    let score = 0;
    const keys = new Set([...p.k.flatMap((k) => tokens(k)), ...tokens(p.t), ...tokens(EXTRA[p.t] ?? "")]);
    for (const [ws, w] of weights) for (const t of ws) if (keys.has(t)) score += w;
    // the stand's segment tips a type that the words already point to; on its own it only breaks ties
    if (boost && boost.test(p.t)) score += score > 0 ? 4 : 1;
    return { product: p, score };
  });
  scored.sort((a, b) => b.score - a.score);
  if (scored[0].score === 0) {
    const fallback: Record<string, string> = { saas: "SaaS (General)", consumer: "Social Media App", marketplace: "Marketplace (P2P)", services: "Booking & Appointment App", hardware: "Smart Home/IoT Dashboard" };
    const name = fallback[input.kind ?? "saas"] ?? "SaaS (General)";
    const i = scored.findIndex((s) => s.product.t === name);
    if (i > 0) scored.unshift(...scored.splice(i, 1));
  }
  return scored.slice(0, 6);
}

/** The archetype of the main screen, from what the product is. A product sold to businesses gets a business's screen even when its market is a café or a gym. */
export function archetypeOf(product: ProductRow, kind?: string, b2b = false): Archetype {
  const a = archetypeRaw(product, kind);
  if (!b2b) return a;
  if (a === "store" || a === "listings" || a === "tracker") return "ledger";
  if (a === "feed" || a === "learn" || a === "map") return "dashboard";
  return a;
}

function archetypeRaw(product: ProductRow, kind?: string): Archetype {
  const t = product.t;
  const rules: [RegExp, Archetype][] = [
    [/Financial|Banking|Personal Finance|Invoice|Expense|Insurance|CRM|Inventory|Fintech|Crypto|Bitcoin|Payroll|Grant|Patent|Legal Services|Construction|E-signature/i, "ledger"],
    [/Social Media|Community|Forum|Q&A|Newsletter|Creator|Anonymous|News|Magazine|Podcast|Review Platform|Church|Sports Team|Study Together|Couple|Confession|Citizen Science|Open Source|Changelog|Testimonial/i, "feed"],
    [/E-commerce|Luxury|Bakery|Restaurant|Food Delivery|Brewery|Florist|Pharmacy|Digital Products|Subscription Box|Grocery|Music Streaming|Video Streaming|Wallpaper|Gaming|Game|Meme|Photo Editor|Video Editor|Drawing|Music Creation|AI Photo|Generative Art|Home Decoration|Shopify/i, "store"],
    [/Marketplace|Classifieds|Directory|Job Board|Freelancer|Real Estate|Auction|Travel|Hotel|Airline|Crowdfunding|Recipe|Local Events|Museum|Theater|Ticketing|Gift|Coworking|Wedding|Event Management|Conference|Architecture|Interior|Automotive|Photography Studio|Link-in-Bio|Resume/i, "listings"],
    [/Habit|Mood|Sleep|Water|Hydration|Fasting|Calorie|Nutrition|Period|Medication|Plant Care|Reading Tracker|Book & Reading|Running|Cycling|Meditation|Mental Health|Biohacking|Longevity|Parenting|Baby|Diary|Journal|Timer|Pomodoro|Wardrobe|Family Calendar|Chores|Pet Tech|Alarm|Fitness|Yoga/i, "tracker"],
    [/Booking|Home Services|Beauty|Spa|Hyperlocal|Medical|Dental|Veterinary|Telemedicine|Childcare|Senior Care|Calendar|Scheduling|Salon|Clinic|Patient/i, "bookings"],
    [/Educational|Course|E-learning|LMS|Language|Bootcamp|Flashcard|Study|Kids Learning|Instrument|Coding Challenge|Micro-Credentials|Academic|Research|Wiki|Knowledge Base|Documentation|Scholarly|University|Translator/i, "learn"],
    [/Chat|Messaging|Email|Dating|Remote Work|Collaboration|Chatbot|Voice Recorder|Support/i, "inbox"],
    [/Ride|Logistics|Delivery|Parking|Transit|Road Trip|Tourism|EV|Charging|Drone|Emergency|Weather|Agriculture|Farm|Fleet/i, "map"],
  ];
  for (const [re, a] of rules) if (re.test(t)) return a;
  const byKind: Record<string, Archetype> = { saas: "dashboard", consumer: "feed", marketplace: "listings", services: "bookings", hardware: "dashboard" };
  return byKind[kind ?? "saas"] ?? "dashboard";
}

/** The front door's pattern, from the tables' landing pattern. */
export function landingOf(product: ProductRow, archetype: Archetype): Landing {
  const l = product.l.toLowerCase();
  if (/social proof|wall-of-love|rating/.test(l)) return "proof";
  if (/trust/.test(l)) return "trust";
  if (/minimal/.test(l)) return "minimal";
  if (/storytelling|immersive/.test(l)) return "story";
  if (/interactive|demo|dashboard|monitor|data/.test(l)) return "demo";
  if (/search|directory|filter|grid|index|opportunity/.test(l)) return "search";
  if (/feature-rich|bento|showcase/.test(l)) return "features";
  if (archetype === "listings" || archetype === "store") return "search";
  return "hero";
}

/** Families the fonts service serves at one weight only; asking for others fails the whole request. */
const ONE_WEIGHT = new Set(["Bebas Neue", "Abril Fatface", "Press Start 2P", "VT323", "Righteous", "Russo One", "Great Vibes", "Poiret One", "Anton", "Share Tech Mono", "Calistoga", "Patrick Hand", "Varela Round", "Didact Gothic", "Playfair Display SC"]);

function stackOf(cat: string, family: string): string {
  const c = cat.toLowerCase();
  const generic = /serif/.test(c) && !/sans/.test(c) ? 'ui-serif, Georgia, "Times New Roman", serif' : /mono/.test(c) ? 'ui-monospace, "SF Mono", Menlo, monospace' : /script|hand/.test(c) ? "cursive" : '-apple-system, "Helvetica Neue", Arial, sans-serif';
  return `"${family}", ${generic}`;
}

export interface Fonts {
  name: string;
  heading: string;
  body: string;
  /** CSS stacks with fallbacks. */
  hStack: string;
  bStack: string;
  /** The stylesheet link for the two families. */
  link: string;
}

const LANGUAGE_BOUND = /Vietnamese|Japanese|Korean|Chinese|Arabic|Thai|Hebrew/;

/** Type pairings that suit the product and its style, best first. */
export function rankFonts(product: ProductRow, treatment: Treatment): FontRow[] {
  const want = new Set([...tokens(product.t), ...product.k.flatMap((k) => tokens(k)), ...tokens(product.s.join(" ")), ...tokens(product.l), ...tokens(treatment.name), ...tokens(product.f)]);
  const scored = FONTS.filter((f) => !LANGUAGE_BOUND.test(f.n)).map((f) => {
    let score = 0;
    for (const w of [...f.k, ...f.f].flatMap((x) => tokens(x))) if (want.has(w)) score += 1;
    if (/Wedding|Pixel|Gen Z|Kinetic Motion|Art Deco|Brutalist Raw/.test(f.n) && score < 3) score = -1;
    if (treatment.id === "hud" && /Mono|HUD|Terminal/.test(f.n)) score += 3;
    if (treatment.id === "editorial" && /Serif|Editorial|Magazine/.test(f.n + f.cat)) score += 3;
    if (treatment.id === "brutal" && /Brutal|Bold/.test(f.n)) score += 3;
    if ((treatment.id === "clay" || treatment.id === "soft") && /Rounded|Playful|Soft|Clay/.test(f.n)) score += 2;
    return { f, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.f);
}

export function fontsOf(row: FontRow): Fonts {
  const [hc, bc] = row.cat.split("+").map((x) => x.trim());
  const fam = (name: string) => `family=${name.replace(/ /g, "+")}${ONE_WEIGHT.has(name) ? "" : ":wght@400;700"}`;
  const families = row.h === row.b ? fam(row.h) : `${fam(row.h)}&${fam(row.b)}`;
  return { name: row.n, heading: row.h, body: row.b, hStack: stackOf(hc ?? "sans", row.h), bStack: stackOf(bc ?? hc ?? "sans", row.b), link: `https://fonts.googleapis.com/css2?${families}&display=swap` };
}

// ─── colour ─────────────────────────────────────────────────────────────
const hex = (s: string): [number, number, number] => {
  const h = s.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const toHex = (r: number, g: number, b: number): string => `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
/** Relative luminance, 0 to 1. */
export function luminance(s: string): number {
  const [r, g, b] = hex(s).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
/** a mixed towards b by t. */
export function mix(a: string, b: string, t: number): string {
  const A = hex(a), B = hex(b);
  return toHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
}
export const rgba = (s: string, a: number): string => `rgba(${hex(s).join(",")},${a})`;
/** WCAG contrast ratio between two colours. */
export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

export interface Colours extends Palette {
  dark: boolean;
  /** Four avatar tints and their inks. */
  tints: [string, string][];
}

/** The palette, resolved: dark if the background is, forced dark by the treatment, tints derived. */
export function coloursOf(p: Palette, treatment: Treatment): Colours {
  let c: Palette = { ...p };
  const isDark = luminance(c.bg) < 0.25;
  if (treatment.forceDark && !isDark) {
    c = { ...c, bg: "#0B0F14", fg: "#F1F5F9", card: "#141A22", cf: "#F1F5F9", m: "#1B222C", mf: "#94A3B8", b: "#273241" };
  }
  const dark = luminance(c.bg) < 0.25;
  const tintBase = c.card;
  const tints: [string, string][] = [c.p, c.a, c.s, mix(c.p, c.a, 0.5)].map((x) => [mix(tintBase, x, dark ? 0.35 : 0.16), dark ? mix(x, "#FFFFFF", 0.5) : mix(x, "#000000", 0.35)] as [string, string]);
  return { ...c, dark, tints };
}

// ─── the plan ──────────────────────────────────────────────────────────
export interface PlanInput {
  name: string;
  sign: string;
  pitch?: string;
  audience?: string;
  said?: string[];
  segment?: string;
  kind?: string;
}

export interface StudioPlan {
  seed: number;
  product: ProductRow;
  /** The other readings the seed can turn to. */
  readings: Reading[];
  colours: Colours;
  fonts: Fonts;
  treatment: Treatment;
  archetype: Archetype;
  landing: Landing;
  /** What was chosen and why, in one line. */
  line: string;
}

/** The plan for this founder and this seed. Seed 0 is the best fit; other seeds turn the second and third choices in, one axis at a time. */
export function designPlan(input: PlanInput, seed = 0, chosen?: string): StudioPlan {
  const readings = readProduct(input);
  let product = readings[0].product;
  if (chosen) product = PRODUCTS.find((p) => p.t === chosen) ?? product;
  // seed 0 is the best fit on every axis; every other seed turns the palette (from the runner-up readings), the treatment (from the product's other styles) and the type (from the next pairings) at once, so a different take looks different at a glance and still fits
  const s = Math.abs(seed);
  const paletteFrom = chosen ? product : (readings[s % 3]?.product ?? product);
  const styles = [...new Set((product.s.length ? product.s : ["Flat Design"]).map(treatmentOf))];
  const treatment = T[styles[s % styles.length]];
  const colours = coloursOf(paletteFrom.c, treatment);
  const ranked = rankFonts(product, treatment);
  const fonts = fontsOf(ranked[s % Math.min(4, ranked.length)]);
  const b2b = input.segment === "b2b-saas" || /\b(owners?|businesses|shops?|clinics?|agencies|studios?|teams?|managers?|salons?|restaurants?|landlords?)\b/i.test(input.audience ?? "");
  const archetype = archetypeOf(product, input.kind, b2b);
  const landing = landingOf(product, archetype);
  const line = `Read as ${product.t.toLowerCase()}: ${treatment.name.toLowerCase()} treatment, ${fonts.heading}${fonts.body !== fonts.heading ? ` with ${fonts.body}` : ""}, ${colours.dark ? "dark" : "light"} by default, a ${archetype} main screen.`;
  return { seed, product, readings, colours, fonts, treatment, archetype, landing, line };
}

/** The plan written as a design system a builder can follow: the section of the brief. */
export function planText(p: StudioPlan): string {
  const c = p.colours;
  const t = p.treatment;
  const nav = { tabs: "a bottom tab bar, 4 items, the active one in the primary colour", pill: "a floating pill bar at the bottom, 4 items", top: "segmented tabs under the header, no bottom bar" }[t.nav];
  const shadow = { none: "no shadows; surfaces are separated by the background and hairlines", soft: "soft, wide shadows (0 8px 24px at 8% of the ink), no borders", hard: "hard offset shadows (4px 4px 0) in the ink, under cards and buttons", glow: "a faint glow of the primary colour under the primary button; cards are a shade lighter than the ground" }[t.shadow];
  const border = { hair: "1px hairlines in the border colour", thick: "2px borders in the ink", none: "no borders" }[t.border];
  return [
    `- Feels: ${p.product.f.toLowerCase()}. Read as ${p.product.t.toLowerCase()}; the ${t.name.toLowerCase()} treatment. ${c.dark ? "Dark" : "Light"} by default.`,
    `- Type: headings in ${p.fonts.heading}, body in ${p.fonts.body} (${p.fonts.name}; Google Fonts, with ${p.fonts.hStack.split(",").slice(1).join(",").trim()} as fallback). Display 32/700, title 22/700, body 16/400, label 13/600${t.heading === "upper" ? " uppercase, letter-spacing 1px" : ""}.`,
    `- Colour: background ${c.bg}, surface ${c.card}, ink ${c.fg}, muted ${c.mf}, primary ${c.p} with ${c.op} on it, accent ${c.a} with ${c.oa} on it, secondary ${c.s}, line ${c.b}, danger ${c.x}. The primary appears once or twice a screen, never everywhere.`,
    `- Shape: radius ${t.r[0]}/${t.r[1]}/${t.r[2]} px (controls, cards, sheets); buttons ${t.r[3] >= 999 ? "pill-shaped" : `${t.r[3]} px`}, 50 px high. ${border}. ${shadow}.`,
    `- Spacing: a 4 pt grid, 20 px side margins, 12 px between rows, 16 px between sections.`,
    `- Navigation: ${nav}. Main screen: a ${p.archetype}. Front door: a ${p.landing} pattern.`,
    `- ${referenceLine(p.archetype)}`,
    `- Icons: inline SVG, 1.8 px stroke, 22 px, in the current text colour. No emoji.`,
    `- Pictures: drawn, not stock: ${t.pic} shapes in the primary, secondary and accent colours.`,
    `- Motion: 180 ms ease-out on presses and sheet openings; nothing moves on its own.`,
    `- Never: a purple-to-blue gradient hero, everything centred, a rounded card around every element, identical three-card grids, placeholder grey boxes.`,
  ].join("\n");
}

/** The stylesheet for a plan: the tokens, the parts, the treatment's overrides. */
export function planCss(p: StudioPlan): string {
  const c = p.colours;
  const t = p.treatment;
  const [rs, rm, rl, rb] = t.r;
  const shadow = t.shadow === "soft" ? `0 8px 24px ${rgba(c.fg, c.dark ? 0.35 : 0.08)}` : t.shadow === "hard" ? `4px 4px 0 ${c.fg}` : t.shadow === "glow" ? `0 0 0 1px ${rgba(c.fg, 0.06)}` : "none";
  const btnShadow = t.shadow === "glow" ? `0 8px 24px ${rgba(c.p, 0.45)}` : t.shadow === "hard" ? `4px 4px 0 ${c.fg}` : t.shadow === "soft" ? `0 8px 20px ${rgba(c.p, 0.3)}` : "none";
  const border = t.border === "hair" ? `1px solid ${c.b}` : t.border === "thick" ? `2px solid ${c.fg}` : "1px solid transparent";
  const cardBg = t.surface === "glass" ? rgba(c.card, c.dark ? 0.55 : 0.72) : c.card;
  const glass = t.surface === "glass" ? "backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);" : "";
  const heading = t.heading === "upper" ? "text-transform:uppercase;letter-spacing:.06em;" : t.heading === "tight" ? "letter-spacing:-.02em;" : "letter-spacing:-.01em;";
  // a button must stand off its ground: the primary where it reads, else the accent, else the ink
  const standing = (ground: string, prefer: [string, string][]): [string, string] => prefer.find(([bgc]) => contrast(bgc, ground) >= 2) ?? [c.fg, c.bg];
  const [btnBg, btnFg] = standing(c.bg, [[c.p, c.op], [c.a, c.oa], [c.fg, c.bg]]);
  const heroGround = mix(c.bg, "#000000", 0.35);
  const [heroBtnBg, heroBtnFg] = standing(heroGround, [[c.p, c.op], [c.a, c.oa], [c.fg, c.bg], ["#FFFFFF", "#111111"]]);
  const [fabBg, fabFg] = standing(c.bg, [[c.a, c.oa], [c.p, c.op], [c.fg, c.bg]]);
  const bodyBg = t.hero === "paper" ? `${c.bg} repeating-linear-gradient(0deg,transparent 0 27px,${rgba(c.fg, 0.05)} 27px 28px)` : t.id === "aurora" ? `radial-gradient(120% 80% at 10% 0%,${rgba(c.p, 0.18)},transparent 60%),radial-gradient(90% 70% at 100% 100%,${rgba(c.a, 0.18)},transparent 60%),${c.bg}` : c.bg;
  return `
:root{--bg:${c.bg};--fg:${c.fg};--card:${c.card};--cf:${c.cf};--mut:${c.m};--mf:${c.mf};--line:${c.b};--p:${c.p};--op:${c.op};--s:${c.s};--a:${c.a};--oa:${c.oa};--x:${c.x};--rs:${rs}px;--rm:${rm}px;--rl:${rl}px;--rb:${rb}px;--fh:${p.fonts.hStack};--fb:${p.fonts.bStack};--sh:${shadow};--bd:${border};--cardbg:${cardBg};--ok:${c.dark ? "#4ADE80" : "#15803D"};--warn:${c.dark ? "#FBBF24" : "#B45309"}}
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;overflow:hidden}
body{background:${bodyBg};color:var(--fg);font:15px/1.45 var(--fb);-webkit-font-smoothing:antialiased}
.screen{width:390px;height:844px;position:relative;background:transparent}
.sb{height:54px;display:flex;align-items:flex-end;justify-content:space-between;padding:0 28px 8px;font-size:15px;font-weight:600;flex:none;font-family:-apple-system,"Helvetica Neue",sans-serif}
.sbr{display:flex;gap:6px;align-items:center}
.hi{height:34px;flex:none;display:flex;align-items:center;justify-content:center}
.hi i{display:block;width:134px;height:5px;border-radius:3px;background:currentColor;opacity:.85}
.body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:0 20px}
.body.flush{padding:0}
.ic{display:inline-block;vertical-align:middle;flex:none}
.eyebrow{font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--mf)}
h1{font:700 32px/1.12 var(--fh);${heading}}
h2{font:700 24px/1.18 var(--fh);${heading}}
h3{font:700 17px/1.3 var(--fh);${heading}}
.title{font:700 20px/1.2 var(--fh);${heading}}
.big .title{font-size:28px}
.sub{color:var(--mf);font-size:16px;line-height:1.45}
.hdr{display:flex;align-items:center;gap:12px;padding:8px 20px 12px;flex:none}
.hdr .ht{flex:1;min-width:0}
.hdr .hr{display:flex;gap:8px;align-items:center;min-width:40px;justify-content:flex-end}
.icb{width:40px;height:40px;border-radius:${rb >= 999 ? "50%" : "var(--rm)"};display:inline-flex;align-items:center;justify-content:center;background:var(--cardbg);border:var(--bd);${glass}}
.btn{display:flex;align-items:center;justify-content:center;gap:8px;height:52px;padding:0 20px;border-radius:var(--rb);font:600 16px/1 var(--fb);white-space:nowrap}
.btn.full{width:100%}
.btn.sm{height:40px;font-size:14px;padding:0 16px}
.btn.p{background:${btnBg};color:${btnFg};box-shadow:${btnShadow}${t.border === "thick" ? ";border:2px solid var(--fg)" : ""}}
.btn.s{background:${t.surface === "glass" ? rgba(c.fg, 0.08) : c.dark ? rgba(c.fg, 0.1) : mix(c.bg, c.fg, 0.06)};color:var(--fg)${t.border === "thick" ? ";border:2px solid var(--fg)" : ""}}
.btn.q{background:transparent;color:var(--fg);border:${t.border === "thick" ? "2px solid var(--fg)" : `1.5px solid ${c.b}`}}
.fld{display:block}
.fl{display:block;font-size:13px;font-weight:600;color:var(--mf);margin-bottom:6px}
.fi{display:flex;align-items:center;gap:8px;height:50px;padding:0 16px;border-radius:var(--rm);background:var(--cardbg);border:${t.border === "none" ? `1px solid ${rgba(c.fg, 0.1)}` : "var(--bd)"};color:var(--mf);font-size:16px}
.srch{display:flex;align-items:center;gap:10px;height:46px;padding:0 14px;border-radius:${rb >= 999 ? "999px" : "var(--rm)"};background:${c.dark ? rgba(c.fg, 0.08) : mix(c.bg, c.fg, 0.05)};color:var(--mf);font-size:15px;margin:4px 0 12px}
.card{background:var(--cardbg);border:var(--bd);border-radius:var(--rl);padding:16px;box-shadow:var(--sh);${glass}}
.card.tight{padding:12px}
.av{display:inline-flex;align-items:center;justify-content:center;border-radius:${t.border === "thick" || t.id === "swiss" ? "var(--rs)" : "50%"};font-weight:700;flex:none;font-family:var(--fb)}
.av.t0{background:${c.tints[0][0]};color:${c.tints[0][1]}}.av.t1{background:${c.tints[1][0]};color:${c.tints[1][1]}}.av.t2{background:${c.tints[2][0]};color:${c.tints[2][1]}}.av.t3{background:${c.tints[3][0]};color:${c.tints[3][1]}}
.row{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid ${c.b};min-height:60px}
.row:last-child{border-bottom:0}
.row.card{border-bottom:0;padding:12px;margin-bottom:10px;min-height:0}
.rl{flex:none;display:flex;align-items:center}
.rt{flex:1;min-width:0}
.rn{font-weight:600;font-size:16px;line-height:1.3;color:var(--fg)}
.rm{color:var(--mf);font-size:13px;margin-top:2px;line-height:1.35}
.rr{flex:none;display:flex;align-items:center;gap:6px;color:var(--mf);font-size:14px;font-weight:600}
.rr .ic{color:var(--mf)}
.pl{display:inline-flex;align-items:center;height:28px;padding:0 10px;border-radius:${rb >= 999 ? "999px" : "var(--rs)"};font-size:12px;font-weight:700;white-space:nowrap}
.pl.brand{background:var(--p);color:var(--op)}.pl.soft{background:${c.tints[0][0]};color:${c.tints[0][1]}}.pl.ok{background:${c.dark ? rgba("#4ADE80", 0.18) : "#DCFCE7"};color:var(--ok)}.pl.warn{background:${c.dark ? rgba("#FBBF24", 0.18) : "#FEF3C7"};color:var(--warn)}.pl.line{border:1px solid ${c.b};color:var(--mf)}
.stat{flex:1;min-width:0;display:flex;flex-direction:column;background:var(--cardbg);border:var(--bd);border-radius:var(--rl);padding:14px 14px 12px;box-shadow:var(--sh);${glass}}
.stat .sv{margin-top:auto}
.stat .sl{font-size:12px;font-weight:600;color:var(--mf);${t.heading === "upper" ? "text-transform:uppercase;letter-spacing:.06em" : ""}}
.stat .sv{font:700 30px/1.05 var(--fh);margin:8px 0 6px;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.stat .sd{font-size:12px;font-weight:600;color:var(--ok)}.stat .sd.warn{color:var(--warn)}.stat .sd.mute{color:var(--mf)}
.stats{display:flex;gap:10px}
.seg{display:flex;background:${c.dark ? rgba(c.fg, 0.08) : mix(c.bg, c.fg, 0.06)};border-radius:${rb >= 999 ? "999px" : "var(--rm)"};padding:3px;gap:2px;margin:4px 0 12px}
.seg span{flex:1;text-align:center;height:34px;line-height:34px;border-radius:${rb >= 999 ? "999px" : "var(--rs)"};font-size:14px;font-weight:600;color:var(--mf)}
.seg span.on{background:var(--card);color:var(--fg);box-shadow:0 1px 3px ${rgba(c.fg, 0.14)}}
.chips{display:flex;gap:8px;overflow:hidden;margin:2px 0 12px;flex-wrap:nowrap}
.chip{flex:none;height:34px;padding:0 14px;border-radius:${rb >= 999 ? "999px" : "var(--rs)"};display:inline-flex;align-items:center;font-size:14px;font-weight:600;color:var(--fg);background:var(--cardbg);border:${t.border === "none" ? `1px solid ${rgba(c.fg, 0.1)}` : "var(--bd)"}}
.chip.on{background:var(--fg);color:var(--bg);border-color:var(--fg)}
.sec{display:flex;justify-content:space-between;align-items:baseline;margin:18px 0 8px}
.sec span{font:700 17px/1.2 var(--fh);${heading}}
.sec a{font-size:14px;font-weight:600;color:var(--p)}
.pic{position:relative;overflow:hidden;border-radius:var(--rm);background:${c.dark ? mix(c.card, c.fg, 0.06) : mix(c.bg, c.fg, 0.05)};min-height:120px}
.pic i{position:absolute;display:block}
.pic.thumb{width:64px;height:64px;min-height:0;border-radius:var(--rs);flex:none}
.pic.tile{height:120px;margin:-12px -12px 10px;border-radius:var(--rm) var(--rm) 0 0}
.pic.hero{height:210px;margin:0 0 18px;border-radius:var(--rl)}
.tab{height:82px;flex:none;background:${t.surface === "glass" ? rgba(c.card, 0.8) : c.card};border-top:${t.border === "thick" ? "2px solid var(--fg)" : `1px solid ${c.b}`};display:flex;padding:8px 10px 0;${glass}}
.tab a{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;font-size:11px;font-weight:600;color:var(--mf)}
.tab a.on{color:${contrast(c.p, c.card) >= 2 ? "var(--p)" : "var(--fg)"}}
.tab.pillbar{position:absolute;left:16px;right:16px;bottom:22px;height:64px;border-radius:999px;border:var(--bd);box-shadow:0 12px 32px ${rgba(c.fg, c.dark ? 0.5 : 0.18)};padding:0 8px;align-items:center}
.tab.pillbar a{flex-direction:row;gap:6px;justify-content:center;height:48px;border-radius:999px;font-size:12px}
.tab.pillbar a.on{background:var(--p);color:var(--op);flex:1.6}
.tab.pillbar a:not(.on) span{display:none}
.tab.top{position:static;height:44px;background:transparent;border:0;border-bottom:1px solid ${c.b};padding:0 20px;margin-bottom:8px}
.tab.top a{flex-direction:row;gap:6px;font-size:14px;height:44px;border-bottom:2px solid transparent;margin-bottom:-1px}
.tab.top a.on{border-bottom-color:var(--p);color:var(--fg)}
.tab.top a:not(.on) .ic{display:none}
.chart{display:block;margin:6px 0 2px}
.bars{display:flex;gap:6px;align-items:flex-end;height:120px}
.bar{flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:100%;gap:6px;align-items:center}
.bar i{display:block;width:100%;border-radius:var(--rs) var(--rs) 0 0;background:${mix(c.p, c.card, 0.6)}}
.bar i.on{background:var(--p)}
.bar span{font-size:11px;color:var(--mf);font-weight:600}
.ring{position:relative;display:inline-flex;align-items:center;justify-content:center}
.ring svg{display:block}
.rc{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.rc b{font:700 28px/1 var(--fh)}.rc span{font-size:12px;color:var(--mf);margin-top:4px}
.prog{height:8px;border-radius:999px;background:${c.dark ? rgba(c.fg, 0.12) : mix(c.bg, c.fg, 0.08)};overflow:hidden}
.prog i{display:block;height:100%;background:var(--p);border-radius:999px}
.quote{display:flex;gap:12px;align-items:flex-start;padding:14px;background:var(--cardbg);border:var(--bd);border-radius:var(--rl);box-shadow:var(--sh);${glass}}
.quote p{font:${p.fonts.hStack.includes("serif") && !p.fonts.hStack.includes("sans") ? "italic 500 16px/1.4 var(--fh)" : "500 15px/1.45 var(--fb)"}}
.quote small{display:block;margin-top:6px;color:var(--mf);font-size:13px;font-style:normal}
.feat{display:flex;gap:12px;align-items:flex-start;padding:10px 0}
.feat .ft{width:40px;height:40px;border-radius:var(--rm);display:inline-flex;align-items:center;justify-content:center;background:${c.tints[0][0]};color:${c.tints[0][1]};flex:none}
.feat b{display:block;font-size:16px;font-weight:600}
.feat span{display:block;color:var(--mf);font-size:14px;margin-top:2px}
.inc{display:flex;gap:12px;align-items:flex-start;padding:11px 0;border-bottom:1px solid ${c.b};font-size:16px}
.inc:last-child{border-bottom:0}
.inc .ic{color:var(--p);flex:none;margin-top:1px}
.map{position:relative;overflow:hidden;border-radius:var(--rl);background:${c.dark ? mix(c.card, c.fg, 0.05) : mix(c.bg, c.fg, 0.04)}}
.map .st{position:absolute;background:${c.dark ? rgba(c.fg, 0.14) : rgba(c.fg, 0.1)}}
.map .st.h{left:0;right:0;height:14px}.map .st.v{top:0;bottom:0;width:14px}.map .st.thin{opacity:.5}.map .st.h.thin{height:6px}.map .st.v.thin{width:6px}
.map .route{position:absolute;inset:0;width:100%;height:100%}
.map .pin{position:absolute;color:var(--a)}.map .pin.b{color:var(--p)}
.dots{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin:12px 0}
.dots i{display:block;aspect-ratio:1;border-radius:50%;border:2px solid ${c.b};background:var(--card)}
.dots i.on{background:var(--a);border-color:var(--a)}
.hero{padding:18px 20px 26px;flex:none}
.hero.block{background:var(--p);color:var(--op)}
.hero.block .sub,.hero.block .eyebrow{color:${rgba(c.op, 0.78)}}
.hero.block .fi{background:${rgba(c.op, 0.14)};border-color:${rgba(c.op, 0.3)};color:${rgba(c.op, 0.7)}}
.hero.block .btn.p{background:${contrast(c.a, c.p) >= 1.8 ? "var(--a)" : "var(--op)"};color:${contrast(c.a, c.p) >= 1.8 ? "var(--oa)" : "var(--p)"};box-shadow:none}
.hero.block .fl,.hero.block .muted,.hero.block .small{color:${rgba(c.op, 0.78)}}
.hero.dark .fl,.hero.dark .muted,.hero.dark .small,.hero.dark .sub{color:${rgba(c.fg, 0.72)}}
.hero.dark{background:${heroGround};color:${c.fg}}
.hero.dark .btn.p{background:${heroBtnBg};color:${heroBtnFg};box-shadow:0 10px 30px ${rgba(heroBtnBg, 0.45)}}
.hero.mesh{background:radial-gradient(90% 70% at 15% 10%,${rgba(c.p, 0.35)},transparent 60%),radial-gradient(70% 60% at 100% 80%,${rgba(c.a, 0.35)},transparent 60%),radial-gradient(50% 40% at 60% 40%,${rgba(c.s, 0.25)},transparent 60%)}
.hero.card{padding:12px 20px 20px}
.hero.card .in{background:var(--cardbg);border:var(--bd);border-radius:var(--rl);padding:22px 18px;box-shadow:var(--sh)}
.hero.type{padding-top:34px}
.hero.type h1{font-size:40px;line-height:1.05}
.hero.paper h1{font-size:34px}
.mark{display:flex;align-items:center;gap:8px;font:700 17px var(--fh);margin-bottom:22px}
.mark i{width:28px;height:28px;border-radius:${rb >= 999 ? "50%" : "var(--rs)"};display:inline-flex;align-items:center;justify-content:center;background:var(--a);color:var(--oa);font-size:14px;font-style:normal}
.hero.block .mark i{background:var(--oa);color:var(--a)}
.fab{position:absolute;right:20px;bottom:${t.nav === "pill" ? 100 : 98}px;height:52px;padding:0 20px 0 16px;border-radius:999px;background:${fabBg};color:${fabFg};display:flex;align-items:center;gap:8px;font-weight:600;box-shadow:0 10px 24px ${rgba(c.fg, 0.28)}}
.tile{background:var(--cardbg);border:var(--bd);border-radius:var(--rm);padding:12px;box-shadow:var(--sh);${glass}overflow:hidden}
.tiles{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.tile b{display:block;font-size:15px;font-weight:600;line-height:1.3}
.tile span{display:block;color:var(--mf);font-size:13px;margin-top:2px}
.tile .price{display:block;font:700 16px/1 var(--fh);margin-top:8px;color:var(--fg)}
.post{padding:14px 0;border-bottom:1px solid ${c.b}}
.post .ph{display:flex;gap:10px;align-items:center;margin-bottom:8px}
.post .ph b{display:block;font-size:15px}.post .ph span{display:block;font-size:12px;color:var(--mf)}
.post p{font-size:15px;line-height:1.5}
.post .acts{display:flex;gap:18px;margin-top:10px;color:var(--mf);font-size:13px;font-weight:600}
.post .acts span{display:inline-flex;align-items:center;gap:5px}
.bubble{max-width:78%;padding:10px 14px;border-radius:var(--rl);font-size:15px;line-height:1.4;margin-bottom:8px;background:var(--cardbg);border:var(--bd)}
.bubble.me{margin-left:auto;background:var(--p);color:var(--op);border:0}
.day{display:flex;gap:8px;margin:4px 0 14px}
.day span{flex:1;text-align:center;padding:8px 0;border-radius:var(--rm);background:var(--cardbg);border:var(--bd);font-size:12px;font-weight:600;color:var(--mf)}
.day span b{display:block;font:700 17px/1.2 var(--fh);color:var(--fg);margin-top:2px}
.day span.on{background:var(--p);color:${rgba(c.op, 0.85)}}.day span.on b{color:var(--op)}
.slots{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.slots span{padding:10px 0;text-align:center;border-radius:var(--rm);border:${t.border === "thick" ? "2px solid var(--fg)" : `1.5px solid ${c.b}`};font-weight:600;font-size:14px}
.slots span.on{background:var(--p);color:var(--op);border-color:var(--p)}
.slots span.off{opacity:.4}
.price-big{display:flex;align-items:baseline;gap:8px;margin-top:6px}
.price-big b{font:700 60px/1 var(--fh);letter-spacing:-.03em}
.trust{display:flex;gap:12px;align-items:center;padding:14px;border-radius:var(--rl);background:${c.tints[0][0]};color:${c.tints[0][1]};margin-top:12px}
.trust b{display:block;font-size:14px}.trust span{display:block;font-size:13px;opacity:.85;margin-top:2px}
.badges{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}
.badges span{display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 12px;border-radius:${rb >= 999 ? "999px" : "var(--rs)"};background:var(--cardbg);border:var(--bd);font-size:13px;font-weight:600}
.steps{display:flex;flex-direction:column;gap:14px;margin-top:6px}
.step{display:flex;gap:14px;align-items:flex-start}
.step i{width:32px;height:32px;border-radius:50%;background:var(--fg);color:var(--bg);display:inline-flex;align-items:center;justify-content:center;font:700 14px var(--fb);font-style:normal;flex:none}
.step b{display:block;font-size:16px}.step span{display:block;color:var(--mf);font-size:14px}
.demo{margin:18px 0 6px;transform:rotate(-1.5deg)}
.faces{display:flex;align-items:center;gap:10px;margin-top:16px;color:var(--mf);font-size:13px}
.faces .av{margin-left:-10px;border:2px solid var(--bg)}.faces .av:first-child{margin-left:0}
.center{text-align:center}
.spread{display:flex;justify-content:space-between;align-items:center}
.gap8{display:flex;flex-direction:column;gap:8px}.gap12{display:flex;flex-direction:column;gap:12px}
.mt8{margin-top:8px}.mt12{margin-top:12px}.mt16{margin-top:16px}.mt24{margin-top:24px}.mb12{margin-bottom:12px}
.muted{color:var(--mf)}.small{font-size:13px}.strong{font-weight:600}
.end{height:${t.nav === "pill" ? 110 : 24}px}
.end.after-fab{height:${t.nav === "pill" ? 150 : 90}px}
.mono{font-variant-numeric:tabular-nums}
.bal{background:${t.id === "aurora" || t.id === "glass" ? `linear-gradient(135deg,${c.p},${mix(c.p, c.a, 0.55)})` : "var(--p)"};color:var(--op);border-radius:var(--rl);padding:18px 18px 16px;box-shadow:${t.shadow === "none" ? "none" : `0 14px 30px ${rgba(c.p, 0.35)}`}${t.border === "thick" ? ";border:2px solid var(--fg)" : ""}}
.bal .bl{font-size:13px;font-weight:600;opacity:.8}
.bal .bv{font:700 38px/1.05 var(--fh);letter-spacing:-.02em;margin:8px 0 14px;font-variant-numeric:tabular-nums}
.bal .bf{display:flex;justify-content:space-between;font-size:13px;opacity:.85}
.qa{display:flex;justify-content:space-between;margin:16px 0 6px}
.qa .q{display:flex;flex-direction:column;align-items:center;gap:6px;width:72px;font-size:12px;font-weight:600;color:var(--fg)}
.qa .q i{width:52px;height:52px;border-radius:${rb >= 999 ? "50%" : "var(--rm)"};display:inline-flex;align-items:center;justify-content:center;background:var(--cardbg);border:var(--bd);box-shadow:var(--sh);color:var(--fg);${glass}}
.qa .q:first-child i{background:var(--p);color:var(--op);border-color:var(--p)}
.dayh{display:flex;justify-content:space-between;font-size:12px;font-weight:700;color:var(--mf);${t.heading === "upper" ? "text-transform:uppercase;letter-spacing:.06em;" : ""}margin:18px 0 2px}
.stories{display:flex;gap:14px;overflow:hidden;padding:4px 0 10px}
.stories .st{display:flex;flex-direction:column;align-items:center;gap:6px;font-size:11px;font-weight:600;color:var(--mf);flex:none}
.stories .ring-av{display:inline-flex;padding:3px;border-radius:50%;background:linear-gradient(135deg,var(--p),var(--a))}
.stories .ring-av .av{border:2px solid var(--bg)}
.stories .you .ring-av{background:var(--line)}
.cats{display:flex;gap:6px;overflow:hidden;padding:2px 0 10px;border-bottom:1px solid ${c.b};margin-bottom:12px}
.cats .cat{flex:none;display:flex;flex-direction:column;align-items:center;gap:6px;width:68px;padding:6px 0 8px;font-size:11px;font-weight:600;color:var(--mf);border-bottom:2px solid transparent}
.cats .cat.on{color:var(--fg);border-bottom-color:var(--fg)}
.rate{display:inline-flex;align-items:center;gap:4px;font-size:13px;font-weight:600;color:var(--fg)}
.rate .ic{color:var(--fg)}.rate span{color:var(--mf);font-weight:500}
.tile{position:relative}
.tile .heart{position:absolute;top:10px;right:10px;width:32px;height:32px;border-radius:50%;background:${rgba(c.card, 0.9)};display:inline-flex;align-items:center;justify-content:center;color:var(--fg);box-shadow:0 2px 6px ${rgba(c.fg, 0.15)}}
.tile .rate{display:inline-flex;color:var(--fg);margin:0;flex:none}.tile .rate span{display:inline;margin:0}
.tile .spread b{display:inline}
.unit{display:flex;justify-content:space-between;align-items:center;background:var(--p);color:var(--op);border-radius:var(--rl);padding:14px 16px;margin-bottom:8px}
.unit .eyebrow{color:${rgba(c.op, 0.75)}}
.unit b{font:700 18px/1.2 var(--fh)}
.ustats{display:flex;gap:10px}
.ustats span{display:inline-flex;align-items:center;gap:4px;font-weight:700;font-size:14px;background:${rgba(c.op, 0.16)};padding:6px 10px;border-radius:999px}
.path{display:flex;flex-direction:column;gap:18px;padding:14px 0 6px;position:relative}
.path:before{content:"";position:absolute;left:105px;top:0;bottom:0;border-left:3px dashed ${c.b}}
.node{display:flex;align-items:center;gap:12px;width:220px;position:relative}
.node i{width:66px;height:66px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;flex:none;background:var(--card);border:var(--bd);color:var(--mf);box-shadow:0 6px 0 ${rgba(c.fg, 0.12)}}
.node.done i{background:var(--p);color:var(--op);border-color:var(--p);box-shadow:0 6px 0 ${mix(c.p, "#000000", 0.25)}}
.node.now i{background:var(--a);color:var(--oa);border-color:var(--a);box-shadow:0 6px 0 ${mix(c.a, "#000000", 0.25)};transform:scale(1.08)}
.node.locked i{opacity:.55}
.node b{font-size:14px;font-weight:600;line-height:1.2}
.node.locked b{color:var(--mf)}
.agenda{display:flex;flex-direction:column;gap:8px}
.slot{display:flex;gap:10px;align-items:stretch}
.slot .tm{width:46px;flex:none;font-size:12px;font-weight:600;color:var(--mf);padding-top:8px;font-variant-numeric:tabular-nums}
.slot .blk{flex:1;border-radius:var(--rm);padding:10px 12px;display:flex;flex-direction:column;justify-content:center;border-left:4px solid var(--p)}
.slot .blk b{font-size:15px;font-weight:600;display:block}.slot .blk span{font-size:12px;opacity:.85;display:block;margin-top:2px}
.slot .blk.t0{background:${c.tints[0][0]};color:${c.tints[0][1]};border-left-color:${c.p}}.slot .blk.t1{background:${c.tints[1][0]};color:${c.tints[1][1]};border-left-color:${c.a}}.slot .blk.t2{background:${c.tints[2][0]};color:${c.tints[2][1]};border-left-color:${c.s}}.slot .blk.t3{background:var(--cardbg);color:var(--mf);border-left-color:${c.b};border:1px dashed ${c.b}}
.sheet{background:var(--card);border-radius:var(--rl) var(--rl) 0 0;padding:8px 20px 12px;margin:-28px -20px 0;position:relative;box-shadow:0 -10px 30px ${rgba(c.fg, 0.18)}}
.sheet .handle{display:block;width:40px;height:5px;border-radius:3px;background:${c.b};margin:0 auto 12px}
.opt{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:var(--rm);border:1.5px solid transparent;margin-bottom:6px}
.opt.on{border-color:var(--fg);background:var(--cardbg)}
.opt b{font-size:16px}
.promo{position:relative;border-radius:var(--rl);overflow:hidden;background:var(--cardbg);border:var(--bd);display:flex;min-height:150px;margin-bottom:4px}
.promo .promo-pic{position:absolute;inset:0;min-height:0;border-radius:0}
.promo .promo-t{position:relative;padding:16px;width:60%;display:flex;flex-direction:column;justify-content:center;background:linear-gradient(90deg,var(--card) 60%,transparent)}
.promo .promo-t b{font:700 18px/1.2 var(--fh);display:block;margin-top:4px}
.tile.prod .add{position:absolute;right:20px;margin-top:-30px;width:34px;height:34px;border-radius:50%;background:var(--fg);color:var(--bg);display:inline-flex;align-items:center;justify-content:center;box-shadow:0 4px 10px ${rgba(c.fg, 0.25)}}
.cartbar{position:absolute;left:16px;right:16px;bottom:${t.nav === "pill" ? 96 : 94}px;height:56px;border-radius:${rb >= 999 ? "999px" : "var(--rm)"};background:var(--fg);color:var(--bg);display:flex;align-items:center;gap:12px;padding:0 8px 0 8px;box-shadow:0 12px 30px ${rgba(c.fg, 0.35)}}
.cartbar .cnt{width:40px;height:40px;border-radius:${rb >= 999 ? "50%" : "var(--rs)"};background:${rgba(c.bg, 0.18)};display:inline-flex;align-items:center;justify-content:center;font-weight:700}
.cartbar .tot{flex:1;font-weight:700;font-size:16px;font-variant-numeric:tabular-nums}
.cartbar b{display:inline-flex;align-items:center;gap:6px;padding-right:10px;font-size:15px}
.stepper{display:inline-flex;align-items:center;gap:14px;height:44px;padding:0 10px;border-radius:${rb >= 999 ? "999px" : "var(--rm)"};border:1.5px solid ${c.b}}
.stepper span{width:28px;height:28px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:${c.dark ? rgba(c.fg, 0.1) : mix(c.bg, c.fg, 0.06)}}
.stepper b{min-width:16px;text-align:center;font-variant-numeric:tabular-nums}
.rings{display:flex;justify-content:space-between;gap:8px}
.rings .rg{flex:1;display:flex;justify-content:center}
.ring.c1 circle:last-child{stroke:var(--a)}.ring.c2 circle:last-child{stroke:var(--s)}
.trio{display:flex;border-top:1px solid ${c.b};border-bottom:1px solid ${c.b};padding:12px 0;margin:14px 0}
.trio div{flex:1;text-align:center;border-left:1px solid ${c.b}}.trio div:first-child{border-left:0}
.trio b{display:block;font:700 22px/1.1 var(--fh);font-variant-numeric:tabular-nums}.trio span{font-size:12px;color:var(--mf);font-weight:600}
.spark{display:block;flex:none}
.unread{min-width:22px;height:22px;padding:0 7px;border-radius:999px;background:var(--p);color:var(--op);font-size:12px;font-weight:700;display:inline-flex;align-items:center;justify-content:center}
.ticks{display:inline-flex;color:var(--mf)}.ticks .ic+.ic{margin-left:-8px}.ticks.read{color:var(--p)}
.sdot{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--mf)}
.sdot i{width:8px;height:8px;border-radius:50%;background:var(--mf)}.sdot.ok i{background:var(--ok)}.sdot.warn i{background:var(--warn)}
.tl{display:flex;flex-direction:column;gap:0;margin-top:8px}
.tls{display:flex;gap:14px;align-items:flex-start;padding-bottom:18px;position:relative}
.tls:before{content:"";position:absolute;left:11px;top:24px;bottom:0;border-left:2px solid ${c.b}}
.tls:last-child:before{display:none}
.tls i{width:24px;height:24px;border-radius:50%;flex:none;display:inline-flex;align-items:center;justify-content:center;background:var(--card);border:2px solid ${c.b};color:var(--op)}
.tls.done i{background:var(--p);border-color:var(--p)}.tls.now i{border-color:var(--p);box-shadow:0 0 0 4px ${rgba(c.p, 0.2)}}
.tls b{display:block;font-size:15px}.tls span{font-size:13px;color:var(--mf)}
.tls.next b{color:var(--mf)}
.bubble.withtail{border-bottom-left-radius:4px}.bubble.me.withtail{border-bottom-left-radius:var(--rl);border-bottom-right-radius:4px}
.datepill{display:block;width:max-content;margin:6px auto 12px;padding:4px 10px;border-radius:999px;background:${c.dark ? rgba(c.fg, 0.1) : mix(c.bg, c.fg, 0.07)};font-size:12px;font-weight:600;color:var(--mf)}
.inbar{display:flex;gap:8px;align-items:center;padding:8px 16px 6px;flex:none}
.inbar .fi{flex:1;height:44px}
.mappill{position:absolute;left:50%;transform:translateX(-50%);bottom:${t.nav === "pill" ? 102 : 100}px;height:44px;padding:0 18px;border-radius:999px;background:var(--fg);color:var(--bg);display:inline-flex;align-items:center;gap:8px;font-weight:700;box-shadow:0 10px 24px ${rgba(c.fg, 0.3)}}
.bar i{border-radius:4px 4px 0 0}
${t.id === "brutal" ? ".card,.stat,.tile,.quote,.icb,.chip,.fi{box-shadow:4px 4px 0 var(--fg)}.btn.p{box-shadow:4px 4px 0 var(--fg)}.row{border-bottom:2px solid var(--fg)}" : ""}
${t.id === "hud" ? ".card,.stat,.tile{border:1px solid " + rgba(c.p, 0.4) + ";box-shadow:inset 0 0 0 1px " + rgba(c.p, 0.08) + "}.eyebrow,.stat .sl{color:" + c.p + "}" : ""}
${t.id === "clay" ? ".card,.stat,.tile,.quote,.btn.p{box-shadow:inset 0 -6px 12px " + rgba(c.fg, 0.08) + ",inset 0 4px 8px rgba(255,255,255,.45),0 12px 24px " + rgba(c.fg, 0.1) + "}" : ""}
${t.id === "editorial" ? ".row{border-bottom:1px solid var(--fg)}.sec span{font-style:italic}" : ""}
[data-go]{cursor:pointer}
`;
}
