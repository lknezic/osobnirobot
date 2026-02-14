# InstantWorker — Owner Operations Guide

Your playbook for running the platform and managing workers. Follow this cadence to keep things running smoothly and catch issues early.

---

## INSTANTLY (Real-Time Alerts)

These need immediate attention when they happen:

### Container Health
- [ ] **Container goes to `error` status** — Check orchestrator logs, restart if needed (`/api/containers/restart`)
- [ ] **Orchestrator unresponsive** — SSH into Hetzner, check if the process is running, restart with `pm2 restart orchestrator`
- [ ] **Worker can't log into X** — Check the Browser tab, re-authenticate if cookies expired

### Customer Issues
- [ ] **User reports worker not responding** — Check container status in Supabase, check if the container is actually running on Docker
- [ ] **Payment failure webhook** — Stripe will retry, but check if subscription status updated in `profiles.plan_status`
- [ ] **User stuck in onboarding** — Check if container provisioned successfully, check orchestrator logs

### System Alerts
- [ ] **Vercel deploy fails** — Check build logs, fix and redeploy
- [ ] **Supabase approaching limits** — Check row counts, storage usage
- [ ] **LiteLLM proxy errors** — Check API key validity, token balance

---

## HOURLY (During Active Hours)

Quick checks during business hours. Takes ~5 minutes.

### Worker Activity
- [ ] Check that active workers are actually posting/commenting (open a few dashboards, check recent activity in chat)
- [ ] Spot-check content quality — read 3-5 recent posts from random workers. Are they on-brand? High-quality?
- [ ] Check rate limits aren't being hit (workers should self-report in chat if rate-limited)

### System Health
- [ ] Glance at orchestrator process — is it up? (`pm2 status`)
- [ ] Check if any containers are stuck in `provisioning` (should resolve within 2-3 minutes)

---

## DAILY (Every Morning)

Morning routine. Takes ~15-20 minutes.

### Content Review
- [ ] **Review engagement stats** — Hit `/api/improvements` to pull improvement suggestions from all running workers
- [ ] **Read worker memory files** — Check `memory/engagement-stats.md` from 2-3 workers to see what's performing
- [ ] **Spot-check 5-10 posts** — Read actual published tweets, threads, comments. Grade quality 1-10.
- [ ] **Check for spam flags** — Any accounts getting restricted or flagged? Reduce posting frequency if so.

### Customer Health
- [ ] **Check new signups** — How many users signed up? How many completed onboarding?
- [ ] **Check active subscriptions** — Any cancellations or failed payments in Stripe dashboard?
- [ ] **Read support emails/messages** — Respond within 24 hours

### System Health
- [ ] **Check all containers** — Run `docker ps` on Hetzner. Are all containers that should be running actually running?
- [ ] **Check disk space** — `df -h` on Hetzner. Docker images and container logs can fill up fast.
- [ ] **Check Vercel** — Any errors in the function logs?

---

## WEEKLY (Every Monday)

Deep review. Takes ~45-60 minutes.

### Performance Analysis
- [ ] **Pull weekly stats** — Total posts published across all workers, total engagement (likes, replies, bookmarks)
- [ ] **Review improvement suggestions** — `/api/improvements` aggregates suggestions from all workers. Pick the top 3 and update reference playbooks if warranted.
- [ ] **Content quality audit** — Read 20-30 posts from the past week across different workers. Score them. Are they getting better or worse?
- [ ] **Best/worst performers** — Which worker produced the best content? Which was weakest? Why?

### Flywheel Updates
- [ ] **Update playbooks** — Based on what's working, update `reference/` files (02-SINGLE-TWEETS.md, 03-THREADS.md, etc.) with new patterns or corrections
- [ ] **Update docs templates** — If you notice workers consistently missing a type of info, improve the `docs/` templates
- [ ] **Update goals.md** — Adjust rate limits or targets based on what you've learned

### Business Metrics
- [ ] **Revenue** — MRR, new subscriptions, churn, trial conversions (Stripe dashboard)
- [ ] **Unit economics** — Cost per container (Hetzner + LiteLLM tokens) vs revenue per worker ($199/mo)
- [ ] **Trial pipeline** — How many users are in trial? When do they expire? Conversion rate?
- [ ] **Customer feedback** — Any patterns in support requests or complaints?

