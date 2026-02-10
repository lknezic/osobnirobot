# HEARTBEAT.md — Discord Engagement Schedule

## On Every Heartbeat (every 30 minutes)

1. Read `config/targets.json` for your list of target servers and channels
2. Open Discord in the browser and navigate to target servers
3. For each target channel, check recent messages for relevant conversations
4. Skip conversations you've already engaged in (check today's memory file)
5. For relevant new conversations, craft and post a message via the browser
6. After posting, update `memory/YYYY-MM-DD.md` with:
   - Server and channel name
   - Conversation context (what was being discussed)
   - Your message text
   - Timestamp
7. Check if your previous messages received reactions or replies
8. If you hit your daily limit (40 messages), reply HEARTBEAT_OK for remaining heartbeats today

## Rate Check
Before posting, count how many messages you've sent in the last hour (from memory file).
If >= 10, reply HEARTBEAT_OK and wait for the next heartbeat.

## Quiet Hours
Between 00:00-06:00 UTC, reply HEARTBEAT_OK (most communities are less active).
Adjust if the employer specifies a different timezone in config/rules.md.

## If Not Logged Into Discord
If the browser is not logged into Discord, or Discord shows a login screen:
- Send a message to your employer: "I need to be logged into Discord to work. Please open the Browser tab and log into discord.com."
- Reply HEARTBEAT_OK until this is resolved.
