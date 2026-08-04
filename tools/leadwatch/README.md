# leadwatch

Finds people publicly asking for something FounderFloor does, and puts them
in a queue for **you** to answer.

It reads public posts on Hacker News, Bluesky, Reddit and any RSS feed you
give it, scores them for intent, and mails you a digest: the post, why it
matched, and a draft reply you have to finish. That's the whole tool.

## What it does not do

**It does not message anyone.** There is no send function anywhere in this
directory, and a test asserts there never is one — nothing here may POST to
a third party or reference a messaging endpoint.

That isn't squeamishness. You asked for an agent that reaches out
automatically, and three things say don't:

- **It gets you banned.** Reddit, Bluesky and X all prohibit bulk unsolicited
  promotional messaging. The penalty escalates from the account to the
  *domain* — founderfloor.net gets filtered sitewide on Reddit, and you never
  find out; your posts just stop appearing. You lose the channel permanently,
  for a handful of messages nobody read.
- **In the EU it invites a bill.** Unsolicited electronic advertising without
  prior consent is actionable under German UWG §7(2), and German courts have
  read platform DMs as *elektronische Post* rather than treating them as
  something looser (OLG Hamm, 18 U 154/22). There is no B2B carve-out for
  electronic mail in Germany, and "my product is free" is still Werbung. The
  realistic downside is not a regulator's fine but a low-four-figure
  Abmahnung with an undertaking attached that prices every later slip much
  higher.

  A **public reply to a public question** is the one outreach mode that needs
  no consent — it is not electronic mail, so §7 and ePrivacy Art 13 do not
  reach it. It is governed instead by each community's promotion rules, which
  are stricter than the law and which you follow by hand. That is exactly the
  mode this tool drafts for.
- **It converts worse.** You already know this from two conversations ago:
  thirty messages written for thirty specific people beat any automated send.
  The bot version of that is the version that gets ignored.

So the automation is pointed at the half that's genuinely hard and genuinely
safe — *finding* the person, and having a draft ready — and the part that
needs to be a human stays a human. Practically, this costs you about ten
minutes a day and it's the ten minutes that works.

## Setup

```bash
cd tools/leadwatch
cp config.example.json config.json     # then edit it
node leadwatch.mjs --selftest          # can this machine reach the sources?
node leadwatch.mjs --dry               # a full run that writes and sends nothing
```

Node 18+. **No dependencies** — nothing to `npm install`, which is why it can
sit on the VPS next to the floor server and never break on a deploy.

### Reddit requires credentials — there is no fallback

Reddit's User Agreement permits automated collection **only** through the Data
API. So there is deliberately no `.json` or `search.rss` fallback here: that
would be a terms breach, and Reddit enforces at the domain level, silently.
Losing founderfloor.net sitewide to save a five-minute registration is a bad
trade. Without credentials this source reports itself unconfigured and the run
continues with the others.

Register a script app — <https://www.reddit.com/prefs/apps>, "create app",
type **script** — and set:

```
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...
REDDIT_USERNAME=...        # optional, lets the User-Agent name you as Reddit asks
```

It uses the `client_credentials` grant, so your account password never lands
on the VPS.

### Bluesky needs no credentials, but the host matters

`public.api.bsky.app` is the cached front door and has returned 403 for
`searchPosts` since early 2025. `api.bsky.app` is the same AppView without
that cache layer and answers unauthenticated — the handler is registered with
optional auth, so anonymous reads are the design. That is the host this uses,
and it is why no App Password is needed. Override with `LEADWATCH_BSKY_HOST`
if that ever changes; `--selftest` will tell you the day it does.

### Email

Reuses the floor server's existing variables, so on the VPS there's nothing
new to configure: `RESEND_API_KEY`, `EMAIL_FROM`, `OPERATOR_EMAIL`. Without
`RESEND_API_KEY` the digest is still written to `out/`, and the run says the
mail was skipped rather than failing.

### Covering X, LinkedIn and the long tail

