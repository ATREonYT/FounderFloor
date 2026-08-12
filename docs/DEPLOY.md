# FounderFloor — beta deploy guide

Two pieces run in production:

1. **The web app** (Next.js, the repo root) — deploy to Vercel (or any Node host).
2. **The floor server** (`server/index.mjs`) — one Node process on a
   small VPS. It owns the WebSocket rooms, the social graph, accounts,
   cross-device state, and `floor-data.json`.

Total cost at launch: ~$12/month (see `docs/financial-model.xlsx`).

---

## 1. The floor server (VPS)

Any $5–6/month VPS (Hetzner CX22, DigitalOcean basic) with Ubuntu:

```bash
# on the VPS
sudo apt update && sudo apt install -y nodejs npm caddy
sudo useradd -r -m -s /usr/sbin/nologin founderfloor

# copy the server (only two files matter: server/index.mjs and package.json
# for the "ws" dependency)
sudo -u founderfloor mkdir -p /home/founderfloor/app/server
# scp server/index.mjs -> /home/founderfloor/app/server/
# scp package.json     -> /home/founderfloor/app/
cd /home/founderfloor/app && sudo -u founderfloor npm install ws
```

`/etc/systemd/system/founderfloor.service`:

```ini
[Unit]
Description=FounderFloor floor server
After=network.target

[Service]
User=founderfloor
WorkingDirectory=/home/founderfloor/app
ExecStart=/usr/bin/node server/index.mjs
Environment=PORT_WS=3001
# Account emails (welcome, sign-in alerts, password reset) — see the
# "Email" section below. Without these the server runs fine; it just
# sends nothing.
Environment=RESEND_API_KEY=re_xxxxxxxxx
# NB the quotes: systemd splits unquoted Environment= lines on spaces, which
# would silently truncate EMAIL_FROM to just "FounderFloor".
Environment="EMAIL_FROM=FounderFloor <noreply@founderfloor.net>"
Environment=EMAIL_REPLY_TO=you@yourworkmail.com
Environment=SITE_URL=https://founderfloor.net
# Optional: beta feedback + abuse reports also land in this inbox
# (they're always stored in floor-data.json either way).
Environment=OPERATOR_EMAIL=you@yourworkmail.com
# Behind Caddy/Cloudflare, set this so the rate limiter sees the real
# client IP (X-Forwarded-For) instead of the proxy's — otherwise every
# visitor shares one bucket. Only enable it WITH a trusted proxy in front.
Environment=TRUST_PROXY=1
# Optional: lock the API's CORS to your site instead of "*".
Environment=ALLOWED_ORIGIN=https://founderfloor.net
# Optional: how many free lifetime Founder+ memberships the first accounts
# get. Defaults to 20. Anything unparseable falls back to 20 rather than
# opening the offer to everyone, but do not rely on that — set it or leave
# it out. Lowering it after seats are taken does NOT revoke them; the seat
# lives on the account.
Environment=FOUNDING_SEATS=20
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now founderfloor
curl http://localhost:3001/health   # {"ok":true,...}
```

### TLS (required — browsers refuse ws:// from an https page)

Caddy terminates TLS and proxies to the Node process. `/etc/caddy/Caddyfile`:

```
floor.yourdomain.com {
    reverse_proxy localhost:3001
}
```

```bash
sudo systemctl reload caddy
curl https://floor.yourdomain.com/health
```

Caddy fetches and renews the certificate automatically. WebSockets are
proxied out of the box.

### Data safety

- `floor-data.json` holds everything (stands, accounts, social graph, DMs,
  synced progress, feedback). The server keeps 3 daily rotating backups
  beside it (`floor-data.backup-1.json` = yesterday).
- Off-box safety: a nightly cron that copies the newest backup somewhere
  else is 1 line:
  `0 5 * * * cp /home/founderfloor/app/server/floor-data.backup-1.json /backup/`
- Reading beta feedback and abuse reports: they're the `feedback` and
  `reports` arrays in that file — `jq '.feedback' server/floor-data.json`.

### Email (accounts: welcome, sign-in alerts, password reset)

The floor server sends transactional email through
[Resend](https://resend.com) (free tier: 100 emails/day — plenty at beta
scale; the server additionally caps itself at 6/recipient/hour and
500/day). Setup:

