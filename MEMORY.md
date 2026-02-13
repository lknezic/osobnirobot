# InstantWorker — Project Memory

## Last Updated: 2026-02-13

## Current State
- **Frontend**: Deployed on Vercel (Next.js 14, App Router, TypeScript)
- **Backend**: Hetzner server running orchestrator (port 3500) + Docker containers + Caddy reverse proxy
- **Database**: Supabase (profiles + employees tables, v7 migration applied)
- **Payments**: Stripe checkout + webhooks (basic, handler mostly empty)
- **Auth**: Supabase Auth (magic link + Google OAuth)

## What Works
- Landing page with pricing, hero, skills
- Auth flow (login, callback, middleware protection)
- Onboarding wizard (plan → skills → name/tone → launch)
- Multi-employee model (employees table, hire/fire/update/restart)
- Orchestrator service (Docker container management, health checks, cleanup)
- Dashboard with employee grid, chat iframe, browser iframe, settings tab
- Wildcard DNS + Caddy reverse proxy for `*.gw.instantworker.ai` / `*.vnc.instantworker.ai`
- Trial system (7 days) + chat view paywall (3 free views)
- Cron job for expired trial cleanup

## Recent Fixes (2026-02-13)
- **Orchestrator crash loop**: Was stuck on EADDRINUSE :::3500 (restart counter at 326). Fixed by killing the stale process and restarting via systemd.
- **Silent provisioning failure**: The hire endpoint (`POST /api/employees`) was returning success even when container provisioning failed. Employee would be created with `container_status='none'` and no ports. Dashboard showed "Connecting..." forever with no error or retry option.
  - **Fix**: Status now transitions: `none` → `provisioning` → `running` (or `error` on failure)
  - **Fix**: Added `POST /api/employees/[id]/provision` endpoint for re-provisioning
  - **Fix**: Dashboard now shows "Start container" button when status is `none` or `error`, and a spinner when `provisioning`

## Known Issues
- Old test container `iw-2c50caea-cf9` may still exist on Hetzner (needs `docker stop && docker rm`)
- Employee "Pulse" (id: `7079d68e-0394-4c53-b5ad-64a5b29a32df`) has `container_status='none'` in Supabase — needs re-provisioning via the new endpoint or manual curl
- Orchestrator port allocation is in-memory (`Set<number>`) — resets on restart, could cause port conflicts
- Dashboard refreshes only every 30 seconds — slow to reflect provisioning completion
- `useEmployeeStatus` hook exists but is unused in dashboard
- Cron job checks for `'creating'` status that is never set in code
- Stripe webhook handler is mostly empty
- Rate limiting on `/api/subscribe` is in-memory (resets on deploy)

## Roadmap Position

**Phase A (Build) is COMPLETE. See PLAN.md for full plan and progress tracker.**

### Immediate Next Steps (Phase B: Pre-launch)
1. Deploy LiteLLM to Hetzner server (code ready, needs server setup)
2. Clean up old test container on Hetzner
3. Re-provision "Pulse" employee (use dashboard "Start container" button)
4. Verify end-to-end: onboard → provision → chat iframe loads → browser iframe loads
5. Run through Step 5 test checklist (in PLAN.md)

## Architecture Quick Reference

```
Vercel (Frontend)           Hetzner (Backend)
┌──────────────┐           ┌──────────────────────┐
│ Next.js App  │──HTTPS──▶│ Caddy (reverse proxy) │
│ - Dashboard  │           │ *.gw.instantworker.ai │
│ - Onboarding │           │ *.vnc.instantworker.ai│
│ - API routes │           ├──────────────────────┤
│              │──HTTP───▶│ Orchestrator (:3500)   │
│              │           │ - provision            │
│              │           │ - status/restart/stop  │
│              │           │ - health checks (5min) │
│              │           │ - cleanup (1hr)        │
│              │           ├──────────────────────┤
│              │           │ Docker containers      │
│              │           │ - OpenClaw gateway     │
│              │           │   (:18789 → :20000+)   │
│              │           │ - noVNC (:6080→:22000+)│
└──────────────┘           └──────────────────────┘
```

## Key Files
- `app/api/employees/route.ts` — Hire (POST) + List (GET) employees
- `app/api/employees/[id]/provision/route.ts` — Re-provision container (NEW)
- `app/api/employees/[id]/restart/route.ts` — Restart container
- `app/dashboard/page.tsx` — Main dashboard
- `app/dashboard/components/EmployeeWorkspace.tsx` — Chat/Browser/Settings workspace
- `lib/db/employees.ts` — DB operations for employees table
- `lib/api/employees.ts` — Client-side API functions
- `lib/constants.ts` — Plan limits, skills, config
- `lib/types.ts` — TypeScript types
- `app/orchestrator/` — Separate service (excluded from tsconfig)
- `infra/` — Caddyfile, systemd services, deploy script, LiteLLM config
- `worker-templates/` — SOUL.md, SKILL.md per worker type

## Environment Variables (Required)
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase client
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase admin (server-side only)
- `ORCHESTRATOR_URL` — e.g. `http://1.2.3.4:3500`
- `ORCHESTRATOR_SECRET` — shared secret for orchestrator auth
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — Stripe billing
- `NEXT_PUBLIC_CONTAINER_HOST` — e.g. `instantworker.ai` (for iframe URLs)
