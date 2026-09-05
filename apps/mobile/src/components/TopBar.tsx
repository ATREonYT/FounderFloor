import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Keeper, Spec, Sprite, radius, shell, useLayout } from "@founderfloor/ui";
import { useInbox, useSession } from "../lib/store";
import { useStand } from "../lib/stand";

/**
 * Three slots over the safe area: you on the left, where you are in the
 * middle, and the mailbox on the right — the Inbox is the mailbox at your
 * booth, so it hangs off every screen instead of taking a menu entry.
 */
export function TopBar({ left, center, right }: { left?: ReactNode; center?: ReactNode; right?: ReactNode }) {
  const L = useLayout();
  const slot = L.compact ? 76 : 96;
  return (
    <View style={{ paddingTop: L.insets.top + 8, paddingHorizontal: L.shell.paddingHorizontal, paddingBottom: 8, flexDirection: "row", alignItems: "center", minHeight: L.insets.top + 56, gap: 8 }}>
      <View style={{ width: slot, alignItems: "flex-start" }}>{left === undefined ? <You /> : left}</View>
      <View style={{ flex: 1, alignItems: "center" }}>{center}</View>
      <View style={{ width: slot, alignItems: "flex-end" }}>{right === undefined ? <Mailbox /> : right}</View>
    </View>
  );
}

/** Your avatar when signed in; the door when not. */
export function You() {
  const router = useRouter();
  const auth = useSession((s) => s.auth);
  const stand = useStand();
  if (!auth) {
    return (
      <Pressable onPress={() => router.push("/sign-in")} accessibilityRole="button" accessibilityLabel="Sign in" style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, borderWidth: 1, borderColor: shell.line, borderRadius: radius.md, paddingHorizontal: 8, height: 36, justifyContent: "center" })}>
        <Spec tone="ink">Sign in</Spec>
      </Pressable>
    );
  }
  return (
    <Pressable onPress={() => router.navigate("/stand")} accessibilityRole="button" accessibilityLabel={`${auth.name}, your stand`} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      <Keeper look={stand.look} scale={1} />
    </Pressable>
  );
}

export function Mailbox() {
  const router = useRouter();
  const unread = useInbox((s) => s.items.filter((x) => x.unread).length);
  return (
    <Pressable onPress={() => router.push("/inbox")} accessibilityRole="button" accessibilityLabel={unread ? `Inbox, ${unread} unread` : "Inbox"} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, width: 36, height: 36, borderRadius: radius.md, borderWidth: 1, borderColor: shell.line, alignItems: "center", justifyContent: "center" })}>
      <Sprite id="glyph-chip-ink" scale={2} />
      {unread ? (
        <View style={{ position: "absolute", top: -5, right: -5, minWidth: 16, height: 16, borderRadius: radius.full, backgroundColor: shell.accent, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 }}>
          <Spec tone="paper" style={{ fontSize: 10, lineHeight: 12 }}>
            {unread}
          </Spec>
        </View>
      ) : null}
    </Pressable>
  );
}
