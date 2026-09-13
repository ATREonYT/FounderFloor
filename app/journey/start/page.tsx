import type { Metadata } from "next";
import Onboarding from "@/components/journey/Onboarding";

export const metadata: Metadata = { title: "Start" };

export default function Page() {
  return <Onboarding />;
}
