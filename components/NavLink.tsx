"use client";

/** A top-nav link that highlights when it's the current section. */

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname?.startsWith(href));
  return (
    // The current section is marked with a rule under the label, and hover
    // draws the same rule in from the left — the nav speaks the site's own
    // hairline vocabulary instead of the browser's default underline.
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative pb-1 text-sm after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:origin-left after:bg-accent after:transition-transform after:duration-200 after:content-[''] hover:after:scale-x-100 motion-reduce:after:transition-none ${
        active
          ? "font-medium text-ink after:scale-x-100"
          : "text-muted after:scale-x-0 hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}
