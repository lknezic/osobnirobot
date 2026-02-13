# InstantWorker — Project Memory

## Last Updated: 2026-02-13 (Session 2)

## Current State
- **Frontend**: Deployed on Vercel (Next.js 14, App Router, TypeScript)
- **Backend**: Hetzner server (`37.27.185.246`) running orchestrator (port 3500) + Docker containers + Caddy reverse proxy
- **Database**: Supabase (profiles + employees tables, v7 migration applied)
- **Payments**: Stripe checkout + webhooks (basic, handler mostly empty)
- **Auth**: Supabase Auth (magic link + Google OAuth)
- **Branch**: `claude/instantworker-infrastructure-I0ovP` (6 commits ahead of main)

## What Works
- Landing page with pricing, hero, skills
- Auth flow (login, callback, middleware protection)
- Onboarding wizard (plan → skills → name/tone → launch) with localStorage persistence
- Multi-employee model (employees table, hire/fire/update/restart)
- Orchestrator service (Docker container management, health checks, cleanup)
- Dashboard with employee grid, chat iframe, browser iframe, settings tab
- Wildcard DNS + Caddy reverse proxy for `*.gw.instantworker.ai` / `*.vnc.instantworker.ai`
- Trial system (7 days) + chat view paywall (3 free views)
- Cron job for expired trial cleanup
- Container re-provisioning endpoint (`POST /api/employees/[id]/provision`)
- Container hardening (CapDrop ALL, CapAdd SYS_ADMIN, no-new-privileges, PidsLimit 512)
- LiteLLM proxy code (ready, not deployed to server yet)

## Server State (Hetzner 37.27.185.246)
- **SSH**: `ssh root@37.27.185.246`
- **Repo on server**: `/opt/osobnirobot/`
- **Orchestrator service**: `iw-orchestrator.service` (systemd)
- **Also exists**: `osobnirobot-orchestrator.service` (old name? was in auto-restart state)
- **Caddy config**: `/etc/caddy/Caddyfile` (FIXED — `{labels.3}` for port extraction)
- **Caddy proxy**: Working — `curl -k https://22000.vnc.instantworker.ai/vnc.html` returns 200
- **Server branch**: Was on main, user ran `git checkout claude/instantworker-infrastructure-I0ovP` + `npm run build`
- **Orchestrator restart**: User was about to run `systemctl restart iw-orchestrator` (may or may not be done)

## Active Employee: Pulse
- **ID**: `7079d68e-0394-4c53-b5ad-64a5b29a32df`
- **Container**: `iw-7079d68e-039` (running on Hetzner)
- **Gateway port**: 20000
- **noVNC port**: 22000
- **Token**: `53ebb2b9-d3e1-415b-8ea5-e52f228b50a1`
- **Supabase**: Updated manually with above values, `container_status='running'`

## Recent Fixes (This Session)
1. **Caddy port extraction bug** (CRITICAL): `{labels.2}` resolved to `"vnc"`/`"gw"` instead of the port number. Caddy v2 labels are 0-indexed from the right (TLD), so for `22000.vnc.instantworker.ai` the port is at `{labels.3}`. This broke both browser (noVNC) and chat (gateway) iframes. Fixed in code AND on server (`/etc/caddy/Caddyfile`).
2. **Knowledge base cat errors**: `readContainerFile` in orchestrator returned raw `cat: No such file or directory` errors as content. Fixed by using `sh -c 'cat file 2>/dev/null'` + AttachStderr: false + error string filtering. Code pushed, needs orchestrator restart on server.

## Previous Session Fixes
- **Orchestrator crash loop**: EADDRINUSE :::3500 — killed stale process, restarted systemd
- **Silent provisioning failure**: Hire endpoint returned success even when orchestrator was down. Fixed with status transitions: `none` → `provisioning` → `running`/`error`
- **Container re-provisioning**: New `POST /api/employees/[id]/provision` endpoint
- **Dashboard provision UI**: "Start container" button for none/error, spinner for provisioning

