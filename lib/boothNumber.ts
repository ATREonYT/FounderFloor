/**
 * Booth numbers the way a real show prints them: hall letter, dash,
 * row-and-position. Spot 0 on the Main Hall is A-101, not "#1" — a code
 * that reads as a place somebody planned, and sorts correctly besides.
 *
 * The number is DERIVED from (floorId, spotIndex), never stored: claims
 * keep their spotIndex identity, so the code can never drift from the
 * spot it names. 101-based so no booth is ever "100" or "0" — trade
 * shows do not have a booth zero.
 */
const HALL_LETTER: Record<string, string> = {
  "main-hall": "A",
  "indie-alley": "B",
  "ramen-district": "C",
  "cofounder-row": "D",
  "tutorial-hall": "T",
};

// TODO(spot-id): when claims carry ids, derive the number from the id's
// position (spotIndexById) so printed numbers survive the claims migration.
export function boothNumber(floorId: string | null | undefined, spotIndex: number): string {
  if (!floorId || spotIndex < 0) return "";
  const hall = HALL_LETTER[floorId] ?? floorId.charAt(0).toUpperCase();
  return `${hall}-${101 + spotIndex}`;
}
