/**
 * The share card: what a stand link looks like pasted into Slack, X,
 * LinkedIn or a chat. Drawn per stand — name, one-liner, and the revenue
 * rank as the accent colour — in the hall's own palette, as a flat pixel
 * composition (banner, counter, checkered apron) rather than a screenshot.
 *
 * Satori, not canvas: every multi-child element needs explicit
 * display:flex, and the default bundled font has one weight, so hierarchy
 * comes from size and colour. If the build ever complains about
 * ImageResponse in the Node runtime, add: export const runtime = "edge".
 */

import { ImageResponse } from "next/og";
import { fetchStandServer } from "./fetch-stand";
import { rankFor } from "@/lib/ranks";

export const revalidate = 300;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "A stand on FounderFloor, the walkable startup floor";

// The hall's palette (tailwind.config.ts) — literals on purpose: no CSS
// variables exist at image-render time.
const PAPER = "#F2EFE7";
const PANEL = "#FFFDF5";
const INK = "#23201A";
const MUTED = "#6F6A5E";
const LINE = "#DCD5C4";
const ACCENT = "#D9480F";

export default async function Image({ params }: { params: { ownerId: string } }) {
  const entry = await fetchStandServer(decodeURIComponent(params.ownerId));
  const s = entry?.startup ?? null;

  if (!s) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%", height: "100%", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", background: PAPER, color: INK,
          }}
        >
          <div style={{ display: "flex", fontSize: 84, letterSpacing: 10 }}>FOUNDERFLOOR</div>
          <div style={{ display: "flex", fontSize: 30, color: MUTED, marginTop: 18 }}>
            A trade-show floor that never tears down
          </div>
        </div>
      ),
      size,
    );
  }

  const rank = rankFor(s.verifiedRevenue);
  const sign = (s.name || "STAND").slice(0, 12).toUpperCase();
  const name = s.name || "A stand";
  const oneLiner = (s.oneLiner || s.pitch || "").slice(0, 140);
  const apron = Array.from({ length: 10 }, (_, i) => i);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "row",
          background: PAPER, color: INK,
        }}
      >
        {/* the booth, abstracted */}
        <div
          style={{
            display: "flex", flexDirection: "column", justifyContent: "center",
            width: 420, padding: "0 48px", borderRight: `2px solid ${LINE}`,
          }}
        >
          <div
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              height: 150, background: ACCENT, border: `6px solid ${INK}`,
              borderRadius: 10, color: PANEL, fontSize: 42, letterSpacing: 3,
            }}
          >
            {sign}
          </div>
          <div
            style={{
              display: "flex", height: 44, background: PANEL,
              border: `6px solid ${INK}`, borderTopWidth: 0,
              borderRadius: "0 0 8px 8px",
            }}
          />
          <div style={{ display: "flex", flexDirection: "row", marginTop: 20 }}>
            {apron.map((i) => (
              <div
                key={i}
                style={{
                  display: "flex", width: 32, height: 32,
                  background: i % 2 === 0 ? rank.color : LINE,
                }}
              />
            ))}
          </div>
          <div
            style={{
              display: "flex", alignSelf: "flex-start", marginTop: 26,
              padding: "6px 14px", border: `3px solid ${rank.color}`,
              borderRadius: 8, color: rank.color, fontSize: 24, letterSpacing: 2,
            }}
          >
            {rank.name.toUpperCase()}
          </div>
        </div>

        {/* the pitch */}
        <div
          style={{
            display: "flex", flexDirection: "column", flex: 1,
            justifyContent: "space-between", padding: "56px 64px",
          }}
        >
          <div style={{ display: "flex", fontSize: 24, letterSpacing: 6, color: MUTED }}>
            FOUNDERFLOOR
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex", fontSize: name.length > 18 ? 54 : 68,
                lineHeight: 1.05, color: INK,
              }}
            >
              {name}
            </div>
            {oneLiner ? (
              <div
                style={{
                  display: "flex", fontSize: 30, lineHeight: 1.35, color: MUTED,
                  marginTop: 20, lineClamp: 3,
                }}
              >
                {oneLiner}
              </div>
            ) : null}
          </div>
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
            <div style={{ display: "flex", fontSize: 27, color: ACCENT }}>founderfloor.net</div>
            <div style={{ display: "flex", fontSize: 25, color: MUTED, marginLeft: 22 }}>
              walk in — no signup
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
