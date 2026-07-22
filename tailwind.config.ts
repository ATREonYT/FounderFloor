import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F2EFE7",
        panel: "#FFFFFF",
        ink: "#23201A",
        muted: "#6F6A5E",
        line: "#E4DFD3",
        accent: "#D9480F",
        // white on #D9480F is ~4.3:1 — a hair under AA for button text. This
        // darker shade (~5.2:1) is for solid CTA fills; keep `accent` for
        // borders, dots, and accent text where it already passes.
        "accent-strong": "#C0410C",
        "accent-soft": "#FBE9E0",
        verify: "#2B8A3E",
        gold: "#B08D2E",
        // gold fails WCAG AA as small text on paper (2.7:1) — use this for
        // gold TEXT, keep `gold` for dots, borders and fills
        "gold-deep": "#7A611F",
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
       * 2026 geometry on a retro palette: the whole old scale read as
       * boxy shareware. Every existing rounded-* call site picks these up.
       */
      borderRadius: {
        sm: "6px",
        DEFAULT: "8px",
        md: "10px",
        lg: "14px",
        xl: "18px",
        "2xl": "22px",
        "3xl": "28px",
      },
      boxShadow: {
        // resting card: barely-there contact shadow + a wide soft wash
        card: "0 1px 2px rgba(35,32,26,0.05), 0 8px 24px -12px rgba(35,32,26,0.12)",
        // floating chrome: popovers, toasts, the on-floor panels
        float:
          "0 1px 2px rgba(35,32,26,0.06), 0 12px 32px -12px rgba(35,32,26,0.18), 0 32px 64px -32px rgba(35,32,26,0.14)",
      },
    },
  },
  plugins: [],
};
export default config;
