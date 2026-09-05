import type { GlyphId } from "@/lib/types";
import type React from "react";

/** All ten booth glyphs, in picker order. */
export const GLYPH_IDS: GlyphId[] = [
  "bolt",
  "leaf",
  "coin",
  "chip",
  "flask",
  "rocket",
  "heart",
  "cube",
  "wave",
  "star",
];

/** 8x8 bitmaps — "#" is a lit pixel. */
export const BITMAPS: Record<GlyphId, string[]> = {
  bolt: [
    "....##..",
    "...##...",
    "..##....",
    ".#####..",
    "...##...",
    "..##....",
    ".##.....",
    ".#......",
  ],
  leaf: [
    "....####",
    "..######",
    ".#######",
    ".######.",
    ".#####..",
    "..###...",
    ".##.....",
    "#.......",
  ],
  coin: [
    "..####..",
    ".#....#.",
    "#..##..#",
    "#..#...#",
    "#..##..#",
    "#...#..#",
    ".#.##.#.",
    "..####..",
  ],
  chip: [
    "..#..#..",
    ".######.",
    ".#....#.",
    "##.##.##",
    "##.##.##",
    ".#....#.",
    ".######.",
    "..#..#..",
  ],
  flask: [
    "...##...",
    "...##...",
    "..#..#..",
    "..#..#..",
    ".#....#.",
    ".######.",
    ".######.",
    "..####..",
  ],
  rocket: [
    "...##...",
    "..####..",
    "..####..",
    "..####..",
    ".######.",
    ".#.##.#.",
    "#..##..#",
    "...##...",
  ],
  heart: [
    ".##..##.",
    "########",
    "########",
    "########",
    ".######.",
    "..####..",
    "...##...",
    "........",
  ],
  cube: [
    "...##...",
    ".##..##.",
    "#......#",
    "#.#..#.#",
    "#.#..#.#",
    "#.#..#.#",
    ".##..##.",
    "...##...",
  ],
  wave: [
    "........",
    ".##.....",
    "#..#..#.",
    "....##..",
    "........",
    ".##.....",
    "#..#..#.",
    "....##..",
  ],
  star: [
    "...##...",
    "...##...",
    ".######.",
    "..####..",
    "..####..",
    ".#.##.#.",
    ".#....#.",
    "........",
  ],
};

interface PixelGlyphProps {
  glyph: GlyphId;
  color?: string;
  /** Rendered size in px (the glyph is an 8x8 grid). */
  size?: number;
  /**
   * Draw the glyph in one pixel row at a time when its section arrives,
   * instead of appearing whole. Each rect carries its row index, and the
   * CSS (see .glyph-draw in globals) turns that into a 34ms-per-row
   * cascade — opacity only, so the sprite is never moved or scaled by a
   * fraction of a pixel. Only meaningful inside a <Reveal>.
   */
  drawIn?: boolean;
  className?: string;
}

/** Tiny pixel glyph rendered as crisp SVG rects. Server-safe. */
export default function PixelGlyph({
  glyph,
  color = "var(--ink)",
  size = 16,
  drawIn = false,
  className = "",
}: PixelGlyphProps) {
  const rows = BITMAPS[glyph];
  const rects: JSX.Element[] = [];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if (rows[y][x] === "#") {
        rects.push(
          <rect
            key={`${x}-${y}`}
            x={x}
            y={y}
            width={1}
            height={1}
            fill={color}
            style={drawIn ? ({ "--row": y } as React.CSSProperties) : undefined}
          />,
        );
      }
    }
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 8 8"
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={`pixelated shrink-0 ${drawIn ? "glyph-draw" : ""} ${className}`}
    >
      {rects}
    </svg>
  );
}
