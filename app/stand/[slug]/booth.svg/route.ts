/**
 * The stand as an image — the game's own art, recorded to SVG on the
 * server (game/standScene.ts). A plain <img> can show it, which is what
 * lets the public stand page render for readers with no JavaScript.
 */

import { fetchPublicStand } from "@/lib/serverFloor";
import { renderStandSvg } from "@/game/standScene";

export const revalidate = 300;

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } },
): Promise<Response> {
  const stand = await fetchPublicStand(decodeURIComponent(params.slug));
  if (!stand) return new Response("not found", { status: 404 });
  const svg = renderStandSvg(stand.startup, stand.startup.founderLook);
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
    },
  });
}
