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
import PixelLogo from "@/components/PixelLogo";

interface Item {
  href: string;
  title: string;
  line: string;
}

const MENUS: { label: string; items: Item[] }[] = [
  {
    label: "The app",
    items: [
      { href: "/v2/road", title: "The road", line: "Seven stops from an idea to a paying customer" },
      { href: "/v2/rooms", title: "The six rooms", line: "Idea, Validate, Set up, Customers, Money, Raise" },
      { href: "/v2/week", title: "Your week", line: "Three tasks, and Friday reads the week back to you" },
      { href: "/v2/workshop", title: "The workshop", line: "Your idea drawn as real, tappable screens" },
      { href: "/v2/build", title: "Take it to a builder", line: "One prompt that carries the whole design" },
    ],
  },
  {
    label: "The staff",
    items: [
      { href: "/v2/coaches", title: "The four coaches", line: "Ines, Jonah, Margot and Theo, one job each" },
      { href: "/v2/notebook", title: "The notebook", line: "What the building writes down as you work" },
      { href: "/v2/drawer", title: "The drawer", line: "Eleven documents, drafted from your own numbers" },
    ],
  },
  {
    label: "The floor",
    items: [
      { href: "/v2/map", title: "The building", line: "Five floors, and a hall you can walk right now" },
      { href: "/v2/floor", title: "What the floor is", line: "Put your product up and walk around everyone else's" },
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
        <Link href="/v2" className="brand">
          <PixelLogo size={26} />
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
                  <Link key={i.href + i.title} href={i.href} role="menuitem">
                    <b>{i.title}</b>
                    <span>{i.line}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <Link className="nav-link" href="/v2/pricing">
            What it costs
          </Link>
          <span className="tag">
            <i />
            Free, no account
          </span>
          <Link className="btn primary sm" href="/v2">
            Draw my app
          </Link>
        </div>
      </div>
    </nav>
  );
}
