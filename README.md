# OsobniRobot.com

Pre-launch landing page for OsobniRobot — one-click OpenClaw deployment for Croatian entrepreneurs.

## Quick Deploy (5 minutes)

### 1. Create GitHub repo & push

```bash
cd osobnirobot
git init
git add .
git commit -m "Initial: bilingual landing page + Supabase email collection"
git remote add origin https://github.com/Lknezic/osobnirobot.git
git push -u origin main
```

### 2. Create Supabase table

Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/dushtmeiznssbrissndm/sql) and run the contents of `supabase-migration.sql`.

### 3. Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the `osobnirobot` repo from GitHub
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://dushtmeiznssbrissndm.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (your anon key)
   - `SUPABASE_SERVICE_ROLE_KEY` = (your service role key)
4. Deploy

### 4. Connect domain

1. In Vercel dashboard → Settings → Domains → Add `osobnirobot.com`
2. In Cloudflare DNS → Add CNAME record pointing to `cname.vercel-dns.com`
3. Wait 1-2 min for propagation

### Done! 🎉

Site is live at https://osobnirobot.com

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS**
- **Supabase** (PostgreSQL + RLS)
- **Vercel** (hosting)

## Features

- Bilingual (Croatian / English) with auto-detection
- Model selection (Claude, GPT, Gemini)
- Channel selection (Telegram, Discord coming soon, WhatsApp coming soon)
- 4-tier pricing display (BYOK $5, Starter $19, Pro $39, Unlimited $79)
- Pain point section with real quotes from OpenClaw users
- Traditional vs OsobniRobot comparison
- Marquee use cases
- Email collection → Supabase with rate limiting
- Responsive, dark theme, animated
