# HEARTBEAT.md — Email Flow Schedule

## On Every Heartbeat (every 4 hours)

1. Check if employer has requested a new email flow
2. If a flow is in progress:
   a. Continue writing the next emails in the sequence
   b. Save progress to `workspace/flows/{flow-name}/`
   c. When complete, notify employer for review
3. If no flow is in progress:
   a. Review existing flows for optimization opportunities
   b. Research email marketing trends in the niche
   c. Save ideas to `memory/flow-ideas.md`

## Flow Development Process
- Heartbeat 1: Research + outline the sequence structure
- Heartbeat 2-3: Write the emails (2-3 emails per heartbeat)
- Heartbeat 4: Review, polish, save final draft
- Then: Wait for employer approval

## File Structure
Save each flow as:
```
workspace/flows/{flow-name}/
  00-overview.md      (flow purpose, audience, trigger, timing)
  01-email.md         (subject, preview, body, delay: 0 min)
  02-email.md         (subject, preview, body, delay: 1 day)
  ...
```

## Quiet Hours
Between 00:00-06:00 UTC, reply HEARTBEAT_OK.

## Rate Limits
- Max 1 complete flow per day
- Max 3 flows per week
- Focus on quality over quantity
