# InstantWorker — Security & Architecture Handoff

> For any Claude session working on this project. Read fully before touching Docker, orchestrator, or security code.
> Last updated: 2026-02-12

---

## CURRENT STATE (as-is, deployed and running)

```
[Vercel Frontend] → [Caddy *.instantworker.ai] → [Hetzner Orchestrator :3500] → [Docker containers per user]
                                                     ├── OpenClaw Gateway :18789 (mapped to 20000-20999)
                                                     └── noVNC :6080 (mapped to 21000-21999)

Dashboard iframes: https://{port}.gw.instantworker.ai  /  https://{port}.vnc.instantworker.ai
```

### What's deployed and working:
- **Vercel frontend** — Next.js 14 on `instantworker.ai`, auto-deploys from GitHub
- **Supabase** — Auth (magic link + Google OAuth) + profiles DB, migration v6 applied
- **Stripe** — 3 plans (Simple $99, Expert $399, Legend $499) with 7-day trials, webhook handler complete
- **Caddy reverse proxy** — Wildcard TLS for `*.gw.instantworker.ai` and `*.vnc.instantworker.ai`, strips X-Frame-Options for iframe embedding
- **Orchestrator** — Express on Hetzner port 3500 via pm2, proxied at `api.instantworker.ai`
- **Docker image** — `instantworker/worker:latest` built on Hetzner, based on `alpine/openclaw:latest` + Xvfb/x11vnc/noVNC/Chromium
- **Custom branding** — CSS injected into OpenClaw control UI (hides sidebar, brand, navigation; purple accent colors; "Powered by OpenClaw" badge)
- **Worker templates** — 15 skill templates in `worker-templates/` with SOUL.md/HEARTBEAT.md/config/
- **Trial expiry cron** — Vercel cron job (`/api/cron/check-trials`) runs every 6 hours, stops expired containers, sends warning emails 2 days before expiry via Resend
- **Email system** — Welcome, trial expiring, and payment failed templates via Resend API

### What's NOT done yet (security hardening):
- No LiteLLM proxy — raw API keys injected directly into containers
- No network isolation — containers on default bridge network (have full internet access)
- No container hardening — no cap_drop, no pids_limit, no no-new-privileges
- No tool restrictions in openclaw.json — all tools enabled by default
- No filesystem deny paths — agents can read their own config and API keys
- `trustedProxies: "0.0.0.0/0"` not set but should be narrowed when added
- No monitoring or injection detection

### Key files:
- `app/docker/Dockerfile` — Based on `alpine/openclaw:latest`, installs VNC + browser deps, injects custom CSS
- `app/docker/entrypoint.sh` — Generates `openclaw.json` from env vars, starts Xvfb→VNC→noVNC→OpenClaw
- `app/docker/custom-ui.css` — Hides OpenClaw sidebar/brand, sets InstantWorker purple theme
- `app/orchestrator/src/routes.ts` — Provisions containers via Dockerode, allocates ports 20000-21999, lazy env loading
- `app/orchestrator/src/health.ts` — Health check endpoint
- `app/orchestrator/src/cleanup.ts` — Dangling image cleanup
- `worker-templates/` — 15 skill templates with SOUL.md/HEARTBEAT.md/config/
- `app/api/stripe/webhook/route.ts` — Handles checkout.session.completed, subscription.updated/deleted, invoice.payment_failed
- `app/api/cron/check-trials/route.ts` — Stops expired trial containers, sends warning emails
- `lib/email.ts` — Email templates via Resend
- `middleware.ts` — Auth protection, session refresh on every request

---

## MACRO INSTRUCTIONS (strategic — what to do and why)

### 1. HARDEN EVERY CONTAINER (Critical — do first)

**Why:** CVE-2026-25253 showed that a single malicious link can steal gateway tokens and execute arbitrary commands. 21,639 OpenClaw instances were found publicly exposed. Our containers are internet-facing via wildcard DNS proxy.

**What to do:**
- Drop ALL Linux capabilities (`CapDrop: ['ALL']`)
- Add `--security-opt no-new-privileges:true`
- Add PID limit to prevent fork bombs (`PidsLimit: 200`)
- Restrict filesystem paths the agent can access (deniedPaths)
- Disable tool types we don't need (cron, discord, gateway, nodes, canvas)
- Add exec command allowlist (whitelist, not denylist)
- Add Docker HEALTHCHECK

**Current state:** None of these are applied. Containers run with default Docker privileges.

