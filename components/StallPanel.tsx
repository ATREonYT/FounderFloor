"use client";

/**
 * The shell every merchant stall opens inside.
 *
 * Stalls used to router.push() you to a page, which meant walking up to the
 * porter, pressing E, and being thrown off the floor — your spot lost, the
 * hall torn down and rebuilt when you came back. This is the same content
 * as an overlay ON the floor: the game keeps running behind it, the
 * player keeps standing where they were, and closing it puts you straight
 * back in the room.
 *
 * Mechanics worth keeping if this gets refactored:
 *   - it renders INSIDE the floor viewport, not through a portal to body,
 *     so it inherits the floor's stacking context and cannot end up under
 *     the chat strip or over the site chrome
 *   - opening disables the game's movement keys (onFocusChange), or WASD
 *     types into whatever field is on the panel
 *   - closing animates out before unmounting, so it does not just vanish
 *   - Escape and the backdrop both close it, because on a phone there is
 *     no Escape and on a desktop there is no obvious backdrop
 */

import { useCallback, useEffect, useRef, useState } from "react";

export interface StallPanelProps {
  /** Sign over the stall, e.g. "PORTER'S LODGE". */
  sign: string;
  /** Who is behind the counter. */
  keeper: string;
  /** One line under the header. */
  blurb: string;
  /** Awning colour, used for the header rule and the keeper chip. */
  color: string;
  /** Games need elbow room; the shop and the register do not. */
  wide?: boolean;
  onClose(): void;
  /** Called with true on open and false on close, to gate the movement keys. */
  onFocusChange?(focused: boolean): void;
  children: React.ReactNode;
}

const OUT_MS = 190;

export default function StallPanel({
  sign,
  keeper,
  blurb,
  color,
  wide = false,
  onClose,
  onFocusChange,
  children,
}: StallPanelProps) {
  const [shown, setShown] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Animate in on the frame after mount: setting the final state in the
  // same paint as the initial one gives no transition at all.
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    onFocusChange?.(true);
    return () => onFocusChange?.(false);
  }, [onFocusChange]);

  const dismiss = useCallback(() => {
    if (leaving) return;
    setLeaving(true);
    closeTimer.current = setTimeout(onClose, OUT_MS);
  }, [leaving, onClose]);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        e.stopPropagation();
        dismiss();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [dismiss]);

  // Move focus into the panel so a keyboard visitor is not left behind on
  // the canvas, and so Escape reaches us first.
  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  const open = shown && !leaving;

  return (
    <div
      className="absolute inset-0 z-[60] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={sign}
    >
      {/* backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={dismiss}
        className="absolute inset-0 cursor-default bg-ink/45 transition-opacity duration-200 ease-out"
        style={{ opacity: open ? 1 : 0 }}
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        className={`panel relative flex max-h-full w-full ${wide ? "max-w-3xl" : "max-w-lg"} flex-col overflow-hidden shadow-float outline-none transition-all duration-200 ease-out`}
        style={{
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0) scale(1)" : "translateY(10px) scale(0.97)",
        }}
      >
        {/* the awning stripe, so the panel is visibly the stall you opened */}
        <div className="flex h-2 w-full shrink-0">
          {Array.from({ length: 14 }).map((_, i) => (
            <span
              key={i}
              className="h-full flex-1"
              style={{ background: i % 2 ? "#F2EFE7" : color }}
            />
          ))}
        </div>

        <header className="flex shrink-0 items-start gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl leading-tight tracking-tight">{sign}</h2>
            <p className="mt-1 text-sm leading-snug text-muted">{blurb}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <span
              className="micro rounded-full px-2 py-1 text-[10px] text-paper"
              style={{ background: color }}
            >
              {keeper}
            </span>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-md border border-line px-2.5 py-1 text-xs text-muted transition-colors hover:bg-paper hover:text-ink"
            >
              Close
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        <footer className="shrink-0 border-t border-line px-5 py-2.5">
          <p className="micro text-[10px] text-muted">
            Esc or tap outside to go back to the hall — you keep your spot
          </p>
        </footer>
      </div>
    </div>
  );
}
