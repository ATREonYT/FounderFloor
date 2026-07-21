"use client";

/**
 * Pixel-accurate booth preview for the customization menu — renders with
 * the SAME art module the floor uses (game/boothArt.ts), plus the founder
 * standing in their lane, so what you save (style, props, colors, trim)
 * is exactly what the hall shows.
 */

import { useEffect, useRef } from "react";
import type {
  AvatarLook,
  BannerTrim,
  BoothProp,
  BoothStyle,
  BoothTheme,
  CarpetPattern,
  GlyphId,
} from "@/lib/types";
import { TILE } from "@/lib/types";
import { SPRITE_H, SPRITE_W, SpriteBank, shade } from "@/game/sprites";
import { drawBoothBanner, drawBoothCounter } from "@/game/boothArt";

export interface BoothPreviewProps {
  carpet: string;
  banner: string;
  sign: string;
  glyph: GlyphId;
  pattern: CarpetPattern;
  trim?: BannerTrim;
  style?: BoothStyle;
  boothProps?: BoothProp[];
  /** Custom banner icon (tiny data-URL PNG). Replaces the glyph when set. */
  logo?: string;
  founderLook: AvatarLook;
  /** Hall floor colors behind the stand (defaults: Main Hall). */
  floorA?: string;
  floorB?: string;
}

export default function BoothPreview({
  carpet,
  banner,
  sign,
  glyph,
  pattern,
  trim = "plain",
  style = "classic",
  boothProps,
  logo,
  founderLook,
  floorA = "#D8D2C4",
  floorB = "#D1CABA",
}: BoothPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bankRef = useRef<SpriteBank | null>(null);

  // join array props into a stable dep so the effect re-runs only on change
  const propsKey = (boothProps ?? []).join(",");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (!bankRef.current) bankRef.current = new SpriteBank();

    // world: 6 tiles wide (booth + 1 tile margin each side); extra headroom
    // on top so the taller styles (tent peak, arcade marquee) never clip
    const worldW = 6 * TILE;
    const worldH = 6 * TILE;
    const cssW = canvas.clientWidth || 240;
    const zoom = cssW / worldW;
    const cssH = Math.round(worldH * zoom);
    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.height = `${cssH}px`;

    const theme: BoothTheme = {
      carpet,
      banner,
      sign: sign || "YOUR SIGN",
      glyph,
      pattern,
      trim: trim === "plain" ? undefined : trim,
      style: style === "classic" ? undefined : style,
      props: boothProps && boothProps.length ? boothProps : undefined,
    };

    const render = (logoImg: CanvasImageSource | null): void => {
      ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, 0, 0);
      ctx.imageSmoothingEnabled = false;

      // hall floor checker behind the stand
      for (let ty = 0; ty < 6; ty++) {
        for (let tx = 0; tx < 6; tx++) {
          ctx.fillStyle = (tx + ty) & 1 ? floorB : floorA;
          ctx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
        }
      }

      // booth zone: banner row starts 1.25 tiles down (headroom above)
      const bx = 1 * TILE;
      const by = 1.25 * TILE;

      // carpet: 4 tiles wide, 4 tall (3 zone rows + apron), same as drawCarpet
      const cw = 4 * TILE;
      const ch = 4 * TILE;
      ctx.fillStyle = carpet;
      ctx.fillRect(bx, by, cw, ch);
      if (pattern === "stripes") {
        ctx.fillStyle = shade(carpet, -0.08);
        for (let i = 0; i < 4; i += 2) ctx.fillRect(bx + i * TILE, by, TILE, ch);
      } else if (pattern === "border") {
        ctx.strokeStyle = shade(carpet, 0.14);
        ctx.lineWidth = 3;
        ctx.strokeRect(bx + 5.5, by + 5.5, cw - 11, ch - 11);
      }
      ctx.strokeStyle = shade(carpet, -0.16);
      ctx.lineWidth = 2;
      ctx.strokeRect(bx + 1, by + 1, cw - 2, ch - 2);

      // banner layer (architecture + banner-row props)
      drawBoothBanner(ctx, { bx, by, theme, logoImg, seed: 0x5eed });

      // founder in the lane, facing front
      const frames = bankRef.current!.makeAvatar(founderLook);
      const fx = bx + 2 * TILE;
      const fy = by + 2 * TILE - 6;
      ctx.fillStyle = "rgba(35,32,26,0.16)";
      ctx.beginPath();
      ctx.ellipse(fx, fy - 1, 8, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.drawImage(frames.down[0], Math.round(fx - SPRITE_W / 2), Math.round(fy - SPRITE_H));

      // counter layer (architecture + counter-row props)
      drawBoothCounter(ctx, { bx, by, theme, seed: 0x5eed });
    };

    render(null);

    if (logo) {
      // data-URL decode is async; guard so a stale load never paints over a
      // newer render of this effect
      let stale = false;
      const img = new Image();
      img.onload = () => {
        if (!stale) render(img);
      };
      img.src = logo;
      return () => {
        stale = true;
      };
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carpet, banner, sign, glyph, pattern, trim, style, propsKey, logo, founderLook, floorA, floorB]);

  return (
    <canvas
      ref={canvasRef}
      className="pixelated w-full rounded-md border border-line"
      aria-label="Live preview of your booth as it renders on the floor"
    />
  );
}
