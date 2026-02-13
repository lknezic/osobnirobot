#!/bin/bash
set -e

echo "♦ InstantWorker Container Starting..."

# ————————————————————————————————
# 1. Initialize config if first run
# ————————————————————————————————
OPENCLAW_HOME="/home/node/.openclaw"
CONFIG_FILE="$OPENCLAW_HOME/openclaw.json"

# Link persistent data directories
if [ ! -d "$OPENCLAW_HOME" ]; then
    mkdir -p "$OPENCLAW_HOME"
fi

# Ensure workspace exists
mkdir -p "$OPENCLAW_HOME/workspace"

# Copy default workspace files if empty
if [ ! -f "$OPENCLAW_HOME/workspace/SOUL.md" ] && [ -d /defaults/workspace ]; then
    cp -rn /defaults/workspace/* "$OPENCLAW_HOME/workspace/" 2>/dev/null || true
    echo "♦ Default workspace files copied"
fi

# Generate config from environment if no config exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo "♦♦  Generating openclaw.json from environment..."
    cat > "$CONFIG_FILE" << CONFIGEOF
{
  "gateway": {
    "port": ${OPENCLAW_GATEWAY_PORT:-18789},
    "bind": "lan",
    "auth": {
      "mode": "token",
      "token": "${GATEWAY_TOKEN}"
    },
    "controlUi": {
      "enabled": true,
      "allowInsecureAuth": true
    }
  },
  "models": {
    "providers": {
      "google": {
        "apiKey": "${GOOGLE_AI_KEY}",
        "baseUrl": "https://generativelanguage.googleapis.com/v1beta",
        "models": [{"id": "gemini-2.0-flash", "name": "Gemini 2.0 Flash"}]
      },
      "anthropic": {
        "apiKey": "${ANTHROPIC_API_KEY}",
        "baseUrl": "https://api.anthropic.com",
        "models": [{"id": "claude-sonnet-4-20250514", "name": "Claude Sonnet 4"}]
      }
    }
  },
  "agents": {
    "defaults": {
      "workspace": "${OPENCLAW_HOME}/workspace"
    }
  },
  "messages": {
    "responsePrefix": "auto"
  }
}
CONFIGEOF
    echo "♦ Config generated"
fi

# Customize UI with worker name
if [ -n "$ASSISTANT_NAME" ] && [ -f /app/dist/control-ui/index.html ]; then
    sed -i "s|__OPENCLAW_ASSISTANT_NAME__=\"Assistant\"|__OPENCLAW_ASSISTANT_NAME__=\"${ASSISTANT_NAME}\"|" /app/dist/control-ui/index.html
    sed -i "s|__OPENCLAW_ASSISTANT_AVATAR__=\"A\"|__OPENCLAW_ASSISTANT_AVATAR__=\"${ASSISTANT_NAME:0:1}\"|" /app/dist/control-ui/index.html
fi

# Inject inline CSS as backup (in case the external CSS link wasn't injected at build)
if [ -f /app/dist/control-ui/index.html ]; then
    grep -q "custom-ui.css" /app/dist/control-ui/index.html || \
    sed -i 's|</head>|<link rel="stylesheet" href="./assets/custom-ui.css"></head>|' /app/dist/control-ui/index.html
    # Also inject a minimal inline style as nuclear fallback
    sed -i 's|</head>|<style>aside[class*="nav"]{display:none!important;width:0!important}[class*="shell"]{grid-template-columns:0px 1fr!important}[class*="brand"]{display:none!important}[class*="nav-collapse"]{display:none!important}main[class*="content"]{grid-column:1/-1!important}</style></head>|' /app/dist/control-ui/index.html
fi

# Fix any config issues
rm -f /tmp/.X99-lock
openclaw doctor --fix 2>/dev/null || true

# ————————————————————————————————
# 2. Start Xvfb (virtual display for Chrome)
# ————————————————————————————————
echo "♦♦  Starting Xvfb on display :99..."
Xvfb :99 -screen 0 1280x800x24 -ac +extension GLX +render -noreset &
XVFB_PID=$!
sleep 1

# Verify Xvfb is running
if ! kill -0 $XVFB_PID 2>/dev/null; then
    echo "♦ Xvfb failed to start"
    exit 1
fi
echo "♦ Xvfb running (PID: $XVFB_PID)"

# ————————————————————————————————
# 3. Start x11vnc (VNC server for the display)
# ————————————————————————————————
echo "♦ Starting x11vnc..."
x11vnc -display :99 -nopw -listen 0.0.0.0 -xkb -ncache 10 -ncache_cr \
    -forever -shared -rfbport 5900 -bg -o /tmp/x11vnc.log
sleep 1

echo "♦ x11vnc running on port 5900"

# ————————————————————————————————
# 4. Start noVNC (web-based VNC client)
# ————————————————————————————————
echo "♦ Starting noVNC on port ${NOVNC_PORT:-6080}..."
websockify --web=/usr/share/novnc/ ${NOVNC_PORT:-6080} localhost:5900 &
NOVNC_PID=$!
sleep 1

if ! kill -0 $NOVNC_PID 2>/dev/null; then
    echo "♦ noVNC failed to start"
    exit 1
fi
echo "♦ noVNC running on port ${NOVNC_PORT:-6080}"

# ————————————————————————————————
# 5. Start OpenClaw Gateway
# ————————————————————————————————
echo "♦ Starting OpenClaw Gateway..."
echo "   Config: $CONFIG_FILE"
echo "   Model: ${MODEL_PRIMARY:-google/gemini-2.0-flash}"
echo "   Port: ${OPENCLAW_GATEWAY_PORT:-18789}"

# Start OpenClaw gateway (the main process)
exec node /app/dist/index.js gateway --allow-unconfigured
