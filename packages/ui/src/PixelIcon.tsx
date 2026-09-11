/**
 * THE PICTOGRAMS — the app's icon family, drawn by hand on a 16 by 16
 * grid in three tones of one colour: the body, a shade on the lower and
 * right edges, a light on the upper left. Rendered as crisp rectangles,
 * never smoothed, at any size. They replace the 8 by 8 atlas glyphs,
 * which read as emoji once they were scaled up and set in tinted tiles.
 *
 * A pictogram is the pixel keeper's world at the size of an icon: the
 * same hard edges, the same two-tone shading, nothing thin, nothing
 * outlined. Draw new ones here, on the grid, and nowhere else.
 */
import Svg, { Rect } from "react-native-svg";

export type PixelIconId = "bolt" | "leaf" | "coin" | "chip" | "flask" | "rocket" | "heart" | "cube" | "wave" | "star" | "check" | "lock" | "arrow" | "pin";

/** a = body, b = shade, c = light, . = nothing. Sixteen rows of sixteen. */
const MAPS: Record<PixelIconId, string[]> = {
  star: [
    ".......a........",
    "......aca.......",
    "......aca.......",
    ".....acaaa......",
    ".....acaaa......",
    "aaaaaacaaaaaaaa.",
    ".aaaaacaaaaaab..",
    "..aaaacaaaaab...",
    "...aaaaaaaab....",
    "...aaaaaaaab....",
    "..aaaaa.aaaab...",
    "..aaab...baab...",
    ".aab.......bab..",
    ".ab.........bb..",
    ".b...........b..",
    "................",
  ],
  heart: [
    "................",
    "..aaaa....aaaa..",
    ".acccaa..aaaaab.",
    "acccaaaaaaaaaaab",
    "accaaaaaaaaaaaab",
    "aaaaaaaaaaaaaaab",
    "aaaaaaaaaaaaaaab",
    ".aaaaaaaaaaaaab.",
    ".aaaaaaaaaaaaab.",
    "..aaaaaaaaaaab..",
    "...aaaaaaaaab...",
    "....aaaaaaab....",
    ".....aaaaab.....",
    "......aaab......",
    ".......ab.......",
    "................",
  ],
  bolt: [
    ".......aaaaa....",
    "......accaa.....",
    "......acaa......",
    ".....acaa.......",
    ".....acaa.......",
    "....aaaaaaaaa...",
    "....aaaaaaab....",
    "...aaaaaaab.....",
    "......aaab......",
    ".....aaab.......",
    ".....aab........",
    "....aab.........",
    "....ab..........",
    "...ab...........",
    "...b............",
    "................",
  ],
  leaf: [
    "................",
    "..........aaaa..",
    ".......aaaaaaaa.",
    ".....aaaaccaaaa.",
    "....aaaaccaaaaa.",
    "...aaaaccaaaaaa.",
    "...aaaacaaaaaab.",
    "..aaaaaaaaaaab..",
    "..aaaaaacaaab...",
    "..aaaaaacaab....",
    "..aaaaaacab.....",
    "...aaaaacb......",
    "....aaaab.......",
    "......ab........",
    ".....b..........",
    "....b...........",
  ],
  coin: [
    ".....aaaaaa.....",
    "...aaccaaaaaa...",
    "..accaaaaaaaaa..",
    ".accaaabbbbaaab.",
    ".acaaab....baab.",
    "aacaab......baab",
    "aaaaab......baab",
    "aaaaab......baab",
    "aaaaab......baab",
    "aaaaab......baab",
    ".aaaab......bab.",
    ".aaaaab....baab.",
    "..aaaaabbbbaab..",
    "...aaaaaaaabb...",
    ".....bbbbbb.....",
    "................",
  ],
  chip: [
    "...a..a..a..a...",
    "...a..a..a..a...",
    ".aaaaaaaaaaaaaa.",
    ".abbbbbbbbbbbba.",
    "aabccccccccccbaa",
    ".abcaaaaaaaacba.",
    "aabcaaaaaaaacbaa",
    ".abcaaaaaaaacba.",
    "aabcaaaaaaaacbaa",
    ".abcaaaaaaaacba.",
    "aabccccccccccbaa",
    ".abbbbbbbbbbbba.",
    ".aaaaaaaaaaaaaa.",
    "...a..a..a..a...",
    "...a..a..a..a...",
    "................",
  ],
  flask: [
    ".....aaaaaa.....",
    "......a..a......",
    "......a..a......",
    "......a..a......",
    "......a..a......",
    ".....aa..aa.....",
    ".....a....a.....",
    "....aa....aa....",
    "....a......a....",
    "...aabbbbbbaa...",
    "...abbbbbbbba...",
    "..aabbbbbbbbaa..",
    "..abbbbbbbbbba..",
    "..aabbbbbbbbaa..",
    "...aaaaaaaaaa...",
    "................",
  ],
  rocket: [
    ".......aa.......",
    "......acca......",
    "......acca......",
    ".....accaaa.....",
    ".....acaaaa.....",
    ".....aabbaa.....",
    ".....abaabb.....",
    ".....abaabb.....",
    "....aaabbaaa....",
    "...aaaaaaaaaa...",
    "..aaaaaaaaaaaa..",
    "..aa.aaaaaa.aa..",
    ".....ab..ba.....",
    "......b..b......",
    ".....bb..bb.....",
    "................",
  ],
  cube: [
    ".......aa.......",
    ".....aaccaa.....",
    "...aaccccccaa...",
    ".aaccccccccccaa.",
    ".aaaccccccccaaa.",
    ".aaaaaccccaaaab.",
    ".aaaaaaaaaaaaab.",
    ".aaaaaaabbbbbbb.",
    ".aaaaaaabbbbbbb.",
    ".aaaaaaabbbbbbb.",
    ".aaaaaaabbbbbbb.",
    ".aaaaaaabbbbbbb.",
    "..aaaaaabbbbbb..",
    "....aaaabbbb....",
    "......aabb......",
    "................",
  ],
  wave: [
    "................",
    "................",
    "..aa.......aa...",
    ".acca.....acca..",
    "acccaa...aaccaa.",
    "c...aaa.aaa...aa",
    ".....aaaaa......",
    "......aaa.......",
    "..aa.......aa...",
    ".acca.....acca..",
    "acccaa...aaccaa.",
    "c...aaa.aaa...aa",
    ".....aaaaa......",
    "......aaa.......",
    "................",
    "................",
  ],
  check: [
    "................",
    "................",
    "............aa..",
    "...........aaa..",
    "..........aaab..",
    ".........aaab...",
    "..aa....aaab....",
    "..aaa..aaab.....",
    "...aaaaaab......",
    "....aaaab.......",
    ".....aab........",
    "......b.........",
    "................",
    "................",
    "................",
    "................",
  ],
  lock: [
    "................",
    ".....aaaaaa.....",
    "....aa....aa....",
    "....a......a....",
    "....a......a....",
    "....a......a....",
    "..aaaaaaaaaaaa..",
    "..accccccccccb..",
    "..acaaaaaaaaab..",
    "..acaaaaaaaaab..",
    "..acaaabbaaaab..",
    "..acaaabbaaaab..",
    "..acaaaaaaaaab..",
    "..abbbbbbbbbbb..",
    "..aaaaaaaaaaaa..",
    "................",
  ],
  arrow: [
    "................",
    "................",
    "........aa......",
    "........aaa.....",
    "........aaaa....",
    "..aaaaaaaaaaa...",
    "..aaaaaaaaaaaa..",
    "..aaaaaaaaaaaaa.",
    "..aaaaaaaaaaaab.",
    "..aaaaaaaaaaab..",
    "..bbbbbbaaaab...",
    "........aaab....",
    "........aab.....",
    "........b.......",
    "................",
    "................",
  ],
  pin: [
    ".....aaaaaa.....",
    "....acccaaaa....",
    "...acccaaaaaa...",
    "...accaa..aaa...",
    "...acaaa..aaab..",
    "...aaaaaaaaaab..",
    "...aaaaaaaaaab..",
    "....aaaaaaaab...",
    "....aaaaaaaab...",
    ".....aaaaaab....",
    ".....aaaaaab....",
    "......aaaab.....",
    "......aaab......",
    ".......ab.......",
    ".......b........",
    "................",
  ],
};

