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
    # 1. Copy shared files (reference, docs, memory, learning protocol, etc.)
    cp -rn /defaults/workspace/* "$OPENCLAW_HOME/workspace/" 2>/dev/null || true
    echo "♦ Shared workspace files copied"

    # 2. Copy worker-type-specific files (SOUL.md, HEARTBEAT.md, skills/, config/)
    WORKER_TYPE="${WORKER_TYPE:-x-commenter}"
    if [ -d "/defaults/templates/${WORKER_TYPE}" ]; then
        cp -rn "/defaults/templates/${WORKER_TYPE}/"* "$OPENCLAW_HOME/workspace/" 2>/dev/null || true
        echo "♦ Worker template '${WORKER_TYPE}' applied"
    else
        echo "♦ WARNING: No template found for worker type '${WORKER_TYPE}', using shared defaults only"
    fi
fi

# Generate config from environment if no config exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo "♦♦  Generating openclaw.json from environment..."

    if [ -n "${LITELLM_URL:-}" ] && [ -n "${LITELLM_KEY:-}" ]; then
        # LiteLLM proxy mode — containers never see real API keys
        echo "♦ Using LiteLLM proxy at ${LITELLM_URL}"
        # Sanitize ASSISTANT_NAME for JSON (escape quotes and backslashes)
    SAFE_NAME=$(echo "${ASSISTANT_NAME:-Assistant}" | sed 's/\\/\\\\/g; s/"/\\"/g')

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
      "openai": {
        "apiKey": "${LITELLM_KEY}",
        "baseUrl": "${LITELLM_URL}/v1",
        "models": [
          {"id": "gemini-2.0-flash", "name": "Gemini 2.0 Flash"},
          {"id": "claude-sonnet-4", "name": "Claude Sonnet 4"}
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "workspace": "${OPENCLAW_HOME}/workspace"
    },
    "list": [{"id": "main", "identity": {"name": "${SAFE_NAME}"}}]
  },
  "messages": {
    "responsePrefix": "auto"
  }
}
CONFIGEOF
    else
        # Direct API key mode (fallback — not recommended for production)
        SAFE_NAME=$(echo "${ASSISTANT_NAME:-Assistant}" | sed 's/\\/\\\\/g; s/"/\\"/g')

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
    },
    "list": [{"id": "main", "identity": {"name": "${SAFE_NAME}"}}]
  },
  "messages": {
    "responsePrefix": "auto"
  }
}
CONFIGEOF
    fi
    echo "♦ Config generated"
fi

# Note: Worker name is set via agents.list[].identity.name in openclaw.json (generated above).
# The OpenClaw control UI reads the name from the agent config automatically.

# Inject CSS + JS as backup (in case not injected at build time)
if [ -f /app/dist/control-ui/index.html ]; then
    grep -q "custom-ui.css" /app/dist/control-ui/index.html || \
    sed -i 's|</head>|<link rel="stylesheet" href="./assets/custom-ui.css"></head>|' /app/dist/control-ui/index.html
    grep -q "iw-customize.js" /app/dist/control-ui/index.html || \
    sed -i 's|</head>|<script src="./assets/iw-customize.js" defer></script></head>|' /app/dist/control-ui/index.html
fi

# ————————————————————————————————
# 1b. Configure HTTP proxy for browser isolation
# ————————————————————————————————
if [ -n "${WORKER_PROXY_URL:-}" ]; then
    echo "♦ Configuring browser proxy: ${WORKER_PROXY_URL%%@*}@***"
    export HTTP_PROXY="$WORKER_PROXY_URL"
    export HTTPS_PROXY="$WORKER_PROXY_URL"
    export http_proxy="$WORKER_PROXY_URL"
    export https_proxy="$WORKER_PROXY_URL"
    # Don't proxy local traffic (OpenClaw gateway, VNC, localhost)
    export NO_PROXY="localhost,127.0.0.1,0.0.0.0"
    export no_proxy="localhost,127.0.0.1,0.0.0.0"

    # Write Chromium proxy flags so OpenClaw's browser uses the proxy
    mkdir -p "$OPENCLAW_HOME/browser"
    cat > "$OPENCLAW_HOME/browser/chromium-flags.conf" << EOF
--proxy-server=${WORKER_PROXY_URL}
EOF
    # Set CHROMIUM_FLAGS for any Chromium launch
    export CHROMIUM_FLAGS="--proxy-server=${WORKER_PROXY_URL}"
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
