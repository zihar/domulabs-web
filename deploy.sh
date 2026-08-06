#!/usr/bin/env bash
# ============================================================
# DomuLabs — deploy to production
#
# The site is a static git checkout served straight by nginx:
#   laptop --push--> GitHub --pull--> /var/www/html on EC2
# No build step. Run from the repo root:  ./deploy.sh
# ============================================================
set -euo pipefail

SSH_HOST="forex-alertd"          # alias in ~/.ssh/config (ubuntu@18.136.57.118)
DOCROOT="/var/www/html"          # nginx root for the `default` server block
BRANCH="main"
SITE="https://domudame.com"

cd "$(dirname "$0")"

# ---------- Preflight ----------
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$current_branch" != "$BRANCH" ]; then
	echo "✗ On branch '$current_branch', expected '$BRANCH'." >&2
	exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
	echo "✗ Working tree is dirty — commit or stash first:" >&2
	git status --short >&2
	exit 1
fi

local_sha=$(git rev-parse HEAD)
echo "→ Deploying ${local_sha:0:7} ($(git log -1 --format=%s))"

# ---------- Push ----------
git push origin "$BRANCH"

# ---------- Pull on the server ----------
# The checkout is owned by www-data, so pull as that user to keep file
# ownership intact and avoid git's dubious-ownership refusal.
remote_sha=$(ssh "$SSH_HOST" "
	set -e
	sudo -u www-data git -C '$DOCROOT' fetch origin '$BRANCH' --quiet
	sudo -u www-data git -C '$DOCROOT' reset --hard 'origin/$BRANCH' --quiet
	sudo -u www-data git -C '$DOCROOT' rev-parse HEAD
")

# ---------- Verify ----------
# 'git pull' can print "Already up to date" even when files change, so trust
# the commit hash and the live responses instead of the pull output.
if [ "$remote_sha" != "$local_sha" ]; then
	echo "✗ Server is at ${remote_sha:0:7}, expected ${local_sha:0:7}." >&2
	exit 1
fi
echo "✓ Server checked out ${remote_sha:0:7}"

failed=0
for path in "/" "/products.html"; do
	code=$(curl -sS -o /dev/null -w '%{http_code}' "${SITE}${path}" --max-time 20)
	printf '  %-16s %s\n' "$path" "$code"
	[ "$code" = "200" ] || failed=1
done

if [ "$failed" -ne 0 ]; then
	echo "✗ Live check failed." >&2
	exit 1
fi

# Compare the served homepage against the local file — catches a stale cache
# or a checkout that silently did not update the working tree.
live_bytes=$(curl -sS "${SITE}/" --max-time 20 | wc -c | tr -d ' ')
local_bytes=$(wc -c < index.html | tr -d ' ')
if [ "$live_bytes" != "$local_bytes" ]; then
	echo "✗ index.html mismatch: live ${live_bytes}B vs local ${local_bytes}B." >&2
	exit 1
fi

echo "✓ Live at $SITE (index.html ${live_bytes}B)"
