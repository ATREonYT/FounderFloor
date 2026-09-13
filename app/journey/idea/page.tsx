import type { Metadata } from "next";
import Idea from "@/components/journey/Idea";

export const metadata: Metadata = { title: "My idea" };

export default function Page() {
  return <Idea />;
}
