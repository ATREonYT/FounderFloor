/**
 * The sign — the one repeating wayfinding unit, used for every section
 * header and plaque, and improvised nowhere.
 *
 * One fixed anatomy, always in this order: a pictogram in a
 * radius-cornered square frame, the label set as SIGNAGE — uppercase and
 * wide-tracked, the way a hall letters its own boards — and the real
 * anchor or stand reference in mono on the right.
 *
 * `to` marks a DESTINATION: somewhere in the building you can actually
 * walk to, as opposed to a section that only explains something. A
 * destination gets the arrow and the accent; everything else stays
 * quiet. That is the whole rule, and it is why the arrow means
 * something — a sign that points everywhere points nowhere. It is set like the
 * hall's own boards — blackout plate, badge-clipped corner — so the page
 * and the game read as one building. The code slot shows genuine data
 * (a URL anchor, a booth number), never decoration.
 *
 * Server-safe: PixelGlyph is plain SVG.
 */

import PixelGlyph from "@/components/PixelGlyph";
import type { GlyphId } from "@/lib/types";

export default function Sign({
  glyph,
  label,
  code,
  to,
  tone = "plate",
}: {
  glyph: GlyphId;
  label: string;
  /** The real address of the thing signed: "#admission", "A-01". */
  code?: string;
  /** Set when the section names a place you can go. Adds the arrow. */
  to?: boolean;
  /** plate = blackout (default, like the hall boards); paper = quiet. */
  tone?: "plate" | "paper";
}) {
  const plate = tone === "plate";
  return (
    <div
      className={`clip-badge flex items-center gap-3 border px-3 py-2 ${
        plate ? "border-blackout bg-blackout" : "border-trestle bg-foamcore"
      }`}
    >
      {/* the pictogram frame: radius-cornered square, concentric inside
          the plate (plate 8 − gap 4 = frame 4) */}
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded ${
          plate ? "bg-foamcore/15" : "bg-laminate"
        }`}
      >
        <PixelGlyph glyph={glyph} size={16} color={plate ? "var(--paper)" : "var(--ink)"} />
      </span>
      <span
        className={`min-w-0 font-display text-xs uppercase leading-tight tracking-[0.12em] ${
          to ? "text-accent" : plate ? "text-paper" : "text-ink"
        }`}
      >
        {to && (
          <span aria-hidden="true" className="mr-1.5">
            &rarr;
          </span>
        )}
        {label}
      </span>
      {code && (
        <span
          className={`ml-auto shrink-0 font-mono text-xs ${
            plate ? "text-gantry" : "text-conduit"
          }`}
        >
          {code}
        </span>
      )}
    </div>
  );
}
