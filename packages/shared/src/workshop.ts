/**
 * The Workshop: the start-up, mocked up. From what the building already
 * knows (the sign, who it is for, what people said, the price said out
 * loud, the decisions in the notebook) the desk writes the first three
 * screens of the thing, a build brief, and a prompt ready to paste into
 * whatever builds it: Lovable, Bolt or v0 for a founder who does not
 * code, Claude Code for one who does. The model writes it when there is
 * a key; these rules write it when there is not, so the page is never
 * empty, and a founder with nothing on the sign yet sees a sample.
 */
import { HOUSE_RULES } from "./prompts/index.ts";
import type { StandRecord } from "./types.ts";
import type { Profile } from "./profile.ts";

export type ScreenKind = "landing" | "signup" | "pricing" | "app" | "checkout";
/** The named looks: each is a different typeface, hero, palette, navigation and section shape, not a recolour. */
export type LookPreset = "startup" | "editorial" | "studio" | "playful" | "minimal";
/** What kind of thing it is; the layouts follow (a dashboard, a feed, listings, bookings, a product page). */
export type ProductKind = "saas" | "consumer" | "marketplace" | "services" | "hardware";

/** From the stand's segment first, then the words on the sign. */
export function kindOf(segment: string | undefined, oneLiner: string): ProductKind {
  if (segment === "b2b-saas") return "saas";
  if (segment === "consumer") return "consumer";
  if (segment === "marketplace") return "marketplace";
  if (segment === "services") return "services";
  if (segment === "hardware") return "hardware";
  const t = oneLiner.toLowerCase();
  if (/\b(book|booking|appointment|appointments|session|sessions|clinic|salon|coach|coaching|tutor|cleaning|repair)\b/.test(t)) return "services";
  if (/\b(marketplace|buy and sell|sellers|buyers|listings|rent|renting|hire)\b/.test(t)) return "marketplace";
  if (/\b(device|sensor|hardware|kit|machine|wearable|printer|camera|robot)\b/.test(t)) return "hardware";
  if (/\b(friends|family|game|habit|journal|fitness|recipes|music|photos|dating|kids|parents)\b/.test(t)) return "consumer";
  return "saas";
}

export interface MockScreen {
  kind: ScreenKind;
  /** The screen's name in the flow: "The front door". */
  title: string;
  headline: string;
  sub: string;
  /** The one button. */
  cta: string;
  /** Inputs on the screen, by label. */
  fields: string[];
  /** Three short lines: what you get, or what the app shows. */
  bullets: string[];
  /** For a pricing or checkout screen. */
  price?: string;
  /** For the app screen: the one number that matters, and a plausible value. */
  stat?: { label: string; value: string };
}

export interface Mockup {
  name: string;
  oneLiner: string;
  audience: string;
  screens: MockScreen[];
  /** The one path through it, in a sentence. */
  path: string;
  /** What the thing keeps: three or four nouns. */
  keeps: string[];
  source: "live" | "rehearsal" | "sample";
  at: string;
  /** The sign it was drawn from, so a changed sign can be noticed. */
  seed?: string;
  /** The founder changed words by hand; a redraw must be asked for. */
  edited?: boolean;
  /** The look: a brand hue, a preset (or a shuffle seed that mixes the parts). Set by the model or the founder; otherwise steady from the name. */
  theme?: { hue: number; style: "clean" | "bold" | "soft"; preset?: LookPreset; seed?: number };
  kind?: ProductKind;
  /** What customers said, with who said it, for the front door's testimonial. */
  quotes?: { who: string; said: string }[];
  /** The design the model wrote (a whole HTML document, prepared), and the direction it was given. Absent in practice mode. */
  design?: { html: string; direction: string; seed: number; at: string };
}

export const SAMPLE_MOCKUP_INPUT = { name: "Lantern", oneLiner: "Prepaid passes for the cafés people come back to.", audience: "independent café owners", price: "€40 a month" };

/** The first money amount in a line: "€40 a month" from "Maria said she would pay €40 a month". */
export function priceIn(lines: string[]): string | null {
  for (const l of lines) {
    const m = l.match(/([€$£]\s?\d[\d,.]*\s?(?:k|K)?(?:\s?(?:a|per|\/)\s?(?:month|mo|week|year|yr|day|seat|user))?)/);
    if (m) return m[1].replace(/\s+/g, " ").trim();
    const n = l.match(/(\d[\d,.]*\s?(?:€|euros|euro|eur|dollars|usd|pounds|gbp)(?:\s?(?:a|per|\/)\s?(?:month|mo|week|year|yr))?)/i);
    if (n) return n[1].trim();
  }
  return null;
}

