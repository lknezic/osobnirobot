-- InstantWorker v6 Migration
-- Run in Supabase SQL Editor
-- Adds Stripe and plan management columns to profiles

-- Stripe integration columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Plan management (replaces old 'plan' column)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_status TEXT DEFAULT 'none';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS selected_plan TEXT;

-- Email column (used for Stripe customer creation and trial expiry emails)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Selected skills (JSON array of skill IDs)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS selected_skills JSONB DEFAULT '[]';

-- Worker config (niche, brand, targets, etc.)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS worker_config JSONB DEFAULT '{}';

-- Sync email from auth.users to profiles for existing users
UPDATE profiles
SET email = au.email
FROM auth.users au
WHERE profiles.id = au.id
  AND profiles.email IS NULL
  AND au.email IS NOT NULL;

-- Create trigger to auto-sync email on new signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists, then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Index for Stripe customer lookups (used in webhook for payment_failed)
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer
  ON profiles(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- Index for plan status queries (used in cron job)
CREATE INDEX IF NOT EXISTS idx_profiles_plan_status
  ON profiles(plan_status)
  WHERE plan_status IN ('trial', 'active', 'past_due');
