import type { Metadata } from "next";
import { course } from "@founderfloor/shared";
import Lesson from "@/components/journey/Lesson";

export function generateStaticParams() {
  return course.LESSONS.map((p) => ({ id: p.lesson.id }));
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const p = course.lessonById(params.id);
  return { title: p ? `${p.lesson.title} · ${p.unit.name}` : "Lesson" };
}

export default function Page({ params }: { params: { id: string } }) {
  return <Lesson id={params.id} />;
}
