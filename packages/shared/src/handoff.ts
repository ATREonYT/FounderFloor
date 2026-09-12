/**
 * TAKING THE APP TO A BUILDER.
 *
 * The Workshop draws a founder's app and they like it. Then they paste a
 * prompt into Lovable and get back something that shares the words and
 * nothing else: different colours, different type, a different shape.
 * The founder concludes the mock-up was decoration. That is the failure
 * this file exists to stop.
 *
 * The fix is not a longer prompt, it is the right first instruction.
 * Lovable's own house rules, which it publishes and which its leaked
 * system prompt is built around, are that a design system is declared
 * once in `index.css` and `tailwind.config.ts` as HSL custom properties,
 * that components never carry a literal colour, and that shadcn/ui
 * components are customised through variants rather than overridden in
 * place. A prompt written in those terms is followed. A prompt that says
 * "make it look nice, here are some hex codes" is not.
 *
 * So the hand-off hands over the design system in the form the tool
 * wants it — the exact tokens, already converted to HSL, in the order it
 * writes files — and only then the screens. The founder's mock-up and
 * what comes back out of the builder are then the same product.
 *
 * The second job is the pictures. The builder can generate images and we
 * cannot, so rather than lose them, the hand-off says what each picture
 * is of, in the words the drawing was chosen from.
 */
import type { Mockup } from "./workshop.ts";
import type { StudioPlan } from "./studio/plan.ts";
import { sceneFor } from "./studio/scenes.ts";

/**
 * A hex colour as the three numbers a shadcn token holds.
 *
 * Tailwind and shadcn write colours as "H S% L%" with no function around
 * them, so a theme can wrap them in hsl() with an alpha. A hex handed
 * over raw is the commonest reason a generated app ignores the palette:
 * it does not fit the slot, so the tool keeps its own default.
 */
