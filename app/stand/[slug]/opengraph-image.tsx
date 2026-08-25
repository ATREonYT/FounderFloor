/**
 * The card that appears when a stand link is posted — 1200x630 PNG.
 *
 * Composition per the approved sketch: the founder's actual booth on the
 * left (the game's own art, recorded to SVG and embedded), name large on
 * the right with the one-liner and founder credit under it, the pixel
 * storefront mark small in the bottom-right corner. Paper ground, hairline
 * border, nothing else — every card is different because every booth is,
 * and that difference is what reads as deliberate.
 *
 * Type is Spectral (OFL, assets/fonts) — the one place the site's Georgia
 * cannot follow, because a rasterizer has no system fonts and Georgia's
 * bytes are not ours to ship. Spectral is the nearest open serif; it
 * appears nowhere else on the site.
 */

import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fetchPublicStand } from "@/lib/serverFloor";
import { renderStandSvg } from "@/game/standScene";

export const runtime = "nodejs";
export const revalidate = 300;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "This startup keeps a stand on FounderFloor.";

const PAPER = "#F2EFE7";
const INK = "#23201A";
const MUTED = "#6F6A5E";
const LINE = "#E4DFD3";

export default async function OgImage({ params }: { params: { slug: string } }) {
  const ref = decodeURIComponent(params.slug);
  const [stand, regular, medium] = await Promise.all([
    fetchPublicStand(ref),
    readFile(join(process.cwd(), "assets/fonts/Spectral-Regular.ttf")),
    readFile(join(process.cwd(), "assets/fonts/Spectral-Medium.ttf")),
  ]);

  const name = stand?.startup.name ?? "FounderFloor";
  const oneLiner = stand?.startup.oneLiner ?? "";
  const founder = stand?.startup.founder ?? "";
  const spot =
    stand && stand.spotIndex >= 0 ? `NO. ${String(stand.spotIndex + 1).padStart(2, "0")}` : "";
  const hall = stand?.floorId ? stand.floorId.replace(/-/g, " ").toUpperCase() : "THE DIRECTORY";

  const boothSvg = stand
    ? `data:image/svg+xml;base64,${Buffer.from(
        renderStandSvg(stand.startup, stand.startup.founderLook),
      ).toString("base64")}`
    : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: PAPER,
          fontFamily: "Spectral",
        }}
      >
        {/* hairline plate border, inset like the site's artwork plates */}
        <div
          style={{
            position: "absolute",
            top: 24,
            left: 24,
            right: 24,
            bottom: 24,
            border: `1px solid ${LINE}`,
            display: "flex",
          }}
        />

        {/* the booth */}
        {boothSvg && (
          <div
            style={{
              position: "absolute",
              left: 84,
              bottom: 64,
              display: "flex",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={boothSvg} width={365} height={494} alt="" />
          </div>
        )}

        {/* the words */}
        <div
          style={{
            position: "absolute",
            left: 520,
            right: 84,
            top: 118,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              fontSize: 20,
              letterSpacing: 5,
              color: MUTED,
              display: "flex",
            }}
          >
            {`FOUNDERFLOOR · ${hall}${spot ? ` · ${spot}` : ""}`}
          </div>
          <div
            style={{
              marginTop: 26,
              fontSize: name.length > 18 ? 64 : 84,
              lineHeight: 1.05,
              color: INK,
              fontWeight: 500,
              display: "flex",
            }}
          >
            {name}
          </div>
          {oneLiner && (
            <div
              style={{
                marginTop: 24,
                fontSize: 33,
                lineHeight: 1.3,
                color: MUTED,
                display: "flex",
              }}
            >
              {oneLiner}
            </div>
          )}
          {founder && (
            <div
              style={{
                marginTop: 30,
                fontSize: 26,
                color: INK,
                display: "flex",
              }}
            >
              {`${founder}, founder`}
            </div>
          )}
        </div>

        {/* the mark, small, bottom-right */}
        <div
          style={{
            position: "absolute",
            right: 60,
            bottom: 52,
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <svg width={40} height={40} viewBox="0 0 16 16">
            <rect x="1" y="1" width="14" height="1" fill={INK} />
            <rect x="1" y="2" width="14" height="3" fill="#D9480F" />
            <rect x="3" y="2" width="2" height="3" fill={PAPER} />
            <rect x="7" y="2" width="2" height="3" fill={PAPER} />
            <rect x="11" y="2" width="2" height="3" fill={PAPER} />
            <rect x="2" y="5" width="2" height="1" fill="#D9480F" />
            <rect x="6" y="5" width="2" height="1" fill="#D9480F" />
            <rect x="10" y="5" width="2" height="1" fill="#D9480F" />
            <rect x="1" y="5" width="1" height="9" fill={INK} />
            <rect x="14" y="5" width="1" height="9" fill={INK} />
            <rect x="3" y="9" width="10" height="5" fill={INK} />
            <rect x="4" y="10" width="8" height="3" fill={PAPER} />
            <rect x="5" y="11" width="3" height="1" fill="#B08D2E" />
            <rect x="9" y="11" width="2" height="1" fill="#B08D2E" />
          </svg>
          <div style={{ fontSize: 26, color: INK, display: "flex" }}>FounderFloor</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Spectral", data: regular, weight: 400, style: "normal" },
        { name: "Spectral", data: medium, weight: 500, style: "normal" },
      ],
    },
  );
}
