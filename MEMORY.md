# InstantWorker — Project Memory

## Last Updated: 2026-02-13 (Session 4)

## Current State — EVERYTHING WORKS
- **Frontend**: Deployed on Vercel (Next.js 14, App Router, TypeScript)
- **Backend**: Hetzner server (`37.27.185.246`) running orchestrator (port 3500) + Docker containers + Caddy reverse proxy
- **Database**: Supabase (profiles + employees tables, v7 migration applied)
- **Payments**: Stripe checkout + webhooks (basic, handler mostly empty — still has old plan names)
- **Auth**: Supabase Auth (magic link + Google OAuth)
- **Branch**: `claude/instantworker-infrastructure-I0ovP` (20 commits ahead of main)
- **Backup tag**: `v0.5-pre-cleanup` (tagged before session 4 cleanup)

## What's Changed Since Session 2

### Session 3: Worker Template System
- Created **7 reference playbooks** in `worker-templates/_shared/reference/`:
  - `01-COPYWRITING-PRINCIPLES.md` — Three laws, six hooks, algorithm data, banned phrases
  - `02-SINGLE-TWEETS.md` — Golden hour, 3-bucket system, tweet formats, media strategy
  - `03-THREADS.md` — 5 thread frameworks, self-reply extensions
  - `04-ARTICLES-LONGFORM.md` — Long-form post frameworks, article templates
  - `05-COMMENTS-REPLIES.md` — 7 reply templates, value-first system
  - `06-CREATION-GUIDE.md` — Internal guide for creating new platform skills (8 components)
  - `CLIENT-INTELLIGENCE.md` — 7-layer client knowledge model
- Created **7 editable doc templates** in `worker-templates/_shared/docs/`:
  - company.md, competitors.md, audience.md, product.md, brand-voice.md, instructions.md, goals.md
- Created **4 memory templates** in `worker-templates/_shared/memory/`:
  - improvement-suggestions.md, pending-questions.md, research-findings.md, suggestions.md
- Fixed system files: LEARNING-PROTOCOL.md, SKILLMAKER.md, WORKER-GUIDE.md
- **Deleted 12 non-X skill directories** (reddit, email, youtube, instagram, tiktok, facebook, discord, seo)
- **Deleted 6 old reference files** (superseded by new 01-06 playbooks)
- Created **x-tweet-writer** skill (was missing — now 4 X skills total)
- Built **flywheel mechanism**: orchestrator `GET /improvements` + admin proxy `/api/improvements`

### Session 4: Pricing, Audit, Operations
- **Pricing model change**: $199/worker/channel (was $99/$399/$499 tiered)
  - `lib/types.ts`: `PlanTier = 'worker'` (+ `LegacyPlanTier` for backward compat)
  - `lib/constants.ts`: `PLAN_LIMITS.worker`, `LEGACY_PLAN_LIMITS`, `CHANNELS`, `WORKER_PRICE = 199`
  - `app/api/employees/route.ts`: Falls back to legacy plans for existing subscriptions
  - `app/onboarding/page.tsx`: Channel-based flow (pick channel → all skills included → name → launch)
- **Skills audit** against 06-CREATION-GUIDE.md — found 3 gaps, filled them:
  - Added conversion strategy, measurement framework, platform culture, weekly rotation to WORKER-GUIDE.md
  - Added conversion + measurement sections to all 4 X SKILL.md files
- **Created OPERATIONS.md** — Owner operations guide (instant/hourly/daily/weekly/monthly cadences)

## Pricing Model (Current)
- **$199/worker/month** — 1 worker, 1 channel, ALL skills for that channel
- Only channel live: **X/Twitter** (4 skills: commenter, tweet-writer, thread-writer, article-writer)
- Future channels: Reddit, YouTube, Instagram, TikTok, Email, Discord, LinkedIn
- Legacy plans preserved in `LEGACY_PLAN_LIMITS` for existing subscriptions
- **Stripe checkout route still has old plan names** (simple/expert/legend with hardcoded price IDs) — needs updating

## Worker Template System

### File Taxonomy
```
worker-templates/
├── _shared/                        # Shared across ALL workers
│   ├── LEARNING-PROTOCOL.md        # Identity: How workers learn
│   ├── SKILLMAKER.md               # Identity: Hidden learning skill
│   ├── docs/                       # Knowledge: 7 editable doc templates
│   ├── memory/                     # Memory: 4 memory templates
│   └── reference/                  # Playbooks: 8 reference files
│       ├── 01-COPYWRITING-PRINCIPLES.md
│       ├── 02-SINGLE-TWEETS.md
│       ├── 03-THREADS.md
│       ├── 04-ARTICLES-LONGFORM.md
│       ├── 05-COMMENTS-REPLIES.md
│       ├── 06-CREATION-GUIDE.md
│       ├── CLIENT-INTELLIGENCE.md
│       └── WORKER-GUIDE.md
├── x-commenter/                    # Per-skill directory
│   ├── SOUL.md                     # Identity
│   ├── HEARTBEAT.md                # Schedule
│   ├── config/                     # Config (rules, brand-voice, targets)
│   └── skills/x-commenter/SKILL.md # Skill definition
├── x-tweet-writer/
├── x-thread-writer/
└── x-article-writer/
```

