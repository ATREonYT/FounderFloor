/**
 * A suggestion chip — the "try asking…" cards every assistant app puts under
 * its greeting. Ours is a paper sign with the bevel, so the first thing a
 * new visitor taps is already a FounderFloor plate, not a generic pill.
 * NEW: not on the site.
 */
import { Pressable } from "react-native";
import { Plate } from "./Plate";
import { Body, Spec } from "./Text";
import { radius, shell } from "./tokens";

export function Chip({ children, hint, onPress, grow = true }: { children: string; hint?: string; onPress?: () => void; grow?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [{ opacity: pressed ? 0.72 : 1 }, grow ? { flexGrow: 1, flexBasis: 156 } : null]}
    >
      <Plate tone="paperSign" radius={radius.xl} padding={12} style={{ flex: 1 }} lineColor={shell.line}>
        <Body size="sm">{children}</Body>
        {hint ? (
          <Spec tone="faint" style={{ marginTop: 4 }}>
            {hint}
          </Spec>
        ) : null}
      </Plate>
    </Pressable>
  );
}
