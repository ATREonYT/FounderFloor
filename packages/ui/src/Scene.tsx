/**
 * THE SCENE — a vignette of the hall, drawn from the atlas. A wall, a
 * floor of the hall's tiles, a few props placed at the same pixel scale
 * the floor uses, and (optionally) people walking past. It is what the
 * app puts where other apps put a stock illustration: the header of a
 * screen, the top of an empty state, the ground under a keeper.
 *
 * Nothing here is new art. Every prop is a crop the floor already draws
 * (props were rendered by the site's own painters into the atlas), and the
 * walkers are the floor's 20×28 avatars on their three-frame walk cycle.
 *
 * Placement: `x` is a fraction of the scene's width (0 left, 1 right) so a
 * vignette composes the same on a 390px phone and a 720px column; `y` is
 * native px above the floor line (0 = standing on it). Props are drawn in
 * the order given, so put the back row first.
 */
import { useEffect, useState, type ReactNode } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, withDelay, useReducedMotion, cancelAnimation } from "react-native-reanimated";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import { Sprite, spriteMeta, type SpriteId } from "./Sprite";
import { SpriteCycle } from "./SpriteCycle";
import { art, shell } from "./tokens";
import { scheme } from "./theme";

export type Hall = keyof typeof art.floors;
export type SceneProp = { id: SpriteId; x: number; y?: number; flip?: boolean };
export type SceneWalker = { outfit: number; from: number; to: number; seconds: number; delay?: number; y?: number };
export type SceneSet = "lobby" | "workshop" | "office" | "market" | "stand" | "cafe" | "mailroom" | "archive" | "doors" | "empty";

/** The named vignettes, one per place in the app. */
export const SCENE_SETS: Record<SceneSet, { hall: Hall; props: SceneProp[]; walkers: SceneWalker[] }> = {
  lobby: {
    hall: "main-hall",
    props: [
      { id: "prop-tree", x: 0.08 },
      { id: "prop-bench", x: 0.3, y: -2 },
      { id: "prop-lamp", x: 0.62 },
      { id: "prop-planter", x: 0.9, y: -2 },
    ],
    walkers: [
      { outfit: 3, from: -0.1, to: 1.1, seconds: 14 },
      { outfit: 6, from: 1.1, to: -0.1, seconds: 19, delay: 5 },
    ],
  },
  doors: {
    hall: "tutorial-hall",
    props: [
      { id: "prop-sign", x: 0.1 },
      { id: "prop-planter", x: 0.9, y: -2 },
    ],
    walkers: [{ outfit: 1, from: 1.1, to: -0.1, seconds: 16, delay: 2 }],
  },
  workshop: {
    hall: "indie-alley",
    props: [
      { id: "prop-lamp", x: 0.07 },
      { id: "prop-board", x: 0.3 },
      { id: "prop-table", x: 0.65, y: -2 },
      { id: "prop-crates", x: 0.91 },
    ],
    walkers: [{ outfit: 2, from: -0.1, to: 1.1, seconds: 18, delay: 3 }],
  },
  office: {
    hall: "cofounder-row",
    props: [
      { id: "prop-lamp", x: 0.08 },
      { id: "prop-sofa", x: 0.36, y: -2 },
      { id: "prop-board", x: 0.7 },
      { id: "prop-planter", x: 0.92, y: -2 },
    ],
    walkers: [{ outfit: 5, from: 1.1, to: -0.1, seconds: 17, delay: 4 }],
  },
  market: {
    hall: "main-hall",
    props: [
      { id: "prop-planter", x: 0.08, y: -2 },
      { id: "prop-merchant-back", x: 0.5, y: 6 },
      { id: "prop-merchant-front", x: 0.5 },
      { id: "prop-lamp", x: 0.92 },
    ],
    walkers: [
      { outfit: 7, from: -0.1, to: 1.1, seconds: 15 },
      { outfit: 4, from: 1.1, to: -0.1, seconds: 21, delay: 7 },
    ],
  },
  stand: {
    hall: "main-hall",
    props: [
      { id: "prop-planter", x: 0.07, y: -2 },
      { id: "prop-lamp", x: 0.93 },
    ],
    walkers: [
      { outfit: 7, from: -0.1, to: 1.1, seconds: 16, y: -4 },
      { outfit: 4, from: 1.1, to: -0.1, seconds: 23, delay: 8, y: -4 },
    ],
  },
  cafe: {
    hall: "ramen-district",
    props: [
      { id: "prop-lamp", x: 0.06 },
      { id: "prop-bar", x: 0.4 },
      { id: "prop-table", x: 0.78, y: -2 },
      { id: "prop-planter", x: 0.94, y: -2 },
    ],
    walkers: [{ outfit: 0, from: 1.1, to: -0.1, seconds: 18, delay: 1 }],
  },
  mailroom: {
    hall: "tutorial-hall",
    props: [
      { id: "prop-board", x: 0.22 },
      { id: "prop-bench", x: 0.56, y: -2 },
      { id: "prop-planter", x: 0.86, y: -2 },
    ],
    walkers: [{ outfit: 3, from: -0.1, to: 1.1, seconds: 20, delay: 2 }],
  },
  archive: {
    hall: "indie-alley",
    props: [
      { id: "prop-kiosk", x: 0.25 },
      { id: "prop-crates", x: 0.56 },
      { id: "prop-crates", x: 0.66, y: 4 },
      { id: "prop-lamp", x: 0.9 },
    ],
    walkers: [],
  },
  empty: { hall: "main-hall", props: [], walkers: [] },
};

