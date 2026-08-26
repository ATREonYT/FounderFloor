/**
 * The embed badge — 216x48, served live so every badge in the wild stays
 * current with the design. Paper ground, hairline border, the 16x16 pixel
 * storefront mark (the same one the nav wears), the startup's name in the
 * sign-painter's pixel lettering, and the site's name under it in muted.
 *
 * Text is pixel lettering (game/svgCanvas.ts), not a font: the badge lands
 * on other people's sites, where no font of ours exists to load.
 */

import { fetchPublicStand } from "@/lib/serverFloor";
import { SvgCtx } from "@/game/svgCanvas";

export const revalidate = 300;

/** The nav's 16x16 storefront mark, drawn at 2x into the badge. */
const MARK =
  '<g transform="translate(10 8) scale(2)">' +
  '<rect x="1" y="1" width="14" height="1" fill="#23201A"/>' +
  '<rect x="1" y="2" width="14" height="3" fill="#D9480F"/>' +
  '<rect x="3" y="2" width="2" height="3" fill="#F2EFE7"/>' +
  '<rect x="7" y="2" width="2" height="3" fill="#F2EFE7"/>' +
  '<rect x="11" y="2" width="2" height="3" fill="#F2EFE7"/>' +
  '<rect x="2" y="5" width="2" height="1" fill="#D9480F"/>' +
  '<rect x="6" y="5" width="2" height="1" fill="#D9480F"/>' +
  '<rect x="10" y="5" width="2" height="1" fill="#D9480F"/>' +
  '<rect x="1" y="5" width="1" height="9" fill="#23201A"/>' +
  '<rect x="14" y="5" width="1" height="9" fill="#23201A"/>' +
  '<rect x="3" y="9" width="10" height="5" fill="#23201A"/>' +
  '<rect x="4" y="10" width="8" height="3" fill="#F2EFE7"/>' +
  '<rect x="5" y="11" width="3" height="1" fill="#B08D2E"/>' +
  '<rect x="9" y="11" width="2" height="1" fill="#B08D2E"/>' +
  "</g>";

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } },
): Promise<Response> {
  const stand = await fetchPublicStand(decodeURIComponent(params.slug));
  if (!stand) return new Response("not found", { status: 404 });

  // The name in pixel caps, sized to the room left of the mark.
  const ctx = new SvgCtx();
  ctx.fillStyle = "#22272C";
  ctx.font = "12px ui-monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(stand.startup.name, 50, 11, 156);
  ctx.fillStyle = "#50565D";
  ctx.font = "7px ui-monospace";
  ctx.fillText("ON THE FLOOR AT FOUNDERFLOOR", 50, 27, 156);

  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 216 48" width="216" height="48" shape-rendering="crispEdges" role="img" aria-label="' +
    stand.startup.name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;") +
    ' has a stand on FounderFloor">' +
    // screed ground, laminate hairline — sRGB renders of the oklch
    // materials, because a standalone SVG has no CSS to inherit
    '<rect x="0" y="0" width="216" height="48" fill="#E8ECF0"/>' +
    '<rect x="0.5" y="0.5" width="215" height="47" fill="none" stroke="#D7DBE0" stroke-width="1"/>' +
    MARK +
    ctx.body() +
    "</svg>";

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
