/**
 * The design, written by the model. A template family always has a
 * fingerprint, however many switches it has; the only way to make apps
 * nobody can trace back here is to have the model design and write each
 * one itself, the way the builder tools do. So: the brief (with the
 * design system it decided from the audience) is the law, the model
 * gets it with the exact words and returns a complete HTML document for
 * every screen in it, and the app checks it, strips anything that could
 * reach out of the page, and puts its own navigation in. "Design it
 * again" swaps the brief's system for a direction drawn at random (a
 * typographic idea, a layout idea, a colour mood, a motif, a studio it
 * might have come from), so a second take is a different take. The
 * template is the fallback when there is no key.
 */
import type { Mockup } from "./workshop.ts";

const TYPE = [
  "a high-contrast serif for headlines with a plain sans for everything else, editorial and calm",
  "one geometric sans at three weights, tight tracking, large numerals",
  "a monospaced face for labels and numbers with a humanist sans for reading",
  "a rounded sans throughout, generous line height, soft and friendly",
  "a condensed grotesk for headlines, all caps with wide tracking, small body text",
  "a classic transitional serif everywhere, like a printed book",
  "a wide extended sans for headlines, narrow body, lots of white space",
  "system sans only, but set very large: the headline fills the screen",
];
const LAYOUT = [
  "a full-bleed hero image area drawn with CSS shapes, content overlapping its bottom edge",
  "a strict two-column grid of small cards with hairline rules, dense and precise",
  "a single column with enormous vertical rhythm, one idea per screenful",
  "a bottom sheet that sits over a coloured backdrop, the way maps apps do",
  "a sidebar-less dashboard with a sticky header and rows that read like a ledger",
  "a split screen: a coloured top half with the number, a white bottom half with the actions",
  "an asymmetric layout: big type flush left, small controls flush right",
  "a ticket or receipt metaphor: perforated edges, stamps, a tear-off action",
  "a paper form metaphor: ruled lines, labels in the margins, a signature button",
  "an overlapping-cards stack, each card a little offset, like a hand of cards",
  "a magazine cover: one giant headline, a small deck, a single button",
  "a chat-like screen: the product talks in bubbles and the actions are replies",
];
const MOOD = [
  "warm neutrals with one deep accent, like a good bakery",
  "cool greys and a single vivid signal colour used only once per screen",
  "two flat pastels side by side, no gradients, no shadows",
  "black and off-white with a hazard-yellow accent",
  "deep forest green with cream and a little copper",
  "navy and sand, nautical, with white rules",
  "very pale pink and oxblood, high contrast, no grey anywhere",
  "electric blue on white with thick black outlines, like a comic",
  "terracotta, olive and bone, Mediterranean and sunlit",
  "midnight purple and mint, night mode by default",
  "paper white with hairline black rules and one red stamp",
  "sage, stone and charcoal, quiet and expensive",
];
const MOTIF = [
  "thick 2px outlines on every control and card, no shadows at all",
  "very soft, wide shadows and no borders, everything floats",
  "circles: avatars, buttons, stat badges, all round",
  "sharp corners everywhere, not a single rounded edge",
  "a repeating dot grid drawn in CSS behind the content",
  "diagonal stripes as section dividers",
  "big numbers as the main graphic element on every screen",
  "hand-drawn feeling: slightly rotated cards, underlines drawn as wavy borders",
  "a stamp or badge that appears on each screen, like a seal of approval",
  "a progress line running down the left edge of every screen",
];
const STUDIO = ["a Berlin design studio", "a Tokyo product team", "a Scandinavian bank", "a New York magazine", "a Lisbon indie developer", "a Swiss transport agency", "a Melbourne coffee brand", "an Amsterdam fintech", "a Copenhagen furniture maker", "a Seoul game studio"];

function hash(s: string): number {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return h;
}
const pick = <T,>(arr: readonly T[], n: number): T => arr[n % arr.length];

export interface DesignDirection {
  seed: number;
  type: string;
  layout: string;
  mood: string;
  motif: string;
  studio: string;
}

/** A direction for this company and seed. 8×12×12×10×10 combinations, before the model's own decisions. */
export function designDirection(name: string, seed: number): DesignDirection {
  const n = hash(`${name}|${seed}`);
  return { seed, type: pick(TYPE, n), layout: pick(LAYOUT, n >>> 4), mood: pick(MOOD, n >>> 8), motif: pick(MOTIF, n >>> 12), studio: pick(STUDIO, n >>> 16) };
}

