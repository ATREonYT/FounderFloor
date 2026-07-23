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
   sender (e.g. mail from `founderfloor.net` to `founder-floor.com`).

### Locked out (operator password rescue)

If the operator account itself can't receive reset mail, set its password
directly on the VPS — no email involved:

```
sudo systemctl stop founderfloor       # the server saves over the file while running
node server/tools/set-password.mjs ak@founder-floor.com 'new-password-here'
sudo systemctl start founderfloor
```

The tool backs up the data file first and signs out every existing session
of that account.

### Operator console

`ADMIN_EMAILS` (comma-separated, default `ak@founder-floor.com`) names the
accounts allowed to use `/admin` on the site: grants (membership, founding
badge, tickets), bans/unbans (by email or profile id — bans kick live
sessions, clear stands, and block both login and floor joins), kicks,
stand clearing, and floor-wide announcements. Sign in as that account and
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
  says billing isn't live (buttons simulate). With them, every buy button
  opens real checkout — no code change.

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
- [ ] Claim a stand, close the tab, reopen — stand still there
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
