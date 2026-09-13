import type { Metadata } from "next";
import { course } from "@founderfloor/shared";
import UnitPage from "@/components/journey/UnitPage";

export function generateStaticParams() {
  return course.UNITS.map((u) => ({ id: u.id }));
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const u = course.unitById(params.id);
  return { title: u ? `Unit ${u.n}: ${u.name}` : "Unit" };
}

export default function Page({ params }: { params: { id: string } }) {
  return <UnitPage id={params.id} />;
}
