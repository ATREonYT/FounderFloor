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
      // a counter from another day or month is zero, whatever the store still says
      const d = new Date().toISOString().slice(0, 10), m = d.slice(0, 7);
      const fresh = { ...usage, coachTurnsToday: usage.day === d ? usage.coachTurnsToday : 0, draftsThisMonth: usage.month === m ? usage.draftsThisMonth : 0, handoffsThisMonth: usage.month === m ? usage.handoffsThisMonth : 0 };
      const r = canUse(kind, fresh, effectivePlan(), extra);
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
