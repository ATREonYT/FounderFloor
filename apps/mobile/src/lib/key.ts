/**
 * THE FOUNDER'S OWN KEY — a setting, never a gate.
 *
 * What turns the staff on is Pro, bought in the App Store, and then
 * FounderFloor pays for the words. This file is for the handful of
 * founders who already have an Anthropic key and would rather the words
 * came off their own account. It changes WHO PAYS, not what the app can
 * do: the plan still decides which coaches answer, whether they keep
 * notes, and how many drafts a month.
 *
 * Research (docs/research/what-people-want.md): a beginner cannot get a
 * key. It is a separate developer account, a card, prepaid credit, and
 * then the first thing they see is a raw quota error ("Seems like i need
 * to bind a credit card first"). People who pay for ChatGPT Plus or
 * Claude Pro think that is the key; it is not. So: one field, tested the
 * moment it is pasted, and every answer in plain words. Never a JSON
 * error, never a gate in front of the road.
 *
 * The key goes to the keychain (SecureStore), never to disk, never to a
 * server, never into the notebook.
 */
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

const SLOT = "ff.own.key";

const vault = {
  async get(): Promise<string | null> {
    if (Platform.OS === "web") {
      try {
        return globalThis.sessionStorage?.getItem(SLOT) ?? null;
      } catch {
        return null;
      }
    }
    try {
      return await SecureStore.getItemAsync(SLOT);
    } catch {
      return null;
    }
  },
  async set(v: string): Promise<void> {
    if (Platform.OS === "web") {
      try {
        globalThis.sessionStorage?.setItem(SLOT, v);
      } catch {}
      return;
    }
    await SecureStore.setItemAsync(SLOT, v);
  },
  async del(): Promise<void> {
    if (Platform.OS === "web") {
      try {
        globalThis.sessionStorage?.removeItem(SLOT);
      } catch {}
      return;
    }
    try {
      await SecureStore.deleteItemAsync(SLOT);
    } catch {}
  },
};

interface KeyState {
  /** The key itself, or null. Read synchronously by aiMode(). */
  key: string | null;
  /** True once the keychain has been read, so the first render does not flicker. */
  ready: boolean;
  load(): Promise<void>;
  keep(k: string): Promise<void>;
  forget(): Promise<void>;
}

export const useKey = create<KeyState>()((set) => ({
  key: null,
  ready: false,
  load: async () => set({ key: await vault.get(), ready: true }),
  keep: async (k) => {
    await vault.set(k);
    set({ key: k, ready: true });
  },
  forget: async () => {
    await vault.del();
    set({ key: null, ready: true });
  },
}));

/** The key in the keychain right now, for the sync path in ai.ts. */
export const ownKey = (): string | null => useKey.getState().key;

/** The last four characters, for showing a key back without showing it. */
export const keyTail = (k: string): string => `sk-ant…${k.slice(-4)}`;

export interface KeyVerdict {
  ok: boolean;
  /** One sentence a beginner can act on. Never an error code. */
  say: string;
  /** Where to go if there is something to do. */
  door?: { label: string; url: string };
}

const CONSOLE = "https://console.anthropic.com/settings/keys";
const BILLING = "https://console.anthropic.com/settings/billing";

/** What is wrong with the shape of a key, before spending a call on it. */
export function readKey(raw: string): KeyVerdict | null {
  const k = raw.trim();
  if (!k) return { ok: false, say: "Paste the key first." };
  if (k.startsWith("sk-ant-")) return null;
  if (/^sk-proj-|^sk-[A-Za-z0-9]{20,}/.test(k)) {
    return { ok: false, say: "That looks like an OpenAI key. The desk talks to Claude, so it needs a key that starts with sk-ant.", door: { label: "Where Claude keys live", url: CONSOLE } };
  }
  if (/^(claude|chatgpt|gpt|Bearer)/i.test(k) || k.includes("@") || k.includes(" ")) {
    return { ok: false, say: "That is not a key. A key is a long line starting with sk-ant, made in the Claude developer console. It is not your Claude or ChatGPT login.", door: { label: "Make a key", url: CONSOLE } };
  }
  return { ok: false, say: "A key starts with sk-ant. This one does not, so it would be refused.", door: { label: "Make a key", url: CONSOLE } };
}

/**
 * Spend one token to find out whether the key really works, and say the
 * answer the way a person would. The three real outcomes a beginner hits
 * are: the key is wrong, the key is right but the account has no money on
 * it, and the key is fine.
 */
export async function testKey(raw: string, model: string): Promise<KeyVerdict> {
  const shape = readKey(raw);
  if (shape) return shape;
  const k = raw.trim();
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": k, "anthropic-version": "2023-06-01", ...(Platform.OS === "web" ? { "anthropic-dangerous-direct-browser-access": "true" } : {}) },
      body: JSON.stringify({ model, max_tokens: 1, messages: [{ role: "user", content: "hi" }] }),
    });
    if (res.ok) return { ok: true, say: "The key works. From now on the staff answer on your account." };
    let detail = "";
    try {
      detail = ((await res.json()) as { error?: { message?: string } }).error?.message ?? "";
    } catch {}
    if (res.status === 401 || res.status === 403) return { ok: false, say: "That key was refused. Check the whole line was copied, or make a new one.", door: { label: "Your keys", url: CONSOLE } };
    if (res.status === 400 && /credit|billing|balance|fund/i.test(detail)) return { ok: false, say: "The key is real, but the account behind it has no money on it yet. Five dollars is months of coaching.", door: { label: "Add credit", url: BILLING } };
    if (res.status === 429) return { ok: false, say: "The key works, but the account is rate limited just now. Try again in a minute." };
    if (res.status === 404) return { ok: false, say: "The key works, but this account cannot use the model the desk asks for yet. New accounts are limited for a few days." };
    if (/credit|billing|balance/i.test(detail)) return { ok: false, say: "The key is real, but the account behind it has no money on it yet.", door: { label: "Add credit", url: BILLING } };
    return { ok: false, say: "The key did not work, and the reason was not clear. Try making a fresh one.", door: { label: "Your keys", url: CONSOLE } };
  } catch {
    return { ok: false, say: "Could not reach Claude to test the key. Check the phone is online and try again." };
  }
}
