/**
 * THE GUIDE — the walkthrough. One card per thing worth knowing, each a
 * pane of glass lit in its colour with the desk's keeper standing on it,
 * a title in one line, and two or three tips. Swipe or tap through it;
 * skip any time. Shown once after the doors, and from You any time. It is
 * the whole manual: if a page needs more words than this, the page is
 * wrong, not the guide.
 */
import { useRef, useState } from "react";
import { Pressable, ScrollView, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { Body, Button, ButtonRow, Display, Glow, GlyphTile, Keeper, Plate, Spec, alpha, radius, shell, useLayout } from "@founderfloor/ui";
import { useFounder } from "../lib/store";
import { PAGES } from "../lib/guidePages";
import { RECEPTIONIST } from "../lib/mock";

const OUT = Easing.bezier(0.23, 1, 0.32, 1);

export default function Guide() {
  const L = useLayout();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { then } = useLocalSearchParams<{ then?: string }>();
  const setGuided = useFounder((s) => s.setGuided);
  const [i, setI] = useState(0);
  const scroll = useRef<ScrollView>(null);
  const pageW = Math.min(width, 560);
  const done = () => {
    setGuided();
    if (then) router.replace(then as Href);
    else if (router.canGoBack()) router.back();
    else router.replace("/today");
  };
  const go = (k: number) => {
    const n = Math.max(0, Math.min(PAGES.length - 1, k));
    scroll.current?.scrollTo({ x: n * pageW, animated: true });
    setI(n);
  };
  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => setI(Math.round(e.nativeEvent.contentOffset.x / pageW));

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingTop: L.insets.top + 12, paddingHorizontal: L.shell.paddingHorizontal, width: "100%", maxWidth: 560, alignSelf: "center", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Spec tone="muted">{`How it works · ${i + 1} of ${PAGES.length}`}</Spec>
        <Pressable onPress={done} accessibilityRole="button" accessibilityLabel="Skip the guide" hitSlop={8} style={{ minHeight: 44, justifyContent: "center" }}>
          <Spec tone="accent">Skip</Spec>
        </Pressable>
      </View>
      <ScrollView
        ref={scroll}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onEnd}
        style={{ flex: 1 }}
        contentContainerStyle={{ alignItems: "stretch" }}
        accessibilityRole="list"
      >
        {PAGES.map((p, k) => (
          <ScrollView key={k} style={{ width: pageW }} contentContainerStyle={{ paddingHorizontal: L.shell.paddingHorizontal, paddingTop: 16, paddingBottom: 16, gap: 18, flexGrow: 1, justifyContent: "center" }}>
            {/* the pane: the room's colour as a light, the glyph, the desk's keeper standing on it */}
            <Plate tone="panel" radius={radius.xxl} contentStyle={{ height: L.compact ? 200 : 240 }}>
              <View style={{ height: L.compact ? 200 : 240 }}>
                <Glow color={p.color} x={0.3} y={0.2} r={0.8} strength={0.6} />
                <View style={{ position: "absolute", left: 20, top: 22, flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <GlyphTile id={p.glyph} color={p.color} size={56} scale={3} />
                  <View style={{ backgroundColor: alpha.raisedFill(), borderWidth: 1, borderColor: alpha.hairline(), borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 6 }}>
                    <Spec tone="ink">{p.tab}</Spec>
                  </View>
                </View>
                <View pointerEvents="none" style={{ position: "absolute", left: 20, right: 20, bottom: 22, height: 1, backgroundColor: alpha.hairline() }} />
                <View style={{ position: "absolute", right: 34, bottom: 23 }}>
                  <View style={{ position: "absolute", left: -8, right: -8, bottom: -4, height: 10, borderRadius: 999, backgroundColor: "rgba(0,0,0,0.35)" }} />
                  <Keeper look={RECEPTIONIST.look} scale={3} framed={false} speaking={k === i} />
                </View>
              </View>
            </Plate>
            <Display size={L.compact ? "xl" : "3xl"}>{p.title}</Display>
            <Body tone="muted" size="lg">
              {p.line}
            </Body>
            {p.tips?.length ? (
              <Plate tone="paper" radius={radius.xl} padding={14}>
                <View style={{ gap: 8 }}>
                  <Spec tone="faint">To get the most out of it</Spec>
                  {p.tips.map((t) => (
                    <View key={t} style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: p.color, marginTop: 8 }} />
                      <Body size="sm" style={{ flex: 1 }}>
                        {t}
                      </Body>
                    </View>
                  ))}
                </View>
              </Plate>
            ) : null}
          </ScrollView>
        ))}
      </ScrollView>
      <View style={{ paddingHorizontal: L.shell.paddingHorizontal, paddingBottom: L.insets.bottom + 16, paddingTop: 8, width: "100%", maxWidth: 560, alignSelf: "center", gap: 16 }}>
        <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }} accessibilityRole="tablist">
          {PAGES.map((_, k) => (
            <Dot key={k} on={k === i} onPress={() => go(k)} label={`Page ${k + 1}`} />
          ))}
        </View>
        <ButtonRow>
          <Button arrow onPress={() => (i + 1 < PAGES.length ? go(i + 1) : done())}>
            {i + 1 < PAGES.length ? "Next" : "Start"}
          </Button>
          {i > 0 ? (
            <Button variant="ghost" onPress={() => go(i - 1)}>
              Back
            </Button>
          ) : null}
        </ButtonRow>
      </View>
    </View>
  );
}

/** One page's dot: it stretches when it is the page. */
function Dot({ on, onPress, label }: { on: boolean; onPress: () => void; label: string }) {
  const w = useSharedValue(on ? 22 : 8);
  w.value = withTiming(on ? 22 : 8, { duration: 220, easing: OUT });
  const s = useAnimatedStyle(() => ({ width: w.value }));
  return (
    <Pressable onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={label} hitSlop={8}>
      <Animated.View style={[{ height: 8, borderRadius: 4, backgroundColor: on ? shell.ink : alpha.hairline() }, s]} />
    </Pressable>
  );
}
