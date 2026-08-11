"use client";

/**
 * What are we running on, and how much room is there?
 *
 * One module, because the answer was previously worked out in four places
 * with four slightly different rules, and the instructions a visitor reads
 * ("press E", "tap the stand") have to agree with the controls they
 * actually have.
 *
 * TWO KINDS OF ANSWER, AND THEY ARE NOT INTERCHANGEABLE:
 *
 *   `pointer` and `size` come from the browser telling us about itself —
 *   media queries and the viewport. They are trustworthy and they drive
 *   BEHAVIOUR (control sizes, layout, which input the tutorial teaches).
 *
 *   `platform` comes from sniffing the user agent, which is a last resort:
 *   it is spoofable, it lies on iPads, and it has been wrong about
 *   something for as long as it has existed. It therefore drives COPY
 *   ONLY — whether a hint says "click" or "tap the trackpad". Nothing on
 *   this site should ever be unreachable because the UA string was
 *   unexpected, so every branch on `platform` must have a sane fallback
 *   and no branch may gate a feature.
 */

import { useEffect, useState } from "react";

export type PointerKind = "touch" | "mouse";
export type Platform = "ios" | "android" | "mac" | "windows" | "linux" | "other";
/** Viewport buckets. xs is "one thumb, no room": a 360px Android. */
export type ScreenSize = "xs" | "sm" | "md" | "lg";

export interface DeviceInfo {
  pointer: PointerKind;
  platform: Platform;
  size: ScreenSize;
  width: number;
  height: number;
  /** Wider than tall AND short — a phone on its side, which needs the chrome out of the way. */
  landscapePhone: boolean;
}

const SERVER_DEFAULT: DeviceInfo = {
  // A desktop guess for SSR. The first client effect corrects it before
  // anything a visitor reads is painted, and guessing "mouse" means a
  // keyboard hint flashing on a phone rather than a phone hint flashing on
  // a laptop — the first is a smaller lie, since a phone user is about to
  // be told the right thing anyway.
  pointer: "mouse",
  platform: "other",
  size: "lg",
  width: 1280,
  height: 800,
  landscapePhone: false,
};

function readPointer(): PointerKind {
  if (typeof window === "undefined") return "mouse";
  try {
    // "coarse" is the honest question — not "is this a phone" but "is the
    // thing pointing at my UI a finger". A tablet with a mouse answers
    // fine, and a touchscreen laptop that is being used with the trackpad
    // answers fine too, which is what we want.
    if (window.matchMedia("(pointer: coarse)").matches) return "touch";
    if (window.matchMedia("(any-pointer: fine)").matches) return "mouse";
  } catch {
    /* ancient browser — fall through */
  }
  return navigator.maxTouchPoints > 0 ? "touch" : "mouse";
}

function readPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent || "";
  if (/iPhone|iPod/.test(ua)) return "ios";
  // An iPad has said "Macintosh" since iPadOS 13. The touch points are the
  // giveaway, and getting this wrong would tell a tablet user to press a
  // key they do not have.
  if (/iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return "ios";
  if (/Android/.test(ua)) return "android";
  if (/Macintosh|Mac OS X/.test(ua)) return "mac";
  if (/Windows/.test(ua)) return "windows";
  if (/Linux|X11|CrOS/.test(ua)) return "linux";
  return "other";
}

function readSize(w: number): ScreenSize {
  if (w < 380) return "xs";
  if (w < 640) return "sm";
  if (w < 1024) return "md";
  return "lg";
}

export function readDevice(): DeviceInfo {
  if (typeof window === "undefined") return SERVER_DEFAULT;
  const width = window.innerWidth || SERVER_DEFAULT.width;
  const height = window.innerHeight || SERVER_DEFAULT.height;
  const pointer = readPointer();
  return {
    pointer,
    platform: readPlatform(),
    size: readSize(width),
    width,
    height,
    landscapePhone: pointer === "touch" && width > height && height < 500,
  };
}

