"use client";

/**
 * PickMenu — the site's own dropdown, replacing the browser's native
 * <select> wherever one would appear.
 *
 * Why it exists: the native control renders in the OS's chrome, not the
 * site's — a grey Apple sheet in the middle of a paper-and-brass hall —
 * and it cannot show counts, hints or a highlighted state that match the
 * rest of the page. This one is drawn from the same tokens as every other
 * panel.
 *
 * What it deliberately keeps from the native control, because these are
 * the parts people rely on without noticing:
 *   - it is a real button: Tab reaches it, Enter/Space/arrows open it
 *   - arrows move the highlight, Enter picks, Escape closes, and the
 *     highlight scrolls into view in a long list
 *   - clicking anywhere else closes it
 *   - ARIA listbox roles, so a screen reader announces it as a select
 *
 * Options are {value, label, hint?} — the hint is the small right-aligned
 * counter ("4 stands"). The empty-string value is a legitimate option
 * (used for "All floors"), so `value` is matched exactly, never by
 * truthiness.
 */

import { useCallback, useEffect, useId, useRef, useState } from "react";

export interface PickOption {
  value: string;
  label: string;
  /** Right-aligned note on the row — a count, a state, a caveat. */
  hint?: string;
}

export default function PickMenu({
  label,
  value,
  options,
  onChange,
  placeholder = "Choose…",
  className = "",
}: {
  /** Visible micro-label above the control. Empty string hides it. */
  label: string;
  value: string;
  options: PickOption[];
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const current = options.find((o) => o.value === value);

  const openAt = useCallback(
    (index: number) => {
      setHi(Math.max(0, index));
      setOpen(true);
    },
    [],
  );

  // Close on any press outside the control — the same contract the native
  // select has, and the reason a half-open menu never lingers over a form.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [open]);

  // Keep the keyboard's highlight on screen in a long list.
  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector(`[data-idx="${hi}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, hi]);

  const pick = (o: PickOption) => {
    onChange(o.value);
    setOpen(false);
  };

  const onKey = (e: React.KeyboardEvent) => {
    const idx = options.findIndex((o) => o.value === value);
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openAt(idx < 0 ? 0 : idx);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHi((h) => Math.min(options.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHi((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (options[hi]) pick(options[hi]);
    } else if (e.key === "Escape" || e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {label !== "" && <span className="micro mb-1.5 block text-muted">{label}</span>}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => (open ? setOpen(false) : openAt(Math.max(0, options.findIndex((o) => o.value === value))))}
        onKeyDown={onKey}
        className="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-md border border-line bg-panel px-3 text-left text-sm hover:border-muted"
      >
        <span className={current ? "text-ink" : "text-muted/70"}>
          {current ? current.label : placeholder}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {current?.hint && <span className="micro text-muted">{current.hint}</span>}
          {/* the fold-out arrow, drawn rather than imported */}
          <svg
            width="10"
            height="6"
            viewBox="0 0 10 6"
            aria-hidden="true"
            className={`text-muted transition-transform ${open ? "rotate-180" : ""}`}
          >
            <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </span>
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={label || placeholder}
          className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-line bg-panel py-1 shadow-float"
        >
          {options.map((o, i) => {
            const selected = o.value === value;
            return (
              <li
                key={`${o.value}::${o.label}`}
                data-idx={i}
                role="option"
                aria-selected={selected}
                onPointerMove={() => setHi(i)}
                onClick={() => pick(o)}
                className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm ${
                  i === hi ? "bg-paper text-ink" : "text-muted"
                }`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={`w-3 shrink-0 text-accent ${selected ? "" : "opacity-0"}`}
                  >
                    ✓
                  </span>
                  <span className="truncate">{o.label}</span>
                </span>
                {o.hint && <span className="micro shrink-0 text-muted">{o.hint}</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