Don't scrape them. Create a Google Alert for the query, set **Deliver to =
RSS feed**, and paste the URL into the `rss.feeds` list. Google does the
crawling, you read a feed, nobody's terms are bent.

## Running it on a schedule

On the VPS, beside the floor server:

```ini
# /etc/systemd/system/leadwatch.service
[Unit]
Description=FounderFloor leadwatch
After=network-online.target

[Service]
Type=oneshot
User=founderfloor
WorkingDirectory=/home/founderfloor/app/tools/leadwatch
EnvironmentFile=/etc/founderfloor.env
ExecStart=/usr/bin/node leadwatch.mjs
```

```ini
# /etc/systemd/system/leadwatch.timer
[Unit]
Description=Run leadwatch twice a day

[Timer]
OnCalendar=*-*-* 08,17:00:00
Persistent=true
RandomizedDelaySec=900

[Install]
WantedBy=timers.target
```

```bash
sudo systemctl enable --now leadwatch.timer
systemctl list-timers leadwatch.timer
journalctl -u leadwatch.service -n 50
```

Twice a day is deliberate. Hourly finds the same posts, mails you more often,
and trains you to stop reading the mail.

If you'd rather not run it on the VPS, it works unchanged as a GitHub Actions
cron job — the only thing to add is committing `data/` back to the repo (or
using an actions cache) so the seen-set survives between runs.

## The daily loop

1. Read the digest. Most days it's empty; that's correct.
2. Open the post. **Read the thread**, not just the excerpt.
3. If you can genuinely help, reply in the thread as yourself. Finish the
   bracketed line first — that line is the entire difference between a reply
   and a link drop.
4. `node leadwatch.mjs --replied hn:12345` (or `--skip`).

`node leadwatch.mjs --queue` shows what's still waiting.

## How the scoring works

`lib/score.mjs`, and it's plain regex on purpose: you can read it, you can
fix it, and when it's wrong you can see exactly which phrase did it. That
matters, because its output decides who a human is about to talk to.

- **Positive clusters** add weight. Seven of them: co-founder search, "where
  do founders hang out", networking fatigue, needing first users, wanting
  feedback, virtual-space questions, solo isolation.
- **Two clusters minimum.** One signal on its own is nearly always a
  coincidence — "co-founder" appears in every job ad ever written. Requiring
  two is the cheapest precision win there is.
- **Negative clusters veto outright**, whatever the score: hiring posts,
  agencies, crypto, dropshipping, and anyone who is themselves selling.

Tune by editing the clusters and re-running `--dry`. If the digest is empty
for a week, lower `minScore` before you add queries; if it's full of noise,
add a negative cluster rather than raising the bar.

## What it stores, and for how long

`data/seen.jsonl` holds ids only — no text, no names — so a post is never
surfaced twice. `data/leads.jsonl` holds the matched posts with their state.
Both are gitignored.

**Retention is enforced in code on every run**, not written down and forgotten:
leads are deleted after 60 days whatever their state, seen ids after 180.
Change it under `retention` in `config.json`.

That matters because a lead holds post text and a handle belonging to someone
who never contacted you. A permanent private dossier on those people is the
thing that turns "reading public posts" into something you would rather not
have to explain — and under GDPR the storage itself, not just the messaging,
is what needs a basis.

Two operator to-dos that are yours rather than the code's, if you run this
regularly: add a short paragraph to `/privacy` naming the sources you monitor
(Reddit, Hacker News, Bluesky), and keep a suppression list of anyone who asks
not to be contacted.

## Files

```
leadwatch.mjs        CLI: --selftest, --dry, --queue, --replied, --skip
config.example.json  copy to config.json
lib/http.mjs         polite fetch: identifies itself, one connection per host,
                     spacing, Retry-After, backoff
lib/score.mjs        the intent model
lib/draft.mjs        reply templates, each with a slot you must fill
lib/store.mjs        two JSONL files, no database
lib/digest.mjs       markdown for disk, HTML for the mail
lib/notify.mjs       Resend
lib/sources/         hn, bluesky, reddit, rss
```
