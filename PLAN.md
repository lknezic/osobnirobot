# InstantWorker — Complete Product Plan

## Progress Tracker

### Phase A: Build (Steps 1-4) — COMPLETE

| # | Item | Step | Status |
|---|------|------|--------|
| 1 | Landing page copy | Step 1 | DONE |
| 2 | Code architecture (types, hooks, API client) | Step 3-PRE | DONE |
| 3 | Database migration (employees table) | Step 3A | DONE |
| 4 | Multi-employee API (CRUD endpoints) | Step 3B | DONE |
| 5 | Infrastructure (DNS, Caddy, orchestrator, Docker) | Step 4.1-4.4 | DONE |
| 6 | Container hardening (cap_drop, pids, no-new-privileges) | Step 4.5 | DONE |
| 7 | LiteLLM proxy (containers never see real API keys) | Step 4.6 | DONE (code ready, needs server deploy) |
| 8 | Orchestrator changes (employeeId naming, file/memory routes) | Step 3C | DONE |
| 9 | Onboarding updates ("Educate your employee", animation, localStorage) | Step 2 | DONE |
| 10 | Dashboard refactor (TeamGrid, Workspace, HireModal) | Step 3D | DONE |
| 11 | Knowledge Base UI (settings tab, file upload) | Step 3E | DONE |
| 12 | Shared knowledge (Docker shared volume) | Step 3F | DONE |
| 13 | Learning loop templates (LEARNING-PROTOCOL.md) | Step 3G | DONE |
| 14 | Stripe changes (max_employees on checkout) | Step 3H | DONE |
| 15 | Container re-provisioning + error handling | Bug fix | DONE |
| 15b | Caddy wildcard proxy fix ({labels.3} port extraction) | Bug fix | DONE |
| 15c | Knowledge base cat error suppression | Bug fix | DONE |
| 15d | Caddy WebSocket fix (remove header_up for HTTP/2) | Bug fix | DONE |
| 15e | Container workspace path fix (/home/user → /home/node) | Bug fix | DONE |
| 15f | Orchestrator crash fix (disable old conflicting service) | Bug fix | DONE |

### Phase B: Pre-launch (Steps 5-7) — IN PROGRESS

| # | Item | Step | Status |
|---|------|------|--------|
| 16 | End-to-end testing | Step 5 | IN PROGRESS (chat ✓, browser ✓, settings ✓ — remaining: onboard flow, multi-employee, Stripe) |
| 17 | Security audit | Step 6 | NOT STARTED |
| 18 | Monitoring setup | Step 7 | NOT STARTED |

### Phase C: Launch & Growth (Steps 8-10)

| # | Item | Step | Status |
|---|------|------|--------|
| 19 | Go live + marketing | Step 8 | NOT STARTED |
| 20 | Skill expansion | Step 9 | NOT STARTED |
| 21 | Advanced features | Step 10 | NOT STARTED |

---

## Full Plan Details

### Context
InstantWorker is an AI employee marketplace. Users hire AI workers that get their own computer, browser, and memory. Goal: multi-employee platform where each worker learns, researches, asks questions, and acts like a real team member.

### Decisions Made
- Multi-employee: Separate Docker containers (true isolation, simultaneous work)
- Navigation: Cards grid home, click employee to enter workspace (chat/browser/settings)
- Reference files: Upload in Settings + send via chat
- Learning: Auto-research (ask question, 30min timeout, research independently, report)
- Pricing: Junior=1 employee ($99/mo), Medior=5 employees ($399/mo), Expert=10 employees ($499/mo)
- Skills are taught by us: Each skill is pre-trained with expert-level SOUL.md, SKILL.md, and reference docs

---

### Step 1: Landing Page Improvements
Files: app/page.tsx, lib/translations.ts

- Badge: "Build your team of 24/7 AI Workers in 1 Click"
- Hero headline: "Hire 24/7 AI employees that work on your business."
- Hero subtext: "Each employee researches your company, learns your voice, and works 24/7 with its own computer and browser."
- Employee tier pricing (Junior $99, Medior $399, Expert $499)
- "Meet Your Workers" section with example worker cards
- FAQ section (8 questions)
- Shared knowledge messaging
- 18h work / 6h sleep messaging
- Updated demo animation messages showing learning loop

---

### Step 2: Onboarding Improvements
Files: app/onboarding/page.tsx

- Plan descriptions: "1 employee, 1 skill" etc.
- Step 3 reframing: "Educate your first employee"
- Launch animation during provisioning (5 steps)
- Confirmation: "This is your first employee. You can hire up to {max} on the {plan} plan."
- Progress persistence to localStorage
- Worker schedule: 18h work, 6h sleep

---

### Step 3: Employee Education & Knowledge System

#### 3-PRE. Code Architecture
- lib/types.ts — Employee, PlanTier, ContainerStatus, WorkerConfig
- lib/api/employees.ts — Typed client fetch wrappers
- lib/hooks/ — useEmployees(), useEmployeeStatus(), useKnowledge()
- lib/constants.ts — Plan limits, skills, port ranges
- lib/validate.ts — Input sanitization
- lib/api-error.ts — Standard error responses
- lib/db/employees.ts — Database operations

#### 3A. Database — employees table
- supabase-migration-v7.sql
- employees table with container_status, ports, token
- profiles.max_employees column

