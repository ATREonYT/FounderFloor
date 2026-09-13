import type { Metadata } from "next";
import Link from "next/link";
import PageHead from "@/components/studio/PageHead";
import Reveal from "@/components/studio/Reveal";

export const metadata: Metadata = {
  title: "Take it to a builder — FounderFloor",
  description: "One prompt that carries the design itself, so what comes back is the app you were looking at.",
};

const POINTS = [
  { t: "The design goes first", l: "The prompt opens with your palette already converted to the tokens those tools write, before a single screen. That is the difference between a build that matches and one that only shares your words." },
  { t: "Your words, unchanged", l: "It says plainly: use these as written, do not improve them, do not make them sound like marketing." },
  { t: "Or build it yourself", l: "The same brief comes out as a CLAUDE.md with a stack and a first prompt, if you write code." },
];

export default function Page() {
  return (
    <>
      <PageHead
        eyebrow="Stop six"
        title="When you want it real, it goes whole"
        line="The screens you drew are not a picture to be thrown away. The app writes one prompt for Lovable, Bolt, Base44 or Claude Code that carries the design itself — the exact colours as theme tokens, the type, the corners, the screens in order with your words."
        glyph="cube"
      />
      <section className="band">
        <div className="wrap cols">
          {POINTS.map((p, i) => (
            <Reveal key={p.t} className={`card lift reveal d${(i % 3) + 1}`}>
              <h3>{p.t}</h3>
              <p>{p.l}</p>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="band tint close">
        <div className="wrap close-in">
          <h2>It starts with one sentence</h2>
          <Link className="btn primary" href="/v2">Draw my app</Link>
        </div>
      </section>
    </>
  );
}
