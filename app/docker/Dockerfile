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

# Create workspace defaults directory
RUN mkdir -p /defaults/workspace/config /defaults/workspace/skills /defaults/workspace/memory /defaults/workspace/reference

# Copy entrypoint script
COPY app/docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Set display for Chrome
ENV DISPLAY=:99

# Expose ports: OpenClaw gateway + noVNC
EXPOSE 18789 6080

USER node

ENTRYPOINT ["/entrypoint.sh"]
