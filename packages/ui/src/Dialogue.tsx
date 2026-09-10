/**
 * THE DIALOGUE — the shell every stall, coach and panel opens inside.
 *
 * It is components/StallPanel.tsx, reproduced: an awning stripe (8px, 14
 * alternating cells of the speaker's colour and paper), a header with the
 * sign in Archivo, a one-line blurb, the keeper's chip on the awning colour
 * and a Close button, a scrolling body, and the footer line. The scrim is
 * ink at 45% so the hall is clearly still there behind it.
 *
 * Geometry comes from useLayout: a bottom sheet on a phone (a strip of
 * hall stays visible above), a centred card ≤ 512 wide otherwise.
 *
 * The sheet behaves like a physical sheet. It rises from the bottom edge
 * on the iOS sheet curve (320ms) and leaves the way it came. Its awning,
 * handle and header can be dragged: the sheet follows the finger 1:1,
 * resists past the top, and on release the flick decides, not the
 * distance: the finger's velocity is projected forward, and if that lands
 * past four tenths of the sheet it goes, carrying the velocity into the
 * spring; otherwise it snaps home with a light tick. The scrim's opacity
 * is derived from the sheet's position, so it is always in step. Grabbing
 * the sheet mid-animation starts from where it is, never from a target.
 * Reduced motion: a cross-fade, no travel. The scrim, the Close button and
 * the hardware back button all dismiss. This is the ONE overlay on the app.
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { BackHandler, Modal, Pressable, ScrollView, View, type LayoutChangeEvent } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { Easing, Extrapolation, interpolate, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useLayout } from "./Responsive";
import { Plate } from "./Plate";
import { Glow } from "./Stage";
import { Body, Display, Spec } from "./Text";
import { curve, ms, radius, shell, spring } from "./tokens";
import { alpha } from "./theme";
import { haptic } from "./Tap";

/** The sheet's corner radius; the lower corners hang below the screen edge by the same amount. */
const R_SHEET = 28;

/** Where the finger would come to rest if it kept decelerating (Apple's exponential-decay form). */
function project(velocity: number, decelerationRate = 0.998): number {
  "worklet";
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}
/** The further past the edge, the less the sheet follows. */
function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  "worklet";
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

