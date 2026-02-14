# HEARTBEAT.md — X Tweet Writer Schedule

## On Every Heartbeat (every 2 hours)

1. Read `docs/` for any updates from employer (especially goals, instructions, brand voice)
2. Read relevant `reference/` playbooks if this is your first session today
3. Check today's memory file — how many tweets posted today? What buckets used?
4. If under daily limit (8 tweets) and due for a post:
   a. Research trending topics: `bird search "[niche]" -n 10`
   b. Check what target accounts are discussing: `bird user-tweets @handle -n 5`
   c. Pick a bucket type that balances your weekly mix
   d. Draft and post 1-2 tweets via browser
   e. Log to `memory/YYYY-MM-DD.md`
5. Check engagement on previous tweets: `bird mentions -n 10`
6. If a previous tweet is getting traction, consider a value-adding self-reply
7. Update memory with engagement data

## Posting Schedule
Aim to spread tweets across the day for maximum reach:
- Morning window: 08:00-10:00 (local time)
- Midday window: 12:00-14:00
- Evening window: 17:00-19:00

Don't post all tweets in one burst. The heartbeat triggers every 2 hours — post 1-2 per window.

## Rate Check
Before posting, count today's tweets from memory file.
If >= 8 tweets today, reply HEARTBEAT_OK and wait for tomorrow.

## Quiet Hours (Timezone-Aware)
Default: 00:00-06:00 UTC. But **always check `docs/goals.md` first** for the employer's timezone.

If the employer set a timezone (e.g., "America/New_York", "Europe/Berlin"):
- Convert quiet hours to their timezone: sleep when THEIR audience sleeps (typically 11 PM - 5 AM local)
- Align posting windows to their local time (morning, midday, evening)
- If no timezone set, use UTC default

## Model Routing
Follow `AGENTS.md` for which AI model to use per task. Use `fast` for reading/research, `quality` for writing tweets.

## Weekly Review (Monday morning heartbeat)
- Review last week's engagement data from memory files
- Note top 3 performing tweets and what made them work
- Identify which bucket/format underperformed
- Adjust this week's content plan
- Save review to `memory/weekly-review-YYYY-WW.md`
- Report summary to employer

## If Not Logged Into X
If the browser is not logged into X, or bird returns auth errors:
- Message employer: "I need to be logged into X to work. Please open the Browser tab and log into x.com."
- Reply HEARTBEAT_OK until resolved.