### How Skills Reference Playbooks
Every SKILL.md has an IMPORTANT section listing which reference/ files to read:
- All 4 skills reference: 01 (copywriting), CLIENT-INTELLIGENCE
- Each skill also references its primary playbook (02, 03, 04, or 05)
- All skills reference 02-SINGLE-TWEETS.md for golden hour / 3-bucket context

### Flywheel
- Workers log improvements to `memory/improvement-suggestions.md`
- Orchestrator `GET /api/containers/improvements` reads from ALL running containers
- Admin-only proxy at `GET /api/improvements` (restricted to admin emails)
- Owner reviews weekly, updates playbooks, all workers improve

## What Works (Verified 2026-02-13)
- Landing page with pricing, hero, skills
- Auth flow (login, callback, middleware protection)
- Onboarding wizard (channel → skills → name/tone → launch) with localStorage persistence
- Multi-employee model (employees table, hire/fire/update/restart)
- Orchestrator service (Docker container management, health checks, cleanup)
- Dashboard with employee grid + 3 working tabs:
  - **Chat tab**: OpenClaw gateway connected, Health OK, heartbeat running
  - **Browser tab**: noVNC connected, showing virtual desktop
  - **Settings tab**: Knowledge base, reference files, editable docs
- Wildcard DNS + Caddy reverse proxy for `*.gw.instantworker.ai` / `*.vnc.instantworker.ai`
- WebSocket connections working through Caddy (both chat + VNC)
- Trial system (7 days) + chat view paywall (3 free views)
- Container re-provisioning + restart endpoints
- Container hardening (CapDrop ALL, CapAdd SYS_ADMIN, no-new-privileges, PidsLimit 512)
- Worker template system with 4 X skills + 8 reference playbooks
- Flywheel improvement harvesting endpoint

## Server State (Hetzner 37.27.185.246)
- **SSH**: `ssh root@37.27.185.246`
- **Repo on server**: `/opt/osobnirobot/` (checked out to branch `claude/instantworker-infrastructure-I0ovP`)
- **Orchestrator service**: `iw-orchestrator.service` (systemd) — RUNNING on port 3500
- **Caddy config**: `/etc/caddy/Caddyfile` — `{labels.3}` for port extraction, no header_up
- **Container workspace path**: `/home/node/.openclaw/workspace` (matches entrypoint.sh)

## Active Employee: Pulse
- **ID**: `7079d68e-0394-4c53-b5ad-64a5b29a32df`
- **Container**: `iw-7079d68e-039` (running on Hetzner)
- **Gateway port**: 20000 (chat via `20000.gw.instantworker.ai`)
- **noVNC port**: 22000 (browser via `22000.vnc.instantworker.ai`)

## Known Issues (Non-blocking)
- **Stripe checkout route has old plan names** (simple/expert/legend with hardcoded Stripe price IDs) — needs updating to match $199/worker model
- **Landing page still shows old pricing** — needs updating to reflect $199/worker/channel
- Old test container `iw-2c50caea-cf9` may still exist on Hetzner
- Orchestrator port allocation is in-memory (`Set<number>`) — resets on restart
- Dashboard refreshes only every 30 seconds
- Cron job checks for `'creating'` status that is never set in code
- Stripe webhook handler is mostly empty
- Rate limiting on `/api/subscribe` is in-memory (resets on deploy)
- Reference files show "NaNKB" for size (minor UI bug)
- LiteLLM not yet deployed to server (code ready at `infra/litellm*`)
- Branch needs merging to main

## Server Commands Quick Reference
```bash
ssh root@37.27.185.246
cd /opt/osobnirobot

# Orchestrator
cd app/orchestrator && npm run build
systemctl restart iw-orchestrator
journalctl -u iw-orchestrator -f

# Caddy
cp infra/Caddyfile /etc/caddy/Caddyfile && systemctl reload caddy

# Docker
docker ps
docker logs iw-7079d68e-039 -f
```

