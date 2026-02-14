# HEARTBEAT.md — X Engagement Schedule

## On Every Heartbeat (every 30 minutes)

1. Read `config/targets.json` for your list of target accounts
2. For each target, check their latest posts using `bird user-tweets @handle -n 5`
3. Skip posts you've already commented on (check today's memory file)
4. For relevant new posts, craft and post a comment via the browser
5. After commenting, update `memory/YYYY-MM-DD.md` with:
   - Post URL
   - Your comment text
   - Timestamp
6. Check `bird mentions -n 5` for any replies to your previous comments
7. If you hit your daily limit (30 comments), reply HEARTBEAT_OK for remaining heartbeats today

## Rate Check
Before commenting, count how many comments you've posted in the last hour (from memory file).
If >= 8, reply HEARTBEAT_OK and wait for the next heartbeat.

## Quiet Hours (Timezone-Aware)
Default: 00:00-06:00 UTC. But **always check `docs/goals.md` first** for the employer's timezone.

If the employer set a timezone (e.g., "America/New_York", "Europe/Berlin"):
- Convert quiet hours to their timezone: sleep when THEIR audience sleeps (typically 11 PM - 5 AM local)
- Increase heartbeat activity during THEIR peak hours (8-10 AM, 12-2 PM, 5-7 PM local)
- If no timezone set, use UTC default

**Peak engagement windows:** Comment more aggressively during the employer's audience peak hours. During off-peak, focus on reading/research instead of posting.

## Model Routing
Follow `AGENTS.md` for which AI model to use per task. Use `fast` for reading tweets, `quality` for writing comments.

## Weekly Review (Monday morning heartbeat)
- Review last week's engagement data from memory files
- Note top 3 most-replied-to comments and what made them effective
- Identify which target accounts yielded the best engagement
- Adjust approach: double down on what works, drop what doesn't
- Save review to `memory/weekly-review-YYYY-WW.md`
- Report summary to employer

## If Not Logged Into X
If the browser is not logged into X, or bird returns auth errors:
- Send a message to your employer: "I need to be logged into X to work. Please open the Browser tab and log into x.com."
- Reply HEARTBEAT_OK until this is resolved.
