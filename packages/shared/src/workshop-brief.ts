/**
 * The brief: the big prompt. One document, written from everything the
 * founder put into the building (the sign, who it is for, the price said
 * out loud, what customers said word for word, the notebook, the work on
 * each task), that a designer, a builder tool or a developer can build
 * the first version from without asking a question. It carries its own
 * design system, decided from the audience and the job, so the design
 * stage has a law to follow and two founders never get the same page.
 * The same document is what the founder pastes into Lovable, Bolt or
 * v0. Without a key, the rules write a plainer one so the page is never
 * empty.
 */
import type { Mockup } from "./workshop.ts";
import { buildBrief, asMockup } from "./workshop.ts";
import type { StandRecord } from "./types.ts";
import { lookOf } from "./mockup-html.ts";

/** The sections, in order. The check reads them back. */
export const BRIEF_SECTIONS = ["The product", "Who it is for", "The one path", "The screens", "What it keeps", "The design system", "The words", "The build", "Not in this version"] as const;

export const BRIEF_PROMPT = `You write the build brief for one founder's product: the one document a designer, a builder tool (Lovable, Bolt, v0) or a developer with Claude Code can build the first version from without asking a question. You are given everything the founder has written in the building: the sign on their stand, who it is for, the price said out loud, what customers told them word for word, their notebook and the work they did on each task. Read all of it before you write. The brief must be specific to this founder: their nouns, their customers' names, their price, their market, the thing customers do today instead. A brief that could belong to another company is a failed brief.

Plain words, present tense, no adjective that needs defending. Never invent customers, quotes, numbers or testimonials the founder did not write; where something is missing, say so in square brackets, like [price not decided yet]. Use the founder's exact phrases for the headline, the audience and the promise.

Return a Markdown document with exactly these ## sections in this order, then one fenced json block, and nothing else:

## The product
One paragraph: what it is, for whom, the job it does, what those people do today instead (from the interviews), and why they would switch. Then the name and the one-line sign, verbatim.

## Who it is for
The one person this version is built for: a real customer from the notebook if there is one, with their situation, the moment they open the app (where they are, on what device, with how much time), what they said, and what would make them pay.

## The one path
Numbered steps from first open to paid, one line each, naming the screen each step happens on.

## The screens
Three to five screens, in order: the front door (landing); the first-run or sign-in step if the product needs one; the main screen; one screen the main screen leads to (a detail, a record, a booking); the price. For each screen, as a ### heading with its name: its job in one line; every element from top to bottom with its exact copy (header, primary action, secondary actions, inputs with labels and placeholders, list rows and what each row shows, the one number if there is one, the empty state, loading and error lines); what each tappable thing leads to; what data it reads or writes.

## What it keeps
The nouns the product stores, each with its fields.

## The design system
Decide the look from the audience and the job, not from taste, and be specific enough to build from. Give: three adjectives the design must feel like and one it must never feel like, each tied to who uses it; light or dark by default and why; the type (families with system fallbacks, and a scale with size and weight for display, title, body and label); the palette as named roles with hex values (background, surface, ink, muted, brand, on-brand, positive, warning, line); spacing (the base unit and the side margin); corner radius; the components and how each looks (primary and secondary button, input, list row, card, stat, the navigation pattern, badge, sheet); iconography (stroke, size); what stands in for photographs in the first version; motion (what moves and for how long); and three things it must not look like, naming the clichés of this market.

## The words
The tone in one line; the founder's exact phrases to keep verbatim, quoted; words never to use.

## The build
Stack (Next.js app router, TypeScript, Tailwind, Postgres through Supabase, magic-link email sign-in, Stripe Checkout with one plan, Vercel, unless the founder said otherwise), what to build first, what to ship without.

## Not in this version
The things a builder would be tempted to add and must not.

Then the fenced json block, on its own, with: name; oneLiner; audience; kind (one of saas, consumer, marketplace, services, hardware); path (one sentence); keeps (3 to 6 short nouns); screens (the same screens as the section, same order, each with kind (landing, signup, app, checkout or pricing), title (under 5 words), headline, sub, cta (the primary action), fields (input labels), bullets (three short lines a user sees on it), and price or stat {label, value} where the screen has one); quotes (who and said, only from the notebook); hue (0 to 360, the brand colour's hue).`;

export interface WorkshopBriefInput {
  record: Partial<StandRecord>;
  profile?: { name?: string; audiences?: string; goal?: string; skills?: string[]; hoursPerWeek?: number; budget?: number } | null;
  /** Interviews first, then notebook lines, in the customers' words. */
  said: string[];
  /** The founder's log, from the notebook, when memory is on. */
  log?: string;
  /** The plan's week and the work written into tasks. */
  work?: string[];
  fresh?: boolean;
}

