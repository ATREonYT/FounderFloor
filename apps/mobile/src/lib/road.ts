/**
 * Where the founder is on the road, from what the building knows: the
 * sign on the stand, the interviews in the Office, the plan, the tasks
 * ticked, the Workshop opened, the brief sent, the first customer logged.
 */
import { roadState, type Road, type StopId } from "@founderfloor/shared";
import { useStand } from "./stand";
import { useFounder } from "./store";

export function useRoad(): Road {
  const stand = useStand();
  const interviews = useFounder((s) => s.interviews.length);
  const plan = useFounder((s) => !!s.roadmap);
  const tasksDone = useFounder((s) => s.planDone.length);
  const sawApp = useFounder((s) => !!s.mockup && s.mockup.source !== "sample");
  const handedOff = useFounder((s) => s.handedOff);
  const customers = useFounder((s) => s.kpi.at(-1)?.customers ?? 0);
  const r = stand.record;
  return roadState({ sign: stand.source !== "rehearsal" && !!r.oneLiner, interviews, plan, tasksDone, sawApp, handedOff, customers, mrr: r.mrr ?? 0 });
}

/** The colour and glyph of each stop, the same everywhere. */
export const STOP_LOOK: Record<StopId, { color: string; glyph: "wave" | "heart" | "bolt" | "star" | "cube" | "chip" | "coin" }> = {
  idea: { color: "#8C3B2E", glyph: "wave" },
  people: { color: "#2F6F6A", glyph: "heart" },
  plan: { color: "#4F6E6B", glyph: "bolt" },
  week: { color: "#3B5B92", glyph: "star" },
  app: { color: "#A28457", glyph: "cube" },
  build: { color: "#4E6E4E", glyph: "chip" },
  customer: { color: "#5E7C93", glyph: "coin" },
};