/** The wall and floor of a hall, sized to fill its parent. */
export function Backdrop({ hall = "main-hall", floorH, scale = 2, wall = true, width, children }: { hall?: Hall; floorH: number; scale?: 1 | 2 | 3; wall?: boolean; /** Known width, so only the tiles that show are drawn. */ width?: number; children?: ReactNode }) {
  const f = art.floors[hall];
  const tile = 16 * scale;
  const tiles = width ? Math.ceil(width / tile) + 1 : 48;
  return (
    <>
      {wall ? <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, bottom: floorH, height: 3 * scale, backgroundColor: f.wall }} /> : null}
      <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: floorH, backgroundColor: f.a, flexDirection: "row", overflow: "hidden" }}>
        {Array.from({ length: tiles }).map((_, i) => (
          <View key={i} style={{ width: tile, height: floorH, backgroundColor: i % 2 ? f.b : f.a, borderRightWidth: 1, borderRightColor: "rgba(0,0,0,0.04)" }} />
        ))}
      </View>
      {/* a soft skirting where the wall meets the floor */}
      <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, bottom: floorH, height: 1, backgroundColor: "rgba(0,0,0,0.18)" }} />
      {children}
    </>
  );
}

/** The props and walkers of a set, placed on a floor line `floorH` from the bottom. */
export function Furniture({ set, width, floorH, scale = 2, ambient = true, only, edges = false }: { set: SceneSet; width: number; floorH: number; scale?: 1 | 2 | 3; ambient?: boolean; /** Draw one layer only, to sandwich something between the props and the people. */ only?: "props" | "walkers"; /** Only the props at the far left and right, pushed back to the wall: a stage keeps its middle clear. */ edges?: boolean }) {
  const s = SCENE_SETS[set];
  const props = edges ? s.props.filter((p) => p.x <= 0.12 || p.x >= 0.88).map((p) => ({ ...p, x: p.x < 0.5 ? 0.05 : 0.95, y: (p.y ?? 0) + 2 })) : s.props;
  return (
    <>
      {only !== "walkers" ? props.map((p, i) => (
        <Prop key={`${p.id}-${i}`} p={p} width={width} floorH={floorH} scale={scale} />
      )) : null}
      {ambient && only !== "props" ? s.walkers.map((w, i) => <Walker key={i} w={w} width={width} floorH={floorH} scale={scale} />) : null}
    </>
  );
}

function Prop({ p, width, floorH, scale }: { p: SceneProp; width: number; floorH: number; scale: number }) {
  const m = spriteMeta(p.id);
  // the atlas origin for a prop is the floor's draw point; the crop's bottom is where it meets the ground
  const left = Math.round(p.x * width - (m.w * scale) / 2);
  const bottom = Math.round(floorH - 10 * scale + (p.y ?? 0) * scale);
  return (
    <View pointerEvents="none" style={{ position: "absolute", left, bottom, transform: p.flip ? [{ scaleX: -1 }] : undefined }}>
      <Sprite id={p.id} scale={scale as 1 | 2 | 3} />
    </View>
  );
}

