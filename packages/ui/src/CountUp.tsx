/**
 * The count-up — a Display figure that arrives by counting, the way a
 * till or a departures board settles on its number rather than blinking
 * to it. For the hero stat on a screen (revenue, days, members), never for
 * body copy.
 *
 * It runs on requestAnimationFrame in JS rather than on the UI thread:
 * text cannot be driven by an animated style, and a setState per frame
 * for 1.2s on one label is a cost this app can afford. Ease-out cubic so
 * the last digits slow down and can be read as they land. A changed `to`
 * counts on from where the figure already was — a number that jumps back
 * to zero before rising again looks like a reset, not an update.
 * NEW: not on the site.
 */
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { Display } from "./Text";

const defaultFormat = (n: number) => Math.round(n).toLocaleString("en-GB");
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function CountUp({
  to,
  prefix = "",
  suffix = "",
  duration = 1200,
  delay = 0,
  size = "xl",
  tone = "ink",
  format = defaultFormat,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  delay?: number;
  size?: "lg" | "xl" | "3xl" | "4xl";
  tone?: "ink" | "paper" | "accent" | "muted";
  format?: (n: number) => string;
}) {
  const reduce = useReducedMotion();
  const from = useRef(reduce ? to : 0);
  const [n, setN] = useState(reduce ? to : 0);

  useEffect(() => {
    const start = from.current;
    if (reduce || duration <= 0 || start === to) {
      from.current = to;
      setN(to);
      return;
    }
    let raf = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const run = () => {
      const t0 = Date.now();
      const tick = () => {
        const k = Math.min(1, (Date.now() - t0) / duration);
        const cur = start + (to - start) * easeOutCubic(k);
        from.current = cur;
        setN(cur);
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    if (delay > 0) timer = setTimeout(run, delay);
    else run();
    return () => {
      if (timer !== undefined) clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [to, duration, delay, reduce]);

  // Screen readers get the final figure at once, not every frame of the count.
  return (
    <View accessible accessibilityRole="text" accessibilityLabel={`${prefix}${format(to)}${suffix}`} style={{ alignSelf: "flex-start" }}>
      <Display size={size} tone={tone} accessibilityRole="text" style={{ fontVariant: ["tabular-nums"] }}>
        {prefix}
        {format(n)}
        {suffix}
      </Display>
    </View>
  );
}
