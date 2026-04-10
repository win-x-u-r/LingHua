#!/bin/bash
#
# Ling Hua - One-shot deployment script for Ubuntu 22.04 ECS
#
# Usage:
#   sudo bash deploy.sh <domain> <email> [--skip-ssl]
#
# Example:
#   sudo bash deploy.sh linghua.example.com admin@example.com
#
# What this script does:
#   1. Installs system dependencies (Python, Node.js, nginx, certbot)
#   2. Clones the repository to /opt/linghua
#   3. Installs backend dependencies and creates a systemd service
#   4. Builds the frontend with production .env
#   5. Configures nginx as a reverse proxy
#   6. Issues a Let's Encrypt SSL certificate
#   7. Starts and enables all services
#
# Prerequisites (you do these manually first):
#   - DNS A record pointing <domain> to this server's public IP
#   - Security group allows ports 22, 80, 443 inbound
#   - You have HUAWEI_AK and HUAWEI_SK ready to paste when prompted
#   - You have your Supabase URL and publishable key ready
#

set -euo pipefail

# ─────────────────────────────────────────────
#  Args & defaults
# ─────────────────────────────────────────────
DOMAIN="${1:-}"
EMAIL="${2:-}"
SKIP_SSL=false
REPO_URL="https://github.com/win-x-u-r/LingHua.git"
INSTALL_DIR="/opt/linghua"
WEB_ROOT="/var/www/linghua"
SERVICE_NAME="linghua-backend"

if [[ "${3:-}" == "--skip-ssl" ]]; then
  SKIP_SSL=true
fi

if [[ -z "$DOMAIN" || -z "$EMAIL" ]]; then
  echo "Usage: sudo bash deploy.sh <domain> <email> [--skip-ssl]"
  echo "Example: sudo bash deploy.sh linghua.example.com admin@example.com"
  exit 1
fi

if [[ $EUID -ne 0 ]]; then
  echo "This script must be run as root (use sudo)."
  exit 1
fi

# ─────────────────────────────────────────────
#  Colored output helpers
# ─────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}==>${NC} $*"; }
warn() { echo -e "${YELLOW}!!${NC} $*"; }
die()  { echo -e "${RED}error:${NC} $*" >&2; exit 1; }

# ─────────────────────────────────────────────
#  Step 1 — System dependencies
# ─────────────────────────────────────────────
log "Updating package list..."
apt-get update -qq

log "Installing system packages..."
apt-get install -y -qq \
  curl git build-essential \
  python3 python3-pip python3-venv \
  nginx certbot python3-certbot-nginx \
  ufw

# Install Node.js 20 from NodeSource (Ubuntu's default is too old)
if ! command -v node >/dev/null || [[ "$(node -v | cut -dv -f2 | cut -d. -f1)" -lt 18 ]]; then
  log "Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null
  apt-get install -y -qq nodejs
fi

log "Versions installed:"
echo "  python: $(python3 --version)"
echo "  node:   $(node --version)"
echo "  npm:    $(npm --version)"
echo "  nginx:  $(nginx -v 2>&1)"

# ─────────────────────────────────────────────
#  Step 2 — Clone repository
# ─────────────────────────────────────────────
if [[ -d "$INSTALL_DIR/.git" ]]; then
  log "Repo already exists, pulling latest..."
  cd "$INSTALL_DIR"
  git fetch --all
  git reset --hard origin/main
else
  log "Cloning repository to $INSTALL_DIR..."
  git clone "$REPO_URL" "$INSTALL_DIR"
  cd "$INSTALL_DIR"
fi

# ─────────────────────────────────────────────
#  Step 3 — Backend setup
# ─────────────────────────────────────────────
log "Setting up Python virtual environment..."
cd "$INSTALL_DIR/backend"
python3 -m venv venv
# shellcheck source=/dev/null
source venv/bin/activate
pip install --upgrade pip --quiet
pip install --quiet -r requirements.txt
pip install --quiet gunicorn websocket-client \
  huaweicloudsdkcore huaweicloudsdksis huaweicloudsdknlp
deactivate

# Backend .env
if [[ ! -f "$INSTALL_DIR/backend/.env" ]]; then
  log "Backend .env not found — creating template..."
  warn "You MUST edit $INSTALL_DIR/backend/.env with your Huawei credentials before continuing."
  cat > "$INSTALL_DIR/backend/.env" <<EOF
# Huawei Cloud Credentials — REQUIRED
HUAWEI_AK=PASTE_YOUR_AK_HERE
HUAWEI_SK=PASTE_YOUR_SK_HERE

# SIS (Speech) — ME-Riyadh
HUAWEI_SIS_REGION=me-east-1
HUAWEI_SIS_PROJECT_ID=PASTE_YOUR_SIS_PROJECT_ID

# NLP (Translation) — CN-North-Beijing4
HUAWEI_NLP_REGION=cn-north-4
HUAWEI_NLP_PROJECT_ID=PASTE_YOUR_NLP_PROJECT_ID

# Legacy fallback
HUAWEI_REGION=me-east-1
HUAWEI_PROJECT_ID=PASTE_YOUR_SIS_PROJECT_ID

# Flask
FLASK_DEBUG=false
FLASK_HOST=127.0.0.1
FLASK_PORT=5000