### Infrastructure
- [ ] **Docker image updates** — Any security patches or base image updates needed?
- [ ] **Dependency updates** — Run `npm audit` on the Next.js app. Any vulnerabilities?
- [ ] **Database maintenance** — Check Supabase for unused data, orphaned records, slow queries
- [ ] **Backup verification** — Are Supabase backups running? Can you restore one?

---

## MONTHLY (First Monday of Month)

Strategic review. Takes ~2 hours.

### Product Evolution
- [ ] **Skill quality review** — Re-read all SKILL.md and SOUL.md files. Are they still accurate and effective?
- [ ] **Playbook effectiveness** — Which reference playbooks need updating based on a month of data?
- [ ] **New skill candidates** — Is there demand for a new channel? (Reddit, YouTube, LinkedIn, etc.) Check user requests.
- [ ] **Feature requests** — What are users asking for most? Prioritize the top 3.

### Financial Review
- [ ] **P&L analysis** — Total revenue vs total costs (hosting, API tokens, domains, tools)
- [ ] **LLM token costs** — How much are you spending on LiteLLM/Claude/OpenAI per worker per month? Is it sustainable?
- [ ] **Pricing validation** — Is $199/worker/channel still the right price? Check churn rate and conversion rate.
- [ ] **Cash runway** — How many months at current burn rate?

### Growth Strategy
- [ ] **Acquisition channels** — Where are signups coming from? What's the best channel?
- [ ] **Onboarding funnel** — Signup → onboarding complete → trial → paid. Where's the biggest drop-off?
- [ ] **Retention analysis** — Average customer lifetime, churn reasons, what keeps people subscribed?
- [ ] **Expansion revenue** — Are existing customers hiring more workers (more channels)?

### Infrastructure Scaling
- [ ] **Capacity planning** — How many containers can one Hetzner box handle? When do you need to scale?
- [ ] **Performance baselines** — Container startup time, API response times, dashboard load time
- [ ] **Security audit** — Check for exposed credentials, review API authentication, update secrets if needed
- [ ] **Disaster recovery** — Could you rebuild everything from scratch? Document any gaps.

---

## QUARTERLY

### Strategic
- [ ] **Channel roadmap** — Which platform to add next? (Research, build skill, test)
- [ ] **Pricing review** — Should you add new tiers or adjust pricing?
- [ ] **Competitive analysis** — Who else is building AI social media workers? What are they doing differently?
- [ ] **Team needs** — Do you need help? Support? Development? Content?

### Technical
- [ ] **Architecture review** — Is the current architecture (Vercel + Hetzner + Supabase) still the right choice?
- [ ] **Load testing** — Simulate 10x, 50x, 100x current users. What breaks first?
- [ ] **Tech debt** — What shortcuts need to be cleaned up?

---

## Key Dashboards & URLs

| What | Where |
|---|---|
| Live containers | `ssh hetzner && docker ps` |
| Container logs | `ssh hetzner && docker logs <container-id>` |
| Orchestrator status | `ssh hetzner && pm2 status` |
| Worker improvements | `GET /api/improvements` (admin only) |
| Stripe dashboard | stripe.com/dashboard |
| Supabase dashboard | supabase.com/dashboard |
| Vercel deployments | vercel.com/dashboard |
| Error logs | Vercel → Functions → Logs |

---

## Emergency Playbook

### Worker Posting Bad Content
1. Open the worker's dashboard → Chat tab
2. Tell the worker to stop posting immediately
3. Check `config/rules.md` and `docs/instructions.md` — is the guidance clear enough?
4. Delete the bad post manually via the Browser tab
5. Update the worker's instructions to prevent recurrence

### Container Won't Start
1. Check orchestrator logs: `pm2 logs orchestrator`
2. Check Docker: `docker ps -a | grep <employee-id>`
3. Try manual restart: `POST /api/containers/restart` with employeeId
4. If still failing: check disk space, Docker daemon, port conflicts

### X Account Gets Restricted
1. Immediately reduce posting frequency (halve all rate limits)
2. Check if the account was flagged for spam — review recent posts
3. Wait 24-48 hours before resuming
4. If suspended: the employer needs to appeal via X's process
5. Update rate limits in `config/rules.md` to be more conservative

### Stripe Webhook Failures
1. Check Stripe dashboard → Developers → Webhooks → Events
2. Check if the webhook endpoint URL is correct
3. Check Vercel function logs for errors
4. Stripe retries failed webhooks for up to 72 hours

---

**Keep this guide updated as the platform evolves. Every time you encounter a new operational pattern or failure mode, add it here.**
