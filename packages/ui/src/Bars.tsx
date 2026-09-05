/**
 * A pixel bar chart — the Investor's score history. Bars are whole 4px
 * units wide on the unit grid, heights in whole units, no smoothing, no
 * axis lines: the site's meter is a stepped fill and this is that, stood
 * on end, once per score. The latest bar is ink; the rest are the rank's
 * colour at the site's muted alpha. NEW: not on the site.
 */
import { View } from "react-native";
import { Spec } from "./Text";
import { shell, u } from "./tokens";

export function Bars({ values, max = 10, height = 48, color = shell.ink, labels }: { values: number[]; max?: number; height?: number; color?: string; labels?: [string, string] }) {
  const rows = Math.floor(height / u);
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: u, height: rows * u }} accessibilityRole="image" accessibilityLabel={`Scores: ${values.join(", ")}`}>
        {values.length === 0 ? <View style={{ flex: 1, height: u, backgroundColor: shell.line }} /> : null}
        {values.map((v, i) => {
          const h = Math.max(1, Math.round((Math.min(max, Math.max(0, v)) / max) * rows)) * u;
          const last = i === values.length - 1;
          return <View key={i} style={{ width: 3 * u, height: h, backgroundColor: last ? shell.ink : color, opacity: last ? 1 : 0.55 }} />;
        })}
      </View>
      {labels ? (
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Spec tone="faint">{labels[0]}</Spec>
          <Spec tone="faint">{labels[1]}</Spec>
        </View>
      ) : null}
    </View>
  );
}
