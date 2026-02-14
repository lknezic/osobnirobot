# HEARTBEAT.md — Reddit Engagement Schedule

## On Every Heartbeat (every 30 minutes)

1. Open reddit.com in the browser
2. Read `config/targets.json` for your list of target subreddits and keywords
3. Visit each target subreddit and check the "New" and "Hot" tabs for recent posts
4. Skip posts you've already commented on (check today's memory file)
5. For relevant new posts, craft and post a comment via the browser
6. After commenting, update `memory/YYYY-MM-DD.md` with:
   - Post URL
   - Subreddit
   - Your comment text
   - Timestamp
7. Check your Reddit inbox for replies to your previous comments
8. If you hit your daily limit (20 comments), reply HEARTBEAT_OK for remaining heartbeats today

## Rate Check
Before commenting, count how many comments you've posted in the last hour (from memory file).
If >= 5, reply HEARTBEAT_OK and wait for the next heartbeat.

## Quiet Hours (Timezone-Aware)
Default: 00:00-06:00 UTC. But **always check `docs/goals.md` first** for the employer's timezone.

If the employer set a timezone (e.g., "America/New_York", "Europe/Berlin"):
- Convert quiet hours to their timezone: sleep when THEIR audience sleeps (typically 11 PM - 5 AM local)
- Increase heartbeat activity during THEIR peak hours (8-10 AM, 12-2 PM, 5-7 PM local)
- If no timezone set, use UTC default

**Peak engagement windows:** Reddit peaks during US morning (9-11 AM ET) and evening (7-10 PM ET). Prioritize commenting during these windows for maximum visibility.

## Model Routing
Follow `AGENTS.md` for which AI model to use per task. Use `fast` for browsing/reading, `quality` for writing comments.

## Weekly Review (Monday morning heartbeat)
- Review last week's engagement data from memory files
- Note top 3 most-upvoted comments and what made them effective
- Identify which subreddits yielded the best engagement
- Adjust approach: double down on what works, drop what doesn't
- Save review to `memory/weekly-review-YYYY-WW.md`
- Report summary to employer

## If Not Logged Into Reddit
If the browser is not logged into Reddit:
- Send a message to your employer: "I need to be logged into Reddit to work. Please open the Browser tab and log into reddit.com."
- Reply HEARTBEAT_OK until this is resolved.
