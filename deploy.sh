#!/usr/bin/env bash
# ============================================================
# DomuLabs — deploy to production
#
# The site is a static git checkout served straight by nginx:
#   laptop --push--> GitHub --timer--> /var/www/html on EC2
#
# domulabs-deploy.timer runs on the server every minute and does a
# `git reset --hard origin/main`, so the push IS the deploy. This script
# pushes and then polls the live site until it serves exactly what is in
# the working tree. No SSH (the server only accepts port 22 over the VPN)
# and no build step. Run from the repo root:  ./deploy.sh
# ============================================================
set -euo pipefail

BRANCH="main"
SITE="https://domudame.com"
TIMEOUT=300                      # seconds to wait for the timer to pick up the push
INTERVAL=10                      # seconds between polls

# "<url path>:<local file it must match byte-for-byte>"
PAGES=(
	"/:index.html"
	"/products.html:products.html"
)

cd "$(dirname "$0")"

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

# sha256 of a file — shasum on macOS, sha256sum on the Linux box.
sha_of() {
	if command -v shasum >/dev/null 2>&1; then
		shasum -a 256 "$1" | cut -d' ' -f1
	else
		sha256sum "$1" | cut -d' ' -f1
	fi
}

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

for entry in "${PAGES[@]}"; do
	file="${entry#*:}"
	[ -f "$file" ] || { echo "✗ Missing local file '$file'." >&2; exit 1; }
done

local_sha=$(git rev-parse HEAD)
echo "→ Deploying ${local_sha:0:7} ($(git log -1 --format=%s))"

# ---------- Push ----------
git push origin "$BRANCH"

# ---------- Wait for the server to serve it ----------
# Hash the served bytes against the local file rather than comparing sizes:
# an edit that keeps the length identical (2016 -> 2017) would slip past a
# byte-count check.
echo "→ Waiting for the deploy timer (polling every ${INTERVAL}s, up to ${TIMEOUT}s)"

deadline=$((SECONDS + TIMEOUT))
attempt=0
synced=0

while :; do
	attempt=$((attempt + 1))
	in_sync=0

	for entry in "${PAGES[@]}"; do
		path="${entry%%:*}"
		file="${entry#*:}"

		# Cache-buster and no-cache header so a stale intermediary can never
		# be mistaken for a completed deploy.
		code=$(curl -sS --max-time 20 -H 'Cache-Control: no-cache' \
			-o "$tmp/body" -w '%{http_code}' "${SITE}${path}?_=${attempt}") || code="000"

		if [ "$code" = "200" ] && [ "$(sha_of "$tmp/body")" = "$(sha_of "$file")" ]; then
			in_sync=$((in_sync + 1))
		fi
	done

	if [ "$in_sync" -eq "${#PAGES[@]}" ]; then
		synced=1
		break
	fi

	if [ "$SECONDS" -ge "$deadline" ]; then
		break
	fi

	printf '  [%3ds] %d/%d pages in sync\n' "$SECONDS" "$in_sync" "${#PAGES[@]}"
	sleep "$INTERVAL"
done

# ---------- Report ----------
if [ "$synced" -ne 1 ]; then
	echo "✗ Still out of sync after ${TIMEOUT}s." >&2
	echo "  The push landed, so the deploy timer on the server is likely stalled." >&2
	echo "  On the VPN, check it with:" >&2
	echo "    ssh forex-alertd 'systemctl status domulabs-deploy.timer domulabs-deploy.service'" >&2
	exit 1
fi

echo "✓ Live at $SITE"
for entry in "${PAGES[@]}"; do
	path="${entry%%:*}"
	file="${entry#*:}"
	printf '  %-16s 200  %sB\n' "$path" "$(wc -c < "$file" | tr -d ' ')"
done
