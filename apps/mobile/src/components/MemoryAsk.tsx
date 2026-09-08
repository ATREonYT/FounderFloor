/**
 * The notebook question, asked once, in the desk's own sheet: what would be
 * written down, where it goes, and how to burn it. Yes or no; either
 * answer is remembered and either can be changed in Settings. The store
 * refuses to write anything for a founder who said no, so the screens do
 * not have to check.
 */
import { View } from "react-native";
import { MEMORY_NOTICE } from "@founderfloor/shared";
import { Body, Button, ButtonRow, Dialogue, GlyphTile, haptic } from "@founderfloor/ui";
import { useFounder } from "../lib/store";

export const NOTEBOOK_COLOR = "#6B4E71";

export function MemoryAsk({ open, onClose }: { open: boolean; onClose: () => void }) {
  const setMemoryOn = useFounder((s) => s.setMemoryOn);
  const answer = (on: boolean) => {
    setMemoryOn(on);
    void haptic(on ? "success" : "light");
    onClose();
  };
  return (
    <Dialogue open={open} onClose={onClose} sign="THE DESK'S NOTEBOOK" keeper="The desk" color={NOTEBOOK_COLOR} footer="You can change this in Settings any time">
      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <GlyphTile id="flask" color={NOTEBOOK_COLOR} size={36} scale={1} />
          <Body medium style={{ flex: 1 }}>
            {MEMORY_NOTICE.title}
          </Body>
        </View>
        {MEMORY_NOTICE.lines.map((l) => (
          <Body key={l} size="sm" tone="muted">
            {l}
          </Body>
        ))}
        <ButtonRow>
          <Button onPress={() => answer(true)}>{MEMORY_NOTICE.yes}</Button>
          <Button variant="ghost" onPress={() => answer(false)}>
            {MEMORY_NOTICE.no}
          </Button>
        </ButtonRow>
      </View>
    </Dialogue>
  );
}
