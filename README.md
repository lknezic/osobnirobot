# InstantWorker

AI employee marketplace. Hire 24/7 AI workers that get their own computer, browser, and memory. Each worker focuses on one social media channel and runs all skills for that channel autonomously.

## Architecture

- **Frontend**: Next.js 14 (App Router, TypeScript) on Vercel
- **Backend**: Docker containers on Hetzner, managed by orchestrator service
- **Database**: Supabase (auth + PostgreSQL)
- **Payments**: Stripe ($199/worker/month)
- **AI Runtime**: OpenClaw per container + LiteLLM proxy

## Current State

- Live at instantworker.ai
- 1 channel active: X/Twitter (4 skills: commenter, tweet-writer, thread-writer, article-writer)
- Future channels: Reddit, YouTube, Instagram, TikTok, Email, Discord, LinkedIn

## Project Structure

```
app/                    Next.js pages, API routes, dashboard components
app/orchestrator/       Separate orchestrator service (Hetzner)
app/docker/             Container Dockerfile + entrypoint
lib/                    Shared libraries (DB, API, types, constants)
worker-templates/       SOUL.md, SKILL.md, playbooks, docs, memory per skill
infra/                  Caddy, LiteLLM, deploy scripts
docs/                   Project documentation (archive/ for old docs)
```

## Key Docs

- `CLAUDE.md` — Project instructions for Claude sessions
- `MEMORY.md` — Current project state and handoff
- `PLAN.md` — Product roadmap and progress tracker
- `OPERATIONS.md` — Owner operations guide

## Setup

See `MEMORY.md` for environment variables and server commands.
