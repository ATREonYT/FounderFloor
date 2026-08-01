import Link from "next/link";
import PixelLogo from "@/components/PixelLogo";

/**
 * A 404 in the building's own voice, with the three doors worth trying.
 * The default Next page is an unbranded dead end — this one keeps a
 * mistyped or stale link inside the funnel instead of bouncing it.
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col items-start gap-6 px-4 py-20">
      <PixelLogo size={40} />
      <div>
        <p className="micro text-accent">404 · WRONG DOOR</p>
        <h1 className="mt-2 font-display text-4xl leading-tight">
          There&rsquo;s no hall down here.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted">
          Either the link is old or the stand packed up. Nothing is broken.
          You&rsquo;re just standing in a corridor. The floors are this way:
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/lobby"
          className="btn-press rounded-md bg-accent-strong px-5 py-2.5 text-sm font-medium text-white shadow-card hover:bg-accent-strong/90"
        >
          Pick a floor →
        </Link>
        <Link
          href="/directory"
          className="btn-press rounded-md border border-ink px-5 py-2.5 text-sm font-medium text-ink hover:bg-panel"
        >
          Browse the directory
        </Link>
        <Link
          href="/"
          className="btn-press rounded-md border border-line px-5 py-2.5 text-sm text-muted hover:border-ink hover:text-ink"
        >
          Back to the front
        </Link>
      </div>
    </main>
  );
}
