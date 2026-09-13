import type { Metadata } from "next";
import "./journey.css";
import JourneyStore from "@/components/journey/Store";
import { JourneyChrome } from "@/components/journey/Chrome";

export const metadata: Metadata = {
  title: { default: "The journey", template: "%s · FounderFloor" },
  description: "Small steps toward a business worth building. Learn the essentials, talk to potential customers, and test your idea, one clear mission at a time.",
};

/**
 * One journey, its own shell. This layout owns the three-tab bar and
 * hides the hall's chrome while it is on screen (globals.css, off
 * body[data-on-journey]), so a founder inside a lesson never sees a nav
 * about trade-show floors.
 */
export default function JourneyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="journey">
      <JourneyStore>
        <JourneyChrome />
        <main id="j-main" className="j-main">
          <div className="j-wrap">{children}</div>
        </main>
      </JourneyStore>
    </div>
  );
}
