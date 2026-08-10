"use client";

/**
 * DEV-ONLY contact sheet: every booth build, side by side, big enough to
 * see a pixel out of place.
 *
 * Reachable only when NEXT_PUBLIC_DEV_TOOLS=1 (see page.tsx) — it exists so
 * the art can be reviewed as a SET rather than one stand at a time, which
 * is how misaligned trim survives: each build looks fine alone and only
 * the sheet shows that three of them draw the same rail at three
 * different heights.
 */

import BoothPreview from "@/components/BoothPreview";
import type { BannerTrim, BoothStyle, CarpetPattern } from "@/lib/types";

const STYLES: BoothStyle[] = ["classic", "bigtop", "garden", "arcade", "neon"];
const TRIMS: (BannerTrim | undefined)[] = [undefined, "stripes", "checker", "dots"];
const PATTERNS: CarpetPattern[] = ["solid", "border", "stripes"];
const LOOK = { skin: 1, outfit: 2, hair: 0 };

export default function BoothSheet() {
  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-8">
      <h1 className="font-display text-2xl">Booth contact sheet</h1>

      <h2 className="mt-6 font-display text-lg">Styles × banner trim</h2>
      <div className="mt-3 grid grid-cols-4 gap-4">
        {STYLES.flatMap((style) =>
          TRIMS.map((trim) => (
            <figure key={`${style}-${trim ?? "plain"}`} data-shot={`${style}-${trim ?? "plain"}`}>
              <BoothPreview
                carpet="#3E5AA0"
                banner="#3E5AA0"
                sign="FOUNDERFLOOR"
                glyph="bolt"
                pattern="stripes"
                trim={trim}
                style={style}
                founderLook={LOOK}
              />
              <figcaption className="micro mt-1 text-muted">
                {style} · {trim ?? "plain"}
              </figcaption>
            </figure>
          )),
        )}
      </div>

      <h2 className="mt-8 font-display text-lg">Carpet patterns (classic)</h2>
      <div className="mt-3 grid grid-cols-4 gap-4">
        {PATTERNS.map((pattern) => (
          <figure key={pattern} data-shot={`carpet-${pattern}`}>
            <BoothPreview
              carpet="#C03A2B"
              banner="#2B6E4F"
              sign="KETTLE"
              glyph="flask"
              pattern={pattern}
              style="classic"
              founderLook={LOOK}
            />
            <figcaption className="micro mt-1 text-muted">carpet {pattern}</figcaption>
          </figure>
        ))}
      </div>

      <h2 className="mt-8 font-display text-lg">Props, on every style</h2>
      <div className="mt-3 grid grid-cols-4 gap-4">
        {STYLES.map((style) => (
          <figure key={style} data-shot={`props-${style}`}>
            <BoothPreview
              carpet="#7A611F"
              banner="#B08D2E"
              sign="ALLPROPS"
              glyph="star"
              pattern="border"
              trim="dots"
              style={style}
              boothProps={["plant", "balloons", "trophy", "spotlight"]}
              founderLook={LOOK}
            />
            <figcaption className="micro mt-1 text-muted">{style} · all props</figcaption>
          </figure>
        ))}
      </div>

      <h2 className="mt-8 font-display text-lg">Founder+ gold trim, on every style</h2>
      <div className="mt-3 grid grid-cols-4 gap-4">
        {STYLES.map((style) => (
          <figure key={style} data-shot={`gold-${style}`}>
            <BoothPreview
              carpet="#3E5AA0"
              banner="#3E5AA0"
              sign="FOUNDERFLOOR"
              glyph="bolt"
              pattern="stripes"
              style={style}
              tier="founder"
              yours
              founderLook={LOOK}
            />
            <figcaption className="micro mt-1 text-muted">{style} · founder gold</figcaption>
          </figure>
        ))}
      </div>

      <h2 className="mt-8 font-display text-lg">Long and short sign text</h2>
      <div className="mt-3 grid grid-cols-4 gap-4">
        {(["A", "AB", "FOUNDERFLOOR", "WWWWWWWWWWWW"] as const).map((sign) => (
          <figure key={sign} data-shot={`sign-${sign}`}>
            <BoothPreview
              carpet="#3E5AA0"
              banner="#3E5AA0"
              sign={sign}
              glyph="bolt"
              pattern="solid"
              style="bigtop"
              founderLook={LOOK}
            />
            <figcaption className="micro mt-1 text-muted">sign “{sign}”</figcaption>
          </figure>
        ))}
      </div>
    </main>
  );
}
