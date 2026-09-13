import type { Metadata } from "next";
import { course } from "@founderfloor/shared";
import Checkpoint from "@/components/journey/Checkpoint";

export function generateStaticParams() {
  return course.UNITS.map((u) => ({ id: u.id }));
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const u = course.unitById(params.id);
  return { title: u ? `Checkpoint: ${u.name}` : "Checkpoint" };
}

export default function Page({ params }: { params: { id: string } }) {
  return <Checkpoint unitId={params.id} />;
}
