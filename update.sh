#!/bin/bash
#
# Ling Hua - quick update for a server already set up with deploy.sh.
# Pulls the latest master, updates Python and Node packages, rebuilds the
# website and restarts the backend. Keeps nginx's cache rules up to date
# (nginx-cache.conf); does not touch SSL or the firewall.
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
mkdir -p "$WEB_ROOT/assets"
# Replace everything except assets/. Old hashed files in assets/ stay for a week,
# so a page that is still open from the last release can finish loading its parts.
find "${WEB_ROOT:?}" -mindepth 1 -maxdepth 1 ! -name assets -exec rm -rf {} +
find "$WEB_ROOT/assets" -type f -mtime +7 -delete
cp -r "$INSTALL_DIR/dist/." "$WEB_ROOT/"
chown -R www-data:www-data "$WEB_ROOT"

log "Updating nginx cache rules..."
SITE_CONF="/etc/nginx/sites-available/linghua"
SNIPPET="/etc/nginx/snippets/linghua-cache.conf"
install -D -m 644 "$INSTALL_DIR/nginx-cache.conf" "$SNIPPET"
if [[ -f "$SITE_CONF" ]] && ! grep -q "linghua-cache.conf" "$SITE_CONF"; then
  # One-time switch from the old rule that cached every JS file (the service
  # worker too) for 30 days, which kept people on old versions.
  cp "$SITE_CONF" "$SITE_CONF.bak-$(date +%Y%m%d%H%M%S)"
  perl -0pi -e 's![ \t]*# Cache static assets\n[ \t]*location ~\* \\\.\(js\|css\|png\|jpg\|jpeg\|gif\|svg\|woff\|woff2\)\$ \{[^}]*\}\n!    include /etc/nginx/snippets/linghua-cache.conf;\n!g' "$SITE_CONF"
  grep -q "linghua-cache.conf" "$SITE_CONF" || \
    echo "WARNING: could not find the old cache rule in $SITE_CONF. Add this line inside each server { } block that serves the site, then run: sudo nginx -t && sudo systemctl reload nginx
    include /etc/nginx/snippets/linghua-cache.conf;" >&2
elif [[ ! -f "$SITE_CONF" ]]; then
  echo "WARNING: $SITE_CONF not found. Add 'include $SNIPPET;' to the nginx site for ${DOMAIN}." >&2
fi
if nginx -t 2>/dev/null; then
  systemctl reload nginx
else
  nginx -t || true
  LATEST_BAK="$(ls -t "$SITE_CONF".bak-* 2>/dev/null | head -1 || true)"
  if [[ -n "$LATEST_BAK" ]]; then
    echo "nginx did not accept the new cache rules; putting back $LATEST_BAK" >&2
    cp "$LATEST_BAK" "$SITE_CONF"
    nginx -t && systemctl reload nginx
  fi
fi

sleep 10
if systemctl is-active --quiet "$SERVICE_NAME"; then
  log "Done. Backend is running and the website is updated."
else
  systemctl status "$SERVICE_NAME" --no-pager || true
  echo "Backend failed to start." >&2
  exit 1
fi
