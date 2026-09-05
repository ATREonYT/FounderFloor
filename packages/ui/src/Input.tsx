/**
 * The text field. `min-h-[44px] rounded-md border border-line bg-paper px-3
 * py-2 text-sm placeholder:text-muted/60`. Focus is WAYFINDING — "you are
 * here" — so it speaks fountain as a solid 2px outline, never a halo. On a
 * dark ground: paper/25 hairline, paper/10 fill, paper text.
 */
import { useState } from "react";
import { TextInput, View, type TextInputProps } from "react-native";
import { Spec } from "./Text";
import { fontFamily, radius, shell, type as T } from "./tokens";

export function Input({
  label,
  onDark = false,
  mono = false,
  style,
  ...rest
}: TextInputProps & { label?: string; onDark?: boolean; mono?: boolean }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      {label ? <Spec tone={onDark ? "paperQuiet" : "muted"}>{label}</Spec> : null}
      <TextInput
        {...rest}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        placeholderTextColor={onDark ? "rgba(237,240,244,0.6)" : "rgba(77,83,90,0.6)"}
        style={[
          {
            minHeight: 44,
            borderRadius: radius.md,
            borderWidth: focused ? 2 : 1,
            borderColor: focused ? shell.fountain : onDark ? "rgba(237,240,244,0.25)" : shell.line,
            backgroundColor: onDark ? "rgba(237,240,244,0.10)" : shell.paper,
            paddingHorizontal: focused ? 11 : 12,
            paddingVertical: focused ? 7 : 8,
            fontFamily: mono ? fontFamily.mono : fontFamily.body,
            fontSize: T.sm.size,
            lineHeight: T.sm.line,
            color: onDark ? shell.paper : shell.ink,
          },
          style,
        ]}
      />
    </View>
  );
}
