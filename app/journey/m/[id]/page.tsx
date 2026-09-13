import type { Metadata } from "next";
import { journey } from "@founderfloor/shared";
import Mission from "@/components/journey/Mission";

export function generateStaticParams() {
  return journey.MISSIONS.map((m) => ({ id: m.id }));
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const m = journey.missionById(params.id);
  return { title: m ? `${m.n}. ${m.title}` : "Mission" };
}

export default function Page({ params }: { params: { id: string } }) {
  return <Mission id={params.id} />;
}
