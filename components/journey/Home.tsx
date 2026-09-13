"use client";

/**
 * THE HOME SCREEN: ONE CARD, THEN THE ROAD.
 *
 * A greeting that is never a scolding, the next mission with one button,
 * and the path underneath. Nothing else: no numbers grid, no second call
 * to action. A founder with no profile yet is sent to the three questions
 * at the door, because the first useful activity should be a minute away.
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { journey } from "@founderfloor/shared";
import { useJourney } from "@/components/journey/Store";
import Guide from "@/components/journey/Guide";
import NextCard from "@/components/journey/NextCard";
import Path from "@/components/journey/Path";
import Celebrate from "@/components/journey/Celebrate";

export default function Home() {
  const { state, ready, now } = useJourney();
  const router = useRouter();

  useEffect(() => {
    if (ready && !state.profile) router.replace("/journey/start");
  }, [ready, state.profile, router]);

  if (!ready) return <p className="j-loading">Opening your journey…</p>;
  if (!state.profile) return <p className="j-loading">One moment…</p>;

  return (
    <>
      <div className="j-greet">
        <Guide />
        <p>{journey.greeting(state, now())}</p>
      </div>
      <NextCard />
      <Path />
      <Celebrate />
    </>
  );
}
