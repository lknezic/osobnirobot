# osobnirobot.com — Master Development Plan
### Copy-paste this into your main Claude chat to start building

---

## CONTEXT FOR AI

You are building osobnirobot.com — a platform where businesses hire AI employees that work 24/7. Clients pick a role (AI SDR, AI Support Agent, AI Content Creator, AI VA), go through a 5-question onboarding, and their AI employee is live in 60 seconds on Slack/email/WhatsApp. Fixed monthly pricing ($199-999). No technical skills required from clients.

**Tech stack:** Next.js (existing app on Vercel), Supabase (existing DB), Stripe (billing), Docker (agent isolation), Mastra (TypeScript AI agent framework — orchestration, workflows, RAG, memory, model routing), Nanobot (lightweight Python agent runtime), OpenClaw (channel gateway for messaging platforms).

**Architecture overview:**
- Frontend: Next.js dashboard (client-facing) + onboarding wizard
- Orchestration: Mastra (workflows, RAG, memory, model routing, human-in-the-loop)
- Agent Runtime: Nanobot (default, lightweight) or OpenClaw (heavy-duty)
- Channels: OpenClaw gateway (Slack, WhatsApp, Telegram, Discord, email, web widget)
- Data: Supabase (clients, billing, config) + pgvector (RAG embeddings) + per-client memory stores
- LLM: Smart router — Haiku (80% simple tasks), Sonnet (15% medium), Opus (5% complex)
- Infrastructure: Docker containers per client, Hetzner/DigitalOcean VPS
- Security: Container isolation, SSL/TLS, origin validation, curated skills only, audit logs

Read the full blueprints in `docs/Implementation_Blueprint.md`, `docs/Market_Analysis_Deep_Dive.md`, and `docs/OpenClaw_Research_OsobniRobot.md` for complete context.

---

## DEVELOPMENT PHASES & MICROTASKS

Build in this exact order. Each phase must be fully working before moving to the next.

---

### PHASE 0: FOUNDATION (Week 1)
_Goal: Project setup, dependencies installed, local dev environment ready._

```
0.1  □ Read all 3 docs in /docs/ folder for full context
0.2  □ Audit existing osobnirobot.com codebase — what exists, what's the current DB schema, what pages exist
0.3  □ Install Mastra: `npm install @mastra/core @mastra/memory @mastra/rag`
0.4  □ Install Anthropic SDK: `npm install @anthropic-ai/sdk`
0.5  □ Install Stripe: `npm install stripe @stripe/stripe-js`
0.6  □ Set up environment variables:
       - ANTHROPIC_API_KEY (for LLM calls)
       - STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET
       - SUPABASE_URL + SUPABASE_ANON_KEY (existing)
       - DATABASE_URL (Supabase connection string for pgvector)
0.7  □ Add pgvector extension to Supabase: `CREATE EXTENSION IF NOT EXISTS vector;`
0.8  □ Create new DB tables (Supabase migration):
       - `agents` (id, user_id, name, role, status, config, created_at)
       - `agent_tasks` (id, agent_id, task_type, input, output, model_used, tokens_used, cost, status, created_at)
       - `agent_memory` (id, agent_id, key, value, created_at, updated_at)
       - `agent_documents` (id, agent_id, filename, chunks, embedding vectors, created_at)
       - `agent_audit_logs` (id, agent_id, action, details, created_at)
       - `subscriptions` (id, user_id, stripe_subscription_id, plan, status, current_period_end)
0.9  □ Verify local dev runs: `npm run dev` with all new deps working
```

---

### PHASE 1: LLM SMART ROUTER (Week 1-2)
_Goal: A working TypeScript module that classifies task complexity and routes to the right model. This is the financial backbone — it controls your margins._

