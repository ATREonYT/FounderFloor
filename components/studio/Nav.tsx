"use client";

/**
 * THE BAR, WITH MENUS THAT OPEN ON HOVER.
 *
 * Hover menus are usually annoying for one reason: the pointer has to
 * cross a gap between the button and the panel, and if that gap is not
 * part of the hover target the menu closes on the way. So the whole
 * thing — button, gap and panel — is one hover area, and the gap is
 * bridged by a strip that exists only to be hovered over.
 *
 * It opens on focus as well as hover, so the keyboard reaches every link
 * in it, and it is hidden below 760px where hovering is not a thing
 * anyone can do.
 */
import Link from "next/link";

interface Item {
  href: string;
  title: string;
  line: string;
}

const MENUS: { label: string; items: Item[] }[] = [
  {
    label: "The app",
    items: [
      { href: "#road", title: "The road", line: "Seven stops from an idea to a paying customer" },
      { href: "#week", title: "Your week", line: "Three tasks, and Friday reads the week back to you" },
      { href: "#workshop", title: "The Workshop", line: "Your app drawn from your own words" },
      { href: "#handoff", title: "Take it to a builder", line: "One prompt that carries the whole design" },
    ],
  },
  {
    label: "The floor",
    items: [
      { href: "#floor", title: "What the floor is", line: "Put your product up and walk around everyone else's" },
      { href: "/directory", title: "The directory", line: "Everyone who has a stand" },
    ],
  },
];

const Chevron = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Nav() {
  return (
    <nav className="nav">
      <div className="wrap nav-in">
        <Link href="#top" className="brand">
          <span className="mark">FF</span>
          FounderFloor
        </Link>

        <div className="menus">
          {MENUS.map((m) => (
            <div className="menu" key={m.label}>
              <button type="button" aria-haspopup="true">
                {m.label}
                <Chevron />
              </button>
              <div className="panel-menu" role="menu">
                {m.items.map((i) => (
                  <a key={i.href + i.title} href={i.href} role="menuitem">
                    <b>{i.title}</b>
                    <span>{i.line}</span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <span className="tag">
            <i />
            Free, no account
          </span>
          <a className="btn primary sm" href="#top">
            Draw my app
          </a>
        </div>
      </div>
    </nav>
  );
}