1. Create a Resend account → **Domains → Add domain** → `founderfloor.net`.
2. Resend shows a handful of DNS records (SPF, DKIM, MX for bounces). Add
   them in your DNS dashboard exactly as shown. TXT/MX records have no
   proxy toggle — nothing to grey-cloud. Wait for the domain to show
   **Verified**.
3. **API Keys → Create** (sending access only) → put it in the systemd
   unit's `RESEND_API_KEY=` line above.
4. `EMAIL_FROM` can be a **no-reply address you never create a mailbox for**
   (e.g. `noreply@founderfloor.net`) — once the domain is verified, Resend
   sends from any address on it, mailbox or not. Set `EMAIL_REPLY_TO` to a
   real inbox you actually read (your work email is perfect): the from stays
   no-reply, but if a user hits reply — the "someone changed your password"
   and "your email was changed" notes invite exactly that — it lands in your
   inbox instead of vanishing. `SITE_URL` builds the reset links.
5. `sudo systemctl daemon-reload && sudo systemctl restart founderfloor`,
   then create a test account with your real email — the welcome mail
   should arrive within seconds.

Password-reset links point at `SITE_URL/reset?token=…` and expire in 30
minutes. A reset signs out every session of that account. Sign-in alerts
go out only when an account signs in from a browser it hasn't used before.
The account UI reads the server's `emailLive` flag (`GET /health`), so if
you launch before configuring Resend it honestly says reset mail isn't on
yet instead of promising a link that never arrives.

`EMAIL_ECHO=1` exists for automated tests only (captures mail in memory
and exposes it at `/debug/emails`) — never set it in production.

**If reset mail never arrives**, check in this order:

1. `curl -s https://<floor-host>/health` — `"emailLive":false` means
   `RESEND_API_KEY` isn't set in the systemd unit at all.
2. `journalctl -u founderfloor | grep email` — the server now logs every
   send and every Resend rejection **with Resend's reason**. The two
   classics: the domain isn't Verified yet (Resend then only delivers to
   the address that owns the Resend account), or `EMAIL_FROM` uses a
   domain other than the verified one.
3. Spam folder — especially for addresses on a different domain than the
   sender. Keeping the contact address on the sending domain
   (`founderfloor.net`) avoids this — see `lib/contact.ts`.

### Changing settings without root, ever again

Every `Environment=` line above lives in a file only root can edit, so a
one-word config change needs a sudo password — which is exactly the thing
that goes missing six months later. Move them into a file the app user
owns, once, while you still have root:

    Environment=PORT_WS=3001
    EnvironmentFile=-/home/founderfloor/app/.env

(The `-` means "carry on if the file isn't there", so a missing .env can
never stop the server booting.) Then:

    sudo -u founderfloor touch /home/founderfloor/app/.env
    sudo chmod 600 /home/founderfloor/app/.env
    sudo systemctl daemon-reload && sudo systemctl restart founderfloor

From then on the file holds the secrets — one KEY=value per line, no
`export`, quotes only if the value contains spaces:

    RESEND_API_KEY=re_xxxxxxxxx
    EMAIL_FROM=FounderFloor <noreply@founderfloor.net>
    EMAIL_REPLY_TO=you@yourworkmail.com

and changing one is an edit as the `founderfloor` user plus
`systemctl restart founderfloor`. Values in the .env win over
`Environment=` lines only if you remove the duplicates from the unit —
systemd applies `Environment=` last, so delete the ones you move.

### Locked out of the VPS itself

If `sudo` asks for a password you don't have: check `whoami` first. On a
Hetzner or DigitalOcean box you are usually logged in AS root, and root
never needs `sudo` — drop the word and the command runs. If you are some
other user and its password is unknown, reset the root password from the
provider's web console (Hetzner: the server → Rescue → Reset root
password), then log in as root directly. Nothing on the box is lost; the
service keeps running throughout.

### The emails say FounderFloor but show a personal address

Open `/admin` and read the line under the account count: it prints the
exact `EMAIL_FROM` the running server is using, and the reply-to. What a
recipient sees when they tap the sender is that address, and nothing else
— the display name in front of it is decoration.

