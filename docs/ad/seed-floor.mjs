/**
 * Populates the local Main Hall for the promo shoot: eleven claimed stands,
 * four founders standing their own stands, two visitors doing the rounds,
 * ambient chatter and guestbook lines. Long-lived — run it in the
 * background, shoot against it, then kill it.
 *
 * Every stand here is demo content on a throwaway local server. Nothing is
 * written to the real floor.
 */
import WebSocket from "ws";

const WS = `${process.env.FF_WS || "ws://127.0.0.1:3105/ws"}?floor=main-hall`;
const TILE = 32;
const px = (t) => Math.round(t * TILE + TILE / 2);
const rnd = (n) => Math.floor(Math.random() * n);
const pick = (a) => a[rnd(a.length)];
const hex = () =>
  Array.from({ length: 32 }, () => "0123456789abcdef"[rnd(16)]).join("");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// spot index -> top-left tile of the 4x3 zone (main-hall, 12 spots)
const SPOTS = [
  { x: 3, y: 3 }, { x: 11, y: 3 }, { x: 19, y: 3 }, { x: 27, y: 3 },
  { x: 3, y: 13 }, { x: 11, y: 13 }, { x: 19, y: 13 }, { x: 27, y: 13 },
  { x: 3, y: 21 }, { x: 11, y: 21 }, { x: 19, y: 21 }, { x: 27, y: 21 },
];

// spot 11 is deliberately left open — it is the one claimed on camera.
const STANDS = [
  { spot: 0, name: "Saltbox", one: "Self-hosted analytics in one binary", founder: "Ines Okonkwo", cat: "Devtools", goal: "First 10 customers", sign: "SALTBOX", glyph: "chip", carpet: "#2F5D50", banner: "#1F3D34", style: "arcade", props: ["plant"] },
  { spot: 1, name: "Tallyroom", one: "Invoicing built for freelance designers", founder: "Marta Reyes", cat: "Fintech", goal: "First dollar", sign: "TALLY", glyph: "coin", carpet: "#7A611F", banner: "#B08D2E", props: ["trophy"] },
  { spot: 2, name: "Halfmoon", one: "Sleep tracking without a wearable", founder: "Jonas Wirth", cat: "Health", goal: "Ship the beta", sign: "HALFMOON", glyph: "wave", carpet: "#3B4C7A", banner: "#26325A", pattern: "stripes" },
  { spot: 3, name: "Pinecrate", one: "Warehouse tracking for one-person brands", founder: "Dee Alvarez", cat: "Ops", goal: "First 10 customers", sign: "PINECRATE", glyph: "cube", carpet: "#6B4A2E", banner: "#8A5B33", props: ["plant"] },
  { spot: 4, name: "Loomcast", one: "Turns your changelog into a weekly video", founder: "Ari Benhaim", cat: "Media", goal: "Find a co-founder", sign: "LOOMCAST", glyph: "bolt", carpet: "#7A2E3B", banner: "#A8384A", style: "bigtop", seeking: true, live: "Ari", route: [[5, 17], [5, 20], [10, 20], [10, 17]], look: { skin: 2, outfit: 5, hair: 3 } },
  { spot: 5, name: "Bramble", one: "A garden planner that knows your frost dates", founder: "Nell Farrow", cat: "Consumer", goal: "First dollar", sign: "BRAMBLE", glyph: "leaf", carpet: "#4B7A2E", banner: "#3A5F24", style: "garden", props: ["plant", "balloons"], live: "Nell", route: [[13, 17], [13, 19], [18, 19], [18, 17]], look: { skin: 0, outfit: 1, hair: 4 } },
  { spot: 6, name: "Northline", one: "A hiring pipeline for teams under ten", founder: "Sam Oduya", cat: "HR", goal: "First 10 customers", sign: "NORTHLINE", glyph: "star", carpet: "#37474F", banner: "#22303A", pattern: "border", live: "Sam", route: [[21, 17], [27, 17], [27, 20], [21, 20]], look: { skin: 3, outfit: 4, hair: 0 } },
  { spot: 7, name: "Marrow", one: "Bone broth, delivered frozen, no subscription", founder: "Lena Voss", cat: "Consumer", goal: "Find a co-founder", sign: "MARROW", glyph: "heart", carpet: "#8A3B4C", banner: "#5E2733", props: ["balloons"], seeking: true },
  { spot: 8, name: "Cobbler", one: "Dinner from whatever is in your fridge", founder: "Priya Nandi", cat: "Consumer", goal: "Ship the beta", sign: "COBBLER", glyph: "flask", carpet: "#A8541F", banner: "#D9480F", props: ["balloons"], live: "Priya", route: [[5, 25], [12, 25], [12, 26], [5, 26]], look: { skin: 4, outfit: 2, hair: 1 } },
  { spot: 9, name: "Kestrel", one: "Flight-delay refunds, filed automatically", founder: "Tom Kelder", cat: "Fintech", goal: "First dollar", sign: "KESTREL", glyph: "rocket", carpet: "#2B3A67", banner: "#4056A1", style: "neon" },
  { spot: 10, name: "Ledgerbird", one: "Bookkeeping that reads your bank feed", founder: "Otto Lind", cat: "Fintech", goal: "Ship the beta", sign: "LEDGER", glyph: "coin", carpet: "#2F4858", banner: "#1B2E38", pattern: "border", props: ["spotlight"] },
];

