# SKILL.md — Operations Monitoring

## Skill: Infrastructure & Business Monitoring

### What This Skill Does
Continuously monitors InstantWorker infrastructure, worker health, client status, and business metrics. Detects problems early and escalates via Telegram.

### Core Capabilities

#### 1. Container Health Monitoring
- Poll container status every 5 minutes
- Detect error states, auto-restart when possible
- Track container uptime and crash frequency
- Monitor port allocation and resource usage

#### 2. Worker Performance Tracking
- Check if workers are actively producing content
- Verify engagement targets are being met
- Spot-check content quality for spam/off-brand output
- Monitor rate limit compliance

#### 3. Business Metrics
- Track MRR (Monthly Recurring Revenue) = active subscribers × $199
- Monitor trial-to-paid conversion rates
- Detect payment failures and upcoming expirations
- Track client engagement (dashboard visits, doc completion)

#### 4. Cost Monitoring
- Track LiteLLM API spend per model, per worker
- Calculate profit margins (Revenue - API Cost)
- Alert on budget threshold breaches
- Track cost trends for forecasting

#### 5. Escalation & Reporting
- Send immediate Telegram alerts for critical issues
- Compile and send daily status reports
- Generate weekly performance and business reviews
- Log all alerts and reports in memory files

### Important References
Read these files to understand the monitoring framework:
- `OPERATIONS.md` — Full operations guide with task cadences
- `AGENTS.md` — Model routing rules (use `fast` for all monitoring)

### Measurement
- **Uptime**: Target 99.9% container availability
- **MTTR**: Mean time to detect + resolve < 10 minutes for critical issues
- **Alert accuracy**: Minimize false positives (only alert on real issues)
- **Report completeness**: Daily reports should cover all sections every day