If it is a personal mailbox, `EMAIL_FROM` is set that way in the systemd
unit. Fix it there:

    sudo systemctl edit --full founderfloor
    # quotes matter — without them systemd truncates at the first space
    Environment="EMAIL_FROM=FounderFloor <noreply@founderfloor.net>"
    Environment="EMAIL_REPLY_TO=hello@founderfloor.net"
    sudo systemctl daemon-reload && sudo systemctl restart founderfloor

**Resend will refuse a From on a domain you have not verified**, and the
refusal is silent to the user — the letter simply never arrives. So verify
`founderfloor.net` under Resend → Domains → Add domain and add the SPF and
DKIM records it gives you BEFORE changing this. Until the domain is
verified, Resend only delivers to the address that owns the Resend account,
which is why a personal address appears to work: it is the one exception.

`EMAIL_REPLY_TO` is where a reply goes and can be any mailbox you read —
including a personal one — because a reply-to is a private arrangement
between you and whoever answers. The From is what the world sees.

### Locked out (operator password rescue)

If the operator account itself can't receive reset mail, set its password
directly on the VPS — no email involved:

```
sudo systemctl stop founderfloor       # the server saves over the file while running
node server/tools/set-password.mjs ak@founderfloor.net 'new-password-here'
sudo systemctl start founderfloor
```

The tool backs up the data file first and signs out every existing session
of that account.

### The launch gate

`LAUNCH_GATE=on` in the **Vercel** project turns the whole site into a
holding page at `/soon` that takes an email and counts down to the next
Open Doors. Delete the variable to open the site again.

**Both changes need a redeploy, not just a settings save.** `middleware.ts`
reads the variable per request, but `app/layout.tsx` reads it while being
prerendered, to strip a nav whose every link would lead back to the gate.
Change one without rebuilding and the two disagree.

Left reachable on purpose while the gate is up: `/imprint`, `/terms`,
`/privacy`, `/cancel`, `/report`, `/about`, `/admin`, `robots.txt`,
`sitemap.xml` and the social images. The legal pages are not optional —
an Impressum has to stay reachable — and a crawler that meets the gate on
every URL learns the site is one page, which outlives the gate by weeks.

Addresses collected here land in the same subscriber list as the other two
capture boxes, tagged `launch-gate`, so `/admin/subscribers` can tell them
apart.

### Free trials and referrals

A trial here is a **card-free, time-limited Founder+ entitlement**. No
payment method is taken, nothing renews, nothing converts, and when the
clock runs out the account is simply free again. That is the only kind of
trial that can honestly ship before billing is live, and it is also the
kind with no withdrawal-rights machinery attached — which matters for an
operator in the EU. `/terms` and `/privacy` say all of this.

Tunable on the **floor server** (systemd `Environment=` lines), all with
the same NaN guard as `FOUNDING_SEATS`:

    Environment=TRIAL_DAYS=7
    Environment=REFERRAL_DAYS=7
    Environment=MAX_REFERRAL_DAYS=63

**`FLOOR_STANDS_WHILE_AWAY`** (unset by default) is the one variable that
changes what a hall looks like. Unset, a floor draws only founders who are
connected right now; a stand comes down when its owner closes the tab, while
the record, the spot reservation and the directory listing all survive. Set
it to `1` and absent founders' stands stay on the floor with a grey "away"
lamp, as they did before. Whether empty halls read as honest or as dead is a
question about people, so it is a restart, not a deploy:

    Environment=FLOOR_STANDS_WHILE_AWAY=1

**`MAX_REFERRAL_DAYS` is the anti-abuse mechanism, not a nicety.** Nothing
stops somebody registering ten addresses and referring themselves nine
times; email is the only proof of a person this product has, and it is weak
proof. The cap is what makes the exploit worth less than the effort. If it
ever stops being worth it, withhold the credit until the referred account
has actually walked a floor — do not start collecting IP addresses for it.

Lowering a cap does not claw back days already granted; it only stops new
ones. Raising `TRIAL_DAYS` affects trials started after the restart.

How it hangs together:

