/**
 * The composer — the one control every assistant app is built around: a
 * soft glass bar at the bottom with a text field that grows, an attach
 * button on the left, a send button on the right that only comes alive
 * once there is something to send. Ours is a glass plate with the bevel,
 * takes fountain when focused (wayfinding, as every input on the site), and
 * carries a one-line status underneath in the venue's voice — where other
 * apps put a model name. Enter sends on a keyboard; Shift+Enter breaks a
 * line; on a phone the arrow does it. NEW: not on the site.
 */
import { useEffect, useState } from "react";
import { Platform, Pressable, TextInput, View, type NativeSyntheticEvent, type TextInputKeyPressEventData } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Plate } from "./Plate";
import { Body, Spec } from "./Text";
import { ease, fontFamily, ms, radius, shell, type as T } from "./tokens";

export function Composer({
  value,
  onChange,
  onSend,
  onAttach,
  placeholder = "Ask the desk…",
  busy = false,
  status,
  autoFocus = false,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onAttach?: () => void;
  placeholder?: string;
  /** A reply is still arriving; the arrow waits. */
  busy?: boolean;
  /** The line under the field: "The desk is open · Main Hall". */
  status?: string;
  autoFocus?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [lines, setLines] = useState(1);
  useEffect(() => {
    if (value === "") setLines(1);
  }, [value]);
  const canSend = value.trim().length > 0 && !busy;
  const s = useSharedValue(0);
  useEffect(() => {
    s.value = withTiming(canSend ? 1 : 0, { duration: ms.release, easing: Easing.bezier(...ease.release) });
  }, [canSend, s]);
  const arrow = useAnimatedStyle(() => ({ transform: [{ scale: 0.86 + 0.14 * s.value }] }));

  const onKey = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (Platform.OS !== "web") return;
    const k = e.nativeEvent as unknown as { key: string; shiftKey?: boolean };
    if (k.key === "Enter" && !k.shiftKey) {
      (e as unknown as { preventDefault?: () => void }).preventDefault?.();
      if (canSend) onSend();
    }
  };

  return (
    <Plate tone="glass" radius={radius.xxl} lineColor={focused ? shell.fountain : undefined}>
      <View style={{ paddingHorizontal: 8, paddingTop: 8, paddingBottom: status ? 6 : 8, gap: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
          {onAttach ? (
            <Pressable
              onPress={onAttach}
              accessibilityRole="button"
              accessibilityLabel="Attach"
              style={({ pressed }) => ({ width: 36, height: 36, borderRadius: radius.full, backgroundColor: shell.well, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.7 : 1 })}
            >
              <Body medium tone="muted" style={{ lineHeight: 20 }}>
                +
              </Body>
            </Pressable>
          ) : null}
          <TextInput
            value={value}
            onChangeText={onChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyPress={onKey}
            // the field's own vertical padding (12) is subtracted so a box that
            // exactly fits its text reads back as the same line count, not one more
            onContentSizeChange={(e) => setLines(Math.min(6, Math.max(1, Math.round((e.nativeEvent.contentSize.height - 12) / T.base.line))))}
            multiline
            autoFocus={autoFocus}
            placeholder={placeholder}
            placeholderTextColor="rgba(77,83,90,0.6)"
            accessibilityLabel="Message"
            style={{
              flex: 1,
              minHeight: 36,
              height: Math.max(36, lines * T.base.line + 12),
              paddingVertical: 6,
              paddingHorizontal: 6,
              fontFamily: fontFamily.body,
              fontSize: T.base.size,
              lineHeight: T.base.line,
              color: shell.ink,
              // web: the browser's own focus ring is replaced by the plate's fountain hairline
              ...(Platform.OS === "web" ? ({ outlineWidth: 0 } as object) : null),
            }}
          />
          <Pressable
            onPress={onSend}
            disabled={!canSend}
            accessibilityRole="button"
            accessibilityLabel="Send"
            accessibilityState={{ disabled: !canSend }}
          >
            <Animated.View style={[{ width: 36, height: 36, borderRadius: radius.full, backgroundColor: canSend ? shell.accent : shell.well, alignItems: "center", justifyContent: "center" }, arrow]}>
              <Body medium tone={canSend ? "paper" : "faint"} style={{ lineHeight: 20 }}>
                ↑
              </Body>
            </Animated.View>
          </Pressable>
        </View>
        {status ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 8 }}>
            <View style={{ width: 6, height: 6, borderRadius: radius.full, backgroundColor: busy ? shell.accent : shell.verify }} />
            <Spec tone="faint">{status}</Spec>
          </View>
        ) : null}
      </View>
    </Plate>
  );
}
