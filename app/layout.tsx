import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import PixelLogo from "@/components/PixelLogo";
import NavLink from "@/components/NavLink";
import NavConnections from "@/components/NavConnections";
import NavProfile from "@/components/NavProfile";
import MemberBadge from "@/components/MemberBadge";
import NavAdmin from "@/components/NavAdmin";
import MembershipWatcher from "@/components/MembershipWatcher";
import RefCatcher from "@/components/RefCatcher";
import Messenger from "@/components/Messenger";
import ScrollProgress from "@/components/ScrollProgress";

/**
 * Site URL for absolute metadata URLs. Vercel sets VERCEL_URL on preview
 * deploys; NEXT_PUBLIC_SITE_URL wins when set, so a custom domain stays
 * canonical. Without a metadataBase, Next can't build absolute og:image
 * URLs and social previews silently fall back to a bare link.
 */
/**
 * While the launch gate is up (see middleware.ts) every route except the
 * legal pages renders the holding page, so the site chrome would be a nav
 * bar whose every link leads back to the gate, above a status stamp reading
 * "Main Hall open" on a page that says the doors are shut. Both are cut
 * down to a wordmark that goes home, and the footer's Explore column goes
 * with them. The legal links stay: they are the reason those pages are
 * reachable at all.
 */
const GATED = /^(1|on|true|yes)$/i.test(process.env.LAUNCH_GATE ?? "");

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://founderfloor.net");

