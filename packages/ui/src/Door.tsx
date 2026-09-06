/**
 * The door — a room on the floor, as the thing you would actually walk
 * through. A panel-toned plate holding a small painted door in the room's
 * colour, its name beneath in Body, its meta in Spec; a lamp over the
 * frame when this is the room you are standing in, a tick and a dimmed
 * leaf once the room is done.
 *
 * `open` swings the leaf on its hinge — a real 3D rotateY about the left
 * edge with a short perspective, so it reads as a door and not as a card
 * flipping. It is a spring, not a timing curve, because a door has weight
 * and settles; the press is the kit's usual 0.97 squeeze. No Signage: a
 * door's name is a word, not a sign, and the uppercase stays on the Sign.
 * NEW: not on the site.
 */
import { View, Pressable } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from "react-native-reanimated";
import { useEffect } from "react";
import { Plate } from "./Plate";
import { Body, Spec } from "./Text";
import { shell, art } from "./tokens";

export function Door({
  color,
  sign,
  name,
  meta,
  open = false,
  done = false,
  here = false,
  onPress,
  size = 44,
}: {
  color: string;
  /** Short lettering painted on the door (a glyph or a number). */
  sign: string;
  name: string;
  meta?: string;
  open?: boolean;
  done?: boolean;
  here?: boolean;
  onPress?: () => void;
  size?: number;
}) {
  const reduce = useReducedMotion();
  const swing = useSharedValue(open ? 1 : 0);
  const press = useSharedValue(1);

  useEffect(() => {
    swing.value = reduce ? (open ? 1 : 0) : withSpring(open ? 1 : 0, { damping: 16, stiffness: 180 });
  }, [open, reduce, swing]);

  const leaf = useAnimatedStyle(() => ({
    transform: [{ perspective: 300 }, { rotateY: `${-62 * swing.value}deg` }],
  }));
  const squeeze = useAnimatedStyle(() => ({ transform: [{ scale: press.value }] }));

  const down = () => {
    press.value = reduce ? 1 : withSpring(0.97, { damping: 12, stiffness: 260 });
  };
  const up = () => {
    press.value = withSpring(1, { damping: 12, stiffness: 260 });
  };

  const h = size * 1.35;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={down}
      onPressOut={up}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name}${meta ? ", " + meta : ""}`}
      accessibilityState={{ selected: here }}
      style={{ width: "100%" }}
    >
      <Animated.View style={[squeeze, { width: "100%" }]}>
        <Plate tone="panel" radius={18} padding={12} style={{ width: "100%" }} contentStyle={{ overflow: "hidden" }}>
          <View style={{ alignItems: "center", gap: 8, width: "100%", overflow: "hidden" }}>
            {/* the frame: fixed box the leaf swings inside, lamp above */}
            <View style={{ width: size, height: h + 10, alignItems: "flex-start", justifyContent: "flex-end" }}>
              {here && (
                <View
                  style={{ position: "absolute", top: 0, left: size / 2 - 2.5, width: 5, height: 5, borderRadius: 2.5, backgroundColor: shell.accentLift }}
                  accessibilityElementsHidden
                />
              )}
              <Animated.View
                style={[
                  {
                    width: size,
                    height: h,
                    backgroundColor: color,
                    borderWidth: 2,
                    borderColor: shell.ink,
                    borderTopLeftRadius: 3,
                    borderTopRightRadius: 3,
                    opacity: done ? 0.55 : 1,
                    transformOrigin: "left center",
                    alignItems: "center",
                    justifyContent: "center",
                  },
                  leaf,
                ]}
              >
                <Spec accessibilityRole="text" numberOfLines={1} style={{ color: art.paper, fontSize: 8, lineHeight: 10, letterSpacing: 0.4, maxWidth: size - 10 }}>
                  {done ? "✓" : sign}
                </Spec>
                <View
                  style={{ position: "absolute", right: 4, top: h * 0.45 - 2, width: 4, height: 4, borderRadius: 2, backgroundColor: art.paper }}
                />
              </Animated.View>
            </View>
            <View style={{ alignItems: "center", width: "100%", overflow: "hidden" }}>
              <Body size="sm" medium numberOfLines={1} style={{ maxWidth: "100%" }}>
                {name}
              </Body>
              {meta !== undefined && (
                <Spec tone="muted" numberOfLines={1}>
                  {meta}
                </Spec>
              )}
            </View>
          </View>
        </Plate>
      </Animated.View>
    </Pressable>
  );
}
