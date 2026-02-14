# Step 5 Plan: Testing + Skill Upgrades + Editable Knowledge

## Overview

Step 5 combines three things:
1. **Editable Knowledge Documents** — Users can view/edit documents the agent creates (company info, competitors, product, etc.)
2. **Skill Template Upgrades** — Each skill gets clean, focused files from the user
3. **E2E Testing** — Verify the complete flow works

---

## Part 1: Editable Knowledge Documents

### Problem
Currently the Settings tab has:
- "What employee knows" — READ-ONLY (4 memory files from container)
- "Reference files" — Upload/delete only
- No way to edit company info, competitors, or product details after onboarding

### Solution
Add **editable document cards** in the Settings tab. These are markdown files inside the container that:
- The agent reads and uses for context
- The user can view and edit directly in the dashboard
- Live at `/home/node/.openclaw/workspace/docs/` inside the container

### Documents (user-facing, editable)
| Document | File in container | Purpose |
|----------|------------------|---------|
| About My Company | `docs/company.md` | Company description, mission, URL, industry |
| Competitors | `docs/competitors.md` | Competitor names, URLs, strengths/weaknesses |
| Target Audience | `docs/audience.md` | Customer personas, pain points, demographics |
| Product / Service | `docs/product.md` | What the company sells, features, pricing |
| Brand Voice | `docs/brand-voice.md` | Tone, style, dos and don'ts |
| Custom Instructions | `docs/instructions.md` | Free-form instructions for the agent |

### Code Changes

#### 1. Orchestrator: Add read/write docs endpoints
**File**: `app/orchestrator/src/routes.ts`
- `GET /api/containers/docs/:id` — List all docs with content
- `GET /api/containers/docs/:id/:filename` — Read single doc
- `PUT /api/containers/docs/:id/:filename` — Write/update single doc (body: { content: string })
- Uses existing `readContainerFile` + new `writeContainerFile` helper

#### 2. API routes: Proxy docs endpoints
**File**: `app/api/employees/[id]/docs/route.ts` (NEW)
- `GET` — List all docs
- Auth + ownership check

**File**: `app/api/employees/[id]/docs/[filename]/route.ts` (NEW)
- `GET` — Read single doc
- `PUT` — Update single doc

#### 3. Client API: Add docs functions
**File**: `lib/api/employees.ts`
- `getDocs(employeeId)` — fetch all docs
- `getDoc(employeeId, filename)` — fetch single doc
- `updateDoc(employeeId, filename, content)` — save doc

#### 4. Dashboard UI: Editable docs in Settings tab
**File**: `app/dashboard/components/KnowledgeBase.tsx`
- Add "Your Documents" section between knowledge and reference files
- Each doc shown as a card with:
  - Title + description
  - Preview of content (first 3 lines)
  - "Edit" button → opens inline editor (textarea)
  - "Save" button → calls updateDoc API
  - Auto-creates with template content if doesn't exist yet
- Simple markdown textarea (no rich editor needed)

#### 5. Provision: Seed default doc templates
**File**: `app/orchestrator/src/routes.ts` (buildWorkspace function)
- Create `docs/` directory in workspace
- Seed each doc with a template (e.g., "# About My Company\n\nDescribe your company here...")
- Agent reads these + user edits them over time

### Document Templates (seeded on provision)

```markdown
# About My Company
<!-- Edit this to help your employee understand your business -->

**Company Name**:
**Website**:
**Industry**:
**What we do**:

## Mission
What is your company's mission?

## Key Facts
- Founded:
- Team size:
- Location:
```

(Similar templates for each document)

---

## Part 2: Skill Template Upgrades

### Current State
16 skill directories exist with SOUL.md, HEARTBEAT.md, SKILL.md, config/, reference/. These are "private" — provided by us, not editable by users.

### What Changes
- User will provide upgraded skill files for each skill
- Each skill should ONLY include:
  - Instructions specific to that skill (e.g., X article writing technique)
  - Platform guide (e.g., how to use X effectively)
- Generic knowledge (competitors, product, brand) moves to the editable docs (Part 1)
- Skill templates should REFERENCE the docs directory for company context

### Process
For each of the 16 skills:
1. User sends updated SOUL.md, SKILL.md, HEARTBEAT.md
2. I replace the files in `worker-templates/{skill}/`
3. Update any template variables if needed
4. Verify the skill references `workspace/docs/` for company context

### Skills to Upgrade (user provides files)
- [ ] x-commenter
- [ ] x-article-writer
- [ ] x-thread-writer
- [ ] reddit-commenter
- [ ] email-newsletter
- [ ] email-flow
- [ ] email-responder
- [ ] yt-shorts-script
- [ ] yt-long-script
- [ ] yt-community
- [ ] instagram-content
- [ ] tiktok-content
- [ ] facebook-group
- [ ] discord-engagement
- [ ] seo-optimization

### Shared Files to Update
- `_shared/LEARNING-PROTOCOL.md` — Add reference to `workspace/docs/` directory
- `_shared/reference/WORKER-GUIDE.md` — Update to mention editable docs

---

## Part 3: E2E Testing

After Parts 1 and 2, test the complete flow:

### 5.1 Core Flow
- [ ] Land on website, sign up
- [ ] Complete onboarding (plan → skill → business info → launch)
- [ ] Watch provisioning animation
- [ ] Enter dashboard, see employee card
- [ ] Open Chat — agent responds, references company docs
- [ ] Open Browser — see virtual desktop
- [ ] Open Settings — see knowledge + editable docs + reference files

### 5.2 Editable Docs
- [ ] Docs show with template content after provision
- [ ] Edit "About My Company" and save
- [ ] Agent reads updated company info in next interaction
- [ ] All 6 doc types work (view, edit, save)

### 5.3 Multi-employee
- [ ] Hire second employee, verify shared knowledge
- [ ] Test plan limits (Junior can't hire >1)
- [ ] Fire employee flow

### 5.4 Edge Cases
- [ ] User leaves mid-onboarding, resumes later
- [ ] Container crashes, auto-restart
- [ ] Expired trial blocks dashboard

---

## Implementation Order

1. **Orchestrator**: writeContainerFile helper + docs endpoints (30 min)
2. **API routes**: docs proxy endpoints (20 min)
3. **Client API**: docs functions (10 min)
4. **Dashboard UI**: editable docs section in KnowledgeBase (40 min)
5. **Provision**: seed doc templates in buildWorkspace (20 min)
6. **Shared templates**: update LEARNING-PROTOCOL + WORKER-GUIDE to reference docs/ (10 min)
7. **Deploy & test**: rebuild orchestrator, test E2E (20 min)
8. **Skill upgrades**: replace skill files as user provides them (per skill)
