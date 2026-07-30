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
import Messenger from "@/components/Messenger";

/**
 * Site URL for absolute metadata URLs. Vercel sets VERCEL_URL on preview
 * deploys; NEXT_PUBLIC_SITE_URL wins when set, so a custom domain stays
 * canonical. Without a metadataBase, Next can't build absolute og:image
 * URLs and social previews silently fall back to a bare link.
 */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://founderfloor.net");

const TITLE = "FounderFloor — a walkable expo for startups";
// Kept under 125 characters: past that, X and most previews truncate it
// mid-sentence on phones.
const DESCRIPTION =
  "A 2D trade-show floor that never tears down. Walk in, talk to founders, claim a stand, connect. Free, no install.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s — FounderFloor" },
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
      <body className="flex min-h-screen flex-col bg-paper text-ink">
        {/* sticky translucent chrome — the page scrolls under it. Floor
            pages hide it (body[data-on-floor], set by the floor page): the
            game is fullscreen with its own chrome, and the route-transition
            opacity animation traps the game's z-index below any positioned
            header — so the nav would otherwise float over the hall. */}
        <header
          data-site-nav
          className="sticky top-0 z-40 border-b border-line/60 bg-panel/80 backdrop-blur-md"
        >
          <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-3 px-4 sm:gap-6">
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2.5"
              aria-label="FounderFloor home"
            >
              <PixelLogo size={22} />
              {/* wordmark hides on the tightest phones so the nav never
                  overflows/scrolls at 375px — the pixel logo stays as the
                  home affordance */}
              <span className="hidden font-display text-lg tracking-tight min-[400px]:inline">
                FounderFloor
              </span>
            </Link>
            <nav
              aria-label="Main"
              className="ml-auto flex min-w-0 items-center gap-3 whitespace-nowrap sm:gap-5"
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
          </div>
        </header>

        <div className="flex-1">{children}</div>

        {/* site-wide chats: bubble button bottom-right, mail toasts top-right
            (hides itself on floors — the game has its own chat panel) */}
        <Messenger />

        {/* plays the membership ceremony on the RECIPIENT's screen when an
            entitlement upgrade lands, whatever page they're on */}
        <MembershipWatcher />

        <footer className="border-t border-line bg-panel">
          {/* pb-20 on phones keeps the fixed chat button from sitting on the
              footer text; desktops have room to spare */}
          <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-8 sm:pb-8">
            <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
              <div className="max-w-xs">
                <div className="flex items-center gap-2">
                  <PixelLogo size={18} />
                  <span className="font-display text-base">FounderFloor</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  A trade-show floor that never tears down. Built by one
                  person and a robot.
                </p>
              </div>
              <nav aria-label="Footer" className="flex gap-12 text-sm">
                <div className="flex flex-col gap-2">
                  <span className="micro text-muted">Explore</span>
                  <Link href="/lobby" className="text-muted hover:text-ink hover:underline">
                    Floors
                  </Link>
                  <Link href="/directory" className="text-muted hover:text-ink hover:underline">
                    Directory
                  </Link>
                  <Link href="/floor/tutorial-hall" className="text-muted hover:text-ink hover:underline">
                    Tutorial
                  </Link>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="micro text-muted">The fine print</span>
                  <Link href="/about" className="text-muted hover:text-ink hover:underline">
                    About
                  </Link>
                  <Link href="/terms" className="text-muted hover:text-ink hover:underline">
                    Terms of Service
                  </Link>
                  <Link href="/imprint" className="text-muted hover:text-ink hover:underline">
                    Legal Notice
                  </Link>
                  <Link href="/privacy" className="text-muted hover:text-ink hover:underline">
                    Privacy Policy
                  </Link>
                  <Link href="/cancel" className="text-muted hover:text-ink hover:underline">
                    Cancel membership
                  </Link>
                  <Link href="/report" className="text-muted hover:text-ink hover:underline">
                    Report content
                  </Link>
                  <Link href="/about#feedback" className="text-muted hover:text-ink hover:underline">
                    Send feedback
                  </Link>
                </div>
              </nav>
            </div>
            <div className="mt-8 flex flex-col gap-1 border-t border-line pt-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
              <p>&copy; {new Date().getFullYear()} FounderFloor. All rights reserved.</p>
              <p>
                Revenue ranks are self-reported in this beta &mdash; treat them
                as claims. Egos need no verification.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
