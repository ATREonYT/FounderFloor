# @founderfloor/mcp

FounderFloor as an MCP server. An agent building the founder's product —
Claude Code, Cursor, Windsurf, anything that speaks MCP — reads the stand,
the interview book, the drawer and the workshop, and writes back what
shipped. Nothing is copied between the app and the terminal, and the build
happens on the founder's own account, not on FounderFloor's tokens.

## Add it to Claude Code

```bash
claude mcp add founderfloor -- node /path/to/founderfloor/packages/mcp/bin/founderfloor-mcp.mjs
```

Then, in any project: *"Read my FounderFloor stand and build the first
version from the brief."*

By default the stand lives in `~/.founderfloor/stand.json` on the laptop.
With a FounderFloor account it lives in Supabase, shared with the app:

```bash
claude mcp add founderfloor \
  -e FOUNDERFLOOR_STORE=supabase \
  -e FOUNDERFLOOR_SUPABASE_URL=https://<project>.supabase.co \
  -e FOUNDERFLOOR_SUPABASE_ANON_KEY=<anon key> \
  -e FOUNDERFLOOR_TOKEN=<the app's JWT> \
  -- node /path/to/founderfloor/packages/mcp/bin/founderfloor-mcp.mjs
```

## Tools

| Tool | What |
| --- | --- |
| `stand` | The company record with rank, runway and workshop stage computed. |
| `brief` | The stand as a build brief: build first, do not build yet, done means. |
| `update_stand` | Change facts on the stand. Ask the founder before changing a price or a goal. |
| `workshop`, `tick` | The six rooms and their items; tick one only when its proof is true. |
| `docs`, `doc`, `draft`, `save_doc` | The drawer: list, read, draft from the stand, or save what the agent wrote. |
| `log`, `log_week`, `log_shipped` | The weekly log; `log_shipped` appends one line to this week. |
| `interviews`, `add_interview` | What customers said, verbatim. |
| `calendar` | Filings for the entity and residence, each with its official source. |
| `ask` | Ines, Jonah, Margot, Theo, or the guide, over the real numbers. |
| `read_idea` | The second opinion. Never a score. |

Resources: `founderfloor://stand` (JSON) and `founderfloor://brief` (Markdown).

## Run the tests

```bash
npm test
```

Node 22 or newer. The server runs TypeScript directly with type stripping.
