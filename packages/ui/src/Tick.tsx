/**
 * A checklist row — the site's quest list (QuestLog): a 16px square with a
 * 1px ink hairline, filled ink with a paper check when done, the text
 * beside it, the proof underneath in Spec. Whole row is the tap target.
 * With onOpen, the box toggles and the rest of the row opens the line's
 * room, and the row says how many lines have been written there.
 */
import { Pressable, View } from "react-native";
import { Body, Spec } from "./Text";
import { radius, shell } from "./tokens";

export function Tick({ done, text, proof, onToggle, onOpen, written = 0 }: { done: boolean; text: string; proof?: string; onToggle: () => void; /** Opens the line's room; the box still toggles. */ onOpen?: () => void; /** Lines the founder wrote in the room, shown on the row. */ written?: number }) {
  const box = (
    <View style={{ width: onOpen ? 22 : 16, height: onOpen ? 22 : 16, marginTop: onOpen ? 1 : 4, borderRadius: radius.sm, borderWidth: 1, borderColor: shell.ink, backgroundColor: done ? shell.ink : "transparent", alignItems: "center", justifyContent: "center" }}>
      {done ? <Spec tone="paper" style={{ fontSize: 10, lineHeight: 12 }}>✓</Spec> : null}
    </View>
  );
  return (
    <Pressable
      onPress={onOpen ?? onToggle}
      accessibilityRole={onOpen ? "button" : "checkbox"}
      accessibilityState={onOpen ? undefined : { checked: done }}
      accessibilityLabel={onOpen ? `${text}. Open it to write what you did` : text}
      style={({ pressed }) => ({ flexDirection: "row", gap: 12, paddingVertical: 10, alignItems: "flex-start", opacity: pressed ? 0.7 : 1 })}
    >
      {onOpen ? (
        <Pressable onPress={onToggle} hitSlop={10} accessibilityRole="checkbox" accessibilityState={{ checked: done }} accessibilityLabel={done ? "Mark not done" : "Mark done"}>
          {box}
        </Pressable>
      ) : (
        box
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Body tone={done ? "muted" : "ink"} style={done ? { textDecorationLine: "line-through" } : undefined}>
          {text}
        </Body>
        {proof ? <Spec tone="faint">{proof}</Spec> : null}
        {onOpen ? <Spec tone={written ? "ink" : "accent"} style={{ marginTop: 2 }}>{written ? `${written} ${written === 1 ? "line" : "lines"} written →` : "How, and write what you did →"}</Spec> : null}
      </View>
      {onOpen ? <Body tone="accent">›</Body> : null}
    </Pressable>
  );
}
