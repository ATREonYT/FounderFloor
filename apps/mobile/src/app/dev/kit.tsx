/**
 * /dev/kit — every kit component beside a screenshot of the site's original.
 *
 * This is Gate 1's deliverable: the app must look like founderfloor.net,
 * and the only honest way to show that is the two side by side, at the same
 * scale, on the same paper. Left is the site (a cropped screenshot captured
 * by scripts/ui-reference.mjs); right is the kit, live. A component that
 * has no site original says so — it is NEW, drawn in the site's style, and
 * the note says why it exists.
 */
import { useState, type ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { Image } from "expo-image";
import {
  Booth,
  Button,
  ButtonRow,
  Body,
  Dialogue,
  Display,
  Input,
  Kbd,
  MemberBadge,
  Menu,
  Mono,
  Plate,
  Progress,
  RankBadge,
  Sign,
  Spec,
  Sprite,
  TicketChip,
  TierTag,
  Toast,
  useLayout,
  shell,
  radius,
  UNSUPPORTED,
} from "@founderfloor/ui";

const REF = {
  hero: require("../../../assets/reference/hero-plate.png"),
  buttons: require("../../../assets/reference/buttons.png"),
  sign: require("../../../assets/reference/sign.png"),
  panel: require("../../../assets/reference/panel.png"),
  dialogue: require("../../../assets/reference/dialogue.png"),
  input: require("../../../assets/reference/input.png"),
  tags: require("../../../assets/reference/tags.png"),
  hud: require("../../../assets/reference/hud.png"),
} as const;

function Row({ title, note, ref, children, isNew = false }: { title: string; note?: string; ref?: keyof typeof REF; children: ReactNode; isNew?: boolean }) {
  const L = useLayout();
  const side = !L.compact;
  return (
    <Plate tone="panel" radius={radius.lg}>
      <View style={{ padding: 16, gap: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <Mono medium>{title}</Mono>
          {isNew ? <Spec tone="accent">NEW — not on the site; drawn in its style</Spec> : null}
          {note ? <Spec tone="muted">{note}</Spec> : null}
        </View>
        <View style={{ flexDirection: side ? "row" : "column", gap: 16, alignItems: "flex-start" }}>
          <View style={{ flex: side ? 1 : undefined, gap: 6, alignSelf: "stretch" }}>
            <Spec tone="faint">founderfloor.net</Spec>
            {ref ? (
              <Image source={REF[ref]} contentFit="contain" contentPosition="left center" style={{ width: "100%", height: 168, borderRadius: radius.sm, borderWidth: 1, borderColor: shell.line, backgroundColor: shell.panel }} />
            ) : (
              <View style={{ height: 44, justifyContent: "center" }}>
                <Spec tone="faint">— no original —</Spec>
              </View>
            )}
          </View>
          <View style={{ flex: side ? 1 : undefined, gap: 6, alignSelf: "stretch" }}>
            <Spec tone="faint">the kit</Spec>
            <View style={{ padding: 12, backgroundColor: shell.paper, borderRadius: radius.sm, borderWidth: 1, borderColor: shell.line, gap: 12 }}>{children}</View>
          </View>
        </View>
      </View>
    </Plate>
  );
}

export default function Kit() {
  const L = useLayout();
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(false);
  const [menu, setMenu] = useState("stand");
  return (
    <View style={{ flex: 1, backgroundColor: shell.paper }}>
      <ScrollView contentContainerStyle={{ paddingTop: L.insets.top + 24, paddingBottom: 140, paddingHorizontal: L.shell.paddingHorizontal, gap: 16, maxWidth: L.shell.maxWidth, alignSelf: "center", width: "100%" }}>
        <View style={{ gap: 8 }}>
          <Spec tone="muted">FounderFloor · the kit · {L.cls} · {L.width}×{L.height}</Spec>
          <Display size={L.compact ? "xl" : "3xl"}>Every part of the app, beside the site it copies.</Display>
          <Body tone="muted" style={{ maxWidth: 640 }}>
            Left is founderfloor.net. Right is this app, live. Same fonts, same tokens, same pixels; anything the site does not have is marked new.
          </Body>
        </View>

        <Row title="Booth" note="game/boothArt.ts · composed from the atlas at 2×" ref="hero">
          <View style={{ flexDirection: "row", gap: 16, flexWrap: "wrap" }}>
            <Booth swatch={0} carpetSwatch={8} look={{ skin: 2, outfit: 0, hair: 0 }} scale={L.compact ? 1 : 2} />
            <Booth swatch={11} carpetSwatch={4} pattern="border" look={{ skin: 2, outfit: 1, hair: 0 }} scale={L.compact ? 1 : 2} />
          </View>
        </Row>

        <Row title="Buttons" note=".btn-press · primary / secondary / ghost / disabled" ref="buttons">
          <ButtonRow>
            <Button arrow onPress={() => setToast(true)}>Walk the floor</Button>
            <Button variant="secondary" onPress={() => setOpen(true)}>Set up a stand</Button>
            <Button variant="ghost">Close</Button>
            <Button disabled>Redeem</Button>
          </ButtonRow>
          <View style={{ backgroundColor: shell.blackout, padding: 12, borderRadius: radius.md }}>
            <ButtonRow>
              <Button arrow>Walk the floor</Button>
              <Button variant="secondary" onDark>Set up a stand</Button>
            </ButtonRow>
          </View>
        </Row>

        <Row title="Sign" note="components/Sign.tsx · plate and paper; destination gets → and the accent" ref="sign">
          <Sign glyph="bolt" label="The whole idea" code="#route" />
          <Sign glyph="chip" label="The map" code="#index" to />
          <Sign glyph="star" label="Your stand" code="A-04" tone="paper" to />
        </Row>

        <Row title="Type" note="Archivo · IBM Plex Sans · IBM Plex Mono · .micro · signage · Kbd">
          <Display size="3xl">Three stops, one lap</Display>
          <Body>Nothing to learn. The route from the door to a conversation you would have had at a real hall is about ninety seconds long.</Body>
          <Body tone="muted" size="sm">Every stand listed, and which floors are open.</Body>
          <Mono>FounderFloor · Programme 2026 · A-04 · 70 tickets</Mono>
          <Spec>Esc or tap outside to go back to the hall — you keep your spot</Spec>
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <Kbd>W A S D</Kbd>
            <Body size="sm" tone="muted">walk</Body>
            <Kbd>E</Kbd>
            <Body size="sm" tone="muted">talk</Body>
          </View>
        </Row>

        <Row title="Panel and glass" note=".panel · .glass · the 8px bevel on the top-right corner only" ref="panel">
          <View style={{ flexDirection: L.compact ? "column" : "row", gap: 12 }}>
            <Plate tone="panel" padding={16} style={{ flex: 1 }}>
              <Spec tone="muted">MAIN HALL · A-04</Spec>
              <Display size="lg" style={{ marginTop: 4 }}>Soup Ticket</Display>
              <Body size="sm" tone="muted">Prepaid meal passes for small shops.</Body>
            </Plate>
            <Plate tone="glass" padding={12} style={{ flex: 1 }}>
              <Spec tone="ink">Chat · Bo walked in · open</Spec>
            </Plate>
            <Plate tone="plate" padding={12} style={{ flex: 1 }}>
              <Spec tone="paper">OPEN STAND · NO. 11 · GOLD 400</Spec>
            </Plate>
          </View>
        </Row>

        <Row title="Input" note="fountain focus — wayfinding, never a halo" ref="input">
          <Input label="Startup" placeholder="What it's called" />
          <Input label="Have a code?" placeholder="PRODUCTHUNT" mono autoCapitalize="characters" />
          <View style={{ backgroundColor: shell.blackout, padding: 12, borderRadius: radius.md }}>
            <Input onDark placeholder="you@example.com" />
          </View>
        </Row>

        <Row title="Tags and badges" note="TierTag · RankBadge · MemberBadge · the ticket chip" ref="tags">
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <TierTag tier="free" />
            <TierTag tier="pro" />
            <TierTag tier="founder" />
            <MemberBadge tier="pro" />
            <MemberBadge tier="founder" founding />
            <TicketChip balance={70} />
          </View>
          <View style={{ gap: 6 }}>
            <RankBadge monthlyRevenue={0} />
            <RankBadge monthlyRevenue={1200} />
            <RankBadge monthlyRevenue={25000} size="lg" />
          </View>
        </Row>

        <Row title="Meter" note="RankMeter .meter-fill — steps in whole units, tabular figures">
          <Progress value={0.62} label="This week" right="3 of 5" />
          <Progress value={0.18} label="€1,000 to Ramen Profitable" right="18%" color={shell.verify} />
        </Row>

        <Row title="Sprites" note="the atlas at 2× and 3× — integer scales only, never smoothed" ref="hud">
          <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
            {(["down", "up", "left", "right"] as const).map((d) => (
              <Sprite key={d} id={`avatar-skin2-${d}-0`} scale={3} />
            ))}
            <Sprite id="robot-c0v0-down" scale={3} />
            <Sprite id="emote-rocket" scale={3} />
            <Sprite id="emote-heart" scale={3} />
            <Sprite id="logo-mark" scale={3} />
            <Sprite id="prop-lamp" scale={2} />
            <Sprite id="prop-planter" scale={2} />
          </View>
          <Spec tone="faint">Not in the atlas (floor-only, shown through the WebView): {UNSUPPORTED.map((u) => u.id.replace("prop-", "")).join(", ")}</Spec>
        </Row>

        <Row title="Bottom menu" note="five entries · a glass bar on phones, a rail on wider screens" isNew>
          <Menu active={menu} onSelect={setMenu} />
        </Row>

        <Row title="Dialogue" note="components/StallPanel.tsx — the one overlay; sheet on phones, card ≤ 512 × 70% otherwise" ref="dialogue">
          <Button variant="secondary" onPress={() => setOpen(true)}>Open the ticket booth</Button>
        </Row>
      </ScrollView>

      <Dialogue open={open} onClose={() => setOpen(false)} sign="TICKET BOOTH" keeper="The booth" blurb="What you have, and what it is for." color={shell.gold}>
        <Plate tone="paper" padding={12}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
            <Body tone="muted">In your pocket</Body>
            <Display size="xl">70</Display>
          </View>
        </Plate>
        <Spec tone="muted" style={{ marginTop: 16, marginBottom: 8 }}>WAYS TO EARN</Spec>
        {[
          ["+15", "Turn up", "once a day — 10 plus 5 a day of streak, capped at 45"],
          ["+15", "Make a connection", "each new person, once each"],
          ["+5", "Sign a guestbook", "each stand, once each"],
          ["+25", "Earn a badge", "whatever earned it"],
        ].map(([n, t, s]) => (
          <View key={t} style={{ flexDirection: "row", gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: shell.line }}>
            <Mono tone="verify" medium style={{ width: 40 }}>
              {n}
            </Mono>
            <View style={{ flex: 1 }}>
              <Body>{t}</Body>
              <Spec tone="muted">{s}</Spec>
            </View>
          </View>
        ))}
        <Body size="sm" tone="muted" style={{ marginTop: 16 }}>
          Everything on sale in this hall is bought with tickets you earned by turning up and talking to people. Nothing here is pay-to-win, because there is nothing to win.
        </Body>
        <View style={{ marginTop: 12 }}>
          <Button variant="ghost" onPress={() => setOpen(false)}>Spend them on your stand</Button>
        </View>
      </Dialogue>

      <Toast text="Stand updated — the whole floor sees it." visible={toast} />
      {toast ? <HideToast onDone={() => setToast(false)} /> : null}

      <View style={{ position: "absolute", left: 12, right: 12, bottom: L.insets.bottom + 12, alignItems: L.compact ? "stretch" : "flex-start" }}>
        <Menu active={menu} onSelect={setMenu} />
      </View>
    </View>
  );
}

function HideToast({ onDone }: { onDone: () => void }) {
  useTimeout(onDone, 2400);
  return null;
}
import { useEffect } from "react";
function useTimeout(fn: () => void, ms: number) {
  useEffect(() => {
    const t = setTimeout(fn, ms);
    return () => clearTimeout(t);
  }, [fn, ms]);
}
