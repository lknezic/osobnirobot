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

### Recently completed (Phase D1):
- ~~**Admin hub overview**~~ — DONE (93f0428): stats cards, clients table, AI recommendations
- ~~**Admin health monitor**~~ — DONE: container status, orchestrator health, restart actions
- ~~**Admin sidebar nav + layout**~~ — DONE (93f0428): 200px sidebar, Overview/Workers/Health nav
- ~~**Admin My Workers page**~~ — DONE (93f0428): free provisioning, reuses dashboard components
- ~~**Admin subdomain routing**~~ — DONE (93f0428): middleware rewrites admin.instantworker.ai → /admin/*
- **DNS setup needed**: admin.instantworker.ai CNAME → Vercel (owner action)

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
| D1 | 1 | Rename heartbeat → "Work Log" (JS injection in container) | DONE | — |
| D1 | 2 | OpenClaw sidebar: selective show/hide/rename/describe + collapsible | DONE | Step 1 (same script) |
| D1 | 3 | Admin dashboard — Overview (clients, revenue, costs, profitability, health alerts, AI recs) | DONE | — |
| D1 | 3b | Admin hub — Sidebar nav + layout | DONE | Step 3 |
| D1 | 3c | Admin hub — My Workers page (free provisioning, manage own workers) | DONE | Step 3 |
| D1 | 3d | Admin hub — Subdomain routing (admin.instantworker.ai → /admin/*) | DONE | — |
| D1 | 4 | Admin dashboard — Health Monitor (container health, iframe status, WS disconnects) | DONE | Step 3 (shares layout) |
| D2 | 5 | Work Log tab in employee workspace (heartbeat session output) | NOT STARTED | Orchestrator /activity endpoint |
| D2 | 6 | Agent status banner + error alert toasts | NOT STARTED | Orchestrator /status-detail endpoint |
| D2 | 7 | Daily summary — team dashboard overview + per-employee Summary tab + searchable knowledge | NOT STARTED | Orchestrator /summary endpoint |
| D2 | 8 | Performance metrics bar above chat iframe (4-stat-card pattern) | NOT STARTED | Step 7 (reuses summary API) |
| D2 | 9 | Content Pipeline / Approval Queue (kanban: Draft→Pending→Approved→Posted→Rejected) | NOT STARTED | Orchestrator /content endpoint |
| D3 | 10 | Telegram integration (connect flow, login link via Telegram, channel health cards) | NOT STARTED | Telegram bot created |
| D3 | 11 | Slack integration (OAuth flow, channel health cards) | NOT STARTED | Slack app created |
| D3 | 12 | Admin dashboard — Client Detail (per-client drill-down, usage, actions) | DONE | Step 3 |
| D4 | 13 | LiteLLM multi-model routing (auto-switch cheap models for low-level tasks) | NOT STARTED | LiteLLM deployed (already on :4000) |
| D4 | 14 | Token usage + model inventory dashboard (admin: per-client USD spend, model table, budget viz) | NOT STARTED | Step 13 |
| D5 | 15 | Smart onboarding interview — "Brain" prompt (auto-fill all 7 docs from first conversation) | DONE (templates) | — |
| D5 | 16 | Model routing architect — "Muscles" prompt (AGENTS.md with task→model map, cost ceilings) | NOT STARTED | Step 13 |
| D5 | 17 | Activation triggers — "Eyes" prompt (custom heartbeat/cron based on client goals) | NOT STARTED | Step 15 |
| D5 | 18 | Evolution/learning — "Heartbeat" prompt (goal tracking, milestone review, weekly retrospective) | DONE (templates) | Step 15 |

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
- AI Recommendations as actionable task cards (inspired by kloss_xyz's OPS > Tasks page):
  Instead of plain text alerts, each recommendation is a card with title, reasoning, priority
  badge (CRITICAL / HIGH / MEDIUM), effort badge (AUTO / QUICK / MEDIUM), and action buttons.
  Rule-based engine (not LLM calls):

  | Trigger | Card title | Priority | Effort | Action buttons |
  |---------|-----------|----------|--------|----------------|
  | Container error > 24h | "Restart {name}'s container" | CRITICAL | AUTO | [Restart now] [Dismiss] |
  | Trial expiring < 3 days + active workers | "Convert {email} — trial ending" | HIGH | QUICK | [Send email] [Extend trial] [Skip] |
  | Worker below 50% daily target | "{name} is underperforming" | MEDIUM | MEDIUM | [View details] [Adjust config] |
  | Client inactive 7+ days | "Re-engage {email}" | MEDIUM | QUICK | [Send nudge] [Skip] |
  | Client 0 docs filled | "Onboarding incomplete: {email}" | HIGH | QUICK | [Send guide] [Skip] |
  | Worker posting errors > 3/day | "{name} hitting errors" | HIGH | MEDIUM | [View logs] [Restart] |

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

2. **Per-employee Summary tab:** New tab: `📊 Summary`
   - Engagement progress bars (comments: 23/30, reply rate, accounts engaged)
   - Daily report text (from `memory/YYYY-MM-DD.md`)
   - Issues section
   - Searchable knowledge base (inspired by kloss_xyz's KNOWLEDGE page — 119 docs, 9 categories,
     search + filter). Upgrades our current "What employee knows" from collapsed text sections to:
     - Categories: Company, Audience, Research, Memory, Suggestions
     - Full-text search across all knowledge files
     - Date-sorted with file previews
     - Expandable cards per document

**New files:**
- `app/dashboard/components/Summary.tsx`
- `app/api/employees/[id]/summary/route.ts`

**Orchestrator addition:**
- `GET /summary/:employeeId` → reads `memory/*.md` from container → parses stats → returns structured data

**Modified:**
- `EmployeeWorkspace.tsx` — add Summary tab
- `TeamGrid.tsx` — add summary cards above grid

#### Step 8: Metrics Bar (4-Stat-Card Pattern)

**What:** Slim stats bar above chat iframe using the 4-stat-card pattern (inspired by kloss_xyz's
PsilocyBot — every page in his dashboard has exactly 4 glass stat cards at the top).

**Applied everywhere:**
- **Team dashboard:** `Workers: 3` | `Online: 3/3` | `Comments today: 47` | `Replies: 8`
- **Employee Chat tab:** `Comments: 23/30` | `Reply rate: 12%` | `Accounts: 8` | `Uptime: 14h`
- **Employee Summary tab:** `Posts today: 23` | `Best post: 12 likes` | `Pending: 2` | `Issues: 0`
- **Admin overview:** `Clients: 12` | `Workers: 27` | `MRR: $5,373` | `Margin: 84%`
- **Admin health:** `Running: 23` | `Errors: 2` | `Avg response: 120ms` | `Crashes (7d): 1`

**New file:** `app/dashboard/components/StatCards.tsx` — reusable 4-card component

**Reuses:** Summary API from Step 7.

#### Step 9: Content Pipeline / Approval Queue

**What:** Kanban board for content review before posting. Inspired by kloss_xyz's CONTENT page
(49 pieces in pipeline, cards with platform badges, approve/reject actions).

**Problem it solves:** Workers post autonomously with no review step. For $199/mo, clients want to
see what the worker plans to post before it goes live. This is the #1 trust-building feature.

**New tab:** Add `'content'` tab to EmployeeWorkspace:
`💬 Chat | 📋 Work Log | 📝 Content | 🖥️ Browser | ⚙️ Settings`

**Kanban columns:**
```
Draft → Pending Approval → Approved → Posted → Rejected
```

**Each card shows:**
- Content text preview (comment/tweet/thread)
- Target account or hashtag
- Platform badge (X)
- Created timestamp
- Action buttons: Approve / Reject / Edit

**User flow:**
1. Worker writes a comment/tweet → puts it in "Pending Approval" column
2. Client sees it in the Content tab → approves or rejects
3. If Telegram connected: client gets push notification "Nova drafted a reply to @pmarca — approve?"
4. Approved content → worker auto-posts via browser
5. Posted content → moves to "Posted" column with link to live post

**Auto-approve mode:** Toggle in Settings: "Let [employee] post without my approval". When enabled,
worker skips the queue and posts directly. Content still logged in "Posted" column.

**Architecture:**
```
New files:
  app/dashboard/components/ContentPipeline.tsx  — kanban UI
  app/api/employees/[id]/content/route.ts       — list/approve/reject content

Orchestrator additions:
  GET  /content/:employeeId           — read content queue from container
  POST /content/:employeeId/approve   — approve item, worker picks it up
  POST /content/:employeeId/reject    — reject with optional feedback

Worker template changes:
  Add content queue protocol to SOUL.md — "write to content/queue.json, wait for approval"
  New file: content/queue.json — structured queue file in workspace
```

**Why this is high-impact:** Clients who can review before posting feel safe and stay subscribed.
Clients who trust the worker toggle auto-approve and still get a log of everything posted. Either
way, the Content tab proves the worker is creating value — critical for $199/mo retention.

### D3: Integrations

#### Step 10: Telegram + Channel Health Cards

**Prereq:** Create @InstantWorkerBot via @BotFather → provide TELEGRAM_BOT_TOKEN

**User flow:**
1. Settings tab → "Connections" → "Connect Telegram"
2. Shows link: `https://t.me/InstantWorkerBot?start={employee_id}`
3. User opens in Telegram, presses Start
4. Webhook receives `/start {employee_id}`, saves telegram_chat_id
5. Orchestrator hot-updates container's openclaw.json with Telegram channel
6. Agent can now message via Telegram

**Login link flow:** When agent detects X isn't logged in + Telegram connected → sends Telegram message with noVNC link → user taps → logs in from phone → agent continues.

**Channel health cards (inspired by kloss_xyz's COMMS page):**

kloss_xyz's COMMS page shows 12 channels with status cards (Connected/Limited/Planned), capability
pills, and blockers (red pills: "No API access", "Needs role/permission update"). We adapt this for
our Integrations section in Settings.

Each channel is a glass card showing:
```
┌─────────────────────────────────────────────────┐
│  Telegram                        🟢 CONNECTED   │
│  Capabilities: [Chat] [Notifications] [Alerts]  │
│  Status: Active since Feb 14                     │
│  [Disconnect]                                    │
├─────────────────────────────────────────────────┤
│  Slack                           ⚪ NOT SET UP   │
│  Capabilities: [Chat] [Notifications] [Threads]  │
│  Blocker: [Needs Slack app authorization]         │
│  [Connect Slack]                                  │
├─────────────────────────────────────────────────┤
│  OpenClaw WebChat                🟢 ALWAYS ON    │
│  Capabilities: [Chat] [File sharing] [Voice]     │
│  Status: Built-in, no setup required              │
└─────────────────────────────────────────────────┘
```

**New files:**
- `app/api/integrations/telegram/webhook/route.ts`
- `app/api/integrations/telegram/connect/route.ts`
- `app/dashboard/components/Integrations.tsx` — channel health card grid
- `supabase-migration-v8.sql` — add telegram/slack columns to employees

**Orchestrator addition:**
- `POST /config/:id/channel` — hot-updates openclaw.json (OpenClaw watches file for changes)

**Env var:** `TELEGRAM_BOT_TOKEN`

#### Step 11: Slack + Channel Health Cards

**Prereq:** Create Slack app at api.slack.com → provide SLACK_CLIENT_ID + SLACK_CLIENT_SECRET

**User flow:** OAuth redirect → authorize → callback saves channel → orchestrator updates config.

**New files:**
- `app/api/integrations/slack/connect/route.ts`
- `app/api/integrations/slack/callback/route.ts`

**Deferred until Slack app is created.** Channel health card already built in Step 10 (Integrations.tsx).

#### Step 12: Admin Client Detail

**Route:** `/admin/clients/[userId]`

**Shows:** Profile info, Stripe link, all employees with status/ports/cost, action buttons (extend trial, restart, stop, view chat, send email).

**New files:**
- `app/admin/clients/[userId]/page.tsx`
- `app/api/admin/clients/[userId]/route.ts`

### D4: Cost Optimization

#### Step 13: LiteLLM Multi-Model Routing

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

#### Step 14: Token Usage + Model Inventory Dashboard

**What:** Show USD spend per client + full model inventory in admin dashboard. Inspired by kloss_xyz's
AGENTS > Models page (17 models, $407/mo subs, $200 API ceiling, cost analysis, budget rules).

**Source:** LiteLLM `/spend/logs` API grouped by virtual key + LiteLLM `/model/info` for model list.

**Two tabs in admin:**

**Usage tab:**
- Per-client cost column in clients table
- Per-employee cost in client detail
- Total MTD cost and margin
- Daily/weekly cost trend chart

**Models tab (inspired by kloss_xyz):**
```
┌── Model Inventory ─────────────────────────────────────────┐
│  3 total models | 3 active | Est. $50-150/mo API spend     │
│                                                             │
│  Brain Models (quality tasks):                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Claude Sonnet 4    $0.003/1K in  $0.015/1K out      │    │
│  │ Used for: writing, research, first-boot interview   │    │
│  │ This month: $89.40 (23,400 requests)                │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Muscle Models (cheap tasks):                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Gemini 2.0 Flash   $0.00001/1K in  $0.00004/1K out │    │
│  │ Used for: heartbeat, reading tweets, checking       │    │
│  │ This month: $4.20 (840,000 requests)                │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌── Budget Rules ─────────────────────────────────────┐    │
│  │ Daily ceiling: $5/worker | Weekly: $25/worker       │    │
│  │ Runaway threshold: $200/mo total → triggers review  │    │
│  │ Current burn rate: $3.12/day ($93.60/mo projected)  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

**New files:**
- `app/admin/models/page.tsx` — model inventory + cost analysis
- `app/api/admin/usage/route.ts` — query LiteLLM spend API
- `app/api/admin/models/route.ts` — query LiteLLM model info
- `lib/litellm.ts` — LiteLLM API client

### D5: Smart Agent Initialization (inspired by kloss_xyz's 8-organ system)

kloss_xyz built an 8-phase initialization system for OpenClaw where each "organ" is a specialized
system prompt that deeply interviews the user, then auto-generates workspace files. We adapt 4 of
the 8 organs to our use case — the ones that solve real problems we have.

**The core insight:** Clients don't fill in their 7 docs manually. Instead, the employee's first
conversation should BE the structured interview that auto-populates everything.

#### Step 15: Smart Onboarding Interview — "Brain" Prompt

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

#### Step 16: Model Routing Architect — "Muscles" Prompt

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

**Implementation:** This ties into Step 13 (LiteLLM multi-model routing). The `AGENTS.md` file is
the workspace-level config that OpenClaw reads. LiteLLM provides the actual routing at the API
proxy level. Both work together.

**Modified files:**
- `worker-templates/_shared/AGENTS.md` — new file, model routing config
- `app/docker/entrypoint.sh` — pass model aliases via openclaw.json
- LiteLLM config (on Hetzner) — create model groups matching aliases

#### Step 17: Activation Triggers — "Eyes" Prompt

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

#### Step 18: Evolution/Learning — "Heartbeat" Prompt

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

### Design Language (inspired by kloss_xyz's PsilocyBot Mission Control)

kloss_xyz built a "JARVIS HUD meets Bloomberg terminal" aesthetic. Key design decisions we adopt:

#### Glass card system
Replace our current `bg-[#151515] border-[var(--border)]` cards with premium glass cards:
```css
/* Glass card — use for all cards across the app */
.glass-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
}

