/**
 * FounderFloor Studio, in one file.
 *
 * The Workshop's engine: reads what a founder's product is from their own
 * words, takes the palette, type pairing and treatment that kind of product
 * has earned, chooses the screen archetype the category leaders use, and
 * assembles a working first version (three to five wired screens) as one
 * HTML document. No model is needed. With a model, the same plan is handed
 * over as the design system to build on (see BRIEF_PROMPT and DESIGN_PROMPT).
 *
 * Run it:
 *   node founderfloor-studio.mjs "Prepaid passes for the cafés people come back to." "independent café owners" "€40 a month" > lantern.html
 *   node founderfloor-studio.mjs "Book a trusted plumber in ten minutes." "homeowners" "€35 a visit" --segment services --seed 1 > fixly.html
 * Open the HTML in a browser at 390 px wide; tap through it. Add --json to
 * print the plan (what it read the product as, the palette, the type, the
 * archetype) instead of the page.
 *
 * Use it from code:
 *   import { localMockup, studioDesign, prepareDesign } from "./founderfloor-studio.mjs";
 *   const m = localMockup({ name, oneLiner, audience, price, said, segment });
 *   const { html, plan, system } = studioDesign(m, { said, segment });
 *   const page = prepareDesign(html);   // { html, screens } with navigation injected, or { error }
 *
 * Data: product types, palettes and type pairings are from UI/UX Pro Max
 * (MIT, Next Level Builder). Craft rules adapted from Anthropic's
 * frontend-design skill (Apache 2.0). Everything else is FounderFloor's.
 */
export * from "../packages/shared/src/studio/index.ts";
export { REFERENCES, referenceLine } from "../packages/shared/src/studio/references.ts";
export { unitOf, detailTitle, singular } from "../packages/shared/src/studio/nouns.ts";
export { localMockup, buildBrief, builderPrompt, priceIn, namesIn, signNouns, kindOf } from "../packages/shared/src/workshop.ts";
export { prepareDesign, designScreens, extractHtml, DESIGN_PROMPT, designContext, designDirection, directionLine } from "../packages/shared/src/design.ts";
export { BRIEF_PROMPT, briefContext, splitBrief, briefComplete, localBrief } from "../packages/shared/src/workshop-brief.ts";
export { DESIGN_CRAFT } from "../packages/shared/src/design-craft.ts";
export { SAMPLE_DESIGN_HTML } from "../packages/shared/src/sample-design.ts";

import { localMockup } from "../packages/shared/src/workshop.ts";
import { studioDesign } from "../packages/shared/src/studio/index.ts";
import { prepareDesign } from "../packages/shared/src/design.ts";

// the command line, when run directly
const isMain = typeof process !== "undefined" && process.argv && process.argv[1] && /founderfloor-studio/.test(process.argv[1]);
if (isMain) {
  const args = process.argv.slice(2);
  const flag = (k: string) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
  const positional = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--")));
  const [oneLiner, audience, price] = positional;
  if (!oneLiner) {
    console.error('usage: node founderfloor-studio.mjs "<the sign>" "<who it is for>" "<price>" [--name X] [--segment b2b-saas|consumer|marketplace|services|hardware] [--seed N] [--said "Maria: ..."]... [--json]');
    process.exit(1);
  }
  const said = args.flatMap((a, i) => (a === "--said" ? [args[i + 1]] : []));
  const name = flag("--name") ?? (oneLiner.split(/\s+/)[0].replace(/[^A-Za-z]/g, "") || "Product");
  const segment = flag("--segment");
  const seed = Number(flag("--seed") ?? 0);
  const m = localMockup({ name, oneLiner, audience, price, said, segment });
  const r = studioDesign(m, { said, segment, seed });
  if (args.includes("--json")) {
    console.log(JSON.stringify({ line: r.plan.line, product: r.plan.product.t, archetype: r.plan.archetype, landing: r.plan.landing, treatment: r.plan.treatment.id, fonts: r.plan.fonts, colours: r.plan.colours, screens: r.screens, designSystem: r.system }, null, 2));
  } else {
    const out = prepareDesign(r.html);
    console.log("html" in out ? out.html : r.html);
  }
}
