/**
 * A first-visit hint: one quiet line from the keeper about what this
 * screen is for, shown until "OK". Plain text on the page's own ground,
 * never a card with a ring around it: a hint should be the smallest
 * thing on the screen, not the loudest.
 */
import { Pressable, View } from "react-native";
import { Body, Keeper, Spec, alpha, radius } from "@founderfloor/ui";
import { useFounder } from "../lib/store";
import { useTour } from "../lib/tour";
import { RECEPTIONIST } from "../lib/mock";

export function Hint({ id, text }: { id: string; text: string; /** Kept for the screens that pass it. */ color?: string }) {
  const seen = useFounder((s) => s.hints.includes(id));
  const dismiss = useFounder((s) => s.dismissHint);
  const touring = useTour((s) => s.active);
  if (seen || touring) return null;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: alpha.wellFill(), borderRadius: radius.md, paddingLeft: 10, paddingRight: 4, paddingVertical: 6 }}>
      <Keeper look={RECEPTIONIST.look} scale={1} color={RECEPTIONIST.color} framed={false} />
      <Body size="sm" tone="muted" style={{ flex: 1 }}>
        {text}
      </Body>
      <Pressable onPress={() => dismiss(id)} accessibilityRole="button" accessibilityLabel="OK, hide this hint" hitSlop={8} style={({ pressed }) => ({ paddingHorizontal: 10, paddingVertical: 8, opacity: pressed ? 0.6 : 1 })}>
        <Spec tone="accent">OK</Spec>
      </Pressable>
    </View>
  );
}
