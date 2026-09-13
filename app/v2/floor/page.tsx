import type { Metadata } from "next";
import Link from "next/link";
import HeroScene from "@/components/HeroScene";
import PageHead from "@/components/studio/PageHead";

export const metadata: Metadata = {
  title: "The floor — FounderFloor",
  description: "A permanent trade-show floor where your product gets a stand and you walk around everybody else's.",
};

export default function Page() {
  return (
    <>
      <PageHead
        eyebrow="Not open yet"
        title="Then a floor to put it on"
        line="A permanent trade show that never tears down: your product gets a stand, and you walk around everybody else's. It is built, and it stays shut until there are enough founders on it to be worth walking around — an empty hall helps nobody."
        glyph="star"
      />
      <section className="band">
        <div className="wrap">
          <div className="hall-frame tall">
            <HeroScene bare playable density={1.4} />
          </div>
          <p className="small" style={{ marginTop: 12, textAlign: "center" }}>
            This is the hall itself, running here. Click it and walk with the arrow keys.
          </p>
        </div>
      </section>
      <section className="band tint close">
        <div className="wrap close-in">
          <h2>Get something worth putting on it</h2>
          <Link className="btn primary" href="/v2">Draw my app</Link>
        </div>
      </section>
    </>
  );
}
