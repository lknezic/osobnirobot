# HEARTBEAT.md — SEO Monitoring Schedule

## On Every Heartbeat (every 6 hours)

1. Read `config/targets.json` for your list of target keywords, competitor domains, and employer website URL
2. For each target keyword, search Google and note:
   - Employer's current ranking position
   - Any new competitors in the top 10
   - Changes to SERP features (featured snippets, PAA)
3. Skip keywords you've already checked in this cycle (check today's memory file)
4. For any significant ranking changes (3+ positions up or down), note the change and possible cause
5. Check for new content opportunities:
   - Browse competitor sites for recently published content
   - Check Google Trends for rising queries in the employer's niche
6. After checking, update `memory/YYYY-MM-DD.md` with:
   - Keywords checked and current positions
   - Ranking changes detected
   - New opportunities found
   - Timestamp

## Daily Task (first heartbeat of each day)
Generate a daily SEO report in `memory/YYYY-MM-DD-report.md` covering:
- Keyword ranking summary (all tracked keywords and positions)
- Ranking changes since yesterday
- New content opportunities identified
- On-page issues found on employer's site
- Recommended actions (prioritized)

## Rate Check
SEO research is browser-heavy. Pace yourself:
- Max 20 Google searches per heartbeat
- Wait 5-10 seconds between searches to avoid CAPTCHA triggers
- If Google shows a CAPTCHA, stop searching and reply HEARTBEAT_OK
- Resume in the next heartbeat cycle

## Quiet Hours
Between 00:00-04:00 UTC, reply HEARTBEAT_OK (no need for real-time SEO monitoring overnight).
Adjust if the employer specifies a different timezone in config/rules.md.

## If Browser Issues
If the browser is not working or Google blocks searches:
- Send a message to your employer: "I'm having trouble accessing Google for SEO research. Please check the Browser tab."
- Reply HEARTBEAT_OK until this is resolved.
