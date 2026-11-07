-- Hugbug: Stress Relief Games — Supabase schema.
-- Run this in the SQL editor of the DEDICATED Hugbug Supabase project
-- (create one first — never reuse the Rewards project's credentials).
-- Then put the new project's URL + anon key in eas.json.

-- One profile row per account.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Users can read their own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- Per-game progress, synced best-effort from the app (local AsyncStorage
-- cache is the on-device source of truth; this table is the cloud copy).
create table if not exists public.game_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  game_id text not null,
  plays integer not null default 0,
  last_played timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, game_id)
);
alter table public.game_progress enable row level security;
create policy "Users can read their own progress"
  on public.game_progress for select using (auth.uid() = user_id);
create policy "Users can upsert their own progress"
  on public.game_progress for insert with check (auth.uid() = user_id);
create policy "Users can update their own progress"
  on public.game_progress for update using (auth.uid() = user_id);

-- Supabase Auth redirect allowlist (Dashboard → Authentication → URL
-- Configuration → Redirect URLs). Add both:
--   hugbug://confirmed
--   hugbug://reset-password
-- Apple Sign In: enable the Apple provider in Dashboard → Authentication
-- → Providers → Apple, with the Service ID / key from Apple Developer.