/**
 * Live device facts. Re-reads on resize and on rotate, because both change
 * the answer — a phone turned sideways is a different layout problem, and
 * a desktop window dragged narrow deserves the same treatment as a tablet.
 */
export function useDevice(): DeviceInfo {
  // Starts at the SSR default so the server and the first client render
  // agree; the effect below corrects it immediately. Reading window during
  // render instead would be a hydration mismatch on every phone.
  const [info, setInfo] = useState<DeviceInfo>(SERVER_DEFAULT);

  useEffect(() => {
    let frame = 0;
    const read = () => {
      cancelAnimationFrame(frame);
      // One read per frame: a resize drag fires this dozens of times a
      // second and every one of them would re-render the page.
      frame = requestAnimationFrame(() => {
        const next = readDevice();
        /* Return the PREVIOUS object when nothing anyone reads has changed,
           so React bails out of the render entirely. readDevice() builds a
           fresh literal every call, so without this a phone's address bar
           sliding away re-rendered the whole floor page — 1700 lines and
           forty-odd unmemoised children — once per animation frame.

           `height` is deliberately not compared: nothing reads it directly.
           It reaches the UI only through landscapePhone (height < 500), and
           an address bar is nowhere near big enough to cross that in either
           orientation. */
        setInfo((prev) =>
          prev.pointer === next.pointer &&
          prev.platform === next.platform &&
          prev.size === next.size &&
          prev.width === next.width &&
          prev.landscapePhone === next.landscapePhone
            ? prev
            : next,
        );
      });
    };
    read();
    window.addEventListener("resize", read);
    window.addEventListener("orientationchange", read);
    let mq: MediaQueryList | null = null;
    try {
      mq = window.matchMedia("(pointer: coarse)");
      mq.addEventListener("change", read);
    } catch {
      /* no matchMedia — resize alone is enough */
    }
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", read);
      window.removeEventListener("orientationchange", read);
      try {
        mq?.removeEventListener("change", read);
      } catch {
        /* fine */
      }
    };
  }, []);

  return info;
}

/**
 * How this person walks, in their own words.
 *
 * Three variants rather than two. Touch and keyboard are genuinely
 * different controls. Mac and Windows are the SAME controls — the keys do
 * not move — so the only honest difference is what the pointing device is
 * called, and a Mac laptop user reading "click the mouse" has to translate
 * something that should not need translating.
 */
export interface ControlCopy {
  /** One line, for the tutorial and the first-run hint. */
  walk: string;
  /** How to open a stand you are standing next to. */
  interact: string;
  /** How to send a reaction. */
  react: string;
  /** Every line, for the help panel. */
  lines: string[];
  /** Shown as a <kbd> next to the interact hint, or "" for touch. */
  interactKey: string;
}

export function controlCopy(d: DeviceInfo): ControlCopy {
  if (d.pointer === "touch") {
    return {
      walk: "Drag anywhere to walk — or tap a spot to go straight there.",
      interact: "Walk up to a stand and tap it to see who's there.",
      react: "Use the reaction buttons along the bottom.",
      lines: [
        "Drag anywhere — walk",
        "Tap a spot — walk there",
        "Tap a stand you're next to — talk",
        "Buttons below — reactions and the map",
      ],
      interactKey: "",
    };
  }
  // Mac laptops: "click" is right, but the thing being clicked is a
  // trackpad for most of them, and naming it is the difference between an
  // instruction and a guess.
  const click = d.platform === "mac" ? "click the trackpad" : "click";
  return {
    walk: `WASD or the arrow keys — or ${click} where you want to go.`,
    interact: "Walk up to a stand and press E to see who's there.",
    react: "Press 1–8, or use the buttons below.",
    lines: [
      `WASD / arrow keys, or ${click} — walk`,
      "E — talk to the stand you're next to",
      "1–8 — reactions",
      "M — minimap",
    ],
    interactKey: "E",
  };
}
