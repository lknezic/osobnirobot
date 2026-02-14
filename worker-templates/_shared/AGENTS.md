# AGENTS.md — Model Routing & Cost Control

This file defines which AI model to use for which task. The LiteLLM proxy handles the actual routing — you reference model aliases here.

## Model Inventory

| Alias | Model | Cost/1K in | Cost/1K out | Use for |
|-------|-------|------------|-------------|---------|
| fast | gemini-2.0-flash | $0.00001 | $0.00004 | Heartbeat, reading, checking, routine scans |
| quality | claude-sonnet-4 | $0.003 | $0.015 | Writing, research, analysis, client conversations |
| premium | claude-opus-4.6 | $0.015 | $0.075 | Complex reasoning, strategy, difficult edge cases (rare) |

## Task Routing

| Task | Primary Model | Fallback | Max Tokens | Notes |
|------|--------------|----------|------------|-------|
| heartbeat-check | fast | — | 2000 | Quick scan of targets, minimal output |
| read-tweets | fast | — | 1000 | Parse timelines, extract relevant posts |
| write-comment | quality | fast | 500 | Needs brand voice accuracy |
| write-tweet | quality | fast | 500 | Original content, needs creativity |
| write-thread | quality | fast | 2000 | Multi-tweet, needs coherent flow |
| write-article | quality | fast | 4000 | Long-form, needs depth |
| research | quality | fast | 4000 | Analyzing competitors, trends |
| daily-summary | fast | — | 2000 | Summarize what happened today |
| first-boot-interview | quality | — | 8000 | Critical — sets up all client context |
| weekly-review | quality | fast | 3000 | Self-improvement analysis |
| content-approval | fast | — | 500 | Format content for approval queue |

## How to Use

When you're about to perform a task:
1. Identify which task type it matches from the table above
2. Use the **Primary Model** alias when making the API call
3. If the primary model fails or is slow, the proxy auto-falls back to the Fallback model
4. Stay within the Max Tokens limit for that task

**You don't need to specify models manually** — the LiteLLM proxy routes based on the alias you use. Just call the alias (fast/quality/premium) and the proxy handles the rest.

## Budget Guards

- **Daily ceiling:** $5.00 per worker
- **Weekly ceiling:** $25.00 per worker
- **Monthly runaway threshold:** $200.00 total across all workers
- **If daily ceiling hit:** Switch ALL tasks to `fast` model for the rest of the day
- **If ceiling hit 3 days in a row:** Alert the owner via Telegram (if connected)

## Cost Optimization Rules

1. **Default to `fast`** for any task that doesn't require creative writing
2. **Use `quality`** only when output will be seen by the employer's audience
3. **Never use `premium`** unless explicitly configured — it's 150x more expensive than `fast`
4. **Batch reads** — read multiple tweets/posts in a single API call rather than one at a time
5. **Cache context** — don't re-read docs/ files every heartbeat; cache them in your session memory
