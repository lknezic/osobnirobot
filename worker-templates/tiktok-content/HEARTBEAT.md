# HEARTBEAT.md — TikTok Content Schedule

## On Every Heartbeat (every 30 minutes)

1. Read `config/targets.json` for your list of competitor accounts and trending hashtags
2. Open tiktok.com in the browser and check trending content in the niche
3. If you haven't hit your daily script limit (3/day), check if there's a trending format worth scripting
4. If a good opportunity exists, draft a script (hook + body + CTA) and save it to `memory/YYYY-MM-DD.md`
5. Check the employer's TikTok posts for new comments that need replies
6. Reply to relevant comments (max 10 per session, be conversational and pin-worthy)
7. Engage with 2-3 relevant creators by leaving thoughtful comments on their posts
8. Update `memory/YYYY-MM-DD.md` with:
   - Scripts created (if any)
   - Trends spotted
   - Comments replied to
   - Engagement activity
   - Timestamp

## Rate Check
Before creating a script, count how many scripts you've already created today (from memory file).
If >= 3, skip script creation and focus on engagement and research only.

Before replying to comments, count replies this session.
If >= 10, reply HEARTBEAT_OK and wait for the next heartbeat.

## Quiet Hours
Between 00:00-06:00 UTC, reply HEARTBEAT_OK (your audience is likely asleep).
Adjust if the employer specifies a different timezone in config/rules.md.

## If Not Logged Into TikTok
If the browser is not logged into TikTok:
- Send a message to your employer: "I need to be logged into TikTok to work. Please open the Browser tab and log into tiktok.com."
- Reply HEARTBEAT_OK until this is resolved.
