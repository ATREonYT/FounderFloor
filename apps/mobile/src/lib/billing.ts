/**
 * Billing behind an interface. In dev the store flips the plan and starts
 * a three-day trial; in production this file wraps RevenueCat (Gate 7)
 * and the plan comes from the entitlement, never from the device. The
 * floor server's own membership (site perks) is a separate product and is
 * read from /state; `effectivePlan` takes the higher of the two so a
 * paying site member is never shown a paywall in the app.
 */
import { APP_PLANS, type Plan } from "@founderfloor/shared";
import { useFounder, useSession } from "./store";

export type Cycle = "monthly" | "annual";

export interface Offering {
  plan: Exclude<Plan, "free">;
  cycle: Cycle;
  price: number;
  currency: "USD";
  trialDays: number;
  productId: string;
}

export function offerings(): Offering[] {
  const out: Offering[] = [];
  for (const plan of ["pro", "founder"] as const) {
    for (const cycle of ["monthly", "annual"] as const) {
      out.push({ plan, cycle, price: APP_PLANS[plan][cycle], currency: "USD", trialDays: APP_PLANS[plan].trialDays, productId: `net.founderfloor.app.${plan}.${cycle}` });
    }
  }
  return out;
}

/** The plan the gates use: the app's own, or the site's membership, whichever is higher. */
export function effectivePlan(): Plan {
  const app = useFounder.getState().plan.plan;
  const site = useSession.getState().floor?.paid?.tier ?? "free";
  const order: Plan[] = ["free", "pro", "founder"];
  return order[Math.max(order.indexOf(app), order.indexOf(site))];
}

export async function purchase(o: Offering): Promise<{ ok: true } | { ok: false; error: string }> {
  // TODO(gate-7): Purchases.purchasePackage(pkg) and read the entitlement back
  const until = new Date(Date.now() + o.trialDays * 86_400_000).toISOString();
  useFounder.getState().setPlan({ plan: o.plan, cycle: o.cycle, trialEnds: until, sandbox: true });
  return { ok: true };
}

export async function restore(): Promise<void> {
  // TODO(gate-7): Purchases.restorePurchases()
}