/** A hex colour moved toward black (t<0) or white (t>0). */
function shift(hex: string, t: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(t < 0 ? v * (1 + t) : v + (255 - v) * t)));
  return `rgb(${c((n >> 16) & 255)},${c((n >> 8) & 255)},${c(n & 255)})`;
}

const ROWS = 16;

export function PixelIcon({ id, color, size = 24, flat = false, accessibilityLabel }: { id: PixelIconId; /** The body colour; the shade and the light are derived. */ color: string; size?: number; /** One tone only, for a label beside text. */ flat?: boolean; accessibilityLabel?: string }) {
  const map = MAPS[id];
  const hex = color.startsWith("#") ? color : "#888888";
  const tones = { a: color, b: flat ? color : shift(hex, -0.32), c: flat ? color : shift(hex, 0.38) };
  const rects: { x: number; y: number; t: "a" | "b" | "c" }[] = [];
  map.forEach((row, y) => {
    for (let x = 0; x < ROWS; x++) {
      const ch = row[x];
      if (ch === "a" || ch === "b" || ch === "c") rects.push({ x, y, t: ch });
    }
  });
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${ROWS} ${ROWS}`} accessibilityLabel={accessibilityLabel} accessibilityRole={accessibilityLabel ? "image" : undefined}>
      {rects.map((r, i) => (
        <Rect key={i} x={r.x} y={r.y} width={1} height={1} fill={tones[r.t]} />
      ))}
    </Svg>
  );
}

export const PIXEL_ICON_IDS = Object.keys(MAPS) as PixelIconId[];
