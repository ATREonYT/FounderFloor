/**
 * The ring — a progress meter drawn as a circle, for the one place a bar
 * would lie: a value with a centre worth reading (a percentage, a day
 * count) that the eye should land on before it reads the track.
 *
 * Cousin of Progress (the meter bar), same rules: a track on the well
 * tint, a fill in one colour, tabular figures. It draws over 900ms on the
 * site's ease-out — deliberately longer than the bar's reveal, because a
 * ring travels further than a bar and a fast arc looks like a spinner.
 * The arc starts at twelve o'clock (the −90° rotation) because that is
 * where every clock face starts and nobody has to learn it.
 * NEW: not on the site.
 */
import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, { Easing, useAnimatedProps, useReducedMotion, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { Display, Spec } from "./Text";
import { ease, shell } from "./tokens";
import { scheme } from "./theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function Ring({
  value,
  size = 72,
  stroke = 8,
  color = shell.accent,
  track,
  label,
  sub,
  delay = 0,
}: {
  /** 0..1 */
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  label?: string;
  sub?: string;
  delay?: number;
}) {
  const v = Math.max(0, Math.min(1, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const reduce = useReducedMotion();
  const p = useSharedValue(reduce ? v : 0);

  useEffect(() => {
    p.value = reduce ? v : withDelay(delay, withTiming(v, { duration: 900, easing: Easing.bezier(...ease.out) }));
  }, [v, delay, reduce, p]);

  const arc = useAnimatedProps(() => ({ strokeDashoffset: c * (1 - p.value) }));

  return (
    <View
      style={{ width: size, height: size }}
      accessibilityRole="progressbar"
      accessibilityLabel={label ? `${label}${sub ? ", " + sub : ""}` : undefined}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(v * 100) }}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track ?? (scheme() === "dark" ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)")} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${c} ${c}`}
          animatedProps={arc}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]} pointerEvents="none">
        {label !== undefined && (
          <Display size="lg" accessibilityRole="text" style={{ fontVariant: ["tabular-nums"] }}>
            {label}
          </Display>
        )}
        {sub !== undefined && <Spec tone="muted">{sub}</Spec>}
      </View>
    </View>
  );
}