# CORS — your production domain
CORS_ORIGINS=https://${DOMAIN}
EOF
  echo
  read -rp "Open the file now? (y/N) " open_now
  if [[ "$open_now" =~ ^[Yy]$ ]]; then
    ${EDITOR:-nano} "$INSTALL_DIR/backend/.env"
  else
    die "Edit $INSTALL_DIR/backend/.env, then re-run this script."
  fi
fi

# Create systemd service
log "Creating systemd service for backend..."
cat > /etc/systemd/system/${SERVICE_NAME}.service <<EOF
[Unit]
Description=Ling Hua Flask Backend (gunicorn)
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=${INSTALL_DIR}/backend
EnvironmentFile=${INSTALL_DIR}/backend/.env
ExecStart=${INSTALL_DIR}/backend/venv/bin/gunicorn \\
    --workers 4 \\
    --bind 127.0.0.1:5000 \\
    --timeout 60 \\
    --access-logfile /var/log/${SERVICE_NAME}.access.log \\
    --error-logfile /var/log/${SERVICE_NAME}.error.log \\
    app:app
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Make sure www-data owns the install dir
chown -R www-data:www-data "$INSTALL_DIR/backend"

# Create empty log files with correct ownership
touch /var/log/${SERVICE_NAME}.access.log /var/log/${SERVICE_NAME}.error.log
chown www-data:www-data /var/log/${SERVICE_NAME}.*.log

systemctl daemon-reload
systemctl enable --now ${SERVICE_NAME}.service
sleep 2

if systemctl is-active --quiet ${SERVICE_NAME}; then
  log "Backend service is running."
else
  warn "Backend service failed to start. Check logs:"
  echo "  journalctl -u ${SERVICE_NAME} -n 50"
  systemctl status ${SERVICE_NAME} --no-pager || true
fi

# ─────────────────────────────────────────────
#  Step 4 — Frontend build
# ─────────────────────────────────────────────
log "Building frontend..."
cd "$INSTALL_DIR"

# Frontend .env
if [[ ! -f "$INSTALL_DIR/.env" ]]; then
  warn "Frontend .env not found — creating template..."
  cat > "$INSTALL_DIR/.env" <<EOF
VITE_SUPABASE_PROJECT_ID="PASTE_YOUR_PROJECT_ID"
VITE_SUPABASE_PUBLISHABLE_KEY="PASTE_YOUR_PUBLISHABLE_KEY"
VITE_SUPABASE_URL="https://PASTE_YOUR_PROJECT_ID.supabase.co"
VITE_API_BASE="https://${DOMAIN}/api"
EOF
  read -rp "Open the file now? (y/N) " open_now
  if [[ "$open_now" =~ ^[Yy]$ ]]; then
    ${EDITOR:-nano} "$INSTALL_DIR/.env"
  else
    die "Edit $INSTALL_DIR/.env, then re-run this script."
  fi
fi

# Force VITE_API_BASE to the production domain
sed -i "s|^VITE_API_BASE=.*|VITE_API_BASE=\"https://${DOMAIN}/api\"|" "$INSTALL_DIR/.env"

npm install --silent
npm run build

mkdir -p "$WEB_ROOT"
rm -rf "${WEB_ROOT:?}"/*
cp -r "$INSTALL_DIR/dist/." "$WEB_ROOT/"
chown -R www-data:www-data "$WEB_ROOT"

# ─────────────────────────────────────────────
#  Step 5 — nginx configuration
# ─────────────────────────────────────────────
log "Configuring nginx..."
cat > /etc/nginx/sites-available/linghua <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    root ${WEB_ROOT};
    index index.html;

    # Increase upload size for audio recordings
    client_max_body_size 25M;

    # SPA routing — fall back to index.html
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 90s;
        proxy_send_timeout 90s;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
EOF

ln -sf /etc/nginx/sites-available/linghua /etc/nginx/sites-enabled/linghua
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl reload nginx

# ─────────────────────────────────────────────
#  Step 6 — Firewall
# ─────────────────────────────────────────────
log "Configuring firewall..."
ufw --force enable
ufw allow OpenSSH
ufw allow 'Nginx Full'

# ─────────────────────────────────────────────
#  Step 7 — SSL via Let's Encrypt
# ─────────────────────────────────────────────
if [[ "$SKIP_SSL" == "true" ]]; then
  warn "Skipping SSL setup (--skip-ssl flag set)"
else
  log "Issuing Let's Encrypt certificate for ${DOMAIN}..."
  if certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect; then
    log "SSL certificate installed successfully."
  else
    warn "Certbot failed. Make sure your DNS A record points to this server."
    warn "You can retry later with: sudo certbot --nginx -d ${DOMAIN}"
  fi
fi

# ─────────────────────────────────────────────
#  Done
# ─────────────────────────────────────────────
echo
log "Deployment complete!"
echo
echo "  Frontend:  https://${DOMAIN}"
echo "  Backend:   https://${DOMAIN}/api/health"
echo
echo "Useful commands:"
echo "  sudo systemctl status ${SERVICE_NAME}        # backend status"
echo "  sudo systemctl restart ${SERVICE_NAME}       # restart backend"
echo "  sudo journalctl -u ${SERVICE_NAME} -f        # tail backend logs"
echo "  sudo tail -f /var/log/nginx/access.log       # nginx access logs"
echo "  cd ${INSTALL_DIR} && git pull && sudo bash deploy.sh ${DOMAIN} ${EMAIL}  # redeploy"
echo
