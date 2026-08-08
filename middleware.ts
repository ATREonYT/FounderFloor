/**
 * The launch gate.
 *
 * While LAUNCH_GATE is on, everything on the site rewrites to /soon, which
 * collects an email for the launch instead of letting people in. Turn it
 * off by deleting the variable in the Vercel project and redeploying. No
 * code change and no branch to merge — this has to come down at 18:00 on a
 * Sunday, and at 18:00 on a Sunday you want to change one setting, not open
 * an editor.
 *
 * REDEPLOY, NOT JUST A SETTING CHANGE. This file runs per request, but
 * app/layout.tsx reads the same variable while it is being PRERENDERED, to
 * decide whether the nav should point at pages nobody can reach. Change the
 * variable without rebuilding and the two disagree: the gate lifts while
 * the chrome still says the doors are shut, or worse, the gate stays up
 * with a nav full of live links behind it. Vercel rebuilds on a redeploy,
 * so a redeploy is the whole procedure — just do not expect the toggle
 * alone to do anything.
 *
 * FOUR THINGS STAY REACHABLE, DELIBERATELY:
 *
 * 1. THE LEGAL PAGES. A German operator is required to keep an Impressum
 *    reachable from every page (DDG section 5), and the withdrawal and
 *    complaint routes are obligations too. Hiding those behind a marketing
 *    gate is the one thing here that could actually cause trouble, so they
 *    stay open even for a weekend.
 * 2. THE ADMIN CONSOLE. Locking yourself out of your own console during a
 *    launch is a bad hour.
 * 3. ROBOTS, SITEMAP AND THE SOCIAL IMAGES. A crawler that gets the gate on
 *    every URL learns the whole site is one page, and that is not something
 *    you undo by turning the gate off later.
 * 4. NEXT ASSETS AND public/. Without them the gate renders unstyled.
 *
 * (Written without markdown bold before a slash on purpose: the sequence
 * that starts a bolded path also ends a block comment, and the compiler
 * error it produces points at a line twenty further down.)
 *
 * The gate is a rewrite, not a redirect: the visitor keeps the URL they
 * arrived on, so a link shared into the wild still points at the right page
 * once the gate lifts, and nothing is cached as a permanent move.
 */
import { NextResponse, type NextRequest } from "next/server";

const GATE_ON = /^(1|on|true|yes)$/i.test(process.env.LAUNCH_GATE ?? "");

/** Paths that are never gated. Exact matches or prefixes. */
const OPEN = [
  "/soon",
  // legal — see note 1 above
  "/imprint",
  "/terms",
  "/privacy",
  "/cancel",
  "/report",
  "/about",
  // operator
  "/admin",
  // crawlers and link unfurlers
  "/robots.txt",
  "/sitemap.xml",
  "/opengraph-image.png",
  "/twitter-image.png",
  "/icon.png",
  "/icon.svg",
  "/apple-icon.png",
  "/favicon.ico",
];

export function middleware(req: NextRequest) {
  if (!GATE_ON) return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/_next") || pathname.startsWith("/promo")) return NextResponse.next();
  if (OPEN.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/soon";
  return NextResponse.rewrite(url);
}

export const config = {
  // Everything except Next's own asset routes; the finer-grained allowlist
  // is in the handler so the reasons for each exception can live next to it.
  matcher: ["/((?!_next/static|_next/image).*)"],
};
