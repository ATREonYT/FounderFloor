"use client";

/** A top-nav link that highlights when it's the current section. */

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname?.startsWith(href));
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`text-sm hover:underline ${active ? "font-medium text-ink" : "text-muted hover:text-ink"}`}
    >
      {children}
    </Link>
  );
}
