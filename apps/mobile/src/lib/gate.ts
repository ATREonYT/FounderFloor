/** One question before any paid thing: may this founder do it on their plan? If not, the plans page opens with the reason. */
import { useCallback } from "react";
import { useRouter, type Href } from "expo-router";
import { canUse, type UsageKind } from "@founderfloor/shared";
import { useFounder } from "./store";
import { effectivePlan } from "./billing";

export function useGate() {
  const router = useRouter();
  const usage = useFounder((s) => s.usage);
  const count = useFounder((s) => s.count);
  return useCallback(
    (kind: UsageKind, extra?: { coach?: string }): boolean => {
      const r = canUse(kind, usage, effectivePlan(), extra);
      if (!r.ok) {
        router.push({ pathname: "/plans", params: { why: r.reason ?? "" } } as Href);
        return false;
      }
      const key = kind === "ideaRun" ? "ideaRuns" : kind === "ideaCheck" ? "ideaChecks" : kind === "coachTurn" ? "coachTurnsToday" : kind === "draft" ? "draftsThisMonth" : "handoffsThisMonth";
      count(key);
      return true;
    },
    [usage, count, router],
  );
}