### 2. ADD LITELLM PROXY LAYER (High priority)

**Why:** Currently, raw API keys (GOOGLE_AI_KEY, ANTHROPIC_API_KEY) are injected directly into every container as env vars. If any container is compromised, attacker gets our API keys. LiteLLM sits between containers and the API — containers never see real keys.

**What to do:**
- Run a single LiteLLM container on the host
- Give it the real API keys
- Give each user container a per-user proxy key (or shared internal key)
- LiteLLM also gives us: rate limiting per user, budget caps, token usage dashboard, model routing

**Bonus from research:** openclaw-optimizer and ClawRouter tools can cut API costs 85-95% via smart model routing (Haiku vs Sonnet). LiteLLM supports this natively with model_list routing.

### 3. NETWORK ISOLATION (High priority)

**Why:** Right now containers can reach any IP on the internet. A compromised agent could exfiltrate data, mine crypto, attack other servers, or call APIs with stolen keys.

**What to do:**
- Create an internal Docker network for agent↔LiteLLM communication
- Containers should NOT have external internet access by default
- If a worker needs web access (browser automation), route through a Squid proxy with domain allowlist
- Only LiteLLM and Squid touch the external network

**Blocker:** Browser workers (X-commenter, etc.) NEED web access to visit social media. Until Squid proxy is set up, either: (a) keep containers on default network (current state, less secure), or (b) disable browser-based workers.

### 4. REVERSE PROXY IMPROVEMENTS (Medium priority)

**Current state:** Caddy is deployed and working with wildcard TLS + WebSocket support + iframe header overrides.

**Still needed:**
- Rate limiting at proxy level (Caddy rate_limit plugin)
- Consider short-lived JWTs instead of static gateway tokens in URLs (tokens visible in browser history, referrer headers, server logs)
- Auth validation at proxy level (don't rely solely on OpenClaw's token)

### 5. AUTO-CLEANUP EXPIRED TRIALS (Done — verify)

**Current state:** Already implemented:
- `app/api/cron/check-trials/route.ts` — Runs every 6 hours via Vercel cron
- Checks Supabase for expired trials and cancelled subscriptions
- Calls orchestrator `/stop` endpoint for expired users
- Sends warning emails 2 days before expiry via Resend