/** Everything the founder wrote, for the brief writer. */
export function briefContext(i: WorkshopBriefInput): string {
  const r = i.record;
  const p = i.profile;
  return [
    "THE STAND",
    `Name: ${r.name || "[no name yet]"}. Sign: ${r.oneLiner || "[no sign yet]"}. Pitch: ${r.pitch || "none written"}. Segment: ${r.segment ?? "unknown"}. Public pricing: ${r.publicPricing || "[not written]"}.`,
    p ? `\nTHE FOUNDER\n${p.name ?? "The founder"}. Audience in their words: ${p.audiences ?? "[not written]"}. Goal: ${p.goal ?? "[not written]"}. Skills: ${p.skills?.length ? p.skills.join(", ") : "not said"}. Hours a week: ${p.hoursPerWeek ?? "not said"}. Budget: ${p.budget != null ? `€${p.budget}` : "not said"}.` : "",
    i.said.length ? `\nWHAT CUSTOMERS SAID, WORD FOR WORD\n${i.said.map((s) => `- ${s}`).join("\n")}` : "\nWHAT CUSTOMERS SAID\nNothing written down yet. Say so where a customer's words would go.",
    i.work?.length ? `\nWORK WRITTEN INTO TASKS\n${i.work.map((w) => `- ${w}`).join("\n")}` : "",
    i.log ? `\n${i.log}` : "",
    i.fresh ? "\nThe founder asked for a different brief from the last one: change the screens' shape and the design system, keep the facts." : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** The reply, split: the document without its json block, and the light spec out of the block. */
export function splitBrief(text: string): { brief: string; spec: ReturnType<typeof asMockup> } {
  const fence = text.match(/```json\s*([\s\S]*?)```/i);
  let spec: ReturnType<typeof asMockup> = null;
  if (fence) {
    try {
      spec = asMockup(JSON.parse(fence[1]));
    } catch {
      spec = null;
    }
  }
  const start = text.search(/^## The product/m);
  let brief = (start >= 0 ? text.slice(start) : text).replace(/```json[\s\S]*?```/gi, "").trim();
  if (start > 0) brief = `# ${specName(spec, text)}\n\n${brief}`;
  else if (start === 0) brief = `# ${specName(spec, text)}\n\n${brief}`;
  return { brief, spec };
}

function specName(spec: ReturnType<typeof asMockup>, text: string): string {
  if (spec?.name) return spec.name;
  const m = text.match(/^# (.+)$/m);
  return m ? m[1].trim() : "The product";
}

/** True when the document carries every section. */
export function briefComplete(brief: string): boolean {
  return BRIEF_SECTIONS.every((s) => new RegExp(`^## ${s}`, "m").test(brief));
}

/** The desk's own brief, without a model: the plain one with a design system from the chosen look. */
export function localBrief(m: Mockup, opts?: { record?: Partial<StandRecord> | null; notes?: string[] }): string {
  const L = lookOf(m);
  const font = { sans: "a plain sans (-apple-system, Helvetica Neue)", serif: "a serif for headlines (ui-serif, Georgia) and a sans for everything else", rounded: "a rounded sans (ui-rounded, then -apple-system)", grotesk: "a condensed grotesk feel: tight tracking, all-caps labels" }[L.font];
  const palette = { brand: `the brand colour hsl(${L.hue} 72% 46%) on white, ink #0F172A, muted #64748B, line #E2E8F0`, tinted: `a pale tint of hsl(${L.hue} 60% 96%) as the background, surfaces white, ink #0F172A, brand hsl(${L.hue} 72% 46%)`, ink: "black on off-white #FAFAF9, one accent used once per screen", duo: `two flat colours side by side: hsl(${L.hue} 72% 46%) and hsl(${(L.hue + 40) % 360} 60% 90%), no gradients` }[L.palette];
  const nav = { tabs: "a bottom tab bar with 4 items", pillbar: "a floating pill bar at the bottom", top: "tabs under the header, no bottom bar" }[L.nav];
  const design = [
    "",
    "## The design system",
    `- Feels: plain, quick, trustworthy. Never: corporate.`,
    `- Type: ${font}. Display 30/700, title 20/600, body 16/400, label 12/600 uppercase with letter-spacing.`,
    `- Colour: ${palette}.`,
    `- Spacing: 4 pt grid, 20 px side margins. Radius: ${L.radius} px.`,
    `- Navigation: ${nav}. Buttons ${L.pill ? "pill-shaped" : "rounded"}, 50 px high, one primary per screen.`,
    "- Icons: inline SVG, 1.5 px stroke, 22 px. No emoji. Pictures drawn with shapes and gradients, no stock photos.",
    "- Never: a purple-to-blue gradient hero, everything centred, a card around every element.",
  ];
  const base = buildBrief(m, opts);
  const at = base.indexOf("\n## Rules");
  return at >= 0 ? `${base.slice(0, at)}${design.join("\n")}\n${base.slice(at)}` : `${base}\n${design.join("\n")}`;
}