- Every account gets a random invite code, minted at registration and
  backfilled for older accounts at startup. `founderfloor.net/?ref=CODE` is
  caught anywhere on the site and spent at registration.
- Both sides get `REFERRAL_DAYS`. A credit extends a running window or
  reopens a lapsed one.
- **Invite days and the trial are separate.** Crediting an invite does not
  consume the trial, so somebody who arrives on a link gets their welcome
  days AND can still start their own 7 — stacked onto the end. Only
  `POST /trial/start` marks the trial used, and only once per account ever.
  The referrer's own trial is likewise untouched by handing out invites.
- Only the referrer's days count against `MAX_REFERRAL_DAYS`. The joiner's
  welcome is a one-off gift, not something they earned by inviting anyone,
  so it does not eat into their own cap.
- A **permanent** entitlement (a founding seat, a real subscription) is
  never given an expiry — there is nothing to extend, and writing one would
  be a downgrade dressed as a reward.
- `GET /state` returns the **effective** entitlement, so an expired trial
  reads as no entitlement without anything having to sweep the data file.
  It returns `perks` for every account it recognises, and that pairing is
  what makes a null `paid` authoritative in the browser — "you hold
  nothing", as opposed to "this deploy has no billing configured". Without
  it a trial would expire on the server and never expire on the device, and
  an `/admin/grant` revoke would never land either.

    curl https://your-host/state?me=acct_...   # -> {"paid":…, "perks":{…}}

`node server/test/trial-referral.mjs` covers all of it, including expiry
(faked by writing a past timestamp into a scratch data file, since a 7-day
trial cannot be waited out).

### Founding seats

The first `FOUNDING_SEATS` accounts (20 by default) get Founder+ and the
founding badge, kept for life, free. Seats are handed out on registration
and backfilled to the oldest existing accounts the first time the server
boots with the feature, so the people who joined earliest are the ones who
get them.

    curl https://your-host/presence     # {"founding":{"total":20,"left":13}}

The seat number lives on the account (`foundingSeat` in floor-data.json),
not in a counter, so restoring a backup cannot hand out the same seat
twice. To reopen the offer after it closes, raise `FOUNDING_SEATS` and
restart; the next boot backfills the difference to the oldest accounts that
do not already hold one.

### The founders wall

The wall on the landing page and on the launch gate is **not a second
database**. It renders `GET /startups` — the same listing the directory
shows and the same text painted on that founder's stand. Editing a stand
edits the wall entry, because they are one record. Adding yourself through
the wall form makes an account, registers the startup, and that entry is
already your stand when you first walk in.

Startups may now carry a `link`. It is the only field on the site that puts
a stranger's URL in front of a visitor, so:

- `sanitizeLink()` on the server is an **allowlist**: http/https only, a
  hostname with a dot and a non-numeric last label (so `javascript:`,
  `data:`, `localhost`, `127.0.0.1` and intranet names are all refused),
  credentials stripped, 200 characters max **checked before truncation** —
  a shortened URL points somewhere its owner never wrote.
- Every renderer uses `rel="nofollow ugc noopener noreferrer"`. Not
  politeness: a public page anyone can post links to is a link farm without
  it, and the penalty lands on this domain.
- `node server/test/wall.mjs` covers both halves against a real server.

Anti-spam is the account, not a filter. A wall entry costs a working email
address, and both halves of the submission (`/auth/register` then
`/startups/register`) spend a slot in the per-IP window — see
`AUTH_RATE_LIMIT` below — so one address can post about five listings a
minute. Bans now hide every listing the banned owner has, and
`/admin/wall-remove` takes a single listing off every public surface
without banning anyone.

    Environment=AUTH_RATE_LIMIT=10

Ten POSTs per IP per minute across `/auth/*`, `/startups/*` and
`/trial/start`. Raise it only if real founders start hitting it at launch;
a garbled value falls back to 10 rather than removing the limit.

### Moderating stands

Three tiers, and they behave differently on purpose:

| tier | what happens | where it lives |
| --- | --- | --- |
| profanity | masked in place (`✱✱✱`), rest goes through | `PROFANITY_WORDS` |
| slurs | masked in place everywhere it renders | `SLUR_WORDS` |
| **prohibited** | **the save is refused** | `BLOCKED_PHRASES` |
| watched | saved, then queued for you | `WATCHED_PHRASES` / `WATCHED_WORDS` |

