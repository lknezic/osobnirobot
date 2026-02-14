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
| 7 | LiteLLM proxy code + server deploy | DONE |
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
| 27 | **Rebuild Docker image on Hetzner** (new templates) | READY (Dockerfile updated, needs `docker build` on server) |
| 28 | **Rebuild orchestrator on Hetzner** (flywheel + goals.md) | DONE (restarted, env vars updated) |
| 29 | **Deploy LiteLLM to Hetzner** | DONE (running on :4000) |
| 30 | E2E testing (onboard flow, multi-employee, Stripe) | NOT STARTED |
| 31 | Security audit | DONE (code fixes applied — see 7540ff7) |
| 32 | Monitoring setup | DONE (/api/health endpoint — Supabase, orchestrator, Stripe, env checks) |

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
1. ~~**Update Stripe checkout**~~ — DONE
2. ~~**Update landing page**~~ — DONE (deployed)
3. ~~**Deploy LiteLLM**~~ — DONE (running on :4000)
4. **Rebuild Docker image** — Dockerfile updated with COPY for templates + WORKER_TYPE selection. Run `docker build` on Hetzner.
5. **E2E testing** — Full onboarding flow, multi-employee, Stripe checkout, trial expiry.
6. ~~**Security audit**~~ — DONE (7540ff7): auth bypass, open redirect, cron auth, webhook secret, email XSS, security headers.
7. ~~**Monitoring**~~ — DONE (8430d9f): /api/health endpoint checks Supabase, orchestrator, Stripe, env vars. LiteLLM has built-in spend tracking.

### Nice-to-have before launch:
- Merge branch to main
- Clean up old test containers on Hetzner
- ~~Fix "NaNKB" file size bug in reference files UI~~ — DONE (85557eb)
- ~~Fix cron job `'creating'` status check~~ — DONE (85557eb)

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

---

## Phase D: Admin, Client UX & Integrations

### Execution Order

| Phase | Step | Item | Status | Depends on |
|-------|------|------|--------|------------|
| D1 | 1 | Rename heartbeat → "Work Log" (JS injection in container) | NOT STARTED | — |
| D1 | 2 | OpenClaw sidebar: selective show/hide/rename/describe | NOT STARTED | Step 1 (same script) |
| D1 | 3 | Admin dashboard — Overview (clients, revenue, costs, profitability, health alerts, AI recs) | NOT STARTED | — |
| D1 | 4 | Admin dashboard — Health Monitor (container health, iframe status, WS disconnects) | NOT STARTED | Step 3 (shares layout) |
| D2 | 5 | Work Log tab in employee workspace (heartbeat session output) | NOT STARTED | Orchestrator /activity endpoint |
| D2 | 6 | Agent status banner + error alert toasts | NOT STARTED | Orchestrator /status-detail endpoint |
| D2 | 7 | Daily summary — team dashboard overview + per-employee Summary tab | NOT STARTED | Orchestrator /summary endpoint |
| D2 | 8 | Performance metrics bar above chat iframe | NOT STARTED | Step 7 (reuses summary API) |
| D3 | 9 | Telegram integration (connect flow, login link via Telegram) | NOT STARTED | Telegram bot created |
| D3 | 10 | Slack integration (OAuth flow) | NOT STARTED | Slack app created |
| D3 | 11 | Admin dashboard — Client Detail (per-client drill-down, usage, actions) | NOT STARTED | Step 3 |
| D4 | 12 | LiteLLM multi-model routing (auto-switch cheap models for low-level tasks) | NOT STARTED | LiteLLM deployed (already on :4000) |
| D4 | 13 | Token usage dashboard (admin + per-client USD spend) | NOT STARTED | Step 12 |
| D5 | 14 | Smart onboarding interview — "Brain" prompt (auto-fill all 7 docs from first conversation) | NOT STARTED | — |
| D5 | 15 | Model routing architect — "Muscles" prompt (AGENTS.md with task→model map, cost ceilings) | NOT STARTED | Step 12 |
| D5 | 16 | Activation triggers — "Eyes" prompt (custom heartbeat/cron based on client goals) | NOT STARTED | Step 14 |
| D5 | 17 | Evolution/learning — "Heartbeat" prompt (goal tracking, milestone review, weekly retrospective) | NOT STARTED | Step 14 |

### D1: Foundation (no external deps, buildable now)

#### Step 1+2: Container UI Customization

