/**
 * The studio: a founder's product, designed and drawn without a model.
 * The plan reads what the product is and decides palette, type,
 * treatment, archetype and front door from the tables; the screens are
 * assembled from the parts with the founder's own content; the result
 * is one HTML document with three to five wired screens, the same shape
 * the model returns, so the app treats both alike. With a key, the plan
 * is also what the model is handed as the design system to build on.
 */
import type { Mockup } from "../workshop.ts";
import { namesIn, priceIn, signNouns } from "../workshop.ts";
import { designPlan, planCss, planText, type StudioPlan, type PlanInput } from "./plan.ts";
import { esc } from "./parts.ts";
import { ADJECTIVES, detail, landing, main, price, signIn, type Content, type Money, type Nav, type Screen } from "./screens.ts";
import { unitOf } from "./nouns.ts";

export * from "./plan.ts";
export { scene, sceneFor, type SceneKind } from "./scenes.ts";
export { PRODUCTS, FONTS } from "./tables.ts";

const NAMES = ["Maria K.", "Kostas A.", "Eleni L.", "Andreas P.", "Nikos S.", "Despina C.", "Yiannis T.", "Sofia G.", "Petros M.", "Anna R.", "Marios D.", "Christina V."];
const PLACES = ["Old town", "Harbour", "Market square", "Station road", "Riverside", "North side", "Campus", "Marina"];

/** "€40 a month" → { sym €, n 40, per "a month" }. */
export function parseMoney(text: string | undefined | null): Money | null {
  if (!text) return null;
  const m = text.match(/([€$£])\s?(\d[\d,.]*)|(\d[\d,.]*)\s?(€|euros?|eur|dollars?|usd|pounds?|gbp)/i);
  if (!m) return null;
  const sym = m[1] ?? (/\$|dollar|usd/i.test(m[4] ?? "") ? "$" : /£|pound|gbp/i.test(m[4] ?? "") ? "£" : "€");
  const n = parseFloat((m[2] ?? m[3] ?? "0").replace(/,/g, ""));
  const per = (text.match(/\b(a|an|per|each|\/)\s?(month|mo|week|year|yr|day|hour|seat|user|visit|session|night|booking|order|lesson|class|ride|trip)\b/i)?.[0] ?? "").replace(/\bmo\b/, "month").replace(/\byr\b/, "year").replace(/^\//, "per ");
  return { text, sym, n: Number.isFinite(n) ? n : 0, per };
}

/** Everything the screens draw with, from the mock-up's words. */
export function contentOf(m: Mockup, opts: { said?: string[]; seed?: number; archetype?: import("./plan.ts").Archetype } = {}): Content {
  const land = m.screens.find((s) => s.kind === "landing") ?? m.screens[0];
  const app = m.screens.find((s) => s.kind === "app") ?? m.screens[1] ?? land;
  const pr = m.screens.find((s) => s.kind === "pricing") ?? m.screens[m.screens.length - 1];
  const said = opts.said ?? [];
  const priceText = pr.price || priceIn(said) || "";
  const { thing } = signNouns(m.oneLiner);
  const unit = unitOf(m.oneLiner, opts.archetype ?? "dashboard");
  const known = [...(m.quotes ?? []).map((q) => q.who), ...namesIn(said)].filter((x, i, a) => a.indexOf(x) === i);
  const people = [...known, ...NAMES.filter((n) => !known.some((k) => n.startsWith(k.split(" ")[0])))].slice(0, 12);
  return {
    name: m.name,
    sign: m.oneLiner.replace(/[.!]$/, ""),
    audience: m.audience.replace(/[.!]$/, ""),
    cta: land.cta,
    sub: land.sub,
    bullets: land.bullets,
    activity: app.bullets,
    stat: app.stat,
    price: parseMoney(priceText),
    pricing: { headline: pr.headline, sub: pr.sub, cta: pr.cta, bullets: pr.bullets },
    quotes: (m.quotes ?? []).slice(0, 3),
    people,
    thing: thing || "thing",
    unit: unit || "thing",
    places: PLACES,
    seed: opts.seed ?? 0,
    adjectives: opts.archetype ? ADJECTIVES[opts.archetype] : undefined,
  };
}

export interface StudioOptions {
  seed?: number;
  /** A product type the founder chose by name, over the reading. */
  chosen?: string;
  said?: string[];
  segment?: string;
  pitch?: string;
}

export interface StudioResult {
  html: string;
  plan: StudioPlan;
  screens: { id: string; title: string }[];
  /** The plan as the design-system section of a brief. */
  system: string;
  /** The one noun the product deals in, so the hand-off can say what the pictures are of. */
  unit: string;
}

/** The plan for a mock-up. */
export function studioPlan(m: Mockup, opts: StudioOptions = {}): StudioPlan {
  const input: PlanInput = { name: m.name, sign: m.oneLiner, pitch: opts.pitch, audience: m.audience, said: [...(m.quotes ?? []).map((q) => q.said), ...(opts.said ?? [])], segment: opts.segment, kind: m.kind };
  return designPlan(input, opts.seed ?? 0, opts.chosen);
}

/** The whole app: the plan, the screens, the document. */
export function studioDesign(m: Mockup, opts: StudioOptions = {}): StudioResult {
  const plan = studioPlan(m, opts);
  const c = contentOf(m, { said: opts.said, seed: opts.seed ?? 0, archetype: plan.archetype });
  const withSignIn = !(m.kind === "services" || m.kind === "hardware" || plan.archetype === "bookings" || plan.archetype === "store" || plan.archetype === "map");
  const nav: Nav = withSignIn ? { landing: 0, signin: 1, main: 2, detail: 3, price: 4 } : { landing: 0, main: 1, detail: 2, price: 3 };
  const list: Screen[] = [landing(c, plan, nav), ...(withSignIn ? [signIn(c, plan, nav)] : []), main(c, plan, nav), detail(c, plan, nav), price(c, plan, nav)];
  const sections = list.map((s, i) => `<section class="screen${i === 0 ? " on" : ""}" id="s${i}" data-title="${esc(s.title)}">${s.html}</section>`).join("\n");
  const html = `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=390,initial-scale=1"><title>${esc(m.name)}</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="${plan.fonts.link}"><style>${planCss(plan)}</style></head><body>\n${sections}\n</body></html>`;
  return { html, plan, screens: list.map((s, i) => ({ id: `s${i}`, title: s.title })), system: planText(plan), unit: c.unit };
}