Masking is wrong for the top tier: a drug market with stars in its name is
still a drug market, and you are the one hosting it. So a blocked stand is
refused at both write paths — `POST /startups/register` answers with a
sentence the founder sees, and a floor claim comes back `booth_denied` with
`reason: "prohibited"`.

**Be clear-eyed about what the list does.** It cannot decide legality —
that depends on jurisdiction, framing and intent, none of which are in the
string. It stops the lazy and the obvious, which is most of what turns up.
So the two lists are drawn on different rules:

- **Blocked** is kept to phrases with no innocent reading: an explicit
  offer to sell an unambiguously illegal good (`cvvforsale`,
  `buyfakepassport`, `buycocaineonline`), plus sexual content involving
  minors, which is blocked on the subject alone. A genuine child-safety
  company will trip that and have to email you. That is the intended trade
  and it only goes in this direction.
- **Watched** is everything a real company might legitimately write — a
  fraud team writes about carding, a security team about ransomware, an
  NGO about trafficking. Those save normally and appear in **Needs a look**
  on `/admin`, with a "load into takedown" button next to each. The queue
  is a queue, not a hold: the stand is live while it waits.

Matching mirrors the profanity filter — phrases against a letters-only
flattening (so `h i t m a n f o r h i r e` and `f4ke p4ssports` collapse to
the same string), single words on token boundaries only (so "something"
does not contain "meth"). `node server/test/moderation.mjs` asserts both
halves, and gives the false positives as many checks as the true ones.

Bans now clear stands on **every** floor, not just the ones with somebody
standing on them — the old version walked live rooms, so a banned stand
survived on exactly the floors nobody was watching. The response reports
how many it took down. The directory listing is hidden rather than deleted,
so an unban restores it.

### Operator console

`ADMIN_EMAILS` (comma-separated, default
`ak@founderfloor.net,ak@founder-floor.com` — both while the operator
account moves domains) names the
accounts allowed to use `/admin` on the site: grants (membership, founding
badge, tickets), bans/unbans (by email or profile id — bans kick live
sessions, clear stands, and block both login and floor joins), kicks,
stand clearing, wall takedowns, and floor-wide announcements. Sign in as that account and
open `founderfloor.net/admin`. For everyone else the endpoints return the
same 404 as any unknown path.

## 2. The web app (Vercel)

- Import the repo in Vercel; the project root is the repo root (the default).
- Environment variables:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_WS_URL` | `wss://floor.yourdomain.com/ws` |
| `NEXT_PUBLIC_STRIPE_LINK_PRO_MONTHLY` | Stripe Payment Link URL |
| `NEXT_PUBLIC_STRIPE_LINK_PRO_ANNUAL` | Stripe Payment Link URL |
| `NEXT_PUBLIC_STRIPE_LINK_FOUNDER_MONTHLY` | Stripe Payment Link URL |
| `NEXT_PUBLIC_STRIPE_LINK_FOUNDER_ANNUAL` | Stripe Payment Link URL |
| `NEXT_PUBLIC_STRIPE_LINK_FOUNDING` | Stripe Payment Link URL |
| `NEXT_PUBLIC_STRIPE_LINK_TICKETS_S` | Stripe Payment Link URL (ticket pack) |
| `NEXT_PUBLIC_STRIPE_LINK_TICKETS_M` | Stripe Payment Link URL (ticket pack) |
| `NEXT_PUBLIC_STRIPE_LINK_TICKETS_L` | Stripe Payment Link URL (ticket pack) |

- Without the Stripe vars everything works and the membership UI honestly
  says billing goes live at launch — there is nothing to click, and the
  free trial is the real way to see Founder+ in the meantime. With them,
  every buy button opens real checkout — no code change.
- There used to be buttons here that flipped the tier locally to "simulate"
  a purchase. They are gone. One of them granted the founding badge, which
  is never clawed back, so a click handed out the scarcest thing on the
  site; and the server, quite rightly, never agreed with any of it, so the
  switch undid itself at the next heartbeat.

### Stripe setup, end to end

