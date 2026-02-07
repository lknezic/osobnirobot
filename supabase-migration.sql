-- Run this in Supabase SQL Editor
-- Step 1.2: Create waitlist table

CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  selected_model TEXT,
  selected_channel TEXT,
  selected_plan TEXT,
  language TEXT DEFAULT 'hr',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Allow anonymous inserts only (no select/update/delete)
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts" ON public.waitlist
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON public.waitlist (email);
CREATE INDEX IF NOT EXISTS idx_waitlist_created ON public.waitlist (created_at DESC);
