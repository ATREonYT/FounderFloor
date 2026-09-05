/**
 * A founder's booth, composed from the atlas exactly as the floor composes
 * it — and by the same rule game/standScene.ts uses: every piece (plinth,
 * carpet, banner, counter) is drawn at ONE origin (bx, by), and the founder
 * stands at (2T − 10, 2T − 2 − 28) from it. The atlas recorded, for each
 * crop, where that origin sits inside it (anchor.x/y), so composing is just
 * placing each sprite at (−ax, −ay) from a shared origin and shifting the
 * whole group so nothing is negative. No offset here was guessed.
 *
 * Draw order is the floor's: plinth, carpet, banner, founder, counter.
 */
import { View } from "react-native";
import { Sprite, spriteMeta, type SpriteId } from "./Sprite";
import { SPRITE, TILE } from "./tokens";

export type CarpetPattern = "solid" | "border" | "stripes";

export function Booth({
  swatch,
  carpetSwatch = swatch,
  pattern = "solid",
  look = { skin: 2, outfit: 0, hair: 0 },
  scale = 2,
}: {
  /** Index into BOOTH_SWATCHES (0–13) for the banner. */
  swatch: number;
  carpetSwatch?: number;
  pattern?: CarpetPattern;
  look?: { skin: number; outfit: number; hair: number };
  scale?: 1 | 2 | 3 | 4;
}) {
  const parts: { id: SpriteId; ox: number; oy: number }[] = [
    { id: "stand-plinth", ox: 0, oy: 0 },
    { id: `carpet-${carpetSwatch}-${pattern}` as SpriteId, ox: 0, oy: 0 },
    { id: `banner-${swatch}` as SpriteId, ox: 0, oy: 0 },
    // the atlas keeps one avatar family per palette axis; outfits vary most
    { id: `avatar-outfit${look.outfit}-down-0` as SpriteId, ox: 2 * TILE - SPRITE.w / 2, oy: 2 * TILE - 2 - SPRITE.h },
    { id: "counter", ox: 0, oy: 0 },
  ];
  // each sprite's top-left, in native px, relative to the shared origin
  const placed = parts.map((p) => {
    const m = spriteMeta(p.id);
    return { ...p, x: p.ox - m.ax, y: p.oy - m.ay, w: m.w, h: m.h };
  });
  const minX = Math.min(...placed.map((p) => p.x));
  const minY = Math.min(...placed.map((p) => p.y));
  const maxX = Math.max(...placed.map((p) => p.x + p.w));
  const maxY = Math.max(...placed.map((p) => p.y + p.h));
  const W = (maxX - minX) * scale;
  const H = (maxY - minY) * scale;
  return (
    <View style={{ width: W, height: H, position: "relative" }} accessibilityRole="image" accessibilityLabel="Your booth">
      {placed.map((p) => (
        <Sprite key={p.id} id={p.id} scale={scale} style={{ position: "absolute", left: (p.x - minX) * scale, top: (p.y - minY) * scale }} />
      ))}
    </View>
  );
}