const TITLE = "FounderFloor: a walkable expo for startups";
// Kept under 125 characters: past that, X and most previews truncate it
// mid-sentence on phones.
const DESCRIPTION =
  "A 2D trade-show floor that never tears down. Walk in, talk to founders, claim a stand, connect. Free, no install.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s · FounderFloor" },
  description: DESCRIPTION,
  applicationName: "FounderFloor",
  keywords: [
    "startups", "founders", "co-founder", "virtual expo", "trade show",
    "startup directory", "networking", "indie hackers",
  ],
  alternates: { canonical: "/" },
  // app/opengraph-image.png and app/twitter-image.png are picked up
  // automatically by the app router and turned into absolute URLs.
  openGraph: {
    type: "website",
    siteName: "FounderFloor",
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Scroll reveals and drawn rules start hidden and are switched on
            by script. Without this, a visitor with JavaScript off would get
            a page of blank sections. It replaces the old blanket timer that
            revealed everything a beat after load, whether it was on screen
            or not. */}
        <noscript>
          {/* eslint-disable-next-line react/no-danger */}
          <style
            dangerouslySetInnerHTML={{
              // !important because these override class rules whose order
              // in the head is Next's to decide, not ours.
              __html:
                ".reveal{opacity:1!important;transform:none!important}" +
                ".draw-x,.meter-fill{transform:none!important}",
            }}
          />
        </noscript>
      </head>
      <body className="flex min-h-screen flex-col bg-paper text-ink">
        {/* sticky translucent chrome — the page scrolls under it. Floor
            pages hide it (body[data-on-floor], set by the floor page): the
            game is fullscreen with its own chrome, and the route-transition
            opacity animation traps the game's z-index below any positioned
            header — so the nav would otherwise float over the hall. */}
        {/* Keyboard and screen-reader visitors get past the nav in one key.
            Invisible until focused, then it lands as a proper control. */}
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-ink focus:px-4 focus:py-2.5 focus:text-sm focus:text-paper"
        >
          Skip to content
        </a>

        {/* Solid, ruled chrome. The translucent blurred bar it replaces is
            the single most-used header treatment on the web right now, and
            it reads as a template even when everything under it doesn't. */}
        <header
          data-site-nav
          className="sticky top-0 z-40 border-b border-line bg-paper"
        >
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-5 sm:gap-6 sm:px-8">
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2.5"
              aria-label="FounderFloor home"
            >
              <PixelLogo size={22} />
              {/* The wordmark waits for a tablet. It used to appear at
                  400px, which was a breakpoint tuned to one phone: at 412
                  (a Pixel) the wordmark fit and the nav then did not, so
                  the whole page scrolled sideways. The pixel logo is the
                  home affordance on phones and always has been. */}
              <span className="hidden font-display text-lg tracking-tight sm:inline">
                FounderFloor
              </span>
            </Link>
            {/* a hall-board status stamp, in the programme's mono spec type */}
            <span
              aria-hidden="true"
              className="hidden items-center gap-2 border-l border-line pl-4 md:flex"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${GATED ? "bg-accent" : "bg-verify"}`}
              />
              <span className="micro font-mono text-[10px] text-muted">
                {GATED ? "Doors open Sunday" : "Main Hall open"}
              </span>
            </span>
            {/* The nav scrolls ITSELF rather than the document.
                whitespace-nowrap with no overflow rule meant the last item
                hung off the right edge and took the page with it — every
                page, at any width where the row happened not to fit. A nav
                that scrolls is a minor inconvenience; a page that scrolls
                sideways feels broken. */}
            {!GATED && (
              <nav
                aria-label="Main"
                className="no-scrollbar ml-auto flex min-w-0 items-center gap-3 overflow-x-auto whitespace-nowrap sm:gap-5"
              >
                <NavLink href="/lobby">Floors</NavLink>
                <NavLink href="/directory">Directory</NavLink>
                <NavConnections />
                {/* paying members wear their tier in the chrome, site-wide */}
                <MemberBadge />
                {/* the operator's console shortcut — invisible to everyone else */}
                <NavAdmin />
                <NavProfile />
              </nav>
            )}
          </div>
          {/* how far through the page you are, drawn on the header's own rule */}
          <ScrollProgress />
        </header>

        <div id="content" className="flex-1">
          {children}
        </div>

        {/* site-wide chats: bubble button bottom-right, mail toasts top-right
            (hides itself on floors — the game has its own chat panel) */}
        <Messenger />

        {/* plays the membership ceremony on the RECIPIENT's screen when an
            entitlement upgrade lands, whatever page they're on */}
        <MembershipWatcher />

        {/* remembers an invite code from ?ref= on whatever page it lands on */}
        <RefCatcher />

        <footer className="border-t border-line bg-panel">
          {/* pb-20 on phones keeps the fixed chat button from sitting on the
              footer text; desktops have room to spare */}
          {/* The colophon: a masthead rule, then the sections, then the
              small print — set like the back page of a programme rather
              than as a row of link columns. pb-20 on phones keeps the fixed
              chat button off the text. */}
          <div className="mx-auto w-full max-w-6xl px-5 pb-20 pt-10 sm:px-8 sm:pb-10">
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b border-line pb-6">
              <div className="flex items-center gap-3">
                <PixelLogo size={22} />
                <span className="font-display text-2xl tracking-tight">FounderFloor</span>
              </div>
              <span className="micro font-mono text-[10px] text-muted">
                Est. 2026 · one hall · admission free
              </span>
            </div>

            <div className="grid gap-x-10 gap-y-8 pt-8 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
              <p className="max-w-xs text-sm leading-relaxed text-muted">
                A trade-show floor that never tears down. Built by one person
                and a robot, shipped weekly, open to anyone who walks in.
              </p>
              {/* Every link in this column is behind the gate, so while it
                  is up the column is three ways back to the page you are
                  already on. The fine-print column beside it stays. */}
              {GATED ? (
                <div />
              ) : (
                <nav aria-label="Explore" className="text-sm">
                  <span className="micro block border-b border-line pb-2 font-mono text-[10px] text-muted">
                    Explore
                  </span>
                  <div className="mt-3 flex flex-col gap-2">
                    {[
                      ["/lobby", "Floors"],
                      ["/directory", "Directory"],
                      ["/floor/tutorial-hall", "Tutorial"],
                    ].map(([href, label]) => (
                      <Link key={href} href={href} className="text-muted hover:text-ink hover:underline">
                        {label}
                      </Link>
                    ))}
                  </div>
                </nav>
              )}
              <nav aria-label="The fine print" className="text-sm">
                <span className="micro block border-b border-line pb-2 font-mono text-[10px] text-muted">
                  The fine print
                </span>
                <div className="mt-3 flex flex-col gap-2">
                  {[
                    ["/about", "About"],
                    ["/terms", "Terms of Service"],
                    ["/imprint", "Legal Notice"],
                    ["/privacy", "Privacy Policy"],
                    ["/cancel", "Cancel membership"],
                    ["/report", "Report content"],
                    ["/about#feedback", "Send feedback"],
                  ].map(([href, label]) => (
                    <Link key={href} href={href} className="text-muted hover:text-ink hover:underline">
                      {label}
                    </Link>
                  ))}
                </div>
              </nav>
            </div>

            <div className="mt-10 flex flex-col gap-1 border-t border-line pt-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
              <p>&copy; {new Date().getFullYear()} FounderFloor. All rights reserved.</p>
              <p>
                Revenue ranks are self-reported in this beta; treat them
                as claims. Egos need no verification.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
