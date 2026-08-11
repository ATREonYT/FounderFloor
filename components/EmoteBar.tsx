"use client";

/**
 * One-key reactions. Keys 1-8 fire globally while no text field is focused;
 * the buttons work everywhere (and are the only path on touch). The last
 * three slots are quest rewards — locked ones show which quest opens them.
 */

import { useEffect, useRef, useState } from "react";
import { EMOTES, type EmoteKind } from "@/lib/types";
import { useDevice } from "@/lib/device";
import { questForEmote } from "@/lib/data/quests";
import { emoteDataUrl } from "@/game/emotes";

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

export default function EmoteBar({
  onEmote,
  unlocked,
}: {
  onEmote: (kind: EmoteKind) => void;
  /** Emote kinds this player can fire (quests unlock the rest). */
  unlocked: EmoteKind[];
}) {
  /* Control size follows the input AND the room available.
     A finger needs a big target and cannot read a "press 3" caption for a
     keyboard it does not have; a mouse is precise, and every pixel the
     chrome gives back is a pixel of hall.
     The size is then computed rather than picked from a width bucket,
     because the bucket was wrong on the phones between the buckets: at
     393px eight 48px buttons overflowed and the last two reactions
     silently scrolled out of reach. Better a row that fits at 42px than a
     row at 48 with two buttons nobody can find. */
  const device = useDevice();
  const touch = device.pointer === "touch";
  const showKeys = !touch;
  /* Locked reactions are a preview, and a preview is a luxury on a 360px
     screen. On touch they are dropped and the quest panel — which is where
     you would go to unlock them anyway — carries that job alone. */
  const shown = touch ? EMOTES.filter((em) => unlocked.includes(em.kind)) : EMOTES;
  const GAP = 2;
  const CHROME = 32 + 8; // page insets + the bar's own padding
  const fit = Math.floor((device.width - CHROME - (shown.length - 1) * GAP) / Math.max(1, shown.length));
  const px = touch ? Math.max(40, Math.min(48, fit)) : 36;

  const cbRef = useRef(onEmote);
  cbRef.current = onEmote;
  const unlockedRef = useRef(unlocked);
  unlockedRef.current = unlocked;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      if (isTyping(e.target)) return;
      const emote = EMOTES.find((x) => x.key === e.key);
      if (!emote || !unlockedRef.current.includes(emote.kind)) return;
      e.preventDefault();
      cbRef.current(emote.kind);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      role="toolbar"
      aria-label="Reactions"
      className="glass no-scrollbar pointer-events-auto flex max-w-full gap-0.5 overflow-x-auto overscroll-x-contain p-1 shadow-float"
    >
      {shown.map((em) => {
        const open = unlocked.includes(em.kind);
        if (!open) {
          const quest = questForEmote(em.kind);
          return (
            <button
              key={em.kind}
              type="button"
              disabled
              aria-label={`${em.label} — locked`}
              title={quest ? `Locked — finish "${quest.title}" (${quest.blurb})` : "Locked"}
              style={{ width: px, height: px }}
              className="flex shrink-0 cursor-help flex-col items-center justify-center rounded-sm opacity-40"
            >
              <PixelEmote kind={em.kind} dim />
              {showKeys && (
                <span aria-hidden="true" className="micro mt-0.5 leading-none text-muted">
                  ✕
                </span>
              )}
            </button>
          );
        }
        return (
          <button
            key={em.kind}
            type="button"
            onClick={() => onEmote(em.kind)}
            aria-label={`${em.label} (key ${em.key})`}
            title={`${em.label} — ${em.key}`}
            style={{ width: px, height: px }}
            className="flex shrink-0 flex-col items-center justify-center rounded-sm hover:bg-paper active:bg-accent-soft"
          >
            <PixelEmote kind={em.kind} />
            {showKeys && (
              <span aria-hidden="true" className="micro mt-0.5 leading-none text-muted">
                {em.key}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Our own pixel-art reaction icon (client-rendered to a data URL). */
function PixelEmote({ kind, dim = false }: { kind: EmoteKind; dim?: boolean }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    setUrl(emoteDataUrl(kind, 18));
  }, [kind]);
  if (!url) return <span aria-hidden="true" className="block h-[18px] w-[18px]" />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      aria-hidden="true"
      width={18}
      height={18}
      className={`pixelated ${dim ? "opacity-70 grayscale" : ""}`}
    />
  );
}