## Architecture
```
Vercel (Frontend)           Hetzner (Backend: 37.27.185.246)
┌──────────────┐           ┌──────────────────────────────────┐
│ Next.js App  │──HTTPS──▶│ Caddy (reverse proxy)             │
│ - Dashboard  │           │ *.gw.instantworker.ai             │
│ - Onboarding │           │ *.vnc.instantworker.ai            │
│ - API routes │           ├──────────────────────────────────┤
│              │──HTTP───▶│ Orchestrator (:3500)               │
│              │           │ Service: iw-orchestrator           │
│              │           ├──────────────────────────────────┤
│              │           │ Docker containers (per employee)   │
│              │           │ - OpenClaw gateway (:20000+)       │
│              │           │ - noVNC (:22000+)                  │
│              │           │ - Worker templates seeded at boot   │
│              │           ├──────────────────────────────────┤
│              │           │ LiteLLM (NOT YET DEPLOYED)         │
│              │           │ - Would run on :4000               │
└──────────────┘           └──────────────────────────────────┘
        │
   Supabase (Auth + DB)          Stripe (Payments)
```

## Key Files
### Frontend
- `app/page.tsx` — Landing page
- `app/onboarding/page.tsx` — Channel-based onboarding wizard
- `app/dashboard/page.tsx` — Main dashboard
- `app/dashboard/components/EmployeeWorkspace.tsx` — Chat/Browser/Settings tabs
- `app/dashboard/components/KnowledgeBase.tsx` — Settings tab UI

### API Routes
- `app/api/employees/route.ts` — Hire (POST) + List (GET)
- `app/api/employees/[id]/docs/route.ts` — List/upload docs
- `app/api/employees/[id]/knowledge/route.ts` — Read memory files
- `app/api/improvements/route.ts` — Admin-only flywheel endpoint
- `app/api/stripe/checkout/route.ts` — Stripe checkout (**STALE: old plan names**)
- `app/api/stripe/webhook/route.ts` — Stripe webhook handler

### Core Libraries
- `lib/constants.ts` — Plan limits, skills, channels, pricing
- `lib/types.ts` — TypeScript types (PlanTier, LegacyPlanTier, Employee, etc.)
- `lib/db/employees.ts` — DB operations
- `lib/api/employees.ts` — Client-side API functions

### Infrastructure
- `app/orchestrator/src/routes.ts` — Container management + flywheel endpoint
- `app/docker/entrypoint.sh` — Container entrypoint
- `infra/Caddyfile` — Caddy reverse proxy config
- `infra/litellm*` — LiteLLM config (not deployed)

### Worker Templates
- `worker-templates/_shared/` — Shared docs, memory, reference, system files
- `worker-templates/x-{commenter,tweet-writer,thread-writer,article-writer}/` — 4 X skills

## Environment Variables (Required)
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase client
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase admin (server-side only)
- `ORCHESTRATOR_URL` — `http://37.27.185.246:3500`
- `ORCHESTRATOR_SECRET` — shared secret for orchestrator auth
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — Stripe billing
- `NEXT_PUBLIC_CONTAINER_HOST` — `instantworker.ai` (for iframe URLs)

## Commits on Branch (newest first)
1. `edb99e3` Pricing → $199/worker/channel, audit skills, add operations guide
2. `d07de2f` Add x-tweet-writer skill, flywheel harvesting, goals.md in docs whitelist
3. `2e86c34` Add docs/goals.md with platform rate limits + update references to 7 docs
4. `16ac6f6` Clean up worker templates: delete old skills, update system files, fix references
5. `37a538d` Add universal X/Twitter content skill + client intelligence + creation guide
6. `cba99ef` Add editable knowledge documents + skillmaker learning skill
7. `4bcdbf3` Add Step 5 plan: editable knowledge docs + skill upgrades + E2E testing
8. `81abf2d` docs: final session handoff — all infrastructure fixes verified working
9. `331d632` fix: remove explicit WebSocket header_up directives from Caddyfile
10. `a8fb5a9` fix: correct container workspace path from /home/user/ to /home/node/
11. `79a42e4` docs: update MEMORY.md and PLAN.md for session handoff
12. `0d2eae1` fix: Caddy label index for port extraction from wildcard subdomains
13. `6ce65c1` fix: suppress cat errors in knowledge base when memory files don't exist
14. `b2a8fc2` feat: LiteLLM proxy (Step 4.6) + full plan saved
15. `5922dd3` feat: container hardening + onboarding localStorage persistence
16. `99b9033` docs: add PLAN.md with full product plan and progress tracking
17. `74a3d8b` fix: add container re-provisioning and fix silent provision failures
18. `b46c112` fix: return detailed error message from hire endpoint
19. `a931cef` fix: set onboarding_completed + plan on first employee hire
20. `cf4b641` fix: use map+expression instead of host_regexp in Caddyfile