**Still needed:**
- Container REMOVAL after 30 days of inactivity (currently only stops, doesn't remove)
- Extend `cleanup.ts` to handle stale stopped containers

### 6. MONITORING & ALERTING (Medium priority)

**Why:** We need to know if a container is being abused, if API costs spike, if a container escapes isolation.

**What to do:**
- Log all container provisioning/restarts/stops (orchestrator already logs to stdout)
- Monitor API spend per user via LiteLLM dashboard (once deployed)
- Alert on unusual patterns (high API calls, failed health checks, port scanning)
- Session log monitoring for prompt injection patterns (adapted from openclaw-hardened-ansible):
  ```bash
  grep -iH "IGNORE PREVIOUS\|SYSTEM:\|DISREGARD\|NEW INSTRUCTIONS" sessions/*.jsonl
  grep -iH "rm -rf\|curl.*http\|wget\|nc \|bash -c\|/etc/passwd" sessions/*.jsonl
  ```
- Systemd timers for monitoring (more reliable than in-process Node.js crons — survives process crashes)

---

## MICRO INSTRUCTIONS (tactical — exact changes to make)

### A. Dockerfile Changes

Current Dockerfile is functional but lacks security hardening. Add:

```dockerfile
# ADD after the COPY/RUN for custom-ui.css:

# ADD: Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -sf http://localhost:18789/health || exit 1
```

### B. entrypoint.sh Changes

The current `openclaw.json` generation is minimal. Replace the config generation block with a hardened version that adds:

```json
{
  "gateway": {
    "port": 18789,
    "bind": "lan",
    "auth": {
      "mode": "token",
      "token": "${GATEWAY_TOKEN}"
    },
    "controlUi": {
      "enabled": true,
      "dangerouslyDisableDeviceAuth": true
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
      "workspace": "/home/node/.openclaw/workspace",
      "sandbox": {
        "mode": "off"
      }
    }
  },
  "tools": {
    "browser": { "enabled": true },
    "cron":    { "enabled": false },
    "discord": { "enabled": false },
    "gateway": { "enabled": false },
    "nodes":   { "enabled": false },
    "canvas":  { "enabled": false },
    "exec": {
      "enabled": true,
      "allowlist": ["ls", "cat", "grep", "head", "tail", "find", "wc", "sort", "curl", "node", "npm"]
    },
    "filesystem": {
      "enabled": true,
      "allowedPaths": [
        "/home/node/.openclaw/workspace",
        "/home/node/.openclaw/memory",
        "/tmp/openclaw-tmp"
      ],
      "deniedPaths": [
        "/home/node/.openclaw/openclaw.json",
        "/home/node/.openclaw/credentials",
        "/home/node/.ssh",
        "/etc",
        "/root",
        "/var",
        "/proc",
        "/sys"
      ]
    }
  },
  "messages": {
    "responsePrefix": "auto"
  }
}
```

**Key decisions:**
- `dangerouslyDisableDeviceAuth: true` — We MUST set this true because users access via iframe, not direct pairing. Auth is handled by our gateway token + reverse proxy.
- `sandbox.mode: "off"` — We don't nest Docker inside Docker. The container itself IS the sandbox.
- `cron/discord/gateway/nodes/canvas: disabled` — Workers don't need these. Reduce attack surface.
- `exec.allowlist` — Whitelist approach. Only safe commands.
- `filesystem.deniedPaths` — Block access to config files, credentials, system dirs.
- Current entrypoint uses `"allowInsecureAuth": true` — should be changed to `"dangerouslyDisableDeviceAuth": true` (correct OpenClaw API).

### C. Orchestrator Provision Changes (routes.ts)

Add security options to `docker.createContainer()` in the HostConfig:

```typescript
HostConfig: {
  // ... existing PortBindings, Binds, RestartPolicy, Memory, NanoCpus, ShmSize ...
  // ADD: Security hardening
  SecurityOpt: ['no-new-privileges:true'],
  CapDrop: ['ALL'],
  ReadonlyRootfs: false, // Can't use true — OpenClaw writes to home dir
  PidsLimit: 200,        // Prevent fork bombs
  // ADD: Network isolation (Phase 2 — after LiteLLM is deployed)
  // NetworkMode: 'instantworker-internal',
},
```

**When LiteLLM is ready**, also change Env to:
```typescript
Env: [
  `GATEWAY_TOKEN=${gatewayToken}`,
  `OPENCLAW_GATEWAY_PORT=18789`,
  `NOVNC_PORT=6080`,
  `ANTHROPIC_API_BASE=http://litellm:4000/v1`,
  `ANTHROPIC_API_KEY=${userProxyKey}`,  // LiteLLM internal key, not real key
  `GOOGLE_AI_KEY=DISABLED`,             // Route through LiteLLM only
  `ASSISTANT_NAME=${assistantName || 'Worker'}`,
  `WORKER_TYPE=${workerType || 'general'}`,
],
```

**Note on ReadonlyRootfs:** Can't be `true` because OpenClaw writes config/memory to `/home/node/.openclaw/`. Alternative: use tmpfs mounts for writable areas.

### D. Docker Network Setup (run once on Hetzner)

```bash
# Create internal network (no external access)
docker network create --internal instantworker-internal

# Create external network (for LiteLLM + Squid only)
docker network create instantworker-external

# LiteLLM connects to BOTH networks
# User containers connect to ONLY internal
```

### E. LiteLLM docker-compose.yml (new file)

```yaml
# /opt/osobnirobot/docker-compose.litellm.yml
version: '3.8'

services:
  litellm:
    image: ghcr.io/berriai/litellm:main-latest
    container_name: instantworker-litellm
    restart: unless-stopped
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - GOOGLE_AI_KEY=${GOOGLE_AI_KEY}
      - LITELLM_MASTER_KEY=${LITELLM_MASTER_KEY}
    ports:
      - "127.0.0.1:4000:4000"
    networks:
      - instantworker-internal
      - instantworker-external
    volumes:
      - ./litellm-config.yaml:/app/config.yaml:ro
    command: ["--config", "/app/config.yaml", "--port", "4000"]
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp:rw,noexec,nosuid,size=100m
    mem_limit: 512m
    cpus: 1.0

networks:
  instantworker-internal:
    external: true
  instantworker-external:
    external: true
```

### F. LiteLLM Config

```yaml
# /opt/osobnirobot/litellm-config.yaml
model_list:
  - model_name: gemini-2.0-flash
    litellm_params:
      model: gemini/gemini-2.0-flash
      api_key: os.environ/GOOGLE_AI_KEY

  - model_name: claude-sonnet-4-20250514
    litellm_params:
      model: anthropic/claude-sonnet-4-20250514
      api_key: os.environ/ANTHROPIC_API_KEY

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  max_parallel_requests: 20
  max_budget: 500.0           # Monthly cap in USD
  budget_duration: 30d
  allowed_routes:
    - /v1/messages
    - /v1/chat/completions
    - /v1/complete
  num_retries: 2
  timeout: 120