#### 3B. Multi-Employee API
- POST/GET /api/employees — hire + list
- GET/PUT/DELETE /api/employees/[id] — single employee CRUD
- POST /api/employees/[id]/restart — restart container
- POST /api/employees/[id]/provision — re-provision container
- GET/POST/DELETE /api/employees/[id]/files — reference files
- GET /api/employees/[id]/knowledge — memory files

#### 3C. Orchestrator Changes
- Container naming: iw-{employeeId.slice(0,12)}
- employeeId in all endpoints
- File/memory routes (list, upload, delete, read)
- Port range: 20000-21999 (gateway), 22000-23999 (noVNC)

#### 3D. Multi-Employee Dashboard
- TeamGrid.tsx — cards grid
- EmployeeCard.tsx — single card
- EmployeeWorkspace.tsx — chat/browser/settings tabs
- HireEmployeeModal.tsx — mini onboarding
- KnowledgeBase.tsx — settings knowledge view + file upload

#### 3E. Knowledge Base (Settings tab)
- What employee knows (read-only, from memory files)
- Reference files (upload/delete via orchestrator)
- Company config (editable)

#### 3F. Shared Knowledge Base
- Docker shared volume: iw-shared-{userId.slice(0,12)}
- Mounted at /workspace/shared/ in all user's containers
- Files: company-profile.md, competitors.md, audience-personas.md, market-insights.md
- First employee researches, second reads shared/ and is instantly smart

#### 3G. Employee Learning Loop
- worker-templates/_shared/LEARNING-PROTOCOL.md
- Asking questions with [QUESTION] tag
- Auto-research 30-minute rule
- Proactive suggestions
- Appended to every worker's SOUL.md at provision time
- HEARTBEAT.md learning cycle

#### 3H. Stripe Changes
- Webhook sets max_employees on checkout
- Cron stops ALL user's containers on trial expiry

---

### Step 4: Infrastructure

#### 4.1 Wildcard DNS
- *.gw.instantworker.ai → Hetzner IP
- *.vnc.instantworker.ai → Hetzner IP

#### 4.2 Caddy reverse proxy
- Wildcard TLS via Cloudflare DNS challenge
- Port mapping from subdomains
- Strips X-Frame-Options for iframe embedding

#### 4.3 Deploy orchestrator
- systemd service on port 3500
- .env with secrets

#### 4.4 Build Docker image
- instantworker/worker:latest from app/docker/Dockerfile

#### 4.5 Container hardening
- CapDrop ALL + CapAdd SYS_ADMIN (Chrome)
- SecurityOpt no-new-privileges
- PidsLimit 512
- Memory 2GB, CPU 2 cores

#### 4.6 LiteLLM proxy
- LiteLLM Docker container on port 4000
- Config: infra/litellm_config.yaml
- Service: infra/litellm.service
- Containers get LITELLM_URL + LITELLM_KEY instead of real API keys
- Rate limits and budget caps via LiteLLM
- Backward compatible: falls back to direct keys if LITELLM_URL not set

#### 4.7 Vercel env vars
- ORCHESTRATOR_URL, ORCHESTRATOR_SECRET

---

### Step 5: Testing & QA

#### 5.1 End-to-end flow test
1. Land on website, click "Hire your first worker"
2. Sign up with email (magic link or Google OAuth)
3. Complete onboarding (plan, skill, business info, tone)
4. Watch learning animation during provisioning
5. Enter dashboard, see employee card
6. Open chat, see employee's research summary greeting
7. Chat with employee, see it ask questions and learn
8. Hit paywall after 3 chat views (trial users)
9. Subscribe via Stripe, paywall lifts

#### 5.2 Multi-employee test
- Hire second employee, verify shared knowledge
- Verify second employee references first by name
- Test plan limits (Junior can't hire >1)
- Test "fire employee" flow

#### 5.3 Knowledge system test
- Upload reference file, verify employee reads it
- Send file via chat, verify employee acknowledges
- Verify knowledge base shows learnings
- Verify shared knowledge syncs

#### 5.4 Edge cases
- User leaves mid-onboarding, resumes later
- Container crashes, auto-restart
- Expired trial blocks dashboard
- Plan upgrade increases employee limit

#### 5.5 Cross-browser testing
- Chrome, Safari, Firefox
- Mobile responsive

---

### Step 6: Security & Compliance
- Container audit (cap_drop, isolation, no cross-user access)
- API rate limiting, CSRF, input sanitization
- Data protection (Supabase, isolated volumes)
- Abuse prevention (CPU/memory monitoring, budget caps)
- Account security (magic link, session management)

---

### Step 7: Monitoring & Operations
- Error tracking (Sentry or similar)
- API spend monitoring via LiteLLM
- Container health checks + auto-restart
- Trial expiry automation (cron)
- Usage analytics (signups, completions, messages)

---

### Step 8: Growth & Marketing
- SEO, meta tags, OG images
- Social proof, testimonials
- Referral program
- Content marketing
- Product Hunt, HN, Reddit launch

---

### Step 9: Skill Expansion
Priority: X Commenter, X Thread Writer, Email Newsletter, Reddit Commenter, LinkedIn

Quality framework per skill:
1. Research best practices
2. Write SOUL.md + SKILL.md + HEARTBEAT.md
3. Create reference docs
4. Test with real accounts
5. Monitor output quality

---

### Step 10: Advanced Features (post-launch)
- Worker-to-worker communication
- Office floor animation
- Performance analytics dashboard
- Custom skill requests (Expert plan)
- Worker performance scoring
- Team knowledge graph
