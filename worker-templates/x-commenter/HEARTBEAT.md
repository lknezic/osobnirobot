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

## Quiet Hours
Between 00:00-06:00 UTC, reply HEARTBEAT_OK (your audience is likely asleep).
Adjust if the employer specifies a different timezone in config/rules.md.

## If Not Logged Into X
If the browser is not logged into X, or bird returns auth errors:
- Send a message to your employer: "I need to be logged into X to work. Please open the Browser tab and log into x.com."
- Reply HEARTBEAT_OK until this is resolved.
