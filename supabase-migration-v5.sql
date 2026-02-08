-- OsobniRobot v5 Migration
-- Run in Supabase SQL Editor
-- Adds container management columns to profiles

-- Add container columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS container_status TEXT DEFAULT 'none';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS container_gateway_port INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS container_novnc_port INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS container_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS assistant_name TEXT DEFAULT 'Asistent';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS assistant_personality TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'trial';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;

-- Container events log
CREATE TABLE IF NOT EXISTS container_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for looking up events by user
CREATE INDEX IF NOT EXISTS idx_container_events_user 
  ON container_events(user_id, created_at DESC);

-- Remove v4 columns if they exist (bot-related)
-- These are safe to run even if columns don't exist
DO $$ 
BEGIN
  -- Drop old bot-related columns that are no longer needed
  ALTER TABLE profiles DROP COLUMN IF EXISTS bot_id;
  ALTER TABLE profiles DROP COLUMN IF EXISTS api_key;
  ALTER TABLE profiles DROP COLUMN IF EXISTS model;
  ALTER TABLE profiles DROP COLUMN IF EXISTS onboarding_step;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Drop old bots table if it exists (v3/v4 artifact)
DROP TABLE IF EXISTS bots CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
