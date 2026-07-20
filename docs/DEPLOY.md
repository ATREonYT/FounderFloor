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

- Without the Stripe vars everything works and the membership UI honestly
  says billing isn't live (buttons simulate). With them, every buy button
  opens real checkout — no code change.
- Create the five Payment Links in the Stripe dashboard (Products →
  Payment Links): Pro $9/mo, Pro $79/yr, Founder+ $19/mo, Founder+
  $159/yr, Founding Member $79 one-time.

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
