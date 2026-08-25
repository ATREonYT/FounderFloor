"use client";

/**
 * The embed block: a badge for the founder's own site that links back to
 * their stand. Owners only — it lives on their public page because that is
 * where they'll be when they think "I want this on my site".
 *
 * The snippet is plain HTML — an <a> around an <img> — because it has to
 * survive every website builder ever made. The badge itself is served from
 * /stand/<slug>/badge.svg, so it stays current if the design ever changes
 * without anyone re-pasting anything.
 */

import { useState } from "react";

export default function CopyEmbed({
  slug,
  startupName,
}: {
  slug: string;
  startupName: string;
}) {
  const [copied, setCopied] = useState(false);
  const origin =
    typeof window !== "undefined" && !window.location.hostname.includes("localhost")
      ? window.location.origin
      : "https://founderfloor.net";
  const snippet =
    `<a href="${origin}/stand/${slug}">` +
    `<img src="${origin}/stand/${slug}/badge.svg" alt="${startupName.replace(/"/g, "&quot;")} has a stand on FounderFloor" width="216" height="48" loading="lazy"></a>`;

  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the textarea below is selectable by hand */
    }
  };

  return (
    <section className="mt-8 border-t border-line pt-5" aria-label="Embed">
      <h2 className="font-display text-xl">Put it on your site</h2>
      <p className="mt-1 max-w-prose text-sm text-muted">
        A small badge that links back here. Paste it in your footer, your
        readme, wherever people already find you.
      </p>
      <div className="mt-3 rounded-md border border-line bg-panel p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/stand/${encodeURIComponent(slug)}/badge.svg`}
          alt={`${startupName} has a stand on FounderFloor`}
          width={216}
          height={48}
          className="pixelated"
        />
      </div>
      <textarea
        readOnly
        value={snippet}
        rows={3}
        onFocus={(e) => e.currentTarget.select()}
        aria-label="Embed code"
        className="mt-2 w-full rounded-md border border-line bg-paper px-3 py-2 font-mono text-[11px] leading-relaxed text-muted"
      />
      <button
        type="button"
        onClick={() => void copy()}
        className="btn-press mt-2 min-h-[44px] rounded-md border border-ink px-4 text-sm hover:bg-panel"
      >
        {copied ? "Copied" : "Copy embed code"}
      </button>
    </section>
  );
}
