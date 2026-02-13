# InstantWorker — Project Memory

## Last Updated: 2026-02-13 (Session 2 — Final)

## Current State — EVERYTHING WORKS
- **Frontend**: Deployed on Vercel (Next.js 14, App Router, TypeScript)
- **Backend**: Hetzner server (`37.27.185.246`) running orchestrator (port 3500) + Docker containers + Caddy reverse proxy
- **Database**: Supabase (profiles + employees tables, v7 migration applied)
- **Payments**: Stripe checkout + webhooks (basic, handler mostly empty)
- **Auth**: Supabase Auth (magic link + Google OAuth)
- **Branch**: `claude/instantworker-infrastructure-I0ovP` (9 commits ahead of main)

## What Works (Verified 2026-02-13)
- Landing page with pricing, hero, skills
- Auth flow (login, callback, middleware protection)
- Onboarding wizard (plan → skills → name/tone → launch) with localStorage persistence
- Multi-employee model (employees table, hire/fire/update/restart)
- Orchestrator service (Docker container management, health checks, cleanup)
- Dashboard with employee grid + 3 working tabs:
  - **Chat tab**: OpenClaw gateway connected, Health OK, heartbeat running ✓
  - **Browser tab**: noVNC connected, showing virtual desktop ✓
  - **Settings tab**: Knowledge base clean (empty state when no learnings), reference files listing ✓
- Wildcard DNS + Caddy reverse proxy for `*.gw.instantworker.ai` / `*.vnc.instantworker.ai`
- WebSocket connections working through Caddy (both chat + VNC)
- Trial system (7 days) + chat view paywall (3 free views)
- Cron job for expired trial cleanup
- Container re-provisioning endpoint (`POST /api/employees/[id]/provision`)
- Container hardening (CapDrop ALL, CapAdd SYS_ADMIN, no-new-privileges, PidsLimit 512)
- LiteLLM proxy code (ready, not deployed to server yet)

## Server State (Hetzner 37.27.185.246)
- **SSH**: `ssh root@37.27.185.246`
- **Repo on server**: `/opt/osobnirobot/` (checked out to branch `claude/instantworker-infrastructure-I0ovP`)
- **Orchestrator service**: `iw-orchestrator.service` (systemd) — RUNNING on port 3500
- **Old service**: `osobnirobot-orchestrator.service` — STOPPED and DISABLED (was conflicting on port 3500)
- **Caddy config**: `/etc/caddy/Caddyfile` — FIXED and DEPLOYED
  - `{labels.3}` for correct port extraction from wildcard subdomains
  - No `header_up` directives (Caddy v2 handles WebSocket automatically)
- **Caddy proxy**: Working for HTTP + WebSocket
- **Container workspace path**: `/home/node/.openclaw/workspace` (matches entrypoint.sh)

## Active Employee: Pulse
- **ID**: `7079d68e-0394-4c53-b5ad-64a5b29a32df`
- **Container**: `iw-7079d68e-039` (running on Hetzner)
- **Gateway port**: 20000 (chat via `20000.gw.instantworker.ai`)
- **noVNC port**: 22000 (browser via `22000.vnc.instantworker.ai`)
- **Token**: `53ebb2b9-d3e1-415b-8ea5-e52f228b50a1`
- **Supabase**: `container_status='running'`, ports and token correct
- **Status**: Chat connected, VNC connected, heartbeat running

## All Fixes Applied (This Session)
1. **Caddy port extraction** (`{labels.2}` → `{labels.3}`): Labels are 0-indexed from right. Port is at index 3, not 2.
2. **Caddy WebSocket** (removed `header_up`): Over HTTP/2, `{>Connection}` and `{>Upgrade}` resolve to empty strings, breaking WebSocket. Caddy v2 handles upgrades automatically.
3. **Container workspace path** (`/home/user/` → `/home/node/`): Orchestrator was targeting wrong path inside container. Must match `OPENCLAW_HOME` in entrypoint.sh.
4. **Knowledge base errors** (error suppression): `readContainerFile` now uses `sh -c 'cat file 2>/dev/null'`, AttachStderr: false, and filters error strings.
5. **Orchestrator crash** (EADDRINUSE): Old `osobnirobot-orchestrator.service` was holding port 3500. Stopped and disabled it.
6. **Silent provisioning failure**: Status transitions `none` → `provisioning` → `running`/`error`. Added re-provision endpoint.

## Previous Session Fixes
- **Orchestrator crash loop**: EADDRINUSE :::3500 — killed stale process, restarted systemd
- **Container re-provisioning**: New `POST /api/employees/[id]/provision` endpoint
- **Dashboard provision UI**: "Start container" button for none/error, spinner for provisioning

## Known Issues (Non-blocking)
- Old test container `iw-2c50caea-cf9` may still exist on Hetzner (needs `docker stop && docker rm`)
- Orchestrator port allocation is in-memory (`Set<number>`) — resets on restart, could cause port conflicts
- Dashboard refreshes only every 30 seconds — slow to reflect provisioning completion
- `useEmployeeStatus` hook exists but is unused in dashboard
- Cron job checks for `'creating'` status that is never set in code
- Stripe webhook handler is mostly empty
- Rate limiting on `/api/subscribe` is in-memory (resets on deploy)
- Reference files show "NaNKB" for size (minor UI bug — file size not returned by orchestrator)
- LiteLLM not yet deployed to server (code ready at `infra/litellm*`)
- Branch needs merging to main

