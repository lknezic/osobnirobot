#!/usr/bin/env bash
set -euo pipefail

# InstantWorker - Hetzner Deploy Script
# Run: ssh root@YOUR_IP 'bash -s' < infra/deploy.sh
#
# Prerequisites:
#   - Fresh Ubuntu 22.04+ on Hetzner
#   - DNS A records pointing to this server:
#       *.gw.instantworker.ai  -> SERVER_IP
#       *.vnc.instantworker.ai -> SERVER_IP
#   - Cloudflare API token with Zone:DNS:Edit permissions

INSTALL_DIR="/opt/instantworker"
NODE_VERSION="20"

echo "=== InstantWorker Hetzner Deploy ==="

# ── 1. System packages ──
echo "[1/8] Installing system packages..."
apt-get update -qq
apt-get install -y -qq curl git ufw

# ── 2. Node.js ──
echo "[2/8] Installing Node.js ${NODE_VERSION}..."
if ! command -v node &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y -qq nodejs
fi
echo "Node: $(node -v)"

# ── 3. Docker ──
echo "[3/8] Installing Docker..."
if ! command -v docker &>/dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi
echo "Docker: $(docker -v)"

# ── 4. Caddy with Cloudflare DNS plugin ──
echo "[4/8] Installing Caddy with Cloudflare DNS module..."
if ! command -v caddy &>/dev/null; then
    apt-get install -y -qq debian-keyring debian-archive-keyring apt-transport-https
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
    apt-get update -qq
    apt-get install -y -qq caddy
fi
# Build custom Caddy with Cloudflare module
caddy add-package github.com/caddy-dns/cloudflare 2>/dev/null || true
echo "Caddy: $(caddy version)"

# ── 5. Firewall ──
echo "[5/8] Configuring firewall..."
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP (Caddy redirect)
ufw allow 443/tcp   # HTTPS (Caddy)
# Port ranges for direct container access (Caddy proxies via localhost, but just in case)
# ufw allow 20000:23999/tcp  # Uncomment only if needed for debugging
ufw --force enable

# ── 6. Clone/update code ──
echo "[6/8] Setting up code..."
if [ -d "$INSTALL_DIR/.git" ]; then
    cd "$INSTALL_DIR"
    git pull
else
    git clone https://github.com/lknezic/osobnirobot.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

# ── 7. Build orchestrator ──
echo "[7/8] Building orchestrator..."
cd "$INSTALL_DIR/app/orchestrator"
npm install --production=false
npm run build

# Create .env if missing
if [ ! -f .env ]; then
    echo "WARNING: No .env file found at $INSTALL_DIR/app/orchestrator/.env"
    echo "Copy .env.example and fill in your secrets:"
    echo "  cp .env.example .env && nano .env"
fi

# ── 8. Install services ──
echo "[8/8] Installing services..."

# Caddy config
cp "$INSTALL_DIR/infra/Caddyfile" /etc/caddy/Caddyfile

# Create Caddy environment file for Cloudflare token
if [ ! -f /etc/caddy/env ]; then
    echo "CLOUDFLARE_API_TOKEN=REPLACE_ME" > /etc/caddy/env
    chmod 600 /etc/caddy/env
    echo "WARNING: Set your Cloudflare API token in /etc/caddy/env"
fi

# Update Caddy systemd to load env file
mkdir -p /etc/systemd/system/caddy.service.d
cat > /etc/systemd/system/caddy.service.d/override.conf << 'EOF'
[Service]
EnvironmentFile=/etc/caddy/env
EOF

# Orchestrator systemd
cp "$INSTALL_DIR/infra/orchestrator.service" /etc/systemd/system/iw-orchestrator.service

systemctl daemon-reload
systemctl enable caddy iw-orchestrator
systemctl restart caddy
systemctl restart iw-orchestrator

# ── 9. Build Docker image ──
echo "[9] Building worker Docker image..."
cd "$INSTALL_DIR"
docker build -t instantworker/worker:latest -f app/docker/Dockerfile .

echo ""
echo "=== Deploy complete ==="
echo ""
echo "Remaining manual steps:"
echo "  1. Set Cloudflare token:  nano /etc/caddy/env"
echo "  2. Set orchestrator env:  nano $INSTALL_DIR/app/orchestrator/.env"
echo "  3. Restart after config:  systemctl restart caddy iw-orchestrator"
echo "  4. Set Vercel env vars:"
echo "     ORCHESTRATOR_URL=http://YOUR_SERVER_IP:3500"
echo "     ORCHESTRATOR_SECRET=<same as in .env>"
echo ""
echo "Verify:"
echo "  curl http://localhost:3500/health"
echo "  systemctl status iw-orchestrator"
echo "  systemctl status caddy"
echo "  journalctl -u iw-orchestrator -f"