export function hslOf(hex: string): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let hue = 0;
  if (d !== 0) {
    hue = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  return `${Math.round(hue)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** The tokens, in shadcn's own names, so they land in the slots the components already read. */
export function tokenLines(p: StudioPlan): string[] {
  const c = p.colours;
  const pairs: [string, string][] = [
    ["--background", c.bg],
    ["--foreground", c.fg],
    ["--card", c.card],
    ["--card-foreground", c.cf],
    ["--popover", c.card],
    ["--popover-foreground", c.cf],
    ["--primary", c.p],
    ["--primary-foreground", c.op],
    ["--secondary", c.s],
    ["--secondary-foreground", c.fg],
    ["--muted", c.m],
    ["--muted-foreground", c.mf],
    ["--accent", c.a],
    ["--accent-foreground", c.oa],
    ["--destructive", c.x],
    ["--destructive-foreground", c.op],
    ["--border", c.b],
    ["--input", c.b],
    ["--ring", c.p],
  ];
  return pairs.map(([k, v]) => `    ${k}: ${hslOf(v)};   /* ${v} */`);
}

/** What each picture in the mock-up is of, so the builder can make a real one instead of a grey box. */
export function pictureSubjects(m: Mockup, unit: string): string[] {
  const kind = sceneFor(unit);
  // No article in front of the noun: "a photograph of a bread" is wrong
  // and a founder reading their own prompt notices it before anything else.
  const out = [`Wherever ${unit} appears in a list, a card or a header: a real photograph of ${unit}, warm and shot close, not a stock illustration.`];
  if (m.kind === "marketplace" || m.kind === "services") out.push(`The front door: one wide photograph of ${unit} in real use, not a stock office or a team at a whiteboard.`);
  if (kind === "person") out.push("People: real faces at a natural size, never an illustrated avatar with a gradient.");
  return out;
}

export interface HandoffInput {
  m: Mockup;
  /** The build brief: the words, the screens, the data, what is out of scope. */
  brief: string;
  /** The design system the app was drawn to. Without it the builder picks its own and the mock-up was decoration. */
  plan?: StudioPlan | null;
  /** The one noun the product deals in, for the pictures. */
  unit?: string;
}

/**
 * The prompt to paste into Lovable (or Bolt, Base44, v0 — they take the
 * same shape), written in the order the tool writes files: the design
 * system first, the shell second, the screens last.
 */
export function lovableHandoff({ m, brief, plan, unit = "item" }: HandoffInput): string {
  const parts: string[] = [];

  parts.push(
    `Build the first version of ${m.name}: ${m.oneLiner}. It is for ${m.audience}.`,
    ``,
    `Stack: React, Vite, TypeScript, Tailwind and shadcn/ui, with lucide-react for icons. Mobile first — it has to look right at 390 px wide before anything else. Email sign-in by magic link, Stripe Checkout with one plan.`,
    ``,
    `Work in this order and show me each step before the next.`,
    ``,
  );

  if (plan) {
    const c = plan.colours;
    parts.push(
      `## Step 1 — the design system, before any screen`,
      ``,
      `This app already has a design. Put it in \`index.css\` and \`tailwind.config.ts\` first, and build everything out of it. Do not start with the default theme and adjust later.`,
      ``,
      `\`\`\`css`,
      `@layer base {`,
      `  :root {`,
      ...tokenLines(plan),
      `    --radius: ${(plan.treatment.r[1] / 16).toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}rem;`,
      `  }`,
      `}`,
      `\`\`\``,
      ``,
      c.dark ? `This app is dark by default: put these values on \`:root\` and add \`class="dark"\` to \`<html>\`.` : `This app is light by default. Derive a dark theme from the same tokens; do not invent a second palette.`,
      ``,
      `Type: **${plan.fonts.heading}** for headings and **${plan.fonts.body}** for everything else, loaded from Google Fonts and set as \`font-heading\` and \`font-sans\` in the Tailwind theme. Headings ${plan.treatment.heading === "upper" ? "in capitals with wide letter-spacing" : plan.treatment.heading === "tight" ? "set tight, large, and heavy" : "at a clear scale, semibold"}. Corners ${plan.treatment.r[1]}px. Borders: ${plan.treatment.border === "none" ? "none — separate things with space and ground colour" : plan.treatment.border === "thick" ? "thick and deliberate" : "one hairline in --border"}. Shadows: ${plan.treatment.shadow === "none" ? "none" : plan.treatment.shadow}.`,
      ``,
      ...(plan.treatment.id === "native"
        ? [
            `This app is drawn to the platform's own look, so keep these habits or it will read as a website made narrow:`,
            `- A near-neutral ground (\`bg-background\`) with content in white \`Card\`s on top. Depth is that one step, not a shadow on everything.`,
            `- The brand owns the controls, not the page. No full-width saturated colour field across the top; the front door leads with a large title.`,
            `- Separators start where the text starts, not at the screen edge.`,
            `- A large title near 34px with \`tracking-tight\`, 17px body, 13px captions.`,
            `- A translucent bottom bar over a hairline (\`backdrop-blur\`), 10px labels, the active item in the accent.`,
            ``,
            `And keep the finish technical, or it reads as a consumer app from several years ago:`,
            `- Every surface carries a hairline (\`border border-border\`) and no shadow. Corners 10 to 12px — \`rounded-xl\`, not \`rounded-2xl\`; nothing is a full pill except a real toggle.`,
            `- Money, counts, times and percentages go in \`font-mono tabular-nums\`, tight. Prose never does.`,
            `- The caption above a value is small, letterspaced capitals in that same mono. A state is an outlined tag in capitals (\`Badge variant="outline"\`), never a pastel lozenge.`,
            `- Initials sit on a neutral ground in the page's own ink, not a different pastel disc per person.`,
            ``,
          ]
        : []),
      `Then the rules that keep it a system:`,
      `- No literal colour anywhere below \`:root\`. Not \`text-white\`, not \`bg-black\`, not a hex in a component, not a raw rgba shadow. Only the tokens: \`bg-background\`, \`text-foreground\`, \`bg-primary\`, \`text-muted-foreground\`, \`border-border\`.`,
      `- Customise the shadcn components themselves so they carry this design, and add variants for special cases. Never override one in place with utility classes.`,
      `- Whatever you decide once — the card's radius and shadow, the button's height, the page's side padding — holds on every screen.`,
      ``,
    );
  }

  parts.push(
    `## Step ${plan ? 2 : 1} — the shell`,
    ``,
    `Build the navigation from the brief (its tab bar or header), the page container with consistent side padding, and a loading and an empty state that use the same tokens. Then the screens.`,
    ``,
    `## Step ${plan ? 3 : 2} — the screens`,
    ``,
    `Build exactly the screens under "The screens" below, in that order, with the exact copy. Use the founder's words as they are written; do not improve them, shorten them, or make them sound like marketing. Nothing under "Not in this version" gets built.`,
    ``,
    `## Pictures`,
    ``,
    `Generate real images; do not leave grey boxes or abstract gradients where a photograph belongs. What they are of:`,
    ...pictureSubjects(m, unit).map((s) => `- ${s}`),
    ``,
    `## The brief`,
    ``,
    brief,
  );

  return parts.filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n");
}
