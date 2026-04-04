-- Free Swap Promo and Referral Bonus System Migration
-- Adds free swap tracking and referral bonus functionality to SkillSwap

-- Add free_swaps_remaining column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS free_swaps_remaining INTEGER DEFAULT 1;

-- Add referred_by_user_id for referral tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create swaps transaction table with full RLS
CREATE TABLE IF NOT EXISTS swaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  initiator_skill TEXT NOT NULL,
  target_skill TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  is_free BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on swaps table
ALTER TABLE swaps ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can SELECT their own swaps
CREATE POLICY "users_select_own_swaps" ON swaps
  FOR SELECT
  USING (auth.uid() = initiator_id OR auth.uid() = target_id);

-- RLS Policy: Users can INSERT their own swaps
CREATE POLICY "users_insert_own_swaps" ON swaps
  FOR INSERT
  WITH CHECK (auth.uid() = initiator_id);

-- RLS Policy: Initiator and target can UPDATE their swaps
CREATE POLICY "users_update_own_swaps" ON swaps
  FOR UPDATE
  USING (auth.uid() = initiator_id OR auth.uid() = target_id)
  WITH CHECK (auth.uid() = initiator_id OR auth.uid() = target_id);

-- Create RPC function to decrement free swaps
CREATE OR REPLACE FUNCTION decrement_free_swaps(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET free_swaps_remaining = GREATEST(0, free_swaps_remaining - 1)
  WHERE id = user_id;
END;
$$;

-- Create RPC function to grant referral bonus
CREATE OR REPLACE FUNCTION grant_referral_bonus(referrer_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET free_swaps_remaining = free_swaps_remaining + 2
  WHERE id = referrer_id;
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS swaps_initiator_id_idx ON swaps(initiator_id);
CREATE INDEX IF NOT EXISTS swaps_target_id_idx ON swaps(target_id);
CREATE INDEX IF NOT EXISTS swaps_created_at_idx ON swaps(created_at);
CREATE INDEX IF NOT EXISTS profiles_referred_by_idx ON profiles(referred_by_user_id);
