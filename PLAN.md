# InstantWorker — Complete Product Plan

## Implementation Order

### Phase A: Build (Steps 1-4)

| # | Item | Step | Status |
|---|------|------|--------|
| 1 | Landing page copy | Step 1 | DONE |
| 2 | Code architecture (types, hooks, API client) | Step 3-PRE | DONE |
| 3 | Database migration (employees table) | Step 3A | DONE |
| 4 | Multi-employee API (CRUD endpoints) | Step 3B | DONE |
| 5 | Infrastructure (DNS, Caddy, orchestrator, Docker) | Step 4 | DONE (was debugging, now fixed) |
| 6 | Orchestrator changes (employeeId naming, file/memory routes) | Step 3C | DONE |
| 7 | Onboarding updates ("Educate your employee", animation) | Step 2 | DONE (missing: localStorage persistence) |
| 8 | Dashboard refactor (TeamGrid, Workspace, HireModal) | Step 3D | DONE |
| 9 | Knowledge Base UI (settings tab, file upload) | Step 3E | DONE |
| 10 | Shared knowledge (Docker shared volume) | Step 3F | DONE |
| 11 | Learning loop templates (LEARNING-PROTOCOL.md) | Step 3G | DONE |
| 12 | Stripe changes (max_employees on checkout) | Step 3H | DONE |

### Phase A Sub-items Still Missing
- Step 2: localStorage progress persistence for onboarding
- Step 4.5: Container hardening (cap_drop, pids limit, no-new-privileges)
- Step 4.6: LiteLLM proxy (containers currently use API keys directly)

### Phase B: Pre-launch (Steps 5-7)

| # | Item | Step | Status |
|---|------|------|--------|
| 13 | End-to-end testing | Step 5 | NOT STARTED |
| 14 | Security audit | Step 6 | NOT STARTED |
| 15 | Monitoring setup | Step 7 | NOT STARTED |

### Phase C: Launch & Growth (Steps 8-10)

| # | Item | Step | Status |
|---|------|------|--------|
| 16 | Go live + marketing | Step 8 | NOT STARTED |
| 17 | Skill expansion | Step 9 | NOT STARTED |
| 18 | Advanced features | Step 10 | NOT STARTED |

## Current Blocker

End-to-end testing (Step 5) requires:
1. Orchestrator running (FIXED)
2. Container provisioning working (FIXED - added retry UI)
3. Chat iframe loading via *.gw.instantworker.ai
4. Browser iframe loading via *.vnc.instantworker.ai

Next action: Re-provision "Pulse" employee and verify the full flow works.
