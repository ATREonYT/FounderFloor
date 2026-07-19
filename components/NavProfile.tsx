"use client";

/**
 * Nav link to /profile that shows your signed-in state at a glance: a green
 * dot plus your email (space permitting) when a verified account session is
 * active, plain "Profile" for guests. Reads localStorage, so it renders
 * after mount only — the server-rendered shell shows the plain link.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAuth, type AuthState } from "@/lib/auth";
import { useAppState } from "@/lib/store";

export default function NavProfile() {
  const [state] = useAppState();
  const [auth, setAuth] = useState<AuthState | null>(null);
  useEffect(() => {
    setAuth(getAuth());
    // profile.id changes on sign-in/out — re-read the session then
  }, [state.profile.id]);

  return (
    <Link
      href="/profile"
      className="flex items-center gap-1.5 text-sm text-muted hover:text-ink hover:underline"
      title={auth ? `Signed in as ${auth.name}${auth.email ? ` (${auth.email})` : ""}` : undefined}
    >
      {auth && (
        <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-verify" />
      )}
      Profile
      {auth && (
        <span className="hidden max-w-[180px] truncate text-xs text-verify lg:inline">
          {auth.email || auth.name}
        </span>
      )}
      {auth && <span className="sr-only">— signed in as {auth.email || auth.name}</span>}
    </Link>
  );
}