export function directionLine(d: DesignDirection): string {
  return `As if by ${d.studio}: ${d.mood}; ${d.type}; ${d.layout}; ${d.motif}.`;
}

export const DESIGN_PROMPT = `You are the design lead and front-end engineer of a small studio that ships polished first versions. The standard is what a founder gets from Lovable, Base44 or a good agency: a product that looks shipped, not a wireframe. You are handed the build brief for one product, with its design system, its screens and its exact words, and you return ONE complete HTML document that is that product's first version, running: every screen in the brief, laid out and styled to the brief's design system, with the real words on it. No prose, no markdown fences, only the document.

THE DOCUMENT
- Self-contained: one <style> block, no external fonts, images, scripts or stylesheets, no @import, no <script> at all (the host injects navigation). System font stacks only: -apple-system, "SF Pro Text", "Helvetica Neue", sans-serif; ui-serif, Georgia; ui-rounded; ui-monospace, "SF Mono".
- A 390 by 844 phone with no page scroll: html and body 100% height, overflow hidden. Each screen is a flex column: a fixed top (status bar, header), a scrolling middle (overflow-y auto, and enough content to scroll on the main screen), and a fixed bottom (tab bar, primary action or home indicator).
- One <section class="screen" id="sK" data-title="Its name"> per screen in the brief, in the brief's order, K counting from 0, the first also carrying class "on". Anything tappable that moves between screens carries data-go="K". Every screen reaches at least one other, and each primary action leads where the brief says.
- A drawn status bar on every screen (9:41, signal, wifi, battery) and a home indicator at the bottom, in that screen's ink.
- Under 40,000 characters. Put the palette, type scale and radius in :root variables; reuse classes across screens; no repeated inline styles.

THE STANDARD
- The brief's design system is the law: its hex values, its type scale, its radius, its component descriptions, its navigation pattern, light or dark as it says. Where the brief is silent, decide the way that studio would and stay consistent across screens.
- Real components, not boxes with text: a header with a title and one or two actions; inputs with labels, placeholders and a visible focus ring; list rows with a leading mark (an initials avatar, an icon or a drawn thumbnail), a title, a second line and a trailing value or chevron; cards with a drawn image area; stat tiles with a big number, a label and a change; badges; a segmented control or filter chips where a list needs them; a tab bar with 3 to 5 items and inline SVG icons with the active one marked; a primary button that looks pressable: solid fill, 600 weight, 48 to 52 px high.
- Inline SVG icons drawn by you, 20 to 24 px, one stroke width throughout, stroke currentColor. Never emoji as icons. Never the words "image", "photo" or "placeholder" in a grey box: draw the picture with gradients, shapes or a pattern that means something in this product.
- Data that feels alive: the main screen shows six to ten real-looking rows or items using the customers' first names and the nouns from the brief, with sensible times, amounts and counts. Show the empty state the brief describes on the screen it belongs to, or not at all.
- A hierarchy you can read at arm's length: one display-size line per screen, then titles, body, labels. Spacing on a 4 pt grid, 16 to 20 px side margins, the same gaps everywhere. Touch targets at least 44 px. Text contrast at least 4.5:1 against its ground.
- The front door sells: the sign as the headline, the line under it, one primary action, proof in the customers' own words with their names, the price said plainly. The pricing screen is honest: the one price, what it includes, how to stop, one line of trust.
- The founder's exact words are used exactly. Never invent customers, numbers or testimonials the brief does not contain. Never lorem ipsum. Never "Get started", "Unlock", "Empower", "Seamless", "Supercharge".
- Not a template: no purple-to-blue gradient hero, not everything centred, not a rounded card around every element, no identical three-card grid, no generic SaaS dashboard. The look must be traceable to this brief's audience and market, never to a UI kit.

Before you write, decide: light or dark; the one accent and the one or two places it appears on each screen; the header pattern; the navigation pattern; the picture that stands in for photography. Then write the whole document in one pass, and check every data-go before you finish.`;

