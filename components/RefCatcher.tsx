"use client";

/**
 * Catches `?ref=` on arrival, anywhere on the site.
 *
 * Mounted once in the layout rather than on the landing page, because an
 * invite link is pasted into a DM alongside whatever the sender was
 * actually talking about — a stand, the directory, the launch gate. The
 * code has to survive landing on any of them.
 *
 * Renders nothing. It only writes to localStorage, and lib/auth.ts spends
 * what it finds there at registration.
 */

import { useEffect } from "react";
import { rememberRefFromUrl } from "@/lib/referral";

export default function RefCatcher() {
  useEffect(() => {
    rememberRefFromUrl();
  }, []);
  return null;
}