function Walker({ w, width, floorH, scale }: { w: SceneWalker; width: number; floorH: number; scale: number }) {
  const reduced = useReducedMotion();
  const t = useSharedValue(0);
  const dir = w.to > w.from ? "right" : "left";
  useEffect(() => {
    if (reduced) {
      t.value = 0.5;
      return;
    }
    cancelAnimation(t);
    t.value = 0;
    t.value = withDelay((w.delay ?? 0) * 1000, withRepeat(withSequence(withTiming(1, { duration: w.seconds * 1000, easing: Easing.linear }), withTiming(0, { duration: 0 })), -1, false));
    return () => cancelAnimation(t);
  }, [reduced, t, w.seconds, w.delay]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: (w.from + (w.to - w.from) * t.value) * width }] }));
  const ids = [0, 1, 2].map((k) => `avatar-outfit${w.outfit % 8}-${dir}-${k}` as SpriteId);
  const bottom = Math.round(floorH - 12 * scale + (w.y ?? 0) * scale);
  return (
    <Animated.View pointerEvents="none" style={[{ position: "absolute", left: -10 * scale, bottom, opacity: 0.92 }, style]}>
      <SpriteCycle ids={ids} playing={!reduced} period={180} scale={scale as 1 | 2 | 3} />
    </Animated.View>
  );
}

export function Scene({
  set = "lobby",
  height = 172,
  radiusPx = 22,
  color,
  children,
  accessibilityLabel,
}: {
  set?: SceneSet;
  height?: number;
  scale?: 1 | 2 | 3;
  radiusPx?: number;
  /** The glow's colour (a keeper's, a room's). Defaults to the hall's own light. */
  color?: string;
  ambient?: boolean;
  /** Laid over the band, bottom-left, for a title or a chip. */
  children?: ReactNode;
  accessibilityLabel?: string;
}) {
  // the night hall: a page header is a short pane of glass lit in its colour, not a tiled room; the set only picks a default light
  const dark = scheme() === "dark";
  const light = color ?? HALL_LIGHT[SCENE_SETS[set].hall];
  const h = Math.min(height, 84);
  return (
    <View accessibilityRole={accessibilityLabel ? "image" : undefined} accessibilityLabel={accessibilityLabel} style={{ height: h, borderRadius: radiusPx, overflow: "hidden", position: "relative", justifyContent: "center", paddingHorizontal: 14, backgroundColor: dark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.6)", borderWidth: 1, borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" }}>
      <BandGlow color={light} />
      {children ? <View style={{ flexDirection: "row" }}>{children}</View> : null}
    </View>
  );
}

/** Each hall's own light, for a header that names no colour. */
const HALL_LIGHT: Record<Hall, string> = { "main-hall": "#4C7DFF", "indie-alley": "#E4A85B", "ramen-district": "#FF6B3D", "cofounder-row": "#E4C77A", "tutorial-hall": "#6FD3E0" };

function BandGlow({ color }: { color: string }) {
  const dark = scheme() === "dark";
  const id = `band${color.replace("#", "")}`;
  return (
    <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity={dark ? 0.55 : 0.42} />
            <Stop offset="0.6" stopColor={color} stopOpacity={dark ? 0.18 : 0.14} />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={82} cy={10} r={70} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

function washHex(hex: string, a: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
function lighten(hex: string): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const c = (v: number) => Math.min(255, Math.round(v + (255 - v) * 0.55));
  return `rgb(${c((n >> 16) & 255)},${c((n >> 8) & 255)},${c(n & 255)})`;
}

/** A pixel glyph from the atlas, at an integer scale, tone-aware. */
export function Glyph({ id, tone = "ink", scale = 2 }: { id: "bolt" | "leaf" | "coin" | "chip" | "flask" | "rocket" | "heart" | "cube" | "wave" | "star"; tone?: "ink" | "paper" | "accent" | "auto"; scale?: 1 | 2 | 3 | 4 }) {
  const t = tone === "auto" ? (scheme() === "dark" ? "paper" : "ink") : tone;
  return <Sprite id={`glyph-${id}-${t}` as SpriteId} scale={scale} />;
}

/** A glyph in a soft rounded well, the app's icon tile. */
export function GlyphTile({ id, color, size = 40, scale = 2 }: { id: Parameters<typeof Glyph>[0]["id"]; color?: string; size?: number; scale?: 1 | 2 | 3 }) {
  const dark = scheme() === "dark";
  const bg = color ? washHex(color, dark ? 0.28 : 0.16) : dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)";
  return (
    <View style={{ width: size, height: size, borderRadius: Math.round(size / 3), backgroundColor: bg, borderWidth: 1, borderColor: color ? washHex(color, dark ? 0.35 : 0.22) : dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)", alignItems: "center", justifyContent: "center" }}>
      <Glyph id={id} tone="auto" scale={scale} />
    </View>
  );
}
