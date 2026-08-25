/**
 * A recording 2D context that emits SVG.
 *
 * The booth art (game/boothArt.ts, game/decor.ts) is written against the
 * canvas API and runs in the browser. The public stand page and its OG
 * image need the same booth on the server, where there is no canvas — so
 * instead of re-illustrating anything, the REAL drawing functions run
 * against this shim and every fillRect they make becomes an SVG rect. The
 * output is the artwork by construction: there is no second copy of the
 * booth to drift.
 *
 * Only the surface those files actually use is implemented. If a new
 * drawing call is added to the art and not here, the render throws rather
 * than silently dropping paint — a booth missing its counter must never
 * ship as "looks fine to whoever didn't scroll".
 *
 * TEXT IS PIXELS. Canvas fillText resolves fonts on the viewer's machine;
 * an SVG rasterized by a crawler or an OG renderer has no such machine, so
 * lettering here is drawn from a 3x5 bitmap alphabet as rects — the same
 * move the game's own signs make visually, and the reason this file needs
 * no font anywhere. Sign text is short (12 chars caps) and uppercase, which
 * is exactly what a 3x5 alphabet is legible at.
 */

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** 3x5 bitmap alphabet. Rows top-down, "X" = pixel on. */
const PIXEL_FONT: Record<string, string[]> = {
  A: ["XXX", "X.X", "XXX", "X.X", "X.X"],
  B: ["XX.", "X.X", "XX.", "X.X", "XX."],
  C: ["XXX", "X..", "X..", "X..", "XXX"],
  D: ["XX.", "X.X", "X.X", "X.X", "XX."],
  E: ["XXX", "X..", "XX.", "X..", "XXX"],
  F: ["XXX", "X..", "XX.", "X..", "X.."],
  G: ["XXX", "X..", "X.X", "X.X", "XXX"],
  H: ["X.X", "X.X", "XXX", "X.X", "X.X"],
  I: ["XXX", ".X.", ".X.", ".X.", "XXX"],
  J: ["..X", "..X", "..X", "X.X", "XXX"],
  K: ["X.X", "XX.", "X..", "XX.", "X.X"],
  L: ["X..", "X..", "X..", "X..", "XXX"],
  M: ["X.X", "XXX", "XXX", "X.X", "X.X"],
  N: ["X.X", "XXX", "XXX", "XXX", "X.X"],
  O: ["XXX", "X.X", "X.X", "X.X", "XXX"],
  P: ["XXX", "X.X", "XXX", "X..", "X.."],
  Q: ["XXX", "X.X", "X.X", "XXX", "..X"],
  R: ["XXX", "X.X", "XX.", "XX.", "X.X"],
  S: ["XXX", "X..", "XXX", "..X", "XXX"],
  T: ["XXX", ".X.", ".X.", ".X.", ".X."],
  U: ["X.X", "X.X", "X.X", "X.X", "XXX"],
  V: ["X.X", "X.X", "X.X", "X.X", ".X."],
  W: ["X.X", "X.X", "XXX", "XXX", "X.X"],
  X: ["X.X", "X.X", ".X.", "X.X", "X.X"],
  Y: ["X.X", "X.X", ".X.", ".X.", ".X."],
  Z: ["XXX", "..X", ".X.", "X..", "XXX"],
  "0": ["XXX", "X.X", "X.X", "X.X", "XXX"],
  "1": [".X.", "XX.", ".X.", ".X.", "XXX"],
  "2": ["XXX", "..X", "XXX", "X..", "XXX"],
  "3": ["XXX", "..X", "XXX", "..X", "XXX"],
  "4": ["X.X", "X.X", "XXX", "..X", "..X"],
  "5": ["XXX", "X..", "XXX", "..X", "XXX"],
  "6": ["XXX", "X..", "XXX", "X.X", "XXX"],
  "7": ["XXX", "..X", "..X", ".X.", ".X."],
  "8": ["XXX", "X.X", "XXX", "X.X", "XXX"],
  "9": ["XXX", "X.X", "XXX", "..X", "XXX"],
  " ": ["...", "...", "...", "...", "..."],
  ".": ["...", "...", "...", "...", ".X."],
  ",": ["...", "...", "...", ".X.", "X.."],
  "-": ["...", "...", "XXX", "...", "..."],
  "'": [".X.", ".X.", "...", "...", "..."],
  "&": [".X.", "X.X", ".X.", "X.X", ".XX"],
  "+": ["...", ".X.", "XXX", ".X.", "..."],
  "!": [".X.", ".X.", ".X.", "...", ".X."],
  "?": ["XX.", "..X", ".X.", "...", ".X."],
  "/": ["..X", "..X", ".X.", "X..", "X.."],
  ":": ["...", ".X.", "...", ".X.", "..."],
  "#": ["X.X", "XXX", "X.X", "XXX", "X.X"],
};

export class SvgCtx {
  fillStyle = "#000000";
  strokeStyle = "#000000";
  lineWidth = 1;
  font = "10px sans-serif";
  textAlign: "left" | "center" | "right" | "start" | "end" = "left";
  textBaseline: "top" | "middle" | "alphabetic" | "bottom" = "alphabetic";
  globalAlpha = 1;
  imageSmoothingEnabled = false;

