/**
 * THE CALENDAR — the last weeks as a grid of days, one square each: accent
 * where the founder opened the building, well where not, today outlined.
 * It is the Streak's long view, and it makes the same promise: no zero, no
 * flame, no guilt. A month of squares shows a habit forming without
 * anybody having to be told off.
 * NEW: not on the site.
 */
import { View } from "react-native";
import { Spec } from "./Text";
import { shell } from "./tokens";

const SQ = 16;
const GAP = 4;

export function Calendar({ active, weeks = 5, label }: { /** ISO dates (YYYY-MM-DD) the building was opened. */ active: string[]; weeks?: number; label?: string }) {
  const set = new Set(active);
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  // the grid ends on today's column; each column is a week, Monday at the top
  const dow = (today.getDay() + 6) % 7;
  const start = new Date(today.getTime() - (weeks * 7 - 1 - (6 - dow)) * 86_400_000);
  const cols: { iso: string; future: boolean }[][] = [];
  for (let c = 0; c < weeks; c++) {
    const col: { iso: string; future: boolean }[] = [];
    for (let r = 0; r < 7; r++) {
      const d = new Date(start.getTime() + (c * 7 + r) * 86_400_000);
      const iso = d.toISOString().slice(0, 10);
      col.push({ iso, future: iso > todayIso });
    }
    cols.push(col);
  }
  const count = active.filter((d) => d >= cols[0][0].iso && d <= todayIso).length;
  const text = label ?? `${count} of the last ${weeks * 7} days`;
  return (
    <View style={{ gap: 8 }} accessible accessibilityRole="text" accessibilityLabel={text}>
      <View style={{ flexDirection: "row", gap: GAP }}>
        {cols.map((col, c) => (
          <View key={c} style={{ gap: GAP }}>
            {col.map((d) => {
              const on = set.has(d.iso);
              const isToday = d.iso === todayIso;
              return <View key={d.iso} style={{ width: SQ, height: SQ, borderRadius: 4, backgroundColor: d.future ? "transparent" : on ? shell.accent : shell.well, borderWidth: isToday ? 2 : 0, borderColor: shell.ink, opacity: d.future ? 0.25 : 1 }} />;
            })}
          </View>
        ))}
      </View>
      <Spec tone="muted">{text}</Spec>
    </View>
  );
}
