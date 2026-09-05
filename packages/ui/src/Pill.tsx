/**
 * The picker pill — where an assistant app shows its model name at the top,
 * we show WHERE YOU ARE: the hall, and how many people are in it, with the
 * site's live dot (exitsign green — online, and only online). Tapping it
 * opens the Porter's list of halls. NEW: not on the site; the site has the
 * HUD floor name instead.
 */
import { Pressable, View } from "react-native";
import { Plate } from "./Plate";
import { Body, Spec } from "./Text";
import { radius, shell } from "./tokens";

export function Pill({ label, meta, live = false, onPress, tone = "panel" }: { label: string; meta?: string; live?: boolean; onPress?: () => void; tone?: "panel" | "glass" }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label}${meta ? `, ${meta}` : ""}`} style={({ pressed }) => ({ opacity: pressed ? 0.72 : 1, alignSelf: "center" })}>
      <Plate tone={tone} radius={radius.xl}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingLeft: 12, paddingRight: 10, height: 36 }}>
          {live ? <View style={{ width: 8, height: 8, borderRadius: radius.full, backgroundColor: shell.verify }} /> : null}
          <Body size="sm" medium>
            {label}
          </Body>
          {meta ? <Spec tone="muted">{meta}</Spec> : null}
          {onPress ? <Spec tone="faint">▾</Spec> : null}
        </View>
      </Plate>
    </Pressable>
  );
}
