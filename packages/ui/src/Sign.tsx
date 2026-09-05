/**
 * The sign — the one repeating wayfinding unit (components/Sign.tsx).
 *
 * Fixed anatomy, always in this order: a pictogram in a radius-cornered
 * 36×36 frame, the label lettered as SIGNAGE (the only uppercase on the
 * app), and the real address in mono on the right. `to` marks a
 * DESTINATION — somewhere you can actually go — and only a destination
 * gets the arrow and the accent, "a sign that points everywhere points
 * nowhere". On the blackout plate the accent is accent-lift (5.63:1); on
 * the paper sign it is accent (5.27:1).
 */
import { View } from "react-native";
import { Plate } from "./Plate";
import { Sprite, type SpriteId } from "./Sprite";
import { Signage, Spec } from "./Text";
import { radius, shell } from "./tokens";

export type GlyphId = "bolt" | "leaf" | "coin" | "chip" | "flask" | "rocket" | "heart" | "cube" | "wave" | "star";

export function Sign({
  glyph,
  label,
  code,
  to = false,
  tone = "plate",
}: {
  glyph: GlyphId;
  label: string;
  /** The real address of the thing signed: "#admission", "A-01". */
  code?: string;
  /** Set when the sign names a place you can go. Adds the arrow. */
  to?: boolean;
  tone?: "plate" | "paper";
}) {
  const plate = tone === "plate";
  const glyphId = `glyph-${glyph}-${plate ? "paper" : "ink"}` as SpriteId;
  return (
    <Plate tone={plate ? "plate" : "paperSign"} radius={radius.md}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: radius.sm,
            backgroundColor: plate ? "rgba(250,253,255,0.15)" : shell.well,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* 20px glyph = the 8px bitmap at an integer 2x + 2px of air, as the site frames it */}
          <Sprite id={glyphId} scale={2} />
        </View>
        <Signage tone={to ? (plate ? "accentLift" : "accent") : plate ? "paper" : "ink"} style={{ flexShrink: 1 }}>
          {to ? "→ " : ""}
          {label}
        </Signage>
        {code ? (
          <Spec tone={plate ? "faint" : "muted"} style={{ marginLeft: "auto" }}>
            {code}
          </Spec>
        ) : null}
      </View>
    </Plate>
  );
}