/** A short quote from a customer line, for a bullet: the part after the colon, trimmed to a clause. */
function quoteOf(line: string): string | null {
  const after = line.includes(":") ? line.slice(line.indexOf(":") + 1) : line;
  const clause = after.replace(/^[\s"“]+|[\s"”.]+$/g, "").split(/[.;]|, and | but /)[0]?.trim();
  return clause && clause.length >= 8 && clause.length <= 70 ? `"${clause.charAt(0).toUpperCase()}${clause.slice(1)}"` : null;
}

/** First names from lines like "Maria: ..." or "Kostas said ...", for the one screen's activity. */
export function namesIn(lines: string[]): string[] {
  const out: string[] = [];
  for (const l of lines) {
    const m = l.match(/^\s*([A-Z][a-zà-ÿ]+)(?:\s*[:(]|\s+(?:said|told|wants|would|pays|paid|asked))/);
    if (m && !out.includes(m[1])) out.push(m[1]);
  }
  return out;
}

/** "prepaid passes" to "prepaid pass", "weekly numbers" to "weekly number", "entries" to "entry". */
export function singular(phrase: string): string {
  const w = phrase.trim().split(/\s+/);
  const last = w.pop() ?? "";
  const one = /(ss|us|is)$/.test(last) ? last : /sses$|shes$|ches$|xes$/.test(last) ? last.slice(0, -2) : /ies$/.test(last) ? `${last.slice(0, -3)}y` : /s$/.test(last) ? last.slice(0, -1) : last;
  return [...w, one].join(" ");
}

/** The mock-up without a model: three screens from the sign, the audience, the price said out loud and what customers said. */
export function localMockup(input: { name?: string; oneLiner?: string; audience?: string; price?: string; said?: string[]; segment?: string }, profile?: Profile | null): Mockup {
  const sample = !input.oneLiner?.trim();
  const name = (input.name || SAMPLE_MOCKUP_INPUT.name).trim();
  const oneLiner = (input.oneLiner || SAMPLE_MOCKUP_INPUT.oneLiner).trim().replace(/[.!]$/, "");
  const audience = (input.audience || profile?.audiences || SAMPLE_MOCKUP_INPUT.audience).trim().replace(/[.!]$/, "");
  const said = sample ? [] : (input.said ?? []);
  const price = (input.price || priceIn(said) || (sample ? SAMPLE_MOCKUP_INPUT.price : "")).trim();
  const quotes = [...said.filter((l) => l.includes(":")), ...said.filter((l) => !l.includes(":"))].map(quoteOf).filter((q): q is string => !!q).slice(0, 2);
  const quoted = said.filter((l) => l.includes(":")).map((l) => ({ who: l.slice(0, l.indexOf(":")).trim(), said: l.slice(l.indexOf(":") + 1).trim().replace(/^["“]|["”]$/g, "") })).filter((q) => q.who.length <= 30 && q.said.length >= 12).slice(0, 2);
  const kind = kindOf(input.segment, oneLiner);
  // what it does, from the sign: the noun phrase before "for", if there is one
  // "Rent a quiet room by the hour" is about a quiet room; "Prepaid passes for the cafés..." about prepaid passes
  const thing = oneLiner.split(/\s+for\s+/i)[0].replace(/\s+(by|per|a|an|every)\s+(the\s+)?(hour|day|week|month|year|night|visit|seat)s?\.?$/i, "").replace(/^(rent|book|buy|get|find|order|hire|sell|share)\s+(a|an|the|your)?\s*/i, "").trim();
  const unit = singular(thing.toLowerCase().replace(/^(a|an|the)\s+/, "").split(/\s+/).slice(-2).join(" "));
  const who = [...namesIn(said), "Maria", "Kostas", "Eleni"].slice(0, 3);
  const activity = [`${who[0]} signed up`, `${who[1]} paid for a ${unit || "month"}`, `${who[2]} came back`];
  const landingBullets = [...quotes, `What you get: ${thing.charAt(0).toLowerCase()}${thing.slice(1)}`, price ? `${price}, cancel any time` : "One price, said plainly", "Try it this week, no card"].slice(0, 3);
  const screens: MockScreen[] = [
    { kind: "landing", title: "The front door", headline: oneLiner, sub: `For ${audience}.`, cta: "Start free", fields: ["Your email"], bullets: landingBullets },
    { kind: "app", title: "The one screen", headline: `${name}, this week`, sub: "One path. No settings, no menus.", cta: "Add one", fields: [], bullets: activity, stat: { label: sample ? "Passes used this week" : `${thing.split(" ").slice(-2).join(" ")} this week`, value: "12" } },
    { kind: "pricing", title: "The price", headline: price ? `${price}, cancel any time` : "One plan, cancel any time", sub: "The first week is free. No tiers.", cta: "Start the free week", fields: ["Card"], bullets: ["Everything, no tiers", "Stop whenever", "A person answers email"], price: price || "€ ?" },
  ];
  const keeps: Record<ProductKind, string[]> = { saas: ["accounts", "the one thing they do", "payments"], consumer: ["accounts", "posts", "follows", "payments"], marketplace: ["accounts", "listings", "orders", "payments"], services: ["accounts", "bookings", "availability", "payments"], hardware: ["orders", "devices", "payments"] };
  return { name, oneLiner, audience, screens, path: `Someone from ${audience} lands on the front door, leaves an email, uses the one screen once, and pays${price ? ` ${price}` : ""}.`, keeps: keeps[kind], source: sample ? "sample" : "rehearsal", at: new Date().toISOString(), seed: `${name}|${oneLiner}|${audience}|${price}|${kind}`, kind, quotes: quoted };
}

export const MOCKUP_PROMPT = `You mock up the first version of one founder's product from what they have written down. Return JSON only, with keys: name, oneLiner (under 12 words, no adjective that needs defending), audience (who pays, in their words), path (one sentence: how one person goes from landing to paying), keeps (3 or 4 nouns the product must store), screens (array of exactly 3 objects, in order: kind "landing", then "app", then "pricing"; each with title (under 5 words), headline (under 10 words), sub (under 16 words), cta (the one button, under 4 words), fields (0 to 2 input labels), bullets (exactly 3 lines, under 9 words each), for the app screen a stat (object with label, the one number that matters, and value, a plausible small number as a string), and for pricing a price (a real number the founder said, or the nearest honest guess marked with a question mark)). Also kind: one of saas, consumer, marketplace, services, hardware (what the product is; the layout follows). Also quotes: up to 2 objects with who (a customer's first name from the notebook) and said (their exact words), only if the notebook has them. Also theme: an object with hue (0 to 360, a brand colour that suits the product; avoid 40 to 75) and style (one of clean, bold, soft). For the app screen's bullets write three activity lines a real user would see, with the customers' first names where the notebook has them. Use their customers' exact words from the notebook where you can, quoted. Never invent customers or numbers. No prose outside the JSON.`;

/** One mock-up from the model's reply, or null. */
export function asMockup(v: unknown): Omit<Mockup, "source" | "at"> | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const s = (x: unknown, max: number) => (typeof x === "string" && x.trim() ? x.trim().slice(0, max) : null);
  const list = (x: unknown, max: number, each: number) => (Array.isArray(x) ? x.map((y) => s(y, each)).filter((y): y is string => !!y).slice(0, max) : []);
  const name = s(o.name, 40), oneLiner = s(o.oneLiner, 120), audience = s(o.audience, 80), path = s(o.path, 240);
  if (!name || !oneLiner || !audience || !path || !Array.isArray(o.screens)) return null;
  const kinds: ScreenKind[] = ["landing", "signup", "pricing", "app", "checkout"];
  const screens: MockScreen[] = [];
  for (const x of o.screens.slice(0, 4)) {
    const y = (x ?? {}) as Record<string, unknown>;
    const headline = s(y.headline, 90), cta = s(y.cta, 30);
    if (!headline || !cta) continue;
    const sc: MockScreen = { kind: kinds.includes(y.kind as ScreenKind) ? (y.kind as ScreenKind) : "app", title: s(y.title, 40) ?? "Screen", headline, sub: s(y.sub, 140) ?? "", cta, fields: list(y.fields, 2, 30), bullets: list(y.bullets, 3, 70) };
    const price = s(y.price, 40);
    if (price) sc.price = price;
    const st = (y.stat ?? null) as Record<string, unknown> | null;
    const label = st ? s(st.label, 40) : null, value = st ? s(st.value, 12) : null;
    if (label && value) sc.stat = { label, value };
    screens.push(sc);
  }
  if (screens.length < 2) return null;
  const th = (o.theme ?? null) as Record<string, unknown> | null;
  const hue = th && typeof th.hue === "number" && th.hue >= 0 && th.hue < 360 ? Math.round(th.hue) : null;
  const style = th && ["clean", "bold", "soft"].includes(String(th.style)) ? (th.style as "clean" | "bold" | "soft") : "clean";
  const kinds2: ProductKind[] = ["saas", "consumer", "marketplace", "services", "hardware"];
  const kind = kinds2.includes(o.kind as ProductKind) ? (o.kind as ProductKind) : undefined;
  const quotes = Array.isArray(o.quotes) ? o.quotes.map((q) => { const y = (q ?? {}) as Record<string, unknown>; const who = s(y.who, 30), said = s(y.said, 160); return who && said ? { who, said } : null; }).filter((q): q is { who: string; said: string } => !!q).slice(0, 2) : [];
  return { name, oneLiner, audience, screens, path, keeps: list(o.keeps, 4, 30), ...(hue !== null ? { theme: { hue, style } } : {}), ...(kind ? { kind } : {}), quotes };
}

