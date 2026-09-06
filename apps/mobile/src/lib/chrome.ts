/** The floating bottom menu's footprint on compact screens, so content can clear it. */
import { useLayout } from "@founderfloor/ui";
export const BAR = { height: 68, inset: 12 } as const;
export function useBottomChrome() {
  const L = useLayout();
  // the rail lives beside the content on regular/wide, so nothing to clear
  return L.compact ? L.insets.bottom + BAR.inset + BAR.height + 8 : L.insets.bottom + 12;
}
/** The reading column: assistant apps centre a ~720px column on wide screens. */
export const COLUMN = 720;

/**
 * A message the app itself wants sent at the desk (the Office's rituals).
 * Kept in memory, not in the URL, so a deep link can never speak for the
 * founder. Read once, then cleared.
 */
let pendingSay: { coach: string; text: string } | null = null;
export const setPendingSay = (coach: string, text: string) => {
  pendingSay = { coach, text };
};
export const takePendingSay = (coach: string): string | null => {
  if (pendingSay && pendingSay.coach === coach) {
    const t = pendingSay.text;
    pendingSay = null;
    return t;
  }
  return null;
};