// people doing the rounds without a stand of their own
const VISITORS = [
  { name: "Dee", look: { skin: 1, outfit: 3, hair: 2 }, route: [[8, 9], [16, 9], [16, 11], [8, 11]] },
  { name: "Otto", look: { skin: 2, outfit: 0, hair: 5 }, route: [[24, 10], [30, 10], [30, 8], [24, 8]] },
];

const LINES = [
  "what are you building?",
  "we shipped v2 this morning",
  "how did you find your first ten users?",
  "that landing page is clean",
  "same problem, different industry",
  "come by the stand, I'll show you",
  "who did you use for payments?",
  "yes — send it over",
  "we're at the far end if you want a demo",
];

const GUEST_LINES = [
  "Great pitch — following along.",
  "Signed up. Ping me when the beta opens.",
  "This is the tidiest onboarding I've seen all week.",
  "Met you at the last demo night — still rooting for you.",
  "Left you a note about the pricing page.",
];

function connect(firstFrame) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS);
    ws.on("error", reject);
    ws.on("open", () => ws.send(JSON.stringify(firstFrame)));
    ws.on("message", (buf) => {
      const ev = JSON.parse(buf.toString());
      if (ev.t === "welcome") resolve(ws);
    });
    setTimeout(() => reject(new Error("ws timeout")), 8000);
  });
}

function claimFrame(s, id, at) {
  return {
    t: "join",
    player: {
      id,
      name: s.live ?? s.founder.split(" ")[0],
      look: s.look ?? { skin: rnd(5), outfit: rnd(7), hair: rnd(7) },
    },
    gs: hex(),
    s: { x: px(at.x), y: px(at.y), dir: "down", moving: false },
    claim: {
      spotIndex: s.spot,
      startup: {
        id,
        name: s.name,
        oneLiner: s.one,
        founder: s.founder,
        category: s.cat,
        goal: s.goal,
        goalProgress: 0.15 + Math.random() * 0.6,
        verifiedRevenue: 0,
        seekingCofounder: s.seeking === true,
        booth: {
          carpet: s.carpet,
          banner: s.banner,
          sign: s.sign,
          glyph: s.glyph,
          pattern: s.pattern ?? "solid",
          style: s.style,
          props: s.props,
        },
      },
    },
    claimFresh: true,
  };
}

// ---- 1. the stands that are up while their founder is away ----
const live = [];
for (const s of STANDS) {
  const id = `demo-${s.name.toLowerCase()}`;
  const spot = SPOTS[s.spot];
  const home = s.route ? { x: s.route[0][0], y: s.route[0][1] } : { x: spot.x + 1, y: spot.y + 4 };
  const ws = await connect(claimFrame(s, id, home));
  if (s.live) {
    live.push({ ws, name: s.live, route: s.route, x: px(home.x), y: px(home.y), leg: 0 });
  } else {
    await sleep(100);
    ws.close();
  }
  await sleep(120);
}
console.log(`[seed] ${STANDS.length} stands planted, ${live.length} founders standing them`);

// ---- 2. visitors doing the rounds ----
for (const v of VISITORS) {
  const start = v.route[0];
  const ws = await connect({
    t: "join",
    player: { id: `visitor-${v.name.toLowerCase()}`, name: v.name, look: v.look },
    gs: hex(),
    s: { x: px(start[0]), y: px(start[1]), dir: "down", moving: false },
  });
  live.push({ ws, name: v.name, route: v.route, x: px(start[0]), y: px(start[1]), leg: 0 });
  await sleep(120);
}
console.log(`[seed] ${live.length} people on the floor`);

// ---- 3. guestbook lines: run sign-books.mjs once after this comes up.
// (The server drops more than two signs per second per client, so signing
// lives in its own paced script rather than in this loop.) ----

// ---- 4. keep everyone moving and talking ----
const SPEED = 82; // px/s — a shade slower than the player: strolling, not racing
const STEP = 100;

setInterval(() => {
  for (const p of live) {
    const goal = p.route[(p.leg + 1) % p.route.length];
    const gx = px(goal[0]);
    const gy = px(goal[1]);
    const dx = gx - p.x;
    const dy = gy - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 4) {
      p.leg = (p.leg + 1) % p.route.length;
      p.ws.send(JSON.stringify({ t: "move", s: { x: p.x, y: p.y, dir: "down", moving: false } }));
      continue;
    }
    const step = Math.min(dist, (SPEED * STEP) / 1000);
    p.x += (dx / dist) * step;
    p.y += (dy / dist) * step;
    const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
    p.ws.send(JSON.stringify({
      t: "move",
      s: { x: Math.round(p.x), y: Math.round(p.y), dir, moving: true },
    }));
  }
}, STEP);

setInterval(() => {
  pick(live).ws.send(JSON.stringify({ t: "chat", text: pick(LINES), scope: "floor" }));
}, 3800);
setInterval(() => {
  pick(live).ws.send(JSON.stringify({
    t: "emote",
    kind: pick(["wave", "clap", "rocket", "fire", "handshake", "heart"]),
  }));
}, 5200);

console.log("[seed] live — kill the pid in seed.pid to stop");
