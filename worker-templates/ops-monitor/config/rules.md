# Ops Monitor Configuration

## Alert Thresholds

### Critical (immediate Telegram alert)
- Container in error state: > 5 minutes
- Orchestrator unreachable: > 2 consecutive checks
- Payment failure: any active subscriber
- Worker X account restricted: immediately

### High (within 1 hour)
- Worker silent: > 4 hours during work hours
- Trial expiring: < 3 days with active workers
- Daily budget: > 80% of $5/worker ceiling
- New signup: no onboarding completion in 24 hours

### Medium (daily report)
- Worker underperforming: < 50% of daily target
- Client inactive: > 7 days no dashboard visit
- Knowledge docs empty: client hasn't filled docs
- Minor infrastructure warnings

## Admin Contact
- Telegram: Will be configured after bot setup
- Email: contact@lukaknezic.com

## Monitoring Endpoints
- Admin overview: /api/admin/overview
- Admin health: /api/admin/health
- Admin scaling: /api/admin/scaling
- Admin usage: /api/admin/usage
- Admin clients: /api/admin/clients
- Improvements: /api/improvements

## Report Schedule
- Daily report: 08:00 CET
- Weekly report: Monday 08:00 CET
- Instant alerts: 24/7

## Budget Guards
- Daily ceiling per worker: $5.00
- Weekly ceiling per worker: $25.00
- Monthly runaway threshold: $200.00
- Ops monitor cost target: < $0.50/day (uses fast model only)
