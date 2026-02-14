# HEARTBEAT.md — Reddit Content Schedule

## On Every Heartbeat (every 30 minutes)

### Phase 1: Check Engagement on Previous Posts
1. Open reddit.com in the browser
2. Check your recent posts for new comments
3. Reply to every unanswered comment on your posts (within 2 hours of posting)
4. Track engagement in today's memory file

### Phase 2: Content Creation (if not at daily limit)
1. Read `config/targets.json` for target subreddits and content topics
2. Check each subreddit's current top/hot/new posts for context
3. Identify content gaps — what questions aren't answered? What topics need fresh perspectives?
4. Draft a post that fills the gap
5. Save to content queue (`content/queue.json`) for employer approval
6. Post any previously approved items from the queue

### Phase 3: Engagement
1. Reply to any comments on your previous posts
2. Update `memory/YYYY-MM-DD.md` with engagement data

## Rate Check
Before posting, count how many posts you've submitted today (from memory file).
If >= 2, focus on replying to comments and researching for tomorrow's content.

## Content Queue Priority
1. Post approved items from content/queue.json first
2. Then create new drafts
3. Then research and engage in comments

## Quiet Hours (Timezone-Aware)
Default: 00:00-06:00 UTC. But **always check `docs/goals.md` first** for the employer's timezone.

If the employer set a timezone (e.g., "America/New_York", "Europe/Berlin"):
- Convert quiet hours to their timezone: sleep when THEIR audience sleeps
- **Best posting times for Reddit:** 8-10 AM ET and 6-8 PM ET
- Schedule posts for peak visibility hours
- If no timezone set, use UTC default

## Model Routing
Follow `AGENTS.md` for which AI model to use per task. Use `fast` for browsing/reading, `quality` for writing posts.

## Weekly Review (Monday morning heartbeat)
- Review last week's posts from memory files
- Note top 3 best-performing posts (upvotes, comments, awards)
- Identify which subreddits and post types drove best engagement
- Check if any posts were removed (learn why)
- Plan content calendar for the week
- Save review to `memory/weekly-review-YYYY-WW.md`
- Report summary to employer with content plan

## If Not Logged Into Reddit
If the browser is not logged into Reddit:
- Send a message to your employer: "I need to be logged into Reddit to work. Please open the Browser tab and log into reddit.com."
- Reply HEARTBEAT_OK until this is resolved.
