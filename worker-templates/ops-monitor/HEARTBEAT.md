# HEARTBEAT.md — Ops Monitor Schedule

## Task Cadence

### Every Heartbeat (every 5 minutes) — INSTANT checks
1. Check all container statuses via admin health API
2. If any container in `error` state > 5 min:
   - Attempt auto-restart via orchestrator
   - If restart fails, send Telegram CRITICAL alert
3. Check orchestrator responsiveness (simple health ping)
4. If orchestrator down, send Telegram CRITICAL alert immediately
5. Reply HEARTBEAT_OK with a one-line status summary

### Every Hour (12th heartbeat)
1. Check worker activity — are workers posting/commenting?
   - For each active worker, check if `memory/YYYY-MM-DD.md` was updated in the last 2 hours
   - If a worker has been silent for 4+ hours during work hours → flag as warning
2. Check LiteLLM spend: `GET /api/admin/usage?days=1`
   - If daily spend > 80% of $5/worker ceiling → Telegram warning
3. Check for new signups (compare client count with last check)
4. Spot-check 1-2 recent worker outputs for quality (via orchestrator content endpoint)

### Every Day (first heartbeat after 08:00 UTC) — DAILY report
1. Compile daily report:
   - Workers online count
   - Total engagement across all workers (comments, tweets, threads, articles)
   - Any workers below 50% of daily targets
   - Revenue: active subscribers × $199
   - Cost: LiteLLM spend today
   - Margin: (Revenue - Cost) / Revenue
   - New signups, trial expirations upcoming
   - Container restarts in the last 24 hours
2. Send daily report via Telegram
3. Save report to `memory/daily-YYYY-MM-DD.md`
4. Check for trials expiring in next 3 days → flag for follow-up
5. Check disk space and memory estimates

### Every Week (first heartbeat Monday after 08:00 UTC) — WEEKLY report
1. Compile weekly report:
   - Total engagement (week over week comparison)
   - Top performing worker and worst performing worker
   - Revenue trend (MRR, new, churned)
   - Cost trend (total API spend, cost per worker)
   - Client health: active, at-risk, churned
   - Infrastructure: container crashes, restart count, uptime %
2. Harvest improvement suggestions from all workers: `GET /api/improvements`
   - Compile into actionable list
   - Include in weekly report
3. Send weekly report via Telegram
4. Save to `memory/weekly-YYYY-WW.md`
5. Review scaling readiness: `GET /api/admin/scaling`

## Quiet Hours
The ops monitor NEVER sleeps. It runs 24/7. Critical alerts are sent any time.
However, non-critical daily/weekly reports should be sent during admin's working hours (08:00-20:00 CET).

## Telegram Delivery
To send a Telegram message, call the internal API:
```
POST /api/integrations/telegram/send
Authorization: Bearer {ORCHESTRATOR_SECRET}
Body: { "chatId": "{ADMIN_TELEGRAM_CHAT_ID}", "text": "..." }
```

The admin's Telegram chat ID is stored in your config. If not set, log alerts to `memory/alerts-YYYY-MM-DD.md` instead.

## Model Routing
This worker uses ONLY the `fast` model for all tasks. Ops monitoring doesn't need creative writing — it needs speed and low cost.
