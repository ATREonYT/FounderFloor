/**
 * The design, written by the model. A template family always has a
 * fingerprint, however many switches it has; the only way to make apps
 * nobody can trace back here is to have the model design and write each
 * one itself, the way the builder tools do. So: a design direction is
 * drawn for this company (a typographic idea, a layout idea, a colour
 * mood, a motif, a studio it might have come from), the model gets the
 * brief and the direction and returns a complete HTML document for the
 * three screens, and the app checks it, strips anything that could
 * reach out of the page, and puts its own navigation in. The direction
 * space is large and the model is told to make its own decisions, so
 * two founders never get the same page. The template is the fallback.
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

export const DESIGN_PROMPT = `You are a senior product designer who also writes front-end code. You design the first version of one founder's product as a mobile web app and return ONE complete HTML document, nothing else: no prose, no markdown fences.

The document must:
- Be self-contained: inline CSS in one <style>, no external fonts, images, scripts or stylesheets, no @import, no <script> tags at all (the host injects navigation). Draw pictures with CSS gradients, shapes and inline SVG only. Use system font stacks (-apple-system, ui-serif, ui-rounded, ui-monospace, "Helvetica Neue", Georgia are all available).
- Fit a 390 by 844 phone with no page scroll: html and body 100% height with overflow hidden; each screen is a flex column; the part that scrolls is inside the screen.
- Contain exactly three <section class="screen" id="s0"|"s1"|"s2"> elements, the first also carrying class "on". Screen 0 is the front door (landing), screen 1 is the product's main screen, screen 2 is the price. Anything tappable that should move between screens carries data-go="0", "1" or "2". Every screen has at least one way to reach another.
- Include a drawn status bar at the top (9:41, signal, battery) and, if the design has a tab bar, mark the active tab.
- Use the founder's exact words where the brief gives them: the headline, the line under it, the button, the bullets, the price, the customers' quotes with their names, the activity lines. Never invent customers, numbers or testimonials the brief does not contain. Never use lorem ipsum, emoji, or the words "Get started", "Unlock", "Empower", "Seamless".
- Be genuinely designed, not a template: follow the DESIGN DIRECTION below as a starting point and then make your own decisions the way a real studio would. Choose the layout that fits the kind of product (a dashboard, a feed, listings, bookings or a product page). Do not use a purple-to-blue gradient hero, do not centre everything, do not put a rounded card on everything. Typography carries the design: pick sizes and weights deliberately. Keep the CSS compact; the whole document under 26,000 characters.
- Look finished: aligned, spaced on an 8 point grid, readable contrast, real-feeling data in the main screen.`;

/** What the model is given: the brief, the words, and the direction. */
export function designContext(m: Mockup, brief: string, d: DesignDirection): string {
  return `DESIGN DIRECTION\n${directionLine(d)}\n\nTHE PRODUCT\nKind: ${m.kind ?? "saas"}. Name: ${m.name}. Sign: ${m.oneLiner}. Audience: ${m.audience}.\n\nTHE WORDS, SCREEN BY SCREEN (use them exactly)\n${m.screens.map((s, i) => `Screen ${i} (${s.kind}): headline "${s.headline}"; under it "${s.sub}"; button "${s.cta}"; inputs ${s.fields.length ? s.fields.map((f) => `"${f}"`).join(", ") : "none"}; lines ${s.bullets.map((b) => `"${b}"`).join(", ")}${s.price ? `; price "${s.price}"` : ""}${s.stat ? `; the one number: "${s.stat.label}" = ${s.stat.value}` : ""}`).join("\n")}\n\nCUSTOMERS' OWN WORDS\n${(m.quotes ?? []).map((q) => `${q.who}: "${q.said}"`).join("\n") || "none given; show no testimonial"}\n\nTHE BRIEF\n${brief}`;
}

/** The HTML out of a reply that may have prose or fences around it. */
export function extractHtml(text: string): string | null {
  const start = text.search(/<!doctype html|<html/i);
  const end = text.lastIndexOf("</html>");
  if (start < 0 || end < 0) return null;
  return text.slice(start, end + 7);
}

/** The document, checked and made safe: three screens, nothing that reaches out, the host's own navigation. Null if it is not usable. */
export function prepareDesign(html: string): { html: string } | { error: string } {
  if (html.length > 60000) return { error: "too long" };
  let h = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/\son\w+="[^"]*"/gi, "").replace(/\son\w+='[^']*'/gi, "");
  if (/<link\b/i.test(h) || /@import/i.test(h) || /\b(src|href)\s*=\s*["']?\s*(https?:)?\/\//i.test(h) || /url\(\s*["']?\s*(https?:)?\/\//i.test(h)) return { error: "reaches outside the page" };
  const screens = h.match(/<section[^>]*class="[^"]*\bscreen\b[^"]*"[^>]*>/gi) ?? [];
  if (screens.length !== 3) return { error: `expected 3 screens, found ${screens.length}` };
  if (!/data-go=["']?[12]/.test(h) || !/id="s0"/.test(h) || !/id="s1"/.test(h) || !/id="s2"/.test(h)) return { error: "screens are not wired" };
  const guard = `<style>.screen{display:none}.screen.on{display:flex;flex-direction:column}</style>`;
  const nav = `<script>(function(){var s=document.querySelectorAll('.screen');function go(i){s.forEach(function(el,k){el.classList.toggle('on',k===i)});try{window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(String(i))}catch(e){}try{window.parent&&window.parent!==window&&window.parent.postMessage({mock:i},'*')}catch(e){}}document.addEventListener('click',function(e){var t=e.target.closest('[data-go]');if(t){e.preventDefault();go(Number(t.getAttribute('data-go')))}});window.addEventListener('message',function(e){var d=e.data;if(d&&typeof d.go==='number')go(d.go)});window.__go=go;})();</script>`;
  h = /<\/head>/i.test(h) ? h.replace(/<\/head>/i, `${guard}</head>`) : h.replace(/<body/i, `${guard}<body`);
  h = /<\/body>/i.test(h) ? h.replace(/<\/body>/i, `${nav}</body>`) : h + nav;
  return { html: h };
}

/** A design opened on a given screen. */
export function designOn(html: string, screen: number): string {
  return html.replace(/<\/body>/i, `<script>window.__go&&window.__go(${screen})</script></body>`);
}