/** The build brief: one document a builder can work from, in plain words. */
export function buildBrief(m: Mockup, opts?: { record?: Partial<StandRecord> | null; notes?: string[] }): string {
  const lines = [
    `# ${m.name}`,
    "",
    `**What it is.** ${m.oneLiner}.`,
    `**Who pays.** ${m.audience}.`,
    `**The one path.** ${m.path}`,
    "",
    "## Screens",
    ...m.screens.flatMap((sc, i) => [
      `### ${i + 1}. ${sc.title} (${sc.kind})`,
      `- Headline: "${sc.headline}"`,
      sc.sub ? `- Under it: "${sc.sub}"` : "",
      `- The one button: "${sc.cta}"`,
      sc.fields.length ? `- Inputs: ${sc.fields.join(", ")}` : "- Inputs: none",
      sc.bullets.length ? `- Shows: ${sc.bullets.join("; ")}` : "",
      sc.price ? `- Price: ${sc.price}` : "",
      sc.stat ? `- The one number, big: ${sc.stat.label} (e.g. ${sc.stat.value})` : "",
      "",
    ]),
    "## What it keeps",
    ...m.keeps.map((k) => `- ${k}`),
    "",
    "## Rules",
    "- One path, no settings, no dashboard. If a screen is not in the list above, it does not exist yet.",
    "- Plain words on every screen. No adjective that needs defending.",
    "- Mobile first; it must work on a phone in a café.",
    "- Email sign-up with a magic link; no passwords.",
    "- Payments through Stripe Checkout; one plan.",
    "- Ship the ugly version first. Polish is a later task.",
  ];
  if (opts?.record?.publicPricing) lines.push("", `Public pricing as written on the stand: ${opts.record.publicPricing}`);
  if (opts?.notes?.length) lines.push("", "## What customers actually said", ...opts.notes.slice(0, 8).map((n) => `- ${n}`));
  return lines.filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n");
}

