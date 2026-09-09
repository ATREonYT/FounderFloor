/**
 * A generated app, running. The mock-up's HTML in a web view on the phone
 * and an iframe on the web, sized by the caller, with the screen index
 * driven from outside (a chip) and reported back (a tap inside). The
 * outer View takes the ref so the whole thing can be captured as a
 * picture. The web view module is loaded only on the phone.
 */
import { forwardRef, useEffect, useRef, createElement } from "react";
import { Platform, View } from "react-native";

export const LiveMock = forwardRef<View, { html: string; width: number; height: number; screen?: number; onScreen?: (i: number) => void; radius?: number; /** The page's own width in CSS pixels (a phone is 390); on the web the frame is scaled to fit, the way the phone's viewport meta does natively. */ pageWidth?: number }>(function LiveMock({ html, width, height, screen = 0, onScreen, radius = 0, pageWidth = 390 }, ref) {
  const web = Platform.OS === "web";
  const frame = useRef<{ contentWindow?: { postMessage: (m: unknown, o: string) => void } } | null>(null);
  const native = useRef<{ injectJavaScript: (js: string) => void } | null>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (web) frame.current?.contentWindow?.postMessage({ go: screen }, "*");
    else native.current?.injectJavaScript(`window.__go && window.__go(${screen}); true;`);
  }, [screen, web]);
  useEffect(() => {
    if (!web || typeof window === "undefined") return;
    const on = (e: MessageEvent) => {
      const d = e.data as { mock?: number } | null;
      if (d && typeof d.mock === "number" && e.source === frame.current?.contentWindow) onScreen?.(d.mock);
    };
    window.addEventListener("message", on);
    return () => window.removeEventListener("message", on);
  }, [web, onScreen]);
  return (
    <View ref={ref} collapsable={false} style={{ width, height, borderRadius: radius, overflow: "hidden", backgroundColor: "#fff" }}>
      {web ? (
        createElement("iframe", { ref: frame, srcDoc: html, sandbox: "allow-scripts", scrolling: "no", style: { width: pageWidth, height: height / (width / pageWidth), flexShrink: 0, flexGrow: 0, border: 0, display: "block", background: "#fff", transform: `scale(${width / pageWidth})`, transformOrigin: "0 0" } })
      ) : (
        <NativeWeb html={html} width={width} height={height} onScreen={onScreen} handle={native} />
      )}
    </View>
  );
});

function NativeWeb({ html, width, height, onScreen, handle }: { html: string; width: number; height: number; onScreen?: (i: number) => void; handle: React.MutableRefObject<{ injectJavaScript: (js: string) => void } | null> }) {
  // required lazily so the web bundle never sees the native module
  const { WebView } = require("react-native-webview") as typeof import("react-native-webview");
  return (
    <WebView
      ref={(r) => {
        handle.current = r;
      }}
      source={{ html }}
      originWhitelist={["*"]}
      scrollEnabled={false}
      bounces={false}
      showsVerticalScrollIndicator={false}
      onMessage={(e) => {
        const n = Number(e.nativeEvent.data);
        if (!Number.isNaN(n)) onScreen?.(n);
      }}
      style={{ width, height, backgroundColor: "#fff" }}
      containerStyle={{ width, height }}
    />
  );
}
