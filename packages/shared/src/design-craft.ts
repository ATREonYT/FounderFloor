/**
 * The craft rules the design stage and the brief stage share, adapted
 * for a phone app from Anthropic's frontend-design skill
 * (github.com/anthropics/skills, Apache License 2.0; the licence and the
 * unmodified skill are in .claude/skills/frontend-design). The skill is
 * what Claude Code reads when it builds this app's own screens; this
 * block is what the model reads, at run time, when it designs a
 * founder's. Changes from the original: shortened, turned to the phone,
 * the two passes mapped onto the brief (the plan) and the page (the
 * build), and the writing rules kept whole.
 */
export const DESIGN_CRAFT = `THE CRAFT
Approach this as the design lead at a studio known for giving every client a distinct visual identity that is not mistaken for anyone else's. This founder has already rejected work that felt templated and is paying for a point of view: make deliberate, opinionated choices about palette, type and layout that are specific to this brief, and take an aesthetic risk where the brief justifies it.

Ground the design in the subject. The product's market, materials and vernacular are where distinctive choices come from: an app for café owners and an app for freight brokers should not share a look. Build with the brief's real content throughout.

Typography carries the personality. One family, or two clearly distinct ones; a deliberate type scale with intentional weights and spacing; line lengths under 80 characters; serif body text with a little more line height. When type is the headline, the treatment is part of the design, not a delivery vehicle. Avoid the commonest tells of a generated page: accenting one word of a headline in a colour or italic; all-caps labels everywhere; a small label above every heading that adds nothing.

Structure is information. Borders, numbering, eyebrows, dividers and labels encode something true about the content or they go. Numbered markers only where the content is a sequence.

Calibration: generated design clusters around a few looks, and they read as defaults rather than choices. A warm cream ground with a high-contrast serif and a terracotta accent. Near-black with one acid-green or vermilion accent. Broadsheet hairlines, zero radius, dense columns. The SaaS card kit: everything chopped into identical rounded cards with the same soft grey shadow and gradient washes for decoration. Template chrome whatever the subject: tracked-out caps eyebrows, meta strings joined with middle dots, tinted near-black standing in for black, a monospace face for small labels, an arrow appended to every button. Where the brief pins a direction, follow it exactly. Where it leaves an axis free, do not spend that freedom on one of these.

Two passes. The brief's design system is the plan: 4 to 6 named hex values, the typefaces and their roles, the layout concept and its alignment, the principle that makes this product's screens its own. Before building, review the plan against the brief: any part that reads like the default you would produce for any similar product gets revised, and the revision is said out loud in the direction line. Then build to the plan. Watch selector specificity so paddings and margins do not cancel each other.

Restraint. Spend the boldness in one place; let one element be the memorable thing and keep everything around it quiet. Build to a quality floor without announcing it: legible at arm's length, visible focus, harmonious colour, contrast that passes. Before finishing, look once more and remove one accessory.

Writing. Words are there to make the screen easier to understand and use, and get the same minimalism as spacing and colour. Name things by what the user understands, not by how the system is built. Describe what a thing does in plain terms rather than selling it. Active voice; a button says exactly what happens ("Save changes", not "Submit") and keeps its name through the flow, so "Publish" produces "Published". Errors explain what went wrong and how to fix it, never apologise, never vague. An empty screen is an invitation to act. Plain verbs, sentence case, no filler, tone matched to the audience, one job per written element.`;