export type Builder = "lovable" | "claude";

/** The prompt to paste: for a builder that makes a site from words, or for Claude Code in a repo. */
export function builderPrompt(kind: Builder, m: Mockup, brief: string): string {
  if (kind === "lovable") {
    return `Build me the first version of ${m.name}: ${m.oneLiner}. It is for ${m.audience}.\n\nMake exactly these screens and nothing else:\n${m.screens.map((s, i) => `${i + 1}. ${s.title}: headline "${s.headline}", ${s.sub ? `sub "${s.sub}", ` : ""}one button "${s.cta}"${s.fields.length ? `, inputs: ${s.fields.join(", ")}` : ""}${s.bullets.length ? `, showing: ${s.bullets.join("; ")}` : ""}${s.price ? `, price ${s.price}` : ""}.`).join("\n")}\n\nThe one path: ${m.path}\n\nKeep it plain: one column, big type, one button per screen, works on a phone. Email sign-up by magic link. Stripe Checkout with one plan. No dashboard, no settings, no extra pages. Use the exact words above; do not improve them.`;
  }
  return `You are building the first version of ${m.name} in this repo. Read BRIEF.md first; it is the whole spec.\n\nStack: Next.js (app router), TypeScript, Tailwind, one Postgres table per noun in "What it keeps", magic-link email sign-in, Stripe Checkout with one plan. Deploy target: Vercel.\n\nBuild only the screens in the brief, in order, with the exact words. One path through the product; no settings, no dashboard, no admin. Mobile first. When a screen is done, run it and tell me what to look at. Do not add features the brief does not name; if something is missing from the brief, ask one question and stop.\n\n---\n\n${brief}`;
}
