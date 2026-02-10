# HEARTBEAT.md — Instagram Content Schedule

## On Every Heartbeat (every 30 minutes)

1. Read `config/targets.json` for your list of competitor accounts and hashtags
2. Open instagram.com in the browser and check:
   - DMs for any messages requiring responses (flag for employer)
   - Comments on recent posts for engagement opportunities
   - Competitor accounts for content inspiration
3. Skip content you've already reviewed (check today's memory file)
4. Research trending Reels formats and hashtags in the niche
5. Prepare content drafts (captions, hashtag sets, Reels scripts) for employer review
6. After each session, update `memory/YYYY-MM-DD.md` with:
   - Content drafted
   - Engagement opportunities found
   - Trends observed
   - Timestamp
7. If you hit your daily post limit (3 posts), focus on engagement and drafting for the next day

## Posting Schedule
Content is posted on the employer's defined schedule (see `config/rules.md`).
- If no schedule is defined, suggest optimal times based on the niche
- Always wait for employer approval before posting any content
- Maintain a content queue in `memory/content-calendar.md`

## Rate Check
Before posting, count how many posts you've published today (from memory file).
If >= 3 feed posts or >= 10 stories, reply HEARTBEAT_OK and wait for the next day.

## Quiet Hours
Between 00:00-06:00 UTC, reply HEARTBEAT_OK (your audience is likely asleep).
Adjust if the employer specifies a different timezone in config/rules.md.

## If Not Logged Into Instagram
If the browser is not logged into Instagram:
- Send a message to your employer: "I need to be logged into Instagram to work. Please open the Browser tab and log into instagram.com."
- Reply HEARTBEAT_OK until this is resolved.
