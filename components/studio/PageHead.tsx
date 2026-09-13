/**
 * The top of an inside page.
 *
 * Every page below the front door opens the same way — an eyebrow, a
 * title, a line, and a keeper standing beside it — so the site has a
 * rhythm rather than a series of unrelated screens. The keeper is the
 * point: it is the same pixel art the app is made of, and it is what
 * makes a stranger looking at both say "same company" without being
 * told.
 */
import Link from "next/link";
import PixelGlyph from "@/components/PixelGlyph";
import type { GlyphId } from "@/lib/types";

export default function PageHead({
  eyebrow,
  title,
  line,
  glyph,
}: {
  eyebrow: string;
  title: string;
  line: string;
  glyph: GlyphId;
}) {
  return (
    <header className="page-head">
      <div className="wrap page-head-in">
        <div className="page-head-text">
          <Link href="/v2" className="back">
            ← FounderFloor
          </Link>
          <p className="label">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="lede">{line}</p>
        </div>
        <div className="page-head-art" aria-hidden>
          <PixelGlyph glyph={glyph} size={104} color="var(--accent)" />
        </div>
      </div>
    </header>
  );
}
