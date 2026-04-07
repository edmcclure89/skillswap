-- ============================================================
-- SkillSwap MVP Migration
-- Tables: profiles, listings, transactions
-- RLS: anon can read listings; authenticated users own their data
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

-- ──────────────────────────────────────────
-- EXTENSIONS
-- ──────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ──────────────────────────────────────────
-- ENUMS
-- ──────────────────────────────────────────
do $$ begin
  create type listing_status as enum ('available', 'sold');
exception when duplicate_object then null;
end $$;

-- ──────────────────────────────────────────
-- TABLE: profiles
-- Mirrors auth.users — created automatically on signup
-- ──────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique,
  full_name   text,
  avatar_url  text,
  bio         text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Anyone can view profiles
create policy "profiles: public read"
  on public.profiles for select
  using (true);

-- Users can only insert their own profile
create policy "profiles: insert own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Users can only update their own profile
create policy "profiles: update own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create profile on new user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ──────────────────────────────────────────
-- TABLE: listings
-- ──────────────────────────────────────────
create table if not exists public.listings (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  description text,
  price       numeric(10, 2) not null check (price >= 0),
  status      listing_status not null default 'available',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.listings enable row level security;

-- Anyone (including anon) can read all listings
create policy "listings: public read"
  on public.listings for select
  using (true);

-- Authenticated users can create listings for themselves only
create policy "listings: insert own"
  on public.listings for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Authenticated users can update their own listings only
create policy "listings: update own"
  on public.listings for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Authenticated users can delete their own listings only
create policy "listings: delete own"
  on public.listings for delete
  to authenticated
  using (auth.uid() = user_id);

-- ──────────────────────────────────────────
-- TABLE: transactions
-- Written by the webhook via service_role key (bypasses RLS)
-- ──────────────────────────────────────────
create table if not exists public.transactions (
  id                uuid primary key default uuid_generate_v4(),
  listing_id        uuid not null references public.listings(id) on delete restrict,
  buyer_id          uuid references public.profiles(id) on delete set null,
  stripe_session_id text unique not null,
  amount            numeric(10, 2) not null check (amount >= 0),
  created_at        timestamptz not null default now()
);

alter table public.transactions enable row level security;

-- Buyers can see their own transactions
create policy "transactions: buyer read own"
  on public.transactions for select
  to authenticated
  using (auth.uid() = buyer_id);

-- Sellers can see transactions on their listings
create policy "transactions: seller read own"
  on public.transactions for select
  to authenticated
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.user_id = auth.uid()
    )
  );

-- No direct insert from client — webhook uses service_role which bypasses RLS
-- (service_role key is never exposed to the browser)

-- ──────────────────────────────────────────
-- UPDATED_AT trigger (shared)
-- ──────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_listings_updated_at on public.listings;
create trigger set_listings_updated_at
  before update on public.listings
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ──────────────────────────────────────────
-- INDEXES
-- ──────────────────────────────────────────
create index if not exists idx_listings_user_id on public.listings(user_id);
create index if not exists idx_listings_status  on public.listings(status);
create index if not exists idx_transactions_listing_id on public.transactions(listing_id);
create index if not exists idx_transactions_buyer_id   on public.transactions(buyer_id);
create index if not exists idx_transactions_stripe_session on public.transactions(stripe_session_id);
