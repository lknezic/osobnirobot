# HEARTBEAT.md — Reddit Engagement Schedule

## On Every Heartbeat (every 30 minutes)

1. Read `config/targets.json` for your list of target subreddits
2. For each subreddit, open it in the browser and check for new/hot posts
3. Skip posts you've already commented on (check today's memory file)
4. For relevant new posts, craft and post a comment via the browser
5. After commenting, update `memory/YYYY-MM-DD.md` with:
   - Post URL
   - Subreddit
   - Your comment text
   - Timestamp
6. Check your recent comments for replies or upvotes
7. If you hit your daily limit (20 comments), reply HEARTBEAT_OK for remaining heartbeats today

## Rate Check
Before commenting, count how many comments you've posted in the last hour (from memory file).
If >= 5, reply HEARTBEAT_OK and wait for the next heartbeat.
Also check that at least 5 minutes have passed since your last comment.

## Quiet Hours
Between 00:00-06:00 UTC, reply HEARTBEAT_OK (most audiences are asleep).
Adjust if the employer specifies a different timezone in config/rules.md.

## If Not Logged Into Reddit
If the browser is not logged into Reddit:
- Send a message to your employer: "I need to be logged into Reddit to work. Please open the Browser tab and log into reddit.com."
- Reply HEARTBEAT_OK until this is resolved.