```

### G. Squid Proxy for Browser Workers (Phase 3)

Browser workers (X-commenter, Reddit commenter, etc.) need web access but should be restricted to specific domains:

```
# /opt/osobnirobot/squid-allowlist.txt
.x.com
.twitter.com
.youtube.com
.reddit.com
.linkedin.com
.facebook.com
.instagram.com
.tiktok.com
.google.com
.googleapis.com
```

Container env vars when Squid is ready:
```bash
HTTP_PROXY=http://squid:3128
HTTPS_PROXY=http://squid:3128
NO_PROXY=litellm,127.0.0.1,localhost
```

---

## ARCHITECTURE PATTERN (target state)

```
┌─────────────────────────────────────────────────────────────┐
│  HETZNER VPS (37.27.185.246)                                │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Caddy Reverse Proxy (DEPLOYED)                      │   │
│  │  *.gw.instantworker.ai → localhost:20000-20999       │   │
│  │  *.vnc.instantworker.ai → localhost:21000-21999      │   │
│  │  api.instantworker.ai → localhost:3500               │   │
│  │  [TLS termination, iframe header overrides]          │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │                                        │
│  ┌──────────────────┴───────────────────────────────────┐   │
│  │  Orchestrator (Express :3500) — DEPLOYED via pm2     │   │
│  │  - Provisions containers via Dockerode               │   │
│  │  - Health checks                                     │   │
│  │  - Cleanup cron (dangling images)                    │   │
│  │  - Auth: x-orchestrator-secret header                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────── instantworker-internal (TODO) ───────────┐   │
│  │                                                       │   │
│  │  ┌─────────────────┐  ┌─────────────────┐           │   │
│  │  │ User Container 1│  │ User Container 2│  ...       │   │
│  │  │ iw-abc123def456 │  │ iw-xyz789ghi012 │           │   │
│  │  │                 │  │                 │            │   │
│  │  │ OpenClaw :18789 │  │ OpenClaw :18789 │            │   │
│  │  │ noVNC    :6080  │  │ noVNC    :6080  │            │   │
│  │  │                 │  │                 │            │   │
│  │  │ TODO:           │  │ TODO:           │            │   │
│  │  │ cap_drop: ALL   │  │ cap_drop: ALL   │            │   │
│  │  │ pids_limit: 200 │  │ pids_limit: 200 │            │   │
│  │  │ no-new-priv     │  │ no-new-priv     │            │   │
│  │  └────────┬────────┘  └────────┬────────┘            │   │
│  │           │                    │                      │   │
│  │           └────────┬───────────┘                      │   │
│  │                    │                                   │   │
│  │           ┌────────┴────────┐                         │   │
│  │           │    LiteLLM      │ (TODO)                  │   │
│  │           │    :4000        │──── instantworker-      │   │
│  │           │                 │     external (egress)   │   │
│  │           │ Budget: $500/mo │                         │   │
│  │           │ Rate: 20 req/s  │───→ api.anthropic.com   │   │
│  │           │ Real API keys   │───→ googleapis.com      │   │
│  │           └─────────────────┘                         │   │
│  │                                                       │   │
│  │           ┌─────────────────┐                         │   │
│  │           │  Squid Proxy    │ (TODO - Phase 3)        │   │
│  │           │  :3128          │──── external             │   │
│  │           │  domain allow   │───→ x.com, reddit.com   │   │
│  │           └─────────────────┘                         │   │
│  │                                                       │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐
│   Vercel          │────────→│  Supabase        │
│   (Frontend)      │         │  (Auth + DB)     │
│   Next.js 14      │         │  profiles table  │
│   Stripe billing  │         │  migration v6    │
│   Resend emails   │         │                  │
└──────────────────┘         └──────────────────┘
```

### Why this pattern:
1. **Containers can't reach the internet** — internal-only network, zero egress (TODO)
2. **API keys never enter containers** — LiteLLM holds them, containers get proxy URL (TODO)
3. **Budget cap at LiteLLM level** — can't runaway-spend even if compromised (TODO)
4. **Caddy handles TLS + iframe embedding** — containers don't touch certificates (DONE)
5. **Each container is disposable** — compromise one, others unaffected (DONE)
6. **Orchestrator is the only Docker admin** — protected by shared secret (DONE)

### What containers CAN do:
- Call AI APIs (currently direct, later via LiteLLM internal network)
- Receive WebSocket connections from users (via Caddy proxy)
- Read their workspace files (read-only mount)
- Write to their own home directory (memory, session logs)
- Run shell commands (currently unrestricted, TODO: allowlist)
- Browse the web via Chromium + VNC (user sees this in dashboard)

### What containers CANNOT do (after hardening):
- Reach external APIs directly (no egress — after network isolation)
- Access other containers
- Access host filesystem
- Escalate privileges (cap_drop ALL + no-new-privileges)
- Fork-bomb (pids_limit 200)
- OOM-kill host (memory capped at 2GB)
- Read their own OpenClaw config (filesystem denied paths)

---

## TOOL ANALYSIS

### Antfarm — NOT useful for us now

**What it is:** Multi-agent workflow orchestration for OpenClaw (feature-dev, security-audit, bug-fix workflows using 6-7 coordinated agents).

**Why not now:**
- Designed for developer tooling (PRs, code review), not social media workers
- Requires OpenClaw v2026.2.9+ (we're on `alpine/openclaw:latest` which may be older)
- Adds complexity (SQLite, cron, npm link) inside containers we want minimal
- Our workers already have structured workflows via SOUL.md/HEARTBEAT.md templates

**When it might be useful:**
- If we add a "developer assistant" worker type that manages code repos
- If we build internal tooling for our own codebase maintenance
- The YAML workflow pattern is interesting for defining more complex worker behaviors

### StartClaw — Competitive analysis

**What they do:** Managed cloud OpenClaw. Sign up → add API key → connect Telegram → done. No Docker, no DevOps.

**What we should copy:**
- **60-second onboarding** — our wizard is good but provision step is slow. Pre-warm containers?
- **BYOK model** (bring your own key) — they let users use their own API keys. We currently use ours. Consider offering both: our key (included in subscription) OR BYOK (cheaper plan).
- **Live dashboard** — they show the agent working in real-time. We have noVNC for browser + chat iframe. Similar but we should make it smoother.

**What we do better:**
- **Skill marketplace** — we have 15 pre-built worker templates with niche-specific SOUL.md files. StartClaw is generic.
- **Visual browser** — noVNC gives users a live view of their worker's browser. StartClaw doesn't show this.
- **Customization** — brand voice, targets, niche, personality. StartClaw is more generic.
- **Multi-skill workers** — our Expert/Legend plans allow multiple skills per worker.

### openclaw-hardened-ansible — Steal specific configs

**What's useful for us:**

1. **Squid proxy with domain allowlists** — Pattern for selective internet access per worker skill type
2. **LiteLLM credential brokering** — Validates our architecture approach
3. **Monitoring script** — `monitor-openclaw.sh` checks for prompt injection in session logs. Adapt for our containers.
4. **Systemd timers** — More reliable than in-process Node.js crons for monitoring. Survives process crashes.

**What's NOT useful:**
- Their Tailscale setup — we're a SaaS, users access via web, not VPN
- Their Caddy auto-cert per instance — we use wildcard DNS, one cert
- Their single-user design — we're multi-tenant
- Manual `openclaw devices approve` — we bypass device auth (iframe access)

### Cost Optimization Tools (Future)

- **openclaw-optimizer** — Fixes context bloat, wrong model selection, browser loops. Claims 85-95% API cost reduction.
- **ClawRouter** — Smart LLM router scoring requests across 14 dimensions, routes to cheapest capable model.
- Both can be integrated via LiteLLM's model routing once LiteLLM is deployed.

### Security Skills (Consider for containers)

- **ACIP** (Advanced Cognitive Inoculation Prompt) — Prompt injection resistance
- **Email Security Skill** — Protects against prompt injection via email
- Install ONLY from verified sources, always audit source code first

---

## IMPLEMENTATION ORDER

```
Phase 1: Container Hardening (immediate — before more users)
  ├── 1a. Update routes.ts: add SecurityOpt, CapDrop, PidsLimit ← EASY WIN
  ├── 1b. Update entrypoint.sh: hardened openclaw.json (tool restrictions, deny paths)
  ├── 1c. Update Dockerfile: add HEALTHCHECK
  ├── 1d. Rebuild Docker image + reprovision existing containers
  └── 1e. Verify: test container can't fork-bomb, can't read config, tools restricted