```
1.1  □ Create `lib/llm/router.ts`:
       - Function: classifyComplexity(task: string) → 'simple' | 'medium' | 'complex'
       - Uses Haiku to classify (cost: ~$0.0001 per classification)
       - Classification prompt with clear examples for each level

1.2  □ Create `lib/llm/provider.ts`:
       - Function: callLLM(task: string, systemPrompt: string, model?: string) → response
       - Accepts optional model override, otherwise uses router
       - Supports: claude-haiku-4-5, claude-sonnet-4-5, claude-opus-4-5
       - Tracks tokens used + cost per call
       - Returns: { response, model_used, tokens, cost }

1.3  □ Create `lib/llm/cost-tracker.ts`:
       - Tracks per-agent hourly/daily/monthly spend
       - Circuit breaker: if hourly spend > $2 → switch to Haiku only
       - Circuit breaker: if daily spend > $20 → pause agent + alert
       - Logs every call to `agent_tasks` table

1.4  □ Create `lib/llm/fallback.ts`:
       - Fallback chain: Anthropic → OpenAI → DeepSeek
       - If primary provider API errors → auto-retry with next provider
       - Exponential backoff: 1s, 2s, 4s, 8s

1.5  □ Write tests for router:
       - "Schedule a meeting tomorrow" → should route to Haiku (simple)
       - "Draft a cold outreach email to a VP of Sales" → should route to Sonnet (medium)
       - "Analyze our competitor's pricing strategy and recommend changes" → should route to Opus (complex)

1.6  □ Create API route `app/api/llm/test/route.ts` to test router manually
```

---

### PHASE 2: ONBOARDING WIZARD (Week 2-3)
_Goal: Client goes from signup to "your AI is ready" in 5 minutes. This is the product experience that wins._

```
2.1  □ Create page: `app/onboarding/page.tsx`
       - Multi-step form (5 steps):
         Step 1: Pick a role (cards: AI SDR, AI Support, AI Content, AI VA)
         Step 2: Company info (name, description, industry — text inputs)
         Step 3: Tool connections (checkboxes: Slack, Gmail, HubSpot, WhatsApp, web widget)
         Step 4: Upload docs (drag-and-drop: SOPs, FAQs, product catalogs — optional)
         Step 5: Preferences (tone: Professional/Friendly/Casual, agent name)
       - Progress bar at top
       - "Hire My AI Employee" button at the end

2.2  □ Create API route `app/api/agents/create/route.ts`:
       - Receives onboarding form data
       - Creates agent record in `agents` table
       - Generates unique agent ID + gateway token
       - Returns agent config

2.3  □ Create role-specific system prompts in `lib/agents/prompts/`:
       - `sdr-prompt.ts` — sales outreach instructions, lead qualification rules
       - `support-prompt.ts` — ticket handling, FAQ answering, escalation rules
       - `content-prompt.ts` — writing style, SEO guidelines, brand voice
       - `va-prompt.ts` — email management, scheduling, data entry rules
       - Each prompt includes: role description, dos/don'ts, escalation protocol, tone

2.4  □ Create role-specific skill configs in `lib/agents/skills/`:
       - `sdr-skills.ts` — tools: email send, CRM read/write, web search, calendar book
       - `support-skills.ts` — tools: ticket read/update, FAQ search, email reply, escalate
       - `content-skills.ts` — tools: write article, schedule post, SEO analyze, image generate
       - `va-skills.ts` — tools: email manage, calendar manage, data entry, task create

2.5  □ Build RAG pipeline in `lib/rag/`:
       - `ingest.ts`: Accept uploaded files (PDF, DOCX, TXT, CSV)
         → Parse with LangChain document loaders
         → Chunk into ~500 token segments with overlap
         → Generate embeddings via Anthropic/OpenAI embedding API
         → Store in Supabase pgvector (per-agent collection)
       - `retrieve.ts`: Given a query, find top-K relevant chunks
         → Embed query → cosine similarity search → return context

2.6  □ Create "Agent Ready" confirmation page: `app/onboarding/complete/page.tsx`
       - Shows: "✅ [Agent Name] is ready!"
       - Quick actions: "Say hi on Slack" / "Send a test email" / "Open dashboard"
       - Links to connect remaining channels
```

