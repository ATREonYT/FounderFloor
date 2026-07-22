import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import PixelLogo from "@/components/PixelLogo";
import NavLink from "@/components/NavLink";
import NavConnections from "@/components/NavConnections";
import NavProfile from "@/components/NavProfile";
import Messenger from "@/components/Messenger";

export const metadata: Metadata = {
  title: "FounderFloor — a walkable expo for startups",
  description:
    "A 2D trade-show floor that never tears down. Walk in, talk to founders, connect. Ranks come from verified revenue (simulated in this demo).",
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
              <NavProfile />
            </nav>
          </div>
        </header>

        <div className="flex-1">{children}</div>

        {/* site-wide chats: bubble button bottom-right, mail toasts top-right
            (hides itself on floors — the game has its own chat panel) */}
        <Messenger />

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
                  <Link href="/privacy" className="text-muted hover:text-ink hover:underline">
                    Privacy Policy
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
                Revenue ranks are verified &mdash; simulated in this build. Egos
                are not.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
