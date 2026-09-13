/**
 * A PERSON FROM THE FLOOR, STANDING ON A WEB PAGE.
 *
 * The app is made of twenty-by-twenty-eight pixel people. If the website
 * draws its own illustrations of them, the two drift apart the first time
 * anybody touches either one; so this draws the REAL sprite — the same
 * `avatarStillGrid` the floor rasterizes its walk cycle from — as inline
 * SVG.
 *
 * SVG rather than canvas on purpose. These faces sit in page headers and
 * beside names, which means they have to be there before hydration, in
 * the HTML a crawler reads, in a printed page, and with JavaScript off.
 * A canvas gives none of that. The pixels are identical either way: this
 * walks the same grid.
 *
 * Two details that are not decoration:
 *
 *   The edge rule. Every pixel with an empty neighbour is drawn a shade
 *   darker. At this size that outline is the whole difference between a
 *   figure and a pile of colour, and the floor does it too — so it is
 *   copied exactly rather than approximated.
 *
 *   Horizontal runs. Five hundred and sixty single-pixel rects per face
 *   is a lot of document for four coaches; identical neighbours on a row
 *   are emitted as one rect instead, which cuts it by about two thirds
 *   and changes nothing about what is drawn.
 */
import { SPRITE_H, SPRITE_W, avatarStillGrid, shade } from "@/game/sprites";
import type { AvatarLook } from "@/lib/types";

const EDGE = -0.38;

export default function PixelPerson({
  look,
  scale = 3,
  shadow = true,
  className = "",
  title,
}: {
  look: AvatarLook;
  /** CSS pixels per sprite pixel. 3 is a comfortable reading size. */
  scale?: number;
  /** The soft ellipse under the feet that the floor draws. */
  shadow?: boolean;
  className?: string;
  /** Given, the figure is announced; omitted, it is decoration. */
  title?: string;
}) {
  const grid = avatarStillGrid(look);
  const at = (x: number, y: number): string | null =>
    x < 0 || y < 0 || x >= SPRITE_W || y >= SPRITE_H ? null : grid[y * SPRITE_W + x];

  const rects: { x: number; y: number; w: number; fill: string }[] = [];
  for (let y = 0; y < SPRITE_H; y++) {
    let runStart = -1;
    let runFill = "";
    const flush = (endX: number) => {
      if (runStart >= 0) rects.push({ x: runStart, y, w: endX - runStart, fill: runFill });
      runStart = -1;
    };
    for (let x = 0; x < SPRITE_W; x++) {
      const col = at(x, y);
      if (!col) {
        flush(x);
        continue;
      }
      const edge = !at(x - 1, y) || !at(x + 1, y) || !at(x, y - 1) || !at(x, y + 1);
      const fill = edge ? shade(col, EDGE) : col;
      if (fill !== runFill) {
        flush(x);
        runStart = x;
        runFill = fill;
      }
    }
    flush(SPRITE_W);
  }

  // A little air under the feet for the shadow, so it is not clipped.
  const h = SPRITE_H + (shadow ? 3 : 0);
  return (
    <svg
      className={className}
      viewBox={`0 0 ${SPRITE_W} ${h}`}
      width={SPRITE_W * scale}
      height={h * scale}
      shapeRendering="crispEdges"
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {shadow ? (
        <ellipse cx={SPRITE_W / 2} cy={SPRITE_H + 0.5} rx={7} ry={2.5} fill="rgba(35,32,26,0.16)" />
      ) : null}
      {rects.map((r) => (
        <rect key={`${r.x}-${r.y}-${r.w}`} x={r.x} y={r.y} width={r.w} height={1} fill={r.fill} />
      ))}
    </svg>
  );
}
