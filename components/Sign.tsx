/**
 * The sign — the one repeating wayfinding unit, used for every section
 * header and plaque, and improvised nowhere.
 *
 * One fixed anatomy, always in this order: a pictogram in a
 * radius-cornered square frame, the label in the display face, and the
 * real anchor or booth code in mono on the right. It is set like the
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
  tone = "plate",
}: {
  glyph: GlyphId;
  label: string;
  /** The real address of the thing signed: "#admission", "A-114". */
  code?: string;
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
        className={`min-w-0 truncate font-display text-lg leading-none ${
          plate ? "text-paper" : "text-ink"
        }`}
      >
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
