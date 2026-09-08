/**
 * Marks a control the tour can spotlight. Registers its window position
 * while the tour is active (re-measured on a short timer, because things
 * scroll) and reports a tap on it, which is what advances the step.
 */
import { useEffect, useRef, type ReactNode } from "react";
import { Platform, View, type ViewStyle } from "react-native";
import { useTour } from "../lib/tour";

export function TourTarget({ id, children, style }: { id: string; children: ReactNode; style?: ViewStyle }) {
  const ref = useRef<View>(null);
  const active = useTour((s) => s.active);
  const register = useTour((s) => s.register);
  const tapped = useTour((s) => s.tapped);
  useEffect(() => {
    if (!active) return;
    const measure = () => ref.current?.measureInWindow((x, y, w, h) => (w > 0 && h > 0 ? register(id, { x, y, w, h }) : undefined));
    measure();
    const t = setInterval(measure, 250);
    return () => clearInterval(t);
  }, [active, id, register]);
  // touches on the phone; a mouse on the web sends pointer events instead
  const web = Platform.OS === "web";
  return (
    <View ref={ref} collapsable={false} style={style} onTouchEnd={web ? undefined : () => tapped(id)} {...(web ? { onPointerUp: () => tapped(id) } : {})}>
      {children}
    </View>
  );
}
