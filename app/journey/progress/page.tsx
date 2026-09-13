import type { Metadata } from "next";
import ProgressView from "@/components/journey/ProgressView";

export const metadata: Metadata = { title: "Progress" };

export default function Page() {
  return <ProgressView />;
}