export function Dialogue({
  open,
  onClose,
  sign,
  keeper,
  blurb,
  color = shell.accent,
  wide = false,
  children,
  footer = "Tap outside or × to go back; nothing is lost",
}: {
  open: boolean;
  onClose: () => void;
  /** Sign over the stall, e.g. "PORTER'S LODGE". */
  sign: string;
  /** Who is behind the counter. */
  keeper: string;
  blurb?: string;
  /** Awning colour — the header rule and the keeper chip. */
  color?: string;
  wide?: boolean;
  children: ReactNode;
  footer?: string | null;
}) {
  const L = useLayout();
  const reduced = useReducedMotion();
  const sheet = L.panel.anchor === "bottom";
  /** The sheet stays mounted while it leaves, so the exit is seen. */
  const [mounted, setMounted] = useState(open);
  /** 0..1 for the centred card (opacity, rise, scale); for the sheet, the scrim reads the sheet's own position. */
  const t = useSharedValue(0);
  /** The sheet's travel from home (0) to gone (its own height). */
  const y = useSharedValue(0);
  const start = useSharedValue(0);
  const h = useSharedValue(600);
  const [height, setHeight] = useState(600);

  const close = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    if (open) {
      setMounted(true);
      if (sheet && !reduced) {
        // rise from the bottom edge, from wherever the sheet is now
        y.value = Math.max(y.value, h.value);
        y.value = withTiming(0, { duration: 320, easing: Easing.bezier(...curve.sheet) });
      } else y.value = 0;
      t.value = withTiming(1, { duration: ms.panelIn, easing: Easing.bezier(...curve.out) });
      return;
    }
    if (!mounted) return;
    const done = (finished?: boolean) => {
      "worklet";
      if (finished) scheduleOnRN(setMounted, false);
    };
    if (sheet && !reduced) {
      y.value = withTiming(h.value, { duration: 240, easing: Easing.bezier(...curve.sheet) }, done);
      t.value = withTiming(0, { duration: 240, easing: Easing.bezier(...curve.out) });
    } else {
      y.value = 0;
      t.value = withTiming(0, { duration: ms.panelOut, easing: Easing.bezier(...curve.out) }, done);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      close();
      return true;
    });
    return () => sub.remove();
  }, [open, close]);

  // the finger on the awning, the handle or the header
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(sheet)
        .activeOffsetY([-10, 10])
        .onStart(() => {
          start.value = y.value; // from where it is, never from a target
        })
        .onUpdate((e) => {
          const next = start.value + e.translationY;
          y.value = next >= 0 ? next : rubberband(next, h.value);
        })
        .onEnd((e) => {
          const projected = y.value + project(e.velocityY);
          if (projected > h.value * 0.4) {
            y.value = withSpring(h.value, { ...spring.sheet, dampingRatio: 1, velocity: e.velocityY, overshootClamping: true }, (finished) => {
              if (finished) {
                scheduleOnRN(setMounted, false);
                scheduleOnRN(close);
              }
            });
          } else {
            y.value = withSpring(0, { ...spring.sheet, velocity: e.velocityY });
            scheduleOnRN(haptic, "light");
          }
        }),
    [sheet, y, start, h, close],
  );

  const scrim = useAnimatedStyle(() => ({ opacity: sheet && !reduced ? Math.min(t.value, interpolate(y.value, [0, h.value], [1, 0], Extrapolation.CLAMP)) : t.value }));
  const card = useAnimatedStyle(() =>
    sheet && !reduced
      ? { opacity: 1, transform: [{ translateY: y.value }] }
      : { opacity: t.value, transform: [{ translateY: (1 - t.value) * 10 }, { scale: 0.97 + 0.03 * t.value }] },
  );
  const onLayout = (e: LayoutChangeEvent) => {
    const next = Math.round(e.nativeEvent.layout.height);
    if (next > 0 && next !== height) {
      setHeight(next);
      h.value = next;
    }
  };

  const maxW = wide ? Math.min(L.width - 2 * L.panel.gutter, 768) : L.panel.maxWidth;

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={close} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: sheet ? "flex-end" : "center", alignItems: "center", padding: sheet ? 0 : L.panel.gutter }}>
        <Animated.View style={[{ position: "absolute", inset: 0, backgroundColor: alpha.scrim() }, scrim]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} style={{ flex: 1 }} />
        </Animated.View>

        <Animated.View
          accessibilityViewIsModal
          onLayout={onLayout}
          style={[
            { width: "100%", maxWidth: maxW, maxHeight: L.panel.maxHeight + (sheet ? R_SHEET : 0) },
            // a sheet sits flush on the bottom edge: its lower corners are tucked under the screen
            sheet && { marginBottom: -R_SHEET },
            card,
          ]}
        >
          <Plate tone="glass" radius={sheet ? R_SHEET : radius.xl} contentStyle={{ maxHeight: L.panel.maxHeight + (sheet ? R_SHEET : 0), flexDirection: "column" }}>
            <GestureDetector gesture={pan}>
            <View>
            {/* the speaker's light, low behind the header, so the sheet is visibly the stall you opened */}
            <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: 0, height: 140, overflow: "hidden", borderTopLeftRadius: sheet ? R_SHEET : radius.xl, borderTopRightRadius: sheet ? R_SHEET : radius.xl }}>
              <Glow color={color} x={0.15} y={0.1} r={0.7} strength={0.35} />
            </View>
            {sheet ? <View style={{ alignSelf: "center", width: 36, height: 5, borderRadius: 3, backgroundColor: alpha.hairline(), marginTop: 10 }} /> : null}

            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: alpha.hairline() }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <Display size="lg" style={{ letterSpacing: -0.4 }}>
                    {sign}
                  </Display>
                  <View style={{ backgroundColor: color, borderRadius: radius.full, paddingHorizontal: 9, paddingVertical: 3 }}>
                    <Spec style={{ color: "#FFFFFF" }}>{keeper}</Spec>
                  </View>
                </View>
                {blurb ? (
                  <Body size="sm" tone="muted" style={{ marginTop: 4 }}>
                    {blurb}
                  </Body>
                ) : null}
              </View>
              <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8} style={({ pressed }) => ({ width: 36, height: 36, borderRadius: 18, backgroundColor: pressed ? alpha.raisedFill() : alpha.wellFill(), borderWidth: 1, borderColor: alpha.hairline(), alignItems: "center", justifyContent: "center" })}>
                <Body medium>×</Body>
              </Pressable>
            </View>
            </View>
            </GestureDetector>

            <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16 }} keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>

            {footer ? (
              <View style={{ borderTopWidth: 1, borderTopColor: alpha.hairline(), paddingHorizontal: 20, paddingVertical: 10 }}>
                <Spec tone="muted">{footer}</Spec>
              </View>
            ) : null}
            {sheet ? <View style={{ height: L.insets.bottom + R_SHEET }} /> : null}
          </Plate>
        </Animated.View>
      </View>
    </Modal>
  );
}

/** A hook that owns the open/closed state for one Dialogue. */
export function useDialogue(initial = false) {
  const [open, setOpen] = useStateCompat(initial);
  const show = useCallback(() => setOpen(true), [setOpen]);
  const hide = useCallback(() => setOpen(false), [setOpen]);
  return { open, show, hide, setOpen };
}

// tiny local alias so this file stays free of a React import cycle
import { useState as useStateCompat } from "react";
