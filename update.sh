#!/bin/bash
#
# Ling Hua - quick update for a server already set up with deploy.sh.
# Pulls the latest master, updates Python and Node packages, rebuilds the
# website and restarts the backend. Does not touch nginx, SSL or the firewall.
#
# Usage (run from the install folder):
#   sudo bash update.sh <domain>
#
# The "Deploy to Huawei Cloud" GitHub workflow runs this on every merge.

set -euo pipefail

DOMAIN="${1:-}"
[[ -n "$DOMAIN" ]] || { echo "Usage: sudo bash update.sh <domain>"; exit 1; }
[[ $EUID -eq 0 ]] || { echo "Run as root (use sudo)."; exit 1; }

INSTALL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_ROOT="/var/www/linghua"
SERVICE_NAME="linghua-backend"
SECRETS_FILE="${LINGHUA_SECRETS:-/etc/linghua/backend.env}"

log() { echo "==> $*"; }

cd "$INSTALL_DIR"
log "Updating code..."
git fetch origin master
git reset --hard FETCH_HEAD
log "Now at $(git log -1 --format='%h %s')"

log "Updating backend packages..."
cd "$INSTALL_DIR/backend"
# shellcheck source=/dev/null
source venv/bin/activate
pip install --quiet -r requirements.txt
deactivate

# Refresh backend/.env from the private secrets file, same as deploy.sh
if [[ -f "$SECRETS_FILE" ]]; then
  install -m 600 /dev/null "$INSTALL_DIR/backend/.env"
  cat "$SECRETS_FILE" > "$INSTALL_DIR/backend/.env"
  cat >> "$INSTALL_DIR/backend/.env" <<EOF

# ---- managed by deploy.sh / update.sh (edit keys in $SECRETS_FILE, not here) ----
FLASK_DEBUG=false
FLASK_HOST=127.0.0.1
FLASK_PORT=5000
CORS_ORIGINS=https://${DOMAIN}
EOF
fi

# The backend runs as www-data, so it must be able to read its files and .env
# (same as deploy.sh). Without this the new root-owned .env stops it starting.
chown -R www-data:www-data "$INSTALL_DIR/backend"

log "Restarting backend..."
systemctl restart "$SERVICE_NAME"

log "Building website..."
cd "$INSTALL_DIR"
sed -i "s|^VITE_API_BASE=.*|VITE_API_BASE=\"https://${DOMAIN}/api\"|" "$INSTALL_DIR/.env"
npm install --include=dev --legacy-peer-deps --no-audit --no-fund
npm run build
mkdir -p "$WEB_ROOT"
rm -rf "${WEB_ROOT:?}"/*
cp -r "$INSTALL_DIR/dist/." "$WEB_ROOT/"
chown -R www-data:www-data "$WEB_ROOT"

sleep 10
if systemctl is-active --quiet "$SERVICE_NAME"; then
  log "Done. Backend is running and the website is updated."
else
  systemctl status "$SERVICE_NAME" --no-pager || true
  echo "Backend failed to start." >&2
  exit 1
fi