/** What the model is given: the brief (the law), the exact words, and either the brief's own design system or a different direction. */
export function designContext(m: Mockup, brief: string, d: DesignDirection, mode: "brief" | "direction" = "brief"): string {
  const lead = mode === "direction"
    ? `A DIFFERENT TAKE\nThe founder asked for another design. Keep the brief's screens, words and facts exactly, but set its design system aside and design to this direction instead, making your own decisions from it:\n${directionLine(d)}`
    : `THE DESIGN SYSTEM\nFollow the brief's design system section. If the brief has none, use this direction as your starting point and make your own decisions from it:\n${directionLine(d)}`;
  return `${lead}\n\nTHE PRODUCT\nKind: ${m.kind ?? "saas"}. Name: ${m.name}. Sign: ${m.oneLiner}. Audience: ${m.audience}.\n\nTHE WORDS, SCREEN BY SCREEN (use them exactly; the brief may add screens between these)\n${m.screens.map((s, i) => `Screen ${i} (${s.kind}): headline "${s.headline}"; under it "${s.sub}"; primary action "${s.cta}"; inputs ${s.fields.length ? s.fields.map((f) => `"${f}"`).join(", ") : "none"}; lines ${s.bullets.map((b) => `"${b}"`).join(", ")}${s.price ? `; price "${s.price}"` : ""}${s.stat ? `; the one number: "${s.stat.label}" = ${s.stat.value}` : ""}`).join("\n")}\n\nCUSTOMERS' OWN WORDS\n${(m.quotes ?? []).map((q) => `${q.who}: "${q.said}"`).join("\n") || "none given; show no testimonial"}\n\nTHE BRIEF\n${brief}`;
}

/** The HTML out of a reply that may have prose or fences around it. */
export function extractHtml(text: string): string | null {
  const start = text.search(/<!doctype html|<html/i);
  const end = text.lastIndexOf("</html>");
  if (start < 0 || end < 0) return null;
  return text.slice(start, end + 7);
}

export interface DesignScreen {
  id: string;
  title: string;
}

/** The screens in a prepared page, in order, with the names the designer gave them. */
export function designScreens(html: string): DesignScreen[] {
  const out: DesignScreen[] = [];
  const re = /<section\b([^>]*)>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const attrs = m[1];
    if (!/class="[^"]*\bscreen\b/.test(attrs)) continue;
    const id = attrs.match(/\bid="(s\d+)"/)?.[1];
    if (!id) continue;
    const title = attrs.match(/\bdata-title="([^"]{1,40})"/)?.[1]?.replace(/&quot;/g, '"').replace(/&amp;/g, "&") ?? `Screen ${out.length + 1}`;
    out.push({ id, title });
  }
  return out;
}

/** The document, checked and made safe: three to six screens in order, nothing that reaches out, the host's own navigation. An error if it is not usable. */
export function prepareDesign(html: string): { html: string; screens: DesignScreen[] } | { error: string } {
  if (html.length > 120000) return { error: "too long" };
  let h = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/\son\w+="[^"]*"/gi, "").replace(/\son\w+='[^']*'/gi, "");
  if (/<link\b/i.test(h) || /@import/i.test(h) || /\b(src|href)\s*=\s*["']?\s*(https?:)?\/\//i.test(h) || /url\(\s*["']?\s*(https?:)?\/\//i.test(h)) return { error: "reaches outside the page" };
  const screens = designScreens(h);
  if (screens.length < 3 || screens.length > 6) return { error: `expected 3 to 6 screens, found ${screens.length}` };
  if (screens.some((s, i) => s.id !== `s${i}`)) return { error: "screens are out of order" };
  if (!/data-go=["']?[1-9]/.test(h)) return { error: "screens are not wired" };
  const guard = `<style>.screen{display:none}.screen.on{display:flex;flex-direction:column}</style>`;
  const nav = `<script>(function(){var s=document.querySelectorAll('.screen');function go(i){if(i<0||i>=s.length)return;s.forEach(function(el,k){el.classList.toggle('on',k===i)});try{window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(String(i))}catch(e){}try{window.parent&&window.parent!==window&&window.parent.postMessage({mock:i},'*')}catch(e){}}document.addEventListener('click',function(e){var t=e.target.closest('[data-go]');if(t){e.preventDefault();go(Number(t.getAttribute('data-go')))}});window.addEventListener('message',function(e){var d=e.data;if(d&&typeof d.go==='number')go(d.go)});window.__go=go;})();</script>`;
  h = /<\/head>/i.test(h) ? h.replace(/<\/head>/i, `${guard}</head>`) : h.replace(/<body/i, `${guard}<body`);
  h = /<\/body>/i.test(h) ? h.replace(/<\/body>/i, `${nav}</body>`) : h + nav;
  if (!/class="[^"]*\bon\b[^"]*"/.test(h.match(/<section\b[^>]*>/i)?.[0] ?? "")) h = h.replace(/(<section\b[^>]*class=")([^"]*\bscreen\b)/i, "$1on $2");
  return { html: h, screens };
}

/** A design opened on a given screen. */
export function designOn(html: string, screen: number): string {
  return html.replace(/<\/body>/i, `<script>window.__go&&window.__go(${screen})</script></body>`);
}