/* Glass card hover — subtle highlight */
.glass-card:hover {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
}
```

#### 4-stat-card pattern
Every major view starts with exactly 4 stat cards in a row. Consistent visual language.
Cards use glass style + single large number + label below.

#### Priority/status badges
Consistent badge system across admin + client dashboard:
```
CRITICAL — red bg, white text
HIGH     — orange bg, white text
MEDIUM   — yellow bg, black text
LOW      — gray bg, white text
AUTO     — blue bg, white text (for automated actions)
QUICK    — green bg, black text (for effort)
```

#### Category filter pills
Horizontal scrollable pill bar for filtering content, tasks, knowledge. Active pill gets
`bg-primary/[0.06] text-primary` highlight.

#### Auto-refresh indicator
Top-right corner: green dot + "ONLINE" + timestamp. Shows the dashboard is live-updating.
When paused: yellow dot + "PAUSED".

#### What NOT to adopt from kloss_xyz
- ShadCN UI components — we use pure Tailwind (per CLAUDE.md)
- Framer Motion animations — keep it lightweight, use CSS transitions only
- Convex backend — we use Supabase
- Inter font stack — keep system fonts
- His multi-page SPA with 8 top-nav items — too complex for client-facing product

#### Migration plan
Apply glass card style incrementally. Don't refactor all existing cards at once. Apply to new
components first (admin, content pipeline, stat cards), then gradually update existing components
(TeamGrid, EmployeeWorkspace, KnowledgeBase, Settings panels) as we touch them.

### kloss_xyz PsilocyBot analysis — what we used vs skipped

**Source:** https://x.com/kloss_xyz/status/2022461932759060993

| His feature | Our adaptation | Status |
|------------|----------------|--------|
| HOME stat cards (4 cards at top) | 4-stat-card pattern on every page (Step 8) | Planned |
| OPS > Tasks (actionable cards with approve/reject) | Admin AI Recommendations as task cards (Step 3) | Planned |
| CONTENT (kanban: Draft→Pending→Approved→Published) | Content Pipeline / Approval Queue (Step 9) | Planned — NEW |
| AGENTS > Models (inventory + cost analysis + budget rules) | Token usage + model inventory dashboard (Step 14) | Planned — enhanced |
| COMMS (channel health cards with status/capabilities/blockers) | Integrations with channel health cards (Step 10-11) | Planned — enhanced |
| KNOWLEDGE (searchable, categorized, 119 docs) | Searchable knowledge in Summary tab (Step 7) | Planned — enhanced |
| Glass card aesthetic (bg-white/[0.03] backdrop-blur-xl) | Design language for all new components | Planned |
| CHAT (session center, voice input, message queue) | Skipped — we embed OpenClaw's own chat UI |
| OPS > Calendar (24h day view with agent blocks) | Skipped — our heartbeat scheduling is simpler |
| CODE (repo management, git status) | Skipped — workers don't write code |
| CRM (client pipeline kanban) | Skipped — we're not an agency tool |
| Convex real-time backend | Skipped — we use Supabase |
| ShadCN + Framer Motion | Skipped — we use pure Tailwind |

### Owner actions needed (non-code)

| Item | Phase | Action |
|------|-------|--------|
| Telegram bot | D3 | Create @InstantWorkerBot via @BotFather, share token |
| Slack app | D3 | Create at api.slack.com, share client ID + secret |
| LiteLLM per-client keys | D4 | Create virtual keys per client for spend tracking |
