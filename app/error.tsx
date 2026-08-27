"use client";

/**
 * The route-level error boundary, in the building's own voice. A launch
 * multiplies every rare page, and the default unstyled crash screen is
 * the one place the venue metaphor must not drop: something tripped a
 * breaker, the building is fine, here is the way back. Two sentences,
 * a retry, and one door to the lobby — nothing else.
 */

import Link from "next/link";
import PixelLogo from "@/components/PixelLogo";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col items-start gap-6 px-4 py-20">
      <PixelLogo size={40} />
      <div>
        <p className="micro text-accent">SOMETHING TRIPPED A BREAKER</p>
        <h1 className="mt-2 font-display text-4xl leading-tight">
          The lights flickered on this page.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted">
          Something here broke; the rest of the building is fine. Try the
          switch, or take the corridor back to the lobby.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="btn-press rounded-md bg-accent-strong px-5 py-2.5 text-sm font-medium text-white shadow-card hover:bg-accent-strong/90"
        >
          Try again
        </button>
        <Link
          href="/lobby"
          className="btn-press rounded-md border border-ink px-5 py-2.5 text-sm font-medium text-ink hover:bg-panel"
        >
          Back to the lobby
        </Link>
      </div>
    </main>
  );
}