Phase 2: Credential Isolation (high priority)
  ├── 2a. Create Docker networks (internal + external)
  ├── 2b. Deploy LiteLLM container on internal+external networks
  ├── 2c. Update routes.ts: containers use LiteLLM URL instead of raw API keys
  ├── 2d. Update routes.ts: NetworkMode = 'instantworker-internal'
  └── 2e. Verify: container can't reach internet, CAN reach LiteLLM

Phase 3: Browser Worker Egress (needed for social media workers)
  ├── 3a. Deploy Squid proxy with domain allowlist (x.com, reddit.com, etc.)
  ├── 3b. Connect Squid to internal+external networks
  ├── 3c. Set HTTP_PROXY/HTTPS_PROXY env vars in browser worker containers
  └── 3d. Verify: container can reach x.com but not arbitrary domains

Phase 4: Monitoring & Optimization (first month)
  ├── 4a. Add session log monitoring for injection patterns (systemd timer)
  ├── 4b. Set up LiteLLM budget alerts ($500/mo cap)
  ├── 4c. Add container auto-restart on crash (orchestrator health check loop)
  ├── 4d. Extend cleanup.ts to remove containers stopped >30 days
  └── 4e. Add Caddy rate limiting plugin

Phase 5: Product Improvements (first quarter)
  ├── 5a. Pre-warm containers for faster onboarding (StartClaw does 60s)
  ├── 5b. Consider BYOK pricing tier (user provides own API keys, cheaper plan)
  ├── 5c. Implement gateway token rotation
  ├── 5d. Explore ClawRouter/openclaw-optimizer for cost optimization via LiteLLM
  └── 5e. Consider custom minimal chat UI (replace OpenClaw control UI entirely)