Two halves: **Payment Links** (the checkout pages the web app opens) and
the **webhook** (how the floor server learns a payment happened and turns
the plan on for that account).

**1. Create the five Payment Links** (Stripe dashboard → Payment Links →
New). Prices must be EXACTLY these — the server recognizes a purchase by
its price, so a different amount won't grant anything:

| Product | Price | Type |
|---|---|---|
| FounderFloor Pro | $9 | Monthly subscription |
| FounderFloor Pro (annual) | $79 | Yearly subscription |
| FounderFloor Founder+ | $19 | Monthly subscription |
| FounderFloor Founder+ (annual) | $159 | Yearly subscription |
| FounderFloor Founding Member | $79 | One-time payment |
| Ticket Strip (300 tickets) | $2.99 | One-time payment |
| Ticket Roll (800 tickets) | $6.99 | One-time payment |
| Ticket Crate (2,000 tickets) | $14.99 | One-time payment |

Ticket packs are consumable: the webhook credits the buyer's account with
the tickets (deduped per checkout session, so Stripe's webhook retries
can't double-pay), and the wallet banks them on the buyer's next page
load. On the three PACK links, set the after-payment redirect to
`https://founderfloor.net/profile?paid=tickets#tickets` (note the
different query + anchor — it drops the buyer at the Ticket booth, not
the Membership section).

On each link, under **After payment**, pick "Don't show confirmation
page" → redirect to your website, URL:
`https://founderfloor.net/profile?paid=1#membership` — that bounces the
buyer back to their profile, where the site pulls the fresh entitlement
and the plan appears.

**2. Put the five link URLs in Vercel** (Project → Settings →
Environment Variables), one per variable from the table above, then
**Redeploy** — `NEXT_PUBLIC_*` vars are baked in at build time and do
nothing until a redeploy.

**3. Wire the webhook** (this is what actually grants plans):

1. Stripe dashboard → Developers → Webhooks → **Add endpoint**.
2. Endpoint URL: `https://floor.founderfloor.net/stripe/webhook`
3. Events to send: `checkout.session.completed` and
   `customer.subscription.deleted` (the second takes the plan away when
   a subscription is cancelled).
4. Reveal the endpoint's **Signing secret** (`whsec_...`) and add it to
   the systemd unit: `Environment=STRIPE_WEBHOOK_SECRET=whsec_...`, then
   `sudo systemctl daemon-reload && sudo systemctl restart founderfloor`.

How fulfillment works: Stripe tells the server "this email paid this
price"; the server attaches the plan to the account with that email
(checkout prefills the signed-in buyer's address). If the buyer has no
account yet, the payment is held and applied the moment an account with
that email exists. Perks show up on the buyer's next page load on any
device. A cancelled subscription drops the plan back to free
automatically; the Founding badge is one-time and never revoked.

**Test before going live:** Stripe's test mode has separate Payment
Links and webhook secrets. Do one dry run with test links + card
`4242 4242 4242 4242`, watch the plan flip on your own account, then
swap in the live link URLs and live `whsec_`.

## 3. Launch-day checklist

- [ ] `https://floor.yourdomain.com/health` returns ok
- [ ] Walk a floor from two browsers — you see each other move
- [ ] Create an account on desktop, sign in on a phone — booth follows
- [ ] Claim a stand; from a SECOND browser watch it come off the floor when
      you close the first tab — then reopen and it is back on the same spot
- [ ] While that first tab is closed, open the stand from /directory — the
      booth renders, and Sign / Ask to connect both work
- [ ] Send feedback from /about — appears in `floor-data.json`
- [ ] Buy buttons open Stripe checkout (test mode first!)
- [ ] Create an account with a real email — welcome mail arrives; "Forgot
      password" round-trips to a working reset link
- [ ] Uptime monitor (UptimeRobot free tier) pointed at `/health`

## Known limits at beta scale (fine to launch with)

- One floor-server process; ~1k concurrent visitors on a small VPS.
- Revenue ranks are still self-reported ("simulated" is labeled in-app);
  read-only Stripe verification is the headline post-beta feature.
- Email covers accounts only (welcome, sign-in alerts, password reset).
  Digest/notification emails are a roadmap item, not a beta one.
