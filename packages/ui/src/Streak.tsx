/**
 * The streak — the last week as a row of tiles, one per day: accent for a
 * day worked, brass for a day deliberately rested, well for nothing.
 *
 * No flame, no counter that resets to zero, no "don't break it". Duolingo's
 * own research on streaks found the loss-aversion framing that drives daily
 * opens also drives burnout and churn once a streak breaks — the user who
 * misses a day quits rather than face the zero. Founders are already
 * over-indexed on guilt. So a rest day is a colour of its own (brass, the
 * membership colour, earned) and the label says what happened in plain
 * words. The tiles spring in left to right so the row reads as a week
 * being laid, not a scoreboard lighting up.
 * NEW: not on the site.
 */
import { useEffect } from "react";
import { View } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSpring } from "react-native-reanimated";
import { Spec } from "./Text";
import { shell } from "./tokens";

const SQ = 14;
const GAP = 6;

function Tile({ i, color }: { i: number; color: string }) {
  const reduce = useReducedMotion();
  const s = useSharedValue(reduce ? 1 : 0.6);
  useEffect(() => {
    s.value = reduce ? 1 : withDelay(i * 40, withSpring(1, { damping: 14, stiffness: 220 }));
  }, [i, reduce, s]);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return <Animated.View style={[{ width: SQ, height: SQ, borderRadius: 4, backgroundColor: color }, a]} />;
}

export function Streak({
  days,
  rest = [],
  total = 7,
  label,
}: {
  /** The last N days, oldest first; true = active. */
  days: boolean[];
  /** Indexes into `days` that were rest days. */
  rest?: number[];
  total?: number;
  label?: string;
}) {
  const tiles = Array.from({ length: total }, (_, i) => {
    const active = days[i] === true;
    const rested = rest.includes(i);
    return active ? shell.accent : rested ? shell.gold : shell.well;
  });
  const activeCount = days.slice(0, total).filter(Boolean).length;
  const restCount = rest.filter((i) => i >= 0 && i < total && days[i] !== true).length;
  const summary =
    label ??
    `${activeCount} of ${total} days active${restCount > 0 ? `, ${restCount} rest day${restCount === 1 ? "" : "s"}` : ""}`;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }} accessible accessibilityRole="text" accessibilityLabel={summary}>
      <View style={{ flexDirection: "row", gap: GAP }}>
        {tiles.map((c, i) => (
          <Tile key={i} i={i} color={c} />
        ))}
      </View>
      {label !== undefined && <Spec tone="muted">{label}</Spec>}
    </View>
  );
}
