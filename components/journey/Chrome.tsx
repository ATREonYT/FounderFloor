"use client";

/**
 * THE SHELL AROUND THE JOURNEY.
 *
 * Three places to be — Journey, My Idea, Progress — and a small settings
 * door. That is the whole navigation, on purpose: a founder who is unsure
 * what to do next should never be handed a menu of twelve things.
 *
 * On a phone the three tabs sit along the bottom where a thumb is; on a
 * wider screen they move into the top bar. Both are the same links with
 * the same `aria-current`, so the keyboard and a screen reader see one
 * navigation, not two.
 *
 * The bar also carries the one line of truth about saving. It says
 * "saved" only after storage said yes, and it turns into a plain sentence
 * that stays on screen when storage said no.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import PixelLogo from "@/components/PixelLogo";
import PixelGlyph from "@/components/PixelGlyph";
import type { GlyphId } from "@/lib/types";
import { useJourney } from "@/components/journey/Store";

const TABS: { href: string; label: string; exact: boolean; glyph: GlyphId }[] = [
  { href: "/journey", label: "Journey", exact: true, glyph: "rocket" },
  { href: "/journey/idea", label: "My Idea", exact: false, glyph: "flask" },
  { href: "/journey/progress", label: "Progress", exact: false, glyph: "star" },
];

function isOn(path: string, href: string, exact: boolean): boolean {
  if (exact) return path === href || path.startsWith("/journey/m/") || path === "/journey/start";
  return path === href || path.startsWith(`${href}/`);
}

export function JourneyChrome() {
  const path = usePathname() ?? "/journey";
  const { save, saveError, corrupt, memoryOnly, ready } = useJourney();

  useEffect(() => {
    document.body.dataset.onJourney = "1";
    return () => {
      delete document.body.dataset.onJourney;
    };
  }, []);

  const tabs = (
    <ul className="j-tabs">
      {TABS.map((t) => (
        <li key={t.href}>
          <Link href={t.href} className="j-tab" aria-current={isOn(path, t.href, t.exact) ? "page" : undefined}>
            <PixelGlyph glyph={t.glyph} size={18} color="currentColor" />
            {t.label}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <a className="j-skip" href="#j-main">
        Skip to content
      </a>
      <header className="j-top">
        <div className="j-wrap j-top-in">
          <Link href="/journey" className="j-brand">
            <PixelLogo size={22} />
            <span>FounderFloor</span>
          </Link>
          <nav aria-label="Journey" className="j-topnav">
            {tabs}
          </nav>
          <div className="j-top-right">
            {ready ? (
              <span className="j-save" data-state={save} role="status" title={save === "saved" ? "Saved on this device" : undefined}>
                {save === "saved" ? "Saved" : save === "failed" ? "Not saved" : ""}
              </span>
            ) : null}
            <Link href="/journey/settings" className="j-menu" aria-current={path.startsWith("/journey/settings") ? "page" : undefined}>
              Settings
            </Link>
          </div>
        </div>
      </header>

      {save === "failed" && saveError ? (
        <div className="j-wrap">
          <p className="j-banner" role="alert">
            {saveError}{" "}
            <Link href="/journey/settings">Export it now.</Link>
          </p>
        </div>
      ) : null}
      {memoryOnly && save !== "failed" ? (
        <div className="j-wrap">
          <p className="j-banner" role="alert">
            Your browser is not letting this page keep anything between visits. Your work is held in memory for now.{" "}
            <Link href="/journey/settings">Export it to keep it.</Link>
          </p>
        </div>
      ) : null}
      {corrupt ? (
        <div className="j-wrap">
          <p className="j-banner" role="alert">
            A saved journey was found on this device that could not be read. It has been kept aside, not deleted, and you are starting fresh.
          </p>
        </div>
      ) : null}

      <nav aria-label="Journey" className="j-bottom">
        {tabs}
      </nav>
    </>
  );
}