**What:** Inject JS into OpenClaw Control UI at build time to rename sidebar items, hide dangerous ones, and add descriptions. Replace nuclear CSS sidebar hide with selective approach.

**New file: `app/docker/iw-customize.js`**

Injected into OpenClaw's index.html via Dockerfile + entrypoint.sh. Uses MutationObserver to catch SPA re-renders.

Renames:
- "Heartbeat" → "Work Log"
- "Sessions" → "Conversations"

Hides:
- Config / Settings (dangerous — user could break container)
- Exec Approvals (too technical)
- Update (managed by us)
- Agents Dashboard (too technical)

Shows (with descriptions):
- Chat — main conversation
- Work Log — "See what your employee did on auto-pilot"
- Conversations — "Switch between chat sessions"
- Cron Jobs → "Scheduled Tasks" — "View and edit recurring tasks"
- Skills — "View active skills"
- Channels (Phase 3) → "Connections" — Telegram/Slack status

**CSS change:** Remove nuclear sidebar hide from `custom-ui.css`. Keep accent colors + branding. Make sidebar 200px wide and collapsible.

**Modified files:**
- `app/docker/custom-ui.css` — remove sidebar hide rules, add collapsible style
- `app/docker/Dockerfile` — COPY iw-customize.js
- `app/docker/entrypoint.sh` — inject `<script>` tag

#### Step 3: Admin Dashboard — Overview

**Route:** `/admin` — protected by email allowlist, not plan auth.

**Admin email:** `contact@lukaknezic.com`

**New files:**
- `app/admin/layout.tsx` — server component, checks isAdmin(email), redirects non-admins
- `app/admin/page.tsx` — overview dashboard (client component)
- `app/api/admin/overview/route.ts` — aggregated stats from Supabase
- `app/api/admin/clients/route.ts` — all profiles + employees joined
- `lib/admin-auth.ts` — email allowlist

**Middleware change:** Add `/admin/:path*` to matcher.

**Overview page shows:**
- Stats cards: Clients, Workers, Online/Total, MRR
- Cost cards: AI Cost MTD, Profit, Margin %, Trial→Paid conversion %
- Health alerts: containers in error/stopped state
- Clients table: email, plan, workers, status, revenue/mo, cost/mo
- AI Recommendations: rule-based alerts (not LLM calls):
  - Container error > 24h → "reach out or auto-restart"
  - Trial expiring < 3 days + active workers → "high conversion, send email"
  - Worker below 50% daily target → "check HEARTBEAT config"
  - Client inactive 7+ days → "send re-engagement"
  - Client 0 docs filled → "send onboarding nudge"

**Revenue:** count of active subscribers × $199/worker/month. Trial = $0.

**Cost:** from LiteLLM `/spend/logs` API grouped by virtual key. LiteLLM is already running on :4000. Need to create per-client virtual keys so we can track spend per user.

**Profitability:** Revenue - Cost per client. Color-coded: green >70% margin, yellow 40-70%, red <40%.

#### Step 4: Admin Health Monitor

**Route:** `/admin/health`

**New files:**
- `app/admin/health/page.tsx` — real-time container health
- `app/api/admin/health/route.ts` — proxies to orchestrator

**Orchestrator addition:**
- `GET /admin/health-all` — uses Docker API (listContainers + stats)

**Shows per container:**
- Status (running/stopped/error), gateway health ping (green/yellow/red)
- WS connection count, uptime, CPU %, memory
- Action buttons: Restart, Stop, View Logs
- Aggregated: WS disconnects (24h), container crashes (7d), token auth failures, avg gateway response time

**Auto-refresh:** 15s interval. Pause button. Filter by status.

### D2: Client-Facing Improvements

All steps in D2 need orchestrator API additions to read data from inside containers.

#### Step 5: Work Log Tab

**What:** New tab in EmployeeWorkspace showing what the agent did during heartbeat sessions.

**New files:**
- `app/dashboard/components/WorkLog.tsx`
- `app/api/employees/[id]/activity/route.ts` — proxies to orchestrator

**Orchestrator addition:**
- `GET /activity/:employeeId` → hits container gateway's sessions API → filters heartbeat session → returns last N messages

**Tab added:** `'worklog'` between Chat and Browser: `💬 Chat | 📋 Work Log | 🖥️ Browser | ⚙️ Settings`

**Shows:** Time-stamped cards of each heartbeat run with what happened.

#### Step 6: Status Banner + Error Alerts

