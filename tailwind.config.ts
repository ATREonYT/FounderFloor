import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      /* THE UNIT GRID: u = 4px = TILE/8 (declared as --unit in globals).
         Tailwind's default 4px spacing scale is already unit-true, so it
         stands unmodified — the audit found every spacing call site on
         it. Radii, shadows and font sizes are re-derived from the unit
         in the steps that follow; any new value added here must be a
         multiple of 4. */
      colors: {
        paper: "oklch(var(--screed) / <alpha-value>)",
        panel: "oklch(var(--foamcore) / <alpha-value>)",
        ink: "oklch(var(--gaffer) / <alpha-value>)",
        muted: "oklch(var(--conduit) / <alpha-value>)",
        line: "oklch(var(--trestle) / <alpha-value>)",
        accent: "oklch(var(--tarp) / <alpha-value>)",
        // white on #D9480F is ~4.3:1 — a hair under AA for button text. This
        // darker shade (~5.2:1) is for solid CTA fills; keep `accent` for
        // borders, dots, and accent text where it already passes.
        "accent-strong": "oklch(var(--tarp) / <alpha-value>)",
        "accent-soft": "oklch(var(--tarp-wash) / <alpha-value>)",
        verify: "oklch(var(--exitsign) / <alpha-value>)",
        gold: "oklch(var(--brass) / <alpha-value>)",
        // gold fails WCAG AA as small text on paper (2.7:1) — use this for
        // gold TEXT, keep `gold` for dots, borders and fills
        "gold-deep": "oklch(var(--brass-deep) / <alpha-value>)",
        // material names, first-class — new work names the material;
        // the semantic names above stay for the existing call sites
        foamcore: "oklch(var(--foamcore) / <alpha-value>)",
        screed: "oklch(var(--screed) / <alpha-value>)",
        laminate: "oklch(var(--laminate) / <alpha-value>)",
        trestle: "oklch(var(--trestle) / <alpha-value>)",
        gantry: "oklch(var(--gantry) / <alpha-value>)",
        conduit: "oklch(var(--conduit) / <alpha-value>)",
        flightcase: "oklch(var(--flightcase) / <alpha-value>)",
        gaffer: "oklch(var(--gaffer) / <alpha-value>)",
        blackout: "oklch(var(--blackout) / <alpha-value>)",
        tarp: "oklch(var(--tarp) / <alpha-value>)",
        brass: "oklch(var(--brass) / <alpha-value>)",
        fountain: "oklch(var(--fountain) / <alpha-value>)",
        exitsign: "oklch(var(--exitsign) / <alpha-value>)",
      },
      /* THE TYPE SCALE, on the unit: 12 · 16 · 20 · 28 · 36 · 48 (+ the
         88px hero). Every size and line-height a multiple of 4; step
         ratios 1.33 / 1.25 / 1.4 / 1.29 / 1.33, page max:min 7.3. Body
         reads at 16. Emphasis is one weight step, never italics. */
      fontSize: {
        xs: ["12px", { lineHeight: "16px" }],
        sm: ["16px", { lineHeight: "24px" }],
        base: ["16px", { lineHeight: "24px" }],
        lg: ["20px", { lineHeight: "28px" }],
        xl: ["28px", { lineHeight: "32px" }],
        "2xl": ["28px", { lineHeight: "32px" }],
        "3xl": ["36px", { lineHeight: "40px" }],
        "4xl": ["48px", { lineHeight: "52px" }],
      },
      fontFamily: {
        display: ["var(--font-display)", "Iowan Old Style", "Palatino Linotype", "Georgia", "serif"],
        body: [
          "IBM Plex Sans",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      /**
       * Geometry on the unit grid. Radii are 1u/2u/3u and CONCENTRIC:
       * an inner element's radius = its parent's radius minus the gap
       * between them (a 12 container with 8 of padding gives its child
       * 4). Radii are the fallback shape — the primary corner language
       * is the badge clip (see .clip-badge in globals), and rounded-full
       * survives only on avatars and status dots.
       */
      borderRadius: {
        sm: "4px",
        DEFAULT: "4px",
        md: "8px",
        lg: "12px",
        xl: "12px",
        "2xl": "16px",
        "3xl": "16px",
      },
      /**
       * Die-cut shadows: hard offsets on the unit's half-steps, no blur.
       * The old system was one soft wash on everything; this is a piece
       * of card sitting on a table. Stroke weights (1/2px borders) and
       * these 2px offsets are the pen-width exception to the unit rule.
       */
      boxShadow: {
        card: "0 2px 0 0 oklch(var(--gaffer) / 0.10)",
        float: "0 4px 0 0 oklch(var(--gaffer) / 0.14)",
      },
    },
  },
  plugins: [],
};
export default config;
