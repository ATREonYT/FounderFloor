/**
 * A checklist row — the site's quest list (QuestLog): a 16px square with a
 * 1px ink hairline, filled ink with a paper check when done, the text
 * beside it, the proof underneath in Spec. Whole row is the tap target.
 */
import { Pressable, View } from "react-native";
import { Body, Spec } from "./Text";
import { radius, shell } from "./tokens";

export function Tick({ done, text, proof, onToggle }: { done: boolean; text: string; proof?: string; onToggle: () => void }) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      accessibilityLabel={text}
      style={({ pressed }) => ({ flexDirection: "row", gap: 12, paddingVertical: 10, alignItems: "flex-start", opacity: pressed ? 0.7 : 1 })}
    >
      <View style={{ width: 16, height: 16, marginTop: 4, borderRadius: radius.sm, borderWidth: 1, borderColor: shell.ink, backgroundColor: done ? shell.ink : "transparent", alignItems: "center", justifyContent: "center" }}>
        {done ? <Spec tone="paper" style={{ fontSize: 10, lineHeight: 12 }}>✓</Spec> : null}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Body tone={done ? "muted" : "ink"} style={done ? { textDecorationLine: "line-through" } : undefined}>
          {text}
        </Body>
        {proof ? <Spec tone="faint">{proof}</Spec> : null}
      </View>
    </Pressable>
  );
}