**New files:**
- `app/dashboard/components/StatusBanner.tsx`
- `app/dashboard/components/AlertToast.tsx`
- `app/api/employees/[id]/status/route.ts`

**Status logic:**
- container off → "Offline" (red)
- last heartbeat < 5min → "Working" (green, pulsing)
- quiet hours → "Sleeping" (gray)
- last heartbeat > 60min → "May be stuck" (yellow)
- agent needs login → "Needs attention" (orange)
- else → "Idle" (green)

**Toasts:** Parse agent chat for: "need to be logged in", `[QUESTION]`, error keywords. Show dismissable notifications.

#### Step 7: Daily Summary — Dashboard + Per-Employee

**Two locations:**

1. **Team dashboard (TeamGrid):** Summary cards above employee grid:
   - Total comments/threads/tweets today across all workers
   - Workers needing attention count
   - Per-employee mini stats on each card

2. **Per-employee Summary tab:** New 5th tab: `📊 Summary`
   - Engagement progress bars (comments: 23/30, reply rate, accounts engaged)
   - Daily report text (from `memory/YYYY-MM-DD.md`)
   - Issues section

**New files:**
- `app/dashboard/components/Summary.tsx`
- `app/api/employees/[id]/summary/route.ts`

**Orchestrator addition:**
- `GET /summary/:employeeId` → reads `memory/*.md` from container → parses stats → returns structured data

**Modified:**
- `EmployeeWorkspace.tsx` — add Summary tab
- `TeamGrid.tsx` — add summary cards above grid

#### Step 8: Metrics Bar

**What:** Slim stats bar above chat iframe: `💬 23 comments | 📈 12% reply rate | 👥 8 accounts | ⏰ 14h uptime`

**New file:** `app/dashboard/components/MetricsBar.tsx`

**Reuses:** Summary API from Step 7.

### D3: Integrations

#### Step 9: Telegram

**Prereq:** Create @InstantWorkerBot via @BotFather → provide TELEGRAM_BOT_TOKEN

**User flow:**
1. Settings tab → "Connections" → "Connect Telegram"
2. Shows link: `https://t.me/InstantWorkerBot?start={employee_id}`
3. User opens in Telegram, presses Start
4. Webhook receives `/start {employee_id}`, saves telegram_chat_id
5. Orchestrator hot-updates container's openclaw.json with Telegram channel
6. Agent can now message via Telegram

**Login link flow:** When agent detects X isn't logged in + Telegram connected → sends Telegram message with noVNC link → user taps → logs in from phone → agent continues.

**New files:**
- `app/api/integrations/telegram/webhook/route.ts`
- `app/api/integrations/telegram/connect/route.ts`
- `app/dashboard/components/Integrations.tsx`
- `supabase-migration-v8.sql` — add telegram/slack columns to employees

**Orchestrator addition:**
- `POST /config/:id/channel` — hot-updates openclaw.json (OpenClaw watches file for changes)

**Env var:** `TELEGRAM_BOT_TOKEN`

#### Step 10: Slack

**Prereq:** Create Slack app at api.slack.com → provide SLACK_CLIENT_ID + SLACK_CLIENT_SECRET

**User flow:** OAuth redirect → authorize → callback saves channel → orchestrator updates config.

**New files:**
- `app/api/integrations/slack/connect/route.ts`
- `app/api/integrations/slack/callback/route.ts`

**Deferred until Slack app is created.**

#### Step 11: Admin Client Detail

**Route:** `/admin/clients/[userId]`

**Shows:** Profile info, Stripe link, all employees with status/ports/cost, action buttons (extend trial, restart, stop, view chat, send email).

**New files:**
- `app/admin/clients/[userId]/page.tsx`
- `app/api/admin/clients/[userId]/route.ts`

### D4: Cost Optimization

#### Step 12: LiteLLM Multi-Model Routing

**What:** Auto-switch to cheaper models for low-level tasks.

**Routing:**
| Task | Model | Est. cost |
|------|-------|-----------|
| Heartbeat check | Gemini 2.0 Flash | $0.0001/1K tokens |
| Reading tweets | Gemini 2.0 Flash | $0.0001/1K tokens |
| Writing comments | Claude Sonnet 4 | $0.003/1K tokens |
| Research/analysis | Claude Sonnet 4 | $0.003/1K tokens |
| Complex reasoning | Claude Opus 4.6 | $0.015/1K tokens (rare) |

**How:** LiteLLM config with model groups. OpenClaw agents reference model aliases (fast/quality/premium). Per-client virtual keys for spend tracking.

