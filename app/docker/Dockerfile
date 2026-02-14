# InstantWorker Container
# Based on OpenClaw (open-source AI agent) with VNC for browser automation
#
# Build: docker build -t instantworker/worker:latest -f app/docker/Dockerfile .
# Run:   docker run -d --name iw-test \
#          -e GATEWAY_TOKEN=test-token \
#          -e GOOGLE_AI_KEY=your-key \
#          -p 20000:18789 -p 21000:6080 \
#          instantworker/worker:latest

FROM alpine/openclaw:latest

USER root

# Install VNC and browser dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    xvfb \
    x11vnc \
    novnc \
    websockify \
    chromium \
    fonts-liberation \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libgbm1 \
    && rm -rf /var/lib/apt/lists/*

# Copy worker template defaults into image
# Shared files (playbooks, docs, memory, learning) go to all workers
COPY worker-templates/_shared/ /defaults/workspace/

# Copy per-worker templates (x-commenter, x-tweet-writer, etc.)
# These are selected at runtime by entrypoint based on WORKER_TYPE env var
COPY worker-templates/ /defaults/templates/

# Ensure directory structure exists
RUN mkdir -p /defaults/workspace/config /defaults/workspace/skills /defaults/workspace/memory /defaults/workspace/reference

# Copy entrypoint script
COPY app/docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Custom UI overrides — inject InstantWorker branding into OpenClaw control UI
COPY app/docker/custom-ui.css /app/dist/control-ui/assets/custom-ui.css
COPY app/docker/iw-customize.js /app/dist/control-ui/assets/iw-customize.js
RUN sed -i 's|</head>|<link rel="stylesheet" href="./assets/custom-ui.css"></head>|' /app/dist/control-ui/index.html \
    && sed -i 's|</head>|<script src="./assets/iw-customize.js" defer></script></head>|' /app/dist/control-ui/index.html \
    && sed -i 's|<title>OpenClaw Control</title>|<title>InstantWorker</title>|' /app/dist/control-ui/index.html

# Set display for Chrome
ENV DISPLAY=:99

# Expose ports: OpenClaw gateway + noVNC
EXPOSE 18789 6080

# Ensure node user owns its .openclaw directory so entrypoint can write config
RUN mkdir -p /home/node/.openclaw/workspace && chown -R node:node /home/node/.openclaw

USER node

ENTRYPOINT ["/entrypoint.sh"]