---

### PHASE 3: AGENT CORE (Week 3-4)
_Goal: A working AI agent that receives messages and responds intelligently using the right model, with the client's knowledge base._

```
3.1  □ Create Mastra agent setup in `lib/agents/core.ts`:
       - Initialize Mastra agent with:
         → System prompt (role-specific from Phase 2)
         → Memory (per-client, persistent across sessions)
         → RAG retrieval (pull relevant client docs for context)
         → Model routing (from Phase 1)
         → Available tools/skills (role-specific)

3.2  □ Create agent message handler in `lib/agents/handler.ts`:
       - Function: handleMessage(agentId: string, message: string, channel: string)
       - Flow:
         1. Load agent config from DB
         2. Retrieve relevant context from RAG (client docs)
         3. Load conversation memory
         4. Route to appropriate LLM model
         5. Generate response
         6. Run QA checks (sanity, tone, safety, confidence)
         7. If confidence > 90% → send response
         8. If confidence 50-90% → send + flag for review in dashboard
         9. If confidence < 50% → hold + escalate to client's human team
         10. Save to memory + audit log
       - Returns: { response, confidence, model_used, cost }

3.3  □ Create tool implementations in `lib/agents/tools/`:
       - `email-tool.ts` — send/read emails via Gmail/Outlook API
       - `calendar-tool.ts` — create/read/update events via Google Calendar API
       - `crm-tool.ts` — read/write to HubSpot/Salesforce
       - `web-search-tool.ts` — search the web for research tasks
       - `escalate-tool.ts` — flag task for human review in dashboard

3.4  □ Create QA layer in `lib/agents/qa.ts`:
       - `checkSanity(task, response)` — does the response answer the task?
       - `checkTone(response, preferredTone)` — matches brand voice?
       - `checkSafety(response)` — no PII, no harmful content?
       - `checkConfidence(response)` — how confident is the agent?
       - Returns: { passed: boolean, confidence: number, flags: string[] }

3.5  □ Create agent memory manager in `lib/agents/memory.ts`:
       - Initialize per-client memory store in Supabase
       - Save key facts from conversations
       - Load relevant memories for context
       - Use Mastra's Observational Memory for 5-40x compression

3.6  □ Create API routes for agent interaction:
       - `app/api/agents/[agentId]/message/route.ts` — send message → get response
       - `app/api/agents/[agentId]/status/route.ts` — check agent health
       - `app/api/agents/[agentId]/history/route.ts` — get conversation history
```

---

### PHASE 4: CLIENT DASHBOARD (Week 4-5)
_Goal: Client can see what their AI is doing, review flagged items, and track performance._

```
4.1  □ Create dashboard layout: `app/dashboard/layout.tsx`
       - Sidebar: Overview | Tasks | Conversations | Documents | Settings
       - Top bar: Agent name + status indicator (🟢 Active / 🟡 Review needed / 🔴 Paused)

4.2  □ Create Overview page: `app/dashboard/page.tsx`
       - Stats cards: Tasks completed today | Tasks this week | Tasks this month
       - Cost savings card: "Your AI saved you ~$X,XXX this month vs. hiring a human"
       - Activity feed: Latest 20 agent actions with timestamps
       - Quick actions: Send test message, pause agent, view flagged items

4.3  □ Create Tasks page: `app/dashboard/tasks/page.tsx`
       - Table of all agent tasks
       - Columns: Time | Task | Status | Model Used | Cost | Confidence
       - Filter by: date range, status (completed/flagged/escalated), task type
       - Click task → see full details (input, output, context used)

4.4  □ Create Review Queue page: `app/dashboard/review/page.tsx`
       - Shows items flagged for human review (confidence 50-90%)
       - Shows escalated items (confidence < 50%)
       - Actions per item: Approve | Edit & Send | Reject | Provide feedback
       - Agent learns from feedback (stored in memory)

4.5  □ Create Documents page: `app/dashboard/documents/page.tsx`
       - Upload additional documents (add to RAG)
       - View currently indexed documents
       - Delete documents from knowledge base
       - Re-index button

4.6  □ Create Settings page: `app/dashboard/settings/page.tsx`
       - Agent name & role
       - Connected channels (add/remove Slack, email, etc.)
       - Tone/voice preferences
       - Escalation rules (what triggers human review)
       - Working hours (or 24/7)
       - Billing & plan info
```

