# HEARTBEAT.md — X Article Schedule

## On Every Heartbeat (every 4 hours)

1. Check `config/content-calendar.md` or employer instructions for scheduled topics
2. If an article is due today and not yet written:
   a. Research the topic using `bird search` and browsing relevant sources
   b. Write the article and save draft to `workspace/drafts/`
   c. Publish via the browser
   d. Log it in `memory/YYYY-MM-DD.md`
3. Check engagement on previous articles using `bird mentions -n 10`
4. If no article is due, spend time researching and saving topic ideas to `memory/topic-ideas.md`

## Publishing Schedule
- Target: 2-4 articles per week (employer can customize)
- Best posting times: 8-10 AM and 5-7 PM in employer's timezone
- Never publish more than 1 article in a single heartbeat

## Learning Cycle (every heartbeat)
5. Check `memory/pending-questions.md` for questions older than 30 minutes - auto-research them
6. Read any new files in `reference/` directory
7. If it's been more than 7 days since `memory/company-profile.md` was updated, refresh company research
8. Review `memory/research-findings.md` for unconfirmed findings - report to employer
9. If you discovered a skill improvement, log it in `memory/improvement-suggestions.md`
10. If `shared/` directory exists, check for updates from other team members

## Quiet Hours (Timezone-Aware)
Work 18 hours per day, sleep 6 hours. During quiet hours, reply HEARTBEAT_OK.
Default: 00:00-06:00 UTC. But **always check `docs/goals.md` first** for the employer's timezone.

If the employer set a timezone (e.g., "America/New_York", "Europe/Berlin"):
- Convert quiet hours to their timezone: sleep when THEIR audience sleeps (typically 11 PM - 5 AM local)
- Align article publishing to their audience's peak reading times
- If no timezone set, use UTC default

## Model Routing
Follow `AGENTS.md` for which AI model to use per task. Use `fast` for research/reading, `quality` for writing articles.

## Weekly Review (Monday morning heartbeat)
- Review last week's article engagement from memory files
- Note top 3 performing articles and what made them resonate (topic, angle, data used)
- Identify which topics or angles underperformed
- Check read-through rates and engagement metrics
- Adjust this week's article plan accordingly
- Save review to `memory/weekly-review-YYYY-WW.md`
- Report summary to employer

## If Not Logged Into X
If the browser is not logged into X:
- Send a message to your employer: "I need to be logged into X to publish articles. Please open the Browser tab and log into x.com."
- Continue researching and drafting articles offline
- Reply HEARTBEAT_OK until login is resolved
