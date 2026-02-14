# OsobniRobot v3 — Setup Guide

## What's New in v3
- ✅ User authentication (magic link + Google OAuth)
- ✅ 3-step onboarding wizard (model → Telegram → plan)
- ✅ Full dashboard (bot status, messages, usage)
- ✅ Telegram bot integration (AI-powered responses)
- ✅ Stripe payments (subscriptions + 7-day trial)
- ✅ Workflow builder (natural language automation)
- ✅ Chat history
- ✅ Settings page (model, system prompt, API key)
- ✅ AI routing (Claude/GPT/Gemini)
- ✅ Rate limiting per plan
- ✅ Bilingual throughout (HR/EN)

---

## Step 1: Deploy Code (2 min)

```bash
cd ~/Downloads
rm -rf osobnirobot
tar xzf osobnirobot-v3-full.tar.gz
cd osobnirobot
npm install
git init && git branch -M main
git add . && git commit -m "v3: auth, dashboard, telegram bot, payments"
git remote add origin https://github.com/Lknezic/osobnirobot.git
git push -u origin main --force
```

Vercel auto-deploys. Wait ~40 seconds.

---

## Step 2: Run Database Migration (2 min)

Go to Supabase → SQL Editor → New Query.
Paste the contents of `supabase-migration-v2.sql` and click Run.

This creates: profiles, bots, workflows, messages tables.

---

## Step 3: Configure Supabase Auth (3 min)

1. Go to Supabase → Authentication → URL Configuration
2. Set **Site URL**: `https://osobnirobot.com`
3. Add **Redirect URLs**:
   - `https://osobnirobot.com/auth/callback`
   - `http://localhost:3000/auth/callback` (for local dev)

4. (Optional) Enable Google OAuth:
   - Go to Authentication → Providers → Google
   - Add your Google OAuth Client ID and Secret
   - (Get from https://console.cloud.google.com/apis/credentials)

---

## Step 4: Create Telegram Bot (1 min)

1. Open Telegram, search for **@BotFather**
2. Send: `/newbot`
3. Name: `OsobniRobot`
4. Username: `OsobniRobotBot` (or any available name)
5. Copy the **bot token** — looks like: `7123456789:AAFxxxxxxxxxxxxxxxxxxxxxxxx`

---

## Step 5: Set Up Stripe (5 min)

1. Go to https://dashboard.stripe.com
2. Get your **Secret Key** from Developers → API Keys
3. Create 4 monthly price products:
   - BYOK: $5/mo → note the `price_xxx` ID
   - Starter: $19/mo → note the `price_xxx` ID
   - Pro: $39/mo → note the `price_xxx` ID
   - Unlimited: $79/mo → note the `price_xxx` ID
4. Create setup fee products ($500 one-time) for Starter/Pro/Unlimited
5. Set up webhook:
   - Developers → Webhooks → Add endpoint
   - URL: `https://osobnirobot.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
   - Copy the **webhook signing secret**

Then update `lib/types.ts` with your real Stripe price IDs.

---

## Step 6: Get AI API Keys (2 min)

- **Anthropic (Claude)**: https://console.anthropic.com → API Keys
- **OpenAI (GPT)**: https://platform.openai.com → API Keys
- **Google (Gemini)**: https://aistudio.google.com → Get API Key

You need at least ONE for managed plans. BYOK users bring their own.

---

## Step 7: Add Environment Variables to Vercel (3 min)

Go to Vercel → osobnirobot → Settings → Environment Variables.
Add ALL of these:

```
NEXT_PUBLIC_SUPABASE_URL=https://dushtmeiznssbrissndm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your anon key>
SUPABASE_SERVICE_ROLE_KEY=<your service role key>
NEXT_PUBLIC_APP_URL=https://osobnirobot.com
TELEGRAM_BOT_TOKEN=<from BotFather>
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=OsobniRobotBot
TELEGRAM_SETUP_SECRET=<make up a random string>
STRIPE_SECRET_KEY=<from Stripe>
STRIPE_WEBHOOK_SECRET=<from Stripe webhook>
ANTHROPIC_API_KEY=<optional - for Claude plans>
OPENAI_API_KEY=<optional - for GPT plans>
GOOGLE_AI_API_KEY=<for Gemini plans - cheapest, start with this>
```

After adding, click **Redeploy** from Deployments page.

---

## Step 8: Register Telegram Webhook (30 sec)

After deploy, visit this URL in your browser:

```
https://osobnirobot.com/api/telegram/setup?secret=YOUR_TELEGRAM_SETUP_SECRET
```

Replace `YOUR_TELEGRAM_SETUP_SECRET` with the value you set in Vercel.
You should see: `{"webhookUrl":"...","telegram_response":{"ok":true}}`

---

## Step 9: Test End-to-End (5 min)

1. Go to https://osobnirobot.com
2. Click "Prijavi se" → Enter your email
3. Check email → Click magic link
4. Complete onboarding: choose model → connect Telegram → choose plan
5. Open Telegram → Find @OsobniRobotBot → Send a message
6. Bot should respond with AI!

---

## How to Send Me Your API Keys

When you wake up, start a new chat and say:
"Continue working on osobnirobot.com"

Then share the following (I need them to help debug):

1. **Telegram Bot Token**: from @BotFather
2. **Telegram Bot Username**: what you chose
3. **Stripe Secret Key**: sk_test_xxx or sk_live_xxx
4. **Stripe Webhook Secret**: whsec_xxx
5. **Stripe Price IDs**: for each of the 4 plans
6. **Google AI API Key**: for Gemini (cheapest to start)
7. **Anthropic API Key**: for Claude (optional)
8. **OpenAI API Key**: for GPT (optional)

⚠️ These are sensitive — after we set them up in Vercel, 
I won't store them. Share in the chat and I'll guide you 
through adding them to Vercel env vars.

---

## Architecture Overview

```
Landing Page (/) → Email waitlist
         ↓ "Sign up"
Login (/auth/login) → Magic link / Google
         ↓
Onboarding (/onboarding) → 3 steps
         ↓
Dashboard (/dashboard) → Bot status, history, workflows, settings
         
Telegram → /api/telegram/webhook → AI Router → Claude/GPT/Gemini → Telegram reply
                                      ↓
                              Supabase (messages, usage tracking)

Stripe → /api/stripe/webhook → Update plan status in Supabase
```

## File Structure

```
app/
  page.tsx              — Landing page
  layout.tsx            — Root layout + metadata
  globals.css           — Styles
  auth/
    login/page.tsx      — Login page
    callback/route.ts   — Auth redirect handler
  onboarding/page.tsx   — 3-step wizard
  dashboard/page.tsx    — Dashboard + tabs
  api/
    subscribe/route.ts  — Waitlist emails
    telegram/
      webhook/route.ts  — Telegram message handler
      setup/route.ts    — One-time webhook registration
    stripe/
      checkout/route.ts — Create payment session
      webhook/route.ts  — Handle payment events
lib/
  types.ts              — DB types + plan definitions
  translations.ts       — Landing page translations
  dash-translations.ts  — Dashboard translations
  ai-router.ts          — Claude/GPT/Gemini routing
  supabase.ts           — Supabase client (legacy)
  supabase-server.ts    — Server-side Supabase
  supabase-browser.ts   — Browser-side Supabase
middleware.ts           — Route protection
supabase-migration.sql  — v1 DB schema (waitlist)
supabase-migration-v2.sql — v2 DB schema (full app)
```
