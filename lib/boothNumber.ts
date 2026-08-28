/**
 * THE STAND REFERENCE. Hall letter, dash, two-digit stand: A-01, C-14.
 * The most credible thing this directory owns is an address you can
 * quote, so it is generated from the spot and is the same string
 * everywhere it appears — the stand page, the directory, the share
 * card, the in-hall register and the floor's own toasts all call this
 * one function.
 *
 * DERIVED from (floorId, spotIndex), never stored: claims keep their
 * spotIndex identity, so a reference can never drift from the spot it
 * names. One-based, because no trade show has a stand zero.
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
  return `${hall}-${String(spotIndex + 1).padStart(2, "0")}`;
}
