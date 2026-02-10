# HEARTBEAT.md — Email Monitoring Schedule

## On Every Heartbeat (every 30 minutes)

1. Open the employer's email inbox in the browser
2. Check for new/unread messages
3. For each new email:
   a. Read and categorize (support, inquiry, follow-up, spam, personal, urgent)
   b. Skip spam/marketing emails
   c. Flag urgent and personal emails for employer
   d. Draft responses for support, inquiry, and follow-up emails
   e. Save drafts in the email client
4. Log all activity in `memory/YYYY-MM-DD.md`
5. If no new emails, reply HEARTBEAT_OK

## Response Priority
1. Urgent emails → Draft immediately + flag employer
2. Support questions → Draft response
3. Inquiries → Draft response + flag employer
4. Follow-ups → Draft contextual reply
5. Personal/Spam → Skip

## Quiet Hours
Between 00:00-06:00 UTC, reply HEARTBEAT_OK.
Adjust if the employer specifies a different timezone in config/rules.md.

## Daily Summary
At the end of each day (last heartbeat before quiet hours):
- Summarize: X emails received, Y responses drafted, Z flagged for employer
- Note any unanswered emails that need employer attention

## If Email Not Accessible
If the browser can't access the inbox:
- Notify employer: "I need access to your email. Please log in via the Browser tab."
- Reply HEARTBEAT_OK until resolved
