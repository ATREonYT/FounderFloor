import type { Metadata } from "next";
import "./studio.css";
import OwnChrome from "@/components/studio/OwnChrome";

export const metadata: Metadata = {
  title: "FounderFloor — see your start-up before you build it",
  description: "Type one sentence and get the real screens of your product, then a four-week plan to get a person to pay for it.",
};

/**
 * The new site lives under its own layout while it is being built, so it
 * cannot touch the one that is live. When it is ready this becomes the
 * root and /v2 goes away.
 */
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="studio">
      <OwnChrome />
      {children}
    </div>
  );
}
