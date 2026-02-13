# Project Instructions

## Project Context
InstantWorker (formerly OsobniRobot) — AI employee marketplace. Next.js 14 App Router, TypeScript, Supabase (auth + DB), Stripe subscriptions, Docker containers via OpenClaw. Deployed on Vercel (frontend) + Hetzner (orchestrator/containers).

## Commands
- Dev: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- No test or typecheck scripts yet — run `npx tsc --noEmit` for typecheck.

## Architecture
- app/page.tsx - Landing page (hero, skills, pricing)
- app/auth/ - Login (magic link + Google OAuth) and callback
- app/onboarding/page.tsx - Multi-step wizard (plan → skills → name/tone → launch)
- app/dashboard/page.tsx - Main dashboard (Chat/Browser/Settings tabs)
- app/api/subscribe/ - Email waitlist (rate-limited)
- app/api/stripe/ - Checkout session creation + webhook handler
- app/api/containers/ - Provision, status, restart endpoints (talk to orchestrator)
- app/docker/ - OpenClaw config + container entrypoint script
- lib/supabase-server.ts - Server Supabase client (cookies, use in API routes)
- lib/supabase-browser.ts - Browser Supabase client (use in "use client" components)
- lib/translations.ts - i18n strings (landing), lib/dash-translations.ts (dashboard)
- middleware.ts - Auth protection for /dashboard, /onboarding, /auth/login
- worker-templates/ - Per-worker SOUL.md, SKILL.md, HEARTBEAT.md, config/
- supabase-migration-v5.sql - DB schema (profiles + container_events)
- app/orchestrator/ - Separate orchestrator service (excluded from tsconfig)

## Code Style
- TypeScript strict mode, path alias @/*
- Dark theme only — custom CSS vars (--bg, --text, --accent, etc.) in globals.css
- No component library — pure Tailwind + inline styles
- No default exports pattern enforced, but pages use default export (Next.js requirement)

## Verification
- YOU MUST run `npm run lint` and `npx tsc --noEmit` before considering any task complete.
- If lint or typecheck fails, fix automatically.
- After fixing a bug, re-run all checks.

## Constraints
- Keep changes minimal — don't refactor unrelated code.
- Don't add features, optimizations, or abstractions that weren't requested.
- Prefer the simplest solution that works correctly.
- Check if similar functionality already exists before writing new code.

## Approval Levels
- Auto: style fixes, bug fixes, lint fixes
- Inform: new files, refactors within a module
- Ask first: DB schema changes, Stripe/payment changes, API contract changes, new dependencies

## Gotchas
- Auth: Use createSupabaseServer() in API routes, createSupabaseBrowser() in client components. Don't mix them.
- Middleware refreshes sessions on every request — don't bypass it.
- Container provisioning flow: onboarding → /api/containers/provision → orchestrator (port 3500) → Docker. Ports saved to Supabase profiles.
- Dashboard iframes: Chat uses OpenClaw gateway port, Browser uses noVNC port. Both proxied via *.gw.instantworker.ai / *.vnc.instantworker.ai.
- app/orchestrator/ is excluded from tsconfig — it's a separate service, don't typecheck it with the main app.
- Rate limiting on /api/subscribe is in-memory (resets on deploy) — not persistent.
- Stripe webhook route exists but handler is mostly empty — careful when touching payments.
- Environment variables: ORCHESTRATOR_URL + ORCHESTRATOR_SECRET for container API calls. Never expose SUPABASE_SERVICE_ROLE_KEY to client.
- Worker templates use SOUL.md/SKILL.md/HEARTBEAT.md convention — follow the x-commenter example.