**Needs:** LiteLLM config update + per-client API keys + OpenClaw agent model config change.

#### Step 13: Token Usage Dashboard

**What:** Show USD spend per client in admin dashboard.

**Source:** LiteLLM `/spend/logs` API grouped by virtual key.

**Shows:** Per-client cost column in admin, per-employee cost in client detail, total MTD cost and margin.

### D5: Smart Agent Initialization (inspired by kloss_xyz's 8-organ system)

kloss_xyz built an 8-phase initialization system for OpenClaw where each "organ" is a specialized
system prompt that deeply interviews the user, then auto-generates workspace files. We adapt 4 of
the 8 organs to our use case — the ones that solve real problems we have.

**The core insight:** Clients don't fill in their 7 docs manually. Instead, the employee's first
conversation should BE the structured interview that auto-populates everything.

#### Step 14: Smart Onboarding Interview — "Brain" Prompt

**Problem it solves:** Clients launch an employee, see 7 empty docs in Settings, and never fill
them. The employee has no context, writes generic content, client churns.

**What:** Replace the employee's generic first greeting with a structured 10-15 question interview
modeled on kloss_xyz's "Brain" organ. The employee asks purposeful questions, then auto-fills all
7 `docs/` files.

**kloss_xyz's Brain covers 15 dimensions:**
1. Identity (who you are, company, mission)
2. Operations (tools, workflows, daily routines)
3. People (team, audience, stakeholders)
4. Resources (assets, accounts, content library)
5. Friction (bottlenecks, pain points, blockers)
6. Goals (short/mid/long term, KPIs)
7. Cognition (how you think, decision style)
8. Content (voice, style, existing content)
9. Communication (channels, frequency, tone)
10. Codebases (repos, tech stack) — skip for our use case
11. Integrations (connected tools) — partially relevant
12. Voice/Soul (personality, archetype)
13. Automation (what to automate, boundaries)
14. Mission Control (review cadence, reporting)
15. Memory/Boundaries (what to remember, what to forget)

**Our adapted version (8 questions, mapped to our 7 docs):**

| Question | Fills | Doc |
|----------|-------|-----|
| "Tell me about your company — what do you do, who do you serve?" | Company name, URL, mission, industry | `docs/company.md` |
| "Who is your ideal customer? What are their biggest pain points?" | Target personas, pain points, goals | `docs/audience.md` |
| "What product/service do you offer? What makes you different?" | Product details, features, USP | `docs/product.md` |
| "Who are your main competitors? What do they do well/poorly?" | Competitor names, strengths, gaps | `docs/competitors.md` |
| "How should I sound when writing on your behalf? Casual, professional, edgy?" | Tone, style, words to use/avoid | `docs/brand-voice.md` |
| "Any specific rules? Topics to avoid, accounts to focus on, hashtags?" | Custom instructions, priorities | `docs/instructions.md` |
| "What are your goals for X? Followers, leads, brand awareness?" | Content goals, output expectations | `docs/goals.md` |
| "How often do you want me to report back? What should I flag?" | Reporting cadence, alert thresholds | `docs/instructions.md` (append) |

**After the interview:** Employee writes all 7 docs, confirms with the client:
> "Here's what I learned. I've updated my knowledge files — check the Settings tab to review
> and correct anything. I'll start working based on this. Ready?"

**Implementation:**

Modify the SOUL.md first-interaction section. Replace the generic greeting with a structured
interview protocol. No code changes needed — this is purely a prompt/template change.

**Modified files:**
- `worker-templates/x-commenter/SOUL.md` — replace "First Interaction" section
- `worker-templates/x-tweet-writer/SOUL.md` — same
- `worker-templates/x-thread-writer/SOUL.md` — same
- `worker-templates/x-article-writer/SOUL.md` — same
- `worker-templates/_shared/LEARNING-PROTOCOL.md` — add "First Boot Interview Protocol" section

**Why this is high-impact:** This single change fixes the #1 retention risk (empty docs → generic
output → client thinks the product doesn't work → churns). No new code, no new endpoints, no DB
changes. Just better prompts.

#### Step 15: Model Routing Architect — "Muscles" Prompt

**Problem it solves:** All tasks currently use the same model (Gemini Flash or Sonnet). Expensive
models are wasted on simple tasks, cheap models produce bad output on important tasks.

**What:** Adopt kloss_xyz's `AGENTS.md` model routing table format. Create a workspace file that
defines which model to use for which task type, with cost ceilings and fallback chains.

