/**
 * One question the site asks, answered once: how much room is there?
 *
 * The site decides pointer kind by `(pointer: coarse)`, not screen size,
 * and treats a touch device in landscape under 500px tall as a
 * `landscapePhone` (tightens the HUD, hides the ticket chip). The app has
 * a window, so it asks the window:
 *
 *   compact   < 600   one column; panels are bottom sheets at ≤ 85% of the
 *                     height with a strip of hall visible above (StallPanel)
 *   regular   600–1023  two columns where it helps; panels centred, ≤ 512
 *                     wide and ≤ 70% tall so the hall reads around them
 *   wide      ≥ 1024  three columns / side rail; the same panel caps
 *
 * Every screen composes from these three words and nothing else, so a
 * layout decision is greppable.
 */
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type LayoutClass = "compact" | "regular" | "wide";

export function useLayout() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const cls: LayoutClass = width < 600 ? "compact" : width < 1024 ? "regular" : "wide";
  const landscapePhone = cls === "compact" && width > height && height < 500;
  return {
    width,
    height,
    insets,
    cls,
    compact: cls === "compact",
    regular: cls === "regular",
    wide: cls === "wide",
    landscapePhone,
    /** The panel geometry StallPanel uses: sheet on compact, card otherwise. */
    panel: {
      maxWidth: cls === "compact" ? width : 512,
      maxHeight: Math.round(height * (cls === "compact" ? 0.85 : 0.7)),
      anchor: cls === "compact" ? ("bottom" as const) : ("center" as const),
      /** the site's `p-3` / `sm:p-6` gutter */
      gutter: cls === "compact" ? 12 : 24,
    },
    /** Content shell: the site's max-w-6xl at 32px gutters, tighter on phones. */
    shell: { paddingHorizontal: cls === "compact" ? 16 : cls === "regular" ? 24 : 32, maxWidth: 1152 },
    /** Column count for card grids. */
    columns: cls === "compact" ? 1 : cls === "regular" ? 2 : 3,
  };
}
