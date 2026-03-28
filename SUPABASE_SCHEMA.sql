-- ============================================================
-- SkillSwap Database Schema
-- Run this in: supabase.com > your project > SQL Editor > New Query > Run
-- ============================================================


-- ============================================================
-- PROFILES TABLE
-- Stores extra user data (phone, terms agreement, admin flag)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT CHECK (char_length(full_name) <= 100),
  phone TEXT CHECK (char_length(phone) <= 30),
  agreed_to_terms BOOLEAN DEFAULT FALSE,
  agreed_at TIMESTAMPTZ,
  is_admin BOOLEAN DEFAULT FALSE,
  is_student BOOLEAN DEFAULT FALSE,
  referred_by TEXT CHECK (char_length(referred_by) <= 100),
  -- Stripe subscription fields
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'student', 'plus', 'elite')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow Supabase service role (used by webhook) to update subscription fields
-- (The service role bypasses RLS by default — no extra policy needed)

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);


-- ============================================================
-- LISTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL CHECK (char_length(user_name) <= 100),
  offering TEXT NOT NULL CHECK (char_length(offering) <= 300),
  wanting TEXT NOT NULL CHECK (char_length(wanting) <= 300),
  category TEXT DEFAULT 'Other' CHECK (category IN ('Finance','Design','Health','Education','Tech','Home','Marketing','Writing','Music','Other')),
  bio TEXT CHECK (char_length(bio) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view listings"
  ON listings FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own listings"
  ON listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own listings"
  ON listings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own listings"
  ON listings FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================================
-- AUTO-CREATE PROFILE ON NEW USER SIGNUP
-- Fires every time a new user registers
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ============================================================
-- LISTING VIEWS TABLE
-- Tracks how many times each listing has been viewed/shared
-- ============================================================
CREATE TABLE IF NOT EXISTS listing_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE listing_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert a view"
  ON listing_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read view counts"
  ON listing_views FOR SELECT
  USING (true);


-- ============================================================
-- ADMIN ACCESS
-- After running this schema, run this ONE extra query
-- (replace YOUR_EMAIL with your actual email):
--
-- UPDATE profiles
-- SET is_admin = TRUE
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL');
--
-- Your Supabase dashboard IS your admin panel for now:
--   Authentication > Users = see all users + emails
--   Table Editor > profiles = see phone numbers + terms agreements
--   Table Editor > listings = see + delete any listing
-- ============================================================
