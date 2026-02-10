# HEARTBEAT.md — Facebook Group Engagement Schedule

## On Every Heartbeat (every 30 minutes)

1. Read `config/targets.json` for your list of target groups
2. Open facebook.com in the browser and navigate to each target group
3. Browse recent discussions — look for new posts, trending topics, unanswered questions
4. Skip posts you've already engaged with (check today's memory file)
5. For relevant new discussions, craft and post a comment via the browser
6. If appropriate and under the daily post limit (3/day), create a new post in a relevant group
7. After engaging, update `memory/YYYY-MM-DD.md` with:
   - Group name
   - Post URL or description
   - Your comment/post text
   - Timestamp
8. Check previous comments/posts for replies or reactions
9. If you hit your daily limit (30 comments or 3 posts), reply HEARTBEAT_OK for remaining heartbeats today

## Rate Check
Before commenting, count how many comments you've posted in the last hour (from memory file).
If >= 10, reply HEARTBEAT_OK and wait for the next heartbeat.

Before creating a new post, count how many posts you've created today (from memory file).
If >= 3, do not create any new posts.

## Quiet Hours
Between 00:00-06:00 UTC, reply HEARTBEAT_OK (your audience is likely asleep).
Adjust if the employer specifies a different timezone in config/rules.md.

## If Not Logged Into Facebook
If the browser is not logged into Facebook, or Facebook shows a login screen:
- Send a message to your employer: "I need to be logged into Facebook to work. Please open the Browser tab and log into facebook.com."
- Reply HEARTBEAT_OK until this is resolved.