## Server Commands Quick Reference
```bash
ssh root@37.27.185.246
cd /opt/osobnirobot

# Orchestrator
cd app/orchestrator && npm run build
systemctl restart iw-orchestrator
systemctl status iw-orchestrator
journalctl -u iw-orchestrator -f  # live logs

# Caddy
cat /etc/caddy/Caddyfile
cp infra/Caddyfile /etc/caddy/Caddyfile && systemctl reload caddy

# Docker containers
docker ps                          # running containers
docker logs iw-7079d68e-039 -f    # Pulse container logs
docker stop iw-7079d68e-039 && docker rm iw-7079d68e-039  # remove container

# Test proxies
curl -k https://22000.vnc.instantworker.ai/vnc.html -o /dev/null -w "%{http_code}"
curl -k https://20000.gw.instantworker.ai/ -o /dev/null -w "%{http_code}"

# Kill stale process on port 3500 (if orchestrator crashes with EADDRINUSE)
kill $(ss -tlnp | grep 3500 | grep -oP 'pid=\K\d+') && sleep 2 && systemctl restart iw-orchestrator
```

## Roadmap Position

**Phase A (Build) is COMPLETE. Phase B (Pre-launch) is IN PROGRESS.**

### Immediate Next Steps
1. ~~Fix Caddy port extraction~~ DONE
2. ~~Fix Caddy WebSocket~~ DONE
3. ~~Fix orchestrator workspace path~~ DONE
4. ~~Fix orchestrator crash (stale port)~~ DONE
5. ~~Verify end-to-end: chat + browser + settings~~ DONE
6. Deploy LiteLLM to Hetzner server (optional, code ready at `infra/litellm*`)
7. Clean up old test container on Hetzner
8. Merge branch to main
9. Complete Phase B Step 5 testing checklist (in PLAN.md)
10. Phase B Steps 6-7: Security audit + monitoring

## Architecture Quick Reference

```
Vercel (Frontend)           Hetzner (Backend: 37.27.185.246)
┌──────────────┐           ┌──────────────────────────┐
│ Next.js App  │──HTTPS──▶│ Caddy (reverse proxy)     │
│ - Dashboard  │           │ *.gw.instantworker.ai     │
│ - Onboarding │           │ *.vnc.instantworker.ai    │
│ - API routes │           ├──────────────────────────┤
│              │──HTTP───▶│ Orchestrator (:3500)       │
│              │           │ Service: iw-orchestrator   │
│              │           │ Repo: /opt/osobnirobot/    │
│              │           ├──────────────────────────┤
│              │           │ Docker containers          │
│              │           │ - OpenClaw gateway         │
│              │           │   (:18789 → :20000+)       │
│              │           │ - noVNC (:6080→:22000+)    │
│              │           ├──────────────────────────┤
│              │           │ LiteLLM (NOT YET DEPLOYED) │
│              │           │ - Would run on :4000       │
└──────────────┘           └──────────────────────────┘
```

## Key Files
- `app/api/employees/route.ts` — Hire (POST) + List (GET) employees
- `app/api/employees/[id]/provision/route.ts` — Re-provision container
- `app/api/employees/[id]/restart/route.ts` — Restart container
- `app/api/employees/[id]/knowledge/route.ts` — Read employee memory
- `app/dashboard/page.tsx` — Main dashboard
- `app/dashboard/components/EmployeeWorkspace.tsx` — Chat/Browser/Settings workspace
- `app/dashboard/components/KnowledgeBase.tsx` — Settings knowledge view + file upload
- `lib/db/employees.ts` — DB operations for employees table
- `lib/api/employees.ts` — Client-side API functions
- `lib/constants.ts` — Plan limits, skills, config
- `lib/types.ts` — TypeScript types
- `app/orchestrator/src/routes.ts` — Orchestrator container management routes
- `app/orchestrator/src/index.ts` — Orchestrator Express server
- `infra/Caddyfile` — Caddy reverse proxy config
- `infra/litellm_config.yaml` — LiteLLM model routing config
- `infra/litellm.service` — LiteLLM systemd unit
- `infra/litellm.env.example` — LiteLLM env template
- `infra/deploy.sh` — Server deploy script
- `app/docker/entrypoint.sh` — Container entrypoint (OPENCLAW_HOME=/home/node/.openclaw)
- `worker-templates/` — SOUL.md, SKILL.md per worker type

## Commits on Branch (newest first)
1. `331d632` fix: remove explicit WebSocket header_up directives from Caddyfile
2. `a8fb5a9` fix: correct container workspace path from /home/user/ to /home/node/
3. `79a42e4` docs: update MEMORY.md and PLAN.md for session handoff
4. `0d2eae1` fix: Caddy label index for port extraction from wildcard subdomains
5. `6ce65c1` fix: suppress cat errors in knowledge base when memory files don't exist
6. `b2a8fc2` feat: LiteLLM proxy (Step 4.6) + full plan saved
7. `5922dd3` feat: container hardening + onboarding localStorage persistence
8. `99b9033` docs: add PLAN.md with full product plan and progress tracking
9. `74a3d8b` fix: add container re-provisioning and fix silent provision failures

## Environment Variables (Required)
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase client
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase admin (server-side only)
- `ORCHESTRATOR_URL` — `http://37.27.185.246:3500`
- `ORCHESTRATOR_SECRET` — shared secret for orchestrator auth
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — Stripe billing
- `NEXT_PUBLIC_CONTAINER_HOST` — `instantworker.ai` (for iframe URLs)