---

### PHASE 5: CHANNEL INTEGRATIONS (Week 5-6)
_Goal: Agent can communicate via Slack, email, and web widget. These are the channels clients actually use._

```
5.1  □ Create Slack integration: `lib/channels/slack.ts`
       - Slack App setup (Bot Token Scopes: chat:write, channels:history, etc.)
       - OAuth flow: client clicks "Add to Slack" → authorize → bot joins workspace
       - Event handler: listen for messages mentioning the bot
       - Message → handleMessage() → send reply in Slack thread
       - Store Slack tokens per client in encrypted DB field

5.2  □ Create Email integration: `lib/channels/email.ts`
       - Gmail OAuth flow: client authorizes → get read/send permissions
       - Poll for new emails (or use Gmail push notifications via pub/sub)
       - Incoming email → handleMessage() → draft reply
       - If confidence high → send reply automatically
       - If confidence medium → draft and flag in dashboard for approval
       - Support for Outlook via Microsoft Graph API as alternative

5.3  □ Create Web Widget: `lib/channels/widget.ts` + `public/widget.js`
       - Embeddable chat widget (client adds <script> tag to their website)
       - WebSocket connection to agent's handler
       - Visitor sends message → handleMessage() → response in chat bubble
       - Capture visitor info (email, name) for CRM integration
       - Styling customizable (colors, position, greeting message)

5.4  □ Create API routes for channel management:
       - `app/api/channels/slack/install/route.ts` — Slack OAuth callback
       - `app/api/channels/slack/events/route.ts` — Slack event webhook
       - `app/api/channels/email/connect/route.ts` — Gmail/Outlook OAuth
       - `app/api/channels/widget/route.ts` — WebSocket endpoint for chat widget

5.5  □ Create unified channel router: `lib/channels/router.ts`
       - Incoming message from ANY channel → normalize format → handleMessage()
       - Response from agent → format for specific channel → send
       - Track which channel each conversation came from
```

---

### PHASE 6: BILLING & PRICING (Week 6-7)
_Goal: Stripe subscription with 3 tiers. Client pays → agent activates. Client cancels → agent pauses._

```
6.1  □ Create Stripe products & prices:
       - Starter: $199/month (1 agent, basic role, 8hr/day, email+Slack)
       - Pro: $499/month (1 agent, any role, 24/7, all channels, custom training)
       - Business: $999/month (3 agents, all roles, 24/7, multi-agent, dedicated support)

6.2  □ Create pricing page: `app/pricing/page.tsx`
       - 3 tier cards with feature comparison
       - "Start Free Trial" CTA on each (7-day free trial, no credit card for Starter)
       - Compare to human cost: "vs. $5,000/mo human SDR"
       - FAQ section addressing objections

6.3  □ Create Stripe Checkout flow: `app/api/billing/checkout/route.ts`
       - Create Checkout Session with selected plan
       - On success → activate agent, start subscription
       - On failure → show error, keep agent paused

6.4  □ Create Stripe webhook handler: `app/api/billing/webhook/route.ts`
       - `checkout.session.completed` → activate agent
       - `invoice.paid` → keep agent active
       - `invoice.payment_failed` → pause agent, notify client
       - `customer.subscription.deleted` → deactivate agent
       - Update `subscriptions` table on every event

6.5  □ Create billing management page: `app/dashboard/billing/page.tsx`
       - Current plan, next billing date, payment method
       - Upgrade/downgrade buttons
       - Usage stats (tasks this month, tokens used, cost breakdown)
       - Invoice history

6.6  □ Implement plan-based feature gates:
       - Starter: max 1 agent, only VA/Content roles, Slack+email channels, 8hr operation
       - Pro: max 1 agent, any role, all channels, 24/7, RAG, custom training
       - Business: max 3 agents, all features + multi-agent coordination
```

