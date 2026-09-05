import type { ReactNode } from "react";
import { View } from "react-native";
import { useLayout } from "@founderfloor/ui";

/** Three slots over the safe area: something of yours, where you are, one action. */
export function TopBar({ left, center, right }: { left?: ReactNode; center?: ReactNode; right?: ReactNode }) {
  const L = useLayout();
  return (
    <View style={{ paddingTop: L.insets.top + 8, paddingHorizontal: L.shell.paddingHorizontal, paddingBottom: 8, flexDirection: "row", alignItems: "center", minHeight: L.insets.top + 56 }}>
      <View style={{ width: 88, alignItems: "flex-start" }}>{left}</View>
      <View style={{ flex: 1, alignItems: "center" }}>{center}</View>
      <View style={{ width: 88, alignItems: "flex-end" }}>{right}</View>
    </View>
  );
}
