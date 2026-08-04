/**
 * The store: what we have already seen, and what we decided about it.
 *
 * Two append-only JSONL files, no database. A listener that runs four times
 * a day for a year writes a few thousand lines; anything heavier than a
 * file would be pretending.
 *
 *   seen.jsonl   every item id we have ever scored, so nothing is shown twice
 *   leads.jsonl  the ones that scored high enough, with their state
 *
 * A lead's state is the whole point of this tool being a queue rather than
 * a robot: "new" until a human looks at it, then "replied" or "skipped".
 * Nothing in this codebase ever moves a lead out of "new" on its own.
 */

import { appendFileSync, mkdirSync, readFileSync, existsSync, writeFileSync, renameSync } from "node:fs";
import { join } from "node:path";

/**
 * Write via a temporary file in the same directory, then rename over the
 * target. Rename is atomic within a filesystem, so an interruption mid-write
 * leaves the old file intact instead of a truncated queue. These files are
 * the only record of who has already been contacted; losing one to a badly
 * timed restart is not acceptable.
 */
function atomicWrite(path, contents) {
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, contents);
  renameSync(tmp, path);
}

export class Store {
  constructor(dir) {
    this.dir = dir;
    this.seenPath = join(dir, "seen.jsonl");
    this.leadsPath = join(dir, "leads.jsonl");
    mkdirSync(dir, { recursive: true });
    this.seen = new Set(readJsonl(this.seenPath).map((r) => r.key));
    this.leads = readJsonl(this.leadsPath);
  }

  /** Stable identity for an item across runs: source plus the source's own id. */
  static key(item) {
    return `${item.source}:${item.id}`;
  }

  has(item) {
    return this.seen.has(Store.key(item));
  }

  /** Record that we have looked at this item, whether or not it became a lead. */
  markSeen(item, at = new Date().toISOString()) {
    const key = Store.key(item);
    if (this.seen.has(key)) return false;
    this.seen.add(key);
    appendFileSync(this.seenPath, JSON.stringify({ key, at }) + "\n");
    return true;
  }

  addLead(lead) {
    const rec = { ...lead, state: "new", foundAt: new Date().toISOString() };
    this.leads.push(rec);
    appendFileSync(this.leadsPath, JSON.stringify(rec) + "\n");
    return rec;
  }

  /**
   * Set a lead's state. Rewrites the file, which is fine at this size and
   * keeps the format a human can open and edit by hand.
   */
  setState(key, state, note = "") {
    let hit = false;
    this.leads = this.leads.map((l) => {
      if (Store.key(l) !== key) return l;
      hit = true;
      return { ...l, state, note, stateAt: new Date().toISOString() };
    });
    if (hit) atomicWrite(this.leadsPath, this.leads.map((l) => JSON.stringify(l)).join("\n") + "\n");
    return hit;
  }

  pending() {
    return this.leads.filter((l) => l.state === "new");
  }

  /**
   * Enforce retention in code, because a retention policy that lives only in
   * a README is not a retention policy.
   *
   * Leads hold the post text and the author's handle: that is personal data
   * about someone who never contacted you, so it goes after `leadDays`
   * whatever its state. The seen-set holds ids only — no text, no names — and
   * exists purely so a post is not surfaced twice, so it can live longer, but
   * it is still bounded rather than growing for the life of the machine.
   *
   * @returns {{leads: number, seen: number}} how many records were dropped
   */
  prune({ leadDays = 60, seenDays = 180 } = {}) {
    const leadCut = Date.now() - leadDays * 864e5;
    const seenCut = Date.now() - seenDays * 864e5;

    const keptLeads = this.leads.filter((l) => {
      const t = Date.parse(l.foundAt || l.createdAt || "");
      return !Number.isFinite(t) || t >= leadCut;
    });
    const droppedLeads = this.leads.length - keptLeads.length;
    if (droppedLeads) {
      this.leads = keptLeads;
      atomicWrite(this.leadsPath, keptLeads.length ? keptLeads.map((l) => JSON.stringify(l)).join("\n") + "\n" : "");
    }

    const seenRows = readJsonl(this.seenPath);
    const keptSeen = seenRows.filter((r) => {
      const t = Date.parse(r.at || "");
      return !Number.isFinite(t) || t >= seenCut;
    });
    const droppedSeen = seenRows.length - keptSeen.length;
    if (droppedSeen) {
      atomicWrite(this.seenPath, keptSeen.length ? keptSeen.map((r) => JSON.stringify(r)).join("\n") + "\n" : "");
      this.seen = new Set(keptSeen.map((r) => r.key));
    }

    return { leads: droppedLeads, seen: droppedSeen };
  }

  stats() {
    const by = (s) => this.leads.filter((l) => l.state === s).length;
    return {
      seen: this.seen.size,
      leads: this.leads.length,
      new: by("new"),
      replied: by("replied"),
      skipped: by("skipped"),
    };
  }
}

function readJsonl(path) {
  if (!existsSync(path)) return [];
  const out = [];
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t) continue;
    try {
      out.push(JSON.parse(t));
    } catch {
      // A half-written final line after a crash is not worth losing the
      // rest of the file over.
    }
  }
  return out;
}