## Known Issues
- Old test container `iw-2c50caea-cf9` may still exist on Hetzner (needs `docker stop && docker rm`)
- Orchestrator port allocation is in-memory (`Set<number>`) — resets on restart, could cause port conflicts
- Dashboard refreshes only every 30 seconds — slow to reflect provisioning completion
- `useEmployeeStatus` hook exists but is unused in dashboard
- Cron job checks for `'creating'` status that is never set in code
- Stripe webhook handler is mostly empty
- Rate limiting on `/api/subscribe` is in-memory (resets on deploy)
- Chat paywall: Pulse hit 3 free views during testing. Clear with: `localStorage.removeItem('iw_chat_views_7079d68e-0394-4c53-b5ad-64a5b29a32df')` in browser console
- `osobnirobot-orchestrator.service` on server may conflict with `iw-orchestrator.service` — investigate

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
systemctl reload caddy

# Docker containers
docker ps                          # running containers
docker logs iw-7079d68e-039 -f    # Pulse container logs
docker stop iw-7079d68e-039 && docker rm iw-7079d68e-039  # remove container

# Test proxies
curl -k https://22000.vnc.instantworker.ai/vnc.html -o /dev/null -w "%{http_code}"
curl -k https://20000.gw.instantworker.ai/ -o /dev/null -w "%{http_code}"
```

## Roadmap Position

**Phase A (Build) is COMPLETE. Phase B in progress. See PLAN.md for full plan.**

### Immediate Next Steps (to complete before Phase B testing)
1. ~~Fix Caddy port extraction~~ DONE (on server + in code)
2. Confirm orchestrator is restarted with latest code on server (knowledge base fix)
3. Clear chat paywall localStorage for testing
4. Deploy LiteLLM to Hetzner server (code ready at `infra/litellm*`)
5. Clean up old test container on Hetzner

### Then: Phase B Testing (Step 5)
6. Verify end-to-end: onboard → provision → chat loads → browser loads
7. Run through Step 5 test checklist in PLAN.md

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
- `app/dashboard/page.tsx` — Main dashboard
- `app/dashboard/components/EmployeeWorkspace.tsx` — Chat/Browser/Settings workspace
- `app/dashboard/components/KnowledgeBase.tsx` — Settings knowledge view + file upload
- `lib/db/employees.ts` — DB operations for employees table
- `lib/api/employees.ts` — Client-side API functions
- `lib/constants.ts` — Plan limits, skills, config
- `lib/types.ts` — TypeScript types
- `app/orchestrator/` — Separate service (excluded from tsconfig)
- `infra/Caddyfile` — Caddy reverse proxy config
- `infra/litellm_config.yaml` — LiteLLM model routing config
- `infra/litellm.service` — LiteLLM systemd unit
- `infra/litellm.env.example` — LiteLLM env template
- `infra/deploy.sh` — Server deploy script
- `worker-templates/` — SOUL.md, SKILL.md per worker type

## Commits on Branch (newest first)
1. `0d2eae1` fix: Caddy label index for port extraction from wildcard subdomains
2. `6ce65c1` fix: suppress cat errors in knowledge base when memory files don't exist
3. `b2a8fc2` feat: LiteLLM proxy (Step 4.6) + full plan saved
4. `5922dd3` feat: container hardening + onboarding localStorage persistence
5. `99b9033` docs: add PLAN.md with full product plan and progress tracking
6. `74a3d8b` fix: add container re-provisioning and fix silent provision failures

## Environment Variables (Required)
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase client
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase admin (server-side only)
- `ORCHESTRATOR_URL` — e.g. `http://37.27.185.246:3500`
- `ORCHESTRATOR_SECRET` — shared secret for orchestrator auth
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — Stripe billing
- `NEXT_PUBLIC_CONTAINER_HOST` — e.g. `instantworker.ai` (for iframe URLs)
