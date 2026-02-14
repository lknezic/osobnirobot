# InstantWorker — Personal Reference

## What This Project Is
AI employee marketplace. Users hire AI workers ($199/mo each) that get their own computer, browser, and memory. Each worker runs one social media channel (X/Twitter first, more later) with all skills included.

**Tech stack:** Next.js 14 on Vercel + Docker containers on Hetzner + Supabase + Stripe + OpenClaw

**Current state:** Working end-to-end. 4 X/Twitter skills built. Pricing updated. Pre-launch phase.

---

## If You Lose Something (Backups & Recovery)

### "I lost my code / something broke"
Everything is in git. Your branch has 21+ commits of safety net.

```bash
# See all your commits (newest first)
git log --oneline

# Go back to any previous commit (safe — doesn't delete anything)
git checkout <commit-hash>

# Go back to current state
git checkout claude/instantworker-infrastructure-I0ovP
```

### "I want to undo everything from this session"
There's a backup tag before every major session:

```bash
# See all tags
git tag -l

# Go back to pre-session-4 state
git checkout v0.5-pre-cleanup

# If you want to HARD RESET to that point (WARNING: destroys newer commits)
git reset --hard v0.5-pre-cleanup
```

### "My branch is gone / I can't find my work"
```bash
# List all branches (local + remote)
git branch -a

# Your branch name
git checkout claude/instantworker-infrastructure-I0ovP

# If local is gone but remote exists
git fetch origin
git checkout -b claude/instantworker-infrastructure-I0ovP origin/claude/instantworker-infrastructure-I0ovP
```

### "The server is broken"
```bash
ssh root@37.27.185.246

# Check if orchestrator is running
systemctl status iw-orchestrator

# Restart it
systemctl restart iw-orchestrator

# Check containers
docker ps

# Check Caddy proxy
systemctl status caddy
systemctl reload caddy

# Nuclear option — restart everything
systemctl restart caddy && systemctl restart iw-orchestrator
```

### "The database is broken"
- Supabase has automatic daily backups
- Go to supabase.com/dashboard → your project → Settings → Backups
- Migration files are in the repo: `supabase-migration-v5.sql`, `v6.sql`, `v7.sql`

### "Vercel deploy is broken"
- Go to vercel.com → your project → Deployments
- Click any previous successful deploy → "Redeploy" to roll back instantly

---

## Starting a New Chat Session

### What to give the new Claude chat

**Always give these 3 files (copy-paste or attach):**

1. **`CLAUDE.md`** — Project rules. This tells Claude HOW to work on this project (commands, style, constraints). Without this, Claude will make assumptions.

2. **`MEMORY.md`** — Project state. This tells Claude WHERE things are (architecture, files, known issues, what's deployed). Without this, Claude will waste time exploring.

3. **`PLAN.md`** — Roadmap. This tells Claude WHAT to do next (progress tracker, priorities, remaining items). Without this, Claude won't know the plan.

**Optionally, if the task involves:**

| Task | Also give |
|---|---|
| Worker templates / skills | `WORKER-GUIDE.md` from `worker-templates/_shared/reference/` |
| Security / containers | `HANDOFF-SECURITY-ARCHITECTURE.md` |
| Daily operations | `OPERATIONS.md` |
| Pricing / Stripe | Tell Claude that Stripe checkout still has old plan names |

### How to phrase the opening message

Good:
> "Read CLAUDE.md, MEMORY.md, and PLAN.md. Then [your task]. Branch: claude/instantworker-infrastructure-I0ovP"

Better:
> "Here are my project docs [attach files]. We're on Phase B pre-launch. Next priority is updating the Stripe checkout for the new $199/worker pricing. The branch is claude/instantworker-infrastructure-I0ovP."

### After the session ends
Ask Claude to:
1. Update MEMORY.md with what changed
2. Update PLAN.md progress tracker
3. Commit and push

This keeps the chain going for the next session.

---

## Emergency Playbook

### Worker posting bad content on X
1. Open dashboard → Chat tab → tell worker to stop
2. Open Browser tab → delete the post manually
3. Update `config/rules.md` in the worker's template to prevent it
4. If account gets restricted, stop all posting for 24-48h

### Container won't start
```bash
ssh root@37.27.185.246

# Check what's happening
docker ps -a | grep iw-
journalctl -u iw-orchestrator -n 50

# Manual restart
docker restart <container-name>

# If that fails, remove and re-provision from dashboard
docker stop <container-name> && docker rm <container-name>
# Then hit "Start container" in the dashboard
```

### X account gets suspended
1. This is on the X side — appeal through X's process
2. Immediately halve all rate limits in `config/rules.md`
3. Review what content triggered it (check worker memory files)
4. You can't fix this from code — it's a platform decision

### Stripe payment fails
1. Stripe retries failed payments automatically for 72 hours
2. Check Stripe dashboard → Payments → Failed
3. If webhook isn't updating Supabase, check Vercel function logs
4. The webhook handler is mostly empty — this is a known issue, needs completing before launch

### You forget where something is
```
Project instructions    → CLAUDE.md
Current state          → MEMORY.md
Roadmap / what's next  → PLAN.md
Operations cadence     → OPERATIONS.md
Security reference     → HANDOFF-SECURITY-ARCHITECTURE.md
OpenClaw research      → OPENCLAW-RESEARCH.md
Old planning docs      → docs/archive/
Worker skill files     → worker-templates/
Server config          → infra/
```

### You need to rebuild the Docker image on Hetzner
```bash
ssh root@37.27.185.246
cd /opt/osobnirobot
git pull origin claude/instantworker-infrastructure-I0ovP
cd app/docker
docker build -t instantworker/worker:latest .
# New containers will use the updated image; existing containers keep the old one
```

---

## Key Numbers to Remember
- **Pricing:** $199/worker/month, 1 channel per worker, all skills included
- **Branch:** `claude/instantworker-infrastructure-I0ovP`
- **Server:** `ssh root@37.27.185.246`
- **Orchestrator port:** 3500
- **Container gateway ports:** 20000+
- **Container VNC ports:** 22000+
- **Active test employee:** Pulse (container `iw-7079d68e-039`)
