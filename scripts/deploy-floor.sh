#!/usr/bin/env bash
#
# Ship the floor server to the VPS.
#
# ─── WHY THIS EXISTS ──────────────────────────────────────────────────
# The web app deploys itself: push to main and Vercel builds it. The floor
# server does NOT. It is one Node process on a box, started by systemd, and
# it only changes when somebody copies the file over.
#
# That asymmetry is the single most likely reason a feature "does not work"
# in production while working perfectly on a laptop: the new UI is live and
# calling an endpoint the old server has never heard of. The leaderboard is
# exactly that shape — the boards are drawn by the web app, every number on
# them comes from here.
#
# ─── USE ──────────────────────────────────────────────────────────────
#   scripts/deploy-floor.sh                     # uses the defaults below
#   FF_HOST=root@1.2.3.4 scripts/deploy-floor.sh
#
# If the VPS has a git clone it pulls there; otherwise it copies the four
# files the server actually needs. Either way it restarts the unit and then
# CHECKS — it does not tell you it worked because scp exited 0, it tells you
# what /health says afterwards.
#
# Safe to re-run. It never touches floor-data.json.

set -euo pipefail

HOST="${FF_HOST:-root@46.224.185.150}"
APP="${FF_APP:-/home/founderfloor/app}"
UNIT="${FF_UNIT:-founderfloor}"
HEALTH="${FF_HEALTH:-https://floor.founderfloor.net/health}"

here="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$here"

# The server imports these two out of lib/data. Miss them and it will not
# boot — which is a worse outcome than not deploying at all, so they are
# checked here rather than discovered by systemd at 2am.
shared=(lib/data/event-window.mjs lib/data/parkour-limits.mjs)
for f in server/index.mjs package.json "${shared[@]}"; do
  [ -f "$f" ] || { echo "missing $f — run this from the repo"; exit 1; }
done

# Refuse to ship a file that does not parse. The unit has Restart=always,
# so a syntax error becomes a boot loop rather than a visible failure.
node --check server/index.mjs
for f in "${shared[@]}"; do node --check "$f"; done
echo "syntax ok"

echo "backing up the data file first"
ssh "$HOST" "cd $APP && cp -a server/floor-data.json server/floor-data.pre-deploy.json 2>/dev/null || true"

# Two ways the VPS can get the new code, and it already knows which one it
# is: if somebody cloned the repo there, pulling is one command and cannot
# miss a file. Otherwise copy the four files this server actually needs.
if ssh "$HOST" "test -d $APP/.git"; then
  echo "the VPS has a clone — pulling there"
  ssh "$HOST" "cd $APP && git pull --ff-only"
else
  echo "no clone on the VPS — copying files to $HOST:$APP"
  ssh "$HOST" "mkdir -p $APP/server $APP/lib/data"
  scp server/index.mjs "$HOST:$APP/server/index.mjs"
  scp package.json "$HOST:$APP/package.json"
  for f in "${shared[@]}"; do scp "$f" "$HOST:$APP/$f"; done
fi

echo "restarting $UNIT"
ssh "$HOST" "systemctl restart $UNIT"
sleep 3

echo "checking $HEALTH"
if ! out="$(curl -fsS --max-time 15 "$HEALTH")"; then
  echo "FAILED — /health did not answer. Last log lines:"
  ssh "$HOST" "journalctl -u $UNIT -n 40 --no-pager" || true
  exit 1
fi
echo "$out"

# The point of the whole exercise: is the leaderboard actually there?
case "$out" in
  *'"boards":true'*) echo "OK — the boards endpoint is live on this server" ;;
  *) echo "WARNING — /health answered but reports no boards feature; the old file may still be running"; exit 1 ;;
esac
