/**
 * THE BOTTOM MENU — five entries, drawn as a glass bar of sign-style items.
 *
 * Not a native tab bar. It is the site's `.glass` HUD chrome (the chat
 * strip, the emote bar) turned into navigation: a bevelled glass plate
 * inset from the screen edge by the HUD gutter, each entry a booth glyph
 * over a mono label, the active one lettered in ink with a 2px fountain
 * rule (wayfinding: "you are here"). On a compact screen the labels stay —
 * five words are legible at 12px mono and the site never hides its labels.
 * On regular/wide it becomes a left rail; the same component, the same
 * entries, laid out down the side.
 */
import { Pressable, View } from "react-native";
import { Plate } from "./Plate";
import { Sprite, type SpriteId } from "./Sprite";
import { Spec } from "./Text";
import { useLayout } from "./Responsive";
import { radius, shell } from "./tokens";
import type { GlyphId } from "./Sign";

export type MenuEntry = { key: string; label: string; glyph: GlyphId; badge?: number };

export const MENU: MenuEntry[] = [
  { key: "reception", label: "Desk", glyph: "wave" },
  { key: "stand", label: "Stand", glyph: "star" },
  { key: "build", label: "Build", glyph: "cube" },
  { key: "coaches", label: "Coaches", glyph: "heart" },
  { key: "floor", label: "Floor", glyph: "flask" },
];

export function Menu({ active, onSelect, entries = MENU }: { active: string; onSelect: (key: string) => void; entries?: MenuEntry[] }) {
  const L = useLayout();
  const rail = !L.compact;
  return (
    <Plate tone="glass" radius={radius.lg} style={rail ? { width: 88 } : undefined}>
      <View style={{ flexDirection: rail ? "column" : "row", paddingHorizontal: rail ? 8 : 4, paddingVertical: rail ? 8 : 4, gap: rail ? 4 : 0 }}>
        {entries.map((e) => {
          const on = e.key === active;
          const glyph = `glyph-${e.glyph}-ink` as SpriteId;
          return (
            <Pressable
              key={e.key}
              onPress={() => onSelect(e.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={e.label}
              style={{ flex: rail ? undefined : 1, alignItems: "center", paddingVertical: 8, paddingHorizontal: 6, gap: 4, opacity: on ? 1 : 0.62, borderRadius: radius.md }}
            >
              <View style={{ position: "relative" }}>
                <Sprite id={glyph} scale={2} />
                {e.badge ? (
                  <View style={{ position: "absolute", top: -4, right: -8, minWidth: 14, height: 14, borderRadius: radius.full, backgroundColor: shell.accent, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 }}>
                    <Spec tone="paper" style={{ fontSize: 9, lineHeight: 12 }}>
                      {e.badge}
                    </Spec>
                  </View>
                ) : null}
              </View>
              <Spec tone={on ? "ink" : "muted"}>{e.label}</Spec>
              <View style={{ height: 2, width: 20, backgroundColor: on ? shell.fountain : "transparent", borderRadius: 1 }} />
            </Pressable>
          );
        })}
      </View>
    </Plate>
  );
}