  private parts: string[] = [];
  private stack: Array<{ fillStyle: string; strokeStyle: string; lineWidth: number; globalAlpha: number }> = [];
  private path: string[] = [];

  private alpha(): string {
    return this.globalAlpha < 1 ? ` opacity="${this.globalAlpha.toFixed(3)}"` : "";
  }

  save(): void {
    this.stack.push({
      fillStyle: this.fillStyle,
      strokeStyle: this.strokeStyle,
      lineWidth: this.lineWidth,
      globalAlpha: this.globalAlpha,
    });
  }

  restore(): void {
    const s = this.stack.pop();
    if (s) Object.assign(this, s);
  }

  fillRect(x: number, y: number, w: number, h: number): void {
    if (w <= 0 || h <= 0) return;
    this.parts.push(
      `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" fill="${esc(String(this.fillStyle))}"${this.alpha()}/>`,
    );
  }

  strokeRect(x: number, y: number, w: number, h: number): void {
    this.parts.push(
      `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" fill="none" stroke="${esc(String(this.strokeStyle))}" stroke-width="${this.lineWidth}"${this.alpha()}/>`,
    );
  }

  beginPath(): void {
    this.path = [];
  }
  moveTo(x: number, y: number): void {
    this.path.push(`M${r2(x)} ${r2(y)}`);
  }
  lineTo(x: number, y: number): void {
    this.path.push(`L${r2(x)} ${r2(y)}`);
  }
  closePath(): void {
    this.path.push("Z");
  }
  fill(): void {
    if (!this.path.length) return;
    this.parts.push(`<path d="${this.path.join(" ")}" fill="${esc(String(this.fillStyle))}"${this.alpha()}/>`);
  }
  stroke(): void {
    if (!this.path.length) return;
    this.parts.push(
      `<path d="${this.path.join(" ")}" fill="none" stroke="${esc(String(this.strokeStyle))}" stroke-width="${this.lineWidth}"${this.alpha()}/>`,
    );
  }

  /**
   * Lettering, drawn as pixels from the 3x5 alphabet above.
   *
   * The scale comes off the font size the caller already set (a "9px" sign
   * paints 1px-a-pixel; anything larger scales up in whole pixels so it
   * stays crisp), and maxWidth is honoured the same way canvas honours it:
   * by squeezing — here, by dropping to a smaller whole-pixel scale, then
   * truncating if a single pixel per dot still cannot fit.
   */
  fillText(text: string, x: number, y: number, maxWidth?: number): void {
    const chars = String(text).toUpperCase().split("");
    const sizeMatch = /(\d+(?:\.\d+)?)px/.exec(this.font);
    const px = sizeMatch ? Number(sizeMatch[1]) : 10;
    let scale = Math.max(1, Math.round(px / 7));
    const widthAt = (s: number): number => chars.length * 4 * s - s;
    if (maxWidth !== undefined) {
      while (scale > 1 && widthAt(scale) > maxWidth) scale--;
      while (chars.length > 1 && widthAt(scale) > maxWidth) chars.pop();
    }
    const w = widthAt(scale);
    const h = 5 * scale;
    let ox = x;
    if (this.textAlign === "center") ox = x - w / 2;
    else if (this.textAlign === "right" || this.textAlign === "end") ox = x - w;
    let oy = y;
    if (this.textBaseline === "middle") oy = y - h / 2;
    else if (this.textBaseline === "alphabetic" || this.textBaseline === "bottom") oy = y - h;
    ox = Math.round(ox);
    oy = Math.round(oy);
    for (let i = 0; i < chars.length; i++) {
      const glyph = PIXEL_FONT[chars[i]] ?? PIXEL_FONT["?"];
      for (let gy = 0; gy < 5; gy++) {
        for (let gx = 0; gx < 3; gx++) {
          if (glyph[gy][gx] !== "X") continue;
          this.parts.push(
            `<rect x="${ox + (i * 4 + gx) * scale}" y="${oy + gy * scale}" width="${scale}" height="${scale}" fill="${esc(String(this.fillStyle))}"${this.alpha()}/>`,
          );
        }
      }
    }
  }

  /** Uploaded booth logos arrive as data-URL images; anything with a src embeds. */
  drawImage(img: unknown, x: number, y: number, w: number, h: number): void {
    const src =
      img && typeof img === "object" && typeof (img as { src?: unknown }).src === "string"
        ? (img as { src: string }).src
        : null;
    if (!src || !src.startsWith("data:image/")) return;
    this.parts.push(
      `<image href="${esc(src)}" x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" image-rendering="pixelated"${this.alpha()}/>`,
    );
  }

  /** The recorded shapes alone, for callers composing their own <svg>. */
  body(): string {
    return this.parts.join("");
  }

  /** The recorded drawing, offset by (dx, dy) inside a w x h viewBox. */
  toSvg(w: number, h: number, dx = 0, dy = 0): string {
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" shape-rendering="crispEdges">` +
      `<g transform="translate(${r2(dx)} ${r2(dy)})">` +
      this.parts.join("") +
      `</g></svg>`
    );
  }
}

const r2 = (n: number): number => Math.round(n * 100) / 100;
