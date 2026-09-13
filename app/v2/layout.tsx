import type { Metadata } from "next";
import Link from "next/link";
import "./studio.css";
import Nav from "@/components/studio/Nav";
import OwnChrome from "@/components/studio/OwnChrome";

export const metadata: Metadata = {
  title: "FounderFloor — see your start-up before you build it",
  description: "Type one sentence and get the real screens of your product, then a four-week plan to get a person to pay for it.",
};

/**
 * The bar and the footer live here so every page in the site has them
 * without each one remembering to. The new site lives under its own
 * layout while it is being built, so it cannot touch what is live; when
 * it is ready this becomes the root and /v2 goes away.
 */
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="studio">
      <OwnChrome />
      <Nav />
      {children}
      <footer className="foot">
        <div className="wrap foot-in">
          <div style={{ maxWidth: 340, display: "flex", flexDirection: "column", gap: 10 }}>
            <span className="brand">FounderFloor</span>
            <p className="small">
              From an idea to a start-up with a paying customer. Built by one person, shipped weekly.
            </p>
          </div>
          <div>
            <p className="label" style={{ marginBottom: 8 }}>The app</p>
            <Link href="/v2/road">The road</Link>
            <Link href="/v2/week">Your week</Link>
            <Link href="/v2/build">Take it to a builder</Link>
            <Link href="/v2/floor">The floor</Link>
          </div>
          <div>
            <p className="label" style={{ marginBottom: 8 }}>The fine print</p>
            <Link href="/about">About</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
