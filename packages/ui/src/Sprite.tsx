/**
 * A sprite from the atlas, at an INTEGER scale, never smoothed.
 *
 * The atlas ships one PNG per sprite at 4x (its native pixels x4, rendered
 * by Chromium with crispEdges). This component displays it at native x
 * `scale` logical px. A 4x source shown at 1x/2x/3x/4x is an integer
 * downsample or identity, so no pixel is ever interpolated into a blur —
 * which is the whole reason the site's 1.5x zoom rung is not reproduced.
 *
 * Anchors: the manifest records where the drawing's origin sits inside the
 * crop (a sprite drawn at (0,0) that started painting at (-3,-10) anchors
 * at (3,10)). Avatars anchor at feet-centre (10, 28). `anchored` places the
 * sprite so that its origin lands on the component's (0,0).
 */
import { Image, type ImageStyle } from "expo-image";
import type { StyleProp } from "react-native";
import { SPRITE_META, SPRITE_PNG, type SpriteId } from "./atlas.gen";

export type { SpriteId };
export const spriteMeta = (id: SpriteId) => SPRITE_META[id];

export function Sprite({
  id,
  scale = 2,
  anchored = false,
  style,
  accessibilityLabel,
}: {
  id: SpriteId;
  /** Integer only. 1–4 are exact; larger values are still integer-sharp. */
  scale?: 1 | 2 | 3 | 4 | 5 | 6;
  anchored?: boolean;
  style?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
}) {
  const m = SPRITE_META[id];
  const s = Math.max(1, Math.round(scale));
  const w = m.w * s;
  const h = m.h * s;
  const offset = anchored ? { marginLeft: -m.ax * s, marginTop: -m.ay * s } : null;
  return (
    <Image
      source={SPRITE_PNG[id]}
      style={[{ width: w, height: h }, offset, style]}
      contentFit="fill"
      // expo-image has no nearest-neighbour switch; an integer downsample of
      // a crispEdges render is pixel-exact by construction, and on web the
      // stylesheet below adds image-rendering: pixelated as belt and braces.
      cachePolicy="memory-disk"
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel ? "image" : undefined}
    />
  );
}

/** Web only: make sure nothing ever smooths an atlas image. */
export const PIXELATED_CSS = `img[src*="/sprites/"],img[src*="sprites/"]{image-rendering:pixelated;image-rendering:crisp-edges}`;
