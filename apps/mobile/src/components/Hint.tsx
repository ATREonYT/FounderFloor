/**
 * A first-visit hint: one line from the keeper about what this screen is
 * for, shown once per screen until "Got it". The tutorial in the flow of
 * use, instead of a tour nobody remembers.
 */
import { View } from "react-native";
import { Body, Button, Keeper, Plate, radius } from "@founderfloor/ui";
import { useFounder } from "../lib/store";
import { useTour } from "../lib/tour";
import { RECEPTIONIST } from "../lib/mock";

export function Hint({ id, text, color }: { id: string; text: string; color?: string }) {
  const seen = useFounder((s) => s.hints.includes(id));
  const dismiss = useFounder((s) => s.dismissHint);
  const touring = useTour((s) => s.active);
  if (seen || touring) return null;
  return (
    <Plate tone="panel" radius={radius.xl} padding={12} ring={color ?? RECEPTIONIST.color}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Keeper look={RECEPTIONIST.look} scale={1} color={RECEPTIONIST.color} />
        <Body size="sm" style={{ flex: 1 }}>
          {text}
        </Body>
        <Button size="sm" variant="ghost" onPress={() => dismiss(id)}>
          Got it
        </Button>
      </View>
    </Plate>
  );
}
