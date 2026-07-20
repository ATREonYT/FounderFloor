# FounderFloor — server hardening & firewall runbook

Most "launched and hacked within a day" stories are not clever exploits.
They're the boring four: an open port nobody meant to expose, SSH
password brute-force, an unpatched package, and a volumetric flood. This
runbook closes all four on the VPS, on top of the app-level protections
the floor server already ships (rate limits, per-identity login backoff,
scrypt password hashing, guest-secret identity binding, WebSocket
message-size and connection caps).

Run every command below **on the VPS** (SSH in first). Budget ~20 minutes.
None of it requires touching the app.

---

## 1. Firewall: close every door but three (ufw)

By default a fresh VPS accepts connections on every port. Lock it to the
only three the site needs — SSH (22), HTTP (80, for Caddy's certificate
challenge), HTTPS (443). The floor server's own port (3001) stays
**internal**: only Caddy on the same box talks to it, so the outside world
can't reach it directly.

```bash
sudo apt install -y ufw
sudo ufw default deny incoming      # block everything inbound...
sudo ufw default allow outgoing     # ...allow the server to reach out
sudo ufw allow 22/tcp               # SSH  (see §2 before locking this down)
sudo ufw allow 80/tcp               # HTTP  (Caddy ACME + redirect)
sudo ufw allow 443/tcp              # HTTPS
sudo ufw --force enable
sudo ufw status verbose             # confirm: only 22, 80, 443 are open
```

If you set up the Hetzner cloud firewall earlier, keep it — defence in
depth. ufw protects the box even if the cloud firewall is ever misedited.

---

## 2. Stop SSH brute-force (keys + fail2ban)

**Use an SSH key, not a password.** Password logins are the single most
attacked surface on the internet. On your **local machine**:

```bash
ssh-keygen -t ed25519            # if you don't already have a key
ssh-copy-id root@YOUR_SERVER_IP  # installs your public key on the VPS
```

Then, on the **VPS**, turn password logins off:

```bash
sudo nano /etc/ssh/sshd_config
# set (uncomment/edit) these lines:
#   PasswordAuthentication no
#   PermitRootLogin prohibit-password
sudo systemctl restart ssh
```

⚠️ Before you close this SSH session, open a **second** terminal and
confirm you can still log in with your key. If you can't, fix it from the
first session — otherwise you'll lock yourself out.

**fail2ban** bans any IP that keeps failing logins — a free tripwire:

```bash
sudo apt install -y fail2ban
sudo systemctl enable --now fail2ban
sudo fail2ban-client status sshd    # shows currently-banned IPs
```

---

## 3. Automatic security patches

The `ws` and Next.js CVEs are examples of why unpatched dependencies bite.
For the OS itself, let it patch its own security holes unattended:

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades   # choose "Yes"
```

For the app's npm dependencies, run `npm audit` after each `git pull` and
bump anything flagged — the operator (me) does this on every update; the
current tree is clean of exploitable advisories.

---

## 4. Rate-limit and size-limit at the edge (Caddy)

The Node server rate-limits by IP already, but Caddy in front lets you
shed abusive traffic before it ever reaches Node. Replace the Caddyfile
with this (still terminating TLS and proxying to :3001):

```
floor.yourdomain.com {
    reverse_proxy localhost:3001

    # Refuse absurd request bodies outright (the API never needs >64KB;
    # booth logos are capped far below that).
    request_body {
        max_size 128KB
    }

    # Basic abuse throttle. Needs the rate_limit module — if your Caddy
    # build doesn't have it, skip this block; the Node limiter still holds.
    # rate_limit {
    #     zone floor { key {remote_host}  events 120  window 1m }
    # }

    encode gzip
    header {
        # belt-and-suspenders security headers (Vercel sets these on the
        # web app; this covers the floor server's own responses too)
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        -Server
    }
}
```

```bash
sudo systemctl reload caddy
```

---

## 5. DDoS: put Cloudflare in front (when you're ready)

A determined volumetric flood is bigger than any single VPS. The standard,
free answer is Cloudflare's proxy — it absorbs floods and hides your
origin IP. We turned the proxy **off** during setup because it fought
Caddy's certificate. To turn it on **properly**:

1. Cloudflare → your domain → **SSL/TLS → Origin Server → Create
   Certificate**. Save the cert and key onto the VPS (e.g.
   `/etc/caddy/origin.pem` and `/etc/caddy/origin.key`).
2. Point Caddy at that cert instead of auto-HTTPS for the proxied host:
   ```
   floor.yourdomain.com {
       tls /etc/caddy/origin.pem /etc/caddy/origin.key
       reverse_proxy localhost:3001
   }
   ```
   `sudo systemctl reload caddy`.
3. In Cloudflare DNS, flip the `floor` record's cloud to **orange
   (Proxied)**, and set SSL/TLS mode to **Full (strict)**.
4. Cloudflare → **Security → Settings**: turn on **Bot Fight Mode** and
   set the security level to Medium. Optionally add a rate-limiting rule
   (free tier allows one).

Now you get the DDoS shield *and* working TLS. Do the same for the main
site's DNS record if it isn't already fronted by Vercel (which has its own
edge protection).

---

## 6. Data safety (so a breach isn't a catastrophe)

- `floor-data.json` holds everything. The server keeps 3 rotating daily
  backups beside it. Add an **off-box** copy so a compromised or dead VPS
  doesn't take the data with it — a one-line cron that ships the newest
  backup elsewhere, or a weekly `scp` to your laptop.
- The file contains password **hashes** (scrypt, salted — not reversible)
  and users' emails. Keep its permissions tight:
  ```bash
  sudo chmod 600 /home/founderfloor/app/server/floor-data.json*
  sudo chown founderfloor:founderfloor /home/founderfloor/app/server/floor-data.json*
  ```
- The floor server already runs as the unprivileged `founderfloor` user
  (not root) via systemd — keep it that way. A bug in the app then can't
  touch the rest of the box.

---

## 7. Know when something's wrong (monitoring)

- **UptimeRobot** (free) pointed at `https://floor.yourdomain.com/health`
  emails you within minutes if the server goes down.
- Watch for abuse in the logs: `journalctl -u founderfloor | grep -Ei
  "report|slow down|denied"` shows rate-limit trips and abuse reports.
- Feedback and abuse reports also arrive by email if `OPERATOR_EMAIL` is
  set (see DEPLOY.md).

---

## What the app already does for you (no action needed)

- **Per-IP request rate limiting** on all auth routes, plus **per-account
  login backoff** (5 wrong passwords locks that account 60s→15min),
  keyed so the lockout can't be used to probe which emails exist.
- **Passwords** stored as salted scrypt hashes (N=32768) — unreadable even
  to the operator, ruinously expensive to crack at scale.
- **Guest identities** bound to a browser-held secret so nobody can claim
  another visitor's stand, inbox, or connections.
- **Every piece of user text** (names, pitches, chat, guestbook, feedback)
  is sanitized — control characters and bidi overrides stripped — before
  it's stored or relayed, and rendered as text (never HTML) on the client.
- **WebSocket** frames are size-capped and per-IP connection-capped;
  message, move, emote, chat and booth-write rates are all throttled
  server-side.
- **Email** sends are quota-bucketed so a flood of one kind can't starve
  password-reset delivery, and reset links are single-use with a 30-minute
  expiry that also kills every existing session.
- **Security headers** (frame-deny, nosniff, referrer policy, permissions
  policy) on every web response.
