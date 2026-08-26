"use client";

/**
 * The founder's public address, shown where they manage the stand.
 *
 * The public page exists whether or not anyone mentions it — this is the
 * mention. One line with the URL, a copy button, and the door through to
 * the page itself, which is where the build log is written and the embed
 * badge lives. Without this block a founder only finds their own address
 * by accident, and an asset nobody knows they own is not an asset.
 *
 * The slug comes from the server (minted at first claim or registration),
 * so this asks for it once and shows nothing until it exists — a founder
 * who has not set up a stand has no address to be told about.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchStand } from "@/lib/social";

export default function PublicAddress({ ownerId }: { ownerId: string }) {
  const [slug, setSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!ownerId) return;
    let dead = false;
    void fetchStand(ownerId).then((res) => {
      if (!dead && res.state === "found" && res.entry.slug) setSlug(res.entry.slug);
    });
    return () => {
      dead = true;
    };
  }, [ownerId]);

  if (!slug) return null;

  const origin =
    typeof window !== "undefined" && !window.location.hostname.includes("localhost")
      ? window.location.origin
      : "https://founderfloor.net";
  const url = `${origin}/stand/${slug}`;

  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the address is selectable text */
    }
  };

  return (
    <div className="mt-4 rounded-md border border-line bg-paper p-4">
      <p className="micro text-xs text-muted">YOUR PUBLIC PAGE</p>
      <p className="mt-1 select-all break-all font-mono text-sm text-ink">{url}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-muted">
        Works without an account — this is the link for bios and readmes.
        Your build log and the embed badge live on it.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void copy()}
          className="btn-press rounded-md border border-ink px-3 py-2 text-sm hover:bg-panel"
        >
          {copied ? "Copied" : "Copy link"}
        </button>
        <Link
          href={`/stand/${slug}`}
          className="rounded-md border border-line px-3 py-2 text-sm text-muted hover:border-ink hover:text-ink"
        >
          Open the page
        </Link>
      </div>
    </div>
  );
}
