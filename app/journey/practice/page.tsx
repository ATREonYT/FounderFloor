import type { Metadata } from "next";
import Practice from "@/components/journey/Practice";

export const metadata: Metadata = { title: "Practice" };

export default function Page() {
  return <Practice />;
}
