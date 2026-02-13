# InstantWorker — Product Plan

## Progress Tracker

### Phase A: Build (Steps 1-4) — COMPLETE

| # | Item | Status |
|---|------|--------|
| 1 | Landing page copy | DONE |
| 2 | Code architecture (types, hooks, API client) | DONE |
| 3 | Database migration (employees table, v7) | DONE |
| 4 | Multi-employee API (CRUD endpoints) | DONE |
| 5 | Infrastructure (DNS, Caddy, orchestrator, Docker) | DONE |
| 6 | Container hardening (cap_drop, pids, no-new-privileges) | DONE |
| 7 | LiteLLM proxy code (needs server deploy) | DONE (code only) |
| 8 | Orchestrator (employeeId naming, file/memory routes) | DONE |
| 9 | Onboarding wizard (localStorage, animations) | DONE |
| 10 | Dashboard (TeamGrid, Workspace, HireModal, KnowledgeBase) | DONE |
| 11 | Shared knowledge (Docker shared volume) | DONE |
| 12 | Learning loop (LEARNING-PROTOCOL.md, SKILLMAKER.md) | DONE |
| 13 | Stripe checkout + webhooks (basic) | DONE |
| 14 | Container re-provisioning + error handling | DONE |
| 15 | All Caddy/orchestrator/workspace bug fixes | DONE |

### Phase B: Pre-launch (Steps 5-7) — IN PROGRESS

| # | Item | Status |
|---|------|--------|
| 16 | Worker template system (playbooks, skills, docs) | DONE |
| 17 | Editable knowledge docs system (7 doc templates) | DONE |
| 18 | Reference playbooks (01-06 + CLIENT-INTELLIGENCE + WORKER-GUIDE) | DONE |
| 19 | X/Twitter skills (commenter, tweet-writer, thread-writer, article-writer) | DONE |
| 20 | Skills audit against creation guide (conversion, measurement, culture) | DONE |
| 21 | Flywheel harvesting mechanism | DONE |
| 22 | Pricing model ($199/worker/channel) | DONE (code) |
| 23 | Channel-based onboarding | DONE |
| 24 | Operations guide (OPERATIONS.md) | DONE |
| 25 | Update Stripe checkout for new pricing | DONE |
| 26 | Update landing page for new pricing | DONE (deployed) |
| 27 | **Rebuild Docker image on Hetzner** (new templates) | NOT STARTED |
| 28 | **Rebuild orchestrator on Hetzner** (flywheel + goals.md) | NOT STARTED |
| 29 | **Deploy LiteLLM to Hetzner** | NOT STARTED |
| 30 | E2E testing (onboard flow, multi-employee, Stripe) | NOT STARTED |
| 31 | Security audit | NOT STARTED |
| 32 | Monitoring setup | NOT STARTED |

### Phase C: Launch & Growth (Steps 8-10)

| # | Item | Status |
|---|------|--------|
| 31 | Go live + marketing | NOT STARTED |
| 32 | New channel expansion (Reddit, YouTube, etc.) | NOT STARTED |
| 33 | Advanced features (analytics, worker-to-worker, office floor) | NOT STARTED |

---

## Current Pricing Model
- **$199/worker/month** — 1 worker, 1 channel, ALL skills for that channel included
- Only channel live: **X/Twitter** (4 skills)
- Future channels: Reddit, YouTube, Instagram, TikTok, Email, Discord, LinkedIn
- Each additional channel = hire another worker ($199/mo)

## Current Decisions
- **1 worker = 1 channel** (not a super-worker doing everything)
- Workers collaborate via shared Docker volume per user
- Skills are taught by us (reference playbooks), not user-configurable
- Channel-based onboarding: pick a channel → all skills auto-included
- Flywheel: workers suggest improvements → owner reviews → playbooks updated → all workers improve
- Legacy plans (junior/medior/expert) preserved for backward compat

## Worker Template Architecture

### File Groups
| Group | Purpose | Files |
|---|---|---|
| Identity | Who the worker IS | SOUL.md, HEARTBEAT.md |
| Skills | What the worker DOES | skills/*/SKILL.md |
| Playbooks | HOW to do it (read-only) | reference/01-06, CLIENT-INTELLIGENCE, WORKER-GUIDE |
| Knowledge | Client context (editable) | docs/company, competitors, audience, product, brand-voice, instructions, goals |
| Memory | Learning over time | memory/improvement-suggestions, pending-questions, research-findings, suggestions |
| Config | Rules and targets | config/rules, brand-voice, targets.json |
| System | Learning behavior | LEARNING-PROTOCOL.md, SKILLMAKER.md |

### Active Skills (X/Twitter Channel)
1. **x-commenter** — Engage on target accounts and hashtags
2. **x-tweet-writer** — Write and publish original tweets (3-bucket system)
3. **x-thread-writer** — Create multi-tweet threads for authority
4. **x-article-writer** — Write long-form articles for thought leadership

---

## Immediate Next Steps (Priority Order)

### Must-do before launch:
1. **Update Stripe checkout** — Replace old plan names (simple/expert/legend) with new $199/worker pricing. Create new Stripe Price ID.
2. **Update landing page** — Reflect $199/worker/channel model, show X/Twitter as first channel, remove old tiered pricing.
3. **Deploy LiteLLM** — Containers currently use raw API keys. Deploy LiteLLM proxy on Hetzner :4000.
4. **E2E testing** — Full onboarding flow, multi-employee, Stripe checkout, trial expiry.
5. **Rebuild Docker image** — Current image on Hetzner doesn't have new worker templates. Need to rebuild.
6. **Security audit** — Container isolation, API auth, input sanitization review.
7. **Monitoring** — Error tracking, container health, API spend via LiteLLM.

### Nice-to-have before launch:
- Merge branch to main
- Clean up old test containers on Hetzner
- Fix "NaNKB" file size bug in reference files UI
- Fix cron job `'creating'` status check

---

## Root-Level Documentation Index

| File | Purpose | Status |
|---|---|---|
| `CLAUDE.md` | Project instructions for all Claude sessions | Current |
| `MEMORY.md` | Project state handoff between sessions | Current (Session 4) |
| `PLAN.md` | This file — product roadmap and progress | Current |
| `OPERATIONS.md` | Owner operations guide (daily/weekly cadences) | Current |
| `HANDOFF-SECURITY-ARCHITECTURE.md` | Security hardening guide and architecture patterns | Partially stale (old plan names, security content valid) |
| `OPENCLAW-RESEARCH.md` | OpenClaw security research reference | Current |
| `SETUP-GUIDE.md` | **OBSOLETE** — References old v3/Telegram architecture |
| `README.md` | **OBSOLETE** — References OsobniRobot, old pricing |
| `PLAN-STEP5.md` | **PARTIALLY STALE** — Skill part done differently, E2E testing still relevant |
| `docs/` folder | **ARCHIVE** — Early planning docs (Development_Plan, Implementation_Blueprint, Market_Analysis) |
