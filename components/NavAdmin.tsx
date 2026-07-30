"use client";

/**
 * The operator's shortcut to /admin, shown ONLY when the signed-in email is
 * on the admin list. Purely cosmetic — the server independently verifies
 * every /admin call, and the page itself 404s for anyone else — so hiding
 * it from other people is about tidiness, not security.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAuth } from "@/lib/auth";
import { useAppState } from "@/lib/store";

// Mirrors the server's ADMIN_EMAILS default: both addresses while the
// operator account moves from founder-floor.com to founderfloor.net.
const ADMIN_EMAILS = new Set(
  (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "ak@founderfloor.net,ak@founder-floor.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
);

export default function NavAdmin() {
  const [state] = useAppState();
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    const email = getAuth()?.email?.toLowerCase();
    setIsAdmin(!!email && ADMIN_EMAILS.has(email));
  }, [state.profile.id]);

  if (!isAdmin) return null;
  return (
    <Link
      href="/admin"
      className="micro flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-ink/40 bg-ink px-2.5 py-1 text-paper hover:bg-ink/85"
    >
      <span aria-hidden="true">⌘</span>
      Console
    </Link>
  );
}
