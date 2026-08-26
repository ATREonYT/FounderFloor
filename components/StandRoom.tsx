"use client";

/**
 * One founder's stand, as a room you look into.
 *
 * Built from the SAME modules the hall uses — buildFloor for the walls,
 * carpet, booth architecture and ambient props, Npc for the founder behind
 * the counter — so a stand looks identical here and on the floor. Nothing
 * is re-implemented, which is the whole point: a "preview" that draws its
 * own version of a booth is a preview that will eventually lie.
 *
 * It deliberately does NOT boot the engine (game/engine.ts). createGame
 * grabs window-level key handlers, writes a render-scale to localStorage,
 * runs an uncapped animation loop, and opens a websocket to a room named
 * after whatever floor id it was given — which for a synthetic one-stand
 * room would mean a live server room per stand anyone happened to look at.
 * This is a rendered scene, not a second game.
 */

import { useEffect, useRef } from "react";
import { TILE } from "@/lib/types";
import type { FloorDef, Startup } from "@/lib/types";
import { buildFloor } from "@/game/tilemap";
import { Npc } from "@/game/npc";
import { SpriteBank } from "@/game/sprites";
import { floorById } from "@/lib/data/floors";

/**
 * 10x8 tiles = 320x256 world px.
 *
 * Sized so the narrowest phone column still UPSCALES it. Nearest-neighbour
 * pixel art survives being doubled; it does not survive being drawn at
 * 0.85, which is what a wider room would need in a 328px column.
 */
const ROOM_W = 10;
const ROOM_H = 8;
/** Booth is 4 wide, 3 tall — this centres it with a tile of air each side.
 * The id never ships anywhere — this room exists only for one render. */
const SPOT = { id: "showroom", x: 3, y: 2 };

export interface StandRoomProps {
  startup: Startup;
  ownerName?: string;
  /** Hall the stand is standing in, for its floor and wall colours. */
  floorId?: string | null;
  className?: string;
}

export default function StandRoom({ startup, ownerName, floorId, className }: StandRoomProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bankRef = useRef<SpriteBank | null>(null);

  const theme = (floorId ? floorById(floorId) : undefined)?.theme ?? floorById("main-hall")?.theme;
  const themeKey = JSON.stringify(theme ?? {});
  const boothKey = JSON.stringify(startup.booth ?? {});
  const lookKey = JSON.stringify(startup.founderLook ?? {});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !theme) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (!bankRef.current) bankRef.current = new SpriteBank();
    const bank = bankRef.current;

    /* A floor definition that exists only for this render. It is never put
       into FLOORS and never joined over the network — no room is created,
       no floor budget is spent, nobody can walk in. */
    const room: FloorDef = {
      id: `stand:${startup.id}`,
      name: startup.name,
      tagline: "",
      tier: "free",
      width: ROOM_W,
      height: ROOM_H,
      theme,
      boothSpots: [SPOT],
      startupIds: [],
    };

    /* ownerId is left unset on purpose. It suppresses the online/away lamp
       (the page says that in words, where it can be read) and it is what
       lets us staff the counter with the founder's own avatar. */
    const built = buildFloor(room, {}, [
      { claim: { spotIndex: 0, startup }, isYours: false, ownerName, online: true },
    ]);

    const booth = built.booths[0];
    const npc = booth ? new Npc(booth, startup, bank) : null;

    const paint = (): void => {
      const cssW = canvas.clientWidth || ROOM_W * TILE;
      const zoom = cssW / built.widthPx;
      const cssH = Math.round(built.heightPx * zoom);
      const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.height = `${cssH}px`;

      ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, 0, 0);
      ctx.imageSmoothingEnabled = false;

      const cam = { x: 0, y: 0, w: built.widthPx, h: built.heightPx };
      built.drawUnder(ctx, cam);

      // Painter's order, exactly as the hall does it: everything sorted by
      // the y its feet stand on, so the founder is in front of the counter
      // and behind the banner.
      const layers = npc
        ? [...built.drawables, { sortY: npc.sortY, draw: (c: CanvasRenderingContext2D) => npc.draw(c, 0) }]
        : built.drawables;
      for (const d of [...layers].sort((a, b) => a.sortY - b.sortY)) d.draw(ctx);
    };

    paint();

    /* One paint, repainted on resize. Nothing in the scene moves, so there
       is no animation loop to leave running behind a page nobody is on. */
    const onResize = (): void => paint();
    window.addEventListener("resize", onResize);

    // A logo is a data URL that decodes asynchronously; repaint when it lands.
    let stale = false;
    if (startup.booth?.logo) {
      const img = new Image();
      img.onload = () => {
        if (!stale) paint();
      };
      img.src = startup.booth.logo;
    }

    return () => {
      stale = true;
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startup.id, startup.name, startup.founder, boothKey, lookKey, themeKey, ownerName]);

  return (
    <canvas
      ref={canvasRef}
      className={`pixelated w-full ${className ?? ""}`}
      aria-label={`${startup.name}'s stand`}
    />
  );
}
