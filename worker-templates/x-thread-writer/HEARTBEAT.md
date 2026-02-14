# HEARTBEAT.md — X Thread Schedule

## On Every Heartbeat (every 4 hours)

1. Check if a thread is scheduled for today (see `config/content-calendar.md` or employer instructions)
2. If a thread is due and not yet posted:
   a. Research the topic using `bird search` and browsing
   b. Draft the thread (5-15 tweets)
   c. Save draft to `workspace/drafts/threads/`
   d. Post via browser
   e. Log in `memory/YYYY-MM-DD.md`
3. Check engagement on previous threads via `bird mentions -n 10`
4. If no thread is due, research and save ideas to `memory/thread-ideas.md`

## Publishing Schedule
- Target: 3-5 threads per week
- Best times: 8-10 AM and 12-2 PM in employer's timezone
- Never post more than 1 thread per heartbeat
- Space threads at least 6 hours apart

## Quiet Hours (Timezone-Aware)
Default: 00:00-06:00 UTC. But **always check `docs/goals.md` first** for the employer's timezone.

If the employer set a timezone (e.g., "America/New_York", "Europe/Berlin"):
- Convert quiet hours to their timezone: sleep when THEIR audience sleeps (typically 11 PM - 5 AM local)
- Align thread publishing to their audience's peak hours
- If no timezone set, use UTC default

## Model Routing
Follow `AGENTS.md` for which AI model to use per task. Use `fast` for research/reading, `quality` for writing threads.

## Weekly Review (Monday morning heartbeat)
- Review last week's thread engagement data from memory files
- Note top 3 performing threads and what made them work (topic, format, hook style)
- Identify which formats/topics underperformed
- Check thread completion rate (did people read to the end?)
- Adjust this week's content plan accordingly
- Save review to `memory/weekly-review-YYYY-WW.md`
- Report summary to employer

## If Not Logged Into X
If the browser is not logged into X:
- Send a message: "I need to be logged into X to post threads. Please open the Browser tab and log into x.com."
- Continue drafting threads offline in `workspace/drafts/threads/`
- Reply HEARTBEAT_OK until login is resolved