```

---

## GOTCHAS / WATCH OUT

1. **`dangerouslyDisableDeviceAuth` MUST be `true`** for our use case. Users access via iframe, not device pairing. Sounds scary but it's correct — auth is token-based via URL param through Caddy.

2. **`bind: "lan"` not `bind: "localhost"`** inside container. Container needs to accept connections on its network interface (Docker maps host ports to container). `localhost` would block proxied traffic.

3. **`ReadonlyRootfs: false`** is necessary. OpenClaw writes config, memory, session logs to `/home/node/.openclaw/`. Alternative: use tmpfs mounts for writable areas. More complex, save for later.

4. **Port allocation race condition** — The in-memory `allocatedPorts` Set in routes.ts resets on orchestrator restart. Could allocate an already-used port. Mitigated by also checking Docker port bindings, but verify edge cases.

5. **LiteLLM network resolution** — Containers need to resolve `litellm` hostname. This works if both are on the same Docker network (`instantworker-internal`). The orchestrator creates containers with `NetworkMode: 'instantworker-internal'` and LiteLLM is also on that network.

6. **Browser automation needs egress** — Workers that browse the web (X-commenter visiting twitter.com) need external network access. Phase 3 Squid proxy solves this. Until then, containers stay on default bridge network (current state).

7. **`trustedProxies`** — If adding this to openclaw.json, use Docker internal network CIDR only: `["172.17.0.0/16", "172.18.0.0/16"]`. NEVER use `"0.0.0.0/0"` which trusts ALL IPs.

8. **`allowInsecureAuth` vs `dangerouslyDisableDeviceAuth`** — Current entrypoint.sh uses `allowInsecureAuth: true`. The correct OpenClaw config key may be `dangerouslyDisableDeviceAuth: true`. Verify against the OpenClaw version in `alpine/openclaw:latest`.

9. **Lazy env loading in routes.ts** — `dotenv.config()` runs in `index.ts` but routes.ts was reading env vars at module import time. Fixed with `env()` function wrapper. Don't add static `process.env` reads at module scope.

10. **Caddy iframe headers** — OpenClaw sets `X-Frame-Options: DENY` and `frame-ancestors 'none'`. Caddy is configured to strip these and add `frame-ancestors https://instantworker.ai https://*.instantworker.ai`. If Caddy config is lost, dashboard iframes break.

11. **ClawHub marketplace is dangerous** — The #1 most downloaded skill was malware. Never install community skills in user containers. Our workers use only our own SOUL.md/HEARTBEAT.md templates.

12. **OpenClaw version pinning** — We use `alpine/openclaw:latest` which means the base image changes unpredictably. Should pin to a specific version (e.g., `alpine/openclaw:2026.2.9`) once stable.