---

### PHASE 7: AUTONOMY & SELF-HEALING (Week 7-8)
_Goal: Agent runs without babysitting. Self-heals, catches errors, doesn't burn money._

```
7.1  □ Create loop detector: `lib/agents/autonomy/loop-detector.ts`
       - Track last 20 actions in sliding window
       - If same action appears 3+ times → break loop
       - Reset agent context, try different approach
       - If still stuck after reset → escalate to human queue

7.2  □ Create cost circuit breaker: `lib/agents/autonomy/cost-breaker.ts`
       - Pull from cost-tracker (Phase 1)
       - Hourly check: if > $2/hr → switch to Haiku-only mode
       - Daily check: if > $20/day → pause agent + alert team + notify client
       - Monthly cap: aligned to plan tier (Starter: $50, Pro: $150, Business: $400)

7.3  □ Create health check system: `lib/agents/autonomy/health-check.ts`
       - Cron job (every 5 minutes):
         → Is agent process running?
         → Is WebSocket/channel connection alive?
         → Is LLM API reachable?
         → Is memory accessible?
       - Auto-recovery: restart process, reconnect channel, switch LLM provider
       - Alert escalation: 1 fail → auto-fix, 3 fails → alert team, 5 fails → pause + notify client

7.4  □ Create supervisor agent: `lib/agents/autonomy/supervisor.ts`
       - Lightweight Haiku-based agent that monitors the worker agent
       - Checks: task duration (stuck if > 5 min on simple task)
       - Checks: output quality (does response make sense?)
       - Checks: error rate (> 3 errors in 10 min → investigate)
       - Actions: reset, escalate, switch model, pause

7.5  □ Create state checkpoint system: `lib/agents/autonomy/checkpoint.ts`
       - Save agent state every N actions to DB
       - On crash/restart → resume from last checkpoint
       - No lost work, no duplicate actions

7.6  □ Create anomaly detection: `lib/agents/autonomy/anomaly.ts`
       - Track normal patterns per agent (avg tasks/hr, avg cost/task, error rate)
       - Alert if: sudden spike in emails sent, unusual API calls, cost anomaly
       - Auto-pause on critical anomalies
```

---

### PHASE 8: LANDING PAGE & MARKETING COPY (Week 8-9)
_Goal: Convert visitors into trials. Lead with outcomes, not features._

```
8.1  □ Redesign homepage: `app/page.tsx`
       - Hero: "Hire AI. Fire Busywork." + subhead + CTA [Hire Your First AI Employee — Free 7 Days]
       - Social proof: stats (120+ hrs saved, 24/7, 80% cheaper) + future client logos
       - How it works: 4 steps (Tell us → We train → AI works → We optimize)
       - AI Employee roles: 5 cards (SDR, Support, Content, Research, VA) with pricing
       - Pricing section: 3 tiers + compare to human cost
       - Objection-handling FAQ
       - Final CTA: "Your AI employee is ready to start"

8.2  □ Create role-specific landing pages:
       - `app/hire/sdr/page.tsx` — AI Sales Rep landing page
       - `app/hire/support/page.tsx` — AI Support Agent landing page
       - `app/hire/content/page.tsx` — AI Content Creator landing page
       - `app/hire/va/page.tsx` — AI Virtual Assistant landing page
       - Each page: role description, what it does, pricing, CTA

8.3  □ Update copy across all pages:
       - Never say "bot", "agent", "instance" → say "AI employee", "AI worker"
       - Never mention API keys, tokens, models → say "your AI", "fixed price"
       - Always compare to human cost → "$999/mo vs $5,000/mo human"
       - Always address fears → security, reliability, "will it actually work?"

8.4  □ Add meta tags, OG images, analytics (Vercel Analytics / Plausible)
8.5  □ Set up email capture for waitlist (if not launching yet)
```

