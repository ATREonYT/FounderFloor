// Guestbook lines for every stand — two signers, paced under the server's
// 2-signs-per-second-per-client limit.
import WebSocket from "ws";

const WS = `${process.env.FF_WS || "ws://127.0.0.1:3105/ws"}?floor=main-hall`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rnd = (n) => Math.floor(Math.random() * n);
const hex = () => Array.from({ length: 32 }, () => "0123456789abcdef"[rnd(16)]).join("");

const SIGNERS = [
  { id: "signer-mira", name: "Mira", look: { skin: 3, outfit: 6, hair: 2 } },
  { id: "signer-yuki", name: "Yuki", look: { skin: 1, outfit: 2, hair: 6 } },
];
// One pool per signer, so no stand ever shows the same line twice.
const LINES = {
  "signer-mira": [
    "Great pitch — following along.",
    "Sent this to a friend with exactly this problem.",
    "The demo sold it. Nice work.",
    "Come find me at Demo Night, I have notes.",
    "Bought it on the spot. No notes.",
  ],
  "signer-yuki": [
    "Signed up. Ping me when the beta opens.",
    "Tidiest onboarding I've seen all week.",
    "Met you at the last Demo Night — still rooting for you.",
    "Left you a note about the pricing page.",
    "Two of my customers need this. Emailing you.",
  ],
};
const SPOTS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function connect(frame) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS);
    ws.on("error", reject);
    ws.on("open", () => ws.send(JSON.stringify(frame)));
    ws.on("message", (b) => {
      if (JSON.parse(b.toString()).t === "welcome") resolve(ws);
    });
    setTimeout(() => reject(new Error("timeout")), 8000);
  });
}

for (const s of SIGNERS) {
  const ws = await connect({
    t: "join",
    player: { id: s.id, name: s.name, look: s.look },
    gs: hex(),
    s: { x: 520, y: 360, dir: "down", moving: false },
  });
  const pool = LINES[s.id];
  for (const [i, spot] of SPOTS.entries()) {
    ws.send(JSON.stringify({
      t: "sign",
      key: `spot:${spot}`,
      text: pool[i % pool.length],
      boothName: `spot ${spot}`,
    }));
    await sleep(600); // under 2/s
  }
  await sleep(400);
  ws.close();
  await sleep(300);
  console.log(`[sign] ${s.name} signed ${SPOTS.length} books`);
}
console.log("DONE");
