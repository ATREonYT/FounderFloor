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
        paper: "rgb(var(--paper) / <alpha-value>)",
        panel: "rgb(var(--panel) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        // white on #D9480F is ~4.3:1 — a hair under AA for button text. This
        // darker shade (~5.2:1) is for solid CTA fills; keep `accent` for
        // borders, dots, and accent text where it already passes.
        "accent-strong": "rgb(var(--accent-strong) / <alpha-value>)",
        "accent-soft": "rgb(var(--accent-soft) / <alpha-value>)",
        verify: "rgb(var(--verify) / <alpha-value>)",
        gold: "rgb(var(--gold) / <alpha-value>)",
        // gold fails WCAG AA as small text on paper (2.7:1) — use this for
        // gold TEXT, keep `gold` for dots, borders and fills
        "gold-deep": "rgb(var(--gold-deep) / <alpha-value>)",
      },
      fontFamily: {
        display: ["Iowan Old Style", "Palatino Linotype", "Palatino", "Georgia", "serif"],
        body: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
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
        card: "0 2px 0 0 rgb(var(--ink) / 0.10)",
        float: "0 4px 0 0 rgb(var(--ink) / 0.14)",
      },
    },
  },
  plugins: [],
};
export default config;
