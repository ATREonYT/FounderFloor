// Shared: plate metadata plus how many PNGs each sequence actually has.
import { readFileSync, readdirSync } from "node:fs";
export function loadPlates(root = "..") {
  const list = JSON.parse(readFileSync(`${root}/plates.json`, "utf8"));
  return Object.fromEntries(
    list.map((p) => [
      p.name,
      { ...p, frames: readdirSync(`frames/${p.name}`).length },
    ]),
  );
}
