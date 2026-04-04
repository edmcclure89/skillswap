-- ============================================================
-- SECURITY MIGRATION — Run in Supabase SQL Editor
-- Fixes: CRIT-2 (profiles PII exposure) + HIGH-5 (listing_views flood)
-- Generated: 2026-04-02
-- ============================================================

-- ============================================================
-- STEP 1: Lock down the profiles table SELECT policy
-- Before: Anyone on the internet could read all user PII
-- After:  Users can only read their own profile
-- ============================================================

DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);


-- ============================================================
-- STEP 2: Create a public-safe view for display purposes
-- This exposes ONLY non-sensitive columns to anonymous visitors
-- so the main listings page still works without requiring login
-- ============================================================

DROP VIEW IF EXISTS public_profiles;

CREATE VIEW public_profiles AS
  SELECT
    id,
    full_name,
    primary_skill,
    seeking_skill,
    bio,
    created_at
  FROM profiles;

-- Grant anon and authenticated roles read access to the view
GRANT SELECT ON public_profiles TO anon;
GRANT SELECT ON public_profiles TO authenticated;


-- ============================================================
-- STEP 3: Fix listing_views INSERT policy
-- Before: Anyone (including unauthenticated bots) could insert unlimited rows
-- After:  Only logged-in users can record a view
-- ============================================================

DROP POLICY IF EXISTS "Anyone can insert a view" ON listing_views;

CREATE POLICY "Authenticated users can insert a view"
  ON listing_views FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);


-- ============================================================
-- AFTER RUNNING THIS MIGRATION:
-- Update App.jsx to query 'public_profiles' instead of 'profiles'
-- (already done in source — this SQL makes the DB match the code)
-- ============================================================
