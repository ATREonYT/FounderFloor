import { notFound } from "next/navigation";

import BoothSheet from "./BoothSheet";

/**
 * The booth contact sheet is a workshop tool, not a page of the site.
 *
 * It ships in the bundle either way, so the route itself is the gate:
 * without NEXT_PUBLIC_DEV_TOOLS=1 at build time this is a 404, which is
 * what founderfloor.net gets. Set the flag locally to review the art.
 */
export default function DevBoothsPage() {
  if (process.env.NEXT_PUBLIC_DEV_TOOLS !== "1") notFound();
  return <BoothSheet />;
}
