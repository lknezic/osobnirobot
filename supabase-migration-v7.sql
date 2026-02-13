-- InstantWorker v7 Migration
-- Run in Supabase SQL Editor
-- Creates employees table for multi-employee support

-- 1. Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  personality TEXT DEFAULT '',
  skills JSONB DEFAULT '[]',
  worker_type TEXT DEFAULT 'x-article-writer',
  worker_config JSONB DEFAULT '{}',
  container_status TEXT DEFAULT 'none',
  container_gateway_port INTEGER,
  container_novnc_port INTEGER,
  container_token TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  sort_order INTEGER DEFAULT 0
);

-- 2. Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_employees_user ON employees(user_id);

-- 3. Add max_employees to profiles (plan-based limit)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS max_employees INTEGER DEFAULT 1;

-- 4. RLS policies for employees table
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Users can read their own employees (via anon key)
CREATE POLICY employees_select_own ON employees
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can do everything (API routes use service role)
-- No policy needed: service role bypasses RLS

-- 5. Migrate existing users: create employee rows from profiles
-- Only for users who have completed onboarding and have a running/provisioned container
INSERT INTO employees (user_id, name, personality, skills, worker_type, worker_config, container_status, container_gateway_port, container_novnc_port, container_token, sort_order)
SELECT
  p.id,
  COALESCE(p.assistant_name, 'Worker'),
  COALESCE(p.assistant_personality, ''),
  COALESCE(p.selected_skills, '["x-article-writer"]')::JSONB,
  'x-article-writer',
  COALESCE(p.worker_config, '{}')::JSONB,
  COALESCE(p.container_status, 'none'),
  p.container_gateway_port,
  p.container_novnc_port,
  p.container_token,
  0
FROM profiles p
WHERE p.onboarding_completed = TRUE
  AND NOT EXISTS (SELECT 1 FROM employees e WHERE e.user_id = p.id);
