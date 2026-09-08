/**
 * THE DIALOGUE — the shell every stall, coach and panel opens inside.
 *
 * It is components/StallPanel.tsx, reproduced: an awning stripe (8px, 14
 * alternating cells of the speaker's colour and paper), a header with the
 * sign in Archivo, a one-line blurb, the keeper's chip on the awning colour
 * and a Close button, a scrolling body, and the footer line "Esc or tap
 * outside to go back — you keep your spot". The scrim is ink at 45% so the
 * hall is clearly still there behind it.
 *
 * Geometry comes from useLayout: a bottom sheet at ≤ 85% of the height on a
 * phone (a strip of hall stays visible above), a centred card ≤ 512 wide and
 * ≤ 70% tall otherwise. Opens over 200ms with opacity + a 10px rise + scale
 * .97 → 1 on --ease-out; closes over 190ms in reverse; the scrim, the Close
 * button and the hardware back button all dismiss. This is the ONE overlay
 * on the app — there is no second modal system.
 */
import { useCallback, useEffect, type ReactNode } from "react";
import { BackHandler, Modal, Pressable, ScrollView, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming, runOnJS } from "react-native-reanimated";
import { useLayout } from "./Responsive";
import { Plate } from "./Plate";
import { Body, Display, Spec } from "./Text";
import { ease, ms, radius, shell } from "./tokens";
import { alpha } from "./theme";

/** The sheet's corner radius; the lower corners hang below the screen edge by the same amount. */
const R_SHEET = 24;

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
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withTiming(open ? 1 : 0, { duration: open ? ms.panelIn : ms.panelOut, easing: Easing.bezier(...ease.out) });
  }, [open, t]);

  useEffect(() => {
    if (!open) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [open, onClose]);

  const scrim = useAnimatedStyle(() => ({ opacity: t.value }));
  const card = useAnimatedStyle(() => ({
    opacity: t.value,
    transform: [{ translateY: (1 - t.value) * 10 }, { scale: 0.97 + 0.03 * t.value }],
  }));

  const sheet = L.panel.anchor === "bottom";
  const maxW = wide ? Math.min(L.width - 2 * L.panel.gutter, 768) : L.panel.maxWidth;

  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: sheet ? "flex-end" : "center", alignItems: "center", padding: sheet ? 0 : L.panel.gutter }}>
        <Animated.View style={[{ position: "absolute", inset: 0, backgroundColor: alpha.scrim() }, scrim]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={{ flex: 1 }} />
        </Animated.View>

        <Animated.View
          accessibilityViewIsModal
          style={[
            { width: "100%", maxWidth: maxW, maxHeight: L.panel.maxHeight + (sheet ? R_SHEET : 0) },
            // a sheet sits flush on the bottom edge: its lower corners are tucked under the screen
            sheet && { marginBottom: -R_SHEET },
            card,
          ]}
        >
          <Plate tone="panel" radius={sheet ? R_SHEET : radius.xl} contentStyle={{ maxHeight: L.panel.maxHeight + (sheet ? R_SHEET : 0), flexDirection: "column" }}>
            {/* the awning stripe, so the panel is visibly the stall you opened */}
            <View style={{ flexDirection: "row", height: 8, borderTopLeftRadius: sheet ? R_SHEET : radius.xl, borderTopRightRadius: sheet ? R_SHEET : radius.xl, overflow: "hidden" }}>
              {Array.from({ length: 14 }).map((_, i) => (
                <View key={i} style={{ flex: 1, backgroundColor: i % 2 ? shell.paper : color }} />
              ))}
            </View>
            {sheet ? <View style={{ alignSelf: "center", width: 36, height: 4, borderRadius: 2, backgroundColor: shell.line, marginTop: 8 }} /> : null}

            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: shell.line }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <Display size="lg" style={{ letterSpacing: -0.4 }}>
                    {sign}
                  </Display>
                  <View style={{ backgroundColor: color, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Spec tone="paper">{keeper}</Spec>
                  </View>
                </View>
                {blurb ? (
                  <Body size="sm" tone="muted" style={{ marginTop: 4 }}>
                    {blurb}
                  </Body>
                ) : null}
              </View>
              <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8} style={({ pressed }) => ({ width: 36, height: 36, borderRadius: 18, backgroundColor: pressed ? shell.line : shell.well, alignItems: "center", justifyContent: "center" })}>
                <Body medium>×</Body>
              </Pressable>
            </View>

            <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16 }} keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>

            {footer ? (
              <View style={{ borderTopWidth: 1, borderTopColor: shell.line, paddingHorizontal: 20, paddingVertical: 10 }}>
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
void runOnJS;