**kloss_xyz's Muscles prompt generates:**
- Model inventory (what's available, cost per token)
- Task→model routing map (which model for which task)
- Cost routing (budget guards, spending limits per day/week)
- Fallback chains (if primary model fails, try secondary)
- Multi-agent roster (which agent handles which domain)

**Our adapted version — `AGENTS.md` workspace file:**

```markdown
# AGENTS.md — Model Routing & Cost Control

## Model Inventory
| Alias | Model | Cost/1K in | Cost/1K out | Use for |
|-------|-------|------------|-------------|---------|
| fast | gemini-2.0-flash | $0.00001 | $0.00004 | Heartbeat, reading, checking |
| quality | claude-sonnet-4 | $0.003 | $0.015 | Writing, research, analysis |
| premium | claude-opus-4.6 | $0.015 | $0.075 | Complex reasoning (rare) |

## Task Routing
| Task | Primary | Fallback | Max tokens |
|------|---------|----------|------------|
| heartbeat-check | fast | — | 2000 |
| read-tweets | fast | — | 1000 |
| write-comment | quality | fast | 500 |
| research | quality | fast | 4000 |
| daily-summary | quality | fast | 2000 |
| first-boot-interview | quality | — | 8000 |

## Budget Guards
- Daily ceiling: $5.00 per worker
- Weekly ceiling: $25.00 per worker
- If ceiling hit: switch all tasks to `fast` model
- Alert owner if ceiling hit 3 days in a row
```

**Implementation:** This ties into Step 12 (LiteLLM multi-model routing). The `AGENTS.md` file is
the workspace-level config that OpenClaw reads. LiteLLM provides the actual routing at the API
proxy level. Both work together.

**Modified files:**
- `worker-templates/_shared/AGENTS.md` — new file, model routing config
- `app/docker/entrypoint.sh` — pass model aliases via openclaw.json
- LiteLLM config (on Hetzner) — create model groups matching aliases

#### Step 16: Activation Triggers — "Eyes" Prompt

**Problem it solves:** Every worker runs the same 30-minute heartbeat regardless of the client's
timezone, audience, or goals. A SaaS founder targeting US tech Twitter needs different timing than
a European e-commerce brand.

**What:** During the smart onboarding interview (Step 14), ask about timezone and peak engagement
windows. Auto-generate a custom `HEARTBEAT.md` with adjusted:
- Quiet hours (based on client timezone, not hardcoded UTC 00-06)
- Peak engagement windows (when their audience is most active)
- Heartbeat frequency (more frequent during peak, less during off-peak)
- Custom triggers ("check trending topics in my niche every 2 hours")

**Implementation:**
- Add timezone + peak hours questions to the onboarding interview
- Modify `HEARTBEAT.md` template to use variables from `docs/goals.md`
- No code changes — the employee adjusts its own heartbeat behavior based on docs

#### Step 17: Evolution/Learning — "Heartbeat" Prompt

**Problem it solves:** Workers don't improve over time. They comment the same way on day 30 as day
1. No goal tracking, no retrospective, no adaptation.

**What:** Add a weekly self-review protocol. Every Sunday (or configurable), the worker:
1. Reviews the week's engagement stats from `memory/engagement-stats.md`
2. Identifies top 3 performing comment styles
3. Identifies bottom 3 performing approaches
4. Updates `memory/improvement-suggestions.md` with what to change
5. Adjusts its approach for the next week
6. Posts a weekly summary to the client

**kloss_xyz's Heartbeat organ covers:**
- Active goals + milestones + deadlines
- Review rhythm (daily standup, weekly retro, monthly strategy)
- What's working vs what's not
- Adaptation based on results

**Implementation:**
- Add weekly review section to `HEARTBEAT.md` template
- Add `memory/weekly-review-YYYY-WW.md` convention
- Modify SOUL.md to include self-improvement protocol

**Modified files:**
- `worker-templates/*/HEARTBEAT.md` — add weekly review trigger
- `worker-templates/_shared/LEARNING-PROTOCOL.md` — add weekly retrospective section

### Owner actions needed (non-code)

| Item | Phase | Action |
|------|-------|--------|
| Telegram bot | D3 | Create @InstantWorkerBot via @BotFather, share token |
| Slack app | D3 | Create at api.slack.com, share client ID + secret |
| LiteLLM per-client keys | D4 | Create virtual keys per client for spend tracking |
