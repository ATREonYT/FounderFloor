/**
 * THE TAB BAR — the bottom menu as a floating pill.
 *
 * The Menu is the site's glass strip; this is the app's own take on it, the
 * one every 2026 assistant app floats over its content: a pill of foamcore
 * at 92%, a trestle hairline, the float cast. One dark disc — the ink
 * ground — slides under whichever glyph is active, and that glyph flips to
 * its paper cut so it reads on the dark; the others sit in ink at half
 * strength. The active label floats 4px above the bar on the same spring,
 * so the word and the disc arrive together. Labels for the rest are the
 * accessibility name; the site never hides its labels, and here the one
 * that matters is always on screen.
 *
 * Always horizontal: the app decides where it lives, the bar does not.
 * The disc jumps (no spring) on the first layout and under reduced motion.
 */
import { useEffect, useRef, useState } from "react";
import { Pressable, View, type LayoutChangeEvent } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from "react-native-reanimated";
import { MENU, type MenuEntry } from "./Menu";
import { Sprite, type SpriteId } from "./Sprite";
import { Spec } from "./Text";
import { alpha, scheme } from "./theme";
import { haptic } from "./Tap";
import { radius, shadow, shell } from "./tokens";

const HEIGHT = 64;
const PAD = 6;
const DISC = 50;
const LABEL_W = 96;
const cast = shadow.float[1];

export function TabBar({
  active,
  onSelect,
  entries = MENU,
  badge,
}: {
  active: string;
  onSelect: (key: string) => void;
  entries?: MenuEntry[];
  /** Counts by entry key; a missing or zero count draws nothing. */
  badge?: Partial<Record<string, number>>;
}) {
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const x = useSharedValue(0);
  const placed = useRef(false);

  const n = Math.max(1, entries.length);
  const slot = width > 0 ? (width - PAD * 2) / n : 0;
  const index = Math.max(
    0,
    entries.findIndex((e) => e.key === active),
  );
  const centre = PAD + slot * index + slot / 2;

  useEffect(() => {
    if (width <= 0) return;
    if (!placed.current || reduced) {
      x.value = centre;
      placed.current = true;
      return;
    }
    x.value = withSpring(centre, { damping: 26, stiffness: 420, overshootClamping: true });
  }, [centre, width, reduced, x]);

  const disc = useAnimatedStyle(() => ({ transform: [{ translateX: x.value - DISC / 2 }] }));
  const word = useAnimatedStyle(() => ({ transform: [{ translateX: x.value - LABEL_W / 2 }] }));

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w !== width) setWidth(w);
  };

  const current = entries[index];

  return (
    <View style={{ position: "relative" }}>
      {/* the active label lives in the accessibility name; a floating word above the bar collided with content */}
      <View
        onLayout={onLayout}
        style={{
          height: HEIGHT,
          paddingHorizontal: PAD,
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: alpha.glassFill(),
          borderWidth: 1,
          borderColor: shell.line,
          borderRadius: radius.full,
          shadowColor: cast.color,
          shadowOffset: cast.offset,
          shadowRadius: cast.radius,
          shadowOpacity: 1,
          elevation: 8,
        }}
      >
        {width > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[{ position: "absolute", left: 0, top: (HEIGHT - 2 - DISC) / 2, width: DISC, height: DISC, borderRadius: DISC / 2, backgroundColor: shell.ink }, disc]}
          />
        ) : null}
        {entries.map((e) => {
          const on = e.key === active;
          // the sprites are baked colours: by night the "paper" glyph is the dark one on the light disc, and vice versa
          const dark = scheme() === "dark";
          const glyph = `glyph-${e.glyph}-${on ? (dark ? "ink" : "paper") : dark ? "paper" : "ink"}` as SpriteId;
          const count = badge?.[e.key];
          return (
            <Pressable
              key={e.key}
              onPress={() => {
                void haptic("light");
                onSelect(e.key);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={e.label}
              style={{ flex: 1, height: HEIGHT - 2, alignItems: "center", justifyContent: "center" }}
            >
              <View style={{ position: "relative", opacity: on ? 1 : 0.55, alignItems: "center", gap: 1 }}>
                <Sprite id={glyph} scale={2} />
                <Spec tone={on ? (dark ? "ink" : "paper") : "muted"} style={{ fontSize: 9, lineHeight: 11 }}>
                  {e.label}
                </Spec>
              </View>
              {count ? (
                <View
                  style={{
                    position: "absolute",
                    top: 8,
                    right: "50%",
                    marginRight: -18,
                    minWidth: 16,
                    height: 16,
                    borderRadius: radius.full,
                    backgroundColor: shell.accent,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 3,
                  }}
                >
                  <Spec tone="paper" style={{ fontSize: 9, lineHeight: 12 }}>
                    {count}
                  </Spec>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
