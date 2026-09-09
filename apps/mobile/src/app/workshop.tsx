/**
 * THE WORKSHOP — the start-up, mocked up. A phone drawn on the page with
 * the first screens of the thing in it, three to five: the front door,
 * the main screen, what it leads to, the price. With a key, the desk
 * first writes the brief from everything the founder put into the
 * building (the big prompt, with a design system decided from the
 * audience), then designs the whole app to it. Every word came from the
 * founder's own sign, audience and notebook, and every word can be
 * changed by tapping Edit. Under the phone: the brief, and two ways to
 * hand it over: to Lovable, Bolt or v0 for a founder who does not code,
 * or to Claude Code for one who does. With nothing on the sign yet, the
 * page shows a sample and says so.
 */
import { useMemo, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, Share, Text, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { lookOf, mockupPoster, mockupTheme, POSTER_H, POSTER_W, type LookPreset, type MockScreen, type ProductKind } from "@founderfloor/shared";
import { Body, Button, ButtonRow, Dialogue, Display, Glyph, GlyphTile, Input, Plate, Scene, Spec, Thinking, Toast, radius, shell, useLayout, wash, type GlyphId } from "@founderfloor/ui";
import { useWorkshop } from "../lib/workshop";
import { LiveMock } from "../components/LiveMock";
import { Hint } from "../components/Hint";

const INK = "#0B0F19";
const KIND: Record<MockScreen["kind"], { glyph: GlyphId; color: string }> = { landing: { glyph: "wave", color: "#3B5B92" }, signup: { glyph: "heart", color: "#2F6F6A" }, app: { glyph: "bolt", color: "#4F6E6B" }, pricing: { glyph: "coin", color: "#B4762E" }, checkout: { glyph: "coin", color: "#8C3B2E" } };


export default function Workshop() {
  const L = useLayout();
  const router = useRouter();
  const w = useWorkshop();
  const [i, setI] = useState(0);
  const [edit, setEdit] = useState<MockScreen | null>(null);
  const [showBrief, setShowBrief] = useState(false);
  const [showPrompt, setShowPrompt] = useState<"lovable" | "claude" | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const m = w.mockup;
  const screens = w.screens;
  const sc = m.screens[Math.min(i, m.screens.length - 1)];
  const k = KIND[screens[Math.min(i, screens.length - 1)]?.kind ?? sc.kind];
  const say = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(null), 2600);
  };
  const send = async (kind: "lovable" | "claude") => {
    try {
      await Share.share({ message: w.prompt(kind), title: kind === "lovable" ? `${m.name}: build prompt` : `${m.name}: CLAUDE.md and brief` });
    } catch {
      say("Could not open the share sheet.");
    }
  };
  const back = () => (router.canGoBack() ? router.back() : router.replace("/you" as Href));
  const poster = useRef<View>(null);
  const canCapture = Platform.OS !== "web";
  /** The picture, as a file, through the share sheet. The capture module is native only and loaded when asked for. */
  const sharePicture = async () => {
    if (!canCapture || !poster.current) return;
    try {
      const { captureRef } = require("react-native-view-shot") as typeof import("react-native-view-shot");
      const uri = await captureRef(poster.current, { format: "png", quality: 1, result: "tmpfile" });
      await Share.share(Platform.OS === "ios" ? { url: uri, message: `${m.name}: ${m.oneLiner}` } : { message: `${m.name}: ${m.oneLiner}`, url: uri });
    } catch (e) {
      say(e instanceof Error && /Cannot find module|not found/i.test(e.message) ? "The picture needs a rebuild of the app (npx expo run:ios)." : "Could not make the picture.");
    }
  };
  const phoneW = Math.min(300, L.width - 2 * L.shell.paddingHorizontal - 40);
  const phoneH = Math.round(phoneW * (844 / 390));
  const posterW = Math.min(640, L.width - 2 * L.shell.paddingHorizontal);
  const posterH = Math.round(posterW * (POSTER_H / POSTER_W));
  const theme = mockupTheme(m);
  const look = lookOf(m);
  const PRESETS: { p: LookPreset; label: string; line: string }[] = [
    { p: "startup", label: "Startup", line: "Cards, colour, bottom tabs" },
    { p: "editorial", label: "Editorial", line: "Serif, centred, numbered" },
    { p: "studio", label: "Studio", line: "Dark hero, black buttons" },
    { p: "playful", label: "Playful", line: "Round, gradient, floating bar" },
    { p: "minimal", label: "Minimal", line: "Black on white, nothing extra" },
  ];
  const HUES: { hue: number; name: string }[] = [{ hue: 222, name: "Blue" }, { hue: 262, name: "Violet" }, { hue: 334, name: "Rose" }, { hue: 12, name: "Coral" }, { hue: 160, name: "Green" }, { hue: 200, name: "Teal" }];
  const KINDS: { k: ProductKind; label: string }[] = [{ k: "saas", label: "Software" }, { k: "consumer", label: "Consumer app" }, { k: "marketplace", label: "Marketplace" }, { k: "services", label: "Service" }, { k: "hardware", label: "Product" }];
  /** The app, built once per mock-up; the chips drive its screen without reloading it. */
  const html = useMemo(() => w.html, [w.html]);
  const posterHtml = useMemo(() => mockupPoster(m, w.designHtml), [m, w.designHtml]);

  return (
    <View style={{ flex: 1, backgroundColor: shell.paper }}>
      <ScrollView contentContainerStyle={{ paddingTop: L.insets.top + 8, paddingBottom: L.insets.bottom + 32, paddingHorizontal: L.shell.paddingHorizontal, width: "100%", maxWidth: 640, alignSelf: "center", gap: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Pressable onPress={back} accessibilityRole="button" accessibilityLabel="Back" style={{ borderWidth: 1, borderColor: shell.line, borderRadius: radius.md, paddingHorizontal: 10, height: 36, justifyContent: "center" }}>
            <Spec tone="ink">← Back</Spec>
          </Pressable>
          <Spec tone="muted">THE WORKSHOP</Spec>
        </View>
        <Scene set="workshop" height={L.compact ? 130 : 160} radiusPx={radius.xl} color="#A28457" accessibilityLabel="The workshop">
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <GlyphTile id="cube" color="#A28457" size={28} scale={1} />
            <Spec tone="ink">{m.source === "sample" ? "A SAMPLE" : w.designed ? "DESIGNED FOR YOU" : m.source === "live" ? "FROM YOUR NOTEBOOK" : "FROM YOUR SIGN"}</Spec>
          </View>
        </Scene>
        <View style={{ gap: 6 }}>
          <Display size={L.compact ? "3xl" : "4xl"}>{m.source === "sample" ? "Your start-up, mocked up" : `${m.name}, mocked up`}</Display>
          <Body tone="muted">A working first version, designed from everything you wrote: the screens you can tap through, and the brief to build it from. Every word can be changed.</Body>
        </View>
        <Hint id="workshop" text="Tap around inside the phone: the buttons and the tab bar work. Tap Edit to change any word, then share the picture with the people you talked to. The brief and the prompts under it are for whoever builds it." color="#A28457" />
        {m.source === "sample" ? (
          <Plate tone="paper" radius={radius.lg} padding={12} lineColor="#A28457">
            <Body size="sm">
              {`This is a sample, ${m.name}. Write the sign on your stand and the desk mocks up yours from it, your audience and what people told you.`}
            </Body>
            <View style={{ marginTop: 8 }}>
              <Button size="sm" variant="secondary" onPress={() => router.push("/stand" as Href)}>
                Write the sign
              </Button>
            </View>
          </Plate>
        ) : null}

        {/* the phone */}
        <View style={{ alignItems: "center", gap: 12 }}>
          <View style={{ borderRadius: 40, backgroundColor: INK, padding: 8, shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 10 }}>
            <LiveMock html={html} width={phoneW} height={phoneH} screen={i} onScreen={setI} radius={32} />
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 8 }}>
            <Pressable onPress={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0} accessibilityRole="button" accessibilityLabel="Previous screen" style={{ opacity: i === 0 ? 0.3 : 1, padding: 6 }}>
              <Body>←</Body>
            </Pressable>
            {screens.map((s, n) => (
              <Pressable key={n} onPress={() => setI(n)} accessibilityRole="button" accessibilityLabel={s.title} style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: n === i ? KIND[s.kind].color : shell.panel, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: n === i ? KIND[s.kind].color : shell.line }}>
                <Glyph id={KIND[s.kind].glyph} tone={n === i ? "paper" : "auto"} scale={1} />
                <Spec tone={n === i ? "paper" : "ink"}>{s.title}</Spec>
              </Pressable>
            ))}
            <Pressable onPress={() => setI((x) => Math.min(screens.length - 1, x + 1))} disabled={i === screens.length - 1} accessibilityRole="button" accessibilityLabel="Next screen" style={{ opacity: i === screens.length - 1 ? 0.3 : 1, padding: 6 }}>
              <Body>→</Body>
            </Pressable>
          </View>
          <ButtonRow>
            <Button size="sm" variant="secondary" onPress={() => setEdit({ ...sc })}>
              Edit this screen
            </Button>
            <Button size="sm" variant="ghost" onPress={w.rewrite} disabled={w.writing || w.designing || !w.mine}>
              {w.writing ? "Writing…" : "Write it again"}
            </Button>
          </ButtonRow>
        </View>

        {/* the design: the brief first, then the app designed to it; asked again, a direction drawn at random */}
        <Plate tone="panel" radius={radius.xl} padding={14} style={w.designed ? { borderWidth: 1.5, borderColor: "#A28457" } : undefined}>
          <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
            <Spec tone="muted">THE DESIGN</Spec>
            {w.canDesign ? (
              <Pressable onPress={w.redesign} disabled={w.designing || w.writing} accessibilityRole="button" accessibilityLabel="Design it again">
                <Spec tone="accent">{w.designing ? "Designing…" : w.designed ? "A different take ↻" : "Design it ↻"}</Spec>
              </Pressable>
            ) : null}
          </View>
          {w.stage ? (
            <View style={{ marginTop: 8 }}>
              <Thinking label={w.stage} />
              <Spec tone="faint" style={{ marginTop: 6 }}>Two stages: the brief from everything you wrote, then every screen designed to it. About a minute.</Spec>
            </View>
          ) : w.designed ? (
            <Body size="sm" style={{ marginTop: 6 }}>
              {m.design?.direction}
            </Body>
          ) : w.canDesign ? (
            <Body size="sm" tone="muted" style={{ marginTop: 6 }}>
              The desk reads everything you wrote, writes the brief with a design system decided from your audience, then designs every screen to it. No two founders get the same app.
            </Body>
          ) : (
            <Body size="sm" tone="muted" style={{ marginTop: 6 }}>
              {m.source === "sample" ? "This sample was drawn the way the desk draws yours with a key in the app: from a brief, screen by screen. Below are the desk's own five looks for practice mode." : "Practice mode: the desk's own five looks. With a key it writes the brief and designs the whole app itself."}
            </Body>
          )}
          {w.designError ? <Spec tone="faint" style={{ marginTop: 6 }}>{w.designError}</Spec> : null}
          {w.designed && m.edited ? <Spec tone="faint" style={{ marginTop: 6 }}>You changed some words since. Design it again to see them.</Spec> : null}
        </Plate>

        {/* the look and the kind: the desk's own five looks, when the model has not designed it */}
        <Plate tone="panel" radius={radius.xl} padding={14} style={w.designed || m.source === "sample" ? { opacity: 0.6 } : undefined}>
          <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
            <Spec tone="muted">{w.designed || m.source === "sample" ? "THE FALLBACK LOOK" : "THE LOOK"}</Spec>
            <Pressable onPress={() => w.setTheme({ hue: theme.hue, style: "clean", seed: Math.floor(Math.random() * 100000) })} accessibilityRole="button" accessibilityLabel="Surprise me">
              <Spec tone="accent">{look.preset === "shuffle" ? "Shuffle again ↻" : "Surprise me ↻"}</Spec>
            </Pressable>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {PRESETS.map((x) => {
              const on = look.preset === x.p;
              return (
                <Pressable key={x.p} onPress={() => w.setTheme({ hue: theme.hue, style: "clean", preset: x.p })} accessibilityRole="button" accessibilityLabel={`${x.label} look`} style={{ flexBasis: "47%", flexGrow: 1, paddingVertical: 9, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1.5, borderColor: on ? shell.blackout : shell.line, backgroundColor: on ? shell.blackout : shell.panel }}>
                  <Spec tone={on ? "paper" : "ink"}>{x.label}</Spec>
                  <Spec tone={on ? "paperQuiet" : "faint"}>{x.line}</Spec>
                </Pressable>
              );
            })}
          </View>
          {look.preset === "shuffle" ? <Spec tone="faint" style={{ marginTop: 8 }}>{`A shuffle: ${look.font} type, ${look.hero} hero, ${look.palette} palette, ${look.nav === "top" ? "tabs on top" : look.nav === "pillbar" ? "a floating bar" : "bottom tabs"}.`}</Spec> : null}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 12, alignItems: "center" }}>
            {HUES.map((h) => (
              <Pressable key={h.hue} onPress={() => w.setTheme({ ...theme, hue: h.hue })} accessibilityRole="button" accessibilityLabel={h.name} style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: `hsl(${h.hue} 72% 46%)`, borderWidth: 3, borderColor: theme.hue === h.hue ? shell.ink : "transparent" }} />
            ))}
            <Spec tone="faint" style={{ marginLeft: "auto" }}>{HUES.find((h) => h.hue === theme.hue)?.name ?? "Its own colour"}</Spec>
          </View>
          <Spec tone="muted" style={{ marginTop: 14 }}>WHAT KIND OF THING IT IS</Spec>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {KINDS.map((x) => (
              <Pressable key={x.k} onPress={() => w.setKind(x.k)} accessibilityRole="button" accessibilityLabel={x.label} style={{ paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1.5, borderColor: (m.kind ?? "saas") === x.k ? shell.blackout : shell.line, backgroundColor: (m.kind ?? "saas") === x.k ? shell.blackout : shell.panel }}>
                <Spec tone={(m.kind ?? "saas") === x.k ? "paper" : "ink"}>{x.label}</Spec>
              </Pressable>
            ))}
          </View>
          <Spec tone="faint" style={{ marginTop: 8 }}>The layout follows: a dashboard, a feed, listings, bookings or a product page.</Spec>
        </Plate>

        {/* the picture: the three screens on one card, to show people */}
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
            <Body medium>The picture</Body>
            <Spec tone="faint">Show it before you build</Spec>
          </View>
          <View style={{ alignItems: "center" }}>
            <LiveMock ref={poster} html={posterHtml} width={posterW} height={posterH} radius={20} />
          </View>
          {canCapture ? (
            <Button variant="secondary" onPress={() => void sharePicture()}>
              Share the picture
            </Button>
          ) : (
            <Spec tone="faint">On the phone this card becomes a picture you can send.</Spec>
          )}
        </View>

        {/* the path and what it keeps */}
        <Plate tone="panel" radius={radius.xl} padding={14}>
          <Spec tone="muted">THE ONE PATH</Spec>
          <Body size="sm" style={{ marginTop: 4 }}>
            {m.path}
          </Body>
          <Spec tone="muted" style={{ marginTop: 10 }}>WHAT IT KEEPS</Spec>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
            {m.keeps.map((kp) => (
              <View key={kp} style={{ backgroundColor: shell.well, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Spec tone="ink">{kp}</Spec>
              </View>
            ))}
          </View>
        </Plate>

        {/* the brief */}
        <Plate tone="panel" radius={radius.xl} padding={14}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Spec tone="muted" style={{ flex: 1 }}>THE BRIEF · THE BIG PROMPT</Spec>
            <Pressable onPress={() => setShowBrief((v) => !v)} accessibilityRole="button">
              <Spec tone="accent">{showBrief ? "Hide" : "Read it"}</Spec>
            </Pressable>
          </View>
          <Body size="sm" tone="muted" style={{ marginTop: 4 }}>
            {m.brief ? "Written from everything you put into the building: the product, the person it is for, the path, every screen with its exact words, what it keeps, a design system with real colours and type, the words, the build, and what to leave out. This is what you paste into Lovable." : "The screens with their exact words, the path, what it keeps, a design system from the chosen look, and the rules. With a key, the desk writes the full brief from everything you wrote."}
          </Body>
          {showBrief ? (
            <Text selectable style={{ marginTop: 10, fontFamily: "monospace", fontSize: 12, lineHeight: 17, color: shell.ink }}>
              {w.brief}
            </Text>
          ) : null}
        </Plate>

        {/* the hand-off */}
        <View style={{ gap: 8 }}>
          <Body medium>Now build it</Body>
          <Body size="sm" tone="muted">The brief is the prompt. Both hand-offs carry it whole, with your exact words, the design system, and what to leave out.</Body>
          <Pressable onPress={() => void send("lovable")} accessibilityRole="button" accessibilityLabel="Send to Lovable, Bolt or v0">
            <Plate tone="panel" radius={radius.xl} padding={14}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <GlyphTile id="rocket" color="#3B5B92" size={40} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Body medium>I do not code</Body>
                  <Spec tone="faint">The brief as one prompt for Lovable, Bolt or v0: paste it, get a live app</Spec>
                </View>
                <Body tone="accent">Send ›</Body>
              </View>
            </Plate>
          </Pressable>
          <Pressable onPress={() => void send("claude")} accessibilityRole="button" accessibilityLabel="Send to Claude Code">
            <Plate tone="panel" radius={radius.xl} padding={14}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <GlyphTile id="chip" color="#4F6E6B" size={40} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Body medium>I code, or I have Claude Code</Body>
                  <Spec tone="faint">The brief as CLAUDE.md, with a first prompt and a stack</Spec>
                </View>
                <Body tone="accent">Send ›</Body>
              </View>
            </Plate>
          </Pressable>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable onPress={() => setShowPrompt(showPrompt === "lovable" ? null : "lovable")} accessibilityRole="button">
              <Spec tone="accent">{showPrompt === "lovable" ? "Hide the prompt" : "Show the Lovable prompt"}</Spec>
            </Pressable>
            <Pressable onPress={() => setShowPrompt(showPrompt === "claude" ? null : "claude")} accessibilityRole="button">
              <Spec tone="accent">{showPrompt === "claude" ? "Hide the prompt" : "Show the Claude Code prompt"}</Spec>
            </Pressable>
          </View>
          {showPrompt ? (
            <Plate tone="paper" radius={radius.lg} padding={12}>
              <Text selectable style={{ fontFamily: "monospace", fontSize: 12, lineHeight: 17, color: shell.ink }}>
                {w.prompt(showPrompt)}
              </Text>
            </Plate>
          ) : null}
          {w.lastError ? <Spec tone="faint">{w.lastError}</Spec> : null}
        </View>
      </ScrollView>

      {/* edit one screen's words */}
      <Dialogue open={!!edit} onClose={() => setEdit(null)} sign="EDIT THE SCREEN" keeper="The desk" color={k.color} footer="Your words. The brief and the prompts follow.">
        {edit ? (
          <View style={{ gap: 12 }}>
            <Input label="HEADLINE" value={edit.headline} onChangeText={(v) => setEdit({ ...edit, headline: v })} />
            <Input label="UNDER IT" value={edit.sub} onChangeText={(v) => setEdit({ ...edit, sub: v })} multiline />
            <Input label="THE ONE BUTTON" value={edit.cta} onChangeText={(v) => setEdit({ ...edit, cta: v })} />
            {edit.kind === "pricing" ? <Input label="PRICE" value={edit.price ?? ""} onChangeText={(v) => setEdit({ ...edit, price: v })} /> : null}
            {edit.bullets.map((b, n) => (
              <Input key={n} label={`LINE ${n + 1}`} value={b} onChangeText={(v) => setEdit({ ...edit, bullets: edit.bullets.map((x, q) => (q === n ? v : x)) })} />
            ))}
            <ButtonRow>
              <Button onPress={() => { w.editScreen(i, edit); setEdit(null); say("Changed."); }}>Keep</Button>
              <Button variant="ghost" onPress={() => setEdit(null)}>
                Cancel
              </Button>
            </ButtonRow>
          </View>
        ) : null}
      </Dialogue>
      <Toast text={toast ?? ""} visible={!!toast} />
    </View>
  );
}
