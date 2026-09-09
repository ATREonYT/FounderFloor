/**
 * The text field: a well (laminate fill, no hairline at rest), 46 high,
 * soft corners. Focus is WAYFINDING — "you are here" — so it speaks
 * fountain as a solid 2px outline, never a halo. On a dark ground:
 * paper/10 fill, paper text, paper/25 hairline.
 */
import { useState } from "react";
import { TextInput, View, type TextInputProps } from "react-native";
import { Spec } from "./Text";
import { fontFamily, radius, shell, type as T } from "./tokens";
import { alpha } from "./theme";

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
        placeholderTextColor={onDark ? "rgba(237,240,244,0.6)" : alpha.placeholder()}
        style={[
          {
            minHeight: 46,
            borderRadius: radius.lg,
            borderWidth: 2,
            borderColor: focused ? shell.fountain : onDark ? "rgba(237,240,244,0.18)" : "transparent",
            backgroundColor: onDark ? "rgba(237,240,244,0.10)" : shell.well,
            paddingHorizontal: 12,
            paddingVertical: 8,
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
