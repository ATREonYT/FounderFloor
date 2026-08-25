/**
 * One founder's stand as a self-contained SVG — the image the public stand
 * page, the OG card and nothing else uses.
 *
 * Drawn by the game's own art code (boothArt, decor, sprites) against the
 * recording context in svgCanvas.ts, so it is pixel-identical to the booth
 * on the floor: their banner build, their carpet and pattern, their sign,
 * their uploaded logo, their avatar standing in the lane. There is no
 * illustration here to maintain — change the game art and this follows.
 *
 * Runs on the server (no canvas, no DOM), which is the whole point.
 */

import type { AvatarLook, Startup } from "../lib/types";
import { TILE as T } from "../lib/types";
import { drawBoothBanner, drawBoothCounter, drawCarpet } from "./boothArt";
import { drawStandPlinth } from "./decor";
import { avatarStillGrid, shade, SPRITE_H, SPRITE_W } from "./sprites";
import { SvgCtx } from "./svgCanvas";
import { hashStr } from "./tilemap";

/** Scene box in art pixels; scale it up with width/height on the <img>. */
export const SCENE_W = 152;
export const SCENE_H = 206;

export function renderStandSvg(startup: Startup, look: AvatarLook): string {
  const ctx = new SvgCtx() as unknown as CanvasRenderingContext2D;
  const bx = 0;
  const by = 0;
  const seed = hashStr(startup.id || startup.name);

  drawStandPlinth(ctx, bx, by);
  drawCarpet(ctx, bx, by, startup.booth.carpet, startup.booth.pattern);
  drawBoothBanner(ctx, {
    bx,
    by,
    theme: startup.booth,
    yours: false,
    tier: startup.tier,
    logoImg: startup.booth.logo
      ? ({ src: startup.booth.logo } as unknown as HTMLImageElement)
      : null,
    ownerLamp: null,
    seed,
  });

  // The founder, front-facing, standing in their lane. Same pixels as the
  // floor draws (frame 0 of the walk cycle), same edge-darkening rule as
  // the sprite rasterizer — replicated here because that rule is what
  // separates a figure from a pile of colour at this size.
  const grid = avatarStillGrid(look);
  const ax = Math.round(bx + 2 * T - SPRITE_W / 2);
  const ay = by + 2 * T - 2 - SPRITE_H;
  const at = (x: number, y: number): string | null =>
    x < 0 || y < 0 || x >= SPRITE_W || y >= SPRITE_H ? null : grid[y * SPRITE_W + x];
  const raw = ctx as unknown as SvgCtx;
  for (let y = 0; y < SPRITE_H; y++) {
    for (let x = 0; x < SPRITE_W; x++) {
      const col = at(x, y);
      if (!col) continue;
      const edge = !at(x - 1, y) || !at(x + 1, y) || !at(x, y - 1) || !at(x, y + 1);
      raw.fillStyle = edge ? shade(col, -0.38) : col;
      raw.fillRect(ax + x, ay + y, 1, 1);
    }
  }

  drawBoothCounter(ctx, { bx, by, theme: startup.booth, seed });

  // 12px of margin left of the plinth, 64px of air above for the tall
  // banner builds (the big top reaches highest), shadow room right and
  // below — measured against the art, not guessed per render.
  return raw.toSvg(SCENE_W, SCENE_H, 12, 64);
}
