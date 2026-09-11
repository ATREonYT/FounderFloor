/**
 * YOU — the last tab, the way every app keeps its profile: who you are at
 * the top, then a short list of doors, each one line. Your company (the
 * stand), the Office, your plan, the notebook, the drawer, the inbox, the
 * coaches, the floor, the plans, settings. Nothing here does work; it
 * only says where the work lives.
 */
import { Pressable, ScrollView, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { fmtMoney } from "@founderfloor/shared";
import { Body, Button, Display, GlyphTile, Keeper, Plate, RankBadge, Rise, Spec, TierTag, radius, shell, useLayout, type GlyphId } from "@founderfloor/ui";
import { TopBar } from "../../components/TopBar";
import { RoadStrip } from "../../components/Road";
import { COLUMN, useBottomChrome } from "../../lib/chrome";
import { useStand } from "../../lib/stand";
import { useFounder, useInbox, useSession } from "../../lib/store";
import { effectivePlan } from "../../lib/billing";

export default function You() {
  const L = useLayout();
  const router = useRouter();
  const bottom = useBottomChrome();
  const stand = useStand();
  const auth = useSession((s) => s.auth);
  const memory = useFounder((s) => s.memory);
  const docs = useFounder((s) => s.docs);
  const kpi = useFounder((s) => s.kpi);
  const plan = useFounder((s) => s.roadmap);
  const unread = useInbox((s) => s.items.filter((x) => x.unread).length);
  const tier = effectivePlan();
  const r = stand.record;
  const column = { width: "100%" as const, maxWidth: COLUMN, alignSelf: "center" as const, paddingHorizontal: L.shell.paddingHorizontal };
  type Row = { glyph: GlyphId; color: string; title: string; line: string; to: string; badge?: number };
  const rows: Row[] = [
    { glyph: "cube", color: "#A28457", title: "The Workshop", line: "See your app, and send the brief to build it (stops 5 and 6)", to: "/workshop" },
    { glyph: "coin", color: "#5E7C93", title: "The Office", line: kpi.length ? `${kpi.length} ${kpi.length === 1 ? "week" : "weeks"} logged, your numbers, what people said` : "Your numbers, what people said (stops 2 and 7)", to: "/office" },
    { glyph: "bolt", color: "#4F6E6B", title: "Your plan", line: plan ? plan.headline : "Eight questions, then four weeks of tasks (stops 3 and 4)", to: plan ? "/plan" : "/welcome" },
    { glyph: "flask", color: "#6B4E71", title: "The notebook", line: memory.length ? `${memory.length} lines the desk remembers about you` : "What the desk remembers about you", to: "/memory" },
    { glyph: "chip", color: "#3B5B92", title: "The drawer", line: docs.length ? `${docs.length} ${docs.length === 1 ? "draft" : "drafts"} the coaches wrote` : "Drafts the coaches write for you", to: "/drawer" },
    { glyph: "wave", color: "#B4762E", title: "Inbox", line: unread ? `${unread} unread` : "Notes left at your stand", to: "/inbox", badge: unread },
    { glyph: "heart", color: "#2F6F6A", title: "The coaches", line: "Four people to ask: plan, sales, pitch, money", to: "/coaches" },
    { glyph: "rocket", color: "#8C3B2E", title: "The floor", line: "Other founders, and what they are building", to: "/floor" },
    { glyph: "star", color: "#A28457", title: tier === "free" ? "Plans and Pro" : "Your plan with us", line: tier === "free" ? "Free does a lot. Pro remembers." : `${tier[0].toUpperCase()}${tier.slice(1)}, manage`, to: "/plans" },
    { glyph: "leaf", color: "#4E6E4E", title: "How it works", line: "The road, the rooms, the desk: the whole guide", to: "/guide" },
    { glyph: "leaf", color: "#4E6E4E", title: "Settings", line: "Reminders, email, the notebook switch", to: "/settings" },
  ];
  return (
    <View style={{ flex: 1 }}>
      <TopBar left={<View />} center={<Spec tone="muted">You</Spec>} />
      <ScrollView contentContainerStyle={[column, { paddingBottom: bottom, gap: 16 }]}>
        {/* who you are */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <Pressable onPress={() => router.push("/stand" as Href)} accessibilityRole="button" accessibilityLabel="Your stand and your look" style={({ pressed }) => ({ width: 72, height: 72, borderRadius: 36, backgroundColor: shell.well, alignItems: "center", justifyContent: "center", transform: [{ scale: pressed ? 0.96 : 1 }] })}>
            <Keeper look={stand.look} scale={2} framed={false} />
          </Pressable>
          <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
            <Display size="xl">{auth ? auth.name || stand.founder || "You" : stand.founder || "You"}</Display>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <TierTag tier={tier} />
              <Spec tone="muted">{stand.streak ? `${stand.streak}-day streak` : "day one"}</Spec>
            </View>
          </View>
          {!auth ? (
            <Button size="sm" onPress={() => router.push("/sign-in" as Href)}>
              Sign in
            </Button>
          ) : null}
        </View>

        {/* the road, in one strip */}
        <Rise k={0}>
          <RoadStrip />
        </Rise>

        {/* your company */}
        <Rise k={1}>
        <Pressable onPress={() => router.push("/stand" as Href)} accessibilityRole="button" accessibilityLabel="Your company" style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
          <Plate tone="panel" radius={radius.xl} padding={16}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Spec tone="muted" style={{ flex: 1 }}>Your company</Spec>
              <RankBadge monthlyRevenue={r.mrr} />
            </View>
            <Display size="lg" style={{ marginTop: 8 }}>{stand.name || "No name on the sign yet"}</Display>
            <Body size="sm" tone="muted" numberOfLines={2} style={{ marginTop: 4 }}>
              {r.oneLiner || "Write the sign: who pays, and what they get. The desk helps."}
            </Body>
            <View style={{ flexDirection: "row", gap: 16, marginTop: 12 }}>
              {[
                ["This month", r.mrr ? fmtMoney(r.mrr, r.currency) : "—"],
                ["Cash", r.cash ? fmtMoney(r.cash, r.currency) : "—"],
                ["Customers", String(kpi.at(-1)?.customers ?? "—")],
              ].map(([k, v]) => (
                <View key={k}>
                  <Body medium>{v}</Body>
                  <Spec tone="faint">{k}</Spec>
                </View>
              ))}
              <Body tone="accent" style={{ marginLeft: "auto", alignSelf: "center" }}>›</Body>
            </View>
          </Plate>
        </Pressable>
        </Rise>

        {/* the doors, in three short groups so nobody has to read eleven lines at once */}
        {([
          ["Your work", rows.slice(0, 5)],
          ["People", rows.slice(5, 8)],
          ["Account", rows.slice(8)],
        ] as [string, Row[]][]).map(([name, group], g) => (
          <Rise key={name} k={g + 2} style={{ gap: 8 }}>
            <Spec tone="faint" style={{ paddingLeft: 4 }}>{name}</Spec>
            <Plate tone="panel" radius={radius.xl} padding={6}>
              {group.map((row, i) => (
                <Pressable key={row.to} onPress={() => router.push(row.to as Href)} accessibilityRole="button" accessibilityLabel={row.title} style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11, paddingHorizontal: 10, borderTopWidth: i ? 1 : 0, borderTopColor: shell.line, opacity: pressed ? 0.8 : 1 })}>
                  <GlyphTile id={row.glyph} color={row.color} size={32} scale={1} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Body size="sm" medium>
                      {row.title}
                    </Body>
                    <Spec tone="faint" numberOfLines={1}>{row.line}</Spec>
                  </View>
                  {row.badge ? (
                    <View style={{ minWidth: 20, height: 20, borderRadius: 10, backgroundColor: shell.accent, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 }}>
                      <Spec tone="paper">{String(row.badge)}</Spec>
                    </View>
                  ) : null}
                  <Body tone="accent">›</Body>
                </Pressable>
              ))}
            </Plate>
          </Rise>
        ))}
        {auth ? null : (
          <Spec tone="faint">Sign in and your company, your plan and your notebook follow you to the site and back.</Spec>
        )}
      </ScrollView>
    </View>
  );
}
