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
- **In the EU it invites a bill.** Unsolicited electronic advertising to a
  person without prior consent is actionable under German UWG §7, and there
  is an established Abmahnung industry built on exactly that. Scraping public
  posts to build a prospect list also triggers GDPR Art 14 — a duty to notify
  the people whose data you collected. Neither of these is theoretical.
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

### Reddit needs credentials to be useful

Unauthenticated Reddit reads are throttled hard from datacenter IPs, which is
exactly what a VPS is. Register a script app — <https://www.reddit.com/prefs/apps>,
"create app", type **script** — and set:

```
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...
```

Free, and it's Reddit asking to be used properly rather than scraped. Without
it the tool falls back to search RSS and tells you it did.

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

## What it stores

`data/seen.jsonl` (ids only, so nothing is shown twice) and `data/leads.jsonl`
(the matched posts, with their state). Both are gitignored.

These hold public posts by named people, so treat the directory as personal
data: don't commit it, don't share it, and delete leads once you've acted on
them. Keeping a permanent private dossier on people who never contacted you
is the part that turns "reading public posts" into something you'd rather not
explain.

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
