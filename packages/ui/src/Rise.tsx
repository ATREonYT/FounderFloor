/**
 * RISE — how a page's sections arrive. Each one fades in over 200 ms
 * and lifts 8 px into place, one after another, 40 ms apart, on a strong
 * ease-out from an already-visible default. It runs once, when the
 * section mounts, and never again: nothing on the page moves after it has
 * arrived. Under Reduce Motion, Reanimated skips the entering animation
 * and the section is simply there.
 */
import type { ReactNode } from "react";
import type { ViewStyle } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

export function Rise({ k = 0, children, style }: { /** The section's place in the order: the delay is 40 ms times this. */ k?: number; children: ReactNode; style?: ViewStyle }) {
  return (
    <Animated.View entering={FadeInUp.duration(200).delay(k * 40)} style={style}>
      {children}
    </Animated.View>
  );
}
