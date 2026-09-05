/**
 * Choice chips for a small closed set (entity, residence, segment) — the
 * site's category filter chips: hairline pills, ink when selected. Not a
 * native picker, ever.
 */
import { Pressable, View } from "react-native";
import { Spec } from "./Text";
import { radius, shell } from "./tokens";

export function Choices<T extends string>({ label, value, options, onChange }: { label?: string; value: T; options: { v: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <View style={{ gap: 6 }}>
      {label ? <Spec tone="muted">{label}</Spec> : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {options.map((o) => {
          const on = o.v === value;
          return (
            <Pressable key={o.v} onPress={() => onChange(o.v)} accessibilityRole="radio" accessibilityState={{ selected: on }} style={{ borderWidth: 1, borderColor: on ? shell.ink : shell.line, backgroundColor: on ? shell.ink : "transparent", borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 5 }}>
              <Spec tone={on ? "paper" : "ink"}>{o.label}</Spec>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
