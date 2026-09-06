/**
 * founderfloor-mcp — stdio server for Claude Code, Cursor, Windsurf.
 *
 *   FOUNDERFLOOR_STORE=file            (default) ~/.founderfloor/stand.json
 *   FOUNDERFLOOR_FILE=/path/to.json    override the file
 *   FOUNDERFLOOR_STORE=supabase        with FOUNDERFLOOR_SUPABASE_URL,
 *                                      FOUNDERFLOOR_SUPABASE_ANON_KEY and
 *                                      FOUNDERFLOOR_TOKEN (the app's JWT)
 *
 * Claude Code:  claude mcp add founderfloor -- npx -y @founderfloor/mcp
 */
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { homedir } from "node:os";
import { join } from "node:path";
import { createServer } from "./server.ts";
import { FileStore, SupabaseStore, type Store } from "./store.ts";

const env = process.env;
let store: Store;
if (env.FOUNDERFLOOR_STORE === "supabase") {
  const url = env.FOUNDERFLOOR_SUPABASE_URL, anon = env.FOUNDERFLOOR_SUPABASE_ANON_KEY, jwt = env.FOUNDERFLOOR_TOKEN;
  if (!url || !anon || !jwt) {
    console.error("FOUNDERFLOOR_STORE=supabase needs FOUNDERFLOOR_SUPABASE_URL, FOUNDERFLOOR_SUPABASE_ANON_KEY and FOUNDERFLOOR_TOKEN.");
    process.exit(2);
  }
  store = new SupabaseStore(url, anon, jwt);
} else {
  store = new FileStore(env.FOUNDERFLOOR_FILE ?? join(homedir(), ".founderfloor", "stand.json"));
}
const server = createServer(store);
await server.connect(new StdioServerTransport());