---

### PHASE 9: SECURITY HARDENING (Week 9-10)
_Goal: Multi-tenant security that makes enterprises trust us._

```
9.1  □ Container isolation per client:
       - Dockerfile for agent runtime (Nanobot or OpenClaw)
       - Docker Compose per client with: network:none, read-only fs, non-root, resource limits
       - No shared volumes between clients

9.2  □ API key security:
       - Move all API keys to environment variables (never in code/DB plaintext)
       - Set up Doppler or similar secrets manager for production
       - Per-client API spending limits via Anthropic dashboard

9.3  □ WebSocket security:
       - Origin header validation on all WebSocket connections
       - SSL/TLS (wss://) enforced — reject ws:// connections
       - Authentication token required for WebSocket handshake
       - Rate limiting on WebSocket messages

9.4  □ Agent guardrails:
       - Action allowlist per role (agent can ONLY execute approved tools)
       - Block arbitrary shell commands
       - Human-in-the-loop for: first-time email sends, data deletion, money spending
       - Output filtering: strip PII before sending to channels

9.5  □ Audit logging:
       - Log every agent action to `agent_audit_logs`
       - Immutable/append-only (no deletes)
       - Client can view in dashboard
       - Admin can search across all clients

9.6  □ Prompt injection detection:
       - Add detection layer before processing user messages
       - Flag suspicious patterns (role overrides, system prompt leaks)
       - Hold flagged messages for review
```

---

### PHASE 10: TESTING & LAUNCH PREP (Week 10-11)
_Goal: Everything works end-to-end. Ready for first clients._

```
10.1  □ End-to-end test: Sign up → onboard → agent responds on Slack → view in dashboard
10.2  □ End-to-end test: Upload documents → agent uses them in responses
10.3  □ End-to-end test: Stripe payment → agent activates → cancel → agent pauses
10.4  □ Load test: 10 concurrent agents on one server — measure performance
10.5  □ Cost test: Run 100 sample tasks through router — verify cost is within budget
10.6  □ Security test: Try WebSocket hijacking, prompt injection, unauthorized access
10.7  □ Deploy to production (Vercel frontend + Hetzner/DO for agent containers)
10.8  □ Set up monitoring: uptime checks, error alerts, cost alerts
10.9  □ Prepare onboarding email sequence for new clients
10.10 □ Launch to first 5-10 beta clients (manual outreach)
```

---

### PHASE 11: POST-LAUNCH ITERATION (Week 11+)
_Goal: Learn from real clients, optimize, scale._

```
11.1  □ Collect feedback from beta clients (what works, what doesn't)
11.2  □ Optimize prompts based on real task success/failure rates
11.3  □ Add WhatsApp channel (Twilio integration)
11.4  □ Add Telegram channel
11.5  □ Build weekly performance report (auto-email to clients)
11.6  □ Add multi-agent coordination (Business tier — agents hand off tasks)
11.7  □ Build CRM integration (HubSpot OAuth)
11.8  □ Implement gVisor sandboxing for enhanced security
11.9  □ Start SOC2 compliance process
11.10 □ Scale to 50+ clients, optimize infrastructure costs
```

---

## HOW TO USE THIS PLAN

**Copy everything above into your Claude Code chat and say:**

> "Read the docs in /docs/ folder, then follow the Development Plan in /docs/Development_Plan.md. Start with Phase 0 and work through each task in order. Ask me questions if anything is unclear. Do NOT skip phases — each one builds on the previous."

The AI will:
1. Read all 3 research docs for full context
2. Audit your existing codebase
3. Start building Phase 0 → Phase 1 → Phase 2 → etc.
4. Ask you questions when decisions are needed
5. Test each phase before moving on

**Estimated timeline: 10-11 weeks for MVP launch with first clients.**
